<?php

namespace App\Console\Commands;

use App\Events\VirtualOffice\ProfileUpdated;
use App\Models\VirtualOffice\Profile;
use App\Support\VirtualOffice\Realtime;
use Illuminate\Console\Command;

/** Hapus bubble status yang sudah lewat waktunya dan kabari lantai. Dijadwalkan tiap menit. */
class VoExpireBubbles extends Command
{
    protected $signature = 'vo:expire-bubbles';

    protected $description = 'Virtual Office: hapus bubble status yang kedaluwarsa';

    public function handle(): int
    {
        $expired = Profile::whereNotNull('bubble_expires_at')
            ->where('bubble_expires_at', '<=', now())
            ->get();

        foreach ($expired as $profile) {
            $profile->update(['bubble' => null, 'bubble_expires_at' => null]);
            Realtime::send(new ProfileUpdated($profile->user_id, $profile->toPublic()));
        }

        $this->info("{$expired->count()} bubble dihapus.");

        return self::SUCCESS;
    }
}
