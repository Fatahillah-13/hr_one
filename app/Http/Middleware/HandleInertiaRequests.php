<?php

namespace App\Http\Middleware;

use App\Support\VirtualOffice\UnreadCounter;
use App\Support\VirtualOffice\VoAccess;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'isAdmin' => (bool) $user?->isAdmin(),
                // Untuk tautan cepat "Master Karyawan" di navbar (hanya bila user punya akses modulnya).
                'hasEmployees' => fn () => $user
                    ? $user->accessibleApps()->where('slug', config('hrd.employees_app_slug'))->exists()
                    : false,
            ],
            // Virtual Office: null bila user tidak punya akses (menu disembunyikan), selain itu jumlah chat belum dibaca.
            'virtualOffice' => fn () => $user && VoAccess::canUse($user)
                ? ['unread' => UnreadCounter::for($user->id)]
                : null,
            // Pesan sukses / hasil import dari server (dipakai halaman Settings > Users).
            'flash' => fn () => [
                'success' => $request->session()->get('success'),
                'import_errors' => $request->session()->get('import_errors'),
            ],
        ];
    }
}
