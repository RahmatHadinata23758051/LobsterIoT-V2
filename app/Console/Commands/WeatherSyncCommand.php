<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WeatherService;

class WeatherSyncCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'weather:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize weather conditions for all cities from OpenWeather API';

    /**
     * Execute the console command.
     */
    public function handle(WeatherService $weatherService)
    {
        $this->info('Starting OpenWeather synchronization...');
        
        $syncedCount = $weatherService->syncAllCities();
        
        $this->info("Successfully synchronized weather reports for {$syncedCount} cities.");
        
        return 0;
    }
}
