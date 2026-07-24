import React, { useState } from 'react';
import { RotateCcw, Trash2, Calendar, User, Clock, Plus, Filter, Tag, Zap, Droplets, Layers } from 'lucide-react';
import { HardwareControlPanel } from './HardwareControlPanel';

export const FeedingLogTab = ({
  token,
  selectedSerial = 'DEMO-NODE-001',
  cagesList = [],
  operatorsList = [],
  feedingLogs = [],
  loadingFeeding,
  onAddFeedingLog,
  onDeleteFeedingLog,
  onRefresh,
  activityLogs = []
}) => {
  const [newFeed, setNewFeed] = useState({
    cage_id: '',
    operator_id: '',
    feed_session: 'morning',
    feed_type: '',
    weight_kg: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newFeed.cage_id || !newFeed.operator_id || !newFeed.weight_kg || !newFeed.feed_type) {
      alert('Seluruh kolom bertanda bintang (*) wajib diisi.');
      return;
    }
    onAddFeedingLog({
      cage_id: parseInt(newFeed.cage_id),
      operator_id: parseInt(newFeed.operator_id),
      feed_session: newFeed.feed_session,
      feed_type: newFeed.feed_type,
      weight_kg: parseFloat(newFeed.weight_kg)
    });
    setNewFeed({
      cage_id: '',
      operator_id: '',
      feed_session: 'morning',
      feed_type: '',
      weight_kg: ''
    });
  };

  const getTriggerBadge = (notes = '') => {
    let label = 'Jadwal Harian';
    let style = 'bg-blue-50 text-blue-700 border-blue-200';

    if (notes.includes('MANUAL_WEB') || notes.includes('Web')) {
      label = 'Manual Web';
      style = 'bg-emerald-50 text-[#0D9D1B] border-emerald-200';
    } else if (notes.includes('MANUAL_MOBILE') || notes.includes('Mobile')) {
      label = 'Manual Mobile';
      style = 'bg-emerald-50 text-[#0D9D1B] border-emerald-200';
    } else if (notes.includes('AUTOMATIC_SENSOR') || notes.includes('DO') || notes.includes('Sensor')) {
      label = 'AUTO (DO)';
      style = 'bg-emerald-50 text-[#0D9D1B] border-emerald-200';
    }

    return (
      <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-md border tracking-wider uppercase ${style}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out] font-sans">
      {/* ── HEADER ── */}
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-[#0D9D1B]" />
            <span>Log Pemberian Pakan Lobster</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan pemberian pakan harian, jenis pakan, dan bobot pakan (kg) pada keramba jaring apung (KJA)
          </p>
        </div>
      </div>

      {/* ── MAIN SECTION: FORM & FEEDING LOG TABLE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Form Input */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0D9D1B] border border-emerald-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Catat Pemberian Pakan</h2>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Rekam data log pemberian pakan lobster baru</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pilih Keramba (KJA) *</label>
              <select
                required
                value={newFeed.cage_id}
                onChange={(e) => setNewFeed({ ...newFeed, cage_id: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
              >
                <option value="">-- Pilih Keramba --</option>
                {cagesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cage_code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Petugas Pelaksana *</label>
              <select
                required
                value={newFeed.operator_id}
                onChange={(e) => setNewFeed({ ...newFeed, operator_id: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
              >
                <option value="">-- Pilih Petugas --</option>
                {operatorsList.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sesi Pakan *</label>
              <select
                required
                value={newFeed.feed_session}
                onChange={(e) => setNewFeed({ ...newFeed, feed_session: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
              >
                <option value="morning">Pagi (Morning)</option>
                <option value="afternoon">Siang (Afternoon)</option>
                <option value="night">Malam (Evening)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Jenis Pakan *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Ikan Rucah, Pellet, Udang rebon"
                value={newFeed.feed_type}
                onChange={(e) => setNewFeed({ ...newFeed, feed_type: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Berat Pakan (KG) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Contoh: 2.50"
                value={newFeed.weight_kg}
                onChange={(e) => setNewFeed({ ...newFeed, weight_kg: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer shadow-xs shadow-green-500/10"
            >
              Simpan Log Pakan
            </button>
          </form>
        </div>

        {/* List Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 pb-3.5 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Riwayat Pemberian Pakan & Audit Trail</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Daftar catatan pakan & log aktivitas alat otomatis</p>
            </div>

            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              title="Refresh Data"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {loadingFeeding ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">Memuat data log pakan...</div>
          ) : feedingLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Belum ada riwayat log pakan tersimpan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5">Waktu</th>
                    <th className="px-4 py-2.5">Keramba</th>
                    <th className="px-4 py-2.5">Pelaksana</th>
                    <th className="px-4 py-2.5">Pemicu</th>
                    <th className="px-4 py-2.5">Jumlah</th>
                    <th className="px-4 py-2.5">Jenis</th>
                    <th className="px-4 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {feedingLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-slate-550 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{log.cage?.cage_code || 'DEMO-NODE-001'}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{log.operator?.full_name || log.user?.name || 'Sistem Otomatis'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getTriggerBadge(log.notes || '')}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[#0D9D1B]">{log.weight_kg || log.amount_kg || 0} kg</td>
                      <td className="px-4 py-3 font-semibold">{log.feed_type || log.food_type || 'Pellet'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onDeleteFeedingLog(log.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
