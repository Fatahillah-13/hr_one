<?php

namespace App\Services;

use App\Exceptions\SsoException;
use App\Models\App;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use JsonException;

class SsoJwtService
{
    public function issue(User $user, App $app): array
    {
        $now = Carbon::now();
        $expiresAt = $now->copy()->addSeconds(config('sso.jwt_ttl', 300));

        $payload = [
            'iss' => config('sso.issuer'),
            'aud' => $app->sso_client_id,
            'sub' => (string) $user->getKey(),
            'jti' => (string) Str::uuid(),
            'iat' => $now->timestamp,
            'nbf' => $now->timestamp,
            'exp' => $expiresAt->timestamp,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'role_id' => $user->role_id,
            'division_id' => $user->division_id,
            'is_active' => (bool) $user->is_active,
        ];

        return [
            'access_token' => $this->encode($payload),
            'token_type' => 'Bearer',
            'expires_in' => $expiresAt->diffInSeconds($now),
            'user' => Arr::only($payload, [
                'sub',
                'username',
                'name',
                'email',
                'role_id',
                'division_id',
                'is_active',
            ]),
        ];
    }

    public function encode(array $payload): string
    {
        $segments = [
            $this->base64UrlEncode($this->jsonEncode(['alg' => 'RS256', 'typ' => 'JWT'])),
            $this->base64UrlEncode($this->jsonEncode($payload)),
        ];

        $signingInput = implode('.', $segments);
        $privateKey = $this->resolvePrivateKey();

        if (! openssl_sign($signingInput, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
            throw new SsoException('Failed to sign SSO token.', 500);
        }

        return $signingInput.'.'.$this->base64UrlEncode($signature);
    }

    public function verify(string $token, ?string $expectedAudience = null): array
    {
        $segments = explode('.', $token);

        if (count($segments) !== 3) {
            throw new SsoException('Malformed SSO token.', 422);
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $segments;
        $header = $this->jsonDecode($this->base64UrlDecode($encodedHeader));
        $payload = $this->jsonDecode($this->base64UrlDecode($encodedPayload));
        $signature = $this->base64UrlDecode($encodedSignature);

        if (($header['alg'] ?? null) !== 'RS256') {
            throw new SsoException('Unsupported SSO token algorithm.', 422);
        }

        $publicKey = $this->resolvePublicKey();
        $verified = openssl_verify(
            $encodedHeader.'.'.$encodedPayload,
            $signature,
            $publicKey,
            OPENSSL_ALGO_SHA256,
        );

        if ($verified !== 1) {
            throw new SsoException('Invalid SSO token signature.', 401);
        }

        $now = Carbon::now()->timestamp;
        $nbf = (int) ($payload['nbf'] ?? 0);
        $exp = (int) ($payload['exp'] ?? 0);

        if (($payload['iss'] ?? null) !== config('sso.issuer')) {
            throw new SsoException('Invalid SSO token issuer.', 401);
        }

        if ($expectedAudience !== null && ($payload['aud'] ?? null) !== $expectedAudience) {
            throw new SsoException('Invalid SSO token audience.', 401);
        }

        if ($nbf > $now || $exp < $now) {
            throw new SsoException('Expired or inactive SSO token.', 401);
        }

        return $payload;
    }

    protected function resolvePrivateKey()
    {
        $key = openssl_pkey_get_private($this->loadKey('private'));

        if ($key === false) {
            throw new SsoException('SSO private key is not configured correctly.', 500);
        }

        return $key;
    }

    protected function resolvePublicKey()
    {
        $key = openssl_pkey_get_public($this->loadKey('public'));

        if ($key === false) {
            throw new SsoException('SSO public key is not configured correctly.', 500);
        }

        return $key;
    }

    protected function loadKey(string $type): string
    {
        $inlineKey = config("sso.{$type}_key");
        $keyPath = config("sso.{$type}_key_path");

        if (is_string($inlineKey) && trim($inlineKey) !== '') {
            return str_replace('\n', PHP_EOL, $inlineKey);
        }

        if (is_string($keyPath) && trim($keyPath) !== '') {
            $absolutePath = base_path($keyPath);

            if (! File::exists($absolutePath)) {
                throw new SsoException("SSO {$type} key file was not found.", 500);
            }

            return File::get($absolutePath);
        }

        throw new SsoException("SSO {$type} key is not configured.", 500);
    }

    protected function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    protected function base64UrlDecode(string $value): string
    {
        $padding = strlen($value) % 4;

        if ($padding > 0) {
            $value .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        if ($decoded === false) {
            throw new SsoException('Invalid base64url payload.', 422);
        }

        return $decoded;
    }

    protected function jsonEncode(array $payload): string
    {
        try {
            return json_encode($payload, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new SsoException('Unable to encode SSO token payload.', 500);
        }
    }

    protected function jsonDecode(string $payload): array
    {
        try {
            $decoded = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new SsoException('Unable to decode SSO token payload.', 422);
        }

        if (! is_array($decoded)) {
            throw new SsoException('Invalid SSO token payload.', 422);
        }

        return $decoded;
    }
}
