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

        // Hanya aplikasi yang boleh diakses user, dan hanya kolom yang aman
        // untuk dikirim ke browser (tanpa sso_client_id / redirect_uri).
        $apps = $user->accessibleApps()
            ->with('divisions:id,name,slug,sort_order')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description', 'icon', 'app_link', 'sso_enabled'])
            ->map(fn ($app) => [
                'id' => $app->id,
                'name' => $app->name,
                'slug' => $app->slug,
                'description' => $app->description,
                'icon' => $app->icon,
                'sso_enabled' => $app->sso_enabled,
                // Modul internal HR One (app_link diawali "/") dibuka di tab yang sama,
                // aplikasi lain di tab baru.
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
