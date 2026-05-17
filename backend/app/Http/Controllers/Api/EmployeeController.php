<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Position;
use App\Models\Role;
use App\Models\User;
use App\Repositories\EmployeeRepository;
use App\Services\ImageUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function __construct(private EmployeeRepository $employees, private ImageUploadService $images) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'status', 'per_page']);

        $canViewAll = $request->user()->hasPermission('manage_employees')
            || $request->user()->hasPermission('view_employee_profiles');

        if (!$canViewAll) {
            $filters['employee_id'] = $request->user()->employee_id;
        }

        return $this->employees->paginate($filters);
    }

    public function options()
    {
        return [
            'departments' => Department::query()->orderBy('name')->get(['id', 'name', 'code']),
            'positions'   => Position::query()->orderBy('name')->get(['id', 'department_id', 'name', 'code']),
            'branches'    => Branch::query()->orderBy('name')->get(['id', 'name', 'code']),
            'roles'       => Role::query()->orderBy('name')->get(['id', 'name', 'slug']),
        ];
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_id' => ['nullable', 'exists:positions,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'employee_code' => ['required', 'string', 'max:50', 'unique:employees,employee_code'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'max:4096'],
            'hire_date' => ['nullable', 'date'],
            'employment_type' => ['required', 'string', 'max:40'],
            'status' => ['required', 'in:active,inactive,suspended'],
            'require_face_verification' => ['nullable', 'boolean'],
            'require_gps' => ['nullable', 'boolean'],
            'create_login' => ['nullable', 'boolean'],
            'login_username' => ['required_if:create_login,1', 'nullable', 'string', 'max:100', Rule::unique('users', 'name')],
            'login_email' => ['required_if:create_login,1', 'nullable', 'email', 'max:255', Rule::unique('users', 'email')],
            'login_password' => ['required_if:create_login,1', 'nullable', 'string', 'min:8', 'max:255'],
            'role_id' => ['required_if:create_login,1', 'nullable', 'exists:roles,id'],
        ]);

        $createLogin = $request->boolean('create_login');
        $loginUsername = $data['login_username'] ?? null;
        $loginEmail = $data['login_email'] ?? null;
        $loginPassword = $data['login_password'] ?? null;
        $roleId = $data['role_id'] ?? null;
        unset($data['photo'], $data['create_login'], $data['login_username'], $data['login_email'], $data['login_password'], $data['role_id']);
        $data['last_name'] = $data['last_name'] ?? null;

        return DB::transaction(function () use ($data, $request, $createLogin, $loginUsername, $loginEmail, $loginPassword, $roleId) {
            $data['photo_path'] = $this->images->store($request->file('photo'), 'employees/photos');
            $employee = Employee::create($data);

            if ($createLogin) {
                $role = $roleId
                    ? Role::findOrFail($roleId)
                    : Role::firstOrCreate(
                        ['slug' => 'office_staff'],
                        ['name' => 'Office Staff', 'description' => 'Office employee']
                    );

                User::create([
                    'name' => $loginUsername ?? trim($employee->first_name.' '.$employee->last_name),
                    'email' => $loginEmail,
                    'password' => Hash::make($loginPassword),
                    'role_id' => $role->id,
                    'employee_id' => $employee->id,
                    'status' => 'active',
                ]);
            }

            return $employee->fresh(['department', 'position', 'branch', 'user.role']);
        });
    }

    public function show(Employee $employee)
    {
        return $employee->load(['department', 'position', 'branch', 'user.role', 'attendances' => fn ($q) => $q->latest()->limit(10)]);
    }

    public function update(Request $request, Employee $employee)
    {
        $data = $request->validate([
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_id' => ['nullable', 'exists:positions,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'employee_code' => ['required', 'string', 'max:50', 'unique:employees,employee_code,'.$employee->id],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'max:4096'],
            'hire_date' => ['nullable', 'date'],
            'employment_type' => ['required', 'string', 'max:40'],
            'status' => ['required', 'in:active,inactive,suspended'],
            'require_face_verification' => ['nullable', 'boolean'],
            'require_gps' => ['nullable', 'boolean'],
            'login_username' => ['nullable', 'string', 'max:100', Rule::unique('users', 'name')->ignore($employee->user?->id)],
            'login_email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($employee->user?->id)],
            'login_password' => ['nullable', 'string', 'min:8', 'max:255'],
            'role_id' => ['nullable', 'exists:roles,id'],
        ]);

        $loginUsername = $data['login_username'] ?? null;
        $loginEmail = $data['login_email'] ?? null;
        $loginPassword = $data['login_password'] ?? null;
        $roleId = $data['role_id'] ?? null;
        unset($data['login_username'], $data['login_email'], $data['login_password'], $data['role_id']);
        $data['last_name'] = $data['last_name'] ?? null;

        if ($request->hasFile('photo')) {
            $data['photo_path'] = $this->images->store($request->file('photo'), 'employees/photos');
        }
        unset($data['photo']);

        DB::transaction(function () use ($employee, $data, $loginUsername, $loginEmail, $loginPassword, $roleId) {
            $employee->update($data);

            if ($employee->user) {
                $userData = [];
                if ($loginUsername) {
                    $userData['name'] = $loginUsername;
                }

                if ($loginEmail) {
                    $userData['email'] = $loginEmail;
                }

                if ($roleId) {
                    $userData['role_id'] = $roleId;
                }

                if ($loginPassword) {
                    $userData['password'] = Hash::make($loginPassword);
                }

                $employee->user->update($userData);
            } elseif ($loginEmail && $loginPassword) {
                $role = $roleId
                    ? Role::findOrFail($roleId)
                    : Role::firstOrCreate(
                        ['slug' => 'office_staff'],
                        ['name' => 'Office Staff', 'description' => 'Office employee']
                    );

                User::create([
                    'name' => $loginUsername ?? trim($employee->first_name.' '.$employee->last_name),
                    'email' => $loginEmail,
                    'password' => Hash::make($loginPassword),
                    'role_id' => $role->id,
                    'employee_id' => $employee->id,
                    'status' => 'active',
                ]);
            }
        });

        return $employee->fresh(['department', 'position', 'branch', 'user.role']);
    }

    public function destroy(Employee $employee)
    {
        $employee->loadMissing('user.role');

        if (in_array($employee->user?->role?->slug, ['super_admin', 'admin'], true)) {
            abort(422, 'Super Admin and Admin employees cannot be deleted.');
        }

        DB::transaction(function () use ($employee) {
            $employee->user()?->delete();
            $employee->delete();
        });

        return response()->noContent();
    }
}
