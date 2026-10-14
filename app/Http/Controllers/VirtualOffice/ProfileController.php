<?php

namespace App\Http\Controllers\VirtualOffice;

use App\Events\VirtualOffice\ProfileUpdated;
use App\Http\Controllers\Controller;
use App\Models\VirtualOffice\Profile;
use App\Support\VirtualOffice\Realtime;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /** Ubah status + bubble. duration: 30|60|240|today|never (menit / akhir hari / tanpa batas). */
    public function updateStatus(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(Profile::STATUSES)],
            'bubble' => ['nullable', 'string', 'max:40'],
            'duration' => ['nullable', Rule::in(['30', '60', '240', 'today', 'never'])],
        ]);

        $bubble = trim((string) ($data['bubble'] ?? '')) ?: null;
        $expires = null;
        if ($bubble) {
            $expires = match ($data['duration'] ?? 'never') {
                '30', '60', '240' => now()->addMinutes((int) $data['duration']),
                'today' => now()->endOfDay(),
                default => null,
            };
        }

        $profile = Profile::forUser($request->user()->id);
        $profile->update([
            'status' => $data['status'],
            'bubble' => $bubble,
            'bubble_expires_at' => $expires,
        ]);

        Realtime::send(new ProfileUpdated($profile->user_id, $profile->toPublic()));

        return response()->json(['profile' => $profile->toPublic()]);
    }

    /**
     * Simpan avatar.
     * - mode=photo: file gambar (frontend sudah crop 256x256). Server re-encode dengan GD
     *   agar file aman dan ukurannya kecil.
     * - mode=character: config JSON {skin, hair, shirt, acc}.
     * - mode=initial: kembali ke inisial nama.
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'mode' => ['required', Rule::in(['initial', 'photo', 'character'])],
            'photo' => ['required_if:mode,photo', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'config' => ['required_if:mode,character', 'nullable', 'array'],
            'config.skin' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'config.shirt' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'config.hair' => ['nullable', Rule::in(['pendek', 'panjang', 'hijab', 'botak'])],
            'config.acc' => ['nullable', Rule::in(['none', 'kacamata', 'idcard'])],
        ]);

        $profile = Profile::forUser($request->user()->id);
        $mode = $request->input('mode');
        $update = ['avatar_mode' => $mode];

        if ($mode === 'photo') {
            $path = $this->storePhoto($request->file('photo')->getRealPath(), $profile->user_id);
            if ($profile->avatar_path) {
                Storage::disk('public')->delete($profile->avatar_path);
            }
            $update['avatar_path'] = $path;
        }

        if ($mode === 'character') {
            $update['avatar_config'] = [
                'skin' => $request->input('config.skin', '#C68A5E'),
                'hair' => $request->input('config.hair', 'pendek'),
                'shirt' => $request->input('config.shirt', '#0F6E6E'),
                'acc' => $request->input('config.acc', 'none'),
            ];
        }

        $profile->update($update);
        Realtime::send(new ProfileUpdated($profile->user_id, $profile->toPublic()));

        return response()->json(['profile' => $profile->toPublic()]);
    }

    private function storePhoto(string $tmpPath, int $userId): string
    {
        if (! function_exists('imagecreatefromstring')) {
            throw ValidationException::withMessages(['photo' => 'Ekstensi PHP GD belum aktif di server.']);
        }
        $src = @imagecreatefromstring(file_get_contents($tmpPath));
        if (! $src) {
            throw ValidationException::withMessages(['photo' => 'File gambar tidak bisa dibaca.']);
        }

        // potong tengah jadi persegi lalu kecilkan ke 256x256
        $w = imagesx($src);
        $h = imagesy($src);
        $side = min($w, $h);
        $dst = imagecreatetruecolor(256, 256);
        imagecopyresampled($dst, $src, 0, 0, (int) (($w - $side) / 2), (int) (($h - $side) / 2), 256, 256, $side, $side);

        ob_start();
        imagejpeg($dst, null, 82);
        $jpeg = ob_get_clean();
        imagedestroy($src);
        imagedestroy($dst);

        $path = 'vo-avatars/' . $userId . '-' . now()->format('YmdHis') . '.jpg';
        Storage::disk('public')->put($path, $jpeg);

        return $path;
    }
}
