<?php

use App\Http\Controllers\SsoController;
use Illuminate\Support\Facades\Route;

Route::post('/sso/exchange', [SsoController::class, 'exchange'])->name('api.sso.exchange');
