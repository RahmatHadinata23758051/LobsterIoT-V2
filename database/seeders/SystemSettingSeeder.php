<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemSetting;

class SystemSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SystemSetting::updateOrCreate(
            ['key' => 'system_latitude'],
            ['value' => '-8.723300', 'description' => 'Garis lintang utama koordinat tambak']
        );

        SystemSetting::updateOrCreate(
            ['key' => 'system_longitude'],
            ['value' => '115.908300', 'description' => 'Garis bujur utama koordinat tambak']
        );

        SystemSetting::updateOrCreate(
            ['key' => 'system_city_name'],
            ['value' => 'Lombok Barat', 'description' => 'Nama wilayah/kota pusat operasional tambak']
        );
    }
}
