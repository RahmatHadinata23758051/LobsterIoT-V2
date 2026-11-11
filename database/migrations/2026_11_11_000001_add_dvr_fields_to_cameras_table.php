<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cameras', function (Blueprint $table) {
            $table->string('dvr_ip', 253)->nullable();
            $table->unsignedSmallInteger('port')->nullable()->default(554);
            $table->unsignedTinyInteger('channel_number')->nullable();
            $table->string('protocol', 20)->nullable()->default('rtsp');
            $table->string('username', 100)->nullable();
            $table->text('password')->nullable();
            $table->string('rtsp_url', 500)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('cameras', function (Blueprint $table) {
            $table->dropColumn([
                'dvr_ip',
                'port',
                'channel_number',
                'protocol',
                'username',
                'password',
                'rtsp_url',
            ]);
        });
    }
};
