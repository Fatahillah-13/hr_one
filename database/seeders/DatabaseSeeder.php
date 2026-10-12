<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            // Role & divisi dulu, supaya admin langsung mendapat role Admin.
            RolesSeeder::class,
            DivisionsSeeder::class,
            UserSeeder::class,
            CategoriesSeeder::class,
            AppsSeeder::class,
            RoleDivisionAppSeeder::class,
        ]);
    }
}
