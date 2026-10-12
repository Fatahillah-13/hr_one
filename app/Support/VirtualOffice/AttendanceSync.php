<?php

namespace App\Support\VirtualOffice;

use App\Events\VirtualOffice\ProfileUpdated;
use App\Models\VirtualOffice\Profile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

/**
 * Menghitung status kehadiran hari ini, lalu menyimpannya di vo_profiles.
 * Sumber data (config virtual-office.attendance.source):
 *   api      → web API JPayroll (satu request untuk semua karyawan)
 *   database → tabel log mesin absensi + tabel cuti di database HRD
 *
 * Hasil per karyawan:
 *   leave   → cuti/izin hari ini           (kursi kosong, bubble "Cuti" / "Tidak masuk hari ini")
 *   absent  → belum ada scan hari ini      (kursi kosong, tanpa bubble)
 *   present → sudah scan masuk             (figur duduk walau belum membuka HR One, status "Di kantor")
 *   home    → scan pulang sudah tercatat   (kursi kosong, bubble "Sudah pulang")
 */
class AttendanceSync
{
    /** @return array{checked:int, changed:int, rows:array} */
    public static function run(bool $dryRun = false): array
    {
        $cfg = config('virtual-office.attendance');
        $today = Carbon::today();
        $users = VoAccess::members()->get();

        $results = ($cfg['source'] ?? 'database') === 'api'
            ? self::fromApi($cfg, $users, $today)
            : self::fromDatabase($cfg, $users, $today);

        $rows = [];
        $changed = 0;
        foreach ($results as $userId => $r) {
            $rows[] = ['user_id' => $userId, 'state' => $r['state'], 'label' => $r['label'], 'scans' => $r['scans']];
            if ($dryRun) {
                continue;
            }

            $profile = Profile::forUser($userId);
            $employeeId = $r['employee_id'] ?? $profile->employee_id;
            $dirty = $profile->attendance_state !== $r['state'] || $profile->attendance_label !== $r['label']
                || (int) $profile->employee_id !== (int) $employeeId;
            if ($dirty) {
                $profile->update([
                    'employee_id' => $employeeId,
                    'attendance_state' => $r['state'],
                    'attendance_label' => $r['label'],
                    'attendance_at' => now(),
                ]);
                Realtime::send(new ProfileUpdated($profile->user_id, $profile->toPublic()));
                $changed++;
            }
        }

        return ['checked' => count($rows), 'changed' => $changed, 'rows' => $rows];
    }

    // ------------------------------------------------------------------ API JPayroll

    /** @return array<int, array{state:string, label:?string, scans:int}> */
    private static function fromApi(array $cfg, Collection $users, Carbon $today): array
    {
        $api = $cfg['api'] ?? [];
        if (empty($api['url'])) {
            throw new RuntimeException('VO_ATT_API_URL belum diisi.');
        }

        $userCol = config('virtual-office.employee.user_column', 'username');
        $userByKey = $users->mapWithKeys(fn ($u) => [trim((string) $u->{$userCol}) => $u->id])->filter()->all();

        $request = Http::timeout($api['timeout'] ?? 10)->acceptJson()->withHeaders($api['headers'] ?? []);
        if (! empty($api['token'])) {
            $request = $request->withToken($api['token']);
        }
        $query = ! empty($api['date_param']) ? [$api['date_param'] => $today->toDateString()] : [];

        try {
            $json = $request->get($api['url'], $query)->throw()->json();
        } catch (Throwable $e) {
            throw new RuntimeException('API absensi tidak bisa dibaca: '.$e->getMessage(), 0, $e);
        }
        $list = ! empty($api['list']) ? data_get($json, $api['list']) : $json;
        if (! is_array($list)) {
            throw new RuntimeException("Respons API tidak berisi daftar di '".($api['list'] ?? '')."'. Cek VO_ATT_API_LIST.");
        }

        // kumpulkan per karyawan (mendukung ringkasan per karyawan maupun log scan mentah)
        $per = [];
        foreach ($list as $row) {
            $key = trim((string) data_get($row, $api['key']));
            if ($key === '' || ! isset($userByKey[$key])) {
                continue;
            }
            $p = $per[$key] ??= ['n' => 0, 'first' => null, 'last' => null, 'out' => null, 'leave' => null];

            if ($t = self::time(data_get($row, $api['in']), $today)) {
                $p['n']++;
                $p['first'] = $p['first'] && $p['first']->lt($t) ? $p['first'] : $t;
                $p['last'] = $p['last'] && $p['last']->gt($t) ? $p['last'] : $t;
            }
            if (! empty($api['out']) && ($t = self::time(data_get($row, $api['out']), $today))) {
                $p['out'] = $t;
            }
            if (! empty($api['leave']) && ($l = trim((string) data_get($row, $api['leave']))) !== '') {
                $p['leave'] = $l;
            }
            $per[$key] = $p;
        }

        $homeAfter = Carbon::parse($today->toDateString().' '.$cfg['home_after']);
        $out = [];
        foreach ($userByKey as $key => $userId) {
            $p = $per[$key] ?? null;
            $scans = $p['n'] ?? 0;
            if ($p && $p['leave'] && ! $p['n']) {
                $out[$userId] = ['state' => 'leave', 'label' => self::leaveLabel($cfg, $p['leave']), 'scans' => 0];
            } elseif ($p && $p['out'] && $p['out']->gte($homeAfter)) {
                $out[$userId] = ['state' => 'home', 'label' => 'Sudah pulang', 'scans' => $scans + 1];
            } elseif ($p && empty($api['out']) && $p['n'] >= 2 && $p['last']->gte($homeAfter)) {
                $out[$userId] = ['state' => 'home', 'label' => 'Sudah pulang', 'scans' => $scans]; // log mentah
            } elseif ($p && $p['n']) {
                $out[$userId] = ['state' => 'present', 'label' => null, 'scans' => $scans];
            } else {
                $out[$userId] = ['state' => 'absent', 'label' => null, 'scans' => 0];
            }
        }

        return $out;
    }

    /** "07:31", "07:31:00", "2026-10-04 07:31:00", "2026-10-04T07:31:00+07:00" → Carbon (hari ini kalau tanpa tanggal). */
    private static function time($value, Carbon $today): ?Carbon
    {
        $v = trim((string) $value);
        if ($v === '' || $v === '-' || str_starts_with($v, '00:00:00') || str_starts_with($v, '0000-00-00')) {
            return null;
        }
        try {
            return preg_match('/^\d{1,2}[:.]\d{2}/', $v)
                ? Carbon::parse($today->toDateString().' '.str_replace('.', ':', $v))
                : Carbon::parse($v);
        } catch (Throwable) {
            return null;
        }
    }

    private static function leaveLabel(array $cfg, string $type): string
    {
        $labels = $cfg['leave_labels'] ?? [];

        return $labels[strtolower(trim($type))] ?? ($labels['*'] ?? 'Tidak masuk hari ini');
    }

    // ------------------------------------------------------------------ database HRD

    /** @return array<int, array{state:string, label:?string, scans:int, employee_id:int}> */
    private static function fromDatabase(array $cfg, Collection $users, Carbon $today): array
    {
        $conn = DB::connection($cfg['connection']);
        $employees = EmployeeDirectory::forUsers($users);
        if (! $employees) {
            return [];
        }

        $keyByUser = [];
        foreach ($employees as $userId => $e) {
            $k = $e['att_key'] ?? null;
            if ($k !== null && $k !== '') {
                $keyByUser[$userId] = (string) $k;
            }
        }

        $scans = $conn->table($cfg['log_table'])
            ->whereIn($cfg['log_key'], array_values($keyByUser))
            ->whereBetween($cfg['log_time'], [$today->copy()->startOfDay(), $today->copy()->endOfDay()])
            ->selectRaw("{$cfg['log_key']} as k, COUNT(*) as n, MIN({$cfg['log_time']}) as first_scan, MAX({$cfg['log_time']}) as last_scan")
            ->groupBy($cfg['log_key'])
            ->get()
            ->keyBy(fn ($r) => (string) $r->k);

        $leaves = collect();
        if (! empty($cfg['leave_table'])) {
            $leaves = $conn->table($cfg['leave_table'])
                ->whereIn($cfg['leave_employee'], collect($employees)->pluck('employee_id')->all())
                ->whereDate($cfg['leave_start'], '<=', $today)
                ->whereDate($cfg['leave_end'], '>=', $today)
                ->get([$cfg['leave_employee'].' as employee_id', $cfg['leave_type'].' as type'])
                ->keyBy('employee_id');
        }

        $homeAfter = Carbon::parse($today->toDateString().' '.$cfg['home_after']);
        $out = [];
        foreach ($employees as $userId => $e) {
            $leave = $leaves->get($e['employee_id']);
            $scan = isset($keyByUser[$userId]) ? $scans->get($keyByUser[$userId]) : null;

            if ($leave) {
                $r = ['state' => 'leave', 'label' => self::leaveLabel($cfg, (string) $leave->type)];
            } elseif (! $scan) {
                $r = ['state' => 'absent', 'label' => null];
            } elseif ($scan->n >= 2 && Carbon::parse($scan->last_scan)->gte($homeAfter)) {
                $r = ['state' => 'home', 'label' => 'Sudah pulang'];
            } else {
                $r = ['state' => 'present', 'label' => null];
            }
            $out[$userId] = $r + ['scans' => (int) ($scan->n ?? 0), 'employee_id' => $e['employee_id']];
        }

        return $out;
    }
}
