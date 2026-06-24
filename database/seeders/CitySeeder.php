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
        $jabar = DB::table('provinces')->where('code', '32')->first();
        if ($jabar) {
            DB::table('cities')->updateOrInsert(
                ['code' => '3209'],
                [
                    'province_id' => $jabar->id,
                    'name' => 'CIREBON',
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );

            DB::table('cities')->updateOrInsert(
                ['code' => '3201'],
                [
                    'province_id' => $jabar->id,
                    'name' => 'BOGOR',
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );

            DB::table('cities')->updateOrInsert(
                ['code' => '3273'],
                [
                    'province_id' => $jabar->id,
                    'name' => 'BANDUNG',
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        $jakarta = DB::table('provinces')->where('code', '31')->first();
        if ($jakarta) {
            DB::table('cities')->updateOrInsert(
                ['code' => '3171'],
                [
                    'province_id' => $jakarta->id,
                    'name' => 'JAKARTA SELATAN',
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }
    }
}
