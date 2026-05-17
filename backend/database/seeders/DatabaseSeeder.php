<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Position;
use App\Models\Role;
use App\Models\TelegramDestination;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['code' => 'ADMIN', 'name' => 'Administration', 'description' => 'System administration and office operations.'],
            ['code' => 'HR', 'name' => 'Human Resources', 'description' => 'Employee records, attendance, and staff support.'],
            ['code' => 'SALES', 'name' => 'Sales', 'description' => 'Indoor and outdoor sales team.'],
            ['code' => 'WH', 'name' => 'Warehouse', 'description' => 'Stock handling and warehouse operations.'],
            ['code' => 'FIN', 'name' => 'Finance', 'description' => 'Accounting, payroll, and finance reporting.'],
            ['code' => 'DEL', 'name' => 'Delivery', 'description' => 'Drivers and delivery operations.'],
        ];

        foreach ($departments as $department) {
            Department::updateOrCreate(
                ['code' => $department['code']],
                [...$department, 'status' => 'active'],
            );
        }

        $departmentIds = Department::pluck('id', 'code');

        $positions = [
            ['department' => 'ADMIN', 'code' => 'SUPER_ADMIN', 'name' => 'Super Admin'],
            ['department' => 'ADMIN', 'code' => 'ADMIN', 'name' => 'Admin'],
            ['department' => 'HR', 'code' => 'HR_MANAGER', 'name' => 'HR Manager'],
            ['department' => 'SALES', 'code' => 'SALES_MANAGER', 'name' => 'Sales Manager'],
            ['department' => 'SALES', 'code' => 'OUTDOOR_SALES', 'name' => 'Outdoor Sales'],
            ['department' => 'WH', 'code' => 'WAREHOUSE_STAFF', 'name' => 'Warehouse Staff'],
            ['department' => 'FIN', 'code' => 'ACCOUNTANT', 'name' => 'Accountant'],
            ['department' => 'DEL', 'code' => 'DRIVER', 'name' => 'Driver'],
            ['department' => 'ADMIN', 'code' => 'OFFICE_STAFF', 'name' => 'Office Staff'],
        ];

        foreach ($positions as $position) {
            Position::updateOrCreate(
                ['code' => $position['code']],
                [
                    'department_id' => $departmentIds[$position['department']] ?? null,
                    'name' => $position['name'],
                    'status' => 'active',
                ],
            );
        }

        foreach ([
            ['slug' => 'super_admin', 'name' => 'Super Admin', 'description' => 'Full system owner with unrestricted access.'],
            ['slug' => 'admin', 'name' => 'Admin', 'description' => 'System management access.'],
            ['slug' => 'hr_manager', 'name' => 'HR Manager', 'description' => 'Employee and attendance management.'],
            ['slug' => 'sales_manager', 'name' => 'Sales Manager', 'description' => 'Outdoor sales team management.'],
            ['slug' => 'accountant', 'name' => 'Accountant', 'description' => 'Financial and payroll access.'],
            ['slug' => 'outdoor_sales', 'name' => 'Outdoor Sales', 'description' => 'Field sales employee.'],
            ['slug' => 'office_staff', 'name' => 'Office Staff', 'description' => 'Office employee.'],
            ['slug' => 'warehouse_staff', 'name' => 'Warehouse Staff', 'description' => 'Warehouse employee.'],
            ['slug' => 'driver', 'name' => 'Driver', 'description' => 'Delivery employee.'],
        ] as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }

        foreach ([
            ['event_key' => 'daily_attendance', 'name' => 'Daily Attendance Group'],
            ['event_key' => 'permission_request', 'name' => 'Permission Requests Group'],
            ['event_key' => 'late_attendance', 'name' => 'Late Attendance Topic'],
            ['event_key' => 'outdoor_visit', 'name' => 'Outdoor Visit Topic'],
        ] as $destination) {
            TelegramDestination::updateOrCreate(
                ['event_key' => $destination['event_key'], 'name' => $destination['name']],
                [
                    'chat_id' => '',
                    'message_thread_id' => null,
                    'enabled' => false,
                ],
            );
        }
    }
}
