<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'iot_node_id',
    'operator_id',
    'description',
    'device_photo',
    'operator_signature',
    'latitude',
    'longitude'
])]
class Maintenance extends Model
{
    /**
     * Get the IoT Node this maintenance log belongs to.
     */
    public function iotNode(): BelongsTo
    {
        return $this->belongsTo(IotNode::class);
    }

    /**
     * Get the operator (User) who performed the maintenance.
     */
    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }
}
