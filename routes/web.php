<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Hrd\EmployeeController as HrdEmployeeController;
use App\Http\Controllers\ItCallController;
use App\Http\Controllers\SsoController;
use Illuminate\Support\Facades\Route;

Route::get('/', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

require __DIR__.'/settings.php';

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// ---- Modul HRD (membaca database sistem HRD lama) ----
Route::middleware(['auth', 'app.access:'.config('hrd.employees_app_slug')])
    ->prefix('hrd')
    ->name('hrd.')
    ->group(function () {
        Route::get('/employees', [HrdEmployeeController::class, 'index'])->name('employees.index');
        Route::get('/employees/{id}', [HrdEmployeeController::class, 'show'])->whereNumber('id')->name('employees.show');
    });

require __DIR__.'/auth.php';

// ---- Virtual Office (chat & lantai kantor) ----
require __DIR__.'/virtual-office.php';
