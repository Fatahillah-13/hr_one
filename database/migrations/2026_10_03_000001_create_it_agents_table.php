<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Agent IT Call: tujuan WhatsApp laporan IT dan status kerjanya. */
    public function up(): void
    {
        Schema::create('it_agents', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('role', 100)->nullable();
            $table->string('wa_number', 20);
            // Akun HR One milik agent: akun ini bisa mengganti status kerjanya sendiri.
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->string('status', 20)->default('ready');
            $table->string('status_note', 60)->nullable();
            $table->timestamp('status_changed_at')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('it_agents');
    }
};
