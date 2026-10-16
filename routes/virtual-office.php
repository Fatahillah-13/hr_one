<?php

/*
| Route Virtual Office.
| Tambahkan di akhir routes/web.php:
|     require __DIR__.'/virtual-office.php';
| Akses mengikuti kartu aplikasi `virtual-office` di HR One (Settings → Home → divisi).
*/

use App\Http\Controllers\VirtualOffice\ChatController;
use App\Http\Controllers\VirtualOffice\LayoutController;
use App\Http\Controllers\VirtualOffice\OfficeController;
use App\Http\Controllers\VirtualOffice\ProfileController;
use App\Http\Middleware\EnsureVoAdmin;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('virtual-office')->name('vo.')->group(function () {
    Route::get('/', [OfficeController::class, 'index'])->name('index');

    Route::put('/status', [ProfileController::class, 'updateStatus'])->name('status');
    Route::post('/avatar', [ProfileController::class, 'updateAvatar'])->name('avatar');

    Route::get('/conversations', [ChatController::class, 'index'])->name('conversations.index');
    Route::post('/conversations/personal/{user}', [ChatController::class, 'openPersonal'])->name('conversations.personal');
    Route::post('/conversations/group', [ChatController::class, 'storeGroup'])->name('conversations.group');
    Route::post('/conversations/{conversation}/members', [ChatController::class, 'addMembers'])->name('conversations.members.add');
    Route::delete('/conversations/{conversation}', [ChatController::class, 'destroyGroup'])->name('conversations.destroy');
    Route::get('/conversations/{conversation}/messages', [ChatController::class, 'messages'])->name('messages.index');
    Route::post('/conversations/{conversation}/messages', [ChatController::class, 'send'])
        ->middleware('throttle:60,1')->name('messages.send');
    Route::post('/conversations/{conversation}/read', [ChatController::class, 'read'])->name('conversations.read');

    Route::get('/attachments/{message}', [ChatController::class, 'attachment'])->name('attachments.show');

    // Editor Denah (admin saja, atur lewat VO_ADMINS di .env)
    Route::middleware(EnsureVoAdmin::class)->prefix('editor')->name('editor.')->group(function () {
        Route::get('/', [LayoutController::class, 'edit'])->name('edit');
        Route::put('/draft', [LayoutController::class, 'saveDraft'])->name('draft');
        Route::post('/publish', [LayoutController::class, 'publish'])->name('publish');
        Route::get('/versions/{version}', [LayoutController::class, 'version'])->name('version');
    });
});
