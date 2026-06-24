<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['camera_code', 'cage_id', 'stream_url', 'is_active'])]
class Camera extends Model
{
    /**
     * Get the cage this camera is placed in.
     */
    public function cage(): BelongsTo
    {
        return $this->belongsTo(Cage::class);
    }
}
