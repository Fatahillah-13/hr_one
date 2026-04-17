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
use Illuminate\Support\Str;

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

        abort_unless($response->successful(), 401, $response->json('message', 'SSO exchange failed.'));

        $claims = $this->jwtVerifier->verify(
            $response->json('access_token'),
            config('services.hr_one.sso_client_id'),
        );

        abort_if(! ($claims['is_active'] ?? false), 403, 'User is inactive.');

        $user = User::updateOrCreate(
            ['external_sso_id' => $claims['sub']],
            [
                'username' => $claims['username'],
                'name' => $claims['name'],
                'email' => $claims['email'],
                'password' => bcrypt(Str::random(32)),
            ],
        );

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }
}
```

## JWT Verifier

- Salin logika verifikasi `RS256` dari [`app/Services/SsoJwtService.php`](/d:/sistem/hr_one/app/Services/SsoJwtService.php) dan pakai hanya method verifikasinya.
- Public key di app tujuan harus sama dengan pasangan private key yang dipakai `HR One`.
- Cocokkan minimal `iss`, `aud`, `exp`, `nbf`, dan signature.

## Catatan

- App tujuan tetap membuat session Laravel miliknya sendiri setelah JWT valid.
- Jangan kirim `client_secret` dari frontend browser app tujuan. Exchange harus dilakukan dari backend app tujuan.
- Untuk produksi nanti, simpan private/public key di secret manager atau file yang aman, bukan hardcoded di repo.
