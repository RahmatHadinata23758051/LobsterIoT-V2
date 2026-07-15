<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'city_id',
    'owner_id',
    'edge_gateway_id',
    'cage_id',
    'gateway_channel_number',
    'serial_number',
    'ip_address',
    'gateway_ip',
    'latitude',
    'longitude',
    'device_photo',
    'installation_photo',
    'handover_signature',
    'installed_at',
    'activated_at',
    'activated_by'
])]
class IotNode extends Model
{
    /**
     * Get the city where this IoT Node is installed.
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /**
     * Get the owner (User) of this IoT Node.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the Cage monitored by this IoT Node.
     */
    public function cage(): BelongsTo
    {
        return $this->belongsTo(Cage::class);
    }

    /**
     * Get the cameras monitored by this IoT Node.
     */
    public function cameras(): HasMany
    {
        return $this->hasMany(Camera::class);
    }

    /**
     * Get the feeding logs for this IoT Node.
     */
    public function feedingLogs(): HasMany
    {
        return $this->hasMany(FeedingLog::class);
    }


    /**
     * Get the user who activated this IoT Node.
     */
    public function activatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'activated_by');
    }

    /**
     * Get the thresholds configured for this IoT Node.
     */
    public function thresholds(): HasMany
    {
        return $this->hasMany(Threshold::class, 'iot_node_serial_number', 'serial_number');
    }

    /**
     * Get the Edge Gateway that manages this IoT Node.
     */
    public function edgeGateway(): BelongsTo
    {
        return $this->belongsTo(EdgeGateway::class);
    }

    /**
     * Get the maintenance logs for this IoT Node.
     */
    public function maintenances(): HasMany
    {
        return $this->hasMany(Maintenance::class);
    }
}
