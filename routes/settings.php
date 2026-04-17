<?php

use App\Http\Controllers\AppManagementController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'admin'])
    ->get('/settings', [SettingsController::class, 'index'])
    ->name('settings');

Route::middleware(['auth', 'admin'])->group(function () {
    // Custom routes harus sebelum resource agar tidak tertangkap oleh {user} param
    Route::post('settings/users/import', [UserManagementController::class, 'import'])->name('users.import');
    Route::get('settings/users/download-template', [UserManagementController::class, 'downloadTemplate'])->name('users.download-template');

    // Keep route names as users.* to avoid breaking existing frontend calls.
    Route::resource('settings/users', UserManagementController::class)->names('users');
    Route::resource('settings/apps', AppManagementController::class)->names('settings.apps');
});
