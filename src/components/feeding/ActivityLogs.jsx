import React from 'react';
import { Clock } from 'lucide-react';

export const ActivityLogs = ({ activityLogs }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-full">
      <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Log Aktivitas</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Segala aktivitas sistem yang tercatat di sesi ini</p>
        </div>
        <Clock className="h-4.5 w-4.5 text-slate-400" />
      </div>

      <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3.5 pr-1 scrollbar-thin">
        {activityLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Belum ada aktivitas tercatat.
          </div>
        ) : (
          activityLogs.map((log) => (
            <div key={log.id} className="flex gap-3 text-xs leading-normal">
              <span className="font-mono text-[10px] text-slate-400 shrink-0 mt-0.5">{log.time}</span>
              <p className="font-medium text-slate-700">{log.action}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
