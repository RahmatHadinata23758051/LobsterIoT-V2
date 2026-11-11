<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Cage;
use App\Models\City;
use App\Models\IotNode;
use App\Models\Province;
use App\Services\InfluxDBService;
use App\Services\CalibrationService;
use App\Console\Commands\MqttSubscribeCommand;
use Illuminate\Console\OutputStyle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\NullOutput;

class MqttSubscribeCommandTest extends TestCase
{
    use RefreshDatabase;

    protected MqttSubscribeCommand $command;
    protected IotNode $node;

    protected function setUp(): void
    {
        parent::setUp();

        $this->command = new MqttSubscribeCommand();
        $this->command->setOutput(new OutputStyle(new ArrayInput([]), new NullOutput()));

        $user = User::create([
            'name' => 'MQTT Owner',
            'email' => 'mqtt@lobsense.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $province = Province::create(['code' => '51', 'name' => 'Bali']);
        $city = City::create(['province_id' => $province->id, 'code' => '5101', 'name' => 'Denpasar']);
        $cage = Cage::create([
            'cage_code' => 'CAGE-MQTT-1',
            'latitude' => -8.65,
            'longitude' => 115.21,
            'volume_cubic_meters' => 20.0,
            'structure_condition' => 'Good',
        ]);

        $this->node = IotNode::create([
            'serial_number' => 'SN-MQTT-001',
            'city_id' => $city->id,
            'owner_id' => $user->id,
            'cage_id' => $cage->id,
            'activated_at' => now(),
        ]);
    }

    private function ingest(array $payload, string $topic, InfluxDBService $influx): void
    {
        $method = new \ReflectionMethod($this->command, 'processTelemetry');
        $method->setAccessible(true);
        $method->invoke(
            $this->command,
            $payload,
            $topic,
            $influx,
            app(CalibrationService::class)
        );
    }

    public function test_discards_telemetry_for_unregistered_serial(): void
    {
        $influx = $this->createMock(InfluxDBService::class);
        $influx->expects($this->never())->method('writePoint');

        $this->ingest(
            ['serial_number' => 'ROGUE-SERIAL', 'raw_values' => ['ph' => 7.1]],
            'lobsense/telemetry/ROGUE-SERIAL',
            $influx
        );
    }

    public function test_discards_telemetry_when_topic_serial_differs_from_payload(): void
    {
        $influx = $this->createMock(InfluxDBService::class);
        $influx->expects($this->never())->method('writePoint');

        $this->ingest(
            ['serial_number' => 'SN-MQTT-001', 'raw_values' => ['ph' => 7.1]],
            'lobsense/telemetry/SN-OTHER-002',
            $influx
        );
    }

    public function test_writes_calibrated_telemetry_using_relational_cage_code(): void
    {
        $writes = [];
        $influx = $this->createMock(InfluxDBService::class);
        $influx->method('writePoint')->willReturnCallback(
            function ($measurement, $tags, $fields, $timestamp) use (&$writes) {
                $writes[] = compact('measurement', 'tags', 'fields');
            }
        );

        $this->ingest(
            [
                'serial_number' => 'SN-MQTT-001',
                'cage_code' => 'STALE-PAYLOAD-CAGE',
                'raw_values' => ['ph' => 7.1, 'temperature_node' => 27.0],
            ],
            'lobsense/telemetry/SN-MQTT-001',
            $influx
        );

        $this->assertNotEmpty($writes);
        $calibrated = collect($writes)->firstWhere('measurement', 'telemetries');
        $this->assertNotNull($calibrated);
        $this->assertSame('SN-MQTT-001', $calibrated['tags']['iot_node_serial_number']);
        $this->assertSame('CAGE-MQTT-1', $calibrated['tags']['cage_code']);
        $this->assertSame(7.1, $calibrated['fields']['ph']);
    }

    public function test_accepts_serial_from_topic_when_payload_omits_it(): void
    {
        $writes = [];
        $influx = $this->createMock(InfluxDBService::class);
        $influx->method('writePoint')->willReturnCallback(
            function ($measurement, $tags) use (&$writes) {
                $writes[] = ['measurement' => $measurement, 'tags' => $tags];
            }
        );

        $this->ingest(['raw_values' => ['ph' => 7.3]], 'lobsense/telemetry/SN-MQTT-001', $influx);

        $this->assertNotEmpty($writes);
        $this->assertSame('SN-MQTT-001', $writes[0]['tags']['iot_node_serial_number']);
    }
}