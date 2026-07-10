import React, { useState } from 'react';
import { FileText, Download, Cpu, Calendar, Wrench, Database } from 'lucide-react';
import { api } from '../../api/api';

export const ReportsTab = ({ token, nodes = [] }) => {
  const [selectedNode, setSelectedNode] = useState('');
  const [downloading, setDownloading] = useState({
    nodePdf: false,
    nodeCsv: false,
    telemetryPdf: false,
    telemetryCsv: false,
    maintenancePdf: false,
    maintenanceCsv: false,
    feedingPdf: false,
    feedingCsv: false,
  });

  const handleDownload = async (type, format, stateKey) => {
    setDownloading(prev => ({ ...prev, [stateKey]: true }));
    try {
      const serial = type === 'telemetry' ? selectedNode : '';
      const blob = await api.downloadReport(token, type, format, serial);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_${type}_${serial ? serial + '_' : ''}${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Gagal mengunduh laporan. Silakan coba beberapa saat lagi.');
    } finally {
      setDownloading(prev => ({ ...prev, [stateKey]: false }));
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pusat Laporan & Ekspor Data</h1>
        <p className="text-xs text-slate-500 mt-1">Unduh seluruh rekaman operasional lobsense dalam format dokumen resmi PDF atau spreadsheet CSV.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Node Registrasi */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Laporan Registrasi Node IoT</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Daftar node yang telah aktif, posisi koordinat, dan pemilik.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => handleDownload('node-registration', 'pdf', 'nodePdf')}
              disabled={downloading.nodePdf}
              className="flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer border border-slate-200 shadow-sm"
            >
              <FileText className="h-4 w-4 text-red-500" />
              <span>{downloading.nodePdf ? 'Mengunduh...' : 'Unduh PDF'}</span>
            </button>
            <button
              onClick={() => handleDownload('node-registration', 'csv', 'nodeCsv')}
              disabled={downloading.nodeCsv}
              className="flex items-center justify-center gap-2 py-2 bg-[#0D9D1B] hover:bg-[#0A8516] disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-sm shadow-green-500/10"
            >
              <Download className="h-4 w-4" />
              <span>{downloading.nodeCsv ? 'Mengunduh...' : 'Unduh CSV'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Log Pemeliharaan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Laporan Log Pemeliharaan</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Catatan maintenance perangkat keras IoT oleh teknisi.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => handleDownload('maintenance', 'pdf', 'maintenancePdf')}
              disabled={downloading.maintenancePdf}
              className="flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer border border-slate-200 shadow-sm"
            >
              <FileText className="h-4 w-4 text-red-500" />
              <span>{downloading.maintenancePdf ? 'Mengunduh...' : 'Unduh PDF'}</span>
            </button>
            <button
              onClick={() => handleDownload('maintenance', 'csv', 'maintenanceCsv')}
              disabled={downloading.maintenanceCsv}
              className="flex items-center justify-center gap-2 py-2 bg-[#0D9D1B] hover:bg-[#0A8516] disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-sm shadow-green-500/10"
            >
              <Download className="h-4 w-4" />
              <span>{downloading.maintenanceCsv ? 'Mengunduh...' : 'Unduh CSV'}</span>
            </button>
          </div>
        </div>

        {/* Card 3: Log Pemberian Pakan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Laporan Log Pemberian Pakan</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Aktivitas pemberian pakan lobster di keramba jaring apung.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => handleDownload('feeding', 'pdf', 'feedingPdf')}
              disabled={downloading.feedingPdf}
              className="flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer border border-slate-200 shadow-sm"
            >
              <FileText className="h-4 w-4 text-red-500" />
              <span>{downloading.feedingPdf ? 'Mengunduh...' : 'Unduh PDF'}</span>
            </button>
            <button
              onClick={() => handleDownload('feeding', 'csv', 'feedingCsv')}
              disabled={downloading.feedingCsv}
              className="flex items-center justify-center gap-2 py-2 bg-[#0D9D1B] hover:bg-[#0A8516] disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-sm shadow-green-500/10"
            >
              <Download className="h-4 w-4" />
              <span>{downloading.feedingCsv ? 'Mengunduh...' : 'Unduh CSV'}</span>
            </button>
          </div>
        </div>

        {/* Card 4: Data Telemetri (Dinamis per Node) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Laporan Telemetri Kualitas Air</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Grafik log historis 100 data parameter sensor kualitas air tambak.</p>
              </div>
            </div>
            <div className="mt-3">
              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Filter Serial Number Node (Opsional)</label>
              <select
                value={selectedNode}
                onChange={(e) => setSelectedNode(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
              >
                <option value="">-- Semua Node --</option>
                {nodes.map(node => (
                  <option key={node.id} value={node.serial_number}>
                    {node.serial_number}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => handleDownload('telemetry', 'pdf', 'telemetryPdf')}
              disabled={downloading.telemetryPdf}
              className="flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer border border-slate-200 shadow-sm"
            >
              <FileText className="h-4 w-4 text-red-500" />
              <span>{downloading.telemetryPdf ? 'Mengunduh...' : 'Unduh PDF'}</span>
            </button>
            <button
              onClick={() => handleDownload('telemetry', 'csv', 'telemetryCsv')}
              disabled={downloading.telemetryCsv}
              className="flex items-center justify-center gap-2 py-2 bg-[#0D9D1B] hover:bg-[#0A8516] disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-sm shadow-green-500/10"
            >
              <Download className="h-4 w-4" />
              <span>{downloading.telemetryCsv ? 'Mengunduh...' : 'Unduh CSV'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
