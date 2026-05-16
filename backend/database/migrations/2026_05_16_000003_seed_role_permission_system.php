<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    private array $rolePermissions = [
        'super_admin' => [
            'name' => 'Super Admin',
            'description' => 'Full system owner with unrestricted access.',
            'permissions' => [
                'manage_system_settings', 'manage_roles', 'manage_permissions', 'manage_admins',
                'manage_branches', 'manage_employees', 'create_employee', 'edit_employee',
                'delete_employee', 'view_all_attendance', 'edit_attendance', 'delete_attendance',
                'approve_attendance', 'view_gps_tracking', 'manage_customer_visits',
                'export_reports', 'manage_notifications', 'manage_qr_codes',
                'manage_office_locations', 'manage_departments', 'manage_positions',
                'manage_payroll', 'manage_storage', 'manage_api_keys', 'manage_security_settings',
            ],
        ],
        'admin' => [
            'name' => 'Admin',
            'description' => 'System management access.',
            'permissions' => [
                'dashboard_access', 'manage_employees', 'create_employee', 'edit_employee',
                'disable_employee', 'view_all_attendance', 'edit_attendance', 'approve_attendance',
                'view_gps_tracking', 'view_reports', 'export_reports', 'manage_customer_visits',
                'manage_departments', 'manage_positions', 'manage_qr_codes', 'manage_notifications',
                'manage_office_locations',
            ],
        ],
        'hr_manager' => [
            'name' => 'HR Manager',
            'description' => 'Employee and attendance management.',
            'permissions' => [
                'dashboard_access', 'create_employee', 'edit_employee', 'disable_employee',
                'view_employee_profiles', 'view_all_attendance', 'edit_attendance',
                'approve_attendance', 'export_attendance_reports', 'manage_departments',
                'manage_positions', 'view_employee_documents', 'reset_employee_password',
            ],
        ],
        'sales_manager' => [
            'name' => 'Sales Manager',
            'description' => 'Outdoor sales team management.',
            'permissions' => [
                'dashboard_access', 'view_sales_team', 'view_gps_tracking',
                'view_customer_visits', 'approve_customer_visits', 'view_sales_reports',
                'export_sales_reports', 'monitor_route_history', 'monitor_live_location',
                'approve_daily_reports',
            ],
        ],
        'accountant' => [
            'name' => 'Accountant',
            'description' => 'Financial and payroll access.',
            'permissions' => [
                'dashboard_access', 'view_attendance_reports', 'export_payroll_reports',
                'view_employee_salary', 'view_overtime_reports', 'export_excel_reports',
            ],
        ],
        'outdoor_sales' => [
            'name' => 'Outdoor Sales',
            'description' => 'Field sales employee.',
            'permissions' => [
                'employee_dashboard_access', 'attendance_check_in', 'attendance_check_out',
                'gps_tracking_access', 'create_customer_visit', 'upload_customer_photo',
                'submit_daily_report', 'view_own_attendance', 'view_own_reports', 'update_profile',
            ],
        ],
        'office_staff' => [
            'name' => 'Office Staff',
            'description' => 'Office employee.',
            'permissions' => [
                'employee_dashboard_access', 'office_check_in', 'office_check_out',
                'qr_scan_attendance', 'view_own_attendance', 'update_profile',
            ],
        ],
        'warehouse_staff' => [
            'name' => 'Warehouse Staff',
            'description' => 'Warehouse employee.',
            'permissions' => [
                'employee_dashboard_access', 'attendance_check_in', 'attendance_check_out',
                'view_own_attendance', 'update_profile',
            ],
        ],
        'driver' => [
            'name' => 'Driver',
            'description' => 'Delivery employee.',
            'permissions' => [
                'employee_dashboard_access', 'attendance_check_in', 'attendance_check_out',
                'gps_tracking_access', 'route_tracking_access', 'update_delivery_status',
                'view_own_attendance',
            ],
        ],
    ];

    public function up(): void
    {
        $permissions = collect($this->rolePermissions)
            ->flatMap(fn (array $role) => $role['permissions'])
            ->merge([
                'dashboard_access', 'system_settings_access', 'manage_roles', 'manage_permissions',
                'manage_employees', 'create_employee', 'edit_employee', 'delete_employee',
                'disable_employee', 'view_employee_profiles', 'attendance_check_in',
                'attendance_check_out', 'office_check_in', 'office_check_out',
                'edit_attendance', 'approve_attendance', 'delete_attendance',
                'view_all_attendance', 'view_own_attendance', 'gps_tracking_access',
                'view_gps_tracking', 'monitor_live_location', 'monitor_route_history',
                'create_customer_visit', 'edit_customer_visit', 'approve_customer_visits',
                'view_customer_visits', 'view_reports', 'export_reports', 'export_excel_reports',
                'export_pdf_reports', 'qr_scan_attendance', 'manage_qr_codes',
                'manage_notifications', 'receive_notifications', 'update_profile', 'change_password',
            ])
            ->unique()
            ->values();

        foreach ($permissions as $slug) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name' => Str::of($slug)->replace('_', ' ')->title()->toString(),
                    'group' => Str::before($slug, '_'),
                    'updated_at' => now(),
                    'created_at' => now(),
                ],
            );
        }

        foreach ($this->rolePermissions as $slug => $role) {
            DB::table('roles')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name' => $role['name'],
                    'description' => $role['description'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ],
            );

            $roleId = DB::table('roles')->where('slug', $slug)->value('id');
            $permissionIds = DB::table('permissions')->whereIn('slug', $role['permissions'])->pluck('id');

            foreach ($permissionIds as $permissionId) {
                DB::table('permission_role')->updateOrInsert(
                    ['role_id' => $roleId, 'permission_id' => $permissionId],
                    ['updated_at' => now(), 'created_at' => now()],
                );
            }
        }
    }

    public function down(): void
    {
        $roleSlugs = array_keys($this->rolePermissions);
        $permissionSlugs = collect($this->rolePermissions)
            ->flatMap(fn (array $role) => $role['permissions'])
            ->unique()
            ->values();

        $roleIds = DB::table('roles')->whereIn('slug', $roleSlugs)->pluck('id');
        $permissionIds = DB::table('permissions')->whereIn('slug', $permissionSlugs)->pluck('id');

        DB::table('permission_role')
            ->whereIn('role_id', $roleIds)
            ->whereIn('permission_id', $permissionIds)
            ->delete();
    }
};
