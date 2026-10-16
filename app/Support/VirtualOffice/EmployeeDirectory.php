<?php

namespace App\Support\VirtualOffice;

use App\Models\Hrd\Employee;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Menghubungkan user HR One dengan data karyawan di database HRD (read-only).
 * Hasil di-cache beberapa menit supaya lantai tetap ringan walau dibuka banyak orang.
 */
class EmployeeDirectory
{
    /**
     * @param  Collection  $users  model User HR One
     * @return array<int, array{employee_id:int, nik:?string, finger_id:mixed, att_key:mixed, department:?string, job_level:?string, bagian:?string, photo_url:?string}>
     */
    public static function forUsers(Collection $users): array
    {
        $cfg = config('virtual-office.employee');
        if (! ($cfg['enabled'] ?? false) || ! class_exists(Employee::class)) {
            return [];
        }

        $userCol = $cfg['user_column'];
        $keys = $users->pluck($userCol, 'id')->filter()->map(fn ($v) => trim((string) $v));
        if ($keys->isEmpty()) {
            return [];
        }

        // kolom karyawan yang dicocokkan dengan log mesin absensi (lihat virtual-office.attendance.employee_key)
        $attCol = (string) config('virtual-office.attendance.employee_key', 'finger_id');
        $cacheKey = 'vo.employees.'.md5($attCol.'|'.$keys->sort()->implode(','));
        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return $cached;
        }

        try {
            $empCol = $cfg['employee_column'];
            $employees = Employee::query()
                ->with(['department:id,department', 'job:id,job_level'])
                ->whereIn($empCol, $keys->values()->all())
                ->get()
                ->keyBy(fn ($e) => trim((string) $e->{$empCol}));

            $out = [];
            foreach ($keys as $userId => $key) {
                $e = $employees->get($key);
                if (! $e) {
                    continue;
                }
                $out[$userId] = [
                    'employee_id' => (int) $e->id,
                    'nik' => $e->number_of_employees,
                    'finger_id' => $e->finger_id,
                    'att_key' => $attCol === 'id' ? $e->id : $e->getAttribute($attCol),
                    'department' => $e->department?->department,
                    'job_level' => $e->job?->job_level,
                    'bagian' => $e->bagian,
                    'date_of_birth' => $e->date_of_birth ? (is_string($e->date_of_birth) ? substr($e->date_of_birth, 0, 10) : $e->date_of_birth->format('Y-m-d')) : null,
                    'photo_url' => self::photoUrl($cfg['photo_url'] ?? null, $e),
                ];
            }
            Cache::put($cacheKey, $out, now()->addMinutes($cfg['cache_minutes'] ?? 10));

            return $out;
        } catch (Throwable $ex) {
            // database HRD sedang tidak bisa dibaca: lantai tetap jalan tanpa data karyawan,
            // dicoba lagi 1 menit kemudian (bukan menunggu cache 10 menit).
            Log::warning('[Virtual Office] Gagal membaca data karyawan HRD: '.$ex->getMessage());
            Cache::put($cacheKey, [], now()->addMinute());

            return [];
        }
    }

    private static function photoUrl(?string $template, $e): ?string
    {
        if (! $template) {
            return null;
        }

        return strtr($template, [
            '{nik}' => rawurlencode((string) $e->number_of_employees),
            '{id}' => (string) $e->id,
            '{finger_id}' => rawurlencode((string) $e->finger_id),
        ]);
    }
}
