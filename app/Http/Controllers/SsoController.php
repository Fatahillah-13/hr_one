<?php
// app/Http/Controllers/SsoController.php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

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

        // 5. Simpan id_token untuk logout global nanti
        session(['id_token' => $sso->accessTokenResponseBody['id_token'] ?? null]);

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
}
