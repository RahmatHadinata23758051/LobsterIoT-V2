import React, { useState } from 'react';
import { Wind, Power, Zap, Activity, RefreshCw, Clock } from 'lucide-react';
import { HardwareControlPanel } from './HardwareControlPanel';

export const AeratorLogsTab = ({ token, selectedSerial = 'DEMO-NODE-001', activityLogs = [] }) => {
  // Filter aerator logs from system activity logs or hardware events
  const aeratorEvents = activityLogs.filter(log => 
    (log.action || '').toLowerCase().includes('aerator') || 
    (log.action || '').toLowerCase().includes('kincir') || 
    (log.action || '').toLowerCase().includes('feeder') ||
    (log.action || '').toLowerCase().includes('relay')
  );

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out] font-sans">
      
      {/* Header Bar */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wind className="h-6 w-6 text-[#0D9D1B]" />
            <span>Kontrol & Log Aerator Tambak</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen operasional 24 jam aerator/kincir air & pemantauan status relay secara real-time
          </p>
        </div>
      </div>

      {/* Hardware Relay Control Panel */}
      <HardwareControlPanel token={token} selectedSerial={selectedSerial} />

      {/* Aerator Activity History Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#0D9D1B] border border-emerald-100">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Riwayat Aktivitas & Kontrol Aerator</h2>
              <p className="text-[10px] text-slate-400">Catatan saklar otomatis pemicu sensor DO & eksekusi manual petugas</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {aeratorEvents.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium bg-slate-50/20">
              Belum ada riwayat aktivitas aerator yang tercatat pada sesi ini.
            </div>
          ) : (
            <table className="w-full text-[12px] text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-center w-14">No</th>
                  <th className="px-4 py-3 text-left">Perangkat / Relay</th>
                  <th className="px-4 py-3 text-left">Deskripsi Tindakan</th>
                  <th className="px-4 py-3 text-center w-36">Eksekutor</th>
                  <th className="px-4 py-3 text-center w-48">Waktu Eksekusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aeratorEvents.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span>Aerator System</span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{log.action}</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-600">{log.userName || log.user || 'Sistem / Operator'}</td>
                    <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">{log.formattedTime || log.time || '-'}</td>
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
