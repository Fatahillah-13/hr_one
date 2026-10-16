<?php

namespace App\Http\Controllers;

use App\Models\App;
use App\Models\Division;
use App\Models\ItAgent;
use App\Models\Role;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        $users = User::with(['role', 'division'])
            ->latest()
            ->paginate(10)
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'last_login_at' => $user->last_login_at,
                'role' => $user->role,
                'division' => $user->division,
            ]);

        return Inertia::render('Settings/Settings', [
            'users' => $users,
            'roles' => Role::withCount('users')->with('apps:id,name')->get(),
            'divisions' => Division::withCount(['apps', 'users'])->orderBy('sort_order')->orderBy('name')->get(),
            'apps' => App::with('divisions')->orderBy('sort_order')->orderBy('name')->get(),
            // Tab IT Call: agent beserta akun HR One yang terhubung, dan pilihan akun.
            'itAgents' => fn () => ItAgent::with('user:id,name,username')->ordered()->get()
                ->map(fn (ItAgent $a) => $a->toPublicArray() + [
                    'is_active' => $a->is_active,
                    'user_id' => $a->user_id,
                    'user' => $a->user?->only(['id', 'name', 'username']),
                ]),
            'itUserOptions' => fn () => User::where('is_active', true)->orderBy('name')->get(['id', 'name', 'username']),
            'itStatuses' => ItAgent::STATUSES,
            'itResetAt' => config('itcall.reset_at'),
        ]);
    }
}
