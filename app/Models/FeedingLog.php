<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['iot_node_id', 'operator_id', 'feed_session', 'feed_type', 'weight_kg'])]
class FeedingLog extends Model
{
    /**
     * Get the IoT Node where the feeding occurred.
     */
    public function iotNode(): BelongsTo
    {
        return $this->belongsTo(IotNode::class);
    }


    /**
     * Get the operator who performed the feeding.
     */
    public function operator(): BelongsTo
    {
        return $this->belongsTo(Operator::class);
    }
}
