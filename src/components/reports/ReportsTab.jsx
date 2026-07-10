import React, { useState, useEffect } from 'react';
import { FileText, Download, FileDown, Search, Filter, Cpu, Wrench, Calendar, Database, AlertCircle } from 'lucide-react';
import { api } from '../../api/api';

export const ReportsTab = ({ token, nodes = [], cagesList = [] }) => {
  const [reportType, setReportType] = useState('telemetry');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    serial_number: '',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '00:00',
    endTime: '23:59',
    cage_id: '',
  });

  const [downloading, setDownloading] = useState({
    pdf: false,
    csv: false,
    excel: false,
  });

  // Fetch data with AbortController for race-safe updates
  const fetchReportData = async (currentType = reportType, currentFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReportData(token, currentType, currentFilters);
      setReportData(data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data laporan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch telemetry initially and when reportType changes
  useEffect(() => {
    fetchReportData(reportType, filters);
  }, [reportType]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReportData(reportType, filters);
  };

  const handleDownload = async (format) => {
    setDownloading(prev => ({ ...prev, [format]: true }));
    try {
      const blob = await api.downloadReport(token, reportType, format, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const fileExt = format === 'excel' ? 'xls' : format;
      const formattedDate = new Date().toISOString().slice(0, 10);
      a.download = `Laporan_${reportType}_${filters.serial_number ? filters.serial_number + '_' : ''}${formattedDate}.${fileExt}`;
      
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh berkas laporan. Silakan coba lagi.');
    } finally {
      setDownloading(prev => ({ ...prev, [format]: false }));
    }
  };

  // Formatter helper for timezone display
  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    try {
      const d = new Date(timeStr);
      // Format as DD-MM-YYYY HH:mm:ss in local timezone
      const pad = (num) => String(num).padStart(2, '0');
      return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch (_) {
      return timeStr;
    }
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'node-registration': return 'Registrasi Node IoT Aktif';
      case 'telemetry': return 'Data Mentah Telemetri Sensor';
      case 'maintenance': return 'Log Pemeliharaan Perangkat';
      case 'feeding': return 'Log Pemberian Pakan Harian';
      default: return 'Laporan Data';
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out] font-sans">
      
      {/* Header Section */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Pusat Laporan & Ekspor Data</h1>
          <p className="text-xs text-slate-500 mt-1">
            Lihat data operasional mentah (raw data) secara interaktif dan ekspor ke dokumen resmi PDF, Excel, atau CSV.
          </p>
        </div>

        {/* Report Type Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tipe Laporan:</span>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value);
              setReportData([]);
            }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:border-[#0D9D1B] cursor-pointer"
          >
            <option value="telemetry">Data Telemetri Kualitas Air (Default)</option>
            <option value="node-registration">Registrasi Node IoT</option>
            <option value="maintenance">Log Pemeliharaan Perangkat</option>
            <option value="feeding">Log Pemberian Pakan</option>
          </select>
        </div>
      </div>

      {/* Dynamic Filters Form */}
      <form onSubmit={handleApplyFilter} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
          <Filter className="h-4 w-4 text-[#0D9D1B]" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Filter Data</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-end">
          
          {/* Conditional filter: Node Selector for Telemetry */}
          {reportType === 'telemetry' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilih Node IoT</label>
              <select
                value={filters.serial_number}
                onChange={(e) => setFilters(prev => ({ ...prev, serial_number: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0D9D1B]"
              >
                <option value="">-- Semua Node --</option>
                {nodes.map(node => (
                  <option key={node.id} value={node.serial_number}>
                    {node.serial_number}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional filter: Cage Selector for Feeding */}
          {reportType === 'feeding' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilih Keramba</label>
              <select
                value={filters.cage_id}
                onChange={(e) => setFilters(prev => ({ ...prev, cage_id: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0D9D1B]"
              >
                <option value="">-- Semua Keramba --</option>
                {cagesList.map(cage => (
                  <option key={cage.id} value={cage.id}>
                    {cage.cage_code}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tanggal Mulai</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0D9D1B]"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tanggal Selesai</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0D9D1B]"
            />
          </div>

          {/* Conditional Start Time for Telemetry */}
          {reportType === 'telemetry' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Jam Mulai</label>
              <input
                type="time"
                value={filters.startTime}
                onChange={(e) => setFilters(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0D9D1B]"
              />
            </div>
          )}

          {/* Conditional End Time for Telemetry */}
          {reportType === 'telemetry' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Jam Selesai</label>
              <input
                type="time"
                value={filters.endTime}
                onChange={(e) => setFilters(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0D9D1B]"
              />
            </div>
          )}

          {/* Submit Filter Button */}
          <div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-bold py-2 px-4 rounded-lg text-xs shadow-sm transition-all cursor-pointer h-[38px]"
            >
              <Search className="h-4 w-4" />
              <span>Terapkan</span>
            </button>
          </div>
        </div>
      </form>

      {/* Raw Data Table & Export Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Header Action Bar */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {reportType === 'telemetry' && <Database className="h-5 w-5 text-emerald-600" />}
            {reportType === 'node-registration' && <Cpu className="h-5 w-5 text-[#0D9D1B]" />}
            {reportType === 'maintenance' && <Wrench className="h-5 w-5 text-blue-600" />}
            {reportType === 'feeding' && <Calendar className="h-5 w-5 text-amber-600" />}
            
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">{getReportTitle()}</h2>
              <p className="text-[10px] text-slate-400">Menampilkan hingga 500 data terbaru yang terfilter</p>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloading.pdf || reportData.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-bold border border-slate-200 rounded-lg text-xs transition cursor-pointer"
              title="Unduh PDF Resmi"
            >
              <FileText className="h-3.5 w-3.5 text-red-500" />
              <span>{downloading.pdf ? 'Proses...' : 'PDF'}</span>
            </button>

            <button
              onClick={() => handleDownload('excel')}
              disabled={downloading.excel || reportData.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-bold border border-slate-200 rounded-lg text-xs transition cursor-pointer"
              title="Unduh Excel Spreadsheet"
            >
              <FileDown className="h-3.5 w-3.5 text-green-600" />
              <span>{downloading.excel ? 'Proses...' : 'Excel'}</span>
            </button>

            <button
              onClick={() => handleDownload('csv')}
              disabled={downloading.csv || reportData.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9D1B] hover:bg-[#0A8516] disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-sm shadow-green-500/10 transition cursor-pointer"
              title="Unduh CSV Murni"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{downloading.csv ? 'Proses...' : 'CSV'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Table Layouts */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold text-slate-500">Memuat data mentah...</span>
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <span className="text-xs font-semibold text-red-650">{error}</span>
            </div>
          ) : reportData.length === 0 ? (
            <div className="py-24 text-center text-slate-400 italic text-xs font-medium bg-slate-50/20">
              Tidak ditemukan data yang sesuai dengan filter saat ini.
            </div>
          ) : (
            <table className="w-full text-[11px] text-slate-700 border-collapse table-auto">
              
              {/* Report-Specific Table Headers */}
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                {reportType === 'telemetry' && (
                  <tr>
                    <th className="px-4 py-3 text-center w-12">No</th>
                    <th className="px-4 py-3 text-left">Serial Node</th>
                    <th className="px-4 py-3 text-center">Waktu Pengambilan</th>
                    <th className="px-4 py-3 text-right">Suhu (°C)</th>
                    <th className="px-4 py-3 text-right">Kelembaban (%)</th>
                    <th className="px-4 py-3 text-right">pH Air</th>
                    <th className="px-4 py-3 text-right">DO (mg/L)</th>
                    <th className="px-4 py-3 text-right">Salinitas (ppt)</th>
                    <th className="px-4 py-3 text-right">Turbiditas (NTU)</th>
                  </tr>
                )}
                {reportType === 'node-registration' && (
                  <tr>
                    <th className="px-4 py-3 text-center w-12">No</th>
                    <th className="px-4 py-3 text-left">Serial Number</th>
                    <th className="px-4 py-3 text-left">Owner / Instansi</th>
                    <th className="px-4 py-3 text-left">Edge Gateway</th>
                    <th className="px-4 py-3 text-left">Alamat IP</th>
                    <th className="px-4 py-3 text-center">Latitude</th>
                    <th className="px-4 py-3 text-center">Longitude</th>
                    <th className="px-4 py-3 text-center">Lokasi Kota</th>
                    <th className="px-4 py-3 text-center">Waktu Aktivasi</th>
                  </tr>
                )}
                {reportType === 'maintenance' && (
                  <tr>
                    <th className="px-4 py-3 text-center w-12">No</th>
                    <th className="px-4 py-3 text-left">Node Serial</th>
                    <th className="px-4 py-3 text-left">Petugas Lapangan</th>
                    <th className="px-4 py-3 text-left">Deskripsi Pemeliharaan</th>
                    <th className="px-4 py-3 text-center">Latitude</th>
                    <th className="px-4 py-3 text-center">Longitude</th>
                    <th className="px-4 py-3 text-center">Tanggal Log</th>
                  </tr>
                )}
                {reportType === 'feeding' && (
                  <tr>
                    <th className="px-4 py-3 text-center w-12">No</th>
                    <th className="px-4 py-3 text-left">Kode Keramba</th>
                    <th className="px-4 py-3 text-left">Petugas Pemberi Pakan</th>
                    <th className="px-4 py-3 text-center">Sesi Pakan</th>
                    <th className="px-4 py-3 text-left">Tipe Pakan</th>
                    <th className="px-4 py-3 text-right">Berat Pakan (kg)</th>
                    <th className="px-4 py-3 text-center">Waktu Pemberian</th>
                  </tr>
                )}
              </thead>

              {/* Report-Specific Table Body */}
              <tbody className="divide-y divide-slate-100">
                {reportType === 'telemetry' && reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-2.5 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{row.iot_node_serial_number || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-slate-500">{formatTime(row._time)}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{row.temperature !== undefined ? Number(row.temperature).toFixed(2) + ' °C' : '-'}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{row.humidity !== undefined ? Number(row.humidity).toFixed(2) + ' %' : '-'}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-indigo-650">{row.ph !== undefined ? Number(row.ph).toFixed(2) : '-'}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{row.dissolved_oxygen !== undefined ? Number(row.dissolved_oxygen).toFixed(2) + ' mg/L' : '-'}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{row.salinity !== undefined ? Number(row.salinity).toFixed(2) + ' ppt' : '-'}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{row.turbidity !== undefined ? Number(row.turbidity).toFixed(2) + ' NTU' : '-'}</td>
                  </tr>
                ))}

                {reportType === 'node-registration' && reportData.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-2.5 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{row.serial_number}</td>
                    <td className="px-4 py-2.5 text-slate-600 font-medium">{row.owner?.name || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono">{row.edge_gateway?.serial_number || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono">{row.ip_address || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-slate-500">{row.latitude || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-slate-500">{row.longitude || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-slate-650 font-semibold">{row.city?.name || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-slate-450">{row.activated_at ? new Date(row.activated_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : '-'}</td>
                  </tr>
                ))}

                {reportType === 'maintenance' && reportData.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-2.5 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{row.iot_node?.serial_number || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600 font-medium">{row.operator?.name || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate" title={row.description}>{row.description || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-slate-500">{row.latitude || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-slate-500">{row.longitude || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-slate-450">{new Date(row.created_at).toLocaleString('id-ID')}</td>
                  </tr>
                ))}

                {reportType === 'feeding' && reportData.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-2.5 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{row.cage?.cage_code || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600 font-medium">{row.operator?.full_name || '-'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        row.feed_session === 'morning' ? 'bg-amber-50 text-amber-700' :
                        row.feed_session === 'afternoon' ? 'bg-orange-50 text-orange-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {row.feed_session}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 font-medium">{row.feed_type || '-'}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-650">{row.weight_kg !== undefined ? Number(row.weight_kg).toFixed(2) + ' kg' : '-'}</td>
                    <td className="px-4 py-2.5 text-center text-slate-450">{new Date(row.created_at).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
