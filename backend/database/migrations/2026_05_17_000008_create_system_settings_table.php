<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();
            $table->text('value')->nullable();
            $table->string('group', 50)->default('general');
            $table->timestamps();
        });

        // Seed defaults
        $defaults = [
            // General
            ['key' => 'company_name',       'value' => '',                   'group' => 'general'],
            ['key' => 'timezone',            'value' => 'Asia/Phnom_Penh',    'group' => 'general'],
            ['key' => 'language',            'value' => 'English',            'group' => 'general'],
            ['key' => 'currency',            'value' => 'USD',                'group' => 'general'],
            ['key' => 'date_format',         'value' => 'DD/MM/YYYY',         'group' => 'general'],
            ['key' => 'theme_mode',          'value' => 'System',             'group' => 'general'],
            // Attendance rules
            ['key' => 'check_in_time',       'value' => '08:00',              'group' => 'attendance'],
            ['key' => 'check_out_time',      'value' => '17:00',              'group' => 'attendance'],
            ['key' => 'late_minutes',        'value' => '15',                 'group' => 'attendance'],
            ['key' => 'attendance_radius',   'value' => '100',                'group' => 'attendance'],
            ['key' => 'overtime_rules',      'value' => 'After checkout time','group' => 'attendance'],
            ['key' => 'weekend_rules',       'value' => 'Allow with approval','group' => 'attendance'],
            // Work schedule
            ['key' => 'work_start_time',     'value' => '08:00',              'group' => 'schedule'],
            ['key' => 'work_end_time',       'value' => '17:00',              'group' => 'schedule'],
            ['key' => 'break_time',          'value' => '12:00 - 13:00',      'group' => 'schedule'],
            ['key' => 'working_days',        'value' => 'Monday - Friday',    'group' => 'schedule'],
            ['key' => 'flexible_schedule',   'value' => '1',                  'group' => 'schedule'],
            // GPS
            ['key' => 'gps_location_tracking',  'value' => '1', 'group' => 'gps'],
            ['key' => 'gps_fake_detection',     'value' => '1', 'group' => 'gps'],
            ['key' => 'gps_background_tracking','value' => '0', 'group' => 'gps'],
            ['key' => 'gps_live_tracking',      'value' => '1', 'group' => 'gps'],
            // Security
            ['key' => 'jwt_expiration',         'value' => '120', 'group' => 'security'],
            ['key' => 'login_attempt_limit',    'value' => '5',   'group' => 'security'],
            ['key' => 'session_timeout',        'value' => '60',  'group' => 'security'],
            ['key' => 'device_restriction',     'value' => '0',   'group' => 'security'],
            ['key' => 'two_factor_auth',        'value' => '1',   'group' => 'security'],
        ];

        $now = now();
        foreach ($defaults as &$row) {
            $row['created_at'] = $now;
            $row['updated_at'] = $now;
        }

        DB::table('system_settings')->insert($defaults);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
