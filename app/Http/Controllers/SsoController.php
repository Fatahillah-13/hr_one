<?php
// app/Http/Controllers/SsoController.php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class SsoController extends Controller
{
    // Mengirim user ke Keycloak
    public function redirect()
    {
        return Socialite::driver('keycloak')->redirect();
    }

    // Menerima user kembali dari Keycloak
    public function callback()
    {
        $sso = Socialite::driver('keycloak')->user();

        // 1. Ambil data identitas dari token, sesuai pengaturan .env
        $value = $sso->user[config('sso.claim')] ?? null;
        abort_if(!$value, 403, 'Data identitas tidak ditemukan di SSO.');

        // 2. Cari user di tabel aplikasi ini
        $user = User::where(config('sso.column'), $value)->first();

        // 3. Kalau tidak ada, tolak (lebih aman untuk data HR)
        abort_if(!$user, 403, 'Akun Anda belum terdaftar di aplikasi ini.');

        // 4. Login ke Laravel seperti biasa
        Auth::login($user);

        $idToken = $sso->accessTokenResponseBody['id_token'] ?? null;
        session([
            'id_token' => $idToken,
            'refresh_token' => $sso->refreshToken,
            'sso_checked_at' => now()->timestamp,
            ]);

        // Ambil "sid" dari isi id_token
        $payload = $idToken
            ? json_decode(base64_decode(strtr(explode('.', $idToken)[1], '-_', '+/')), true)
            : [];

        if (!empty($payload['sid'])) {
            DB::table('sso_sessions')->insert([
                'sid'        => $payload['sid'],
                'session_id' => session()->getId(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return redirect()->intended('/dashboard');
    }

    public function logout(Request $request)
    {
        $idToken = $request->session()->get('id_token');

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $url = rtrim(config('services.keycloak.base_url'), '/')
            . '/realms/' . config('services.keycloak.realms')
            . '/protocol/openid-connect/logout?' . http_build_query([
                'post_logout_redirect_uri' => url('/'),
                'id_token_hint'            => $idToken,
            ]);

        return Inertia::location($url);
    }

    public function backchannel(Request $request)
    {
        $claims = $this->validateLogoutToken((string) $request->input('logout_token'));

        $sessionIds = DB::table('sso_sessions')
            ->where('sid', $claims->sid)
            ->pluck('session_id');

        DB::table('sessions')->whereIn('id', $sessionIds)->delete();
        DB::table('sso_sessions')->where('sid', $claims->sid)->delete();

        return response()->noContent();
    }

    private function validateLogoutToken(string $token): object
    {
        $realmUrl = rtrim(config('services.keycloak.base_url'), '/')
            . '/realms/' . config('services.keycloak.realms');

        // Kunci publik Keycloak untuk memeriksa tanda tangan token
        $jwks = Cache::remember('keycloak_jwks', 3600, fn () =>
            Http::get($realmUrl . '/protocol/openid-connect/certs')->json()
        );

        $claims = JWT::decode($token, JWK::parseKeySet($jwks)); // gagal = exception

        abort_if($claims->iss !== $realmUrl, 400);
        abort_if(!in_array(config('services.keycloak.client_id'), (array) $claims->aud, true), 400);
        abort_if(!isset($claims->events->{'http://schemas.openid.net/event/backchannel-logout'}), 400);
        abort_if(isset($claims->nonce), 400);   // logout token tidak boleh punya nonce
        abort_if(empty($claims->sid), 400);

        return $claims;
    }
}
