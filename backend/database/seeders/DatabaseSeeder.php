<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Position;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Admin']);
        $managerRole = Role::firstOrCreate(['slug' => 'manager'], ['name' => 'Manager']);
        $employeeRole = Role::firstOrCreate(['slug' => 'employee'], ['name' => 'Employee']);

        collect([
            'employees.manage', 'attendance.manage', 'attendance.self', 'reports.view',
            'reports.submit', 'locations.track', 'notifications.view',
        ])->each(function ($slug) use ($adminRole, $managerRole, $employeeRole) {
            $permission = Permission::firstOrCreate(
                ['slug' => $slug],
                [
                    'name' => str($slug)->replace('.', ' ')->title(),
                    'group' => str($slug)->before('.'),
                ]
            );

            $adminRole->permissions()->syncWithoutDetaching($permission);
            if (! str($slug)->contains('employees.manage')) {
                $managerRole->permissions()->syncWithoutDetaching($permission);
            }
            if (str($slug)->contains('self') || str($slug)->contains('submit')) {
                $employeeRole->permissions()->syncWithoutDetaching($permission);
            }
        });

        $department = Department::firstOrCreate(['code' => 'SALES'], ['name' => 'Outdoor Sales']);
        $position = Position::firstOrCreate(
            ['code' => 'SALES-EXEC'],
            ['department_id' => $department->id, 'name' => 'Sales Executive']
        );
        $branch = Branch::firstOrCreate(
            ['code' => 'HQ'],
            [
                'name' => 'Head Office',
                'address' => 'Bangkok wholesale cosmetics office',
                'latitude' => 13.7563,
                'longitude' => 100.5018,
                'attendance_radius_meters' => 100,
            ]
        );

        $adminEmployee = Employee::firstOrCreate(
            ['employee_code' => 'EMP-0001'],
            [
                'department_id' => $department->id,
                'position_id' => $position->id,
                'branch_id' => $branch->id,
                'first_name' => 'Admin',
                'last_name' => 'User',
                'employment_type' => 'full_time',
                'status' => 'active',
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
                'employee_id' => $adminEmployee->id,
                'status' => 'active',
            ]
        );
    }
}
