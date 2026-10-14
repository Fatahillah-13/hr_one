<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Arah duduk karyawan (L/R/T/B) + partisi. Kolom monitor/panel/seat_x/seat_y/chair_side
        // tetap ada, tapi sekarang dihitung otomatis dari facing (lihat Seat::derive()).
        Schema::table('vo_seats', function (Blueprint $t) {
            $t->char('facing', 1)->default('L')->after('zone');
            $t->boolean('has_panel')->default(false)->after('facing');
        });

        foreach (DB::table('vo_seats')->get() as $s) {
            DB::table('vo_seats')->where('id', $s->id)->update([
                'facing' => $s->chair_side ?: 'L',
                'has_panel' => $s->panel !== null,
            ]);
        }

        // Ruangan, dinding, partisi, dan perabot (meja rapat, sofa, lemari, tanaman, ...)
        Schema::create('vo_objects', function (Blueprint $t) {
            $t->id();
            $t->string('type', 30);
            $t->smallInteger('x');
            $t->smallInteger('y');
            $t->unsignedSmallInteger('w');
            $t->unsignedSmallInteger('d');
            $t->unsignedSmallInteger('rotation')->default(0); // 0|90|180|270
            $t->string('label', 40)->nullable();
            $t->unsignedInteger('sort')->default(0);
            $t->timestamps();
        });

        // Draft editor + riwayat denah yang pernah dipublikasikan (untuk kembali ke versi lama)
        Schema::create('vo_layout_versions', function (Blueprint $t) {
            $t->id();
            $t->string('status', 10); // draft|published
            $t->longText('layout');   // JSON {seats:[...], objects:[...]}
            $t->string('note', 120)->nullable();
            $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
            $t->index(['status', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vo_layout_versions');
        Schema::dropIfExists('vo_objects');
        Schema::table('vo_seats', function (Blueprint $t) {
            $t->dropColumn(['facing', 'has_panel']);
        });
    }
};
