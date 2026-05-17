<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telegram_destinations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('event_key')->index();
            $table->string('chat_id');
            $table->unsignedBigInteger('message_thread_id')->nullable();
            $table->boolean('enabled')->default(true)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_destinations');
    }
};
