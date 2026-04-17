<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            $table->boolean('sso_enabled')->default(false)->after('app_link');
            $table->string('sso_client_id')->nullable()->unique()->after('sso_enabled');
            $table->string('sso_redirect_uri')->nullable()->after('sso_client_id');
            $table->string('sso_client_secret_hash')->nullable()->after('sso_redirect_uri');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            $table->dropUnique(['sso_client_id']);
            $table->dropColumn([
                'sso_enabled',
                'sso_client_id',
                'sso_redirect_uri',
                'sso_client_secret_hash',
            ]);
        });
    }
};
