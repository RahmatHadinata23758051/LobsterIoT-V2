import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle, WifiOff } from 'lucide-react';

export const DeviceTab = ({
  citiesList = [],
  maintenancesList = [],
  loadingMaintenances,
  loadingValidation,
  loadingActivation,
  loadingMaintenance,
  validationResult,
  onValidateSerial,
  onActivateNode,
  onSubmitMaintenance,
  onRefreshMaintenances
}) => {
  const [valSerial, setValSerial] = useState('');
  const [activation, setActivation] = useState({
    serial_number: '',
    city_id: '',
    latitude: '',
    longitude: ''
  });
  const [maintenance, setMaintenance] = useState({
    iot_node_serial_number: '',
    maintenance_type: 'rutin',
    description: '',
    performed_by: ''
  });

  const handleValidationSubmit = (e) => {
    e.preventDefault();
    if (valSerial) onValidateSerial(valSerial);
  };

  const handleActivationSubmit = (e) => {
    e.preventDefault();
    if (!activation.serial_number || !activation.city_id) {
      alert('Serial Number & Kota wajib diisi.');
      return;
    }
    onActivateNode(activation);
    setActivation({ serial_number: '', city_id: '', latitude: '', longitude: '' });
  };

  const handleMaintenanceSubmit = (e) => {
    e.preventDefault();
    if (!maintenance.iot_node_serial_number || !maintenance.description) {
      alert('Nomor seri & keterangan perawatan wajib diisi.');
      return;
    }
    onSubmitMaintenance(maintenance);
    setMaintenance({ iot_node_serial_number: '', maintenance_type: 'rutin', description: '', performed_by: '' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Column 1: Validation & Activation */}
      <div className="space-y-6">
        
        {/* Device Validation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Validasi Perangkat</h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Periksa keaslian nomor seri IoT Node di database pabrikan</p>
          </div>

          <form onSubmit={handleValidationSubmit} className="space-y-3 text-xs">
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Masukkan Nomor Seri (e.g. DEMO-NODE-001)"
                value={valSerial}
                onChange={(e) => setValSerial(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#22C55E] font-mono"
              />
              <button
                type="submit"
                disabled={loadingValidation}
                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold px-4 rounded-lg uppercase tracking-wider text-[10px] transition cursor-pointer disabled:opacity-50 select-none"
              >
                {loadingValidation ? 'Pengecekan...' : 'Cek'}
              </button>
            </div>

            {validationResult && (
              <div className={`p-3.5 rounded-xl border text-[11px] font-medium leading-normal ${
                validationResult.status === 'success' ? 'bg-green-50 border-green-100 text-green-900' : 'bg-red-50 border-red-100 text-red-950'
              }`}>
                <p className="font-extrabold uppercase tracking-wide text-xs">Hasil Pemeriksaan:</p>
                <p className="mt-1 leading-normal">{validationResult.message}</p>
              </div>
            )}
          </form>
        </div>

        {/* Device Activation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Aktivasi IoT Node Baru</h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Daftarkan dan aktifkan unit Node telemetry di lokasi tambak</p>
          </div>

          <form onSubmit={handleActivationSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nomor Seri *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: NODE-001"
                  value={activation.serial_number}
                  onChange={(e) => setActivation({ ...activation, serial_number: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pilih Kota Penempatan *</label>
                <select
                  required
                  value={activation.city_id}
                  onChange={(e) => setActivation({ ...activation, city_id: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="">-- Pilih Kota --</option>
                  {citiesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Garis Lintang (Latitude)</label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="Contoh: -8.6529"
                  value={activation.latitude}
                  onChange={(e) => setActivation({ ...activation, latitude: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#22C55E] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Garis Bujur (Longitude)</label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="Contoh: 116.3195"
                  value={activation.longitude}
                  onChange={(e) => setActivation({ ...activation, longitude: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#22C55E] font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingActivation}
              className="w-full py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-extrabold rounded-lg tracking-wider uppercase transition cursor-pointer disabled:opacity-50 shadow-sm shadow-green-500/10"
            >
              {loadingActivation ? 'Mengaktivasi...' : 'Aktifkan Perangkat'}
            </button>
          </form>
        </div>

      </div>

      {/* Column 2: Maintenance Logger & History */}
      <div className="space-y-6">
        
        {/* Maintenance Logger Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Laporan Pemeliharaan Perangkat</h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Catat tindakan servis atau perbaikan sensor kolam</p>
          </div>

          <form onSubmit={handleMaintenanceSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nomor Seri IoT Node *</label>
              <input
                type="text"
                required
                placeholder="Contoh: NODE-001"
                value={maintenance.iot_node_serial_number}
                onChange={(e) => setMaintenance({ ...maintenance, iot_node_serial_number: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-[#22C55E]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipe Pemeliharaan *</label>
              <select
                value={maintenance.maintenance_type}
                onChange={(e) => setMaintenance({ ...maintenance, maintenance_type: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#22C55E]"
              >
                <option value="rutin">Pembersihan Rutin</option>
                <option value="perbaikan">Perbaikan Kerusakan</option>
                <option value="kalibrasi">Kalibrasi Ulang Sensor</option>
                <option value="ganti_komponen">Penggantian Komponen</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Keterangan Tindakan *</label>
              <textarea
                required
                placeholder="Tulis tindakan pemeliharaan yang dilakukan secara detail..."
                value={maintenance.description}
                onChange={(e) => setMaintenance({ ...maintenance, description: e.target.value })}
                rows="3"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#22C55E] resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Teknisi Pelaksana</label>
              <input
                type="text"
                placeholder="Contoh: Ahmad Fauzi"
                value={maintenance.performed_by}
                onChange={(e) => setMaintenance({ ...maintenance, performed_by: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#22C55E]"
              />
            </div>

            <button
              type="submit"
              disabled={loadingMaintenance}
              className="w-full py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-extrabold rounded-lg tracking-wider uppercase transition cursor-pointer disabled:opacity-50 shadow-sm shadow-green-500/10"
            >
              {loadingMaintenance ? 'Mengirim...' : 'Kirim Laporan Pemeliharaan'}
            </button>
          </form>
        </div>

        {/* Maintenance History List */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Riwayat Tindakan Servis</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Daftar pemeliharaan perangkat IoT tambak</p>
            </div>
            <button
              onClick={onRefreshMaintenances}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {loadingMaintenances ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">Memuat data log servis...</div>
          ) : maintenancesList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Belum ada riwayat pemeliharaan terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5">Tanggal</th>
                    <th className="px-4 py-2.5">Node</th>
                    <th className="px-4 py-2.5">Tipe</th>
                    <th className="px-4 py-2.5">Teknisi</th>
                    <th className="px-4 py-2.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {maintenancesList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(m.created_at || m.timestamp).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">{m.iot_node_serial_number}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${
                          m.maintenance_type === 'perbaikan' ? 'bg-red-50 text-red-700 border-red-100' :
                          m.maintenance_type === 'kalibrasi' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          m.maintenance_type === 'ganti_komponen' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          'bg-green-50 text-[#22C55E] border-green-100'
                        }`}>
                          {m.maintenance_type === 'ganti_komponen' ? 'GANTI PART' : m.maintenance_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{m.performed_by || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-[160px]" title={m.description}>{m.description}</td>
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
