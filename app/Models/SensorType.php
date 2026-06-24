<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['sensor_code', 'value_range', 'description'])]
class SensorType extends Model
{
    /**
     * Get the thresholds configured for this sensor type.
     */
    public function thresholds(): HasMany
    {
        return $this->hasMany(Threshold::class, 'sensor_code', 'sensor_code');
    }
}
