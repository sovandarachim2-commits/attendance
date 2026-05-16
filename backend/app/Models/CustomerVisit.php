<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerVisit extends Model
{
    protected $fillable = [
        'employee_id', 'customer_name', 'store_name', 'contact_person', 'phone', 'address',
        'latitude', 'longitude', 'check_in_at', 'check_out_at', 'duration_minutes',
        'selfie_path', 'store_photo_path', 'notes', 'status',
    ];

    protected $casts = ['check_in_at' => 'datetime', 'check_out_at' => 'datetime'];

    public function employee() { return $this->belongsTo(Employee::class); }
}
