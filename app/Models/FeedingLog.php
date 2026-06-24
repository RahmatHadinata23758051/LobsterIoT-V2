<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['cage_id', 'operator_id', 'feed_session', 'feed_type', 'weight_kg'])]
class FeedingLog extends Model
{
    /**
     * Get the cage where the feeding occurred.
     */
    public function cage(): BelongsTo
    {
        return $this->belongsTo(Cage::class);
    }

    /**
     * Get the operator who performed the feeding.
     */
    public function operator(): BelongsTo
    {
        return $this->belongsTo(Operator::class);
    }
}
