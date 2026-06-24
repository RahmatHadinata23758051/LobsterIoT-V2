<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'iot_node_serial_number',
    'sensor_code',
    'value_min',
    'value_max',
    'offset_value',
    'filter_rules'
])]
class Threshold extends Model
{
    /**
     * Get the IoT Node this threshold config belongs to.
     */
    public function iotNode(): BelongsTo
    {
        return $this->belongsTo(IotNode::class, 'iot_node_serial_number', 'serial_number');
    }

    /**
     * Get the Sensor Type this threshold config belongs to.
     */
    public function sensorType(): BelongsTo
    {
        return $this->belongsTo(SensorType::class, 'sensor_code', 'sensor_code');
    }
}
