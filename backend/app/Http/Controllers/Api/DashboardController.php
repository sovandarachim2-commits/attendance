<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\CustomerVisit;
use App\Models\Employee;
use App\Models\GpsLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $today = Carbon::today();
        $employeeId = $request->user()->hasPermission('dashboard_access') ? null : $request->user()->employee_id;

        return [
            'cards' => [
                'total_employees' => $employeeId ? 1 : Employee::where('status', 'active')->count(),
                'present' => Attendance::when($employeeId, fn ($query) => $query->where('employee_id', $employeeId))->whereDate('attendance_date', $today)->whereIn('status', ['present', 'late'])->count(),
                'late' => Attendance::when($employeeId, fn ($query) => $query->where('employee_id', $employeeId))->whereDate('attendance_date', $today)->where('status', 'late')->count(),
                'outdoor_visits' => CustomerVisit::when($employeeId, fn ($query) => $query->where('employee_id', $employeeId))->whereDate('check_in_at', $today)->count(),
            ],
            'attendance_chart' => Attendance::selectRaw('attendance_date, status, count(*) as total')
                ->when($employeeId, fn ($query) => $query->where('employee_id', $employeeId))
                ->where('attendance_date', '>=', $today->copy()->subDays(6))
                ->groupBy('attendance_date', 'status')
                ->orderBy('attendance_date')
                ->get(),
            'live_locations' => GpsLocation::with('employee')
                ->when($employeeId, fn ($query) => $query->where('employee_id', $employeeId))
                ->latest('recorded_at')
                ->limit(50)
                ->get(),
            'recent_activity' => Attendance::with('employee')
                ->when($employeeId, fn ($query) => $query->where('employee_id', $employeeId))
                ->latest()
                ->limit(10)
                ->get(),
        ];
    }
}
