<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $table = 'attendance';

    protected $fillable = [
        'employee_id', 'branch_id', 'attendance_date', 'type', 'status', 'check_in_at', 'check_out_at',
        'check_in_latitude', 'check_in_longitude', 'check_out_latitude', 'check_out_longitude',
        'check_in_photo_path', 'check_out_photo_path', 'qr_code', 'late_minutes', 'work_minutes',
        'notes', 'offline_sync_uuid', 'synced_at',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'check_in_at' => 'datetime',
        'check_out_at' => 'datetime',
        'synced_at' => 'datetime',
    ];

    public function employee() { return $this->belongsTo(Employee::class); }
    public function branch() { return $this->belongsTo(Branch::class); }
    public function logs() { return $this->hasMany(AttendanceLog::class); }
}
