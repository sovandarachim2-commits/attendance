<?php

use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        $this->createDefaultUser(
            roleSlug: 'super_admin',
            email: env('SUPER_ADMIN_EMAIL', 'superadmin@salestrack.local'),
            password: env('SUPER_ADMIN_PASSWORD', 'SuperAdmin@123'),
            name: env('SUPER_ADMIN_NAME', 'Super Admin'),
            employeeCode: env('SUPER_ADMIN_EMPLOYEE_CODE', 'SUPER-0001'),
        );

        $this->createDefaultUser(
            roleSlug: 'admin',
            email: env('ADMIN_EMAIL', 'admin@salestrack.local'),
            password: env('ADMIN_PASSWORD', 'Admin@123'),
            name: env('ADMIN_NAME', 'Admin User'),
            employeeCode: env('ADMIN_EMPLOYEE_CODE', 'ADMIN-0001'),
        );
    }

    private function createDefaultUser(string $roleSlug, string $email, string $password, string $name, string $employeeCode): void
    {
        $role = Role::where('slug', $roleSlug)->first();

        if (! $role) {
            return;
        }

        $employee = Employee::firstOrCreate(
            ['employee_code' => $employeeCode],
            [
                'first_name' => explode(' ', $name)[0] ?? 'Super',
                'last_name' => explode(' ', $name, 2)[1] ?? 'Admin',
                'employment_type' => 'full_time',
                'status' => 'active',
            ],
        );

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'role_id' => $role->id,
                'employee_id' => $employee->id,
                'status' => 'active',
            ],
        );
    }

    public function down(): void
    {
        User::whereIn('email', [
            env('SUPER_ADMIN_EMAIL', 'superadmin@salestrack.local'),
            env('ADMIN_EMAIL', 'admin@salestrack.local'),
        ])->delete();
    }
};
