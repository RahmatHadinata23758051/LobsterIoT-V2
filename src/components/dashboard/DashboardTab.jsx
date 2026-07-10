import React from 'react';
import { 
  Cpu, 
  Video, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  WifiOff, 
  Sun, 
  Moon, 
  Cloud, 
  CloudSun, 
  CloudMoon, 
  CloudRain, 
  CloudLightning, 
  CloudSnow, 
  CloudFog,
  Sunrise,
  Sunset
} from 'lucide-react';
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
  setChartMetric,
  weatherData,
  loadingDashboard = false
}) => {

  if (loadingDashboard && !dashboardData?.latest) {
    return (
      <div className="flex flex-col gap-6 animate-pulse select-none">
        {/* Sensor & Weather Section */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left: 6 Sensor Cards Grid (3x2) */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[180px] bg-white border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 bg-slate-100 rounded-xl" />
                      <div className="h-4 w-20 bg-slate-100 rounded-md" />
                    </div>
                    <div className="h-4 w-4 bg-slate-100 rounded-md" />
                  </div>
                  <div className="h-10 w-24 bg-slate-100/70 rounded-lg mt-1" />
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <div className="h-3 w-10 bg-slate-100 rounded" />
                    <div className="h-3 w-10 bg-slate-100 rounded" />
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className="h-1.5 flex-1 bg-slate-100 rounded-sm" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Weather Card Skeleton */}
          <div className="w-full xl:w-[280px] shrink-0">
            <div className="h-[376px] bg-slate-200/50 rounded-3xl p-5 flex flex-col justify-between border border-slate-150/40">
              <div className="space-y-4">
                <div className="h-3 w-16 bg-slate-100/80 rounded" />
                <div className="h-5 w-24 bg-slate-100/80 rounded" />
                <div className="h-14 w-28 bg-slate-100/80 rounded-xl mt-4" />
                <div className="h-5 w-16 bg-slate-100/80 rounded" />
              </div>
              <div className="border-t border-slate-100/30 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="h-2 w-10 bg-slate-100/80 rounded" />
                    <div className="h-4 w-12 bg-slate-100/80 rounded" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-10 bg-slate-100/80 rounded" />
                    <div className="h-4 w-12 bg-slate-100/80 rounded" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-16 bg-slate-100/80 rounded" />
                  <div className="h-4 w-20 bg-slate-100/80 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Camera & Operations layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 h-[280px] bg-white border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-slate-100 rounded" />
              <div className="h-4 w-20 bg-slate-100 rounded" />
            </div>
            <div className="flex-1 bg-slate-100 rounded-xl my-3" />
          </div>

          <div className="xl:col-span-2 h-[280px] bg-white border border-slate-200/60 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-4 w-40 bg-slate-100 rounded" />
                <div className="h-3 w-3 bg-slate-100 rounded-full" />
              </div>
              <div className="h-20 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-16 bg-slate-100 rounded-xl" />
          </div>
        </div>

        {/* Chart Skeleton */}
        <div className="h-[260px] bg-white border border-slate-200/60 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-2.5 w-48 bg-slate-100 rounded" />
            </div>
            <div className="h-8 w-64 bg-slate-100 rounded-lg" />
          </div>
          <div className="flex-1 bg-slate-100/50 rounded-xl my-4 flex items-end justify-between p-4 gap-2">
            {[2, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8].map((val, idx) => (
              <div key={idx} style={{ height: `${val * 10}%` }} className="w-full bg-slate-150/40 rounded-t-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

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

  const getWeatherIcon = () => {
    const desc = (weatherData?.condition || 'Cerah').toLowerCase();
    const iconUrl = weatherData?.icon_url || '';
    
    // Check if it's night based on OpenWeather API icon code (e.g. "/wn/01n" -> ends in 'n')
    let isNight = false;
    const match = iconUrl.match(/\/wn\/([0-9]+[dn])/);
    if (match) {
      isNight = match[1].endsWith('n');
    } else {
      const currentHour = new Date().getHours();
      isNight = currentHour >= 18 || currentHour < 6;
    }

    const hour = new Date().getHours();

    // 1. Extreme Weather Overrides (independent of time of day)
    if (desc.includes('thunderstorm') || desc.includes('petir') || desc.includes('badai')) {
      return <CloudLightning className="h-6 w-6 text-yellow-300 animate-pulse" />;
    }
    if (desc.includes('rain') || desc.includes('gerimis') || desc.includes('hujan')) {
      return <CloudRain className="h-6 w-6 text-blue-200 animate-bounce" style={{ animationDuration: '2.5s' }} />;
    }
    if (desc.includes('snow') || desc.includes('salju')) {
      return <CloudSnow className="h-6 w-6 text-blue-100" />;
    }
    if (desc.includes('fog') || desc.includes('mist') || desc.includes('haze') || desc.includes('kabut') || desc.includes('asap')) {
      return <CloudFog className="h-6 w-6 text-slate-350" />;
    }

    // 2. Clear or Light Cloudy Conditions mapped to specific times of day
    if (isNight) {
      return <Moon className="h-6 w-6 text-yellow-100 animate-[pulse_3s_infinite]" />;
    }

    // Daytime: Morning, Noon, Afternoon/Evening
    if (hour >= 6 && hour < 11) {
      // Pagi (Morning): Sunrise
      return <Sunrise className="h-6 w-6 text-amber-300 animate-pulse" />;
    }
    if (hour >= 11 && hour < 15) {
      // Siang (Noon/Afternoon): Sun
      return <Sun className="h-6 w-6 text-yellow-350 animate-[spin_10s_linear_infinite]" />;
    }
    if (hour >= 15 && hour < 18) {
      // Sore (Late Afternoon/Evening): Sunset
      return <Sunset className="h-6 w-6 text-orange-350 animate-pulse" />;
    }

    // Default Fallback
    return <Sun className="h-6 w-6 text-yellow-350 animate-[spin_10s_linear_infinite]" />;
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Sensor Cards & Weather Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-[#0D9D1B] rounded-full" />
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Real-time Sensor Hub & Kondisi Lingkungan</h2>
          <span className="text-[10px] text-slate-400 font-medium font-mono">(Klik kartu untuk glossary)</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Side: 3 Columns x 2 Rows of parameter cards */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

          {/* Right Side: 1 Large Weather Card matching the height (376px) */}
          <div className="lg:col-span-1 flex">
            <div className="relative w-full h-full min-h-[360px] lg:h-[376px] bg-gradient-to-br from-[#0D9D1B]/95 to-[#056310]/95 border border-[#0D9D1B]/30 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-[0_8px_24px_rgba(13,157,27,0.15)] transition-all duration-300">
              
              {/* Decorative background overlay */}
              <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -left-8 -top-8 w-32 h-32 bg-[#0D9D1B]/20 rounded-full blur-2xl" />

              {/* Header: Location info */}
              <div className="relative z-10 shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold text-green-200 uppercase tracking-widest block">Kondisi Cuaca</span>
                    <h3 className="text-sm font-semibold tracking-tight text-white mt-0.5 uppercase">
                      {weatherData?.city_name || activeNode?.city?.name || 'Balai Akuakultur'}
                    </h3>
                  </div>
                  <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-inner shrink-0">
                    {getWeatherIcon()}
                  </div>
                </div>
              </div>

              {/* Middle: Big Temp and Condition */}
              <div className="relative z-10 my-auto py-4 flex flex-col items-center justify-center text-center">
                <span className="text-5xl font-extrabold font-mono tracking-tighter text-white drop-shadow-sm select-none">
                  {weatherData ? `${weatherData.temperature_c}°` : '28°'}
                </span>
                <span className="text-[11px] font-semibold text-green-100 uppercase tracking-wider mt-2.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm select-none">
                  {weatherData?.condition || 'Cerah'}
                </span>
              </div>

              {/* Footer: Details list */}
              <div className="relative z-10 border-t border-white/10 pt-4 shrink-0">
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[10.5px] text-green-100">
                  <div>
                    <span className="text-[9px] text-green-200 block uppercase font-semibold tracking-wider">Kelembapan</span>
                    <span className="font-semibold font-mono text-white text-xs">{weatherData?.humidity ? `${weatherData.humidity}%` : '70%'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-green-200 block uppercase font-semibold tracking-wider">Angin</span>
                    <span className="font-semibold font-mono text-white text-xs">{weatherData?.wind_speed ? `${weatherData.wind_speed} m/s` : '3.5 m/s'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-green-200 block uppercase font-semibold tracking-wider">Curah Hujan</span>
                    <span className="font-semibold font-mono text-white text-xs">{weatherData?.rainfall ? `${weatherData.rainfall} mm` : '0 mm'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Camera & Operations layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-[#0D9D1B]" />
              <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Tampilan Live Kamera</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{activeNodeSerial || 'N/A'}</span>
          </div>
          <div className="bg-slate-950 aspect-video w-full ring-1 ring-slate-800 rounded-lg overflow-hidden shadow-inner">
            <CctvView streamUrl={getCameraStreamUrl()} />
          </div>
        </div>

        <div className="xl:col-span-2 flex flex-col bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-800 uppercase tracking-wider">Status Operasional & Notifikasi</h3>
              <p className="text-[10px] text-slate-450 mt-0.5 font-medium">Informasi perangkat & status sensor KJA</p>
            </div>
            <span className={`h-2.5 w-2.5 rounded-full ${activeNode ? 'bg-[#0D9D1B]' : 'bg-slate-300'}`} />
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
                <span className="font-bold text-[#0D9D1B] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0D9D1B]" />
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
                        <p className="font-semibold text-amber-800">Batas Ideal Terlampaui: {a.label}</p>
                        <p className="text-[10px] text-amber-600 font-mono mt-0.5">
                          Nilai: <span className="font-bold">{a.val.toFixed(2)} {a.unit}</span> (Batas: {a.min} – {a.max} {a.unit})
                        </p>
                      </div>
                    </div>
                  ));
                }
                return (
                  <div className="flex items-start gap-3 p-4.5 rounded-xl border border-green-100 bg-green-50/30 text-green-900 h-full">
                    <CheckCircle className="h-5 w-5 text-[#0D9D1B] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-emerald-800">Seluruh Sensor Berfungsi Normal</p>
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
