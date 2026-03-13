<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Category::insert([
            ['name' => 'HI', 'slug' => 'hi'],
            ['name' => 'Payroll', 'slug' => 'payroll'],
            ['name' => 'Training', 'slug' => 'training'],
            ['name' => 'HR IT', 'slug' => 'hr-it'],
            ['name' => 'Konseling', 'slug' => 'konseling'],
            ['name' => 'Rekrutmen', 'slug' => 'rekrutmen'],
        ]);
    }
}
