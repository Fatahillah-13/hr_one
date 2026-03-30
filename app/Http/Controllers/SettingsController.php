<?php

namespace App\Http\Controllers;

use App\Models\App;
use App\Models\Division;
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
            'roles' => Role::select('id', 'name')->get(),
            'divisions' => Division::select('id', 'name')->get(),
            'apps' => App::with('divisions')->get(),
        ]);
    }
}
