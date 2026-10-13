<?php

use App\Http\Controllers\Api\JPayrollAttendanceController;
use App\Http\Controllers\SsoController;
use Illuminate\Support\Facades\Route;

// Dipanggil server-to-server oleh aplikasi tujuan.
// Rate limit: 30 request / menit / IP, untuk mencegah tebak client_secret / code.
Route::post('/sso/exchange', [SsoController::class, 'exchange'])
    ->middleware('throttle:30,1')
    ->name('api.sso.exchange');


Route::middleware('auth')->group(function () {
    // REST API adapter untuk membaca absensi JPayroll
    Route::get('/jpayroll/attendance', [JPayrollAttendanceController::class, 'index'])
        ->middleware('throttle:30,1')
        ->name('api.jpayroll.attendance');
});

