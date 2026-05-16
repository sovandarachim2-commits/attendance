<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GpsLocation extends Model
{
    protected $fillable = ['employee_id', 'attendance_id', 'customer_visit_id', 'latitude', 'longitude', 'accuracy', 'speed', 'recorded_at', 'source'];
    protected $casts = ['recorded_at' => 'datetime'];

    public function employee() { return $this->belongsTo(Employee::class); }
}
