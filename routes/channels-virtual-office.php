<?php

/*
| Channel realtime Virtual Office.
| Tambahkan di akhir routes/channels.php:
|     require __DIR__.'/channels-virtual-office.php';
*/

use App\Models\VirtualOffice\Conversation;
use App\Support\VirtualOffice\VoAccess;
use Illuminate\Support\Facades\Broadcast;

// Presence channel lantai kantor: daftar siapa yang sedang online + update status/avatar.
// Hanya user yang punya akses aplikasi Virtual Office (Settings > Apps).
Broadcast::channel('vo.office', function ($user) {
    return VoAccess::canUse($user) ? ['id' => $user->id, 'name' => $user->name] : false;
});

// Channel pribadi tiap user: pesan baru, grup baru, tanda dibaca.
Broadcast::channel('vo.user.{id}', function ($user, int $id) {
    return (int) $user->id === $id;
});

// Channel percakapan: hanya untuk indikator "sedang mengetik" (whisper).
Broadcast::channel('vo.conversation.{id}', function ($user, int $id) {
    $c = Conversation::find($id);

    return $c && $c->hasMember($user->id);
});
