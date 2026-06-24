<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SensorTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sensors = [
            [
                'sensor_code' => 'ph',
                'value_range' => '6.5 - 8.5',
                'description' => 'Tingkat keasaman (pH) air kolam lobster air tawar.',
            ],
            [
                'sensor_code' => 'tds',
                'value_range' => '150 - 400 ppm',
                'description' => 'Total Dissolved Solids (kandungan padatan terlarut) dalam air.',
            ],
            [
                'sensor_code' => 'water_temperature',
                'value_range' => '24 - 30 C',
                'description' => 'Suhu air kolam utama lobster.',
            ],
            [
                'sensor_code' => 'dissolved_oxygen',
                'value_range' => '> 5 mg/L',
                'description' => 'Kandungan oksigen terlarut dalam air kolam.',
            ],
            [
                'sensor_code' => 'turbidity',
                'value_range' => '0 - 100 NTU',
                'description' => 'Tingkat kekeruhan air kolam.',
            ],
            [
                'sensor_code' => 'flow_rate',
                'value_range' => '0 - 10 L/min',
                'description' => 'Debit aliran air sirkulasi filter kolam.',
            ]
        ];

        foreach ($sensors as $sensor) {
            DB::table('sensor_types')->updateOrInsert(
                ['sensor_code' => $sensor['sensor_code']],
                [
                    'value_range' => $sensor['value_range'],
                    'description' => $sensor['description'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }
    }
}
