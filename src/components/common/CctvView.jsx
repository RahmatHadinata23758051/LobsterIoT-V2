import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { CameraOff, WifiOff, Cpu, Scan, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../api/api';

export const CctvView = ({ token, streamUrl, isCameraOnline = true }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hlsRef = useRef(null);
  
  const [status, setStatus] = useState('idle'); // idle | loading | playing | error
  const [predictions, setPredictions] = useState([]);
  const [aiStatusText, setAiStatusText] = useState('YOLOv8 CONNECTING...');
  const [isAiConnected, setIsAiConnected] = useState(false);

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
      video.onloadeddata = () => {
        setStatus('playing');
        video.play().catch(() => {});
      };
      video.onerror = () => {
        video.play().then(() => setStatus('playing')).catch(() => setStatus('error'));
      };
      video.play().then(() => setStatus('playing')).catch(() => {});
    } else {
      setStatus('error');
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [streamUrl]);

  // Frame capture and REAL YOLOv8 inference caller
  useEffect(() => {
    if (status !== 'playing' || !isCameraOnline) {
      setPredictions([]);
      setAiStatusText('OFFLINE');
      setIsAiConnected(false);
      return;
    }

    const video = videoRef.current;
    let isMounted = true;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 640;
    offscreenCanvas.height = 360;
    const offCtx = offscreenCanvas.getContext('2d');

    const captureAndDetect = async () => {
      if (!video || video.paused || video.ended) return;

      try {
        offCtx.drawImage(video, 0, 0, 640, 360);
        const base64Image = offscreenCanvas.toDataURL('image/jpeg', 0.75);

        const response = await api.detect(token || '', base64Image);
        if (response.ok) {
          const res = await response.json();
          if (isMounted && res.status === 'success') {
            const rawPreds = res.data?.raw_predictions || [];
            setPredictions(rawPreds);
            setAiStatusText(`YOLOv8 LIVE (${rawPreds.length} DETECTED)`);
            setIsAiConnected(true);
            return;
          }
        }
      } catch (err) {
        console.error('YOLO inference error:', err);
      }

      // If AI proxy server is offline / error
      if (isMounted) {
        setPredictions([]);
        setAiStatusText('AI SERVER DISCONNECTED (Jalankan main.py)');
        setIsAiConnected(false);
      }
    };

    const interval = setInterval(captureAndDetect, 2000);
    const timeout = setTimeout(captureAndDetect, 500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [status, token, streamUrl, isCameraOnline]);

  // Universal Bounding box canvas drawer
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
    
    const clientWidth = video.clientWidth || 640;
    const clientHeight = video.clientHeight || 360;
    canvas.width = clientWidth;
    canvas.height = clientHeight;

    ctx.clearRect(0, 0, clientWidth, clientHeight);

    if (predictions.length === 0) return;

    // Helper for color coding classes
    const getClassColor = (name) => {
      switch (String(name).toLowerCase()) {
        case 'aktif':
        case 'active':
        case 'lobster_aktif':
          return '#0D9D1B'; // Emerald Green
        case 'pasif':
        case 'passive':
        case 'lobster_pasif':
          return '#0284C7'; // Ocean Blue
        case 'agresif':
        case 'aggressive':
          return '#EF4444'; // Red
        case 'makan':
        case 'feeding':
          return '#EAB308'; // Yellow
        default:
          return '#0D9D1B'; // Default Emerald
      }
    };

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 360;

    const videoRatio = videoWidth / videoHeight;
    const clientRatio = clientWidth / clientHeight;

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    if (videoRatio > clientRatio) {
      scale = clientHeight / videoHeight;
      offsetX = (clientWidth - videoWidth * scale) / 2;
    } else {
      scale = clientWidth / videoWidth;
      offsetY = (clientHeight - videoHeight * scale) / 2;
    }

    predictions.forEach((pred) => {
      // Parse coordinates from YOLOv8 JSON format (Center-XYWH, Normalized 0..1, or BBox Array)
      let rawX = 0, rawY = 0, rawW = 0, rawH = 0;
      let label = pred.class || pred.label || pred.class_name || pred.name || 'lobster';
      let confidence = pred.confidence ?? pred.score ?? pred.prob ?? 0.90;

      if (Array.isArray(pred.bbox) && pred.bbox.length === 4) {
        // Format [x1, y1, x2, y2] or [x, y, w, h]
        const [b0, b1, b2, b3] = pred.bbox;
        if (b2 > b0 && b3 > b1) {
          rawW = b2 - b0;
          rawH = b3 - b1;
          rawX = b0 + rawW / 2;
          rawY = b1 + rawH / 2;
        } else {
          rawX = b0 + b2 / 2;
          rawY = b1 + b3 / 2;
          rawW = b2;
          rawH = b3;
        }
      } else {
        // Standard X, Y, Width, Height from main.py (xywh)
        rawX = pred.x ?? pred.x_center ?? pred.x_min ?? 320;
        rawY = pred.y ?? pred.y_center ?? pred.y_min ?? 180;
        rawW = pred.width ?? pred.w ?? 120;
        rawH = pred.height ?? pred.h ?? 80;
      }

      // Check if normalized 0..1 scale
      if (rawX <= 1.0 && rawW <= 1.0) {
        rawX *= 640;
        rawY *= 360;
        rawW *= 640;
        rawH *= 360;
      }

      // Model predictions are relative to 640x360 frame sizes
      const sourceX = (rawX / 640) * videoWidth;
      const sourceY = (rawY / 360) * videoHeight;
      const sourceW = (rawW / 640) * videoWidth;
      const sourceH = (rawH / 360) * videoHeight;

      // Top-left coordinate conversion
      const srcLeft = sourceX - sourceW / 2;
      const srcTop = sourceY - sourceH / 2;

      // Map to visible canvas coordinates
      const left = srcLeft * scale + offsetX;
      const top = srcTop * scale + offsetY;
      const width = sourceW * scale;
      const height = sourceH * scale;

      const color = getClassColor(label);

      // 1. Semi-transparent bounding box background fill
      ctx.fillStyle = `${color}25`;
      ctx.fillRect(left, top, width, height);

      // 2. Draw outer boundary box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(left, top, width, height);

      // 3. Draw Corner Bracket Accents (Military / AI Targeting Box Style)
      const cornerLen = Math.min(12, width / 4);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;

      // Top-Left corner
      ctx.beginPath();
      ctx.moveTo(left, top + cornerLen);
      ctx.lineTo(left, top);
      ctx.lineTo(left + cornerLen, top);
      ctx.stroke();

      // Bottom-Right corner
      ctx.beginPath();
      ctx.moveTo(left + width - cornerLen, top + height);
      ctx.lineTo(left + width, top + height);
      ctx.lineTo(left + width, top + height - cornerLen);
      ctx.stroke();

      // 4. Draw label banner
      const confidencePercent = Math.round(confidence * 100);
      const labelText = `${String(label).toUpperCase()} (${confidencePercent}%)`;

      ctx.font = 'bold 10px font-mono, monospace, sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      
      ctx.fillStyle = color;
      ctx.fillRect(left - 1, top - 18, textWidth + 10, 18);

      // 5. Draw text over banner
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(labelText, left + 4, top - 5);
    });
  }, [predictions, status, isCameraOnline]);

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden select-none ring-1 ring-slate-800 rounded-lg shadow-inner" style={{ minHeight: '100%' }}>
      <video
        ref={videoRef}
        className={`w-full h-full object-cover outline-none ${status === 'playing' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
        muted
        playsInline
        autoPlay
        loop
      />

      {/* Render Canvas Overlay on top of playing video element */}
      {status === 'playing' && (
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        />
      )}

      {/* ─── LIVE AI HUD BADGE (TOP RIGHT) ────────────────────────── */}
      {status === 'playing' && isCameraOnline && (
        <div className={`absolute top-3 right-3 z-20 backdrop-blur-xs border px-2.5 py-1 rounded-lg flex items-center gap-2 text-[10px] font-bold shadow-md ${
          isAiConnected
            ? 'bg-slate-900/85 border-slate-700 text-white'
            : 'bg-amber-950/85 border-amber-800 text-amber-200'
        }`}>
          <Cpu className={`w-3.5 h-3.5 ${isAiConnected ? 'text-[#0D9D1B] animate-pulse' : 'text-amber-400'}`} />
          <span className="font-mono">{aiStatusText}</span>
        </div>
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
