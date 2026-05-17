<?php

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $demoEmails = [
        'admin@example.com',
        'superadmin@example.com',
    ];

    private array $demoEmployeeCodes = [
        'EMP-0001',
        'SUPER-0001',
    ];

    public function up(): void
    {
        $userIds = User::whereIn('email', $this->demoEmails)->pluck('id');
        $employeeIds = User::whereIn('email', $this->demoEmails)->pluck('employee_id')->filter();

        User::whereIn('email', $this->demoEmails)->delete();

        Employee::whereIn('employee_code', $this->demoEmployeeCodes)
            ->whereNotIn('id', User::whereNotNull('employee_id')->pluck('employee_id'))
            ->delete();

        Employee::whereIn('id', $employeeIds)
            ->whereNotIn('id', User::whereNotNull('employee_id')->pluck('employee_id'))
            ->delete();
    }

    public function down(): void
    {
        // Demo accounts are not restored.
    }
};
