import React from 'react';
import { RotateCcw, Droplet, Thermometer, Wind, Eye, Layers, Activity } from 'lucide-react';

const SENSOR_MAP = [
  { key: 'ph',                label: 'pH Air',     unit: 'pH',   icon: Droplet,     code: 'ph' },
  { key: 'tds',               label: 'TDS',        unit: 'ppm',  icon: Layers,      code: 'tds' },
  { key: 'dissolved_oxygen',  label: 'DO',         unit: 'mg/L', icon: Wind,        code: 'dissolved_oxygen' },
  { key: 'water_temperature', label: 'Suhu',       unit: '°C',   icon: Thermometer, code: 'water_temperature' },
  { key: 'flow_rate',         label: 'Arus',       unit: 'm/s',  icon: Activity,    code: 'flow_rate' },
  { key: 'turbidity',         label: 'Turbidity',  unit: 'NTU',  icon: Eye,         code: 'turbidity' },
];

export const ThresholdConfig = ({
  thresholdsList = [],
  loadingThresholds,
  onUpdateThresholds,
  setThresholdsList,
  onRefresh
}) => {

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateThresholds(thresholdsList);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-w-3xl mx-auto w-full animate-[fadeIn_0.4s_ease-out]">
      <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Konfigurasi Batas Sensor</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Sesuaikan batas ideal pemicu peringatan sensor kualitas air</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {loadingThresholds ? (
        <div className="py-12 text-center text-xs text-slate-400 font-medium">Memuat data thresholds...</div>
      ) : thresholdsList.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
          Tidak ada data konfigurasi sensor yang tersimpan di backend.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-xl overflow-hidden bg-slate-50/20">
            {thresholdsList.map((th, index) => {
              const sensorMapItem = SENSOR_MAP.find(s => s.code === th.sensor_code);
              const label = sensorMapItem?.label || th.sensor_code.toUpperCase();
              const Icon = sensorMapItem?.icon || Droplet;

              return (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/55 transition-colors">
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg">
                      <Icon className="h-4 w-4 text-[#22C55E]" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-800">{label}</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {th.sensor_code}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Batas Minimal</span>
                      <input
                        type="number"
                        step="0.01"
                        value={th.value_min}
                        onChange={(e) => {
                          const copy = [...thresholdsList];
                          copy[index].value_min = e.target.value;
                          setThresholdsList(copy);
                        }}
                        className="w-24 bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono font-bold text-center focus:outline-none focus:border-[#22C55E]"
                      />
                    </div>

                    <div className="text-slate-350 font-bold self-end mb-2">—</div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Batas Maksimal</span>
                      <input
                        type="number"
                        step="0.01"
                        value={th.value_max}
                        onChange={(e) => {
                          const copy = [...thresholdsList];
                          copy[index].value_max = e.target.value;
                          setThresholdsList(copy);
                        }}
                        className="w-24 bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono font-bold text-center focus:outline-none focus:border-[#22C55E]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={loadingThresholds}
            className="w-full py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-extrabold rounded-lg tracking-wider uppercase transition cursor-pointer disabled:opacity-50"
          >
            {loadingThresholds ? 'Menyimpan...' : 'Perbarui Batas Sensor Massal'}
          </button>
        </form>
      )}
    </div>
  );
};
