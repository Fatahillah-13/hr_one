<?php

namespace App\Http\Middleware;

use App\Support\VirtualOffice\VoAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureVoAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(VoAccess::isAdmin($request->user()), 403, 'Editor Denah hanya untuk admin HRD.');

        return $next($request);
    }
}
