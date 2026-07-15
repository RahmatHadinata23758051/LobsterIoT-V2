<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'city_id',
    'serial_number',
    'ram_memory',
    'cpu_speed',
    'operating_system',
    'runtime_framework',
    'power_supply_type',
    'voltage_level',
    'ip_address',
    'gateway_ip',
    'latitude',
    'longitude',
    'max_connected_nodes',
    'device_photo',
    'installation_photo',
    'handover_signature',
    'installed_at',
    'activated_at',
    'activated_by'
])]
class EdgeGateway extends Model
{
    /**
     * Get the city where this edge gateway is installed.
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /**
     * Get the user who activated this edge gateway.
     */
    public function activatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'activated_by');
    }

    /**
     * Get the cages managed by this edge gateway.
     */
    public function cages(): HasMany
    {
        return $this->hasMany(Cage::class);
    }

}
