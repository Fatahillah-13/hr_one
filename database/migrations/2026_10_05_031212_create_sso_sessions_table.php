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
        Schema::create('sso_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('sid')->index();        // ID sesi dari Keycloak
            $table->string('session_id')->index(); // ID sesi Laravel
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sso_sessions');
    }
};
