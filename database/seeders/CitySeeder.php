<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $indoCities = DB::table('indonesia_cities')->get();
        foreach ($indoCities as $city) {
            $prov = DB::table('provinces')->where('code', $city->province_code)->first();
            if ($prov) {
                DB::table('cities')->updateOrInsert(
                    ['code' => $city->code],
                    [
                        'province_id' => $prov->id,
                        'name' => $city->name,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]
                );
            }
        }
    }
}
