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

        // 4. Buat / update Cage
        $cage = DB::table('cages')->where('cage_code', 'CAGE-A01')->first();
        if (!$cage) {
            $cageId = DB::table('cages')->insertGetId([
                'cage_code'          => 'CAGE-A01',
                'edge_gateway_id'    => $gatewayId,
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
            $cageId = $cage->id;
            // Pastikan edge_gateway_id terupdate
            DB::table('cages')
                ->where('id', $cageId)
                ->update(['edge_gateway_id' => $gatewayId, 'updated_at' => now()]);
            $this->command->info('✅ Cage CAGE-A01 sudah ada, updated edge_gateway_id.');
        }

        // 5. Buat / update IoT Node (sudah activated)
        $nodeExists = DB::table('iot_nodes')->where('serial_number', 'DEMO-NODE-001')->exists();
        if (!$nodeExists) {
            DB::table('iot_nodes')->insert([
                'serial_number'  => 'DEMO-NODE-001',
                'city_id'        => $city->id,
                'owner_id'       => $adminUser->id,
                'edge_gateway_id'=> $gatewayId,
                'cage_id'        => $cageId,
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
            // Pastikan activated_at dan cage_id terisi
            DB::table('iot_nodes')
                ->where('serial_number', 'DEMO-NODE-001')
                ->update([
                    'activated_at' => now(), 
                    'cage_id' => $cageId,
                    'edge_gateway_id' => $gatewayId,
                    'updated_at' => now()
                ]);
            $this->command->info('✅ IoT Node DEMO-NODE-001 sudah ada, updated cage_id.');
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

        // 6. Buat / update Operator Lapangan
        $operatorId = DB::table('operators')->insertGetId([
            'full_name'    => 'Operator Lapangan Demo',
            'phone_number' => '081234567890',
            'address'      => 'Lombok Barat',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 7. Buat / update Camera untuk DEMO-NODE-001
        $targetNodeId = DB::table('iot_nodes')->where('serial_number', 'DEMO-NODE-001')->value('id');
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
                $this->command->info('✅ Kamera CCTV untuk DEMO-NODE-001 dibuat.');
            }

            // 8. Buat / update Feeding Logs untuk DEMO-NODE-001
            $feedingLogExists = DB::table('feeding_logs')->where('iot_node_id', $targetNodeId)->exists();
            if (!$feedingLogExists) {
                DB::table('feeding_logs')->insert([
                    [
                        'iot_node_id' => $targetNodeId,
                        'operator_id' => $operatorId,
                        'feed_session'=> 'afternoon',
                        'feed_type'   => 'Pelet Bio',
                        'weight_kg'   => 2.50,
                        'created_at'  => now()->subHours(2),
                        'updated_at'  => now()->subHours(2),
                    ],
                    [
                        'iot_node_id' => $targetNodeId,
                        'operator_id' => $operatorId,
                        'feed_session'=> 'morning',
                        'feed_type'   => 'Runcah Segar',
                        'weight_kg'   => 1.75,
                        'created_at'  => now()->subHours(6),
                        'updated_at'  => now()->subHours(6),
                    ],
                    [
                        'iot_node_id' => $targetNodeId,
                        'operator_id' => $operatorId,
                        'feed_session'=> 'night',
                        'feed_type'   => 'Pelet Bio',
                        'weight_kg'   => 3.00,
                        'created_at'  => now()->subDays(1),
                        'updated_at'  => now()->subDays(1),
                    ]
                ]);
                $this->command->info('✅ 3 Log Pakan Terbaru untuk DEMO-NODE-001 dibuat.');
            }
        }

        $this->command->info('');
        $this->command->info('⚠  Data telemetry (sensor readings) disiapkan menggunakan fallback offline.');
        $this->command->info('   Node sudah aktif dan muncul di dashboard. Login dan cek!');
    }
}
