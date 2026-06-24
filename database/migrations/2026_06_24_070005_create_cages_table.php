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
        Schema::create('cages', function (Blueprint $table) {
            $table->id();
            $table->string('cage_code', 50)->unique();
            $table->decimal('latitude', 11, 8);
            $table->decimal('longitude', 11, 8);
            $table->double('volume_cubic_meters');
            $table->string('structure_condition', 100);
            $table->integer('lobster_count')->default(0);
            $table->integer('lobster_age_days')->nullable();
            $table->timestamp('age_last_updated_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cages');
    }
};
