<?php

namespace App\Services;

use App\Exceptions\SsoException;
use App\Models\App;
use App\Models\SsoLoginHandoff;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SsoLoginService
{
    /**
     * Pesan yang dikirim ke aplikasi tujuan untuk SEMUA kegagalan exchange.
     * Sengaja tidak membedakan penyebab agar tidak memberi petunjuk ke penyerang.
     * Penyebab sebenarnya dicatat di log (channel default, prefix "SSO").
     */
    public const GENERIC_EXCHANGE_ERROR = 'Invalid SSO request.';

    public function __construct(
        protected SsoJwtService $jwtService,
    ) {}

    public function createLaunchPayload(App $app, User $user, ?string $ip = null): array
    {
        if (! $user->canAccessApp($app)) {
            Log::warning('SSO launch ditolak: user tidak punya akses ke aplikasi.', [
                'user_id' => $user->id,
                'app_id' => $app->id,
                'ip' => $ip,
            ]);

            throw new SsoException('Anda tidak memiliki akses ke aplikasi ini.', 403);
        }

        if (! $app->sso_enabled || ! $app->sso_redirect_uri) {
            throw new SsoException('Aplikasi ini belum dikonfigurasi untuk SSO.', 404);
        }

        if (! $app->sso_client_id || ! $app->sso_client_secret_hash) {
            throw new SsoException('Kredensial SSO aplikasi ini belum lengkap.', 422);
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

    public function exchange(string $clientId, string $clientSecret, string $code, string $state, ?string $ip = null): array
    {
        $app = App::query()
            ->where('sso_enabled', true)
            ->where('is_active', true)
            ->where('sso_client_id', $clientId)
            ->first();

        if (! $app || ! $app->sso_client_secret_hash || ! Hash::check($clientSecret, $app->sso_client_secret_hash)) {
            $this->fail('client credentials tidak valid', 401, ['client_id' => $clientId, 'ip' => $ip]);
        }

        $handoff = DB::transaction(function () use ($app, $code, $state, $ip) {
            $handoff = SsoLoginHandoff::query()
                ->where('app_id', $app->id)
                ->where('code_hash', hash('sha256', $code))
                ->where('state', $state)
                ->lockForUpdate()
                ->first();

            $context = ['app_id' => $app->id, 'handoff_id' => $handoff?->id, 'ip' => $ip];

            if (! $handoff) {
                $this->fail('code/state tidak ditemukan', 400, $context);
            }

            if ($handoff->used_at) {
                $this->fail('code sudah pernah dipakai', 400, $context);
            }

            if ($handoff->expires_at->isPast()) {
                $this->fail('code sudah kadaluarsa', 400, $context);
            }

            $handoff->forceFill([
                'used_at' => now(),
            ])->save();

            return $handoff->loadMissing(['user', 'app']);
        });

        // Cek ulang saat exchange: user bisa saja dinonaktifkan / pindah divisi
        // di antara launch dan exchange.
        if (! $handoff->user || ! $handoff->user->canAccessApp($app)) {
            $this->fail('user nonaktif atau tidak punya akses ke aplikasi', 403, [
                'app_id' => $app->id,
                'user_id' => $handoff->user_id,
                'ip' => $ip,
            ]);
        }

        Log::info('SSO exchange berhasil.', [
            'app_id' => $app->id,
            'user_id' => $handoff->user_id,
            'ip' => $ip,
        ]);

        return $this->jwtService->issue($handoff->user, $app);
    }

    /**
     * @return never
     */
    protected function fail(string $reason, int $status, array $context = []): void
    {
        Log::warning("SSO exchange ditolak: {$reason}.", $context);

        throw new SsoException(self::GENERIC_EXCHANGE_ERROR, $status);
    }
}
