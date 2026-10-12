# Laravel Target App SSO Callback Example

Dokumen ini untuk aplikasi Laravel lain yang ingin menerima login SSO dari `HR One`.

## Env

Tambahkan konfigurasi seperti ini di app tujuan:

```env
HR_ONE_BASE_URL=http://localhost:8000
HR_ONE_SSO_EXCHANGE_URL=http://localhost:8000/api/sso/exchange
HR_ONE_SSO_CLIENT_ID=payroll-local
HR_ONE_SSO_CLIENT_SECRET=isi-secret-yang-sama-dengan-setting-di-hr-one
HR_ONE_SSO_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

## Route

```php
use App\Http\Controllers\SsoCallbackController;

Route::get('/sso/callback', [SsoCallbackController::class, 'handle'])->name('sso.callback');
```

## Controller

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\SsoJwtVerifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

class SsoCallbackController extends Controller
{
    public function __construct(
        protected SsoJwtVerifier $jwtVerifier,
    ) {
    }

    public function handle(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string'],
            'state' => ['required', 'string'],
        ]);

        $response = Http::asJson()->post(config('services.hr_one.sso_exchange_url'), [
            'client_id' => config('services.hr_one.sso_client_id'),
            'client_secret' => config('services.hr_one.sso_client_secret'),
            'code' => $validated['code'],
            'state' => $validated['state'],
        ]);

        abort_unless($response->successful(), 401, 'Login SSO gagal. Silakan buka ulang dari HR One.');

        $claims = $this->jwtVerifier->verify(
            $response->json('access_token'),
            config('services.hr_one.sso_client_id'),
        );

        abort_if(! ($claims['is_active'] ?? false), 403, 'User is inactive.');

        // PENTING: cocokkan ke user yang SUDAH ADA di aplikasi ini (username = NIK).
        // Jangan membuat user baru otomatis: hak akses/role di aplikasi lama tetap
        // dikelola di aplikasi lama, dan user yang tidak terdaftar harus ditolak.
        $user = User::where('username', $claims['username'])->first();

        abort_if(! $user, 403, 'Akun Anda belum terdaftar di aplikasi ini. Hubungi HRD-IT.');

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }
}
```

## JWT Verifier

- Salin logika verifikasi `RS256` dari `app/Services/SsoJwtService.php` dan pakai hanya method verifikasinya.
- Public key di app tujuan harus sama dengan pasangan private key yang dipakai `HR One`.
- Cocokkan minimal `iss`, `aud`, `exp`, `nbf`, dan signature.

## Catatan

- Code SSO hanya berlaku 60 detik dan sekali pakai. Exchange harus langsung dilakukan saat callback.
- Semua kegagalan exchange mengembalikan pesan yang sama (`Invalid SSO request.`). Penyebab detail ada di log HR One (`storage/logs/laravel.log`, cari "SSO exchange ditolak").
- Endpoint exchange dibatasi 30 request/menit per IP.

- App tujuan tetap membuat session Laravel miliknya sendiri setelah JWT valid.
- Jangan kirim `client_secret` dari frontend browser app tujuan. Exchange harus dilakukan dari backend app tujuan.
- Untuk produksi nanti, simpan private/public key di secret manager atau file yang aman, bukan hardcoded di repo.
