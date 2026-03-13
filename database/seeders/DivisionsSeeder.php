<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Division;

class DivisionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Division::insert([
            ['name' => 'Human Industrial', 'slug' => 'hi'],
            ['name' => 'Payroll', 'slug' => 'payroll'],
            ['name' => 'IT', 'slug' => 'it'],
            ['name' => 'OD Training', 'slug' => 'od-training'],
            ['name' => 'Recruitment', 'slug' => 'recruitment'],
            ['name' => 'Counseling', 'slug' => 'counseling'],
        ]);
    }
}
