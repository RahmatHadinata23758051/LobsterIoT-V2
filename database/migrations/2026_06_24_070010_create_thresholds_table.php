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
        Schema::create('thresholds', function (Blueprint $table) {
            $table->id();
            $table->string('iot_node_serial_number', 100)->nullable();
            $table->string('sensor_code', 50)->nullable();
            $table->decimal('value_min', 8, 2)->default(0.00);
            $table->decimal('value_max', 8, 2)->default(0.00);
            $table->decimal('offset_value', 8, 2)->default(0.00);
            $table->string('filter_rules', 255)->nullable();
            $table->timestamps();

            // Foreign Key constraints
            $table->foreign('iot_node_serial_number')
                  ->references('serial_number')
                  ->on('iot_nodes')
                  ->onDelete('set null');

            $table->foreign('sensor_code')
                  ->references('sensor_code')
                  ->on('sensor_types')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('thresholds', function (Blueprint $table) {
            $table->dropForeign(['iot_node_serial_number']);
            $table->dropForeign(['sensor_code']);
        });
        Schema::dropIfExists('thresholds');
    }
};
