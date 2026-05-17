<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\GpsLocation;
use App\Models\User;
use App\Repositories\AttendanceRepository;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class AttendanceService
{
    public function __construct(
        private AttendanceRepository $attendanceRepository,
        private GpsValidationService $gps,
        private ImageUploadService $images,
        private TelegramNotificationService $telegram,
    ) {}

    private function assertIpAllowed(User $user): void
    {
        if (in_array($user->role?->slug, ['super_admin', 'admin'], true)) {
            return;
        }

        $allowed = $user->role?->load('ipAddresses')->ipAddresses ?? collect();

        if ($allowed->isEmpty()) {
            throw ValidationException::withMessages([
                'ip' => "Your role ({$user->role?->name}) has no allowed IP addresses configured. An administrator must add at least one allowed IP before you can check in or out.",
            ]);
        }

        $clientIp = request()->ip();

        if (! $allowed->pluck('ip_address')->contains($clientIp)) {
            throw ValidationException::withMessages([
                'ip' => "Check-in not allowed from your current IP address ({$clientIp}). Your role is restricted to specific office networks. Contact your administrator.",
            ]);
        }
    }

    public function checkIn(User $user, array $data): Attendance
    {
        $this->assertIpAllowed($user);

        $employee = $user->employee()->with(['branch', 'position', 'department'])->firstOrFail();
        $existing = $this->attendanceRepository->todayForEmployee($employee->id);

        if ($existing && $existing->check_in_at) {
            throw ValidationException::withMessages(['attendance' => 'Employee already checked in today.']);
        }

        if (
            ($data['type'] ?? 'office') === 'office'
            && config('attendance.validate_office_gps_radius', false)
        ) {
            $branch = $employee->branch;
            if (! $branch) {
                throw ValidationException::withMessages(['branch' => 'Employee has no office branch assigned.']);
            }

            $result = $this->gps->assertWithinRadius(
                (float) $data['latitude'],
                (float) $data['longitude'],
                (float) $branch->latitude,
                (float) $branch->longitude,
                (int) $branch->attendance_radius_meters
            );

            if (! $result['valid']) {
                throw ValidationException::withMessages([
                    'gps' => "Outside office radius. Distance {$result['distance_meters']}m, allowed {$result['radius_meters']}m.",
                ]);
            }
        }

        $now = now();
        $lateAfter = Carbon::today()->setTimeFromTimeString(config('attendance.office_start_time', '08:30:00'));
        $lateMinutes = $now->greaterThan($lateAfter) ? $lateAfter->diffInMinutes($now) : 0;

        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'branch_id' => $employee->branch_id,
            'attendance_date' => Carbon::today(),
            'type' => $data['type'] ?? 'office',
            'status' => $lateMinutes > 0 ? 'late' : 'present',
            'check_in_at' => $now,
            'check_in_latitude' => $data['latitude'],
            'check_in_longitude' => $data['longitude'],
            'check_in_address' => $data['address'] ?? null,
            'check_in_photo_path' => $this->images->store($data['photo'] ?? null, 'attendance/selfies'),
            'qr_code' => $data['qr_code'] ?? null,
            'late_minutes' => $lateMinutes,
            'notes' => $data['notes'] ?? null,
            'offline_sync_uuid' => $data['offline_sync_uuid'] ?? null,
            'synced_at' => now(),
        ]);

        GpsLocation::create([
            'employee_id' => $employee->id,
            'attendance_id' => $attendance->id,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'accuracy' => $data['accuracy'] ?? null,
            'speed' => $data['speed'] ?? null,
            'recorded_at' => $now,
            'source' => 'check_in',
        ]);

        $employeeName = trim("{$employee->first_name} {$employee->last_name}");
        $position     = $employee->position?->name ?? 'N/A';
        $address      = $data['address'] ?? 'N/A';
        $checkInFmt   = $now->format('h:i A');
        $dateFmt      = $now->format('d M Y');
        $statusLabel  = $lateMinutes > 0 ? 'Late' : 'Present';

        $this->telegram->send(
            "✅ <b>EMPLOYEE CHECK IN</b>\n\n"
            . "👤 Employee: {$employeeName}\n"
            . "🆔 ID: {$employee->employee_code}\n"
            . "💼 Position: {$position}\n\n"
            . "🕘 Check In Time: {$checkInFmt}\n"
            . "📅 Date: {$dateFmt}\n\n"
            . "📍 Location: {$address}\n"
            . "📡 GPS Status: Verified\n\n"
            . "✅ Status: {$statusLabel}",
            'daily_attendance',
        );

        if ($attendance->status === 'late') {
            $officeStart    = Carbon::today()->setTimeFromTimeString(config('attendance.office_start_time', '08:30:00'));
            $officeStartFmt = $officeStart->format('h:i A');
            $department     = $employee->department?->name ?? 'N/A';

            $this->telegram->send(
                "⚠️ <b>LATE CHECK IN ALERT</b>\n\n"
                . "👤 Employee: {$employeeName}\n"
                . "💼 Department: {$department}\n\n"
                . "🕘 Office Start Time: {$officeStartFmt}\n"
                . "⏰ Actual Check In: {$checkInFmt}\n\n"
                . "⌛ Late Duration: {$lateMinutes} Minutes\n"
                . "📍 Location: {$address}\n\n"
                . "⚠️ Status: Late Attendance",
                'late_attendance',
            );
        }

        return $attendance->fresh(['employee', 'branch']);
    }

    public function checkOut(User $user, array $data): Attendance
    {
        $this->assertIpAllowed($user);

        $employee = $user->employee()->with(['position'])->firstOrFail();
        $attendance = $this->attendanceRepository->todayForEmployee($employee->id);

        if (! $attendance || ! $attendance->check_in_at) {
            throw ValidationException::withMessages(['attendance' => 'Check in is required before check out.']);
        }

        if ($attendance->check_out_at) {
            throw ValidationException::withMessages(['attendance' => 'Employee already checked out today.']);
        }

        $now = now();
        $attendance->update([
            'check_out_at' => $now,
            'check_out_latitude' => $data['latitude'],
            'check_out_longitude' => $data['longitude'],
            'check_out_address' => $data['address'] ?? null,
            'check_out_photo_path' => $this->images->store($data['photo'] ?? null, 'attendance/checkouts'),
            'work_minutes' => $attendance->check_in_at->diffInMinutes($now),
            'notes' => trim(($attendance->notes ? $attendance->notes."\n" : '').($data['notes'] ?? '')),
        ]);

        GpsLocation::create([
            'employee_id' => $employee->id,
            'attendance_id' => $attendance->id,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'accuracy' => $data['accuracy'] ?? null,
            'speed' => $data['speed'] ?? null,
            'recorded_at' => $now,
            'source' => 'check_out',
        ]);

        $workMinutes  = $attendance->check_in_at->diffInMinutes($now);
        $workFmt      = sprintf('%02dh %02dm', intdiv($workMinutes, 60), $workMinutes % 60);
        $employeeName = trim("{$employee->first_name} {$employee->last_name}");
        $position     = $employee->position?->name ?? 'N/A';
        $address      = $data['address'] ?? 'N/A';

        $this->telegram->send(
            "🔔 <b>EMPLOYEE CHECK OUT</b>\n\n"
            . "👤 Employee: {$employeeName}\n"
            . "🆔 ID: {$employee->employee_code}\n"
            . "💼 Position: {$position}\n\n"
            . "🕔 Check Out Time: {$now->format('h:i A')}\n"
            . "📅 Date: {$now->format('d M Y')}\n\n"
            . "⏱ Working Hours: {$workFmt}\n"
            . "📍 Location: {$address}\n"
            . "📡 GPS Status: Verified\n\n"
            . "✅ Attendance Completed",
            'daily_attendance',
        );

        return $attendance->fresh(['employee', 'branch']);
    }
}
