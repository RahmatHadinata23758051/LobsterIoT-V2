<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('feeding_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cage_id')->constrained('cages')->onDelete('cascade');
            $table->foreignId('operator_id')->constrained('operators')->onDelete('restrict');
            $table->enum('feed_session', ['morning', 'afternoon', 'night']);
            $table->string('feed_type', 100);
            $table->double('weight_kg');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feeding_logs');
    }
};
