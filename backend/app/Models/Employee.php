<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'department_id', 'position_id', 'branch_id', 'employee_code', 'first_name', 'last_name',
        'phone', 'address', 'photo_path', 'hire_date', 'employment_type', 'status', 'face_template_status',
    ];

    public function department() { return $this->belongsTo(Department::class); }
    public function position() { return $this->belongsTo(Position::class); }
    public function branch() { return $this->belongsTo(Branch::class); }
    public function user() { return $this->hasOne(User::class); }
    public function attendances() { return $this->hasMany(Attendance::class); }
    public function visits() { return $this->hasMany(CustomerVisit::class); }
}
