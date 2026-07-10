<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use App\Models\IotNode;
use App\Models\Maintenance;
use App\Models\FeedingLog;
use App\Services\InfluxDBService;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Facades\Response;

class ReportController extends Controller
{
    protected InfluxDBService $influxDB;
    protected string $bucket;

    public function __construct(InfluxDBService $influxDB)
    {
        $this->influxDB = $influxDB;
        $this->bucket = config('influxdb.bucket', 'lobsense_telemetry');
    }

    /**
     * Helper to wrap HTML content with standard elegant styling for DomPDF.
     */
    protected function generatePdfResponse(string $title, string $htmlContent)
    {
        $styledHtml = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>' . htmlspecialchars($title) . '</title>
            <style>
                body {
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                    color: #333333;
                    font-size: 11px;
                    line-height: 1.4;
                    margin: 0;
                    padding: 0;
                }
                .header {
                    margin-bottom: 20px;
                    border-bottom: 2px solid #065f46;
                    padding-bottom: 10px;
                }
                .logo-section {
                    float: left;
                    font-size: 20px;
                    font-weight: bold;
                    color: #065f46;
                }
                .meta-section {
                    float: right;
                    text-align: right;
                    color: #666666;
                }
                .clear {
                    clear: both;
                }
                h1 {
                    font-size: 16px;
                    margin: 15px 0 5px 0;
                    color: #111827;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }
                th {
                    background-color: #065f46;
                    color: #ffffff;
                    text-align: left;
                    padding: 8px 10px;
                    font-weight: bold;
                    border: 1px solid #047857;
                }
                td {
                    padding: 6px 10px;
                    border: 1px solid #e5e7eb;
                }
                tr:nth-child(even) {
                    background-color: #f9fafb;
                }
                .text-center {
                    text-align: center;
                }
                .text-right {
                    text-align: right;
                }
                .footer {
                    position: fixed;
                    bottom: -10px;
                    left: 0;
                    right: 0;
                    text-align: center;
                    color: #9ca3af;
                    font-size: 9px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo-section">LOBSENSE V2</div>
                <div class="meta-section">
                    Tanggal Cetak: ' . Carbon::now()->isoFormat('D MMMM YHH:mm') . ' WIB
                </div>
                <div class="clear"></div>
            </div>
            <h1>' . htmlspecialchars($title) . '</h1>
            ' . $htmlContent . '
            <div class="footer">
                Laporan otomatis Lobsense V2 - Halaman 1
            </div>
        </body>
        </html>
        ';

        $pdf = Pdf::loadHTML($styledHtml)->setPaper('a4', 'landscape');
        return $pdf->download(str_replace(' ', '-', strtolower($title)) . '.pdf');
    }

    /**
     * Helper to return dynamic CSV stream responses.
     */
    protected function generateCsvResponse(string $filename, array $headers, array $rows)
    {
        $callback = function () use ($headers, $rows) {
            $file = fopen('php://output', 'w');
            
            // Add UTF-8 BOM for proper Excel rendering
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            fputcsv($file, $headers);
            foreach ($rows as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return Response::stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * 1. Node Registration Report (PDF)
     */
    public function nodeRegistrationPDF()
    {
        $nodes = IotNode::with(['owner', 'edgeGateway', 'city'])->whereNotNull('activated_at')->get();

        $rows = '';
        foreach ($nodes as $index => $node) {
            $rows .= '
            <tr>
                <td class="text-center">' . ($index + 1) . '</td>
                <td>' . htmlspecialchars($node->serial_number) . '</td>
                <td>' . htmlspecialchars($node->owner->name ?? '-') . '</td>
                <td>' . htmlspecialchars($node->edgeGateway->serial_number ?? '-') . '</td>
                <td>' . htmlspecialchars($node->ip_address ?? '-') . '</td>
                <td class="text-center">' . htmlspecialchars($node->latitude ?? '-') . '</td>
                <td class="text-center">' . htmlspecialchars($node->longitude ?? '-') . '</td>
                <td class="text-center">' . htmlspecialchars($node->city->name ?? '-') . '</td>
                <td class="text-center">' . ($node->activated_at ? Carbon::parse($node->activated_at)->format('d-m-Y H:i') : '-') . '</td>
            </tr>';
        }

        $html = '
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;" class="text-center">No</th>
                    <th>Serial Number</th>
                    <th>Pemilik (Owner)</th>
                    <th>Edge Gateway</th>
                    <th>IP Address</th>
                    <th class="text-center">Latitude</th>
                    <th class="text-center">Longitude</th>
                    <th class="text-center">Kota / Wilayah</th>
                    <th class="text-center">Tanggal Aktivasi</th>
                </tr>
            </thead>
            <tbody>
                ' . (empty($rows) ? '<tr><td colspan="9" class="text-center">Tidak ada data node aktif.</td></tr>' : $rows) . '
            </tbody>
        </table>';

        return $this->generatePdfResponse('Laporan Registrasi Node IoT', $html);
    }

    /**
     * 2. Node Registration Report (CSV)
     */
    public function nodeRegistrationCSV()
    {
        $nodes = IotNode::with(['owner', 'edgeGateway', 'city'])->whereNotNull('activated_at')->get();

        $headers = ['No', 'Serial Number', 'Owner', 'Edge Gateway', 'IP Address', 'Latitude', 'Longitude', 'City', 'Activated At'];
        $rows = [];

        foreach ($nodes as $index => $node) {
            $rows[] = [
                $index + 1,
                $node->serial_number,
                $node->owner->name ?? '-',
                $node->edgeGateway->serial_number ?? '-',
                $node->ip_address ?? '-',
                $node->latitude ?? '-',
                $node->longitude ?? '-',
                $node->city->name ?? '-',
                $node->activated_at ? Carbon::parse($node->activated_at)->format('Y-m-d H:i:s') : '-'
            ];
        }

        return $this->generateCsvResponse('Laporan_Registrasi_Node.csv', $headers, $rows);
    }

    /**
     * 3. Telemetry / Raw Monitoring Report (PDF)
     */
    public function telemetryPDF(Request $request)
    {
        $serialNumber = $request->query('serial_number');

        if ($serialNumber) {
            $query = 'from(bucket: "' . $this->bucket . '")
                |> range(start: -7d)
                |> filter(fn: (r) => r["_measurement"] == "telemetries")
                |> filter(fn: (r) => r["iot_node_serial_number"] == "' . $serialNumber . '")
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
                |> limit(n: 100)';
            $title = 'Laporan Telemetri Node ' . $serialNumber;
        } else {
            $query = 'from(bucket: "' . $this->bucket . '")
                |> range(start: -30d)
                |> filter(fn: (r) => r["_measurement"] == "telemetries")
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
                |> limit(n: 100)';
            $title = 'Laporan Telemetri Raw Monitoring';
        }

        $telemetries = $this->influxDB->queryParsed($query);

        $rows = '';
        foreach ($telemetries as $index => $t) {
            $time = isset($t['_time']) ? Carbon::parse($t['_time'])->timezone('Asia/Jakarta')->format('d-m-Y H:i:s') : '-';
            $rows .= '
            <tr>
                <td class="text-center">' . ($index + 1) . '</td>
                <td>' . htmlspecialchars($t['iot_node_serial_number'] ?? '-') . '</td>
                <td class="text-center">' . $time . '</td>
                <td class="text-right">' . htmlspecialchars(isset($t['temperature']) ? round($t['temperature'], 2) . ' °C' : '-') . '</td>
                <td class="text-right">' . htmlspecialchars(isset($t['humidity']) ? round($t['humidity'], 2) . ' %' : '-') . '</td>
                <td class="text-right">' . htmlspecialchars(isset($t['ph']) ? round($t['ph'], 2) : '-') . '</td>
                <td class="text-right">' . htmlspecialchars(isset($t['dissolved_oxygen']) ? round($t['dissolved_oxygen'], 2) . ' mg/L' : '-') . '</td>
                <td class="text-right">' . htmlspecialchars(isset($t['salinity']) ? round($t['salinity'], 2) . ' ppt' : '-') . '</td>
                <td class="text-right">' . htmlspecialchars(isset($t['turbidity']) ? round($t['turbidity'], 2) . ' NTU' : '-') . '</td>
            </tr>';
        }

        $html = '
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;" class="text-center">No</th>
                    <th>Serial Number</th>
                    <th class="text-center">Waktu (WIB)</th>
                    <th class="text-right">Suhu</th>
                    <th class="text-right">Kelembaban</th>
                    <th class="text-right">pH Air</th>
                    <th class="text-right">DO (Oxygen)</th>
                    <th class="text-right">Salinitas</th>
                    <th class="text-right">Turbiditas</th>
                </tr>
            </thead>
            <tbody>
                ' . (empty($rows) ? '<tr><td colspan="9" class="text-center">Tidak ada data telemetri.</td></tr>' : $rows) . '
            </tbody>
        </table>';

        return $this->generatePdfResponse($title, $html);
    }

    /**
     * 4. Telemetry / Raw Monitoring Report (CSV)
     */
    public function telemetryCSV(Request $request)
    {
        $serialNumber = $request->query('serial_number');

        if ($serialNumber) {
            $query = 'from(bucket: "' . $this->bucket . '")
                |> range(start: -7d)
                |> filter(fn: (r) => r["_measurement"] == "telemetries")
                |> filter(fn: (r) => r["iot_node_serial_number"] == "' . $serialNumber . '")
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
                |> limit(n: 1000)';
            $filename = 'Laporan_Telemetri_' . $serialNumber . '.csv';
        } else {
            $query = 'from(bucket: "' . $this->bucket . '")
                |> range(start: -30d)
                |> filter(fn: (r) => r["_measurement"] == "telemetries")
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
                |> limit(n: 1000)';
            $filename = 'Laporan_Telemetri_Semua.csv';
        }

        $telemetries = $this->influxDB->queryParsed($query);

        $headers = ['No', 'Serial Number', 'Timestamp (WIB)', 'Temperature (C)', 'Humidity (%)', 'pH', 'DO (mg/L)', 'Salinity (ppt)', 'Turbidity (NTU)'];
        $rows = [];

        foreach ($telemetries as $index => $t) {
            $time = isset($t['_time']) ? Carbon::parse($t['_time'])->timezone('Asia/Jakarta')->format('Y-m-d H:i:s') : '-';
            $rows[] = [
                $index + 1,
                $t['iot_node_serial_number'] ?? '-',
                $time,
                $t['temperature'] ?? '-',
                $t['humidity'] ?? '-',
                $t['ph'] ?? '-',
                $t['dissolved_oxygen'] ?? '-',
                $t['salinity'] ?? '-',
                $t['turbidity'] ?? '-'
            ];
        }

        return $this->generateCsvResponse($filename, $headers, $rows);
    }

    /**
     * 5. Maintenance Report (PDF)
     */
    public function maintenancePDF()
    {
        $maintenances = Maintenance::with(['iotNode', 'operator'])->latest()->get();

        $rows = '';
        foreach ($maintenances as $index => $m) {
            $rows .= '
            <tr>
                <td class="text-center">' . ($index + 1) . '</td>
                <td>' . htmlspecialchars($m->iotNode->serial_number ?? '-') . '</td>
                <td>' . htmlspecialchars($m->operator->name ?? '-') . '</td>
                <td>' . htmlspecialchars($m->description ?? '-') . '</td>
                <td class="text-center">' . htmlspecialchars($m->latitude ?? '-') . '</td>
                <td class="text-center">' . htmlspecialchars($m->longitude ?? '-') . '</td>
                <td class="text-center">' . $m->created_at->format('d-m-Y H:i') . '</td>
            </tr>';
        }

        $html = '
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;" class="text-center">No</th>
                    <th>Node Serial Number</th>
                    <th>Operator</th>
                    <th>Deskripsi Aktivitas</th>
                    <th class="text-center">Latitude</th>
                    <th class="text-center">Longitude</th>
                    <th class="text-center">Waktu Pemeliharaan</th>
                </tr>
            </thead>
            <tbody>
                ' . (empty($rows) ? '<tr><td colspan="7" class="text-center">Tidak ada log pemeliharaan.</td></tr>' : $rows) . '
            </tbody>
        </table>';

        return $this->generatePdfResponse('Laporan Log Pemeliharaan Node', $html);
    }

    /**
     * 6. Maintenance Report (CSV)
     */
    public function maintenanceCSV()
    {
        $maintenances = Maintenance::with(['iotNode', 'operator'])->latest()->get();

        $headers = ['No', 'Node Serial Number', 'Operator Name', 'Description', 'Latitude', 'Longitude', 'Maintenance Date'];
        $rows = [];

        foreach ($maintenances as $index => $m) {
            $rows[] = [
                $index + 1,
                $m->iotNode->serial_number ?? '-',
                $m->operator->name ?? '-',
                $m->description ?? '-',
                $m->latitude ?? '-',
                $m->longitude ?? '-',
                $m->created_at->format('Y-m-d H:i:s')
            ];
        }

        return $this->generateCsvResponse('Laporan_Log_Pemeliharaan.csv', $headers, $rows);
    }

    /**
     * 7. Feeding Log Report (PDF)
     */
    public function feedingPDF()
    {
        $logs = FeedingLog::with(['cage', 'operator'])->latest()->get();

        $rows = '';
        foreach ($logs as $index => $log) {
            $rows .= '
            <tr>
                <td class="text-center">' . ($index + 1) . '</td>
                <td>' . htmlspecialchars($log->cage->cage_code ?? '-') . '</td>
                <td>' . htmlspecialchars($log->operator->full_name ?? '-') . '</td>
                <td class="text-center">' . htmlspecialchars(ucfirst($log->feed_session)) . '</td>
                <td>' . htmlspecialchars($log->feed_type) . '</td>
                <td class="text-right">' . number_format($log->weight_kg, 2) . ' kg</td>
                <td class="text-center">' . $log->created_at->format('d-m-Y H:i') . '</td>
            </tr>';
        }

        $html = '
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;" class="text-center">No</th>
                    <th>Kode Keramba</th>
                    <th>Nama Petugas/Operator</th>
                    <th class="text-center">Sesi Pakan</th>
                    <th>Tipe Pakan</th>
                    <th class="text-right">Berat Pakan (kg)</th>
                    <th class="text-center">Waktu Pemberian</th>
                </tr>
            </thead>
            <tbody>
                ' . (empty($rows) ? '<tr><td colspan="7" class="text-center">Tidak ada log pemberian pakan.</td></tr>' : $rows) . '
            </tbody>
        </table>';

        return $this->generatePdfResponse('Laporan Log Pemberian Pakan', $html);
    }

    /**
     * 8. Feeding Log Report (CSV)
     */
    public function feedingCSV()
    {
        $logs = FeedingLog::with(['cage', 'operator'])->latest()->get();

        $headers = ['No', 'Cage Code', 'Operator Name', 'Feed Session', 'Feed Type', 'Weight (kg)', 'Feeding DateTime'];
        $rows = [];

        foreach ($logs as $index => $log) {
            $rows[] = [
                $index + 1,
                $log->cage->cage_code ?? '-',
                $log->operator->full_name ?? '-',
                ucfirst($log->feed_session),
                $log->feed_type,
                $log->weight_kg,
                $log->created_at->format('Y-m-d H:i:s')
            ];
        }

        return $this->generateCsvResponse('Laporan_Log_Pemberian_Pakan.csv', $headers, $rows);
    }
}
