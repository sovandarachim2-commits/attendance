<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TelegramDestination extends Model
{
    protected $fillable = [
        'name',
        'event_key',
        'chat_id',
        'message_thread_id',
        'enabled',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'message_thread_id' => 'integer',
    ];
}
