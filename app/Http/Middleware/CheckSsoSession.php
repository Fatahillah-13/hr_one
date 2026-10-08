<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckSsoSession
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check() && session()->has('refresh_token')) {
            $interval = 10 * 60; // 10 minutes

            if(now()->timestamp - session()->get('sso_checked_at', 0) > $interval) {
                $response = Http::asForm()->post(
                    rtrim(config('services.keycloak.base_url'), '/')
                    . '/realms/' . config('services.keycloak.realms')
                    . '/protocol/openid-connect/token',
                    [
                        'grant_type' => 'refresh_token',
                        'client_id' => config('services.keycloak.client_id'),
                        'client_secret' => config('services.keycloak.client_secret'),
                        'refresh_token' => session()->get('refresh_token'),
                    ]
                );

                if ($response->failed()) {
                    Auth::logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                    return Inertia::location(route('sso.redirect'));
                }

                session([
                    'refresh_token' => $response->json('refresh_token'),
                    'sso_checked_at' => now()->timestamp,
                ]);
            }
        }
        return $next($request);
    }
}
