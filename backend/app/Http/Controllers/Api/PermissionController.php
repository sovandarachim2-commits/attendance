<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PermissionController extends Controller
{
    public function index()
    {
        return Permission::query()
            ->orderBy('group')
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:120', Rule::unique('permissions', 'slug')],
            'group' => ['required', 'string', 'max:80'],
        ]);

        return Permission::create([
            'name' => $data['name'],
            'slug' => $data['slug'] ?: Str::slug($data['name'], '_'),
            'group' => $data['group'],
        ]);
    }

    public function update(Request $request, Permission $permission)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:120', Rule::unique('permissions', 'slug')->ignore($permission->id)],
            'group' => ['required', 'string', 'max:80'],
        ]);

        $permission->update($data);

        return $permission->fresh();
    }

    public function destroy(Permission $permission)
    {
        $permission->roles()->detach();
        $permission->delete();

        return response()->noContent();
    }
}
