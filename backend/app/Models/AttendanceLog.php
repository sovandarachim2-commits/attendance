<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceLog extends Model
{
    protected $fillable = ['attendance_id', 'edited_by', 'field_name', 'previous_value', 'new_value', 'reason', 'ip_address'];

    public function attendance() { return $this->belongsTo(Attendance::class); }
    public function editor() { return $this->belongsTo(User::class, 'edited_by'); }
}
