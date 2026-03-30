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
        Schema::create('app_division', function (Blueprint $table) {
            $table->id();
            $table->foreignId('app_id')->constrained()->cascadeOnDelete();
            $table->foreignId('division_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['app_id', 'division_id']);
        });

        // Remove the old division_id column from apps table
        if (Schema::hasColumn('apps', 'division_id')) {
            Schema::table('apps', function (Blueprint $table) {
                $table->dropConstrainedForeignId('division_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            $table->foreignId('division_id')->nullable()->constrained('divisions')->nullOnDelete();
        });

        Schema::dropIfExists('app_division');
    }
};
