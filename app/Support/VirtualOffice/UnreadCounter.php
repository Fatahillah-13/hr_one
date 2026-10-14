<?php

namespace App\Support\VirtualOffice;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/** Jumlah pesan Virtual Office yang belum dibaca, untuk badge di header HR One. */
class UnreadCounter
{
    public static function for(int $userId): int
    {
        try {
            if (! Schema::hasTable('vo_messages')) {
                return 0;
            }

            return (int) DB::table('vo_messages as m')
                ->join('vo_conversation_user as cu', function ($j) use ($userId) {
                    $j->on('cu.conversation_id', '=', 'm.conversation_id')->where('cu.user_id', '=', $userId);
                })
                ->where('m.user_id', '!=', $userId)
                ->where(fn ($q) => $q->whereNull('cu.last_read_message_id')->orWhereColumn('m.id', '>', 'cu.last_read_message_id'))
                ->count();
        } catch (Throwable) {
            return 0;
        }
    }
}
