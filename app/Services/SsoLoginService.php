<?php

namespace App\Services;

use App\Exceptions\SsoException;
use App\Models\App;
use App\Models\SsoLoginHandoff;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SsoLoginService
{
    public function __construct(
        protected SsoJwtService $jwtService,
    ) {
    }

    public function createLaunchPayload(App $app, User $user, ?string $ip = null): array
    {
        if (! $app->is_active || ! $app->sso_enabled || ! $app->sso_redirect_uri) {
            throw new SsoException('This application is not configured for SSO.', 404);
        }

        if (! $app->sso_client_id || ! $app->sso_client_secret_hash) {
            throw new SsoException('This application has incomplete SSO credentials.', 422);
        }

        $code = Str::random(64);
        $state = Str::random(40);
        $expiresAt = Carbon::now()->addSeconds(config('sso.code_ttl', 60));

        SsoLoginHandoff::create([
            'app_id' => $app->id,
            'user_id' => $user->id,
            'code_hash' => hash('sha256', $code),
            'state' => $state,
            'expires_at' => $expiresAt,
            'created_by_ip' => $ip,
        ]);

        return [
            'code' => $code,
            'state' => $state,
            'expires_at' => $expiresAt,
        ];
    }

    public function exchange(string $clientId, string $clientSecret, string $code, string $state): array
    {
        $app = App::query()
            ->where('sso_enabled', true)
            ->where('is_active', true)
            ->where('sso_client_id', $clientId)
            ->first();

        if (! $app || ! $app->sso_client_secret_hash || ! Hash::check($clientSecret, $app->sso_client_secret_hash)) {
            throw new SsoException('Invalid SSO client credentials.', 401);
        }

        $handoff = DB::transaction(function () use ($app, $code, $state) {
            $handoff = SsoLoginHandoff::query()
                ->where('app_id', $app->id)
                ->where('code_hash', hash('sha256', $code))
                ->where('state', $state)
                ->lockForUpdate()
                ->first();

            if (! $handoff) {
                throw new SsoException('Invalid SSO handoff code.', 422);
            }

            if ($handoff->used_at) {
                throw new SsoException('This SSO handoff code has already been used.', 422);
            }

            if ($handoff->expires_at->isPast()) {
                throw new SsoException('This SSO handoff code has expired.', 422);
            }

            $handoff->forceFill([
                'used_at' => now(),
            ])->save();

            return $handoff->loadMissing(['user', 'app']);
        });

        if (! $handoff->user || ! $handoff->user->is_active) {
            throw new SsoException('This user is not allowed to access SSO.', 403);
        }

        return $this->jwtService->issue($handoff->user, $app);
    }
}
