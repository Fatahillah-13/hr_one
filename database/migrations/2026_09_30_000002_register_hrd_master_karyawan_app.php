<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Mendaftarkan modul Master Karyawan ke launcher HR One.
     * Aksesnya diatur lewat divisi (Settings > Apps). Jika divisi dengan slug "hrd"
     * (HRD Master) ada, modul langsung dipasangkan ke divisi itu. Admin selalu bisa akses.
     */
    public function up(): void
    {
        $slug = 'hrd-master-karyawan';

        if (DB::table('apps')->where('slug', $slug)->exists()) {
            return;
        }

        $appId = DB::table('apps')->insertGetId([
            'name' => 'Master Karyawan',
            'slug' => $slug,
            'description' => 'Data induk karyawan dari sistem HRD: pencarian, filter, dan profil lengkap.',
            'icon' => null,
            'app_link' => '/hrd/employees',
            'is_active' => true,
            'sort_order' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $hrdDivisionId = DB::table('divisions')->where('slug', 'hrd')->value('id');

        if ($hrdDivisionId) {
            DB::table('app_division')->insert([
                'app_id' => $appId,
                'division_id' => $hrdDivisionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('apps')->where('slug', 'hrd-master-karyawan')->delete();
    }
};
