<?php

namespace App\Repositories;

use App\Models\Employee;

class EmployeeRepository
{
    public function paginate(array $filters = [])
    {
        return Employee::query()
            ->with(['department', 'position', 'branch', 'user.role'])
            ->when($filters['employee_id'] ?? null, fn ($query, $id) => $query->where('id', $id))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('employee_code', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            })
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }
}
