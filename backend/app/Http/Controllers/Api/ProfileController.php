<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImageUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function __construct(private ImageUploadService $images) {}

    public function update(Request $request)
    {
        if (! $request->user()->hasAnyPermission('update_own_profile', 'update_profile')) {
            abort(403, 'You do not have permission to update your profile.');
        }

        $user     = $request->user();
        $employee = $user->employee;

        if (! $employee) {
            abort(422, 'No employee profile is linked to this account.');
        }

        $data = $request->validate([
            'full_name'                 => ['nullable', 'string', 'max:200'],
            'first_name'                => ['nullable', 'string', 'max:100'],
            'last_name'                 => ['nullable', 'string', 'max:100'],
            'phone'                     => ['nullable', 'string', 'max:40'],
            'address'                   => ['nullable', 'string', 'max:1000'],
            'photo'                     => ['nullable', 'image', 'max:4096'],
            'new_password'              => ['nullable', 'string', 'min:8', 'max:255', 'confirmed'],
            'new_password_confirmation' => ['nullable', 'string'],
        ]);

        if (! empty($data['full_name'])) {
            $parts = preg_split('/\s+/', trim($data['full_name']), 2) ?: [];
            $data['first_name'] = $parts[0] ?? '';
            $data['last_name']  = $parts[1] ?? null;
        }

        $emp = [];
        foreach (['first_name', 'last_name', 'phone', 'address'] as $field) {
            if (array_key_exists($field, $data)) {
                $emp[$field] = $data[$field];
            }
        }

        if ($request->hasFile('photo')) {
            $emp['photo_path'] = $this->images->store($request->file('photo'), 'employees/photos');
        }

        if ($emp !== []) {
            $employee->update($emp);
        }

        if (! empty($data['new_password'])) {
            $user->update(['password' => Hash::make($data['new_password'])]);
        }

        return $user->fresh(['employee.department', 'employee.position', 'employee.branch', 'role.permissions']);
    }
}
