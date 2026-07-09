import React, { useState } from 'react';
import { Droplet, Thermometer, Wind, Eye, Layers, Activity, Info, ShieldAlert, Sparkles, Wrench } from 'lucide-react';

const SENSOR_GLOSSARY = {
  ph: {
    label: 'Acidity (pH Level)', unit: 'pH',
    description: 'Mengukur tingkat keseimbangan asam-basa air laut.',
    risk: 'Cangkang lunak, penyerapan mineral terhenti, amonia naik.',
    action: 'Beri buffer kalsit / kapur pertanian, optimalkan biofilter.'
  },
  tds: {
    label: 'Total Dissolved Solids', unit: 'ppm',
    description: 'Zat padat terlarut penunjang kepadatan mineral air.',
    risk: 'Osmo-regulasi cairan terganggu, gagal molting cangkang.',
    action: 'Sirkulasi air tawar bersih perlahan, stabilkan salinitas.'
  },
  dissolved_oxygen: {
    label: 'Dissolved Oxygen (DO)', unit: 'mg·L⁻¹',
    description: 'Kadar oksigen terlarut vital bagi sistem pernapasan.',
    risk: 'Hipoksia, lobster lemas merangkak naik, kematian massal.',
    action: 'Aktifkan blower aerator cadangan, tingkatkan sirkulasi.'
  },
  water_temperature: {
    label: 'Water Temp', unit: '°C',
    description: 'Suhu air laut pengatur laju metabolisme & nafsu makan.',
    risk: 'Stres suhu, nafsu makan drop, kanibalisme naik agresif.',
    action: 'Pasang jaring paranet peneduh, pantau fluktuasi suhu.'
  },
  flow_rate: {
    label: 'Water Flow Rate', unit: 'm·s⁻¹',
    description: 'Kecepatan arus air sirkulator oksigen & pembersih pakan.',
    risk: 'Pakan mengendap busuk di dasar, DO tidak terdistribusi.',
    action: 'Posisikan ulang pompa arus, bersihkan jaring KJA.'
  },
  turbidity: {
    label: 'Turbidity (Kekeruhan)', unit: 'NTU',
    description: 'Kekuatan kejernihan air terhadap hamburan partikel lumpur.',
    risk: 'Insang tersumbat kotoran, infeksi patogen / bakteri.',
    action: 'Bersihkan saringan mekanik, kurangi sedimen lumpur.'
  },
};

const ICON_MAP = {
  ph: Droplet,
  tds: Layers,
  dissolved_oxygen: Wind,
  water_temperature: Thermometer,
  flow_rate: Activity,
  turbidity: Eye,
};

const DEFAULT_THRESHOLDS = {
  ph:                { min: 7.5,  max: 8.5  },
  tds:               { min: 800,  max: 1000 },
  dissolved_oxygen:  { min: 5.0,  max: 8.0  },
  water_temperature: { min: 24.0, max: 28.0 },
  flow_rate:         { min: 0.1,  max: 0.3  },
  turbidity:         { min: 0.0,  max: 5.0  },
};

export const MetricCard = ({ type, value, minIdeal, maxIdeal }) => {
  const [flipped, setFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState('impact'); // impact | solution

  const meta = SENSOR_GLOSSARY[type];
  if (!meta) return null;

  const Icon  = ICON_MAP[type] || Droplet;
  const min   = minIdeal ?? DEFAULT_THRESHOLDS[type]?.min ?? 0;
  const max   = maxIdeal ?? DEFAULT_THRESHOLDS[type]?.max ?? 100;
  const isOff = value === null || value === undefined;
  const isWarn= !isOff && (value < min || value > max);

  // Progress percentage clamped 0–100%
  const pct = isOff ? 0 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  // Colors
  const accentColor = isWarn ? '#ef4444' : isOff ? '#94a3b8' : '#10b981';
  const accentBg    = isWarn ? '#fef2f2' : isOff ? '#f8fafc' : '#ecfdf5';
  const borderClass = isWarn ? 'border-red-200' : flipped ? 'border-[#22C55E]' : 'border-slate-200/80';
  const shadowClass = isWarn 
    ? 'shadow-[0_4px_16px_rgba(239,68,68,0.04)] hover:shadow-[0_8px_24px_rgba(239,68,68,0.08)]'
    : flipped 
    ? 'shadow-[0_4px_16px_rgba(16,185,129,0.05)]'
    : 'shadow-sm hover:shadow-[0_6px_16px_rgba(16,185,129,0.04)] hover:border-slate-300';

  // Segmented bar gauge
  const renderSegments = () => {
    const activeSegments = isOff ? 0 : Math.min(5, Math.ceil(pct / 20) || 1);
    return (
      <div className="flex items-center gap-1 w-full mt-2.5">
        {[1, 2, 3, 4, 5].map((seg) => {
          const isActive = seg <= activeSegments;
          let color = 'bg-slate-100';
          if (isActive) {
            color = isWarn ? 'bg-red-500' : 'bg-[#22C55E]';
          }
          return (
            <div
              key={seg}
              className={`h-1.5 flex-1 rounded-sm transition-all duration-500 ${color}`}
              style={{
                boxShadow: isActive && !isWarn ? '0 0 6px rgba(16, 185, 129, 0.2)' : isActive && isWarn ? '0 0 6px rgba(239, 68, 68, 0.2)' : 'none'
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="w-full h-[180px] cursor-pointer select-none group"
      style={{ perspective: '1000px' }}
      title="Klik untuk membalik dan melihat penjelasan"
    >
      {/* preserve-3d wrapper — must NOT have overflow:hidden, it flattens 3D */}
      <div
        className={`relative w-full h-full transition-transform duration-500 ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        {/* FRONT FACE */}
        <div
          className={`absolute inset-0 w-full h-full bg-white border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 ${borderClass} ${shadowClass}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex flex-col gap-2.5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 rounded-xl transition-colors duration-300"
                  style={{ background: accentBg }}
                >
                  <Icon className="h-4 w-4 animate-[softGlow_2s_infinite]" style={{ color: accentColor }} />
                </div>
                <span className="text-[12px] font-extrabold text-slate-700 tracking-wide uppercase">{meta.label}</span>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); setFlipped(true); }}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                title="Buka Glosarium"
              >
                <Info className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Value Display */}
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-4xl font-black font-mono leading-none tracking-tight text-slate-900">
                {isOff ? '--' : value.toFixed(type === 'tds' ? 0 : 2)}
              </span>
              <span className="text-sm font-extrabold text-slate-400 font-mono tracking-wider">{meta.unit}</span>
            </div>
          </div>

          {/* Footer Limits & Gauge */}
          <div className="flex flex-col mt-auto">
            <div className="flex items-center justify-between text-[10px] text-slate-450 font-mono font-bold tracking-tight">
              <span>MIN: {min}</span>
              <span>MAX: {max}</span>
            </div>
            {renderSegments()}
          </div>
        </div>

        {/* BACK FACE */}
        <div 
          className="absolute inset-0 w-full h-full bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-md"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {/* Tabs selector */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[#22C55E] animate-spin-slow" />
              Glosarium
            </span>
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg text-[10px] font-bold" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setActiveTab('impact')}
                className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                  activeTab === 'impact' ? 'bg-[#22C55E] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Risiko
              </button>
              <button
                onClick={() => setActiveTab('solution')}
                className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                  activeTab === 'solution' ? 'bg-[#22C55E] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Solusi
              </button>
            </div>
          </div>

          {/* Info Details Content */}
          <div className="flex-1 overflow-hidden py-1 text-[10.5px] leading-relaxed text-slate-600 select-text" onClick={(e) => e.stopPropagation()}>
            <p className="text-slate-400 font-semibold mb-2 line-clamp-2">{meta.description}</p>
            {activeTab === 'impact' ? (
              <div className="flex items-start gap-1.5 p-2 bg-red-50/60 border border-red-100/50 rounded-xl text-red-950 font-bold leading-normal">
                <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                <span className="line-clamp-3">Dampak: {meta.risk}</span>
              </div>
            ) : (
              <div className="flex items-start gap-1.5 p-2 bg-green-50/60 border border-green-100/50 rounded-xl text-green-900 font-bold leading-normal">
                <Wrench className="h-3.5 w-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="line-clamp-3">Tindakan: {meta.action}</span>
              </div>
            )}
          </div>

          {/* Footer close */}
          <div className="flex items-center justify-between text-[10px] text-slate-450 font-bold border-t border-slate-100 pt-1.5 shrink-0">
            <span className="font-mono text-slate-350">{type.toUpperCase()}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
              className="text-[#22C55E] hover:text-[#16A34A] transition-colors font-black flex items-center gap-0.5 cursor-pointer uppercase tracking-widest text-[9px]"
            >
              Tutup &rarr;
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes softGlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};
