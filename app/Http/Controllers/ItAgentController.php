<?php

namespace App\Http\Controllers;

use App\Models\ItAgent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Settings > IT Call (admin): kelola agent, nomor WhatsApp, akun, dan status kerja. */
class ItAgentController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $agent = new ItAgent(['status' => 'ready']);
        $this->fill($agent, $request);

        return redirect()->route('settings', ['tab' => 'itcall'])
            ->with('success', "Agent {$agent->name} ditambahkan.");
    }

    public function update(Request $request, ItAgent $itAgent): RedirectResponse
    {
        $this->fill($itAgent, $request);

        return redirect()->route('settings', ['tab' => 'itcall'])
            ->with('success', "Agent {$itAgent->name} diperbarui.");
    }

    public function destroy(ItAgent $itAgent): RedirectResponse
    {
        $itAgent->delete();

        return redirect()->route('settings', ['tab' => 'itcall'])
            ->with('success', "Agent {$itAgent->name} dihapus.");
    }

    private function fill(ItAgent $agent, Request $request): void
    {
        $request->merge(['wa_number' => ItAgent::normalizeWa($request->input('wa_number'))]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'role' => ['nullable', 'string', 'max:100'],
            'wa_number' => ['required', 'regex:/^62\d{8,13}$/'],
            'user_id' => ['nullable', 'integer', 'exists:users,id', Rule::unique('it_agents', 'user_id')->ignore($agent->id)],
            'is_active' => ['boolean'],
            'status' => ['required', Rule::in(array_keys(ItAgent::STATUSES))],
            'status_note' => ['nullable', 'string', 'max:60'],
        ], [
            'wa_number.regex' => 'Nomor WhatsApp tidak valid. Contoh: 0812 3456 7890.',
            'user_id.unique' => 'Akun ini sudah terhubung ke agent lain.',
        ]);

        $agent->fill([
            'name' => trim($data['name']),
            'role' => filled($data['role'] ?? null) ? trim($data['role']) : null,
            'wa_number' => $data['wa_number'],
            'user_id' => $data['user_id'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);
        $agent->setWorkStatus($data['status'], $data['status_note'] ?? null);
        $agent->save();
    }
}
