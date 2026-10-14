<?php

namespace App\Console\Commands;

use App\Models\App;
use App\Models\VirtualOffice\OfficeObject;
use App\Models\VirtualOffice\Seat;
use App\Support\VirtualOffice\AttendanceSync;
use App\Support\VirtualOffice\EmployeeDirectory;
use App\Support\VirtualOffice\VoAccess;
use Illuminate\Console\Command;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Throwable;

/** Cek cepat apakah Virtual Office terpasang lengkap. Aman dijalankan kapan saja (tidak mengubah data). */
class VoDoctor extends Command
{
    protected $signature = 'vo:doctor';

    protected $description = 'Virtual Office: cek instalasi (database, akses, realtime, HRD, absensi, jadwal)';

    private int $fail = 0;

    private int $warn = 0;

    public function handle(Schedule $schedule): int
    {
        $this->line('<options=bold>Virtual Office - cek instalasi</>');

        // 1. database
        $tables = ['vo_seats', 'vo_profiles', 'vo_conversations', 'vo_conversation_user', 'vo_messages', 'vo_objects', 'vo_layout_versions'];
        $missing = array_filter($tables, fn ($t) => ! Schema::hasTable($t));
        $this->check(! $missing, 'Tabel database', $missing ? 'belum ada: '.implode(', ', $missing).' (jalankan php artisan migrate)' : count($tables).' tabel');
        if ($missing) {
            return $this->summary();
        }
        $this->check(Schema::hasColumn('vo_profiles', 'attendance_state'), 'Migration integrasi HR One', 'kolom absensi di vo_profiles');
        $this->check(Seat::exists(), 'Denah', Seat::count().' meja, '.Seat::whereNotNull('user_id')->count().' terisi, '.OfficeObject::count().' perabot', warnOnly: true);

        // 2. akses
        $app = App::where('slug', config('virtual-office.app_slug'))->first();
        $this->check((bool) $app, 'Aplikasi di Settings > Apps', $app ? "slug {$app->slug}, ".($app->is_active ? 'aktif' : 'NONAKTIF').', '.$app->divisions()->count().' divisi' : 'baris apps tidak ditemukan');
        $this->check(VoAccess::members()->exists(), 'Karyawan yang punya akses', VoAccess::members()->count().' user', warnOnly: true);

        // 3. route & jadwal
        $this->check(Route::has('vo.index'), 'Route /virtual-office', Route::has('vo.index') ? 'terdaftar' : 'tambahkan require routes/virtual-office.php di routes/web.php');
        $cmds = collect($schedule->events())->map(fn ($e) => (string) $e->command)->implode(' ');
        $sched = str_contains($cmds, 'vo:expire-bubbles') && str_contains($cmds, 'vo:sync-attendance');
        $this->check($sched, 'Jadwal (scheduler)', $sched ? 'vo:expire-bubbles & vo:sync-attendance' : 'tambahkan require routes/console-virtual-office.php di routes/console.php');
        $channels = base_path('routes/channels.php');
        $hasChannels = is_file($channels) && str_contains((string) file_get_contents($channels), 'channels-virtual-office.php');
        $authRoute = collect(Route::getRoutes()->getRoutes())->contains(fn ($r) => $r->uri() === 'broadcasting/auth');
        $this->check($authRoute, 'Route broadcasting/auth', $authRoute ? 'terdaftar' : "bootstrap/app.php belum memuat channels: __DIR__.'/../routes/channels.php'");
        $this->check($hasChannels, 'Channel realtime', $hasChannels ? 'routes/channels.php memuat channels-virtual-office.php' : 'tambahkan require di routes/channels.php');

        // 4. realtime (Reverb)
        $driver = config('broadcasting.default');
        $this->check($driver === 'reverb', 'BROADCAST_CONNECTION', (string) $driver);
        $host = (string) config('reverb.apps.apps.0.options.host', config('broadcasting.connections.reverb.options.host'));
        $port = (int) config('reverb.apps.apps.0.options.port', config('broadcasting.connections.reverb.options.port', 8080));
        if ($driver === 'reverb' && $host) {
            $sock = @fsockopen($host, $port, $errno, $errstr, 2);
            $this->check((bool) $sock, 'Server Reverb', $sock ? "terhubung ke {$host}:{$port}" : "tidak bisa dihubungi di {$host}:{$port} ({$errstr}) - cek task 'HR One Reverb'");
            if ($sock) {
                fclose($sock);
            }
            $this->check(! in_array($host, ['localhost', '127.0.0.1'], true), 'REVERB_HOST untuk PC karyawan', $host.(in_array($host, ['localhost', '127.0.0.1'], true) ? ' - PC lain tidak bisa terhubung, isi IP server' : ''), warnOnly: true);
        }

        // 5. storage foto profil
        $this->check(is_dir(public_path('storage')), 'storage:link', is_dir(public_path('storage')) ? 'ada' : 'jalankan php artisan storage:link', warnOnly: true);
        $this->check(extension_loaded('gd'), 'PHP extension gd', extension_loaded('gd') ? 'aktif' : 'aktifkan extension=gd di php.ini (dipakai untuk foto avatar)', warnOnly: true);

        // 6. data karyawan HRD
        if (config('virtual-office.employee.enabled')) {
            try {
                $users = VoAccess::members()->get();
                $matched = count(EmployeeDirectory::forUsers($users));
                $this->check($matched > 0, 'Data karyawan HRD', "{$matched} dari {$users->count()} user cocok (".config('virtual-office.employee.user_column').' = hrd.employees.'.config('virtual-office.employee.employee_column').')', warnOnly: true);
            } catch (Throwable $e) {
                $this->check(false, 'Data karyawan HRD', $e->getMessage(), warnOnly: true);
            }
        }

        // 7. absensi
        if (config('virtual-office.attendance.enabled')) {
            try {
                $res = AttendanceSync::run(true);
                $states = collect($res['rows'])->countBy('state')->map(fn ($n, $s) => "{$s} {$n}")->implode(', ');
                $src = config('virtual-office.attendance.source');
                $this->check($res['checked'] > 0, "Absensi ({$src})", "{$res['checked']} karyawan dicek ({$states})", warnOnly: true);
            } catch (Throwable $e) {
                $this->check(false, 'Absensi ('.config('virtual-office.attendance.source').')', 'gagal: '.$e->getMessage().' - periksa VO_ATT_* di .env');
            }
        } else {
            $this->check(true, 'Absensi', 'belum diaktifkan (VO_ATTENDANCE_ENABLED=false)');
        }

        return $this->summary();
    }

    private function check(bool $ok, string $label, string $detail, bool $warnOnly = false): void
    {
        if ($ok) {
            $this->line("  <fg=green>OK</>    {$label}: {$detail}");
        } elseif ($warnOnly) {
            $this->warn++;
            $this->line("  <fg=yellow>CEK</>   {$label}: {$detail}");
        } else {
            $this->fail++;
            $this->line("  <fg=red>GAGAL</> {$label}: {$detail}");
        }
    }

    private function summary(): int
    {
        $this->newLine();
        if ($this->fail) {
            $this->error("{$this->fail} masalah harus diperbaiki, {$this->warn} perlu dicek.");

            return self::FAILURE;
        }
        $this->info($this->warn ? "Siap dipakai, {$this->warn} hal perlu dicek." : 'Semua siap.');

        return self::SUCCESS;
    }
}
