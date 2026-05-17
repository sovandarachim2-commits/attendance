<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceLog;
use App\Repositories\AttendanceRepository;
use App\Services\AttendanceService;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(private AttendanceRepository $attendance, private AttendanceService $service) {}

    public function index(Request $request)
    {
        $filters = $request->only(['date', 'status', 'employee_id', 'per_page']);

        if (! $request->user()->hasPermission('view_all_attendance')) {
            $filters['employee_id'] = $request->user()->employee_id;
        }

        return $this->attendance->filtered($filters);
    }

    public function today(Request $request)
    {
        return $this->attendance->todayForEmployee($request->user()->employee_id);
    }

    public function checkIn(Request $request)
    {
        $photoRules = config('attendance.face_verification_enabled', false)
            ? ['required', 'image', 'max:4096']
            : ['nullable', 'image', 'max:4096'];

        $data = $request->validate([
            'type' => ['required', 'in:office,outdoor'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric'],
            'speed' => ['nullable', 'numeric'],
            'photo' => $photoRules,
            'qr_code' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'address' => ['nullable', 'string', 'max:2000'],
            'offline_sync_uuid' => ['nullable', 'uuid'],
        ]);

        $data['photo'] = $request->file('photo');

        return $this->service->checkIn($request->user(), $data);
    }

    public function checkOut(Request $request)
    {
        $photoRules = config('attendance.face_verification_enabled', false)
            ? ['required', 'image', 'max:4096']
            : ['nullable', 'image', 'max:4096'];

        $data = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric'],
            'speed' => ['nullable', 'numeric'],
            'photo' => $photoRules,
            'notes' => ['nullable', 'string', 'max:2000'],
            'address' => ['nullable', 'string', 'max:2000'],
        ]);

        $data['photo'] = $request->file('photo');

        return $this->service->checkOut($request->user(), $data);
    }

    public function edit(Request $request, Attendance $attendance)
    {
        $data = $request->validate([
            'changes' => ['required', 'array'],
            'reason' => ['required', 'string', 'min:8', 'max:2000'],
        ]);

        foreach ($data['changes'] as $field => $value) {
            if (! in_array($field, ['status', 'check_in_at', 'check_out_at', 'notes'], true)) {
                continue;
            }

            AttendanceLog::create([
                'attendance_id' => $attendance->id,
                'edited_by' => $request->user()->id,
                'field_name' => $field,
                'previous_value' => (string) $attendance->{$field},
                'new_value' => (string) $value,
                'reason' => $data['reason'],
                'ip_address' => $request->ip(),
            ]);

            $attendance->{$field} = $value;
        }

        $attendance->save();

        return $attendance->fresh(['employee', 'logs.editor']);
    }
}
