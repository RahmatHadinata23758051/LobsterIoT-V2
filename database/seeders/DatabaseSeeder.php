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
        // ── 1. Admin — full system access ──
        User::updateOrCreate(
            ['email' => 'admin@lobsense.com'],
            [
                'name'     => 'Admin Lobsense',
                'password' => Hash::make('Admin2026Lob'),
                'role'     => 'admin',
            ]
        );

        // ── 2. Management — read-only dashboard & reports ──
        User::updateOrCreate(
            ['email' => 'management@lobsense.com'],
            [
                'name'     => 'Management Lobsense',
                'password' => Hash::make('Manage2026Lob'),
                'role'     => 'management',
            ]
        );

        // ── 3. Operator — field-level cage operations ──
        User::updateOrCreate(
            ['email' => 'operator@lobsense.com'],
            [
                'name'     => 'Operator Lobsense',
                'password' => Hash::make('Operator2026Lob'),
                'role'     => 'operator',
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
