<?php

namespace App\Http\Controllers;

use App\Exceptions\SsoException;
use App\Models\App;
use App\Services\SsoLoginService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SsoController extends Controller
{
    public function __construct(
        protected SsoLoginService $ssoLoginService,
    ) {
    }

    public function launch(Request $request, App $app): RedirectResponse
    {
        try {
            $payload = $this->ssoLoginService->createLaunchPayload(
                $app,
                $request->user(),
                $request->ip(),
            );
        } catch (SsoException $exception) {
            abort($exception->status(), $exception->getMessage());
        }

        $separator = str_contains($app->sso_redirect_uri, '?') ? '&' : '?';
        $targetUrl = $app->sso_redirect_uri.$separator.http_build_query([
            'code' => $payload['code'],
            'state' => $payload['state'],
        ]);

        return redirect()->away($targetUrl);
    }

    public function exchange(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'string'],
            'client_secret' => ['required', 'string'],
            'code' => ['required', 'string'],
            'state' => ['required', 'string'],
        ]);

        try {
            $response = $this->ssoLoginService->exchange(
                $validated['client_id'],
                $validated['client_secret'],
                $validated['code'],
                $validated['state'],
            );
        } catch (SsoException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], $exception->status());
        }

        return response()->json($response);
    }
}
