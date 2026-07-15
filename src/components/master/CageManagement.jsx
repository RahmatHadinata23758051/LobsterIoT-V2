import React, { useState } from 'react';
import { RotateCcw, Trash2, Anchor, MapPin, Edit } from 'lucide-react';

export const CageManagement = ({
  cagesList = [],
  loadingCages,
  onAddCage,
  onUpdateCage,
  onDeleteCage,
  onRefresh
}) => {
  const [newCage, setNewCage] = useState({
    cage_code: '',
    latitude: '',
    longitude: '',
    volume_cubic_meters: '',
    structure_condition: 'Baik',
    lobster_count: '',
    lobster_age_days: ''
  });
  const [editingCageId, setEditingCageId] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung deteksi lokasi GPS.');
      return;
    }
    setDetectingGps(true);

    const successCallback = (position) => {
      setNewCage(prev => ({
        ...prev,
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6)
      }));
      setDetectingGps(false);
    };

    const options = { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 };

    const errorCallback = (error) => {
      // If high accuracy failed (e.g. timeout on PC/laptop), retry with standard accuracy (faster/uses network IP)
      if (options.enableHighAccuracy) {
        options.enableHighAccuracy = false;
        options.timeout = 10000;
        navigator.geolocation.getCurrentPosition(successCallback, (err) => {
          alert('Gagal mengambil lokasi GPS: ' + err.message);
          setDetectingGps(false);
        }, options);
      } else {
        alert('Gagal mengambil lokasi GPS: ' + error.message);
        setDetectingGps(false);
      }
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCage.cage_code || !newCage.latitude || !newCage.longitude || !newCage.volume_cubic_meters) {
      alert('Seluruh kolom bertanda bintang (*) wajib diisi.');
      return;
    }

    const payload = {
      cage_code: newCage.cage_code,
      latitude: parseFloat(newCage.latitude),
      longitude: parseFloat(newCage.longitude),
      volume_cubic_meters: parseFloat(newCage.volume_cubic_meters),
      structure_condition: newCage.structure_condition || 'Baik',
      lobster_count: newCage.lobster_count ? parseInt(newCage.lobster_count) : 0,
      lobster_age_days: newCage.lobster_age_days ? parseInt(newCage.lobster_age_days) : null
    };

    if (editingCageId) {
      onUpdateCage(editingCageId, payload);
      setEditingCageId(null);
    } else {
      onAddCage(payload);
    }

    setNewCage({
      cage_code: '',
      latitude: '',
      longitude: '',
      volume_cubic_meters: '',
      structure_condition: 'Baik',
      lobster_count: '',
      lobster_age_days: ''
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Add Form */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Anchor className="h-4 w-4 text-[#0D9D1B]" />
            {editingCageId ? 'Edit Detail KJA' : 'Tambah KJA Baru'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
            {editingCageId ? 'Perbarui spesifikasi keramba existing' : 'Daftarkan keramba jaring apung lobster baru'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kode KJA *</label>
            <input
              type="text"
              required
              placeholder="Contoh: CAGE-B02"
              value={newCage.cage_code}
              onChange={(e) => setNewCage({ ...newCage, cage_code: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Koordinat Lokasi *</label>
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={detectingGps}
                className="text-[10px] text-[#0D9D1B] hover:text-[#0A8516] font-bold flex items-center gap-1 cursor-pointer transition select-none disabled:opacity-50"
              >
                <MapPin className={`h-3 w-3 ${detectingGps ? 'animate-bounce' : ''}`} />
                {detectingGps ? 'Mendeteksi...' : 'Deteksi GPS'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  step="0.000001"
                  required
                  placeholder="Latitude"
                  value={newCage.latitude}
                  onChange={(e) => setNewCage({ ...newCage, latitude: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.000001"
                  required
                  placeholder="Longitude"
                  value={newCage.longitude}
                  onChange={(e) => setNewCage({ ...newCage, longitude: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Volume (M³) *</label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="8.5"
                value={newCage.volume_cubic_meters}
                onChange={(e) => setNewCage({ ...newCage, volume_cubic_meters: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kondisi Struktur *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Baik / Servis"
                value={newCage.structure_condition}
                onChange={(e) => setNewCage({ ...newCage, structure_condition: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Jumlah Lobster</label>
              <input
                type="number"
                placeholder="200"
                value={newCage.lobster_count}
                onChange={(e) => setNewCage({ ...newCage, lobster_count: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Umur Lobster (Hari)</label>
              <input
                type="number"
                placeholder="45"
                value={newCage.lobster_age_days}
                onChange={(e) => setNewCage({ ...newCage, lobster_age_days: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {editingCageId && (
              <button
                type="button"
                onClick={() => {
                  setEditingCageId(null);
                  setNewCage({
                    cage_code: '',
                    latitude: '',
                    longitude: '',
                    volume_cubic_meters: '',
                    structure_condition: 'Baik',
                    lobster_count: '',
                    lobster_age_days: ''
                  });
                }}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer text-center"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className={`${editingCageId ? 'w-2/3' : 'w-full'} py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer shadow-sm shadow-green-500/10`}
            >
              {editingCageId ? 'Perbarui' : 'Simpan'} KJA
            </button>
          </div>
        </form>
      </div>

      {/* List Table */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Daftar Keramba Jaring Apung</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Total data terdaftar pada basis data backend</p>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {loadingCages ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">Memuat data KJA...</div>
        ) : cagesList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Belum ada KJA terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Kode KJA</th>
                  <th className="px-4 py-2.5">Volume</th>
                  <th className="px-4 py-2.5">Kondisi</th>
                  <th className="px-4 py-2.5">Lobster</th>
                  <th className="px-4 py-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {cagesList.map((cage) => (
                  <tr key={cage.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-slate-400">{cage.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">{cage.cage_code}</td>
                    <td className="px-4 py-3 font-mono">{cage.volume_cubic_meters} M³</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-750 font-bold border border-slate-200/50">
                        {cage.structure_condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-950">
                      {cage.lobster_count} ekor {cage.lobster_age_days ? `(${cage.lobster_age_days} hari)` : ''}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCageId(cage.id);
                            setNewCage({
                              cage_code: cage.cage_code,
                              latitude: cage.latitude,
                              longitude: cage.longitude,
                              volume_cubic_meters: cage.volume_cubic_meters,
                              structure_condition: cage.structure_condition || 'Baik',
                              lobster_count: cage.lobster_count ?? '',
                              lobster_age_days: cage.lobster_age_days ?? ''
                            });
                          }}
                          title="Edit KJA"
                          className="p-1 rounded text-[#0D9D1B] hover:bg-green-50 transition cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteCage(cage.id)}
                          title="Hapus KJA"
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
