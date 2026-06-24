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
        Schema::create('edge_gateways', function (Blueprint $table) {
            $table->id();
            $table->foreignId('city_id')->nullable()->constrained('cities')->onDelete('set null');
            $table->string('serial_number', 100)->unique();
            $table->string('ram_memory', 50)->nullable();
            $table->string('cpu_speed', 50)->nullable();
            $table->string('operating_system', 100)->nullable();
            $table->string('runtime_framework', 100)->nullable();
            $table->string('power_supply_type', 100)->nullable();
            $table->string('voltage_level', 50)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('gateway_ip', 45)->nullable();
            $table->decimal('latitude', 11, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('max_connected_nodes')->default(50);
            $table->string('device_photo', 255)->nullable();
            $table->string('installation_photo', 255)->nullable();
            $table->string('handover_signature', 255)->nullable();
            $table->timestamp('installed_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->foreignId('activated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('edge_gateways');
    }
};
