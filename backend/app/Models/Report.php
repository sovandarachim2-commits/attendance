<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = ['employee_id', 'report_date', 'type', 'title', 'content', 'metrics', 'submitted_at', 'status'];
    protected $casts = ['metrics' => 'array', 'report_date' => 'date', 'submitted_at' => 'datetime'];

    public function employee() { return $this->belongsTo(Employee::class); }
}
