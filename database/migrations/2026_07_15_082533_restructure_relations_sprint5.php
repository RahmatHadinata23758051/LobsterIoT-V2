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
        Schema::table('cages', function (Blueprint $table) {
            $table->foreignId('edge_gateway_id')->nullable()->constrained('edge_gateways')->onDelete('set null');
        });

        Schema::table('iot_nodes', function (Blueprint $table) {
            $table->foreignId('cage_id')->nullable()->constrained('cages')->onDelete('set null');
        });

        Schema::table('cameras', function (Blueprint $table) {
            $table->dropForeign(['cage_id']);
            $table->dropColumn('cage_id');
            $table->foreignId('iot_node_id')->nullable()->constrained('iot_nodes')->onDelete('cascade');
        });

        Schema::table('feeding_logs', function (Blueprint $table) {
            $table->dropForeign(['cage_id']);
            $table->dropColumn('cage_id');
            $table->foreignId('iot_node_id')->nullable()->constrained('iot_nodes')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('feeding_logs', function (Blueprint $table) {
            $table->dropForeign(['iot_node_id']);
            $table->dropColumn('iot_node_id');
            $table->foreignId('cage_id')->nullable()->constrained('cages')->onDelete('cascade');
        });

        Schema::table('cameras', function (Blueprint $table) {
            $table->dropForeign(['iot_node_id']);
            $table->dropColumn('iot_node_id');
            $table->foreignId('cage_id')->nullable()->constrained('cages')->onDelete('cascade');
        });

        Schema::table('iot_nodes', function (Blueprint $table) {
            $table->dropForeign(['cage_id']);
            $table->dropColumn('cage_id');
        });

        Schema::table('cages', function (Blueprint $table) {
            $table->dropForeign(['edge_gateway_id']);
            $table->dropColumn('edge_gateway_id');
        });
    }
};
