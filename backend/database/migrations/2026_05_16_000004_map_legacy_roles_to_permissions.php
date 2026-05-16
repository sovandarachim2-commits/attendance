<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->copyPermissions('admin', 'manager');
        $this->copyPermissions('office_staff', 'employee');
    }

    public function down(): void
    {
        //
    }

    private function copyPermissions(string $sourceRoleSlug, string $targetRoleSlug): void
    {
        $sourceRoleId = DB::table('roles')->where('slug', $sourceRoleSlug)->value('id');
        $targetRoleId = DB::table('roles')->where('slug', $targetRoleSlug)->value('id');

        if (! $sourceRoleId || ! $targetRoleId) {
            return;
        }

        $permissionIds = DB::table('permission_role')
            ->where('role_id', $sourceRoleId)
            ->pluck('permission_id');

        foreach ($permissionIds as $permissionId) {
            DB::table('permission_role')->updateOrInsert(
                ['role_id' => $targetRoleId, 'permission_id' => $permissionId],
                ['updated_at' => now(), 'created_at' => now()],
            );
        }
    }
};
