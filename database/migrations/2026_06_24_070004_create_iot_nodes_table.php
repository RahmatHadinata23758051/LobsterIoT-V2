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
        Schema::create('iot_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('city_id')->constrained('cities')->onDelete('cascade');
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('edge_gateway_id')->nullable()->constrained('edge_gateways')->onDelete('set null');
            $table->bigInteger('gateway_channel_number')->nullable();
            $table->string('serial_number', 100)->unique();
            $table->string('ip_address', 45)->nullable();
            $table->string('gateway_ip', 45)->nullable();
            $table->decimal('latitude', 11, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
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
        Schema::dropIfExists('iot_nodes');
    }
};
