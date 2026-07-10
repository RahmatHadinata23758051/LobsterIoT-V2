<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin User
        User::updateOrCreate(
            ['email' => 'admin@lobsense.com'],
            [
                'name' => 'Admin Lobsense',
                'password' => Hash::make('123'),
                'role' => 'admin',
            ]
        );

        // Create Operator User
        User::updateOrCreate(
            ['email' => 'operator@lobsense.com'],
            [
                'name' => 'Operator Lobsense',
                'password' => Hash::make('123'),
                'role' => 'operator',
            ]
        );

        $this->call([
            ProvinceSeeder::class,
            CitySeeder::class,
            SensorTypeSeeder::class,
            SystemSettingSeeder::class,
        ]);
    }
}
