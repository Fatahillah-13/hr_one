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

        $todayStr = now()->format('m-d');
        $curMonth = now()->format('m');
        $curYear = (int) now()->year;

        $birthdayUsers = [];
        $todayBirthdays = [];
        $thisMonthBirthdays = [];
        $upcomingBirthdays = [];

        foreach ($users as $u) {
            $dobRaw = $u->birth_date ? $u->birth_date->format('Y-m-d') : ($employees[$u->id]['date_of_birth'] ?? null);
            if (! $dobRaw) {
                continue;
            }
            try {
                $dob = \Carbon\Carbon::parse($dobRaw)->locale('id');
                $isToday = $dob->format('m-d') === $todayStr;
                $isThisMonth = $dob->format('m') === $curMonth;

                $next = $dob->copy()->year($curYear)->startOfDay();
                if ($next->isPast() && ! $isToday) {
                    $next->addYear();
                }
                $daysLeft = (int) now()->startOfDay()->diffInDays($next, false);
                $age = (int) $dob->age + ($isToday ? 0 : 1);

                $bdayData = [
                    'user_id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'photo_url' => $employees[$u->id]['photo_url'] ?? $this->hrAvatar($u->avatar ?? null),
                    'division' => $u->relationLoaded('division') ? $u->division?->name : null,
                    'department' => $employees[$u->id]['department'] ?? null,
                    'job_level' => $employees[$u->id]['job_level'] ?? null,
                    'seat_code' => $seatByUser->get($u->id)?->code,
                    'zone' => $seatByUser->get($u->id)?->zone,
                    'birth_date' => $dob->format('Y-m-d'),
                    'birth_day_month' => $dob->translatedFormat('d F'),
                    'age' => $age,
                    'days_left' => $daysLeft,
                    'is_today' => $isToday,
                ];

                $birthdayUsers[$u->id] = $bdayData;

                if ($isToday) {
                    $todayBirthdays[] = $bdayData;
                }
                if ($isThisMonth) {
                    $thisMonthBirthdays[] = $bdayData;
                }
                if ($daysLeft >= 0 && $daysLeft <= 30) {
                    $upcomingBirthdays[] = $bdayData;
                }
            } catch (\Throwable $e) {
                // abaikan format tanggal tidak valid
            }
        }

        usort($todayBirthdays, fn ($a, $b) => strcmp($a['name'], $b['name']));
        usort($thisMonthBirthdays, fn ($a, $b) => $a['days_left'] <=> $b['days_left']);
        usort($upcomingBirthdays, fn ($a, $b) => $a['days_left'] <=> $b['days_left']);

        return Inertia::render('VirtualOffice/Index', [
            'me' => [
                'id' => $me->id,
                'name' => $me->name,
                'isAdmin' => VoAccess::isAdmin($me),
            ],
            'users' => $users->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'seat_code' => $seatByUser->get($u->id)?->code,
                'zone' => $seatByUser->get($u->id)?->zone,
                'division' => $u->relationLoaded('division') ? $u->division?->name : null,
                'employee' => isset($employees[$u->id]) ? array_intersect_key($employees[$u->id], array_flip(['nik', 'department', 'job_level', 'bagian', 'date_of_birth'])) : null,
                'photo_url' => $employees[$u->id]['photo_url'] ?? $this->hrAvatar($u->avatar ?? null),
                'profile' => ($profiles->get($u->id) ?? new Profile(['user_id' => $u->id]))->toPublic(),
                'birthday' => $birthdayUsers[$u->id] ?? null,
                'is_birthday_today' => $birthdayUsers[$u->id]['is_today'] ?? false,
            ])->values(),
            'seats' => $seats,
            'objects' => OfficeObject::orderBy('sort')->get(OfficeObject::PUBLIC_COLUMNS),
            'canEdit' => VoAccess::isAdmin($me),
            'birthdays' => [
                'today' => $todayBirthdays,
                'this_month' => $thisMonthBirthdays,
                'upcoming' => $upcomingBirthdays,
                'month_name' => now()->locale('id')->translatedFormat('F'),
            ],
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
