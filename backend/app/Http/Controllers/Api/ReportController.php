<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        return Report::with('employee')
            ->when(! $request->user()->hasAnyPermission('view_reports', 'view_sales_reports', 'view_attendance_reports'), fn ($query) => $query->where('employee_id', $request->user()->employee_id))
            ->when($request->date, fn ($query, $date) => $query->whereDate('report_date', $date))
            ->latest('report_date')
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $employee = $request->user()->employee()->firstOrFail();
        $data = $request->validate([
            'report_date' => ['required', 'date'],
            'type' => ['required', 'in:daily,weekly,monthly,visit'],
            'title' => ['required', 'string', 'max:180'],
            'content' => ['required', 'string'],
            'metrics' => ['nullable', 'array'],
        ]);

        return Report::create([...$data, 'employee_id' => $employee->id, 'submitted_at' => now()]);
    }

    public function export(Request $request)
    {
        $rows = Report::latest('report_date')->limit(500)->get(['report_date', 'type', 'title', 'status']);
        $csv = "date,type,title,status\n".$rows->map(fn ($row) => implode(',', [
            $row->report_date?->toDateString(), $row->type, str_replace(',', ' ', $row->title), $row->status,
        ]))->implode("\n");

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="attendance-reports.csv"',
        ]);
    }
}
