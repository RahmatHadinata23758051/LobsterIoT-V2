import React, { useState } from 'react';
import { RotateCcw, Trash2, Video, Edit2 } from 'lucide-react';

export const CameraManagement = ({
  camerasList = [],
  iotNodesMasterList = [],
  loadingCameras,
  onAddCamera,
  onUpdateCamera,
  onDeleteCamera,
  onRefresh
}) => {
  const [newCamera, setNewCamera] = useState({
    camera_code: '',
    iot_node_id: '',
    stream_url: '',
    is_active: true
  });
  const [editingCameraId, setEditingCameraId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCamera.camera_code || !newCamera.iot_node_id) {
      alert('Kode Kamera & IoT Node wajib dipilih.');
      return;
    }
    const payload = {
      camera_code: newCamera.camera_code,
      iot_node_id: parseInt(newCamera.iot_node_id),
      stream_url: newCamera.stream_url || null,
      is_active: newCamera.is_active
    };

    if (editingCameraId) {
      onUpdateCamera(editingCameraId, payload);
      setEditingCameraId(null);
    } else {
      onAddCamera(payload);
    }

    setNewCamera({
      camera_code: '',
      iot_node_id: '',
      stream_url: '',
      is_active: true
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Add Form */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Video className="h-4 w-4 text-[#0D9D1B]" />
            {editingCameraId ? 'Edit Kamera CCTV' : 'Tambah Kamera Baru'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
            {editingCameraId ? 'Perbarui data kamera CCTV yang terdaftar' : 'Daftarkan kamera CCTV pemantau KJA'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kode Kamera *</label>
            <input
              type="text"
              required
              placeholder="Contoh: CAM-A01-01"
              value={newCamera.camera_code}
              onChange={(e) => setNewCamera({ ...newCamera, camera_code: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pilih IoT Node (KJA Terkait) *</label>
            <select
              required
              value={newCamera.iot_node_id}
              onChange={(e) => setNewCamera({ ...newCamera, iot_node_id: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
            >
              <option value="">-- Pilih IoT Node --</option>
              {iotNodesMasterList.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.serial_number} {n.cage ? `(KJA: ${n.cage.cage_code})` : '(Belum Terhubung KJA)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">URL Stream HLS (.m3u8) atau MP4</label>
            <input
              type="text"
              placeholder="Contoh: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              value={newCamera.stream_url}
              onChange={(e) => setNewCamera({ ...newCamera, stream_url: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cam-active"
              checked={newCamera.is_active}
              onChange={(e) => setNewCamera({ ...newCamera, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-200 text-[#0D9D1B] focus:ring-[#0D9D1B] cursor-pointer"
            />
            <label htmlFor="cam-active" className="text-[10px] font-bold text-slate-600 uppercase cursor-pointer select-none">
              Kamera Aktif
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer shadow-sm shadow-green-500/10"
          >
            {editingCameraId ? 'Perbarui Kamera' : 'Simpan Kamera'}
          </button>

          {editingCameraId && (
            <button
              type="button"
              onClick={() => {
                setEditingCameraId(null);
                setNewCamera({
                  camera_code: '',
                  iot_node_id: '',
                  stream_url: '',
                  is_active: true
                });
              }}
              className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer"
            >
              Batal
            </button>
          )}
        </form>
      </div>

      {/* List Table */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Daftar Kamera CCTV</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Total data terdaftar pada basis data backend</p>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {loadingCameras ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">Memuat data kamera...</div>
        ) : camerasList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Belum ada kamera terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Kode Kamera</th>
                  <th className="px-4 py-2.5">KJA Terkait</th>
                  <th className="px-4 py-2.5">URL Stream</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {camerasList.map((cam) => (
                  <tr key={cam.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-slate-400">{cam.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">{cam.camera_code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {cam.iot_node?.cage ? `${cam.iot_node.cage.cage_code} (Node: ${cam.iot_node.serial_number})` : cam.iot_node ? `Node: ${cam.iot_node.serial_number}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-450 truncate max-w-[200px]" title={cam.stream_url}>
                      {cam.stream_url || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold border ${
                        cam.is_active ? 'bg-green-50 text-[#0D9D1B] border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {cam.is_active ? 'AKTIF' : 'NON-AKTIF'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCameraId(cam.id);
                            setNewCamera({
                              camera_code: cam.camera_code,
                              iot_node_id: cam.iot_node_id || '',
                              stream_url: cam.stream_url || '',
                              is_active: cam.is_active
                            });
                          }}
                          className="p-1 rounded text-green-600 hover:bg-green-50 transition cursor-pointer"
                          title="Edit Kamera"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCamera(cam.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition cursor-pointer"
                          title="Hapus Kamera"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
