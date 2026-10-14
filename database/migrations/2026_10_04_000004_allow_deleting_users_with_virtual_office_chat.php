<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * User yang pernah membuat grup / mengirim pesan tetap bisa dihapus dari Settings > Users.
     * Pesannya tetap ada (nama pengirim jadi kosong), bukan error "foreign key".
     * Instalasi baru sudah benar dari migration 000001; ini untuk server yang sudah memasang versi sebelumnya.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return; // test memakai SQLite yang selalu dibuat baru dari 000001
        }

        foreach ([['vo_conversations', 'created_by'], ['vo_messages', 'user_id']] as [$table, $column]) {
            Schema::table($table, function (Blueprint $t) use ($column) {
                $t->dropForeign([$column]);
            });
            Schema::table($table, function (Blueprint $t) use ($column) {
                $t->unsignedBigInteger($column)->nullable()->change();
                $t->foreign($column)->references('id')->on('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        // dibiarkan: aturan lama justru membuat user tidak bisa dihapus
    }
};
