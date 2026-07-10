<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogPrediction extends Model
{
    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'raw_prediction' => 'array',
        'class_percentage' => 'array',
    ];
}
