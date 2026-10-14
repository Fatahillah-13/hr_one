<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        // Hanya aplikasi yang boleh diakses user, dan hanya kolom yang
        // dibutuhkan frontend yang dikirim ke browser.
        $apps = $user->accessibleApps()
            ->with('divisions:id,name,slug,sort_order')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description', 'icon', 'app_link'])
            ->map(fn ($app) => [
                'id' => $app->id,
                'name' => $app->name,
                'slug' => $app->slug,
                'description' => $app->description,
                'icon' => $app->icon,
                // Semua aplikasi dibuka lewat gerbang peluncur (cek akses + catat recent).
                // Modul internal HR One (app_link diawali "/") dibuka di tab yang sama,
                // aplikasi lain di tab baru (URL absolut memicu window.open di frontend).
                'launch_url' => route('sso.launch', $app->slug, absolute: ! $app->isInternalModule()),
                'is_internal' => $app->isInternalModule(),
                'divisions' => $app->divisions->map->only(['id', 'name', 'slug', 'sort_order'])->values(),
            ]);

        // Tab divisi: hanya divisi yang punya aplikasi yang bisa diakses user (diurutkan berdasarkan sort_order lalu name).
        $divisions = $apps->pluck('divisions')->flatten(1)->unique('id')->sortBy([
            ['sort_order', 'asc'],
            ['name', 'asc'],
        ])->values();

        $recentIds = $user->recentAppIds();
        $recentApps = $apps->whereIn('id', $recentIds)
            ->sortBy(fn ($app) => array_search($app['id'], $recentIds))
            ->values();

        return Inertia::render('Dashboard', [
            'apps' => $apps->values(),
            'divisions' => $divisions,
            'recentApps' => $recentApps,
        ]);
    }
}
