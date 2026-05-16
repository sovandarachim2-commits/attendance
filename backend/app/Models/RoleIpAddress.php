<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoleIpAddress extends Model
{
    protected $fillable = ['role_id', 'ip_address', 'label'];

    public function role()
    {
        return $this->belongsTo(Role::class);
    }
}
