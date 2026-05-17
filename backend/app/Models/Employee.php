<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Employee extends Model
{
    protected $appends = ['photo_url'];

    protected $fillable = [
        'department_id', 'position_id', 'branch_id', 'employee_code', 'first_name', 'last_name',
        'phone', 'address', 'photo_path', 'hire_date', 'employment_type', 'status', 'face_template_status',
        'require_face_verification', 'require_gps',
    ];

    public function getPhotoUrlAttribute(): ?string
    {
        if (! $this->photo_path) {
            return null;
        }

        $disk = config('filesystems.attendance_disk', 'public');

        return Storage::disk($disk)->url($this->photo_path);
    }

    public function department() { return $this->belongsTo(Department::class); }
    public function position() { return $this->belongsTo(Position::class); }
    public function branch() { return $this->belongsTo(Branch::class); }
    public function user() { return $this->hasOne(User::class); }
    public function attendances() { return $this->hasMany(Attendance::class); }
    public function visits() { return $this->hasMany(CustomerVisit::class); }
}
