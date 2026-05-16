<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['name', 'slug', 'description'];

    public function permissions()
    {
        return $this->belongsToMany(Permission::class)->withTimestamps();
    }

    public function users()
    {
        return $this->hasMany(\App\Models\User::class);
    }

    public function ipAddresses()
    {
        return $this->hasMany(RoleIpAddress::class);
    }
}
