<?php

namespace Database\Seeders;

use App\Models\App;
use Illuminate\Database\Seeder;

class AppsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        App::insert([
            [
                'name' => 'Employee Management',
                'slug' => 'employee-management',
                'description' => 'Manage employee data',
                'icon' => 'employee.png',
                'category_id' => 1,
            ],
            [
                'name' => 'Payroll System',
                'slug' => 'payroll-system',
                'description' => 'Manage payroll',
                'icon' => 'payroll.png',
                'category_id' => 2,
            ],
            [
                'name' => 'Training Center',
                'slug' => 'training-center',
                'description' => 'Employee training system',
                'icon' => 'training.png',
                'category_id' => 3,
            ],
            [
                'name' => 'IT Helpdesk',
                'slug' => 'it-helpdesk',
                'description' => 'IT support ticketing',
                'icon' => 'helpdesk.png',
                'category_id' => 4,
            ],
            [
                'name' => 'Employee Counseling',
                'slug' => 'employee-counseling',
                'description' => 'Employee counseling services',
                'icon' => 'counseling.png',
                'category_id' => 5,
            ],
            [
                'name' => 'Recruitment System',
                'slug' => 'recruitment-system',
                'description' => 'Recruitment management',
                'icon' => 'recruitment.png',
                'category_id' => 6,
            ],
        ]);
    }
}
