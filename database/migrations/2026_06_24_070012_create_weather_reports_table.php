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
        Schema::create('weather_reports', function (Blueprint $table) {
            $table->id();
            $table->string('province_code', 20);
            $table->string('city_code', 20);
            $table->string('district_code', 20);
            $table->string('village_code', 20);
            $table->string('village_name', 150)->nullable();
            $table->string('district_name', 150)->nullable();
            $table->string('city_name', 150)->nullable();
            $table->string('province_name', 150)->nullable();
            $table->string('temperature', 50)->nullable();
            $table->string('humidity', 50)->nullable();
            $table->string('wind_speed', 50)->nullable();
            $table->string('rainfall', 50)->nullable();
            $table->string('icon_url', 255)->nullable();
            $table->string('weather_description', 255)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weather_reports');
    }
};
