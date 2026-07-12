import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { CameraOff, WifiOff, AlertTriangle } from 'lucide-react';
import { api } from '../../api/api';

export const CctvView = ({ token, streamUrl, isCameraOnline = true }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hlsRef = useRef(null);
  
  const [status, setStatus] = useState('idle'); // idle | loading | playing | error
  const [predictions, setPredictions] = useState([]);

  // HLS/Stream source loader
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setStatus('idle');
    setPredictions([]);
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

  // Frame capture and inference caller
  useEffect(() => {
    if (status !== 'playing' || !token || !isCameraOnline) {
      setPredictions([]);
      return;
    }

    const video = videoRef.current;
    let isMounted = true;

    // Offscreen canvas to capture a smaller representation (640x360) of the current video frame
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 640;
    offscreenCanvas.height = 360;
    const offCtx = offscreenCanvas.getContext('2d');

    const captureAndDetect = async () => {
      if (!video || video.paused || video.ended) return;

      try {
        // Draw video frame to offscreen canvas
        offCtx.drawImage(video, 0, 0, 640, 360);
        
        // Convert to base64 jpeg with 0.75 quality for small footprint
        const base64Image = offscreenCanvas.toDataURL('image/jpeg', 0.75);

        // Request prediction from AI proxy endpoint
        const response = await api.detect(token, base64Image);
        if (response.ok) {
          const res = await response.json();
          if (isMounted && res.status === 'success') {
            setPredictions(res.data?.raw_predictions || []);
          }
        }
      } catch (err) {
        console.error('AI frame detection error:', err);
      }
    };

    // Trigger detection every 3 seconds
    const interval = setInterval(captureAndDetect, 3000);
    // Trigger first frame detection after HLS buffer plays for 1 second
    const timeout = setTimeout(captureAndDetect, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [status, token, streamUrl, isCameraOnline]);

  // Bounding box canvas drawer
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || status !== 'playing' || !isCameraOnline) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    
    // Set drawing canvas size to match display size of video element
    const clientWidth = video.clientWidth;
    const clientHeight = video.clientHeight;
    canvas.width = clientWidth;
    canvas.height = clientHeight;

    ctx.clearRect(0, 0, clientWidth, clientHeight);

    if (predictions.length === 0) return;

    // Helper for color coding classes
    const getClassColor = (name) => {
      switch (name?.toLowerCase()) {
        case 'aktif':
          return '#0D9D1B'; // Emerald Green
        case 'pasif':
          return '#0284C7'; // Ocean Blue
        case 'agresif':
          return '#EF4444'; // Aggressive Red
        case 'makan':
          return '#EAB308'; // Feeding Yellow
        default:
          return '#10B981'; // Default Emerald
      }
    };

    // Calculate scale and offset offsets for letterboxing/cropping (object-fit: cover math)
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 360;

    const videoRatio = videoWidth / videoHeight;
    const clientRatio = clientWidth / clientHeight;

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    if (videoRatio > clientRatio) {
      // Video is wider than container (object-cover matches clientHeight)
      scale = clientHeight / videoHeight;
      offsetX = (clientWidth - videoWidth * scale) / 2;
    } else {
      // Video is taller than container (object-cover matches clientWidth)
      scale = clientWidth / videoWidth;
      offsetY = (clientHeight - videoHeight * scale) / 2;
    }

    predictions.forEach((pred) => {
      // Model predictions are relative to 640x360 offscreen frame sizes
      const sourceX = (pred.x / 640) * videoWidth;
      const sourceY = (pred.y / 360) * videoHeight;
      const sourceW = (pred.width / 640) * videoWidth;
      const sourceH = (pred.height / 360) * videoHeight;

      // Top-left coordinate conversion
      const srcLeft = sourceX - sourceW / 2;
      const srcTop = sourceY - sourceH / 2;

      // Map to visible canvas coordinates
      const left = srcLeft * scale + offsetX;
      const top = srcTop * scale + offsetY;
      const width = sourceW * scale;
      const height = sourceH * scale;

      const color = getClassColor(pred.class);

      // 1. Draw outer boundary box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(left, top, width, height);

      // 2. Draw label banner
      const confidencePercent = Math.round(pred.confidence * 100);
      const labelText = `${pred.class.toUpperCase()} (${confidencePercent}%)`;

      ctx.font = 'bold 11px font-mono, monospace, sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      
      ctx.fillStyle = color;
      ctx.fillRect(left - 1.25, top - 17, textWidth + 8, 17);

      // 3. Draw text over banner
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(labelText, left + 3, top - 4);
    });
  }, [predictions, status]);

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden select-none ring-1 ring-slate-800 rounded-lg shadow-inner" style={{ minHeight: '100%' }}>
      <video
        ref={videoRef}
        className={`w-full h-full object-cover outline-none ${status === 'playing' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
        muted
        playsInline
        autoPlay
        loop
        crossOrigin="anonymous"
      />

      {/* Render Canvas Overlay on top of playing video element */}
      {status === 'playing' && (
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        />
      )}

      {/* ─── LOADING STATE ───────────────────────────────────────── */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 gap-2.5">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-[#0D9D1B] rounded-full animate-spin" />
          <span className="text-[10px] text-slate-400 font-sans">Menghubungkan live stream...</span>
        </div>
      )}

      {/* ─── IDLE STATE / OFFLINE TOGGLE ─────────────────────────── */}
      {(status === 'idle' || !isCameraOnline) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-20 p-6">
          <WifiOff className="h-8 w-8 text-slate-350 mb-2" />
          <div className="text-center">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Camera OFF</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Kamera tidak aktif. Aktifkan koneksi kamera pada panel kontrol di atas untuk melihat siaran langsung.
            </p>
          </div>
        </div>
      )}

      {/* ─── ERROR STATE ────────────────────────────────────────── */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-6">
          <CameraOff className="h-8 w-8 text-red-400 mb-2" />
          <div className="text-center px-4">
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Koneksi Stream Gagal</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
              Gagal memuat segmen video. Silakan periksa URL stream atau status jaringan Anda.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
