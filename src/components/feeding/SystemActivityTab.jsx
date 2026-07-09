import React from 'react';
import { Clock, ShieldCheck } from 'lucide-react';

export const SystemActivityTab = ({ activityLogs }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-4xl mx-auto w-full animate-[fadeIn_0.4s_ease-out]">
      <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Log Aktivitas Sistem</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Catatan audit log aktivitas operator, autentikasi, dan perubahan data selama sesi aktif</p>
        </div>
        <Clock className="h-5 w-5 text-[#22C55E] animate-pulse" />
      </div>

      <div className="space-y-4">
        {activityLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Belum ada log aktivitas operasional yang tercatat pada sesi ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-xl overflow-hidden bg-slate-50/20">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-slate-50/50 transition-colors text-xs leading-normal">
                <div className="p-2 bg-slate-100 text-slate-500 rounded-lg shrink-0 mt-0.5">
                  <ShieldCheck className="h-4 w-4 text-[#22C55E]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{log.action}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Waktu Pencatatan: {log.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
