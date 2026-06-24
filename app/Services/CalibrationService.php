<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class CalibrationService
{
    /**
     * Calibrate raw sensor readings for a given IoT Node serial number.
     *
     * @param string $serialNumber
     * @param array $rawValues Associative array of [sensor_code => raw_value]
     * @return array Associative array of [sensor_code => calibrated_value]
     */
    public function calibrate(string $serialNumber, array $rawValues): array
    {
        // Fetch all thresholds for this specific serial number
        $thresholds = DB::table('thresholds')
            ->where('iot_node_serial_number', $serialNumber)
            ->get()
            ->keyBy('sensor_code');

        $calibratedValues = [];

        foreach ($rawValues as $sensorCode => $rawValue) {
            // Default to raw value if no threshold is set
            $calibrated = (float) $rawValue;

            if ($thresholds->has($sensorCode)) {
                $threshold = $thresholds->get($sensorCode);

                // Apply offset
                $calibrated += (float) ($threshold->offset_value ?? 0.00);

                // Apply filter rules
                if ($threshold->filter_rules === 'clamp_extreme') {
                    $min = (float) ($threshold->value_min ?? 0.00);
                    $max = (float) ($threshold->value_max ?? 0.00);
                    
                    // Only clamp if min < max to avoid incorrect config issues
                    if ($min < $max) {
                        $calibrated = max($min, min($max, $calibrated));
                    }
                }
            } else {
                // If there's no custom database threshold, apply default sanity checks
                $calibrated = $this->applyFreshwaterSanityCheck($sensorCode, $calibrated);
            }

            $calibratedValues[$sensorCode] = $calibrated;
        }

        return $calibratedValues;
    }

    /**
     * Apply freshwater sanity checks and clamp values to realistic limits if they exceed physics logic.
     */
    protected function applyFreshwaterSanityCheck(string $sensorCode, float $value): float
    {
        switch ($sensorCode) {
            case 'ph':
                // pH is physically limited between 0 and 14
                return max(0.0, min(14.0, $value));
            case 'water_temperature':
            case 'ambient_temperature':
            case 'temperature_node':
            case 'temperature_edge':
                // Reasonable water/ambient temperature limits in celsius
                return max(-10.0, min(60.0, $value));
            case 'tds':
            case 'turbidity':
            case 'salinity':
            case 'flow_rate':
                // These metrics cannot be negative
                return max(0.0, $value);
            default:
                return $value;
        }
    }
}
