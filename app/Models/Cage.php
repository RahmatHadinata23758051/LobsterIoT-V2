<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'cage_code',
    'edge_gateway_id',
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
     * Get the Edge Gateway managing this cage.
     */
    public function edgeGateway(): BelongsTo
    {
        return $this->belongsTo(EdgeGateway::class);
    }

    /**
     * Get the IoT Node installed in this cage.
     */
    public function iotNode(): HasOne
    {
        return $this->hasOne(IotNode::class);
    }
}
