<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

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
            $provinceId = DB::table('provinces')->insertGetId([
                'code' => '52',
                'name' => 'NUSA TENGGARA BARAT',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $cityId = DB::table('cities')->insertGetId([
                'province_id' => $provinceId,
                'code' => '5201',
                'name' => 'KABUPATEN LOMBOK BARAT',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $city = DB::table('cities')->where('id', $cityId)->first();
            $this->command->info('✅ Fallback Province & City Lombok Barat dibuat.');
        }

        // 3. Buat / update Edge Gateway
        $gateway = DB::table('edge_gateways')->where('serial_number', 'DEMO-EDGE-001')->first();
        if (!$gateway) {
            $gatewayId = DB::table('edge_gateways')->insertGetId([
                'serial_number' => 'DEMO-EDGE-001',
                'city_id'       => $city->id,
                'activated_at'  => now(),
                'activated_by'  => $adminUser->id,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
            $this->command->info('✅ Edge Gateway DEMO-EDGE-001 dibuat.');
        } else {
            $gatewayId = $gateway->id;
            $this->command->info('✅ Edge Gateway DEMO-EDGE-001 sudah ada.');
        }

        // 4. Daftar Node & Cage yang didaftarkan (termasuk LOBSTER-ESP32-001/002/003 dan AQ-01)
        $nodesToSeed = [
            ['serial' => 'DEMO-NODE-001', 'cage' => 'CAGE-A01', 'lat' => -8.6529, 'lng' => 116.3195],
            ['serial' => 'AQ-01',           'cage' => 'CAGE-A01', 'lat' => -8.6530, 'lng' => 116.3196],
            ['serial' => 'LOBSTER-ESP32-001', 'cage' => 'CAGE-A01', 'lat' => -8.6528, 'lng' => 116.3194],
            ['serial' => 'LOBSTER-ESP32-002', 'cage' => 'CAGE-A02', 'lat' => -8.6524, 'lng' => 116.3199],
            ['serial' => 'LOBSTER-ESP32-003', 'cage' => 'CAGE-A03', 'lat' => -8.6518, 'lng' => 116.3205],
        ];

        $sensorCodes = ['ph', 'tds', 'dissolved_oxygen', 'water_temperature', 'ambient_temperature', 'flow_rate', 'turbidity', 'salinity'];
        $thresholdDefaults = [
            'ph'                => ['min' => 7.5,  'max' => 8.5],
            'tds'               => ['min' => 800,  'max' => 1000],
            'dissolved_oxygen'  => ['min' => 5.0,  'max' => 8.0],
            'water_temperature' => ['min' => 24.0, 'max' => 28.0],
            'ambient_temperature'=>['min' => 25.0, 'max' => 35.0],
            'flow_rate'         => ['min' => 0.1,  'max' => 0.5],
            'turbidity'         => ['min' => 0.0,  'max' => 30.0],
            'salinity'          => ['min' => 0.0,  'max' => 35.0],
        ];

        foreach ($nodesToSeed as $nodeItem) {
            $serial = $nodeItem['serial'];
            $cageCode = $nodeItem['cage'];

            // Ensure Cage exists
            $cage = DB::table('cages')->where('cage_code', $cageCode)->first();
            if (!$cage) {
                $cageId = DB::table('cages')->insertGetId([
                    'cage_code'          => $cageCode,
                    'edge_gateway_id'    => $gatewayId,
                    'latitude'           => $nodeItem['lat'],
                    'longitude'          => $nodeItem['lng'],
                    'volume_cubic_meters'=> 8.0,
                    'structure_condition'=> 'baik',
                    'lobster_count'      => 50,
                    'created_at'         => now(),
                    'updated_at'         => now(),
                ]);
            } else {
                $cageId = $cage->id;
            }

            // Ensure IoT Node exists
            $nodeExists = DB::table('iot_nodes')->where('serial_number', $serial)->exists();
            if (!$nodeExists) {
                DB::table('iot_nodes')->insert([
                    'serial_number'  => $serial,
                    'city_id'        => $city->id,
                    'owner_id'       => $adminUser->id,
                    'edge_gateway_id'=> $gatewayId,
                    'cage_id'        => $cageId,
                    'latitude'       => $nodeItem['lat'],
                    'longitude'      => $nodeItem['lng'],
                    'ip_address'     => '192.168.1.100',
                    'activated_at'   => now(), // WAJIB agar muncul di activeNodes()
                    'activated_by'   => $adminUser->id,
                    'installed_at'   => now()->subDays(30),
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
                $this->command->info("✅ IoT Node {$serial} terdaftar (activated).");
            } else {
                DB::table('iot_nodes')
                    ->where('serial_number', $serial)
                    ->update([
                        'activated_at' => now(), 
                        'cage_id' => $cageId,
                        'edge_gateway_id' => $gatewayId,
                        'updated_at' => now()
                    ]);
            }

            // Ensure Thresholds exist
            foreach ($thresholdDefaults as $code => $range) {
                $exists = DB::table('thresholds')
                    ->where('iot_node_serial_number', $serial)
                    ->where('sensor_code', $code)
                    ->exists();

                if (!$exists) {
                    DB::table('thresholds')->insert([
                        'iot_node_serial_number' => $serial,
                        'sensor_code'            => $code,
                        'value_min'              => $range['min'],
                        'value_max'              => $range['max'],
                        'offset_value'           => 0,
                        'created_at'             => now(),
                        'updated_at'             => now(),
                    ]);
                }
            }
        }

        // 6. Buat Operator Lapangan
        $operator = DB::table('operators')->where('phone_number', '081234567890')->first();
        if (!$operator) {
            $operatorId = DB::table('operators')->insertGetId([
                'full_name'    => 'Operator Lapangan Demo',
                'phone_number' => '081234567890',
                'address'      => 'Lombok Barat',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $operatorId = $operator->id;
        }

        // 7. Buat CCTV & Feeding logs untuk node pertama
        $targetNodeId = DB::table('iot_nodes')->where('serial_number', 'LOBSTER-ESP32-001')->value('id')
                     ?? DB::table('iot_nodes')->where('serial_number', 'DEMO-NODE-001')->value('id');

        if ($targetNodeId) {
            $cameraExists = DB::table('cameras')->where('iot_node_id', $targetNodeId)->exists();
            if (!$cameraExists) {
                DB::table('cameras')->insert([
                    'iot_node_id' => $targetNodeId,
                    'camera_code' => 'CAM-DEMO-1',
                    'stream_url'  => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    'is_active'   => true,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }

        $this->command->info('');
        $this->command->info('✅ Node LOBSTER-ESP32-001, 002, 003, AQ-01, dan DEMO-NODE-001 berhasil didaftarkan ke Database!');
    }
}
