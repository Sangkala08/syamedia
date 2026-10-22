import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Camera,
  Layers,
  Settings,
  AlertCircle,
  ExternalLink,
  Cpu,
  Palette
} from 'lucide-react';
import { LearningModule, PlayerSettings } from '../types';
import { getSwfBlob, saveSwfBlob } from '../services/storage';
import { createValidSampleSwf } from '../services/sampleSwf';
import { LensSimulation } from './InteractiveSimulations/LensSimulation';
import { CircuitSimulation } from './InteractiveSimulations/CircuitSimulation';
import { FractionSimulation } from './InteractiveSimulations/FractionSimulation';
import { CellSimulation } from './InteractiveSimulations/CellSimulation';
import { OrbitSimulation } from './InteractiveSimulations/OrbitSimulation';
import { BohrSimulation } from './InteractiveSimulations/BohrSimulation';
import { TpaSimulation } from './InteractiveSimulations/TpaSimulation';

export interface ActiveSwfSource {
  title: string;
  sourceType: 'builtin_simulation' | 'external_url' | 'uploaded_blob';
  swfUrl?: string;
  blobKey?: string;
  fileName?: string;
}

interface RufflePlayerProps {
  module: LearningModule;
  onSnapshot?: (dataUrl: string) => void;
  activeSwfSource?: ActiveSwfSource | null;
  onSelectMainModuleSwf?: () => void;
}

// Global window declaration for Ruffle
declare global {
  interface Window {
    RufflePlayer?: {
      newest: () => {
        createPlayer: () => HTMLElement & {
          load: (config: { data?: ArrayBuffer | Uint8Array; url?: string; autoplay?: string; allowScriptAccess?: boolean }) => Promise<void>;
          play?: () => void;
          pause?: () => void;
          isPlaying?: () => boolean;
        };
      };
    };
  }
}

export const RufflePlayer: React.FC<RufflePlayerProps> = ({
  module,
  onSnapshot,
  activeSwfSource,
  onSelectMainModuleSwf,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement | null>(null);
  const rufflePlayerInstanceRef = useRef<any>(null);

  const currentSourceType = activeSwfSource ? activeSwfSource.sourceType : module.swfSourceType;
  const currentBlobKey = activeSwfSource ? activeSwfSource.blobKey : module.blobKey;
  const currentSwfUrl = activeSwfSource ? activeSwfSource.swfUrl : module.swfUrl;
  const currentFileName = activeSwfSource ? (activeSwfSource.fileName || activeSwfSource.title) : (module.fileName || 'flash_content.swf');
  const currentTitle = activeSwfSource ? activeSwfSource.title : module.title;
  const isPlayingSubtopic = Boolean(activeSwfSource && activeSwfSource.title !== module.title);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useFallbackSimulation, setUseFallbackSimulation] = useState<boolean>(
    (currentSourceType === 'builtin_simulation') && !currentBlobKey && !currentSwfUrl
  );
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  const [settings, setSettings] = useState<PlayerSettings>({
    aspectRatio: '4:3',
    scaleMode: 'showAll',
    bgColor: '#0f172a',
    volume: 80,
    isMuted: false,
  });

  // Track Fullscreen state
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!playerWrapperRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await playerWrapperRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.error('Fullscreen request error:', e);
    }
  };

  // Initialize and load SWF into Ruffle Player
  const loadSwfContent = useCallback(async () => {
    if (useFallbackSimulation && !currentBlobKey && !currentSwfUrl) return;
    setLoading(true);
    setErrorMessage(null);

    // Clean up existing player in container
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    try {
      // Check Ruffle availability
      if (typeof window.RufflePlayer === 'undefined' || !window.RufflePlayer.newest) {
        throw new Error('Engine WebAssembly Ruffle sedang dimuat atau diblokir oleh browser. Anda dapat menggunakan mode Simulasi Interaktif bawaan.');
      }

      const ruffle = window.RufflePlayer.newest();
      const player = ruffle.createPlayer();
      rufflePlayerInstanceRef.current = player;

      if (containerRef.current) {
        containerRef.current.appendChild(player);
      }

      // Load binary or URL
      if (currentSourceType === 'uploaded_blob' && currentBlobKey) {
        let blob = await getSwfBlob(currentBlobKey);
        if (!blob) {
          blob = createValidSampleSwf(currentFileName || 'materi.swf', '#0F172A');
          await saveSwfBlob(currentBlobKey, blob);
        }
        const buffer = await blob.arrayBuffer();
        await player.load({
          data: buffer,
          autoplay: 'on',
          allowScriptAccess: true,
        });
        setUseFallbackSimulation(false);
      } else if (currentSwfUrl) {
        await player.load({
          url: currentSwfUrl,
          autoplay: 'on',
          allowScriptAccess: true,
        });
        setUseFallbackSimulation(false);
      } else {
        // Builtin fallback to simulation if no SWF data
        setUseFallbackSimulation(true);
      }
      setIsPlaying(true);
    } catch (err: any) {
      console.warn('Ruffle load notice:', err);
      setErrorMessage(err.message || 'Gagal memuat file SWF dengan Ruffle.');
      // Auto fallback to interactive simulation if available
      if (currentSourceType === 'builtin_simulation' || !currentBlobKey) {
        setUseFallbackSimulation(true);
      }
    } finally {
      setLoading(false);
    }
  }, [currentSourceType, currentBlobKey, currentSwfUrl, useFallbackSimulation]);

  useEffect(() => {
    if (!useFallbackSimulation) {
      loadSwfContent();
    }
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      rufflePlayerInstanceRef.current = null;
    };
  }, [loadSwfContent, useFallbackSimulation]);

  const handlePlayPause = () => {
    if (rufflePlayerInstanceRef.current) {
      try {
        if (isPlaying) {
          rufflePlayerInstanceRef.current.pause?.();
          setIsPlaying(false);
        } else {
          rufflePlayerInstanceRef.current.play?.();
          setIsPlaying(true);
        }
      } catch (e) {
        setIsPlaying(!isPlaying);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    if (!useFallbackSimulation) {
      loadSwfContent();
    }
  };

  const takeSnapshot = () => {
    // Look for canvas inside player
    if (!playerWrapperRef.current) return;
    const canvas = playerWrapperRef.current.querySelector('canvas');
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        if (onSnapshot) {
          onSnapshot(dataUrl);
        }
        // Trigger quick download
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `snapshot_${module.id}_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error('Snapshot failed (CORS or canvas security):', err);
      }
    }
  };

  // Select which built-in simulation to render
  const renderBuiltinSimulation = () => {
    if (module.id === 'tpa-master' || module.subject === 'TPA & Logika') {
      return <TpaSimulation />;
    }
    switch (module.id) {
      case 'optik-lensa-cahaya':
        return <LensSimulation />;
      case 'rangkaian-listrik-dc':
        return <CircuitSimulation />;
      case 'matematika-pecahan-geometri':
        return <FractionSimulation />;
      case 'biologi-anatomi-sel':
        return <CellSimulation />;
      case 'astronomi-tata-surya':
        return <OrbitSimulation />;
      case 'kimia-ikatan-atom-bohr':
        return <BohrSimulation />;
      default:
        return <TpaSimulation />;
    }
  };

  // Aspect ratio class
  const getAspectRatioStyle = () => {
    if (settings.aspectRatio === '4:3') return 'aspect-[4/3]';
    if (settings.aspectRatio === '16:9') return 'aspect-[16/9]';
    return 'h-[500px] w-full';
  };

  return (
    <div
      ref={playerWrapperRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex flex-col shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''
      }`}
      style={{ backgroundColor: settings.bgColor }}
    >
      {/* Top Player Status Header */}
      <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300 z-20">
        <div className="flex items-center gap-2 truncate">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
          <span className="font-bold text-white truncate">{currentTitle}</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 font-mono">
            {currentFileName}
          </span>
          {isPlayingSubtopic && onSelectMainModuleSwf && (
            <button
              onClick={onSelectMainModuleSwf}
              className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/40 transition shrink-0 ml-1"
              title="Kembali memutar SWF modul utama"
            >
              ← Putar SWF Modul Utama
            </button>
          )}
        </div>

        {/* Engine Switcher (Builtin Simulation vs Pure Ruffle SWF) */}
        {module.swfSourceType === 'builtin_simulation' && (
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setUseFallbackSimulation(true)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                useFallbackSimulation
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Simulasi Interaktif
            </button>
            <button
              onClick={() => {
                setUseFallbackSimulation(false);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                !useFallbackSimulation
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ruffle WebAssembly
            </button>
          </div>
        )}
      </div>

      {/* Main Flash Stage / Simulation Canvas Container */}
      <div
        className={`relative flex-1 w-full flex items-center justify-center overflow-hidden min-h-[380px] ${
          !isFullscreen ? getAspectRatioStyle() : 'h-full'
        }`}
      >
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur z-30 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-amber-300">Menginisialisasi Engine Ruffle Flash & Memuat SWF...</p>
          </div>
        )}

        {errorMessage && !useFallbackSimulation && (
          <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
            <h4 className="text-base font-bold text-white mb-1">Pemberitahuan Emulator Flash</h4>
            <p className="text-xs text-slate-300 max-w-md mb-4 leading-relaxed">{errorMessage}</p>
            {module.swfSourceType === 'builtin_simulation' && (
              <button
                onClick={() => setUseFallbackSimulation(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg"
              >
                Gunakan Simulasi Interaktif Bawaan (Rekomendasi)
              </button>
            )}
          </div>
        )}

        {/* If using built-in interactive reproduction */}
        {useFallbackSimulation ? (
          <div className="w-full h-full flex flex-col">{renderBuiltinSimulation()}</div>
        ) : (
          /* Pure Ruffle Player DOM container */
          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center"
            style={{
              backgroundColor: settings.bgColor,
            }}
          />
        )}
      </div>

      {/* Modern Flash Control Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between z-20">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow"
            title={isPlaying ? 'Jeda (Pause)' : 'Putar (Play)'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={handleRestart}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Muat Ulang / Restart SWF"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Volume button */}
          <button
            onClick={() => setSettings(s => ({ ...s, isMuted: !s.isMuted }))}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={settings.isMuted ? 'Nyalakan Audio' : 'Bisukan Audio'}
          >
            {settings.isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Snapshot button */}
          <button
            onClick={takeSnapshot}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            title="Ambil Tangkapan Layar (Screenshot)"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span>Snapshot</span>
          </button>
        </div>

        {/* Aspect Ratio & Settings & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Aspect Ratio Toggle */}
          <div className="hidden sm:flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800 text-[11px]">
            <button
              onClick={() => setSettings(s => ({ ...s, aspectRatio: '4:3' }))}
              className={`px-2 py-0.5 rounded transition ${
                settings.aspectRatio === '4:3' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400'
              }`}
              title="Rasio Standar Flash 4:3"
            >
              4:3
            </button>
            <button
              onClick={() => setSettings(s => ({ ...s, aspectRatio: '16:9' }))}
              className={`px-2 py-0.5 rounded transition ${
                settings.aspectRatio === '16:9' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400'
              }`}
              title="Rasio Layar Lebar 16:9"
            >
              16:9
            </button>
            <button
              onClick={() => setSettings(s => ({ ...s, aspectRatio: 'fit' }))}
              className={`px-2 py-0.5 rounded transition ${
                settings.aspectRatio === 'fit' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400'
              }`}
              title="Isi Penuh Wadah (Fit)"
            >
              Fit
            </button>
          </div>

          {/* Color theme selector */}
          <button
            onClick={() =>
              setSettings(s => ({
                ...s,
                bgColor: s.bgColor === '#0f172a' ? '#808080' : s.bgColor === '#808080' ? '#000000' : '#0f172a',
              }))
            }
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={`Ubah Latar Player (Saat ini: ${settings.bgColor})`}
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`p-2 rounded-lg transition ${
              showSettingsDrawer ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Informasi & Pengaturan Teknis SWF"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Settings & Diagnostic Drawer */}
      {showSettingsDrawer && (
        <div className="bg-slate-900 border-t border-slate-800 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in slide-in-from-bottom duration-200 z-30">
          <div className="space-y-1.5">
            <h5 className="font-bold text-amber-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Spesifikasi Berkas Flash
            </h5>
            <div className="text-slate-400 space-y-1">
              <div>Nama File: <span className="text-slate-200 font-mono">{module.fileName || 'materi_pembelajaran.swf'}</span></div>
              <div>Ukuran File: <span className="text-slate-200 font-mono">{module.fileSizeBytes ? `${(module.fileSizeBytes / 1024).toFixed(1)} KB` : '420 KB'}</span></div>
              <div>Flash Player Target: <span className="text-slate-200">v{module.flashVersion || 8} (Macromedia/Adobe)</span></div>
              <div>ActionScript: <span className="text-slate-200">{module.actionScriptVersion || 'AS 2.0 (AVM1)'}</span></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-bold text-sky-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Engine Emulasi Ruffle
            </h5>
            <div className="text-slate-400 space-y-1">
              <div>Runtime: <span className="text-emerald-400 font-semibold">WebAssembly (WASM)</span></div>
              <div>Renderer: <span className="text-slate-200">WebGL / Canvas 2D</span></div>
              <div>Audio Engine: <span className="text-slate-200">Web Audio API (44.1kHz)</span></div>
              <div>Mode Keamanan: <span className="text-emerald-400 font-semibold">Sandboxed Browser</span></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-bold text-slate-200">Warna Latar Kanvas Flash</h5>
            <div className="flex gap-2 pt-1">
              {[
                { label: 'Gelap', color: '#0f172a' },
                { label: 'Abu Flash', color: '#808080' },
                { label: 'Hitam', color: '#000000' },
                { label: 'Putih', color: '#ffffff' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setSettings(s => ({ ...s, bgColor: c.color }))}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                    settings.bgColor === c.color ? 'border-amber-400 text-amber-400' : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 pt-1">
              Gunakan abu-abu standar untuk berkas Flash lawas (Macromedia MX).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
