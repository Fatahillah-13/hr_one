<?php

namespace App\Support\VirtualOffice;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Kirim event realtime tanpa menggagalkan request.
 * Kalau server Reverb mati, data tetap tersimpan dan user tidak melihat error 500;
 * peringatan dicatat di log maksimal sekali per menit.
 */
final class Realtime
{
    public static function send(object $event, bool $toOthers = false): void
    {
        try {
            $pending = broadcast($event);
            if ($toOthers) {
                $pending->toOthers();
            }
            unset($pending); // event benar-benar dikirim saat objek ini dilepas
        } catch (Throwable $e) {
            if (Cache::add('vo.realtime.warned', true, 60)) {
                Log::warning('[Virtual Office] Reverb tidak bisa dihubungi, update realtime dilewati: '.$e->getMessage());
            }
        }
    }
}
