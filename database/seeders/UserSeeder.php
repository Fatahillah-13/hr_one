<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Membuat akun admin awal.
     * Password diambil dari SEED_ADMIN_PASSWORD di .env. Jika kosong, dibuat acak
     * dan ditampilkan sekali di terminal. Tidak ada lagi password default.
     */
    public function run(): void
    {
        if (User::where('username', 'admin')->exists()) {
            $this->command?->warn('User "admin" sudah ada, dilewati.');

            return;
        }

        $password = env('SEED_ADMIN_PASSWORD') ?: Str::password(16, symbols: false);

        User::create([
            'username' => 'admin',
            'name' => 'Administrator',
            'email' => 'admin@example.com',
            'email_verified_at' => now(),
            'password' => $password,
            'role_id' => Role::where('name', Role::ADMIN)->value('id'),
            'division_id' => null,
            'is_active' => true,
        ]);

        if (! env('SEED_ADMIN_PASSWORD')) {
            $this->command?->info("Password admin awal: {$password}  (segera ganti setelah login)");
        }
    }
}
