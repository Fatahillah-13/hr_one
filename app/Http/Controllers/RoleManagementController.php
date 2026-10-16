<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleManagementController extends Controller
{
    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:roles,name',
            'app_ids' => 'nullable|array',
            'app_ids.*' => 'exists:apps,id',
        ], [
            'name.required' => 'Nama role wajib diisi.',
            'name.unique' => 'Nama role sudah terdaftar.',
            'name.max' => 'Nama role maksimal 100 karakter.',
        ]);

        $role = Role::create([
            'name' => trim($validated['name']),
        ]);

        if (isset($validated['app_ids'])) {
            $role->apps()->sync($validated['app_ids']);
        }

        return redirect()->back()->with('success', 'Role berhasil ditambahkan.');
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, string $id)
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('roles', 'name')->ignore($role->id),
            ],
            'app_ids' => 'nullable|array',
            'app_ids.*' => 'exists:apps,id',
        ], [
            'name.required' => 'Nama role wajib diisi.',
            'name.unique' => 'Nama role sudah terdaftar.',
            'name.max' => 'Nama role maksimal 100 karakter.',
        ]);

        $role->update([
            'name' => trim($validated['name']),
        ]);

        if (isset($validated['app_ids'])) {
            $role->apps()->sync($validated['app_ids']);
        }

        return redirect()->back()->with('success', 'Role berhasil diperbarui.');
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(string $id)
    {
        $role = Role::withCount('users')->findOrFail($id);

        // Jangan izinkan menghapus role default sistem (Admin / Member)
        if (in_array(strtolower($role->name), ['admin', 'member'])) {
            return redirect()->back()->with('error', 'Role bawaan sistem (' . $role->name . ') tidak dapat dihapus.');
        }

        if ($role->users_count > 0) {
            return redirect()->back()->with('error', 'Role tidak dapat dihapus karena masih digunakan oleh ' . $role->users_count . ' user.');
        }

        $role->delete();

        return redirect()->back()->with('success', 'Role berhasil dihapus.');
    }
}
