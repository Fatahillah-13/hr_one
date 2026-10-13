<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordIsChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password) {
            if (! $request->routeIs('password.first_login', 'password.first_login.update', 'logout')) {
                return redirect()->route('password.first_login');
            }
        }

        return $next($request);
    }
}
