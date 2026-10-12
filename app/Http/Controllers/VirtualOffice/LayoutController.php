<?php

namespace App\Http\Controllers\VirtualOffice;

use App\Events\VirtualOffice\LayoutUpdated;
use App\Http\Controllers\Controller;
use App\Models\VirtualOffice\LayoutVersion;
use App\Models\VirtualOffice\OfficeObject;
use App\Models\VirtualOffice\Seat;
use App\Support\VirtualOffice\Realtime;
use App\Support\VirtualOffice\VoAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** Editor Denah: draft, publikasi, dan riwayat versi. Hanya untuk admin (middleware EnsureVoAdmin). */
class LayoutController extends Controller
{
    public function edit(): Response
    {
        $draft = LayoutVersion::where('status', 'draft')->latest('id')->with('user:id,name')->first();

        return Inertia::render('VirtualOffice/Editor', [
            'seats' => Seat::orderBy('code')->get(Seat::PUBLIC_COLUMNS),
            'objects' => OfficeObject::orderBy('sort')->get(OfficeObject::PUBLIC_COLUMNS),
            'users' => VoAccess::members()->orderBy('name')->get(['id', 'name']),
            'draft' => $draft ? [
                'layout' => $draft->layout,
                'saved_at' => $draft->updated_at->toIso8601String(),
                'by' => $draft->user?->name,
            ] : null,
            'versions' => $this->versionList(),
        ]);
    }

    /** Simpan draft (tidak terlihat karyawan). Hanya ada satu draft aktif. */
    public function saveDraft(Request $request): JsonResponse
    {
        $layout = $this->validated($request);

        $draft = DB::transaction(function () use ($layout, $request) {
            LayoutVersion::where('status', 'draft')->delete();

            return LayoutVersion::create(['status' => 'draft', 'layout' => $layout, 'user_id' => $request->user()->id]);
        });

        return response()->json(['saved_at' => $draft->updated_at->toIso8601String()]);
    }

    /** Terapkan denah ke lantai, simpan sebagai versi, beri tahu semua yang sedang membuka lantai. */
    public function publish(Request $request): JsonResponse
    {
        $layout = $this->validated($request);
        $note = $request->validate(['note' => ['nullable', 'string', 'max:120']])['note'] ?? null;

        $version = DB::transaction(function () use ($layout, $request, $note) {
            $incoming = collect($layout['seats']);
            $keepIds = $incoming->pluck('id')->filter()->map(fn ($v) => (int) $v)->all();

            // 1) hapus meja yang tidak ada lagi di denah
            Seat::whereNotIn('id', $keepIds ?: [0])->delete();

            // 2) lepas sementara kode & karyawan agar tidak bentrok unique saat ditukar
            Seat::query()->update(['user_id' => null]);
            // (per baris, supaya jalan di MySQL maupun SQLite untuk test)
            Seat::query()->pluck('id')->each(fn ($id) => Seat::whereKey($id)->update(['code' => 'tmp-'.$id]));

            // 3) simpan meja (update yang lama, buat yang baru)
            foreach ($incoming as $s) {
                $data = [
                    'code' => $s['code'], 'zone' => $s['zone'], 'facing' => $s['facing'],
                    'has_panel' => (bool) $s['has_panel'], 'is_printer' => (bool) $s['is_printer'],
                    'x' => $s['x'], 'y' => $s['y'], 'w' => $s['w'], 'd' => $s['d'],
                    'user_id' => $s['is_printer'] ? null : ($s['user_id'] ?? null),
                ];
                $data += Seat::derive($data);
                $id = $s['id'] ?? null;
                if ($id && Seat::whereKey($id)->exists()) {
                    Seat::whereKey($id)->update($data);
                } else {
                    Seat::create($data);
                }
            }

            // 4) perabot: ganti semuanya
            OfficeObject::query()->delete();
            foreach ($layout['objects'] as $i => $o) {
                OfficeObject::create([
                    'type' => $o['type'], 'x' => $o['x'], 'y' => $o['y'], 'w' => $o['w'], 'd' => $o['d'],
                    'rotation' => $o['rotation'] ?? 0, 'label' => $o['label'] ?? null, 'sort' => $i,
                ]);
            }

            LayoutVersion::where('status', 'draft')->delete();

            return LayoutVersion::create([
                'status' => 'published',
                'layout' => $this->currentLayout(),
                'note' => $note,
                'user_id' => $request->user()->id,
            ]);
        });

        Realtime::send(new LayoutUpdated($version->id, $request->user()->name));

        return response()->json([
            'seats' => Seat::orderBy('code')->get(Seat::PUBLIC_COLUMNS),
            'objects' => OfficeObject::orderBy('sort')->get(OfficeObject::PUBLIC_COLUMNS),
            'versions' => $this->versionList(),
        ]);
    }

    /** Ambil isi satu versi lama untuk dibuka di editor (belum diterapkan sampai dipublikasikan). */
    public function version(LayoutVersion $version): JsonResponse
    {
        abort_unless($version->status === 'published', 404);

        return response()->json(['layout' => $version->layout]);
    }

    private function currentLayout(): array
    {
        return [
            'seats' => Seat::orderBy('code')->get(Seat::PUBLIC_COLUMNS)->toArray(),
            'objects' => OfficeObject::orderBy('sort')->get(OfficeObject::PUBLIC_COLUMNS)->toArray(),
        ];
    }

    private function versionList(): array
    {
        return LayoutVersion::where('status', 'published')->latest('id')->limit(15)->with('user:id,name')->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'at' => $v->created_at->toIso8601String(),
                'by' => $v->user?->name,
                'note' => $v->note,
            ])->all();
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'seats' => ['present', 'array', 'max:400'],
            'seats.*.id' => ['nullable', 'integer'],
            'seats.*.code' => ['required', 'string', 'max:20', 'distinct:ignore_case'],
            'seats.*.zone' => ['required', 'string', 'max:10'],
            'seats.*.facing' => ['required', Rule::in(Seat::FACINGS)],
            'seats.*.has_panel' => ['boolean'],
            'seats.*.is_printer' => ['boolean'],
            'seats.*.x' => ['required', 'integer', 'between:-100,1200'],
            'seats.*.y' => ['required', 'integer', 'between:-100,800'],
            'seats.*.w' => ['required', 'integer', 'between:20,200'],
            'seats.*.d' => ['required', 'integer', 'between:20,200'],
            'seats.*.user_id' => ['nullable', 'integer', 'exists:users,id'],
            'objects' => ['present', 'array', 'max:600'],
            'objects.*.type' => ['required', Rule::in(OfficeObject::TYPES)],
            'objects.*.x' => ['required', 'integer', 'between:-100,1200'],
            'objects.*.y' => ['required', 'integer', 'between:-100,800'],
            'objects.*.w' => ['required', 'integer', 'between:2,1200'],
            'objects.*.d' => ['required', 'integer', 'between:2,1200'],
            'objects.*.rotation' => ['nullable', Rule::in([0, 90, 180, 270])],
            'objects.*.label' => ['nullable', 'string', 'max:40'],
        ], [
            'seats.*.code.distinct' => 'Kode meja :input dipakai lebih dari satu kali.',
        ]);

        // satu karyawan hanya boleh punya satu meja
        $assigned = collect($data['seats'])->pluck('user_id')->filter();
        if ($assigned->count() !== $assigned->unique()->count()) {
            throw ValidationException::withMessages(['seats' => 'Ada karyawan yang ditempatkan di lebih dari satu meja.']);
        }

        // kode meja dibandingkan setelah dirapikan (spasi & huruf besar), sama seperti yang disimpan
        $codes = collect($data['seats'])->map(fn ($s) => strtoupper(trim($s['code'])));
        if ($dup = $codes->duplicates()->first()) {
            throw ValidationException::withMessages(['seats' => "Kode meja {$dup} dipakai lebih dari satu kali."]);
        }

        // simpan hanya kolom yang dikenal
        $data['seats'] = array_map(fn ($s) => [
            'id' => $s['id'] ?? null, 'code' => strtoupper(trim($s['code'])), 'zone' => strtoupper(trim($s['zone'])),
            'facing' => $s['facing'], 'has_panel' => (bool) ($s['has_panel'] ?? false), 'is_printer' => (bool) ($s['is_printer'] ?? false),
            'x' => (int) $s['x'], 'y' => (int) $s['y'], 'w' => (int) $s['w'], 'd' => (int) $s['d'],
            'user_id' => $s['user_id'] ?? null,
        ], $data['seats']);
        $data['objects'] = array_map(fn ($o) => [
            'type' => $o['type'], 'x' => (int) $o['x'], 'y' => (int) $o['y'], 'w' => (int) $o['w'], 'd' => (int) $o['d'],
            'rotation' => (int) ($o['rotation'] ?? 0), 'label' => $o['label'] ?? null,
        ], $data['objects']);

        return ['seats' => $data['seats'], 'objects' => $data['objects']];
    }
}
