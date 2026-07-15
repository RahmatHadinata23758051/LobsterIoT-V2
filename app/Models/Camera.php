<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['camera_code', 'iot_node_id', 'stream_url', 'is_active'])]
class Camera extends Model
{
    /**
     * Get the IoT Node this camera is placed in.
     */
    public function iotNode(): BelongsTo
    {
        return $this->belongsTo(IotNode::class);
    }
}

