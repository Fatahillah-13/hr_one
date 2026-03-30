<?php

use App\Http\Controllers\AppManagementController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->get('/settings', [SettingsController::class, 'index'])
    ->name('settings');

Route::middleware(['auth'])->group(function () {
    // Keep route names as users.* to avoid breaking existing frontend calls.
    Route::resource('settings/users', UserManagementController::class)->names('users');
    Route::resource('settings/apps', AppManagementController::class)->names('settings.apps');
});
