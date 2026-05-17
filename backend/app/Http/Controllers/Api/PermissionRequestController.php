<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PermissionRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PermissionRequestController extends Controller
{
    private const TYPES = [
        'Leave Request',
        'Sick Leave',
        'Late Arrival',
        'Attendance Edit',
        'Outdoor Work',
        'Early Leave',
        'Overtime Request',
        'GPS Override Request',
    ];

    public function index(Request $request)
    {
        $query = PermissionRequest::query()
            ->with(['employee', 'reviewer'])
            ->when(
                ! $request->user()->hasPermission('view_all_permission_requests'),
                fn ($q) => $q->where('employee_id', $request->user()->employee_id)
            )
            ->when($request->status, fn ($q, $status) => $q->where('status', strtolower($status)))
            ->when($request->type, fn ($q, $type) => $q->where('type', $type))
            ->latest();

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request)
    {
        $employee = $request->user()->employee;

        if (! $employee) {
            throw ValidationException::withMessages(['employee' => 'Your account is not linked to an employee profile.']);
        }

        $data = $request->validate([
            'type' => ['required', 'string', Rule::in(self::TYPES)],
            'request_date' => ['required', 'date'],
            'request_time' => ['nullable', 'string', 'max:20'],
            'reason' => ['required', 'string', 'max:5000'],
            'is_emergency' => ['nullable', 'boolean'],
            'gps_location' => ['nullable', 'string', 'max:500'],
        ]);

        $record = PermissionRequest::create([
            'employee_id' => $employee->id,
            'request_code' => 'PR-PENDING-'.uniqid(),
            'type' => $data['type'],
            'request_date' => $data['request_date'],
            'request_time' => $data['request_time'] ?? null,
            'reason' => $data['reason'],
            'status' => 'pending',
            'is_emergency' => (bool) ($data['is_emergency'] ?? false),
            'gps_location' => $data['gps_location'] ?? null,
            'admin_notes' => 'Submitted and waiting for approval.',
        ]);

        $record->update([
            'request_code' => sprintf('PR-%s-%04d', $record->created_at->format('Y'), $record->id),
        ]);

        return $record->fresh(['employee', 'reviewer']);
    }

    public function update(Request $request, PermissionRequest $permissionRequest)
    {
        $this->assertOwnPending($request, $permissionRequest);

        $data = $request->validate([
            'type' => ['sometimes', 'required', 'string', Rule::in(self::TYPES)],
            'request_date' => ['sometimes', 'required', 'date'],
            'request_time' => ['nullable', 'string', 'max:20'],
            'reason' => ['sometimes', 'required', 'string', 'max:5000'],
            'is_emergency' => ['nullable', 'boolean'],
            'gps_location' => ['nullable', 'string', 'max:500'],
        ]);

        $permissionRequest->update($data);

        return $permissionRequest->fresh(['employee', 'reviewer']);
    }

    public function updateStatus(Request $request, PermissionRequest $permissionRequest)
    {
        if ($permissionRequest->status !== 'pending') {
            throw ValidationException::withMessages(['status' => 'Only pending requests can be reviewed.']);
        }

        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'admin_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $permissionRequest->update([
            'status' => $data['status'],
            'admin_notes' => $data['admin_notes'] ?? ($data['status'] === 'approved' ? 'Approved.' : 'Rejected.'),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return $permissionRequest->fresh(['employee', 'reviewer']);
    }

    public function destroy(Request $request, PermissionRequest $permissionRequest)
    {
        $this->assertOwnPending($request, $permissionRequest);

        $permissionRequest->delete();

        return response()->noContent();
    }

    private function assertOwnPending(Request $request, PermissionRequest $permissionRequest): void
    {
        if ($permissionRequest->status !== 'pending') {
            throw ValidationException::withMessages(['status' => 'Only pending requests can be changed.']);
        }

        $canManageAll = $request->user()->hasPermission('view_all_permission_requests');

        if (! $canManageAll && $permissionRequest->employee_id !== $request->user()->employee_id) {
            abort(403, 'You can only modify your own permission requests.');
        }
    }
}
