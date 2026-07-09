import React from 'react';
import { Cpu, Video, AlertCircle, AlertTriangle, CheckCircle, WifiOff } from 'lucide-react';
import { MetricCard } from '../common/MetricCard';
import { SensorChart } from '../common/SensorChart';
import { CctvView } from '../common/CctvView';

const SENSOR_MAP = [
  { key: 'ph',                label: 'pH Air',     unit: 'pH',   icon: Cpu,     code: 'ph' },
  { key: 'tds',               label: 'TDS',        unit: 'ppm',  icon: Cpu,      code: 'tds' },
  { key: 'dissolved_oxygen',  label: 'DO',         unit: 'mg/L', icon: Cpu,        code: 'dissolved_oxygen' },
  { key: 'water_temperature', label: 'Suhu',       unit: '°C',   icon: Cpu, code: 'water_temperature' },
  { key: 'flow_rate',         label: 'Arus',       unit: 'm/s',  icon: Cpu,    code: 'flow_rate' },
  { key: 'turbidity',         label: 'Turbidity',  unit: 'NTU',  icon: Cpu,         code: 'turbidity' },
];

export const DashboardTab = ({
  activeNode,
  activeNodeSerial,
  dashboardData,
  cameras,
  chartMetric,
  setChartMetric
}) => {

  const getCameraStreamUrl = () => {
    const cageCode = dashboardData.latest?.cage_code || '';
    const cam = cameras.find((c) => c.cage?.cage_code === cageCode);
    return cam ? cam.stream_url : '';
  };

  const getThreshold = (code) => {
    const t = dashboardData.thresholds.find((th) => th.sensor_code === code);
    return t ? { min: Number(t.value_min), max: Number(t.value_max) } : null;
  };

  const getLiveValue = (key) => {
    const v = dashboardData.latest?.[key];
    return (v !== undefined && v !== null) ? Number(v) : null;
  };

  const getSensorStatus = (key, code) => {
    const val = getLiveValue(key);
    const th  = getThreshold(code);
    if (val === null) return 'offline';
    if (!th) return 'normal';
    return (val < th.min || val > th.max) ? 'warning' : 'normal';
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-lg font-black text-slate-900 tracking-tight">Sistem Layanan Akuakultur Monitoring (SLAM 2.0)</h1>
        <p className="text-xs text-slate-500 mt-1">
          {activeNode
            ? <>KJA Terpantau: <span className="font-mono font-semibold text-slate-700">{activeNodeSerial}</span></>
            : 'Belum ada node aktif — pastikan IoT Node sudah terdaftar di database.'}
        </p>
      </div>

      {/* Sensor Cards Row */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-[#22C55E] rounded-full" />
          <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Real-time Sensor Hub</h2>
          <span className="text-[10px] text-slate-400 font-medium font-mono">(Klik kartu untuk glossary)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {SENSOR_MAP.map(({ key, code }) => (
            <MetricCard
              key={key}
              type={code}
              value={getLiveValue(key)}
              minIdeal={getThreshold(code)?.min}
              maxIdeal={getThreshold(code)?.max}
            />
          ))}
        </div>
      </div>

      {/* Camera & Operations layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-[#22C55E]" />
              <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Tampilan Live Kamera</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{activeNodeSerial || 'N/A'}</span>
          </div>
          <div className="bg-slate-950 aspect-video w-full">
            <CctvView streamUrl={getCameraStreamUrl()} />
          </div>
        </div>

        <div className="xl:col-span-2 flex flex-col bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-extrabold text-slate-800 uppercase tracking-wider">Status Operasional & Notifikasi</h3>
              <p className="text-[10px] text-slate-450 mt-0.5 font-medium">Informasi perangkat & status sensor KJA</p>
            </div>
            <span className={`h-2.5 w-2.5 rounded-full ${activeNode ? 'bg-[#22C55E]' : 'bg-slate-300'}`} />
          </div>

          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 mb-4 flex flex-col gap-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
              <Cpu className="h-3.5 w-3.5 text-slate-400" />
              <span>Spesifikasi Perangkat</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">IP Address</span>
                <span className="font-mono font-bold text-slate-700">{activeNode?.ip_address || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Koordinat GPS</span>
                <span className="font-mono font-bold text-slate-700 truncate block">
                  {activeNode?.latitude ? `${Number(activeNode.latitude).toFixed(4)}, ${Number(activeNode.longitude).toFixed(4)}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Kode Keramba</span>
                <span className="font-bold text-slate-700">{dashboardData.latest?.cage_code || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Status Gateway</span>
                <span className="font-bold text-[#22C55E] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
              <span>Notifikasi & Kepatuhan Sensor</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[170px] flex flex-col gap-2 pr-1 scrollbar-thin">
              {(() => {
                if (!dashboardData.latest) {
                  return (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl gap-2 h-full">
                      <WifiOff className="h-6 w-6 text-slate-300" />
                      <span className="text-[11px] font-medium">Tidak ada koneksi data telemetri</span>
                    </div>
                  );
                }
                const alerts = [];
                SENSOR_MAP.forEach((s) => {
                  const status = getSensorStatus(s.key, s.code);
                  if (status === 'warning') {
                    const val = getLiveValue(s.key);
                    const th  = getThreshold(s.code);
                    alerts.push({ label: s.label, val, unit: s.unit, min: th?.min, max: th?.max });
                  }
                });
                if (alerts.length > 0) {
                  return alerts.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-100 bg-amber-50/50 text-amber-900 leading-normal">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-xs">
                        <p className="font-extrabold text-amber-800">Batas Ideal Terlampaui: {a.label}</p>
                        <p className="text-[10px] text-amber-600 font-mono mt-0.5">
                          Nilai: <span className="font-bold">{a.val.toFixed(2)} {a.unit}</span> (Batas: {a.min} – {a.max} {a.unit})
                        </p>
                      </div>
                    </div>
                  ));
                }
                return (
                  <div className="flex items-start gap-3 p-4.5 rounded-xl border border-green-100 bg-green-50/30 text-green-900 h-full">
                    <CheckCircle className="h-5 w-5 text-[#22C55E] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-extrabold text-emerald-800">Seluruh Sensor Berfungsi Normal</p>
                      <p className="text-slate-500 mt-1 leading-relaxed">
                        Pembacaan parameter kualitas air KJA ({dashboardData.latest.cage_code}) berada dalam ambang batas ideal budidaya lobster.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <SensorChart
        historyData={dashboardData.series_24h}
        selectedMetric={chartMetric}
        onChangeMetric={setChartMetric}
      />
    </div>
  );
};
