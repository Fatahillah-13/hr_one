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
    ) {}

    /**
     * Satu pintu untuk membuka aplikasi dari dashboard.
     * - Aplikasi SSO: buat handoff code lalu redirect ke callback aplikasi.
     * - Aplikasi non-SSO: redirect ke app_link.
     * Keduanya dicek hak aksesnya dan dicatat ke "recent apps".
     */
    public function launch(Request $request, App $app): RedirectResponse
    {
        $user = $request->user();

        if (! $app->sso_enabled) {
            abort_unless($user->canAccessApp($app), 403, 'Anda tidak memiliki akses ke aplikasi ini.');
            abort_unless($app->app_link, 404, 'Link aplikasi belum diatur.');

            $user->recordAppOpened($app);

            $target = $app->app_link;
            if (! str_starts_with($target, '/') && ! preg_match('/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//', $target)) {
                if (preg_match('/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|localhost|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:\d+)?/i', $target)) {
                    $target = 'http://'.$target;
                }
            }

            return redirect()->away($target);
        }

        try {
            $payload = $this->ssoLoginService->createLaunchPayload($app, $user, $request->ip());
        } catch (SsoException $exception) {
            abort($exception->status(), $exception->getMessage());
        }

        $user->recordAppOpened($app);

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
            'client_id' => ['required', 'string', 'max:255'],
            'client_secret' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
        ]);

        try {
            $response = $this->ssoLoginService->exchange(
                $validated['client_id'],
                $validated['client_secret'],
                $validated['code'],
                $validated['state'],
                $request->ip(),
            );
        } catch (SsoException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], $exception->status());
        }

        return response()->json($response);
    }
}
