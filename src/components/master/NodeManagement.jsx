import React, { useState } from 'react';
import { RotateCcw, Trash2, Layers } from 'lucide-react';

export const NodeManagement = ({
  iotNodesMasterList = [],
  edgeGatewaysList = [],
  citiesList = [],
  loadingIotNodesMaster,
  onAddIotNodeMaster,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newNode.serial_number || !newNode.city_id) {
      alert('Nomor Seri & Kota wajib diisi.');
      return;
    }
    onAddIotNodeMaster({
      ...newNode,
      city_id: parseInt(newNode.city_id),
      edge_gateway_id: newNode.edge_gateway_id ? parseInt(newNode.edge_gateway_id) : null,
      gateway_channel_number: newNode.gateway_channel_number ? parseInt(newNode.gateway_channel_number) : null,
      latitude: newNode.latitude ? parseFloat(newNode.latitude) : null,
      longitude: newNode.longitude ? parseFloat(newNode.longitude) : null
    });
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
            Daftarkan IoT Node
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Tambah sensor node monitoring baru</p>
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Latitude</label>
              <input
                type="number"
                step="0.000001"
                placeholder="-8.65"
                value={newNode.latitude}
                onChange={(e) => setNewNode({ ...newNode, latitude: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Longitude</label>
              <input
                type="number"
                step="0.000001"
                placeholder="116.3"
                value={newNode.longitude}
                onChange={(e) => setNewNode({ ...newNode, longitude: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer shadow-sm shadow-green-500/10"
          >
            Simpan IoT Node
          </button>
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
                      <button
                        onClick={() => onDeleteIotNodeMaster(node.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 transition cursor-pointer"
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
  );
};
