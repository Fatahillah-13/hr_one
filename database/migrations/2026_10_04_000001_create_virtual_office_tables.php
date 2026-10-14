<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Meja di denah. Tahap 1 diisi lewat seeder, tahap 2 lewat Editor Denah.
        Schema::create('vo_seats', function (Blueprint $t) {
            $t->id();
            $t->string('code', 20)->unique();           // contoh: A-1
            $t->string('zone', 10);                      // A, B, C, ...
            $t->smallInteger('x');                       // posisi meja (unit denah)
            $t->smallInteger('y');
            $t->unsignedSmallInteger('w')->default(52);
            $t->unsignedSmallInteger('d')->default(40);
            $t->string('monitor', 10)->default('right'); // right|left|top|bottom|none
            $t->string('panel', 4)->nullable();          // xr|yb|yt (partisi)
            $t->boolean('is_printer')->default(false);
            $t->smallInteger('seat_x')->nullable();      // titik duduk karyawan
            $t->smallInteger('seat_y')->nullable();
            $t->char('chair_side', 1)->nullable();       // L|R|T|B arah sandaran kursi
            $t->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });

        Schema::create('vo_profiles', function (Blueprint $t) {
            $t->foreignId('user_id')->primary()->constrained('users')->cascadeOnDelete();
            $t->string('status', 10)->default('online');  // online|rapat|sibuk|offline
            $t->string('bubble', 40)->nullable();
            $t->timestamp('bubble_expires_at')->nullable();
            $t->string('avatar_mode', 10)->default('initial'); // initial|photo|character
            $t->string('avatar_path')->nullable();
            $t->json('avatar_config')->nullable();
            $t->timestamps();
        });

        Schema::create('vo_conversations', function (Blueprint $t) {
            $t->id();
            $t->string('type', 10);                       // personal|group
            $t->string('name', 60)->nullable();
            $t->string('personal_key', 40)->nullable()->unique(); // "3-17" agar chat personal tidak dobel
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });

        Schema::create('vo_conversation_user', function (Blueprint $t) {
            $t->id();
            $t->foreignId('conversation_id')->constrained('vo_conversations')->cascadeOnDelete();
            $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $t->unsignedBigInteger('last_read_message_id')->nullable();
            $t->boolean('is_admin')->default(false);
            $t->timestamps();
            $t->unique(['conversation_id', 'user_id']);
        });

        Schema::create('vo_messages', function (Blueprint $t) {
            $t->id();
            $t->foreignId('conversation_id')->constrained('vo_conversations')->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->text('body')->nullable();
            $t->string('attachment_path')->nullable();
            $t->string('attachment_name')->nullable();
            $t->string('attachment_mime', 100)->nullable();
            $t->unsignedInteger('attachment_size')->nullable();
            $t->timestamps();
            $t->index(['conversation_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vo_messages');
        Schema::dropIfExists('vo_conversation_user');
        Schema::dropIfExists('vo_conversations');
        Schema::dropIfExists('vo_profiles');
        Schema::dropIfExists('vo_seats');
    }
};
