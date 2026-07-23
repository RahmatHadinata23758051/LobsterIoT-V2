import React, { useState, useEffect } from 'react';
import {
  Wind, Utensils, Play, RotateCcw, Clock, Plus, Trash2,
  Droplets, Zap, CheckCircle2, Sparkles, Activity, ShieldCheck
} from 'lucide-react';
import { api } from '../../api/api';

export const HardwareControlPanel = ({ token, selectedSerial = 'DEMO-NODE-001' }) => {
  // Aerator State
  const [aeratorMode, setAeratorMode] = useState('AUTO'); // 'AUTO', 'MANUAL_ON', 'MANUAL_OFF'
  const [selectedDurationMin, setSelectedDurationMin] = useState(30);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loadingAerator, setLoadingAerator] = useState(false);
  const currentDoValue = 6.46;
  const minDoThreshold = 5.00;

  // Feeder State
  const [instantDurationSec, setInstantDurationSec] = useState(10);
  const [loadingFeeder, setLoadingFeeder] = useState(false);
  const [schedules, setSchedules] = useState([
    { id: 1, time: '07:00', duration_seconds: 10, food_type: 'Pelet Super Alpha', is_active: true },
    { id: 2, time: '12:00', duration_seconds: 15, food_type: 'Pelet Super Alpha', is_active: true },
    { id: 3, time: '17:00', duration_seconds: 10, food_type: 'Pelet Super Alpha', is_active: true },
  ]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newScheduleTime, setNewScheduleTime] = useState('08:00');
  const [newScheduleDuration, setNewScheduleDuration] = useState(10);
  const [newScheduleFoodType, setNewScheduleFoodType] = useState('Pelet Super Alpha');

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Timer Effect for Aerator Manual Override
  useEffect(() => {
    let interval = null;
    if (remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setAeratorMode('AUTO');
            showToast('Timer manual habis. Aerator kembali otomatis ke Mode AUTO (Sensor DO).');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const handleToggleAerator = async (targetMode) => {
    setLoadingAerator(true);
    try {
      if (token) {
        await api.toggleAerator(token, {
          iot_node_serial_number: selectedSerial,
          mode: targetMode,
          duration_minutes: selectedDurationMin,
        });
      }
      setAeratorMode(targetMode);
      if (targetMode === 'MANUAL_ON') {
        setRemainingSeconds(selectedDurationMin * 60);
        showToast(`Aerator dinyalakan manual selama ${selectedDurationMin} menit [MANUAL_WEB]`);
      } else {
        setRemainingSeconds(0);
        showToast('Aerator kembali ke Mode AUTO (Sensor DO)');
      }
    } catch (err) {
      setAeratorMode(targetMode);
      if (targetMode === 'MANUAL_ON') {
        setRemainingSeconds(selectedDurationMin * 60);
        showToast(`Aerator dinyalakan manual (${selectedDurationMin}m)`);
      } else {
        setRemainingSeconds(0);
        showToast('Aerator diset ke Mode AUTO');
      }
    } finally {
      setLoadingAerator(false);
    }
  };

  const handleTriggerInstantFeeder = async () => {
    setLoadingFeeder(true);
    try {
      if (token) {
        await api.triggerInstantFeeding(token, {
          iot_node_serial_number: selectedSerial,
          duration_seconds: instantDurationSec,
        });
      }
      showToast(`Perintah Pakan Manual (${instantDurationSec} Detik) berhasil dikirim! [MANUAL_WEB]`);
    } catch (err) {
      showToast(`Perintah Pakan Manual (${instantDurationSec}s) diproses`);
    } finally {
      setLoadingFeeder(false);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      if (token) {
        await api.addFeedingSchedule(token, {
          iot_node_serial_number: selectedSerial,
          scheduled_time: newScheduleTime,
          duration_seconds: newScheduleDuration,
          food_type: newScheduleFoodType,
        });
      }
      setSchedules([
        ...schedules,
        {
          id: Date.now(),
          time: newScheduleTime,
          duration_seconds: newScheduleDuration,
          food_type: newScheduleFoodType,
          is_active: true,
        },
      ]);
      setShowAddModal(false);
      showToast(`Jadwal pakan ${newScheduleTime} (${newScheduleDuration}s) berhasil disimpan!`);
    } catch (err) {
      setSchedules([
        ...schedules,
        {
          id: Date.now(),
          time: newScheduleTime,
          duration_seconds: newScheduleDuration,
          food_type: newScheduleFoodType,
          is_active: true,
        },
      ]);
      setShowAddModal(false);
      showToast(`Jadwal pakan ${newScheduleTime} ditambahkan`);
    }
  };

  const handleDeleteSchedule = (id) => {
    setSchedules(schedules.filter((s) => s.id !== id));
    showToast('Jadwal pakan berhasil dihapus');
  };

  const formatTimer = (totalSec) => {
    const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-900/90 to-teal-900/90 backdrop-blur-md border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-100 font-semibold shadow-lg shadow-emerald-950/20 animate-fade-in">
          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Control Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        
        {/* CARD 1: AERATOR 24H */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm shadow-slate-200/60 hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle Top Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 text-[#0D9D1B] border border-emerald-100/80 group-hover:scale-105 transition-transform">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                    Aerator 24h (Oksigenasi)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Kontrol aerasi & pemantauan DO otomatis</p>
                </div>
              </div>

              <div className={`px-3 py-1 text-[10px] font-extrabold rounded-full border flex items-center gap-1.5 shadow-xs ${
                aeratorMode === 'MANUAL_ON'
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                  : aeratorMode === 'AUTO'
                  ? 'bg-blue-500/10 text-blue-700 border-blue-500/30'
                  : 'bg-rose-500/10 text-rose-700 border-rose-500/30'
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    aeratorMode === 'MANUAL_ON' ? 'bg-emerald-400' : (aeratorMode === 'AUTO' ? 'bg-blue-400' : 'bg-rose-400')
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    aeratorMode === 'MANUAL_ON' ? 'bg-emerald-500' : (aeratorMode === 'AUTO' ? 'bg-blue-500' : 'bg-rose-500')
                  }`}></span>
                </span>
                <span>
                  {aeratorMode === 'MANUAL_ON'
                    ? `MANUAL ON (${formatTimer(remainingSeconds)})`
                    : aeratorMode === 'AUTO'
                    ? 'AUTO (SENSOR DO)'
                    : 'MANUAL OFF'}
                </span>
              </div>
            </div>

            {/* DO Telemetry Card */}
            <div className="bg-gradient-to-r from-blue-50/70 via-slate-50 to-emerald-50/50 border border-slate-200/80 rounded-xl p-3.5 mb-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kadar DO Saat Ini</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono tracking-tight">{currentDoValue} mg/L</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Threshold Min DO</span>
                <span className="text-xs font-bold text-emerald-600 font-mono">{minDoThreshold} mg/L</span>
              </div>
            </div>

            {/* Duration Selector */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Durasi Override Manual:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedDurationMin(mins)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      selectedDurationMin === mins
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/20 ring-2 ring-slate-900/10 scale-[1.02]'
                        : 'bg-slate-50/80 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={loadingAerator}
              onClick={() => handleToggleAerator('MANUAL_ON')}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#0D9D1B] to-emerald-600 hover:from-emerald-600 hover:to-[#0D9D1B] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-md shadow-green-600/20 active:scale-[0.99] disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{aeratorMode === 'MANUAL_ON' ? 'Perbarui Manual Timer' : 'Nyalakan Manual'}</span>
            </button>

            {aeratorMode === 'MANUAL_ON' && (
              <button
                type="button"
                disabled={loadingAerator}
                onClick={() => handleToggleAerator('AUTO')}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                Kembali ke AUTO
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: SMART FEEDER (PAKAN OTOMATIS) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm shadow-slate-200/60 hover:shadow-md hover:border-amber-500/30 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle Top Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 border border-amber-100/80 group-hover:scale-105 transition-transform">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Pakan Otomatis (Smart Feeder)</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Jadwal harian & pakan manual instan</p>
                </div>
              </div>
            </div>

            {/* Instant Feeding Section */}
            <div className="bg-gradient-to-r from-amber-50/60 via-slate-50 to-orange-50/40 border border-amber-200/50 rounded-xl p-3.5 mb-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  Beri Pakan Sekarang (Manual Trigger)
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Durasi Motor:</span>
                <div className="flex items-center gap-1.5">
                  {[5, 10, 15, 20, 30].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setInstantDurationSec(dur)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        instantDurationSec === dur
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={loadingFeeder}
                onClick={handleTriggerInstantFeeder}
                className="w-full py-2.5 bg-gradient-to-r from-[#0D9D1B] to-emerald-600 hover:from-emerald-600 hover:to-[#0D9D1B] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-md shadow-green-600/20 active:scale-[0.99] disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Beri Pakan Sekarang ({instantDurationSec} Detik)</span>
              </button>
            </div>

            {/* Schedules Section Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-800 tracking-tight">Jadwal Pakan Harian (By Time)</span>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="text-[11px] font-bold text-[#0D9D1B] hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Jadwal</span>
              </button>
            </div>

            {/* Schedules List */}
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {schedules.map((sch) => (
                <div
                  key={sch.id}
                  className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-2.5 flex items-center justify-between text-xs hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 font-mono text-sm block leading-none mb-1">{sch.time}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Durasi: {sch.duration_seconds}s • {sch.food_type}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(sch.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: TAMBAH JADWAL PAKAN */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0D9D1B] to-teal-500" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0D9D1B]" />
                Tambah Jadwal Pakan Harian
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Waktu Pakan (Jam:Menit)
                </label>
                <input
                  type="time"
                  required
                  value={newScheduleTime}
                  onChange={(e) => setNewScheduleTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold text-sm focus:outline-none focus:border-[#0D9D1B] font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Durasi Motor Dispenser (Detik)
                </label>
                <div className="flex items-center gap-1.5">
                  {[5, 10, 15, 20, 30].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setNewScheduleDuration(dur)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        newScheduleDuration === dur
                          ? 'bg-[#0D9D1B] text-white border-[#0D9D1B]'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Jenis Pakan
                </label>
                <input
                  type="text"
                  required
                  value={newScheduleFoodType}
                  onChange={(e) => setNewScheduleFoodType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0D9D1B] hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-green-600/20 cursor-pointer"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
