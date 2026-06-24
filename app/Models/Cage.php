<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'cage_code',
    'latitude',
    'longitude',
    'volume_cubic_meters',
    'structure_condition',
    'lobster_count',
    'lobster_age_days',
    'age_last_updated_at'
])]
class Cage extends Model
{
    /**
     * Get the feeding logs for this cage.
     */
    public function feedingLogs(): HasMany
    {
        return $this->hasMany(FeedingLog::class);
    }

    /**
     * Get the cameras installed in this cage.
     */
    public function cameras(): HasMany
    {
        return $this->hasMany(Camera::class);
    }
}
