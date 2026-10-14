<?php

/*
| Jadwal Virtual Office (Laravel 11+).
| Tambahkan di akhir routes/console.php:
|     require __DIR__.'/console-virtual-office.php';
| Lalu pastikan scheduler jalan (Windows Task Scheduler tiap 1 menit):
|     php artisan schedule:run
*/

use Illuminate\Support\Facades\Schedule;

Schedule::command('vo:expire-bubbles')->everyMinute()->withoutOverlapping();

// Status kehadiran dari absensi (aktif kalau VO_ATTENDANCE_ENABLED=true).
// Jalan sepanjang hari supaya status kemarin otomatis hilang lewat tengah malam.
Schedule::command('vo:sync-attendance')->everyFiveMinutes()->withoutOverlapping();

// Reset status kehadiran tepat jam 00:00 setiap hari
Schedule::call(function () {
    \App\Support\VirtualOffice\AttendanceSync::resetDaily();
})->dailyAt('00:00')->name('vo-daily-attendance-reset');
