import React, { useState } from 'react';
import { RotateCcw, Trash2, Cpu, MapPin, Edit } from 'lucide-react';

export const GatewayManagement = ({
  edgeGatewaysList = [],
  citiesList = [],
  loadingEdgeGateways,
  onAddEdgeGateway,
  onUpdateEdgeGateway,
  onDeleteEdgeGateway,
  onRefresh
}) => {
  const [newGateway, setNewGateway] = useState({
    serial_number: '',
    max_connected_nodes: 50,
    ip_address: '',
    gateway_ip: '',
    latitude: '',
    longitude: '',
    operating_system: '',
    ram_memory: '',
    cpu_speed: '',
    power_supply_type: '',
    voltage_level: '',
    city_id: ''
  });
  const [editingGatewayId, setEditingGatewayId] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung deteksi lokasi GPS.');
      return;
    }
    setDetectingGps(true);

    const successCallback = (position) => {
      setNewGateway(prev => ({
        ...prev,
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6)
      }));
      setDetectingGps(false);
    };

    const options = { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 };

    const errorCallback = (error) => {
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
    if (!newGateway.serial_number) {
      alert('Nomor Seri wajib diisi.');
      return;
    }

    const payload = {
      ...newGateway,
      max_connected_nodes: parseInt(newGateway.max_connected_nodes) || 50,
      city_id: newGateway.city_id ? parseInt(newGateway.city_id) : null,
      latitude: newGateway.latitude ? parseFloat(newGateway.latitude) : null,
      longitude: newGateway.longitude ? parseFloat(newGateway.longitude) : null
    };

    if (editingGatewayId) {
      onUpdateEdgeGateway(editingGatewayId, payload);
      setEditingGatewayId(null);
    } else {
      onAddEdgeGateway(payload);
    }

    // Reset form
    setNewGateway({
      serial_number: '',
      max_connected_nodes: 50,
      ip_address: '',
      gateway_ip: '',
      latitude: '',
      longitude: '',
      operating_system: '',
      ram_memory: '',
      cpu_speed: '',
      power_supply_type: '',
      voltage_level: '',
      city_id: ''
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Add Form */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-[#0D9D1B]" />
            {editingGatewayId ? 'Edit Detail Edge Gateway' : 'Tambah Edge Gateway'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
            {editingGatewayId ? 'Perbarui konfigurasi gateway existing' : 'Daftarkan Edge Computing Gateway baru'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nomor Seri *</label>
            <input
              type="text"
              required
              placeholder="e.g. GW-A001"
              value={newGateway.serial_number}
              onChange={(e) => setNewGateway({ ...newGateway, serial_number: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">IP Address</label>
              <input
                type="text"
                placeholder="192.168.1.1"
                value={newGateway.ip_address}
                onChange={(e) => setNewGateway({ ...newGateway, ip_address: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Max Connected Nodes</label>
              <input
                type="number"
                placeholder="50"
                value={newGateway.max_connected_nodes}
                onChange={(e) => setNewGateway({ ...newGateway, max_connected_nodes: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">OS Gateway</label>
              <input
                type="text"
                placeholder="e.g. Ubuntu 22.04 LTS"
                value={newGateway.operating_system}
                onChange={(e) => setNewGateway({ ...newGateway, operating_system: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pilih Kota *</label>
              <select
                value={newGateway.city_id}
                onChange={(e) => setNewGateway({ ...newGateway, city_id: e.target.value })}
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

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Koordinat Lokasi</label>
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
                  placeholder="Latitude"
                  value={newGateway.latitude}
                  onChange={(e) => setNewGateway({ ...newGateway, latitude: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="Longitude"
                  value={newGateway.longitude}
                  onChange={(e) => setNewGateway({ ...newGateway, longitude: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {editingGatewayId && (
              <button
                type="button"
                onClick={() => {
                  setEditingGatewayId(null);
                  setNewGateway({
                    serial_number: '',
                    max_connected_nodes: 50,
                    ip_address: '',
                    gateway_ip: '',
                    latitude: '',
                    longitude: '',
                    operating_system: '',
                    ram_memory: '',
                    cpu_speed: '',
                    power_supply_type: '',
                    voltage_level: '',
                    city_id: ''
                  });
                }}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer text-center"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className={`${editingGatewayId ? 'w-2/3' : 'w-full'} py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer shadow-sm shadow-green-500/10`}
            >
              {editingGatewayId ? 'Perbarui' : 'Simpan'} Gateway
            </button>
          </div>
        </form>
      </div>

      {/* List Table */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Daftar Edge Gateway</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Total data terdaftar pada basis data backend</p>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {loadingEdgeGateways ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">Memuat data gateway...</div>
        ) : edgeGatewaysList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Belum ada Edge Gateway terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Nomor Seri</th>
                  <th className="px-4 py-2.5">IP Address</th>
                  <th className="px-4 py-2.5">Max Nodes</th>
                  <th className="px-4 py-2.5">OS System</th>
                  <th className="px-4 py-2.5">Lokasi Kota</th>
                  <th className="px-4 py-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {edgeGatewaysList.map((gw) => (
                  <tr key={gw.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-slate-400">{gw.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">{gw.serial_number}</td>
                    <td className="px-4 py-3 font-mono">{gw.ip_address || '—'}</td>
                    <td className="px-4 py-3 font-mono">{gw.max_connected_nodes}</td>
                    <td className="px-4 py-3 text-slate-650 font-medium">{gw.operating_system || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{gw.city?.name || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingGatewayId(gw.id);
                            setNewGateway({
                              serial_number: gw.serial_number,
                              max_connected_nodes: gw.max_connected_nodes,
                              ip_address: gw.ip_address || '',
                              gateway_ip: gw.gateway_ip || '',
                              latitude: gw.latitude || '',
                              longitude: gw.longitude || '',
                              operating_system: gw.operating_system || '',
                              ram_memory: gw.ram_memory || '',
                              cpu_speed: gw.cpu_speed || '',
                              power_supply_type: gw.power_supply_type || '',
                              voltage_level: gw.voltage_level || '',
                              city_id: gw.city_id || ''
                            });
                          }}
                          title="Edit Edge Gateway"
                          className="p-1 rounded text-[#0D9D1B] hover:bg-green-50 transition cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteEdgeGateway(gw.id)}
                          title="Hapus Edge Gateway"
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
