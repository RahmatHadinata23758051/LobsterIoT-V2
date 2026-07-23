<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeedingLog extends Model
{
    protected $guarded = [];

    protected $casts = [
        'fed_at' => 'datetime',
        'amount_kg' => 'double',
        'weight_kg' => 'double',
    ];

    /**
     * Get the IoT Node where the feeding occurred.
     */
    public function iotNode(): BelongsTo
    {
        return $this->belongsTo(IotNode::class);
    }

    /**
     * Get the operator who performed the feeding (legacy).
     */
    public function operator(): BelongsTo
    {
        return $this->belongsTo(Operator::class);
    }

    /**
     * Get the user who triggered/logged the feeding.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
