<?php

namespace App\Http\Controllers;

use App\Models\ItAgent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * IT Call: semua user HR One bisa melapor masalah IT ke agent lewat WhatsApp.
 * Pesan disusun di browser lalu dibuka di WhatsApp; pelapor sendiri yang menekan Send.
 * Tidak ada riwayat laporan yang disimpan.
 */
class ItCallController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user()->loadMissing('division:id,name');

        $agents = ItAgent::active()->ordered()->get();
        $mine = ItAgent::active()->where('user_id', $user->id)->first();

        return Inertia::render('ItCall/Index', [
            'agents' => $agents->map->toPublicArray()->values(),
            'myAgentId' => $mine?->id,
            'reporter' => [
                'name' => $user->name,
                'division' => $user->division?->name,
            ],
            'statuses' => ItAgent::STATUSES,
            'resetAt' => config('itcall.reset_at'),
        ]);
    }

    /** Agent mengganti status kerjanya sendiri (akun HR One harus terhubung ke agent). */
    public function updateMyStatus(Request $request): RedirectResponse
    {
        $agent = ItAgent::active()->where('user_id', $request->user()->id)->first();

        abort_unless($agent, 403, 'Akun Anda tidak terdaftar sebagai agent IT Call.');

        $data = $request->validate([
            'status' => ['required', Rule::in(array_keys(ItAgent::STATUSES))],
            'status_note' => ['nullable', 'string', 'max:60'],
        ]);

        $agent->setWorkStatus($data['status'], $data['status_note'] ?? null);
        $agent->save();

        return back()->with('success', 'Status Anda: '.ItAgent::STATUSES[$agent->status].'.');
    }
}
