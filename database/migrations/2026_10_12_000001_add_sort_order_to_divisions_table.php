<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('divisions', function (Blueprint $table) {
            $table->integer('sort_order')->default(0)->after('slug');
        });

        // Inisialisasi nomor urutan awal berdasarkan ID yang ada
        $divisions = DB::table('divisions')->orderBy('id')->get();
        foreach ($divisions as $index => $div) {
            DB::table('divisions')->where('id', $div->id)->update(['sort_order' => $index + 1]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('divisions', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};
