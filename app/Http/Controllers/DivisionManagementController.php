<?php

namespace App\Http\Controllers;

use App\Models\Division;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DivisionManagementController extends Controller
{
    /**
     * Store a newly created division in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:divisions,slug',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $slug = ! empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        $originalSlug = $slug;
        $counter = 1;
        while (Division::where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-{$counter}";
            $counter++;
        }

        $sortOrder = isset($validated['sort_order']) && $validated['sort_order'] !== ''
            ? (int) $validated['sort_order']
            : ((int) Division::max('sort_order') + 1);

        Division::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'sort_order' => $sortOrder,
        ]);

        return redirect()->back()->with('success', 'Menu kategori berhasil ditambahkan.');
    }

    /**
     * Update the specified division in storage.
     */
    public function update(Request $request, string $id)
    {
        $division = Division::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('divisions', 'slug')->ignore($division->id),
            ],
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $slug = ! empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        if ($slug !== $division->slug) {
            $originalSlug = $slug;
            $counter = 1;
            while (Division::where('slug', $slug)->where('id', '!=', $division->id)->exists()) {
                $slug = "{$originalSlug}-{$counter}";
                $counter++;
            }
        }

        $data = [
            'name' => $validated['name'],
            'slug' => $slug,
        ];

        if (isset($validated['sort_order']) && $validated['sort_order'] !== '') {
            $data['sort_order'] = (int) $validated['sort_order'];
        }

        $division->update($data);

        return redirect()->back()->with('success', 'Menu kategori berhasil diperbarui.');
    }

    /**
     * Reorder divisions in storage.
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:divisions,id',
        ]);

        foreach ($validated['ids'] as $index => $id) {
            Division::where('id', $id)->update(['sort_order' => $index + 1]);
        }

        return redirect()->back()->with('success', 'Urutan menu kategori berhasil diperbarui.');
    }

    /**
     * Remove the specified division from storage.
     */
    public function destroy(string $id)
    {
        $division = Division::findOrFail($id);

        if (strtolower($division->slug) === 'all') {
            return redirect()->back()->withErrors(['name' => 'Menu kategori "All" merupakan kategori sistem dan tidak boleh dihapus.']);
        }

        $division->delete();

        return redirect()->back()->with('success', 'Menu kategori berhasil dihapus.');
    }
}
