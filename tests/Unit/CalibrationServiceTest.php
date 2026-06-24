<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\CalibrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

class CalibrationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected CalibrationService $calibrationService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calibrationService = new CalibrationService();
    }

    /**
     * Test calibration with no custom database thresholds (uses default sanity checks).
     */
    public function test_calibrate_with_no_database_thresholds(): void
    {
        $raw = [
            'ph' => 15.0, // Should be clamped to 14.0 by default sanity check
            'water_temperature' => 25.5, // Should remain same
            'tds' => -10.0, // Should be clamped to 0.0 by default sanity check
        ];

        $calibrated = $this->calibrationService->calibrate('NODE-DUMMY', $raw);

        $this->assertEquals(14.0, $calibrated['ph']);
        $this->assertEquals(25.5, $calibrated['water_temperature']);
        $this->assertEquals(0.0, $calibrated['tds']);
    }

    /**
     * Test calibration applying database offsets and clamping filters.
     */
    public function test_calibrate_with_database_thresholds_and_rules(): void
    {
        // 1. Create a dummy user
        $userId = DB::table('users')->insertGetId([
            'name' => 'Test User',
            'email' => 'test@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // 2. Create a dummy province & city
        $provinceId = DB::table('provinces')->insertGetId([
            'code' => '32',
            'name' => 'JAWA BARAT',
            'created_at' => now(),
            'updated_at' => now()
        ]);
        $cityId = DB::table('cities')->insertGetId([
            'province_id' => $provinceId,
            'code' => '3201',
            'name' => 'BOGOR',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // 3. Create a dummy IoT Node
        DB::table('iot_nodes')->insert([
            'id' => 1,
            'city_id' => $cityId,
            'owner_id' => $userId,
            'serial_number' => 'NODE-99081',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // 4. Create dummy sensor types
        DB::table('sensor_types')->insert([
            ['sensor_code' => 'ph', 'created_at' => now(), 'updated_at' => now()],
            ['sensor_code' => 'water_temperature', 'created_at' => now(), 'updated_at' => now()]
        ]);

        // 5. Create threshold configs
        DB::table('thresholds')->insert([
            [
                'iot_node_serial_number' => 'NODE-99081',
                'sensor_code' => 'ph',
                'value_min' => 6.50,
                'value_max' => 8.50,
                'offset_value' => 0.10, // offset
                'filter_rules' => 'clamp_extreme',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'iot_node_serial_number' => 'NODE-99081',
                'sensor_code' => 'water_temperature',
                'value_min' => 24.00,
                'value_max' => 30.00,
                'offset_value' => -0.50, // offset
                'filter_rules' => null, // no clamping
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        $raw = [
            'ph' => 8.45, // Calibrated: 8.45 + 0.10 = 8.55 -> Clamped to 8.50 (value_max)
            'water_temperature' => 28.0, // Calibrated: 28.0 - 0.50 = 27.50 -> No clamp rules, returns 27.50
        ];

        $calibrated = $this->calibrationService->calibrate('NODE-99081', $raw);

        $this->assertEquals(8.50, $calibrated['ph']);
        $this->assertEquals(27.50, $calibrated['water_temperature']);
    }
}
