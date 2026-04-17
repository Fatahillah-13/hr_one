<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Imports\UsersImport;
use App\Models\Division;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class UserManagementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
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
                'role' => $user->role ? [
                    'id' => $user->role->id,
                    'name' => $user->role->name,
                ] : null,
                'division' => $user->division ? [
                    'id' => $user->division->id,
                    'name' => $user->division->name,
                ] : null,
            ]);

        return Inertia::render('Settings/Settings', [
            'users' => $users,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Settings/UserManagement/create', [
            'roles' => Role::select('id', 'name')->get(),
            'divisions' => Division::select('id', 'name')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'] ?? null,
            'division_id' => $validated['division_id'] ?? null,
            'is_active' => $validated['is_active'],
        ]);

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user): Response
    {

        return Inertia::render('Settings/UserManagement/edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role_id' => $user->role_id,
                'division_id' => $user->division_id,
                'is_active' => $user->is_active,
            ],
            'roles' => Role::select('id', 'name')->get(),
            'divisions' => Division::select('id', 'name')->get(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        $payload = [
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => isset($validated['password']) ? Hash::make($validated['password']) : $user->password,
            'role_id' => $validated['role_id'] ?? null,
            'division_id' => $validated['division_id'] ?? null,
            'is_active' => $validated['is_active'],
        ];

        if (! empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        $user->update($payload);

        return redirect()
            ->route('settings')
            ->with('success', 'User berhasil diupdate.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return redirect()
            ->route('users.index')
            ->with('success', 'User berhasil dihapus.');
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:2048'],
        ]);

        $import = new UsersImport();
        Excel::import($import, $request->file('file'));

        $messages = [];
        if ($import->successCount > 0) {
            $messages['success'] = "{$import->successCount} user berhasil diimport.";
        }
        if (! empty($import->errors)) {
            $messages['import_errors'] = $import->errors;
        }

        return redirect()->route('users.index')->with($messages);
    }

    public function downloadTemplate()
    {
        $headers = ['name', 'username', 'email', 'password', 'role', 'division', 'status'];
        $example = ['John Doe', 'johndoe', 'john@example.com', 'password123', 'Admin', 'IT', 'aktif'];

        $callback = function () use ($headers, $example) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            fputcsv($file, $example);
            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="template_import_users.csv"',
        ]);
    }
}
