<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProvinceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $indoProvinces = DB::table('indonesia_provinces')->get();
        foreach ($indoProvinces as $prov) {
            DB::table('provinces')->updateOrInsert(
                ['code' => $prov->code],
                [
                    'name' => $prov->name,
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }
    }
}
