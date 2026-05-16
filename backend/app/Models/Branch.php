<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $fillable = ['name', 'code', 'address', 'latitude', 'longitude', 'attendance_radius_meters', 'status'];
}
