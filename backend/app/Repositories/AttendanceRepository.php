<?php

namespace App\Repositories;

use App\Models\Attendance;
use Illuminate\Support\Carbon;

class AttendanceRepository
{
    public function todayForEmployee(int $employeeId): ?Attendance
    {
        return Attendance::where('employee_id', $employeeId)
            ->whereDate('attendance_date', Carbon::today())
            ->first();
    }

    public function filtered(array $filters = [])
    {
        return Attendance::query()
            ->with(['employee.department', 'employee.position', 'branch'])
            ->when($filters['date'] ?? null, fn ($query, $date) => $query->whereDate('attendance_date', $date))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['employee_id'] ?? null, fn ($query, $id) => $query->where('employee_id', $id))
            ->latest('attendance_date')
            ->paginate($filters['per_page'] ?? 20);
    }
}
