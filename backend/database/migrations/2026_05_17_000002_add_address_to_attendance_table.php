<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->text('check_in_address')->nullable()->after('check_in_longitude');
            $table->text('check_out_address')->nullable()->after('check_out_longitude');
        });
    }

    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropColumn(['check_in_address', 'check_out_address']);
        });
    }
};
