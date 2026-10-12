<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 1) Daftarkan Virtual Office sebagai aplikasi HR One (kartu Beranda + hak akses per divisi),
     *    otomatis untuk semua divisi yang sudah ada.
     * 2) Kolom data karyawan & status absensi di vo_profiles.
     */
    public function up(): void
    {
        Schema::table('vo_profiles', function (Blueprint $t) {
            $t->unsignedBigInteger('employee_id')->nullable()->after('user_id'); // hrd.employees.id
            $t->string('attendance_state', 12)->nullable()->after('avatar_config'); // present|home|leave|absent
            $t->string('attendance_label', 40)->nullable()->after('attendance_state');
            $t->timestamp('attendance_at')->nullable()->after('attendance_label');
        });

        $slug = 'virtual-office';
        if (! Schema::hasTable('apps') || DB::table('apps')->where('slug', $slug)->exists()) {
            return;
        }

        $row = [
            'name' => 'Virtual Office',
            'slug' => $slug,
            'description' => 'Lantai kantor virtual: lihat siapa yang ada, status, dan chat pribadi atau grup.',
            'icon' => 'chat',
            'app_link' => '/virtual-office',
            'is_active' => true,
            'sso_enabled' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if (Schema::hasColumn('apps', 'sort_order')) {
            $row['sort_order'] = 0;
        }
        $appId = DB::table('apps')->insertGetId($row);

        if (Schema::hasTable('divisions') && Schema::hasTable('app_division')) {
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
    }

    public function down(): void
    {
        Schema::table('vo_profiles', function (Blueprint $t) {
            $t->dropColumn(['employee_id', 'attendance_state', 'attendance_label', 'attendance_at']);
        });

        $appId = DB::table('apps')->where('slug', 'virtual-office')->value('id');
        if ($appId) {
            DB::table('app_division')->where('app_id', $appId)->delete();
            if (Schema::hasTable('user_recent_apps')) {
                DB::table('user_recent_apps')->where('app_id', $appId)->delete();
            }
            DB::table('apps')->where('id', $appId)->delete();
        }
    }
};
