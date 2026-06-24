<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Province;
use App\Models\City;
use App\Models\EdgeGateway;
use App\Models\IotNode;
use App\Models\Cage;
use App\Models\Operator;
use App\Models\FeedingLog;
use App\Models\Camera;
use App\Models\SensorType;
use App\Models\Threshold;
use App\Models\Maintenance;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ModelsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test Eloquent relationships and schema mappings.
     */
    public function test_relationships_and_attributes(): void
    {
        // 1. Create User
        $user = User::create([
            'name' => 'Owner Name',
            'email' => 'owner@lobsense.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // 2. Create Province
        $province = Province::create([
            'code' => '32',
            'name' => 'JAWA BARAT',
        ]);

        // 3. Create City
        $city = City::create([
            'province_id' => $province->id,
            'code' => '3209',
            'name' => 'CIREBON',
        ]);

        // 4. Verify Province -> Cities relation
        $this->assertCount(1, $province->cities);
        $this->assertEquals('CIREBON', $province->cities->first()->name);

        // 5. Verify City -> Province relation
        $this->assertEquals('JAWA BARAT', $city->province->name);

        // 6. Create EdgeGateway
        $edge = EdgeGateway::create([
            'city_id' => $city->id,
            'serial_number' => 'GW-001',
            'activated_by' => $user->id,
        ]);

        // 7. Verify EdgeGateway -> City relation
        $this->assertEquals('CIREBON', $edge->city->name);
        $this->assertEquals('Owner Name', $edge->activatedBy->name);

        // 8. Create IotNode
        $node = IotNode::create([
            'city_id' => $city->id,
            'owner_id' => $user->id,
            'edge_gateway_id' => $edge->id,
            'serial_number' => 'NODE-99081',
            'activated_by' => $user->id,
        ]);

        // 9. Verify IotNode relations
        $this->assertEquals('CIREBON', $node->city->name);
        $this->assertEquals('Owner Name', $node->owner->name);
        $this->assertEquals('GW-001', $node->edgeGateway->serial_number);
        $this->assertEquals('Owner Name', $node->activatedBy->name);

        // 10. Create Cage
        $cage = Cage::create([
            'cage_code' => 'CAGE-01',
            'latitude' => -7.123,
            'longitude' => 108.123,
            'volume_cubic_meters' => 12.5,
            'structure_condition' => 'Good',
        ]);

        // 11. Create Operator
        $operator = Operator::create([
            'full_name' => 'Operator Udin',
            'phone_number' => '0812345',
            'address' => 'Cirebon',
        ]);

        // 12. Create FeedingLog
        $feed = FeedingLog::create([
            'cage_id' => $cage->id,
            'operator_id' => $operator->id,
            'feed_session' => 'morning',
            'feed_type' => 'Pelet',
            'weight_kg' => 1.5,
        ]);

        // 13. Verify Cage and Operator relations
        $this->assertCount(1, $cage->feedingLogs);
        $this->assertEquals('morning', $cage->feedingLogs->first()->feed_session);
        $this->assertCount(1, $operator->feedingLogs);
        $this->assertEquals('morning', $operator->feedingLogs->first()->feed_session);

        // 14. Create Camera
        $camera = Camera::create([
            'camera_code' => 'CAM-01',
            'cage_id' => $cage->id,
            'stream_url' => 'rtsp://test',
            'is_active' => true,
        ]);

        // 15. Verify Camera -> Cage relation
        $this->assertEquals('CAGE-01', $camera->cage->cage_code);
        $this->assertCount(1, $cage->cameras);

        // 16. Create SensorType
        $sensor = SensorType::create([
            'sensor_code' => 'ph',
            'value_range' => '6.5 - 8.5',
            'description' => 'pH air',
        ]);

        // 17. Create Threshold config
        $threshold = Threshold::create([
            'iot_node_serial_number' => $node->serial_number,
            'sensor_code' => $sensor->sensor_code,
            'value_min' => 6.50,
            'value_max' => 8.50,
            'offset_value' => 0.00,
        ]);

        // 18. Verify Threshold relations via custom keys
        $this->assertEquals('NODE-99081', $threshold->iotNode->serial_number);
        $this->assertEquals('ph', $threshold->sensorType->sensor_code);
        $this->assertCount(1, $node->thresholds);
        $this->assertEquals('ph', $node->thresholds->first()->sensor_code);

        // 19. Create Maintenance log
        $maintenance = Maintenance::create([
            'iot_node_id' => $node->id,
            'operator_id' => $user->id,
            'description' => 'Cleaned DO sensor.',
        ]);

        // 20. Verify Maintenance relations
        $this->assertEquals('NODE-99081', $maintenance->iotNode->serial_number);
        $this->assertEquals('Owner Name', $maintenance->operator->name);
        $this->assertCount(1, $node->maintenances);
    }
}
