<?php

namespace App\Http\Middleware;

use App\Models\App;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Melindungi modul internal HR One dengan aturan akses yang sama seperti launcher:
 * user harus boleh membuka aplikasi (slug) yang mewakili modul tersebut.
 *
 * Pemakaian di route:  ->middleware('app.access:hrd-master-karyawan')
 */
class EnsureAppAccess
{
    public function handle(Request $request, Closure $next, string $slug): Response
    {
        $app = App::where('slug', $slug)->first();

        abort_unless(
            $app && $request->user()?->canAccessApp($app),
            403,
            'Anda tidak memiliki akses ke modul ini.'
        );

        return $next($request);
    }
}
