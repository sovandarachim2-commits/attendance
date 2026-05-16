<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\RoleIpAddress;
use Illuminate\Http\Request;

class IpRestrictionController extends Controller
{
    public function index()
    {
        return Role::with('ipAddresses')->get(['id', 'name', 'slug', 'description']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'role_id'    => ['required', 'exists:roles,id'],
            'ip_address' => ['required', 'ip', 'max:45'],
            'label'      => ['nullable', 'string', 'max:120'],
        ]);

        return RoleIpAddress::firstOrCreate(
            ['role_id' => $data['role_id'], 'ip_address' => $data['ip_address']],
            ['label'   => $data['label'] ?? null],
        );
    }

    public function destroy(RoleIpAddress $ipRestriction)
    {
        $ipRestriction->delete();

        return response()->noContent();
    }
}
