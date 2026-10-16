<?php

use App\Http\Controllers\Api\JPayrollAttendanceController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    // REST API adapter untuk membaca absensi JPayroll
    Route::get('/jpayroll/attendance', [JPayrollAttendanceController::class, 'index'])
        ->middleware('throttle:30,1')
        ->name('api.jpayroll.attendance');
});

