<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Mendaftarkan IT Call sebagai kartu di Beranda untuk semua divisi yang sudah ada.
     * Halaman /it-call sendiri terbuka untuk semua user yang login (tidak bergantung divisi).
     * Divisi yang dibuat nanti bisa dicentang di Settings > Home > IT Call.
     */
    public function up(): void
    {
        $slug = 'it-call';

        if (DB::table('apps')->where('slug', $slug)->exists()) {
            return;
        }

        $appId = DB::table('apps')->insertGetId([
            'name' => 'IT Call',
            'slug' => $slug,
            'description' => 'Laporkan masalah komputer, printer, jaringan, atau absensi ke tim IT lewat WhatsApp.',
            'icon' => 'headset',
            'app_link' => '/it-call',
            'is_active' => true,
            'sort_order' => 0,
            'sso_enabled' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $rows = DB::table('divisions')->pluck('id')->map(fn ($divisionId) => [
            'app_id' => $appId,
            'division_id' => $divisionId,
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();

        if ($rows) {
            DB::table('app_division')->insert($rows);
        }
    }

    public function down(): void
    {
        $appId = DB::table('apps')->where('slug', 'it-call')->value('id');

        if ($appId) {
            DB::table('app_division')->where('app_id', $appId)->delete();
            DB::table('user_recent_apps')->where('app_id', $appId)->delete();
            DB::table('apps')->where('id', $appId)->delete();
        }
    }
};
