import React, { useState, useEffect } from 'react';
import {
  Wind, Utensils, Play, Pause, RotateCcw, Clock, Plus, Trash2,
  Droplets, Zap, ShieldAlert, CheckCircle2, AlertTriangle
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

  // Feedback Message
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Timer Effect for Aerator Override
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
      showToast(`Jadwal pakan ${newScheduleTime} (${newScheduleDuration}s) berhasil ditambahkan!`);
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
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-[#0D9D1B]/10 border border-[#0D9D1B]/30 rounded-xl flex items-center gap-3 text-xs text-[#0D9D1B] font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#0D9D1B] shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Control Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* CARD 1: AERATOR 24H */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-[#0D9D1B]">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Aerator 24h (Oksigenasi)</h3>
                  <p className="text-[10px] text-slate-400">Kontrol aerasi & pemantauan DO otomatis</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${
                aeratorMode === 'MANUAL_ON'
                  ? 'bg-emerald-50 text-[#0D9D1B] border-emerald-200'
                  : aeratorMode === 'AUTO'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}>
                {aeratorMode === 'MANUAL_ON'
                  ? `MANUAL ON (${formatTimer(remainingSeconds)})`
                  : aeratorMode === 'AUTO'
                  ? 'AUTO (SENSOR DO)'
                  : 'MANUAL OFF'}
              </span>
            </div>

            {/* DO Level Indicator */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Droplets className="w-4 h-4 text-blue-500" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Kadar DO Saat Ini</span>
                  <span className="text-sm font-bold text-slate-800">{currentDoValue} mg/L</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Threshold Min DO</span>
                <span className="text-xs font-bold text-[#0D9D1B]">{minDoThreshold} mg/L</span>
              </div>
            </div>

            {/* Duration Selector */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Durasi Override Manual:
              </label>
              <div className="flex items-center gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedDurationMin(mins)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      selectedDurationMin === mins
                        ? 'bg-[#0D9D1B] text-white border-[#0D9D1B] shadow-sm shadow-green-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {mins} Menit
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={loadingAerator}
              onClick={() => handleToggleAerator('MANUAL_ON')}
              className="flex-1 py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-green-500/10 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{aeratorMode === 'MANUAL_ON' ? 'Perbarui Manual Timer' : 'Nyalakan Manual'}</span>
            </button>

            {aeratorMode === 'MANUAL_ON' && (
              <button
                type="button"
                disabled={loadingAerator}
                onClick={() => handleToggleAerator('AUTO')}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer border border-slate-200"
              >
                Kembali ke AUTO
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: SMART FEEDER (PAKAN OTOMATIS) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Pakan Otomatis (Smart Feeder)</h3>
                  <p className="text-[10px] text-slate-400">Jadwal harian & pakan manual instan</p>
                </div>
              </div>
            </div>

            {/* Instant Feeding Banner */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 mb-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  Beri Pakan Sekarang (Manual Trigger)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-medium">Durasi:</span>
                <div className="flex items-center gap-1.5">
                  {[5, 10, 15, 20, 30].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setInstantDurationSec(dur)}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded border transition cursor-pointer ${
                        instantDurationSec === dur
                          ? 'bg-[#0D9D1B] text-white border-[#0D9D1B]'
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
                className="w-full py-2 bg-[#0D9D1B] hover:bg-[#0A8516] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-green-500/10 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Beri Pakan Sekarang ({instantDurationSec} Detik)</span>
              </button>
            </div>

            {/* Schedules Section Header */}
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800">Jadwal Pakan Harian (By Time)</span>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="text-[11px] font-bold text-[#0D9D1B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Jadwal</span>
              </button>
            </div>

            {/* Schedules List */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {schedules.map((sch) => (
                <div
                  key={sch.id}
                  className="bg-slate-50 border border-slate-200/60 rounded-lg p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#0D9D1B]" />
                    <div>
                      <span className="font-extrabold text-slate-800 block text-sm">{sch.time}</span>
                      <span className="text-[10px] text-slate-400">
                        Durasi: {sch.duration_seconds}s • {sch.food_type}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(sch.id)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0D9D1B]" />
                Tambah Jadwal Pakan Harian
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Waktu Pakan (Jam:Menit)
                </label>
                <input
                  type="time"
                  required
                  value={newScheduleTime}
                  onChange={(e) => setNewScheduleTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold text-sm focus:outline-none focus:border-[#0D9D1B]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Durasi Dispenser (Detik)
                </label>
                <div className="flex items-center gap-2">
                  {[5, 10, 15, 20, 30].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setNewScheduleDuration(dur)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
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
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Jenis Pakan
                </label>
                <input
                  type="text"
                  required
                  value={newScheduleFoodType}
                  onChange={(e) => setNewScheduleFoodType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-bold rounded-lg shadow-sm shadow-green-500/10"
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
