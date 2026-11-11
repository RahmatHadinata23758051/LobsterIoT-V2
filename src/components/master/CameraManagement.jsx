import React, { useState } from 'react';
import { RotateCcw, Trash2, Video, Edit2 } from 'lucide-react';

const emptyCamera = {
  camera_code: '',
  iot_node_id: '',
  mode: 'dvr',
  dvr_ip: '',
  port: '554',
  channel_number: '1',
  protocol: 'rtsp',
  username: '',
  password: '',
  rtsp_url: '',
  stream_url: '',
  is_active: true,
};

export const CameraManagement = ({
  camerasList = [],
  iotNodesMasterList = [],
  loadingCameras,
  onAddCamera,
  onUpdateCamera,
  onDeleteCamera,
  onRefresh,
}) => {
  const [camera, setCamera] = useState(emptyCamera);
  const [editingCameraId, setEditingCameraId] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!camera.camera_code || !camera.iot_node_id) {
      alert('Kode Kamera & IoT Node wajib dipilih.');
      return;
    }

    const payload = {
      camera_code: camera.camera_code,
      iot_node_id: Number(camera.iot_node_id),
      is_active: camera.is_active,
      stream_url: camera.mode === 'direct' ? camera.stream_url || null : null,
      dvr_ip: camera.mode === 'dvr' ? camera.dvr_ip || null : null,
      port: camera.mode === 'dvr' ? Number(camera.port || 554) : null,
      channel_number: camera.mode === 'dvr' ? Number(camera.channel_number || 1) : null,
      protocol: camera.mode === 'dvr' ? camera.protocol : null,
      username: camera.mode === 'dvr' ? camera.username || null : null,
      rtsp_url: camera.mode === 'dvr' ? camera.rtsp_url || null : null,
    };
    if (camera.password) payload.password = camera.password;
    else if (camera.mode === 'direct') payload.password = null;

    const ok = editingCameraId
      ? await onUpdateCamera(editingCameraId, payload)
      : await onAddCamera(payload);
    if (ok !== true) return;
    setEditingCameraId(null);
    setCamera(emptyCamera);
  };

  const editCamera = (cam) => {
    setEditingCameraId(cam.id);
    setCamera({
      ...emptyCamera,
      camera_code: cam.camera_code,
      iot_node_id: cam.iot_node_id || '',
      mode: cam.dvr_ip || cam.rtsp_url || cam.channel_number ? 'dvr' : 'direct',
      dvr_ip: cam.dvr_ip || '',
      port: String(cam.port || 554),
      channel_number: String(cam.channel_number || 1),
      protocol: cam.protocol || 'rtsp',
      username: cam.username || '',
      rtsp_url: cam.rtsp_url || '',
      stream_url: cam.stream_url || '',
      is_active: Boolean(cam.is_active),
    });
  };

  const update = (key, value) => setCamera((current) => ({ ...current, [key]: value }));

  return (
    <div className="grid grid-cols-1 gap-6 animate-[fadeIn_0.4s_ease-out] lg:grid-cols-3">
      <section className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
            <Video className="h-4 w-4 text-[#0D9D1B]" />
            {editingCameraId ? 'Edit Kamera CCTV' : 'Tambah Kamera Baru'}
          </h3>
          <p className="mt-0.5 text-[10px] font-medium text-slate-400">Atur sumber video dan hubungkan ke IoT Node.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Kode Kamera *</span>
            <input required value={camera.camera_code} onChange={(event) => update('camera_code', event.target.value)} placeholder="Contoh: CAM-A01-01" className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-slate-900 focus:border-[#0D9D1B] focus:outline-none" />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">IoT Node (KJA terkait) *</span>
            <select required value={camera.iot_node_id} onChange={(event) => update('iot_node_id', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-900 focus:border-[#0D9D1B] focus:outline-none">
              <option value="">-- Pilih IoT Node --</option>
              {iotNodesMasterList.map((node) => <option key={node.id} value={node.id}>{node.serial_number} {node.cage ? `(KJA: ${node.cage.cage_code})` : '(Belum Terhubung KJA)'}</option>)}
            </select>
          </label>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-[10px] font-bold uppercase text-slate-500">Sumber video</legend>
            <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
              {[['dvr', 'DVR / NVR'], ['direct', 'URL langsung']].map(([value, label]) => (
                <button key={value} type="button" onClick={() => update('mode', value)} aria-pressed={camera.mode === value} className={`rounded-md px-2 py-2 text-[11px] font-semibold transition ${camera.mode === value ? 'bg-white text-[#0D9D1B] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>
              ))}
            </div>
          </fieldset>

          {camera.mode === 'dvr' ? (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2 block">
                  <span className="mb-1 block text-[10px] font-bold text-slate-500">Alamat DVR</span>
                  <input value={camera.dvr_ip} onChange={(event) => update('dvr_ip', event.target.value)} placeholder="192.168.1.108" className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-slate-900 focus:border-[#0D9D1B] focus:outline-none" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold text-slate-500">Port</span>
                  <input type="number" min="1" max="65535" value={camera.port} onChange={(event) => update('port', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-slate-900 focus:border-[#0D9D1B] focus:outline-none" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold text-slate-500">Channel</span>
                  <select value={camera.channel_number} onChange={(event) => update('channel_number', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-900 focus:border-[#0D9D1B] focus:outline-none">
                    {Array.from({ length: 16 }, (_, index) => <option key={index + 1} value={index + 1}>Channel {index + 1}</option>)}
                  </select>
                </label>
                <label className="col-span-2 block">
                  <span className="mb-1 block text-[10px] font-bold text-slate-500">Protokol sumber</span>
                  <select value={camera.protocol} onChange={(event) => update('protocol', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-900 focus:border-[#0D9D1B] focus:outline-none">
                    <option value="rtsp">RTSP</option><option value="hls">HLS</option><option value="http">HTTP</option><option value="https">HTTPS</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold text-slate-500">Nama pengguna</span>
                  <input autoComplete="off" value={camera.username} onChange={(event) => update('username', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-900 focus:border-[#0D9D1B] focus:outline-none" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold text-slate-500">Kata sandi</span>
                  <input type="password" autoComplete="new-password" value={camera.password} onChange={(event) => update('password', event.target.value)} placeholder={editingCameraId ? 'Kosongkan untuk tetap memakai yang tersimpan' : ''} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-900 focus:border-[#0D9D1B] focus:outline-none" />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-500">Alamat RTSP/HLS kustom (opsional)</span>
                <input value={camera.rtsp_url} onChange={(event) => update('rtsp_url', event.target.value)} placeholder="rtsp://... atau URL HLS browser" className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-slate-900 focus:border-[#0D9D1B] focus:outline-none" />
              </label>
              <p className="text-[10px] leading-relaxed text-slate-500">Tanpa alamat kustom, sistem menyusun <span className="font-mono">{'{protokol}://{ip-dvr}:{port}/ch{channel}'}</span>. Isi alamat kustom jika merek DVR memakai pola path yang berbeda.</p>
            </div>
          ) : (
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">URL HLS atau MP4</span>
              <input value={camera.stream_url} onChange={(event) => update('stream_url', event.target.value)} placeholder="https://.../live.m3u8" className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-slate-900 focus:border-[#0D9D1B] focus:outline-none" />
            </label>
          )}

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={camera.is_active} onChange={(event) => update('is_active', event.target.checked)} className="h-4 w-4 rounded border-slate-200 text-[#0D9D1B] focus:ring-[#0D9D1B]" />
            <span className="text-[10px] font-bold uppercase text-slate-600">Kamera aktif</span>
          </label>

          <button type="submit" className="w-full cursor-pointer rounded-lg bg-[#0D9D1B] py-2.5 font-semibold uppercase tracking-wider text-white shadow-sm shadow-green-500/10 transition hover:bg-[#0A8516]">{editingCameraId ? 'Simpan perubahan' : 'Simpan kamera'}</button>
          {editingCameraId && <button type="button" onClick={() => { setEditingCameraId(null); setCamera(emptyCamera); }} className="w-full cursor-pointer rounded-lg bg-slate-100 py-2 font-semibold uppercase tracking-wider text-slate-700 transition hover:bg-slate-200">Batal</button>}
        </form>
      </section>

      <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div><h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">Daftar Kamera CCTV</h3><p className="mt-0.5 text-[10px] text-slate-400">Konfigurasi kamera dan IoT Node terhubung.</p></div>
          <button type="button" onClick={onRefresh} aria-label="Muat ulang kamera" className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"><RotateCcw className="h-3.5 w-3.5" /></button>
        </div>

        {loadingCameras ? <div className="py-12 text-center text-xs font-medium text-slate-400">Memuat data kamera...</div> : camerasList.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-xs text-slate-400">Belum ada kamera terdaftar.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-500"><th className="px-3 py-2.5">Kamera</th><th className="px-3 py-2.5">IoT Node</th><th className="px-3 py-2.5">Sumber</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5 text-center">Aksi</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {camerasList.map((cam) => {
                  const isDvr = Boolean(cam.dvr_ip || cam.rtsp_url);
                  return <tr key={cam.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-3 font-mono font-bold text-slate-900">{cam.camera_code}</td>
                    <td className="px-3 py-3 font-semibold">{cam.iot_node?.cage ? `${cam.iot_node.cage.cage_code} · ${cam.iot_node.serial_number}` : cam.iot_node?.serial_number || '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-md border px-2 py-1 text-[9px] font-bold ${isDvr ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{isDvr ? `${String(cam.protocol || 'rtsp').toUpperCase()} · CH ${cam.channel_number || '—'}` : 'URL LANGSUNG'}</span>
                      <div className="mt-1 max-w-[190px] truncate font-mono text-[10px] text-slate-500" title={cam.dvr_ip || cam.computed_stream_url || cam.stream_url || ''}>{cam.dvr_ip ? `${cam.dvr_ip}:${cam.port || 554}` : cam.computed_stream_url || cam.stream_url || 'Belum ada stream'}</div>
                    </td>
                    <td className="px-3 py-3"><span className={`rounded-md border px-2.5 py-0.5 text-[9px] font-bold ${cam.is_active ? 'border-green-100 bg-green-50 text-[#0D9D1B]' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>{cam.is_active ? 'AKTIF' : 'NON-AKTIF'}</span></td>
                    <td className="px-3 py-3 text-center"><div className="flex items-center justify-center gap-1"><button type="button" onClick={() => editCamera(cam)} aria-label={`Edit ${cam.camera_code}`} className="cursor-pointer rounded p-1 text-green-600 transition hover:bg-green-50"><Edit2 className="h-3.5 w-3.5" /></button><button type="button" onClick={() => onDeleteCamera(cam.id)} aria-label={`Hapus ${cam.camera_code}`} className="cursor-pointer rounded p-1 text-red-500 transition hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
