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
        DB::table('provinces')->updateOrInsert(
            ['code' => '32'],
            ['name' => 'JAWA BARAT', 'created_at' => now(), 'updated_at' => now()]
        );

        DB::table('provinces')->updateOrInsert(
            ['code' => '31'],
            ['name' => 'DKI JAKARTA', 'created_at' => now(), 'updated_at' => now()]
        );

        DB::table('provinces')->updateOrInsert(
            ['code' => '36'],
            ['name' => 'BANTEN', 'created_at' => now(), 'updated_at' => now()]
        );
    }
}
