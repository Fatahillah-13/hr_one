<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Satu baris per (user, app): "recent apps" cukup menyimpan kapan terakhir dibuka.
     */
    public function up(): void
    {
        // Buang duplikat lama (jika ada), sisakan baris terbaru per user+app.
        $duplicates = DB::table('user_recent_apps')
            ->select('user_id', 'app_id', DB::raw('MAX(id) as keep_id'))
            ->groupBy('user_id', 'app_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $row) {
            DB::table('user_recent_apps')
                ->where('user_id', $row->user_id)
                ->where('app_id', $row->app_id)
                ->where('id', '<>', $row->keep_id)
                ->delete();
        }

        Schema::table('user_recent_apps', function (Blueprint $table) {
            $table->unique(['user_id', 'app_id']);
            $table->index(['user_id', 'opened_at']);
        });
    }

    public function down(): void
    {
        Schema::table('user_recent_apps', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'opened_at']);
            $table->dropUnique(['user_id', 'app_id']);
        });
    }
};
