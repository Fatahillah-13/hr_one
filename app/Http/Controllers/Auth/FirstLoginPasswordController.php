<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class FirstLoginPasswordController extends Controller
{
    /**
     * Tampilkan form ganti password untuk login pertama kali.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user->must_change_password) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/FirstLoginResetPassword', [
            'user' => [
                'name' => $user->name,
                'username' => $user->username,
            ],
        ]);
    }

    /**
     * Simpan password baru dan nonaktifkan flag must_change_password.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->must_change_password) {
            return redirect()->route('dashboard');
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ], [
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password minimal harus 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $user->forceFill([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
        ])->save();

        return redirect()->route('dashboard')->with('success', 'Password Anda berhasil diperbarui. Selamat datang di HR One!');
    }
}
