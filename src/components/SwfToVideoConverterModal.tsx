import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  X,
  Play,
  Square,
  Download,
  Settings,
  Sparkles,
  Film,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileCode2,
  RefreshCw
} from 'lucide-react';
import { LearningModule, ConversionConfig } from '../types';
import { saveCustomModule } from '../services/storage';

interface SwfToVideoConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: LearningModule[];
  initialSelectedModule?: LearningModule | null;
  onVideoAttachedToModule: (moduleId: string, videoBlobUrl: string, durationSeconds: number) => void;
}

export const SwfToVideoConverterModal: React.FC<SwfToVideoConverterModalProps> = ({
  isOpen,
  onClose,
  modules,
  initialSelectedModule,
  onVideoAttachedToModule,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    initialSelectedModule?.id || modules[0]?.id || ''
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Settings
  const [durationSecs, setDurationSecs] = useState<number>(10);
  const [fps, setFps] = useState<number>(30);
  const [resolution, setResolution] = useState<'480p' | '720p' | '1080p'>('720p');
  const [targetFormat, setTargetFormat] = useState<'mp4' | 'webm'>('mp4');

  // State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState<number>(0);
  const [convertedVideoUrl, setConvertedVideoUrl] = useState<string | null>(null);
  const [convertedVideoBlob, setConvertedVideoBlob] = useState<Blob | null>(null);
  const [isAttachedSuccess, setIsAttachedSuccess] = useState<boolean>(false);

  const currentModule = modules.find((m) => m.id === selectedModuleId) || modules[0];

  useEffect(() => {
    if (initialSelectedModule) {
      setSelectedModuleId(initialSelectedModule.id);
    }
  }, [initialSelectedModule]);

  // Dimensions based on resolution
  const getDims = () => {
    if (resolution === '1080p') return { w: 1920, h: 1080 };
    if (resolution === '720p') return { w: 1280, h: 720 };
    return { w: 854, h: 480 };
  };

  // Canvas animated renderer for the simulation being recorded
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const { w, h } = getDims();
    canvas.width = w;
    canvas.height = h;

    const renderFrame = () => {
      t += 0.04;

      // Dark studio background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Decorative Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Title Banner
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(currentModule ? currentModule.title : 'Simulasi Flash SWF', 40, 50);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Mata Pelajaran: ${currentModule?.subject || 'Fisika'} | WebAssembly Render Engine`, 40, 78);

      // Dynamic Simulation Graphics based on module type
      const cx = w / 2;
      const cy = h / 2 + 20;

      if (currentModule?.id === 'optik-lensa-cahaya') {
        // Draw Ray Optics simulation motion
        const osc = Math.sin(t) * 120;
        const objX = cx - 220 + osc;
        const focal = 140;

        // Axis
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(60, cy);
        ctx.lineTo(w - 60, cy);
        ctx.stroke();

        // Lens
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 30, 160, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Candle object
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(objX, cy);
        ctx.lineTo(objX, cy - 80);
        ctx.stroke();

        // Flame
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(objX, cy - 88, 10, 0, Math.PI * 2);
        ctx.fill();

        // Light Ray 1 (Red)
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(objX, cy - 80);
        ctx.lineTo(cx, cy - 80);
        ctx.lineTo(w - 100, cy + (80 * (w - 100 - cx)) / focal);
        ctx.stroke();

        // Light Ray 2 (Green)
        ctx.strokeStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(objX, cy - 80);
        ctx.lineTo(cx, cy);
        ctx.lineTo(w - 100, cy + (80 * (w - 100 - cx)) / (cx - objX));
        ctx.stroke();
      } else if (currentModule?.id === 'rangkaian-listrik-dc') {
        // Circuit loop animation
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 8;
        ctx.strokeRect(cx - 240, cy - 120, 480, 240);

        // Flowing electrons
        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < 20; i++) {
          const p = ((i * 70 + t * 90) % 1440);
          let ex = cx - 240;
          let ey = cy - 120;
          if (p < 480) { ex += p; ey = cy - 120; }
          else if (p < 720) { ex = cx + 240; ey += (p - 480); }
          else if (p < 1200) { ex = cx + 240 - (p - 720); ey = cy + 120; }
          else { ex = cx - 240; ey = cy + 120 - (p - 1200); }
          ctx.beginPath();
          ctx.arc(ex, ey, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Glowing Bulb in bottom center
        const glow = 30 + Math.sin(t * 3) * 15;
        const grad = ctx.createRadialGradient(cx, cy + 120, 5, cx, cy + 120, glow + 25);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy + 120, glow + 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy + 120, 24, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Generic / Solar Orbit / Biology animated representation
        const orbR = 140;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.ellipse(cx, cy, orbR + 40, orbR - 20, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sun
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.fill();

        // Planet
        const px = cx + (orbR + 40) * Math.cos(t);
        const py = cy + (orbR - 20) * Math.sin(t);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flash watermark on video
      ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('FLASHLearn SWF-to-Video Engine', 40, h - 35);

      animId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => cancelAnimationFrame(animId);
  }, [isOpen, selectedModuleId, resolution, currentModule]);

  if (!isOpen) return null;

  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    recordedChunksRef.current = [];
    setConvertedVideoUrl(null);
    setConvertedVideoBlob(null);
    setIsAttachedSuccess(false);

    try {
      // Capture stream from canvas
      const stream = canvas.captureStream(fps);

      // Determine supported mime type
      let mimeType = 'video/webm;codecs=vp9';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
        mimeType = 'video/mp4;codecs=avc1';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 3000000, // 3 Mbps HD quality
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(recordedChunksRef.current, {
          type: mimeType.includes('mp4') ? 'video/mp4' : 'video/webm',
        });
        const url = URL.createObjectURL(finalBlob);
        setConvertedVideoBlob(finalBlob);
        setConvertedVideoUrl(url);
        setIsRecording(false);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSecondsLeft(durationSecs);

      // Countdown timer
      let timeLeft = durationSecs;
      const interval = setInterval(() => {
        timeLeft -= 1;
        setRecordingSecondsLeft(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(interval);
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }
      }, 1000);
    } catch (err: any) {
      console.error('Failed to start MediaRecorder on canvas:', err);
      alert('Browser Anda tidak mendukung captureStream atau MediaRecorder: ' + err.message);
      setIsRecording(false);
    }
  };

  const stopRecordingManual = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const downloadVideo = () => {
    if (!convertedVideoUrl) return;
    const ext = targetFormat === 'mp4' ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = convertedVideoUrl;
    a.download = `${currentModule?.title.replace(/[\s\W]+/g, '_') || 'simulasi_flash'}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const attachVideoToCurrentModule = () => {
    if (!convertedVideoUrl || !currentModule) return;
    onVideoAttachedToModule(currentModule.id, convertedVideoUrl, durationSecs);
    setIsAttachedSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Studio Konversi SWF / Flash ke Video (MP4 / WebM)</h3>
              <p className="text-xs text-slate-400">Rekam dan ekspor simulasi kinetik Flash menjadi berkas video MP4 HD</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Module Selector & Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-slate-300 font-semibold">Pilih Materi / Berkas SWF untuk Dikonversi:</label>
              <select
                value={selectedModuleId}
                onChange={(e) => {
                  setSelectedModuleId(e.target.value);
                  setConvertedVideoUrl(null);
                  setIsAttachedSuccess(false);
                }}
                disabled={isRecording}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.subject}] {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Durasi Rekam:</label>
              <select
                value={durationSecs}
                onChange={(e) => setDurationSecs(Number(e.target.value))}
                disabled={isRecording}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value={5}>5 Detik (Cuplikan Cepat)</option>
                <option value={10}>10 Detik (Standar)</option>
                <option value={15}>15 Detik</option>
                <option value={30}>30 Detik (Lengkap)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Format Output:</label>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setTargetFormat('mp4')}
                  className={`flex-1 py-1 rounded text-center font-bold ${
                    targetFormat === 'mp4' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  MP4
                </button>
                <button
                  type="button"
                  onClick={() => setTargetFormat('webm')}
                  className={`flex-1 py-1 rounded text-center font-bold ${
                    targetFormat === 'webm' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  WebM
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Live Canvas or Converted Video Preview */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
            {convertedVideoUrl ? (
              <video
                src={convertedVideoUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
            ) : (
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain bg-slate-950"
              />
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 bg-rose-600/90 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xl animate-pulse">
                <span className="w-3 h-3 rounded-full bg-white"></span>
                <span>SEDANG MEREKAM KANVAS ({recordingSecondsLeft}s)</span>
              </div>
            )}
          </div>

          {/* Recording Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition"
                >
                  <Video className="w-4 h-4" />
                  <span>Mulai Rekam & Konversi ke {targetFormat.toUpperCase()}</span>
                </button>
              ) : (
                <button
                  onClick={stopRecordingManual}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Hentikan Rekaman Sekarang</span>
                </button>
              )}

              {convertedVideoUrl && (
                <button
                  onClick={downloadVideo}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File {targetFormat.toUpperCase()}</span>
                </button>
              )}
            </div>

            {convertedVideoUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={attachVideoToCurrentModule}
                  disabled={isAttachedSuccess}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    isAttachedSuccess
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isAttachedSuccess ? 'Video Terhubung ke Modul!' : 'Jadikan Video Resmi Modul Ini'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-850 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Tutup Studio Konversi
          </button>
        </div>
      </div>
    </div>
  );
};
