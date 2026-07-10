import React from 'react';
import { RotateCcw, Droplet, Thermometer, Wind, Eye, Layers, Activity } from 'lucide-react';

const ICON_MAP = {
  ph: Droplet,
  tds: Layers,
  dissolved_oxygen: Wind,
  water_temperature: Thermometer,
  flow_rate: Activity,
  turbidity: Eye,
};

const LABEL_MAP = {
  ph: 'Kadar Keasaman (pH)',
  tds: 'Total Dissolved Solids (TDS)',
  dissolved_oxygen: 'Dissolved Oxygen (DO)',
  water_temperature: 'Suhu Air',
  flow_rate: 'Kecepatan Arus',
  turbidity: 'Kekeruhan (Turbidity)',
};

export const SensorTypeManagement = ({
  sensorTypesList = [],
  loadingSensorTypes,
  onRefresh,
  
  // Integrated Threshold Config props
  thresholdsList = [],
  loadingThresholds,
  onUpdateThresholds,
  setThresholdsList
}) => {

  const handleThresholdSubmit = (e) => {
    e.preventDefault();
    onUpdateThresholds(thresholdsList);
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      
      {/* 1. Sensor Types Information List */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm w-full">
        <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Tipe Sensor Aktif</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Informasi spesifikasi parameter sensor yang terdaftar dalam sistem</p>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {loadingSensorTypes ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">Memuat tipe sensor...</div>
        ) : sensorTypesList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-450 border border-dashed border-slate-200 rounded-xl space-y-2">
            <Droplet className="h-8 w-8 text-emerald-300 mx-auto animate-bounce" />
            <p>Data tipe sensor berasal dari konfigurasi backend sistem.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sensorTypesList.map((st) => {
              const Icon = ICON_MAP[st.sensor_code] || Droplet;
              return (
                <div key={st.id} className="flex gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors bg-slate-50/10">
                  <div className="p-2.5 bg-[#0D9D1B]/10 text-[#0D9D1B] rounded-xl shrink-0 h-fit">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs leading-normal">
                    <h4 className="font-semibold text-slate-900 text-[13px]">{st.name || st.sensor_code.toUpperCase()}</h4>
                    <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">KODE: {st.sensor_code} · SATUAN: {st.unit || '—'}</p>
                    <p className="text-slate-500 mt-1.5 leading-relaxed">{st.description || 'Tidak ada deskripsi sensor.'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Integrated Threshold Configuration Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm w-full">
        <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Pengaturan Ambang Batas Sensor</h2>
            <p className="text-[10px] text-slate-455 mt-0.5">Sesuaikan ambang batas nilai ideal pemicu peringatan sensor kualitas air</p>
          </div>
        </div>

        {loadingThresholds ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">Memuat data thresholds...</div>
        ) : thresholdsList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Tidak ada konfigurasi sensor yang tersimpan di backend.
          </div>
        ) : (
          <form onSubmit={handleThresholdSubmit} className="space-y-5 text-xs">
            <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-xl overflow-hidden bg-slate-50/20">
              {thresholdsList.map((th, index) => {
                const Icon = ICON_MAP[th.sensor_code] || Droplet;
                const label = LABEL_MAP[th.sensor_code] || th.sensor_code.toUpperCase();

                return (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/55 transition-colors">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{label}</p>
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
                          className="w-24 bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono font-bold text-center focus:outline-none focus:border-[#0D9D1B]"
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
                          className="w-24 bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono font-bold text-center focus:outline-none focus:border-[#0D9D1B]"
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
              className="w-full py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer disabled:opacity-50 shadow-sm shadow-green-500/10"
            >
              {loadingThresholds ? 'Menyimpan...' : 'Perbarui Ambang Batas Sensor'}
            </button>
          </form>
        )}
      </div>

    </div>
  );
};
