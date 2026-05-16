<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = ['user_id', 'type', 'title', 'message', 'payload', 'read_at'];
    protected $casts = ['payload' => 'array', 'read_at' => 'datetime'];
}
