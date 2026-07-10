import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle, WifiOff, MapPin, Upload, FileSignature } from 'lucide-react';

export const DeviceTab = ({
  nodes = [],
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
  const [valCategory, setValCategory] = useState('iot_node');
  const [valSerial, setValSerial] = useState('');

  const [activation, setActivation] = useState({
    category: 'iot_node',
    id: '',
    serial_number: '',
    city_id: '',
    latitude: '',
    longitude: ''
  });
  const [actPicture, setActPicture] = useState(null);
  const [actSignature, setActSignature] = useState(null);

  const [maintenance, setMaintenance] = useState({
    iot_node_id: '',
    maintenance_type: 'rutin',
    description: '',
    latitude: '',
    longitude: ''
  });
  const [maintPicture, setMaintPicture] = useState(null);
  const [maintSignature, setMaintSignature] = useState(null);

  // Pre-populate Activation data when Validation succeeds
  useEffect(() => {
    if (validationResult && validationResult.status === 'success' && validationResult.data) {
      const d = validationResult.data;
      if (!d.is_activated) {
        setActivation(prev => ({
          ...prev,
          serial_number: d.serial_number,
          category: d.category,
          id: d.id
        }));
      }
    }
  }, [validationResult]);

  // Geolocation helpers
  const getActivationLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setActivation(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
        },
        () => {
          alert('Gagal mengambil lokasi. Pastikan izin lokasi browser diaktifkan.');
        }
      );
    } else {
      alert('Geolocation tidak didukung oleh browser Anda.');
    }
  };

  const getMaintenanceLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMaintenance(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
        },
        () => {
          alert('Gagal mengambil lokasi. Pastikan izin lokasi browser diaktifkan.');
        }
      );
    } else {
      alert('Geolocation tidak didukung oleh browser Anda.');
    }
  };

  const handleValidationSubmit = (e) => {
    e.preventDefault();
    if (valSerial) onValidateSerial(valCategory, valSerial);
  };

  const handleActivationSubmit = (e) => {
    e.preventDefault();
    if (!activation.id || !activation.category || !activation.city_id || !activation.latitude || !activation.longitude) {
      alert('Silakan lakukan Validasi Perangkat terlebih dahulu untuk mengisi ID & Kategori secara otomatis.');
      return;
    }
    if (!actPicture || !actSignature) {
      alert('Foto alat dan tanda tangan serah terima wajib diunggah.');
      return;
    }
    onActivateNode({
      ...activation,
      picture: actPicture,
      signature: actSignature
    });
    // Reset form states
    setActivation({ category: 'iot_node', id: '', serial_number: '', city_id: '', latitude: '', longitude: '' });
    setActPicture(null);
    setActSignature(null);
  };

  const handleMaintenanceSubmit = (e) => {
    e.preventDefault();
    if (!maintenance.iot_node_id || !maintenance.description || !maintenance.latitude || !maintenance.longitude) {
      alert('IoT Node, keterangan tindakan, dan koordinat GPS wajib diisi.');
      return;
    }
    if (!maintSignature) {
      alert('Tanda tangan pelaksana pemeliharaan wajib diunggah.');
      return;
    }
    onSubmitMaintenance({
      ...maintenance,
      picture: maintPicture,
      signature: maintSignature
    });
    // Reset form states
    setMaintenance({ iot_node_id: '', maintenance_type: 'rutin', description: '', latitude: '', longitude: '' });
    setMaintPicture(null);
    setMaintSignature(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Column 1: Validation & Activation */}
      <div className="space-y-6">
        
        {/* Device Validation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Validasi Perangkat</h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Periksa keaslian nomor seri alat di database pabrikan sebelum aktivasi</p>
          </div>

          <form onSubmit={handleValidationSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <select
                  value={valCategory}
                  onChange={(e) => setValCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-medium"
                >
                  <option value="iot_node">IoT Node</option>
                  <option value="edge_gateway">Edge Gateway</option>
                </select>
              </div>
              <div className="col-span-2 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Masukkan Nomor Seri"
                  value={valSerial}
                  onChange={(e) => setValSerial(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B] font-mono"
                />
                <button
                  type="submit"
                  disabled={loadingValidation}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 rounded-lg uppercase tracking-wider text-[10px] transition cursor-pointer disabled:opacity-50 select-none"
                >
                  {loadingValidation ? 'Pengecekan...' : 'Cek'}
                </button>
              </div>
            </div>

            {validationResult && (
              <div className={`p-3.5 rounded-xl border text-[11px] font-medium leading-normal ${
                validationResult.status === 'success' ? 'bg-green-50 border-green-100 text-green-900' : 'bg-red-50 border-red-100 text-red-950'
              }`}>
                <p className="font-semibold uppercase tracking-wide text-xs">Hasil Pemeriksaan:</p>
                <p className="mt-1 leading-normal">{validationResult.message}</p>
                {validationResult.status === 'success' && validationResult.data && (
                  <div className="mt-2 pt-2 border-t border-green-200/50 space-y-1 font-mono text-[10px]">
                    <p>ID Database: {validationResult.data.id}</p>
                    <p>Kategori: <span className="uppercase font-bold">{validationResult.data.category}</span></p>
                    <p>Status: {validationResult.data.is_activated ? '✅ Sudah Aktif' : '⚠️ Belum Diaktivasi (Siap Diaktifkan)'}</p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Device Activation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Aktivasi IoT Node Baru</h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Daftarkan dan aktifkan unit telemetry di lokasi tambak setelah divalidasi</p>
          </div>

          <form onSubmit={handleActivationSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nomor Seri (Otomatis) *</label>
                <input
                  type="text"
                  readOnly
                  required
                  placeholder="Validasi Serial Terlebih Dahulu"
                  value={activation.serial_number}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-500 font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pilih Kota Penempatan *</label>
                <select
                  required
                  value={activation.city_id}
                  onChange={(e) => setActivation({ ...activation, city_id: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
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
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Garis Lintang (Latitude) *</label>
                  <button
                    type="button"
                    onClick={getActivationLocation}
                    className="text-[9px] text-[#0D9D1B] hover:text-[#0A8516] font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <MapPin className="h-3 w-3" /> GPS
                  </button>
                </div>
                <input
                  type="number"
                  step="0.000001"
                  required
                  placeholder="Contoh: -8.652900"
                  value={activation.latitude}
                  onChange={(e) => setActivation({ ...activation, latitude: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Garis Bujur (Longitude) *</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  placeholder="Contoh: 116.319500"
                  value={activation.longitude}
                  onChange={(e) => setActivation({ ...activation, longitude: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                  <Upload className="h-3 w-3 text-slate-400" /> Foto Perangkat *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  required
                  onChange={(e) => setActPicture(e.target.files[0])}
                  className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                  <FileSignature className="h-3 w-3 text-slate-400" /> Tanda Tangan Serah Terima *
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  required
                  onChange={(e) => setActSignature(e.target.files[0])}
                  className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingActivation}
              className="w-full py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer disabled:opacity-50 shadow-sm shadow-green-500/10"
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
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Laporan Pemeliharaan Perangkat</h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Catat tindakan servis atau perbaikan sensor kolam secara multipart</p>
          </div>

          <form onSubmit={handleMaintenanceSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pilih IoT Node *</label>
                <select
                  required
                  value={maintenance.iot_node_id}
                  onChange={(e) => setMaintenance({ ...maintenance, iot_node_id: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
                >
                  <option value="">-- Pilih IoT Node --</option>
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.serial_number} {node.name ? `(${node.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipe Pemeliharaan *</label>
                <select
                  value={maintenance.maintenance_type}
                  onChange={(e) => setMaintenance({ ...maintenance, maintenance_type: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
                >
                  <option value="rutin">Pembersihan Rutin</option>
                  <option value="perbaikan">Perbaikan Kerusakan</option>
                  <option value="kalibrasi">Kalibrasi Ulang Sensor</option>
                  <option value="ganti_komponen">Penggantian Komponen</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Keterangan Tindakan *</label>
              <textarea
                required
                placeholder="Tulis tindakan pemeliharaan yang dilakukan secara detail..."
                value={maintenance.description}
                onChange={(e) => setMaintenance({ ...maintenance, description: e.target.value })}
                rows="2"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Lintang (Latitude) *</label>
                  <button
                    type="button"
                    onClick={getMaintenanceLocation}
                    className="text-[9px] text-[#0D9D1B] hover:text-[#0A8516] font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <MapPin className="h-3 w-3" /> GPS
                  </button>
                </div>
                <input
                  type="number"
                  step="0.000001"
                  required
                  placeholder="-8.652900"
                  value={maintenance.latitude}
                  onChange={(e) => setMaintenance({ ...maintenance, latitude: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Bujur (Longitude) *</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  placeholder="116.319500"
                  value={maintenance.longitude}
                  onChange={(e) => setMaintenance({ ...maintenance, longitude: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                  <Upload className="h-3 w-3 text-slate-400" /> Foto Unit (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={(e) => setMaintPicture(e.target.files[0])}
                  className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                  <FileSignature className="h-3 w-3 text-slate-400" /> Tanda Tangan Teknisi *
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  required
                  onChange={(e) => setMaintSignature(e.target.files[0])}
                  className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingMaintenance}
              className="w-full py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer disabled:opacity-50 shadow-sm shadow-green-500/10"
            >
              {loadingMaintenance ? 'Mengirim...' : 'Kirim Laporan Pemeliharaan'}
            </button>
          </form>
        </div>

        {/* Maintenance History List */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Riwayat Tindakan Servis</h2>
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
                    <th className="px-4 py-2.5">Node/Alat</th>
                    <th className="px-4 py-2.5">Tipe</th>
                    <th className="px-4 py-2.5">Operator/Teknisi</th>
                    <th className="px-4 py-2.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {maintenancesList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(m.created_at || m.timestamp).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                        {m.iot_node?.serial_number || m.iot_node_serial_number || `ID Node: ${m.iot_node_id}`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase border ${
                          m.maintenance_type === 'perbaikan' ? 'bg-red-50 text-red-700 border-red-100' :
                          m.maintenance_type === 'kalibrasi' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          m.maintenance_type === 'ganti_komponen' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          'bg-green-50 text-[#0D9D1B] border-green-100'
                        }`}>
                          {m.maintenance_type === 'ganti_komponen' ? 'GANTI PART' : m.maintenance_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {m.operator?.full_name || m.performed_by || '—'}
                      </td>
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

