<?php

namespace App\Http\Controllers;

use App\Models\App;
use App\Models\Division;
use Illuminate\Http\Request;
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
            'app_link' => 'nullable|url|max:255',
            'division_ids' => 'nullable|array',
            'division_ids.*' => 'exists:divisions,id',
        ]);

        $app = App::create(collect($validated)->except('division_ids')->toArray());
        $app->divisions()->sync($validated['division_ids'] ?? []);

        return redirect()->back();
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
            'slug' => 'required|string|max:255|unique:apps,slug,' . $app->id,
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:255',
            'app_link' => 'nullable|url|max:255',
            'division_ids' => 'nullable|array',
            'division_ids.*' => 'exists:divisions,id',
        ]);

        $app->update(collect($validated)->except('division_ids')->toArray());
        $app->divisions()->sync($validated['division_ids'] ?? []);

        return redirect()->back();
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
