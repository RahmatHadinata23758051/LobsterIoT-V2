<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DemoNodeSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil admin user sebagai owner
        $adminUser = DB::table('users')->where('email', 'admin@lobsense.com')->first();
        if (!$adminUser) {
            $this->command->error('User admin@lobsense.com tidak ditemukan. Jalankan php artisan db:seed terlebih dahulu.');
            return;
        }

        // 2. Ambil city_id (Lombok atau fallback ke first)
        $city = DB::table('cities')->where('name', 'like', '%Lombok%')->first()
             ?? DB::table('cities')->first();
        if (!$city) {
            $this->command->error('Tidak ada data kota. Jalankan php artisan db:seed terlebih dahulu.');
            return;
        }

        // 3. Buat / update IoT Node (sudah activated)
        $nodeExists = DB::table('iot_nodes')->where('serial_number', 'DEMO-NODE-001')->exists();
        if (!$nodeExists) {
            DB::table('iot_nodes')->insert([
                'serial_number'  => 'DEMO-NODE-001',
                'city_id'        => $city->id,
                'owner_id'       => $adminUser->id,
                'latitude'       => -8.6529,
                'longitude'      => 116.3195,
                'ip_address'     => '192.168.1.100',
                'activated_at'   => now(), // WAJIB agar muncul di activeNodes()
                'activated_by'   => $adminUser->id,
                'installed_at'   => now()->subDays(30),
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
            $this->command->info('✅ IoT Node DEMO-NODE-001 dibuat (activated).');
        } else {
            // Pastikan activated_at terisi
            DB::table('iot_nodes')
                ->where('serial_number', 'DEMO-NODE-001')
                ->update(['activated_at' => now(), 'updated_at' => now()]);
            $this->command->info('✅ IoT Node DEMO-NODE-001 sudah ada, updated activated_at.');
        }

        // 4. Buat Cage
        $cageExists = DB::table('cages')->where('cage_code', 'CAGE-A01')->exists();
        if (!$cageExists) {
            DB::table('cages')->insert([
                'cage_code'          => 'CAGE-A01',
                'latitude'           => -8.6530,
                'longitude'          => 116.3196,
                'volume_cubic_meters'=> 8.0,
                'structure_condition'=> 'baik',
                'lobster_count'      => 50,
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
            $this->command->info('✅ Cage CAGE-A01 dibuat.');
        } else {
            $this->command->info('✅ Cage CAGE-A01 sudah ada.');
        }

        // 5. Buat sensor thresholds (linked via iot_node_serial_number)
        $sensorCodes = ['ph', 'tds', 'do', 'suhu', 'arus', 'turbidity'];
        $thresholdDefaults = [
            'ph'                => ['min' => 7.5,  'max' => 8.5],
            'tds'               => ['min' => 800,  'max' => 1000],
            'dissolved_oxygen'  => ['min' => 5.0,  'max' => 8.0],
            'water_temperature' => ['min' => 24.0, 'max' => 28.0],
            'flow_rate'         => ['min' => 0.1,  'max' => 0.3],
            'turbidity'         => ['min' => 0.0,  'max' => 5.0],
        ];

        foreach ($thresholdDefaults as $code => $range) {
            $exists = DB::table('thresholds')
                ->where('iot_node_serial_number', 'DEMO-NODE-001')
                ->where('sensor_code', $code)
                ->exists();

            if (!$exists) {
                DB::table('thresholds')->insert([
                    'iot_node_serial_number' => 'DEMO-NODE-001',
                    'sensor_code'            => $code,
                    'value_min'              => $range['min'],
                    'value_max'              => $range['max'],
                    'offset_value'           => 0,
                    'created_at'             => now(),
                    'updated_at'             => now(),
                ]);
            }
        }
        $this->command->info('✅ Threshold sensor dibuat untuk DEMO-NODE-001.');
        $this->command->info('');
        $this->command->info('⚠  Data telemetry (sensor readings) disimpan di InfluxDB.');
        $this->command->info('   Pastikan IoT device mengirim MQTT atau kirim data manual via API.');
        $this->command->info('   Node sudah aktif dan muncul di dashboard. Login dan cek!');
    }
}
