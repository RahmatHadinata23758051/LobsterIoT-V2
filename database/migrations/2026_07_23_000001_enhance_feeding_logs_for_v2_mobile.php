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
        Schema::table('feeding_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('feeding_logs', 'user_id')) {
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('feeding_logs', 'food_type')) {
                $table->string('food_type', 100)->nullable();
            }
            if (!Schema::hasColumn('feeding_logs', 'amount_kg')) {
                $table->double('amount_kg')->default(0.0);
            }
            if (!Schema::hasColumn('feeding_logs', 'notes')) {
                $table->text('notes')->nullable();
            }
            if (!Schema::hasColumn('feeding_logs', 'fed_at')) {
                $table->timestamp('fed_at')->nullable();
            }
            
            // Make legacy fields nullable if present
            if (Schema::hasColumn('feeding_logs', 'operator_id')) {
                $table->foreignId('operator_id')->nullable()->change();
            }
            if (Schema::hasColumn('feeding_logs', 'feed_session')) {
                $table->string('feed_session', 50)->nullable()->change();
            }
            if (Schema::hasColumn('feeding_logs', 'feed_type')) {
                $table->string('feed_type', 100)->nullable()->change();
            }
            if (Schema::hasColumn('feeding_logs', 'weight_kg')) {
                $table->double('weight_kg')->default(0.0)->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('feeding_logs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'food_type', 'amount_kg', 'notes', 'fed_at']);
        });
    }
};
