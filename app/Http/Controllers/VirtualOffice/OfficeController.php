<?php

namespace App\Http\Controllers\VirtualOffice;

use App\Http\Controllers\Controller;
use App\Models\VirtualOffice\OfficeObject;
use App\Models\VirtualOffice\Profile;
use App\Models\VirtualOffice\Seat;
use App\Support\VirtualOffice\EmployeeDirectory;
use App\Support\VirtualOffice\VoAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OfficeController extends Controller
{
    public function index(Request $request): Response
    {
        $me = $request->user();
        Profile::forUser($me->id);

        $seats = Seat::orderBy('code')->get(Seat::PUBLIC_COLUMNS);
        $seatByUser = $seats->whereNotNull('user_id')->keyBy('user_id');
        $profiles = Profile::all()->keyBy('user_id');

        // Karyawan = user HR One yang aktif dan punya akses Virtual Office (Settings > Apps)
        $users = VoAccess::members()
            ->with(method_exists(\App\Models\User::class, 'division') ? ['division'] : [])
            ->orderBy('name')
            ->get();
        $employees = EmployeeDirectory::forUsers($users);

        return Inertia::render('VirtualOffice/Index', [
            'me' => ['id' => $me->id, 'name' => $me->name],
            'users' => $users->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'seat_code' => $seatByUser->get($u->id)?->code,
                'zone' => $seatByUser->get($u->id)?->zone,
                'division' => $u->relationLoaded('division') ? $u->division?->name : null,
                'employee' => isset($employees[$u->id]) ? array_intersect_key($employees[$u->id], array_flip(['nik', 'department', 'job_level', 'bagian'])) : null,
                'photo_url' => $employees[$u->id]['photo_url'] ?? $this->hrAvatar($u->avatar ?? null),
                'profile' => ($profiles->get($u->id) ?? new Profile(['user_id' => $u->id]))->toPublic(),
            ])->values(),
            'seats' => $seats,
            'objects' => OfficeObject::orderBy('sort')->get(OfficeObject::PUBLIC_COLUMNS),
            'canEdit' => VoAccess::isAdmin($me),
        ]);
    }

    /** Kolom `avatar` di users HR One: URL penuh, path, atau file di storage publik. */
    private function hrAvatar(?string $avatar): ?string
    {
        if (! $avatar) {
            return null;
        }
        if (str_starts_with($avatar, 'http') || str_starts_with($avatar, '/')) {
            return $avatar;
        }

        return Storage::disk('public')->url($avatar);
    }
}
