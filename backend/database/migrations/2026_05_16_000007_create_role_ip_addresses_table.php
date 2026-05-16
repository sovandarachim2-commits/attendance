<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_ip_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->string('ip_address', 45);
            $table->string('label', 120)->nullable();
            $table->timestamps();
            $table->unique(['role_id', 'ip_address']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_ip_addresses');
    }
};
