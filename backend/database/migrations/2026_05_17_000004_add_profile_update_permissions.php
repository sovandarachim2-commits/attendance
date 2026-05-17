<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    private array $allProfilesRoles = [
        'super_admin',
        'admin',
        'hr_manager',
        'manager',
    ];

    private array $ownProfileRoles = [
        'outdoor_sales',
        'office_staff',
        'warehouse_staff',
        'employee',
    ];

    public function up(): void
    {
        foreach (['update_own_profile', 'update_all_profiles'] as $slug) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name' => Str::of($slug)->replace('_', ' ')->title()->toString(),
                    'group' => 'profile',
                    'updated_at' => now(),
                    'created_at' => now(),
                ],
            );
        }

        $ownId = DB::table('permissions')->where('slug', 'update_own_profile')->value('id');
        $allId = DB::table('permissions')->where('slug', 'update_all_profiles')->value('id');
        $legacyId = DB::table('permissions')->where('slug', 'update_profile')->value('id');

        $rolesWithLegacy = $legacyId
            ? DB::table('permission_role')->where('permission_id', $legacyId)->pluck('role_id')
            : collect();

        foreach ($rolesWithLegacy as $roleId) {
            DB::table('permission_role')->updateOrInsert(
                ['role_id' => $roleId, 'permission_id' => $ownId],
                ['updated_at' => now(), 'created_at' => now()],
            );
        }

        foreach ($this->ownProfileRoles as $roleSlug) {
            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');
            if (! $roleId) {
                continue;
            }

            DB::table('permission_role')->updateOrInsert(
                ['role_id' => $roleId, 'permission_id' => $ownId],
                ['updated_at' => now(), 'created_at' => now()],
            );
        }

        foreach ($this->allProfilesRoles as $roleSlug) {
            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');
            if (! $roleId) {
                continue;
            }

            foreach ([$ownId, $allId] as $permissionId) {
                DB::table('permission_role')->updateOrInsert(
                    ['role_id' => $roleId, 'permission_id' => $permissionId],
                    ['updated_at' => now(), 'created_at' => now()],
                );
            }
        }
    }

    public function down(): void
    {
        $slugs = ['update_own_profile', 'update_all_profiles'];
        $permissionIds = DB::table('permissions')->whereIn('slug', $slugs)->pluck('id');

        DB::table('permission_role')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('slug', $slugs)->delete();
    }
};
