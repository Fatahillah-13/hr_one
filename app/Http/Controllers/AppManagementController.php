<?php

namespace App\Http\Controllers;

use App\Models\App;
use App\Models\Division;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AppManagementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Settings/AppManagement/index', [
            'apps' => App::with('divisions')->get(),
            'divisions' => Division::all(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:apps,slug',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:255',
            'app_link' => [
                'nullable',
                'string',
                'max:1000',
                function ($attribute, $value, $fail) {
                    if ($value === null || $value === '') {
                        return;
                    }
                    // Modul internal HR One memakai path lokal, mis. "/hrd/employees".
                    // Tolak "//host" (protocol-relative) agar tidak mengarah keluar domain.
                    if (str_starts_with($value, '/') && ! str_starts_with($value, '//')) {
                        return;
                    }
                    if (preg_match('/^\s*(javascript|data|vbscript):/i', (string) $value)) {
                        $fail('Format link aplikasi tidak valid.');
                    }
                    if (!filter_var($value, FILTER_VALIDATE_URL)) {
                        $fail('Format link aplikasi tidak valid.');
                    }
                },
            ],
            'is_active' => 'nullable|boolean',
            'division_ids' => 'nullable|array',
            'division_ids.*' => 'exists:divisions,id',
        ]);

        $appAttributes = collect($validated)
            ->except(['division_ids'])
            ->toArray();

        $appAttributes['is_active'] = $request->has('is_active') ? $request->boolean('is_active') : true;
        $app = App::create($appAttributes);
        $app->divisions()->sync($validated['division_ids'] ?? []);

        return redirect()->back()->with('success', "Aplikasi {$app->name} berhasil ditambahkan.");
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
    public function edit(string $id)
    {
        $app = App::with('divisions')->findOrFail($id);
        $divisions = Division::all();

        return Inertia::render('Settings/AppManagement/edit', [
            'app' => $app,
            'divisions' => $divisions,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $app = App::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:apps,slug,'.$app->id,
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:255',
            'app_link' => [
                'nullable',
                'string',
                'max:1000',
                function ($attribute, $value, $fail) {
                    if ($value === null || $value === '') {
                        return;
                    }
                    // Modul internal HR One memakai path lokal, mis. "/hrd/employees".
                    // Tolak "//host" (protocol-relative) agar tidak mengarah keluar domain.
                    if (str_starts_with($value, '/') && ! str_starts_with($value, '//')) {
                        return;
                    }
                    if (preg_match('/^\s*(javascript|data|vbscript):/i', (string) $value)) {
                        $fail('Format link aplikasi tidak valid.');
                    }
                    if (!filter_var($value, FILTER_VALIDATE_URL)) {
                        $fail('Format link aplikasi tidak valid.');
                    }
                },
            ],
            'is_active' => 'nullable|boolean',
            'division_ids' => 'nullable|array',
            'division_ids.*' => 'exists:divisions,id',
        ]);

        $appAttributes = collect($validated)
            ->except(['division_ids'])
            ->toArray();

        if ($request->has('is_active')) {
            $appAttributes['is_active'] = $request->boolean('is_active');
        }

        $app->update($appAttributes);
        $app->divisions()->sync($validated['division_ids'] ?? []);

        return redirect()->back()->with('success', "Aplikasi {$app->name} berhasil diperbarui.");
    }

    /**
     * Toggle active/inactive status of the specified app.
     */
    public function toggleActive(string $id)
    {
        $app = App::findOrFail($id);
        $app->update([
            'is_active' => ! $app->is_active,
        ]);

        $status = $app->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return redirect()->back()->with('success', "Aplikasi {$app->name} berhasil {$status}.");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $app = App::findOrFail($id);
        $app->delete();

        return redirect()->back();
    }
}
