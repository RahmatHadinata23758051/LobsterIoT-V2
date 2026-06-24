<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'province_code',
    'city_code',
    'district_code',
    'village_code',
    'village_name',
    'district_name',
    'city_name',
    'province_name',
    'temperature',
    'humidity',
    'wind_speed',
    'rainfall',
    'icon_url',
    'weather_description'
])]
class WeatherReport extends Model
{
    // Purely transactional lookup table, no explicit relationships
}
