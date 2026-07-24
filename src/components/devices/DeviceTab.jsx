import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, AlertTriangle, CheckCircle, WifiOff, MapPin, Upload, 
  FileSignature, Cpu, ShieldCheck, Wrench, ListFilter, Search, PlusCircle,
  Radio, Info, ArrowRight, CheckCircle2, AlertCircle
} from 'lucide-react';

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
  // Main Sub-Tab Navigation: 'activation' | 'maintenance' | 'list'
  const [subTab, setSubTab] = useState('activation');

  // Step state for activation: 1 = Validasi, 2 = Form Aktivasi
  const [activationStep, setActivationStep] = useState(1);

  // Validation Form State
  const [valCategory, setValCategory] = useState('iot_node');
  const [valSerial, setValSerial] = useState('');

  // Activation Form State
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

  // Maintenance Form State
  const [maintenance, setMaintenance] = useState({
    iot_node_id: '',
    maintenance_type: 'rutin',
    description: '',
    latitude: '',
    longitude: ''
  });
  const [maintPicture, setMaintPicture] = useState(null);
  const [maintSignature, setMaintSignature] = useState(null);

  // Maintenance List Search & Filter
  const [maintSearch, setMaintSearch] = useState('');
  const [maintTypeFilter, setMaintTypeFilter] = useState('all');

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
        setActivationStep(2); // Automatically advance to Step 2!
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
    if (valSerial.trim()) {
      onValidateSerial(valCategory, valSerial.trim());
    }
  };

  const handleActivationSubmit = (e) => {
    e.preventDefault();
    if (!activation.id || !activation.category || !activation.city_id || !activation.latitude || !activation.longitude) {
      alert('Silakan lengkapi data kota penempatan dan koordinat lokasi.');
      return;
    }
    if (!actPicture || !actSignature) {
      alert('Foto fisik alat dan foto tanda tangan serah terima wajib diunggah.');
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
    setActivationStep(1);
    setValSerial('');
  };

  const handleMaintenanceSubmit = (e) => {
    e.preventDefault();
    if (!maintenance.iot_node_id || !maintenance.description || !maintenance.latitude || !maintenance.longitude) {
      alert('Perangkat IoT, rincian tindakan, dan koordinat lokasi wajib diisi.');
      return;
    }
    if (!maintSignature) {
      alert('Foto tanda tangan teknisi pelaksana wajib diunggah.');
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

  // Filtered maintenance list
  const filteredMaintenances = maintenancesList.filter(m => {
    const serial = (m.iot_node?.serial_number || m.iot_node_serial_number || '').toLowerCase();
    const desc = (m.description || '').toLowerCase();
    const op = (m.operator?.full_name || m.performed_by || '').toLowerCase();
    const q = maintSearch.toLowerCase();
    
    const matchesQuery = serial.includes(q) || desc.includes(q) || op.includes(q);
    const matchesType = maintTypeFilter === 'all' || m.maintenance_type === maintTypeFilter;

    return matchesQuery && matchesType;
  });

  return (
    <div className="space-y-6 font-sans animate-[fadeIn_0.4s_ease-out]">
      
      {/* Header Bar & Sub-Tab Navigation */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Cpu className="h-6 w-6 text-[#0D9D1B]" />
            <span>Kelola Perangkat & Pemeliharaan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Panduan aktivasi nomor seri perangkat tambak dan pencatatan riwayat pemeliharaan rutin teknisi
          </p>
        </div>

        {/* Sub-Tabs Button Group */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setSubTab('activation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
              subTab === 'activation'
                ? 'bg-white text-[#0D9D1B] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>1. Aktivasi Perangkat</span>
          </button>

          <button
            onClick={() => setSubTab('maintenance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
              subTab === 'maintenance'
                ? 'bg-white text-[#0D9D1B] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>2. Pemeliharaan & Servis</span>
          </button>

          <button
            onClick={() => setSubTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
              subTab === 'list'
                ? 'bg-white text-[#0D9D1B] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>Daftar Perangkat Aktif</span>
          </button>
        </div>
      </div>

      {/* ═ SUB-TAB 1: ACTIVATION & REGISTRATION WIZARD ════════════════════════ */}
      {subTab === 'activation' && (
        <div className="space-y-6">
          
          {/* Stepper Progress Indicator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-around">
            <div 
              onClick={() => setActivationStep(1)}
              className={`flex items-center gap-3 cursor-pointer select-none ${activationStep === 1 ? 'text-[#0D9D1B]' : 'text-slate-400'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                activationStep === 1 ? 'bg-[#0D9D1B] text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                1
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Langkah 1: Validasi Nomor Seri</p>
                <p className="text-[10px] text-slate-400 font-medium">Pemeriksaan database pabrikan</p>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-slate-300 hidden md:block" />

            <div 
              onClick={() => {
                if (validationResult && validationResult.status === 'success' && !validationResult.data?.is_activated) {
                  setActivationStep(2);
                }
              }}
              className={`flex items-center gap-3 cursor-pointer select-none ${activationStep === 2 ? 'text-[#0D9D1B]' : 'text-slate-400'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                activationStep === 2 ? 'bg-[#0D9D1B] text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                2
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Langkah 2: Penempatan & Aktivasi</p>
                <p className="text-[10px] text-slate-400 font-medium">Input koordinat GPS & foto alat</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* STEP 1 CARD: Validasi Serial Number */}
            <div className={`bg-white border rounded-2xl p-6 shadow-sm transition ${
              activationStep === 1 ? 'border-[#0D9D1B] ring-2 ring-[#0D9D1B]/10' : 'border-slate-200 opacity-75'
            }`}>
              <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#0D9D1B]" />
                    <span>Langkah 1: Validasi Keaslian Perangkat</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Masukkan nomor seri fisik alat untuk memeriksa keabsahan unit</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-[#0D9D1B] text-[10px] font-bold rounded-lg border border-emerald-100">
                  STEP 1
                </span>
              </div>

              <form onSubmit={handleValidationSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Kategori Perangkat
                  </label>
                  <select
                    value={valCategory}
                    onChange={(e) => setValCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:border-[#0D9D1B] focus:bg-white"
                  >
                    <option value="iot_node">IoT Sensor Node (Telemetry Unit)</option>
                    <option value="edge_gateway">Edge Gateway Hub</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Nomor Seri (Serial Number / UUID)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Contoh: LOB-NODE-001"
                      value={valSerial}
                      onChange={(e) => setValSerial(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B] focus:bg-white uppercase"
                    />
                    <button
                      type="submit"
                      disabled={loadingValidation}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 rounded-xl uppercase tracking-wider text-xs transition cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {loadingValidation ? 'Mengecek...' : 'Cek Serial'}
                    </button>
                  </div>
                </div>

                {/* Validation Result Banner */}
                {validationResult && (
                  <div className={`p-4 rounded-xl border text-xs font-medium leading-relaxed ${
                    validationResult.status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-xs uppercase mb-1">
                      {validationResult.status === 'success' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-[#0D9D1B]" />
                          <span>Pemeriksaan Berhasil: Nomor Seri Valid!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-rose-600" />
                          <span>Pemeriksaan Gagal</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1">{validationResult.message}</p>
                    
                    {validationResult.status === 'success' && validationResult.data && (
                      <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-1 font-mono text-[11px]">
                        <p>ID Perangkat: <span className="font-bold text-slate-900">{validationResult.data.id}</span></p>
                        <p>Kategori: <span className="uppercase font-bold text-[#0D9D1B]">{validationResult.data.category}</span></p>
                        <p>Status Aktivasi: {
                          validationResult.data.is_activated 
                            ? <span className="font-bold text-amber-700">⚠️ Sudah Pernah Diaktifkan</span>
                            : <span className="font-bold text-[#0D9D1B]">✅ Belum Diaktivasi (Siap Diaktifkan)</span>
                        }</p>

                        {!validationResult.data.is_activated && (
                          <button
                            type="button"
                            onClick={() => setActivationStep(2)}
                            className="mt-3 w-full py-2 bg-[#0D9D1B] text-white font-sans text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-[#0A8516] transition cursor-pointer flex items-center justify-center gap-2"
                          >
                            <span>Lanjut ke Langkah 2: Form Penempatan</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* STEP 2 CARD: Form Aktivasi Penempatan */}
            <div className={`bg-white border rounded-2xl p-6 shadow-sm transition ${
              activationStep === 2 ? 'border-[#0D9D1B] ring-2 ring-[#0D9D1B]/10' : 'border-slate-200 opacity-60'
            }`}>
              <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#0D9D1B]" />
                    <span>Langkah 2: Penempatan & Aktivasi</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Isi data kota penempatan, koordinat GPS tambak, dan foto bukti</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-[#0D9D1B] text-[10px] font-bold rounded-lg border border-emerald-100">
                  STEP 2
                </span>
              </div>

              {activationStep === 1 && !activation.serial_number ? (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Info className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Langkah 2 Belum Terbuka</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Silakan lakukan validasi nomor seri pada Langkah 1 terlebih dahulu.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleActivationSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nomor Seri *</label>
                      <input
                        type="text"
                        readOnly
                        required
                        value={activation.serial_number}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-700 font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Kota Penempatan *</label>
                      <select
                        required
                        value={activation.city_id}
                        onChange={(e) => setActivation({ ...activation, city_id: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-[#0D9D1B] focus:bg-white"
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
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Lintang (Latitude) *</label>
                        <button
                          type="button"
                          onClick={getActivationLocation}
                          className="text-[9px] text-[#0D9D1B] hover:text-[#0A8516] font-bold flex items-center gap-0.5 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100"
                        >
                          <MapPin className="h-3 w-3" /> Ambil GPS
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.000001"
                        required
                        placeholder="-8.652900"
                        value={activation.latitude}
                        onChange={(e) => setActivation({ ...activation, latitude: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#0D9D1B] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Bujur (Longitude) *</label>
                      <input
                        type="number"
                        step="0.000001"
                        required
                        placeholder="116.319500"
                        value={activation.longitude}
                        onChange={(e) => setActivation({ ...activation, longitude: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#0D9D1B] focus:bg-white"
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
                        accept="image/*"
                        required
                        onChange={(e) => setActPicture(e.target.files[0])}
                        className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-[#0D9D1B] hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                        <FileSignature className="h-3 w-3 text-slate-400" /> Tanda Tangan Serah Terima *
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => setActSignature(e.target.files[0])}
                        className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-[#0D9D1B] hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-1"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingActivation}
                    className="w-full py-3 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-extrabold rounded-xl tracking-wider uppercase transition cursor-pointer disabled:opacity-50 shadow-md shadow-green-500/20 text-xs mt-2"
                  >
                    {loadingActivation ? 'Mengaktivasi Unit...' : 'Aktifkan Perangkat Sekarang'}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ═ SUB-TAB 2: MAINTENANCE & SERVICE LOGS ════════════════════════════ */}
      {subTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Laporan Pemeliharaan */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-[#0D9D1B]" />
                  <span>Input Pemeliharaan</span>
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Form pencatatan tindakan pemeliharaan perangkat IoT</p>
              </div>

              <form onSubmit={handleMaintenanceSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Pilih IoT Node *</label>
                  <select
                    required
                    value={maintenance.iot_node_id}
                    onChange={(e) => setMaintenance({ ...maintenance, iot_node_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-[#0D9D1B] focus:bg-white"
                  >
                    <option value="">-- Pilih Perangkat IoT --</option>
                    {nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.serial_number} {node.name ? `(${node.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Tipe Tindakan *</label>
                  <select
                    value={maintenance.maintenance_type}
                    onChange={(e) => setMaintenance({ ...maintenance, maintenance_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-[#0D9D1B] focus:bg-white"
                  >
                    <option value="rutin">Pembersihan Rutin</option>
                    <option value="perbaikan">Perbaikan Kerusakan</option>
                    <option value="kalibrasi">Kalibrasi Ulang Sensor</option>
                    <option value="ganti_komponen">Penggantian Komponen</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Keterangan Tindakan *</label>
                  <textarea
                    required
                    placeholder="Rincian tindakan servis yang telah dilakukan..."
                    value={maintenance.description}
                    onChange={(e) => setMaintenance({ ...maintenance, description: e.target.value })}
                    rows="3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#0D9D1B] focus:bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Latitude *</label>
                      <button
                        type="button"
                        onClick={getMaintenanceLocation}
                        className="text-[9px] text-[#0D9D1B] font-bold cursor-pointer"
                      >
                        GPS
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      placeholder="-8.652900"
                      value={maintenance.latitude}
                      onChange={(e) => setMaintenance({ ...maintenance, latitude: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Longitude *</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      placeholder="116.319500"
                      value={maintenance.longitude}
                      onChange={(e) => setMaintenance({ ...maintenance, longitude: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Foto Tanda Tangan Teknisi *</label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setMaintSignature(e.target.files[0])}
                    className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-[#0D9D1B] cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-1"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingMaintenance}
                  className="w-full py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-bold rounded-xl uppercase tracking-wider transition cursor-pointer disabled:opacity-50 text-xs shadow-sm shadow-green-500/10"
                >
                  {loadingMaintenance ? 'Mengirim Laporan...' : 'Kirim Laporan Servis'}
                </button>
              </form>
            </div>

            {/* Riwayat & Daftar Pemeliharaan */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Riwayat Tindakan Servis</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Log aktivitas pemeliharaan perangkat yang tercatat di sistem</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari serial / deskripsi..."
                      value={maintSearch}
                      onChange={(e) => setMaintSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B]"
                    />
                  </div>

                  {/* Filter Type Dropdown */}
                  <select
                    value={maintTypeFilter}
                    onChange={(e) => setMaintTypeFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
                  >
                    <option value="all">Semua Tipe</option>
                    <option value="rutin">Rutin</option>
                    <option value="perbaikan">Perbaikan</option>
                    <option value="kalibrasi">Kalibrasi</option>
                    <option value="ganti_komponen">Ganti Part</option>
                  </select>

                  <button
                    onClick={onRefreshMaintenances}
                    title="Refresh Data"
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {loadingMaintenances ? (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">Memuat log pemeliharaan...</div>
              ) : filteredMaintenances.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  Tidak ada riwayat pemeliharaan yang cocok.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Waktu</th>
                        <th className="px-4 py-3">Node / Perangkat</th>
                        <th className="px-4 py-3">Tipe</th>
                        <th className="px-4 py-3">Teknisi / Operator</th>
                        <th className="px-4 py-3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredMaintenances.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                            {new Date(m.created_at || m.timestamp).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                            {m.iot_node?.serial_number || m.iot_node_serial_number || `ID Node: ${m.iot_node_id}`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase border ${
                              m.maintenance_type === 'perbaikan' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              m.maintenance_type === 'kalibrasi' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              m.maintenance_type === 'ganti_komponen' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              'bg-emerald-50 text-[#0D9D1B] border-emerald-200'
                            }`}>
                              {m.maintenance_type === 'ganti_komponen' ? 'GANTI PART' : m.maintenance_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {m.operator?.full_name || m.performed_by || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-medium max-w-[200px] truncate" title={m.description}>
                            {m.description}
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
      )}

      {/* ═ SUB-TAB 3: ACTIVE DEVICES LIST ════════════════════════════════════ */}
      {subTab === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#0D9D1B]" />
                <span>Daftar Unit Perangkat Terdaftar & Aktif</span>
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Monitoring status dan lokasi koordinat penempatan unit IoT Tambak</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-[#0D9D1B] border border-emerald-100 rounded-lg text-xs font-bold">
              Total {nodes.length} Unit Aktif
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Nomor Seri</th>
                  <th className="px-4 py-3">Nama Unit</th>
                  <th className="px-4 py-3">Kota Penempatan</th>
                  <th className="px-4 py-3">Koordinat GPS</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {nodes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-xs text-slate-400 font-medium">
                      Belum ada perangkat IoT yang terdaftar secara aktif.
                    </td>
                  </tr>
                ) : (
                  nodes.map((node, index) => (
                    <tr key={node.id || index} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 text-slate-400 font-mono">{index + 1}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">{node.serial_number}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{node.name || '—'}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{node.city?.name || node.city_id || '—'}</td>
                      <td className="px-4 py-3 font-mono text-[#0D9D1B] text-[11px]">
                        {node.latitude && node.longitude ? `${node.latitude}, ${node.longitude}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-[#0D9D1B] border border-emerald-200 rounded-md text-[10px] font-bold uppercase">
                          AKTIF
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
