<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\VirtualOffice\AttendanceSync;
use Illuminate\Console\Command;
use Throwable;

/**
 * Perbarui status kehadiran karyawan di Virtual Office dari data absensi.
 *   php artisan vo:sync-attendance            simpan + kirim ke layar semua orang
 *   php artisan vo:sync-attendance --dry-run  hanya tampilkan hasil (untuk cek konfigurasi)
 */
class VoSyncAttendance extends Command
{
    protected $signature = 'vo:sync-attendance {--dry-run : Tampilkan hasil tanpa menyimpan}';

    protected $description = 'Virtual Office: status kehadiran dari data absensi';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');
        if (! config('virtual-office.attendance.enabled') && ! $dry) {
            $this->line('Dilewati: VO_ATTENDANCE_ENABLED=false. Cek dulu dengan --dry-run.');

            return self::SUCCESS;
        }

        try {
            $res = AttendanceSync::run($dry);
        } catch (Throwable $e) {
            $this->error('Gagal membaca data absensi: '.$e->getMessage());
            $this->line('Periksa VO_ATT_* di .env (nama tabel & kolom), lihat README bagian Absensi.');

            return self::FAILURE;
        }

        if ($dry) {
            $names = User::whereIn('id', array_column($res['rows'], 'user_id'))->pluck('name', 'id');
            $this->table(['User', 'Status', 'Label', 'Jumlah scan'], array_map(fn ($r) => [
                $names[$r['user_id']] ?? $r['user_id'], $r['state'], $r['label'] ?? '-', $r['scans'],
            ], $res['rows']));
            $this->info("{$res['checked']} karyawan terhubung ke data HRD (mode cek, tidak disimpan).");

            return self::SUCCESS;
        }

        $this->info("{$res['checked']} karyawan dicek, {$res['changed']} status berubah.");

        return self::SUCCESS;
    }
}
