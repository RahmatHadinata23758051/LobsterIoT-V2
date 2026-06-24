<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['code', 'name'])]
class Province extends Model
{
    /**
     * Get the cities in this province.
     */
    public function cities(): HasMany
    {
        return $this->hasMany(City::class);
    }
}
