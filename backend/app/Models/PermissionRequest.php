<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PermissionRequest extends Model
{
    protected $fillable = [
        'employee_id',
        'request_code',
        'type',
        'request_date',
        'request_time',
        'reason',
        'status',
        'is_emergency',
        'gps_location',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'request_date' => 'date',
        'is_emergency' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
