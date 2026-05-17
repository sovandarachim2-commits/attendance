<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permission_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('request_code', 32)->unique();
            $table->string('type');
            $table->date('request_date');
            $table->string('request_time', 20)->nullable();
            $table->text('reason');
            $table->string('status')->default('pending')->index();
            $table->boolean('is_emergency')->default(false);
            $table->string('gps_location')->nullable();
            $table->text('admin_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['employee_id', 'request_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_requests');
    }
};
