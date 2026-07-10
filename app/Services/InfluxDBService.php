<?php

namespace App\Services;

use InfluxDB2\Client;
use InfluxDB2\Point;
use InfluxDB2\Model\WritePrecision;

class InfluxDBService
{
    protected Client $client;
    protected string $org;
    protected string $bucket;

    public function __construct()
    {
        $this->org = config('influxdb.org', 'lobsense');
        $this->bucket = config('influxdb.bucket', 'lobsense_telemetry');

        $this->client = new Client([
            'url' => config('influxdb.url', 'http://localhost:8086'),
            'token' => config('influxdb.token'),
            'org' => $this->org,
            'bucket' => $this->bucket,
            'precision' => WritePrecision::S,
        ]);
    }

    /**
     * Write a telemetry point to InfluxDB.
     */
    public function writePoint(string $measurement, array $tags, array $fields, ?int $timestamp = null): void
    {
        $writeApi = $this->client->createWriteApi();

        $point = Point::measurement($measurement);

        foreach ($tags as $key => $value) {
            if ($value !== null && $value !== '') {
                $point->addTag((string) $key, (string) $value);
            }
        }

        foreach ($fields as $key => $value) {
            if ($value !== null) {
                if (is_numeric($value)) {
                    $point->addField((string) $key, (float) $value);
                } else {
                    $point->addField((string) $key, $value);
                }
            }
        }

        if ($timestamp !== null) {
            $point->time($timestamp, WritePrecision::S);
        }

        $writeApi->write($point, WritePrecision::S, $this->bucket, $this->org);
        $writeApi->close();
    }

    /**
     * Query data from InfluxDB using Flux query language.
     */
    public function query(string $fluxQuery): array
    {
        $queryApi = $this->client->createQueryApi();
        return $queryApi->query($fluxQuery, $this->org);
    }

    /**
     * Query and return pivoted results as a clean associative array.
     */
    public function queryParsed(string $fluxQuery): array
    {
        $tables = $this->query($fluxQuery);
        $results = [];

        foreach ($tables as $table) {
            foreach ($table->records as $record) {
                $row = $record->values;
                $cleanRow = [
                    'time' => $record->getTime(),
                    '_time' => $record->getTime()
                ];

                foreach ($row as $key => $val) {
                    if (!in_array($key, ['result', 'table', '_start', '_stop', '_time', '_measurement', '_field', '_value'])) {
                        $cleanRow[$key] = is_numeric($val) ? (float) $val : $val;
                    }
                }

                $results[] = $cleanRow;
            }
        }

        return $results;
    }

    /**
     * Get raw client instance for advanced operations.
     */
    public function getClient(): Client
    {
        return $this->client;
    }
}
