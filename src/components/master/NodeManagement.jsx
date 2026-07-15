import React, { useState } from 'react';
import { RotateCcw, Trash2, Layers, MapPin, Edit } from 'lucide-react';

export const NodeManagement = ({
  iotNodesMasterList = [],
  edgeGatewaysList = [],
  citiesList = [],
  loadingIotNodesMaster,
  onAddIotNodeMaster,
  onUpdateIotNodeMaster,
  onDeleteIotNodeMaster,
  onRefresh
}) => {
  const [newNode, setNewNode] = useState({
    serial_number: '',
    gateway_channel_number: '',
    ip_address: '',
    latitude: '',
    longitude: '',
    edge_gateway_id: '',
    city_id: ''
  });
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung deteksi lokasi GPS.');
      return;
    }
    setDetectingGps(true);

    const successCallback = (position) => {
      setNewNode(prev => ({
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
    if (!newNode.serial_number || !newNode.city_id) {
      alert('Nomor Seri & Kota wajib diisi.');
      return;
    }

    const payload = {
      ...newNode,
      city_id: parseInt(newNode.city_id),
      edge_gateway_id: newNode.edge_gateway_id ? parseInt(newNode.edge_gateway_id) : null,
      gateway_channel_number: newNode.gateway_channel_number ? parseInt(newNode.gateway_channel_number) : null,
      latitude: newNode.latitude ? parseFloat(newNode.latitude) : null,
      longitude: newNode.longitude ? parseFloat(newNode.longitude) : null
    };

    if (editingNodeId) {
      onUpdateIotNodeMaster(editingNodeId, payload);
      setEditingNodeId(null);
    } else {
      onAddIotNodeMaster(payload);
    }

    // Reset form
    setNewNode({
      serial_number: '',
      gateway_channel_number: '',
      ip_address: '',
      latitude: '',
      longitude: '',
      edge_gateway_id: '',
      city_id: ''
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Add Form */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-[#0D9D1B]" />
            {editingNodeId ? 'Edit Detail IoT Node' : 'Daftarkan IoT Node'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
            {editingNodeId ? 'Perbarui konfigurasi sensor node existing' : 'Tambah sensor node monitoring baru'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nomor Seri *</label>
            <input
              type="text"
              required
              placeholder="e.g. NODE-A001"
              value={newNode.serial_number}
              onChange={(e) => setNewNode({ ...newNode, serial_number: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pilih Kota *</label>
              <select
                required
                value={newNode.city_id}
                onChange={(e) => setNewNode({ ...newNode, city_id: e.target.value })}
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
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Edge Gateway</label>
              <select
                value={newNode.edge_gateway_id}
                onChange={(e) => setNewNode({ ...newNode, edge_gateway_id: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
              >
                <option value="">-- Tanpa Gateway --</option>
                {edgeGatewaysList.map((gw) => (
                  <option key={gw.id} value={gw.id}>
                    {gw.serial_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Channel No</label>
              <input
                type="number"
                placeholder="Contoh: 1"
                value={newNode.gateway_channel_number}
                onChange={(e) => setNewNode({ ...newNode, gateway_channel_number: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">IP Address</label>
              <input
                type="text"
                placeholder="192.168.1.50"
                value={newNode.ip_address}
                onChange={(e) => setNewNode({ ...newNode, ip_address: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
              />
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
                  value={newNode.latitude}
                  onChange={(e) => setNewNode({ ...newNode, latitude: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="Longitude"
                  value={newNode.longitude}
                  onChange={(e) => setNewNode({ ...newNode, longitude: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {editingNodeId && (
              <button
                type="button"
                onClick={() => {
                  setEditingNodeId(null);
                  setNewNode({
                    serial_number: '',
                    gateway_channel_number: '',
                    ip_address: '',
                    latitude: '',
                    longitude: '',
                    edge_gateway_id: '',
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
              className={`${editingNodeId ? 'w-2/3' : 'w-full'} py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer shadow-sm shadow-green-500/10`}
            >
              {editingNodeId ? 'Perbarui' : 'Simpan'} IoT Node
            </button>
          </div>
        </form>
      </div>

      {/* List Table */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Daftar IoT Node Terdaftar</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Total data terdaftar pada basis data backend</p>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {loadingIotNodesMaster ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">Memuat data IoT Node...</div>
        ) : iotNodesMasterList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Belum ada IoT Node terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Nomor Seri</th>
                  <th className="px-4 py-2.5">Gateway</th>
                  <th className="px-4 py-2.5">Channel No</th>
                  <th className="px-4 py-2.5">IP Address</th>
                  <th className="px-4 py-2.5">Lokasi Kota</th>
                  <th className="px-4 py-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {iotNodesMasterList.map((node) => (
                  <tr key={node.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-slate-400">{node.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">{node.serial_number}</td>
                    <td className="px-4 py-3 font-bold text-slate-750 font-mono">
                      {node.edge_gateway?.serial_number || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono">{node.gateway_channel_number ?? '—'}</td>
                    <td className="px-4 py-3 font-mono">{node.ip_address || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{node.city?.name || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingNodeId(node.id);
                            setNewNode({
                              serial_number: node.serial_number,
                              gateway_channel_number: node.gateway_channel_number ?? '',
                              ip_address: node.ip_address || '',
                              latitude: node.latitude || '',
                              longitude: node.longitude || '',
                              edge_gateway_id: node.edge_gateway_id || '',
                              city_id: node.city_id || ''
                            });
                          }}
                          title="Edit IoT Node"
                          className="p-1 rounded text-[#0D9D1B] hover:bg-green-50 transition cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteIotNodeMaster(node.id)}
                          title="Hapus IoT Node"
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
