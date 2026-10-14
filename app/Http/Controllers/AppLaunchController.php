<?php

namespace App\Http\Controllers;

use App\Models\App;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AppLaunchController extends Controller
{
    /**
     * Gerbang peluncuran aplikasi dari dashboard:
     * 1. Memastikan user boleh membuka aplikasi (aturan yang sama dengan launcher).
     * 2. Mencatat aplikasi sebagai "terakhir dibuka".
     * 3. Mengarahkan user ke modul internal (path lokal) atau aplikasi eksternal (URL penuh).
     */
    public function __invoke(Request $request, App $app): RedirectResponse
    {
        $user = $request->user();

        abort_unless(
            $user->canAccessApp($app),
            403,
            'Anda tidak memiliki akses ke aplikasi ini.'
        );

        $target = (string) $app->app_link;

        abort_if($target === '', 404, 'Tautan aplikasi ini belum dikonfigurasi.');

        $user->recordAppOpened($app);

        // Modul internal memakai path lokal (mis. "/hrd/employees"),
        // aplikasi eksternal memakai URL penuh (https://...).
        return $app->isInternalModule()
            ? redirect($target)
            : redirect()->away($target);
    }
}
