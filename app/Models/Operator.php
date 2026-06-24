<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['full_name', 'phone_number', 'address'])]
class Operator extends Model
{
    /**
     * Get the feeding logs submitted by this operator.
     */
    public function feedingLogs(): HasMany
    {
        return $this->hasMany(FeedingLog::class);
    }
}
