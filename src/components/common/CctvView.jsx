import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { CameraOff, WifiOff, Lock, Unlock, AlertTriangle } from 'lucide-react';

export const CctvView = ({ streamUrl }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  
  const [status, setStatus] = useState('idle'); // idle | loading | playing | error
  const [zoom, setZoom] = useState(1.0);
  const [ptzLocked, setPtzLocked] = useState(true);
  const [timestamp, setTimestamp] = useState('');

  // Ticking timestamp for CCTV HUD
  useEffect(() => {
    const iv = setInterval(() => {
      const d = new Date();
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      const hr = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      const se = String(d.getSeconds()).padStart(2, '0');
      const ms = String(d.getMilliseconds()).padStart(3, '0');
      setTimestamp(`${yr}-${mo}-${dy} ${hr}:${mi}:${se}.${ms}`);
    }, 45); // high frequency millisecond update
    return () => clearInterval(iv);
  }, []);

  // HLS stream listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setStatus('idle');
    if (!streamUrl) return;

    setStatus('loading');

    // Destroy previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('/hls/');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ maxMaxBufferLength: 10, lowLatencyMode: true, enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus('playing');
        video.muted = true;
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else { setStatus('error'); hls.destroy(); }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHls) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setStatus('playing');
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => setStatus('error'));
    } else if (!isHls) {
      // Direct stream / MP4 video files
      video.src = streamUrl;
      setStatus('playing');
      video.play().catch(() => {});
    } else {
      setStatus('error');
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [streamUrl]);

  // Zoom control handlers
  const zoomIn = () => setZoom(z => Math.min(4.0, z + 0.5));
  const zoomOut = () => setZoom(z => Math.max(1.0, z - 0.5));
  const togglePtzLock = () => setPtzLocked(!ptzLocked);

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden select-none" style={{ minHeight: '100%' }}>
      
      {/* Actual Video Canvas */}
      <video
        ref={videoRef}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className={`w-full h-full object-cover ${status === 'playing' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
        muted
        playsInline
        autoPlay
      />

      {/* ─── HUD OVERLAY CHASSIS ─────────────────────────────────── */}
      {status === 'playing' && (
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between font-mono text-[10px] text-emerald-400/80">
          
          {/* L-shaped corner brackets */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-400/40" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-400/40" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-400/40" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-400/40" />

          {/* Center crosshair */}
          <div className="absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2 border border-dashed border-emerald-400/20 rounded-full flex items-center justify-center">
            <div className="w-1 h-px bg-emerald-400/50" />
            <div className="h-1 w-px bg-emerald-400/50 absolute" />
          </div>

          {/* Top Info Bar */}
          <div className="flex items-start justify-between w-full z-10">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span>CCTV_STREAM_01</span>
              </div>
              <div className="text-[9px] text-slate-500 font-bold">1080P · H.264 · 24fps</div>
            </div>
            <div className="text-right text-emerald-300 font-bold tracking-widest">{timestamp}</div>
          </div>

          {/* Bottom Info Bar & Floating controls */}
          <div className="flex items-end justify-between w-full z-10">
            <div className="flex flex-col gap-0.5 text-slate-400">
              <div>LATENCY: <span className="text-emerald-400">120ms (LOW)</span></div>
              <div>DECODER: <span className="text-emerald-400">GPU-ACCEL</span></div>
            </div>

            {/* PTZ Zoom Mock Panel (Clickable Controls) */}
            <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl p-1 pointer-events-auto shadow-lg" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={zoomOut}
                disabled={zoom <= 1.0}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
                title="Zoom Out"
              >
                <span className="font-extrabold text-sm leading-none">-</span>
              </button>
              <div className="text-[9px] font-bold text-emerald-400 px-1 min-w-[32px] text-center font-mono">
                {zoom.toFixed(1)}x
              </div>
              <button
                onClick={zoomIn}
                disabled={zoom >= 4.0}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
                title="Zoom In"
              >
                <span className="font-extrabold text-sm leading-none">+</span>
              </button>
              <div className="w-px h-4 bg-slate-850 mx-0.5" />
              <button
                onClick={togglePtzLock}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-450 hover:text-white transition cursor-pointer"
                title={ptzLocked ? "Unlock PTZ Lock" : "Lock PTZ"}
              >
                {ptzLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5 text-amber-500" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LOADING STATE ───────────────────────────────────────── */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-3">
          <div className="w-7 h-7 border-2 border-[#22C55E]/30 border-t-[#22C55E] rounded-full animate-spin" />
          <span className="text-[10px] text-slate-500 font-mono tracking-wider">Menghubungkan stream dekoder HLS...</span>
        </div>
      )}

      {/* ─── IDLE STATE (No URL) ─────────────────────────────────── */}
      {status === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6">
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-800" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-800" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-800" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-800" />
          
          <div className="absolute top-4 right-4 font-mono text-[9px] text-slate-700 tracking-wider">
            {timestamp}
          </div>

          <WifiOff className="h-10 w-10 text-slate-800 mb-3" />
          <div className="text-center">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Kamera Offline</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Tidak ada feed HLS aktif terdeteksi. Silakan pilih node IoT aktif yang memiliki perangkat kamera terhubung.
            </p>
          </div>
        </div>
      )}

      {/* ─── ERROR STATE ────────────────────────────────────────── */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6">
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-red-950" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-red-950" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-red-950" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-red-950" />

          <div className="absolute top-4 right-4 font-mono text-[9px] text-red-700 tracking-wider">
            {timestamp}
          </div>

          <CameraOff className="h-10 w-10 text-red-950 mb-3 animate-pulse" />
          <div className="text-center px-4">
            <p className="text-xs font-black text-red-500 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span>Koneksi Stream Gagal</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
              Decoder HLS gagal memuat segmen video. Pastikan MediaMTX server aktif dan stream URL dapat diakses.
            </p>
            <code className="block text-[8px] text-slate-500 font-mono mt-2 bg-slate-900 border border-slate-850 px-2.5 py-1 rounded max-w-[240px] truncate mx-auto">
              {streamUrl}
            </code>
          </div>
        </div>
      )}
    </div>
  );
};
