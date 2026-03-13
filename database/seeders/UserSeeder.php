<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'username' => 'admin',
            'name' => 'Administrator',
            'email' => 'admin@example.com',
            'avatar' => null,
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
            'remember_token' => null,
            'last_login_at' => null,
            'role_id' => null,
            'division_id' => null,
        ]);
    }
}
