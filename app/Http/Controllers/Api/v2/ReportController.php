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
     * Retrieve report raw data for interactive table preview.
     */
    public function index(Request $request)
    {
        $type = $request->query('type', 'telemetry');

        switch ($type) {
            case 'node-registration':
                $data = $this->getNodeRegistrationData($request);
                break;
            case 'telemetry':
                $data = $this->getTelemetryData($request);
                break;
            case 'maintenance':
                $data = $this->getMaintenanceData($request);
                break;
            case 'feeding':
                $data = $this->getFeedingData($request);
                break;
            default:
                return response()->json(['status' => 'error', 'message' => 'Tipe laporan tidak valid.'], 400);
        }

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }

    /**
     * 1. Node Registration Data Query
     */
    protected function getNodeRegistrationData(Request $request)
    {
        $query = IotNode::with(['owner', 'cage.edgeGateway', 'city'])->whereNotNull('activated_at');
        
        if ($request->filled('startDate')) {
            $query->whereDate('activated_at', '>=', $request->startDate);
        }
        if ($request->filled('endDate')) {
            $query->whereDate('activated_at', '<=', $request->endDate);
        }
        
        return $query->latest()->get();
    }

    /**
     * 2. Telemetry InfluxDB Data Query
     */
    protected function getTelemetryData(Request $request)
    {
        $serialNumber = $request->query('serial_number');
        $startDate = $request->query('startDate', Carbon::now()->subDays(7)->toDateString());
        $endDate = $request->query('endDate', Carbon::now()->toDateString());
        
        // Use clean time formats with fallback
        $startTime = $request->query('startTime', '00:00:00');
        $endTime = $request->query('endTime', '23:59:59');

        if (strlen($startTime) === 5) {
            $startTime .= ':00';
        }
        if (strlen($endTime) === 5) {
            $endTime .= ':59';
        }

        $startIso = $startDate . 'T' . $startTime . 'Z';
        $stopIso = $endDate . 'T' . $endTime . 'Z';

        $flux = 'from(bucket: "' . $this->bucket . '")
            |> range(start: ' . $startIso . ', stop: ' . $stopIso . ')
            |> filter(fn: (r) => r["_measurement"] == "telemetries")';

        if (!empty($serialNumber)) {
            $flux .= ' |> filter(fn: (r) => r["iot_node_serial_number"] == "' . $serialNumber . '")';
        }

        $flux .= ' |> drop(columns: ["cage_code"])
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
            |> limit(n: 5000)';

        $telemetries = $this->influxDB->queryParsed($flux);

        // Normalize database field keys to match report and export format requirements
        foreach ($telemetries as &$t) {
            if (isset($t['water_temperature'])) {
                $t['temperature'] = $t['water_temperature'];
            }
            if (isset($t['ambient_temperature'])) {
                $t['humidity'] = $t['ambient_temperature'];
            }
        }

        return $telemetries;
    }

    /**
     * 3. Maintenance Data Query
     */
    protected function getMaintenanceData(Request $request)
    {
        $query = Maintenance::with(['iotNode', 'operator']);
        
        if ($request->filled('startDate')) {
            $query->whereDate('created_at', '>=', $request->startDate);
        }
        if ($request->filled('endDate')) {
            $query->whereDate('created_at', '<=', $request->endDate);
        }
        
        return $query->latest()->get();
    }

    /**
     * 4. Feeding Logs Data Query
     */
    protected function getFeedingData(Request $request)
    {
        $query = FeedingLog::with(['iotNode.cage', 'operator']);
        
        if ($request->filled('startDate')) {
            $query->whereDate('created_at', '>=', $request->startDate);
        }
        if ($request->filled('endDate')) {
            $query->whereDate('created_at', '<=', $request->endDate);
        }
        if ($request->filled('cage_id')) {
            $query->whereHas('iotNode', function ($q) use ($request) {
                $q->where('cage_id', $request->cage_id);
            });
        }
        
        return $query->latest()->get();
    }

    /**
     * PDF Document Generator Wrapper (landscape A4, break-word protection)
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
                    font-size: 10px;
                    line-height: 1.3;
                    margin: 0;
                    padding: 0;
                }
                .header {
                    margin-bottom: 15px;
                    border-bottom: 2px solid #065f46;
                    padding-bottom: 8px;
                }
                .logo-section {
                    float: left;
                    font-size: 18px;
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
                    font-size: 14px;
                    margin: 10px 0 5px 0;
                    color: #111827;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                    margin-top: 10px;
                }
                th {
                    background-color: #065f46;
                    color: #ffffff;
                    text-align: left;
                    padding: 6px 8px;
                    font-weight: bold;
                    font-size: 9px;
                    border: 1px solid #047857;
                }
                td {
                    padding: 5px 8px;
                    border: 1px solid #e5e7eb;
                    word-wrap: break-word;
                    overflow: hidden;
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
                    bottom: -20px;
                    left: 0;
                    right: 0;
                    text-align: center;
                    color: #9ca3af;
                    font-size: 8px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo-section">LOBSENSE V2</div>
                <div class="meta-section">
                    Tanggal Cetak: ' . Carbon::now()->isoFormat('D MMMM Y HH:mm') . ' WIB
                </div>
                <div class="clear"></div>
            </div>
            <h1>' . htmlspecialchars($title) . '</h1>
            ' . $htmlContent . '
            <div class="footer">
                Laporan otomatis Lobsense V2
            </div>
        </body>
        </html>
        ';

        $pdf = Pdf::loadHTML($styledHtml)->setPaper('a4', 'landscape');
        return $pdf->download(str_replace(' ', '-', strtolower($title)) . '.pdf');
    }

    /**
     * CSV Exporter Wrapper
     */
    protected function generateCsvResponse(string $filename, array $headers, array $rows)
    {
        $callback = function () use ($headers, $rows) {
            $file = fopen('php://output', 'w');
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
     * Excel (HTML spreadsheet format) Generator Wrapper
     */
    protected function generateExcelResponse(string $title, string $htmlContent)
    {
        $styledHtml = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                table {
                    border-collapse: collapse;
                    font-family: sans-serif;
                }
                th {
                    background-color: #065f46;
                    color: #ffffff;
                    font-weight: bold;
                    border: 1px solid #cccccc;
                    padding: 8px;
                }
                td {
                    border: 1px solid #cccccc;
                    padding: 6px;
                }
            </style>
        </head>
        <body>
            <h2>' . htmlspecialchars($title) . '</h2>
            <p>Tanggal Cetak: ' . Carbon::now()->isoFormat('D MMMM Y HH:mm') . ' WIB</p>
            ' . $htmlContent . '
        </body>
        </html>
        ';

        return response($styledHtml)
            ->header('Content-Type', 'application/vnd.ms-excel; charset=utf-8')
            ->header('Content-Disposition', 'attachment; filename="' . str_replace(' ', '_', strtolower($title)) . '.xls"')
            ->header('Cache-Control', 'max-age=0');
    }

    /**
     * 5. Exports: Node Registration
     */
    public function nodeRegistrationPDF(Request $request)
    {
        $nodes = $this->getNodeRegistrationData($request);
        $html = $this->buildNodeHtmlTable($nodes);
        return $this->generatePdfResponse('Laporan Registrasi Node IoT', $html);
    }

    public function nodeRegistrationCSV(Request $request)
    {
        $nodes = $this->getNodeRegistrationData($request);
        $headers = ['No', 'Serial Number', 'Owner', 'Edge Gateway', 'IP Address', 'Latitude', 'Longitude', 'City', 'Activated At'];
        $rows = [];
        foreach ($nodes as $index => $node) {
            $rows[] = [
                $index + 1,
                $node->serial_number,
                $node->owner->name ?? '-',
                $node->cage->edgeGateway->serial_number ?? '-',
                $node->ip_address ?? '-',
                $node->latitude ?? '-',
                $node->longitude ?? '-',
                $node->city->name ?? '-',
                $node->activated_at ? Carbon::parse($node->activated_at)->format('Y-m-d H:i:s') : '-'
            ];
        }
        return $this->generateCsvResponse('Laporan_Registrasi_Node.csv', $headers, $rows);
    }

    public function nodeRegistrationExcel(Request $request)
    {
        $nodes = $this->getNodeRegistrationData($request);
        $html = $this->buildNodeHtmlTable($nodes);
        return $this->generateExcelResponse('Laporan Registrasi Node IoT', $html);
    }

    protected function buildNodeHtmlTable($nodes)
    {
        $rows = '';
        foreach ($nodes as $index => $node) {
            $rows .= '
            <tr>
                <td style="width:5%;" class="text-center">' . ($index + 1) . '</td>
                <td style="width:15%;">' . htmlspecialchars($node->serial_number) . '</td>
                <td style="width:15%;">' . htmlspecialchars($node->owner->name ?? '-') . '</td>
                <td style="width:15%;">' . htmlspecialchars($node->cage->edgeGateway->serial_number ?? '-') . '</td>
                <td style="width:12%;">' . htmlspecialchars($node->ip_address ?? '-') . '</td>
                <td style="width:10%;" class="text-center">' . htmlspecialchars($node->latitude ?? '-') . '</td>
                <td style="width:10%;" class="text-center">' . htmlspecialchars($node->longitude ?? '-') . '</td>
                <td style="width:10%;" class="text-center">' . htmlspecialchars($node->city->name ?? '-') . '</td>
                <td style="width:18%;" class="text-center">' . ($node->activated_at ? Carbon::parse($node->activated_at)->format('d-m-Y H:i') : '-') . '</td>
            </tr>';
        }

        return '
        <table>
            <thead>
                <tr>
                    <th style="width:5%;" class="text-center">No</th>
                    <th style="width:15%;">Serial Number</th>
                    <th style="width:15%;">Owner</th>
                    <th style="width:15%;">Edge Gateway</th>
                    <th style="width:12%;">IP Address</th>
                    <th style="width:10%;" class="text-center">Lat</th>
                    <th style="width:10%;" class="text-center">Lng</th>
                    <th style="width:10%;" class="text-center">Kota</th>
                    <th style="width:18%;" class="text-center">Aktivasi</th>
                </tr>
            </thead>
            <tbody>
                ' . (empty($rows) ? '<tr><td colspan="9" class="text-center">Tidak ada data.</td></tr>' : $rows) . '
            </tbody>
        </table>';
    }

    /**
     * 6. Exports: Telemetry
     */
    public function telemetryPDF(Request $request)
    {
        $telemetries = $this->getTelemetryData($request);
        $html = $this->buildTelemetryHtmlTable($telemetries);
        return $this->generatePdfResponse('Laporan Telemetri Sensor', $html);
    }

    public function telemetryCSV(Request $request)
    {
        $telemetries = $this->getTelemetryData($request);
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
        return $this->generateCsvResponse('Laporan_Telemetri.csv', $headers, $rows);
    }

    public function telemetryExcel(Request $request)
    {
        $telemetries = $this->getTelemetryData($request);
        $html = $this->buildTelemetryHtmlTable($telemetries);
        return $this->generateExcelResponse('Laporan Telemetri Sensor', $html);
    }

    protected function buildTelemetryHtmlTable($telemetries)
    {
        $rows = '';
        foreach ($telemetries as $index => $t) {
            $time = isset($t['_time']) ? Carbon::parse($t['_time'])->timezone('Asia/Jakarta')->format('d-m-Y H:i:s') : '-';
            $rows .= '
            <tr>
                <td style="width:5%;" class="text-center">' . ($index + 1) . '</td>
                <td style="width:15%;">' . htmlspecialchars($t['iot_node_serial_number'] ?? '-') . '</td>
                <td style="width:20%;" class="text-center">' . $time . '</td>
                <td style="width:10%;" class="text-right">' . htmlspecialchars(isset($t['temperature']) ? round($t['temperature'], 2) . ' °C' : '-') . '</td>
                <td style="width:10%;" class="text-right">' . htmlspecialchars(isset($t['humidity']) ? round($t['humidity'], 2) . ' %' : '-') . '</td>
                <td style="width:10%;" class="text-right">' . htmlspecialchars(isset($t['ph']) ? round($t['ph'], 2) : '-') . '</td>
                <td style="width:10%;" class="text-right">' . htmlspecialchars(isset($t['dissolved_oxygen']) ? round($t['dissolved_oxygen'], 2) . ' mg/L' : '-') . '</td>
                <td style="width:10%;" class="text-right">' . htmlspecialchars(isset($t['salinity']) ? round($t['salinity'], 2) . ' ppt' : '-') . '</td>
                <td style="width:10%;" class="text-right">' . htmlspecialchars(isset($t['turbidity']) ? round($t['turbidity'], 2) . ' NTU' : '-') . '</td>
            </tr>';
        }

        return '
        <table>
            <thead>
                <tr>
                    <th style="width:5%;" class="text-center">No</th>
                    <th style="width:15%;">Serial Number</th>
                    <th style="width:20%;" class="text-center">Waktu</th>
                    <th style="width:10%;" class="text-right">Suhu</th>
                    <th style="width:10%;" class="text-right">Lembab</th>
                    <th style="width:10%;" class="text-right">pH</th>
                    <th style="width:10%;" class="text-right">DO</th>
                    <th style="width:10%;" class="text-right">Salinitas</th>
                    <th style="width:10%;" class="text-right">Turbiditas</th>
                </tr>
            </thead>
            <tbody>
                ' . (empty($rows) ? '<tr><td colspan="9" class="text-center">Tidak ada data.</td></tr>' : $rows) . '
            </tbody>
        </table>';
    }

    /**
     * 7. Exports: Maintenance
     */
    public function maintenancePDF(Request $request)
    {
        $maintenances = $this->getMaintenanceData($request);
        $html = $this->buildMaintenanceHtmlTable($maintenances);
        return $this->generatePdfResponse('Laporan Log Pemeliharaan Perangkat', $html);
    }

    public function maintenanceCSV(Request $request)
    {
        $maintenances = $this->getMaintenanceData($request);
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

    public function maintenanceExcel(Request $request)
    {
        $maintenances = $this->getMaintenanceData($request);
        $html = $this->buildMaintenanceHtmlTable($maintenances);
        return $this->generateExcelResponse('Laporan Log Pemeliharaan Perangkat', $html);
    }

    protected function buildMaintenanceHtmlTable($maintenances)
    {
        $rows = '';
        foreach ($maintenances as $index => $m) {
            $rows .= '
            <tr>
                <td style="width:5%;" class="text-center">' . ($index + 1) . '</td>
                <td style="width:20%;">' . htmlspecialchars($m->iotNode->serial_number ?? '-') . '</td>
                <td style="width:15%;">' . htmlspecialchars($m->operator->name ?? '-') . '</td>
                <td style="width:30%;">' . htmlspecialchars($m->description ?? '-') . '</td>
                <td style="width:10%;" class="text-center">' . htmlspecialchars($m->latitude ?? '-') . '</td>
                <td style="width:10%;" class="text-center">' . htmlspecialchars($m->longitude ?? '-') . '</td>
                <td style="width:10%;" class="text-center">' . $m->created_at->format('d-m-Y H:i') . '</td>
            </tr>';
        }

        return '
        <table>
            <thead>
                <tr>
                    <th style="width:5%;" class="text-center">No</th>
                    <th style="width:20%;">Node Serial Number</th>
                    <th style="width:15%;">Operator</th>
                    <th style="width:30%;">Deskripsi Aktivitas</th>
                    <th style="width:10%;" class="text-center">Lat</th>
                    <th style="width:10%;" class="text-center">Lng</th>
                    <th style="width:10%;" class="text-center">Waktu</th>
                </tr>
            </thead>
            <tbody>
                ' . (empty($rows) ? '<tr><td colspan="7" class="text-center">Tidak ada data.</td></tr>' : $rows) . '
            </tbody>
        </table>';
    }

    /**
     * 8. Exports: Feeding
     */
    public function feedingPDF(Request $request)
    {
        $logs = $this->getFeedingData($request);
        $html = $this->buildFeedingHtmlTable($logs);
        return $this->generatePdfResponse('Laporan Log Pemberian Pakan', $html);
    }

    public function feedingCSV(Request $request)
    {
        $logs = $this->getFeedingData($request);
        $headers = ['No', 'Cage Code', 'Operator Name', 'Feed Session', 'Feed Type', 'Weight (kg)', 'Feeding DateTime'];
        $rows = [];
        foreach ($logs as $index => $log) {
            $rows[] = [
                $index + 1,
                $log->iotNode->cage->cage_code ?? '-',
                $log->operator->full_name ?? '-',
                ucfirst($log->feed_session),
                $log->feed_type,
                $log->weight_kg,
                $log->created_at->format('Y-m-d H:i:s')
            ];
        }
        return $this->generateCsvResponse('Laporan_Log_Pemberian_Pakan.csv', $headers, $rows);
    }

    public function feedingExcel(Request $request)
    {
        $logs = $this->getFeedingData($request);
        $html = $this->buildFeedingHtmlTable($logs);
        return $this->generateExcelResponse('Laporan Log Pemberian Pakan', $html);
    }

    protected function buildFeedingHtmlTable($logs)
    {
        $rows = '';
        foreach ($logs as $index => $log) {
            $rows .= '
            <tr>
                <td style="width:5%;" class="text-center">' . ($index + 1) . '</td>
                <td style="width:15%;">' . htmlspecialchars($log->iotNode->cage->cage_code ?? '-') . '</td>
                <td style="width:20%;">' . htmlspecialchars($log->operator->full_name ?? '-') . '</td>
                <td style="width:15%;" class="text-center">' . htmlspecialchars(ucfirst($log->feed_session)) . '</td>
                <td style="width:20%;">' . htmlspecialchars($log->feed_type) . '</td>
                <td style="width:10%;" class="text-right">' . number_format($log->weight_kg, 2) . ' kg</td>
                <td style="width:15%;" class="text-center">' . $log->created_at->format('d-m-Y H:i') . '</td>
            </tr>';
        }

        return '
        <table>
            <thead>
                <tr>
                    <th style="width:5%;" class="text-center">No</th>
                    <th style="width:15%;">Kode Keramba</th>
                    <th style="width:20%;">Operator</th>
                    <th style="width:15%;" class="text-center">Sesi</th>
                    <th style="width:20%;">Tipe Pakan</th>
                    <th style="width:10%;" class="text-right">Berat (kg)</th>
                    <th style="width:15%;" class="text-center">Waktu</th>
                </tr>
            </thead>
            <tbody>
                ' . (empty($rows) ? '<tr><td colspan="7" class="text-center">Tidak ada data.</td></tr>' : $rows) . '
            </tbody>
        </table>';
    }
}
