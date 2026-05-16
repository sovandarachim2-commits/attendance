<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    protected $fillable = ['department_id', 'name', 'code', 'status'];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
