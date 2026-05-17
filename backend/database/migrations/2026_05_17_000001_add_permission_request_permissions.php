<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    private array $assignments = [
        'super_admin' => [
            'view_all_permission_requests',
            'approve_permission_requests',
            'submit_permission_request',
            'view_own_permission_requests',
        ],
        'admin' => [
            'view_all_permission_requests',
            'approve_permission_requests',
        ],
        'hr_manager' => [
            'view_all_permission_requests',
            'approve_permission_requests',
        ],
        'manager' => [
            'view_all_permission_requests',
            'approve_permission_requests',
        ],
        'office_staff' => [
            'view_own_permission_requests',
            'submit_permission_request',
        ],
        'outdoor_sales' => [
            'view_own_permission_requests',
            'submit_permission_request',
        ],
        'warehouse_staff' => [
            'view_own_permission_requests',
            'submit_permission_request',
        ],
        'driver' => [
            'view_own_permission_requests',
            'submit_permission_request',
        ],
        'employee' => [
            'view_own_permission_requests',
            'submit_permission_request',
        ],
    ];

    public function up(): void
    {
        $slugs = collect($this->assignments)
            ->flatten()
            ->merge([
                'view_all_permission_requests',
                'view_own_permission_requests',
                'submit_permission_request',
                'approve_permission_requests',
            ])
            ->unique();

        foreach ($slugs as $slug) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name' => Str::of($slug)->replace('_', ' ')->title()->toString(),
                    'group' => 'permission_requests',
                    'updated_at' => now(),
                    'created_at' => now(),
                ],
            );
        }

        foreach ($this->assignments as $roleSlug => $permissionSlugs) {
            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');

            if (! $roleId) {
                continue;
            }

            $permissionIds = DB::table('permissions')->whereIn('slug', $permissionSlugs)->pluck('id');

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
        $slugs = [
            'view_all_permission_requests',
            'view_own_permission_requests',
            'submit_permission_request',
            'approve_permission_requests',
        ];

        $permissionIds = DB::table('permissions')->whereIn('slug', $slugs)->pluck('id');

        DB::table('permission_role')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('slug', $slugs)->delete();
    }
};
