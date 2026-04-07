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
        Schema::create('sso_login_handoffs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('app_id')->constrained('apps')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('code_hash', 64);
            $table->string('state', 100);
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->string('created_by_ip', 45)->nullable();
            $table->timestamps();

            $table->unique(['app_id', 'code_hash']);
            $table->index(['app_id', 'state']);
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sso_login_handoffs');
    }
};
