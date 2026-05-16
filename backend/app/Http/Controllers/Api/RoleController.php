<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function index()
    {
        return Role::query()
            ->with('permissions')
            ->withCount(['permissions', 'users'])
            ->orderBy('name')
            ->get();
    }

    public function permissions()
    {
        return Permission::query()
            ->orderBy('group')
            ->orderBy('name')
            ->get()
            ->groupBy('group');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:100', Rule::unique('roles', 'slug')],
            'description' => ['nullable', 'string', 'max:1000'],
            'permission_ids' => ['array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        $role = Role::create([
            'name' => $data['name'],
            'slug' => $data['slug'] ?: Str::slug($data['name'], '_'),
            'description' => $data['description'] ?? null,
        ]);

        $role->permissions()->sync($data['permission_ids'] ?? []);

        return $role->fresh(['permissions']);
    }

    public function update(Request $request, Role $role)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:100', Rule::unique('roles', 'slug')->ignore($role->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'permission_ids' => ['array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        $role->update([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'description' => $data['description'] ?? null,
        ]);

        $role->permissions()->sync($data['permission_ids'] ?? []);

        return $role->fresh(['permissions']);
    }

    public function destroy(Role $role)
    {
        if (in_array($role->slug, ['super_admin', 'admin'], true)) {
            abort(422, 'Core admin roles cannot be deleted.');
        }

        $role->permissions()->detach();
        $role->delete();

        return response()->noContent();
    }
}
