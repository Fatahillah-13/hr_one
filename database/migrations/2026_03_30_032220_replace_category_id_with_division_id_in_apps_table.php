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
            $table->dropConstrainedForeignId('category_id');
            $table->foreignId('division_id')->nullable()->constrained('divisions')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            $table->dropConstrainedForeignId('division_id');
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
        });
    }
};
