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
        $role = Role::where('slug', 'super_admin')->first();

        if (! $role) {
            return;
        }

        $employee = Employee::firstOrCreate(
            ['employee_code' => 'SUPER-0001'],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'employment_type' => 'full_time',
                'status' => 'active',
            ],
        );

        User::updateOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'role_id' => $role->id,
                'employee_id' => $employee->id,
                'status' => 'active',
            ],
        );
    }

    public function down(): void
    {
        //
    }
};
