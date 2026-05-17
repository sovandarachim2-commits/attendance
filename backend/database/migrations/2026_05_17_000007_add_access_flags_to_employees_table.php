<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->boolean('require_face_verification')->default(false)->after('face_template_status');
            $table->boolean('require_gps')->default(false)->after('require_face_verification');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['require_face_verification', 'require_gps']);
        });
    }
};
