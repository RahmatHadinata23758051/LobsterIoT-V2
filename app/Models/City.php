<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['province_id', 'code', 'name'])]
class City extends Model
{
    /**
     * Get the province this city belongs to.
     */
    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }

    /**
     * Get the edge gateways in this city.
     */
    public function edgeGateways(): HasMany
    {
        return $this->hasMany(EdgeGateway::class);
    }

    /**
     * Get the IoT nodes in this city.
     */
    public function iotNodes(): HasMany
    {
        return $this->hasMany(IotNode::class);
    }
}
