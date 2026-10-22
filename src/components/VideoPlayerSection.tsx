import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  Gauge,
  Film,
  Plus,
  Trash2,
  Upload,
  Link as LinkIcon,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { LearningModule, UserProgress } from '../types';
import { saveVideoProgress } from '../services/storage';

interface VideoPlayerSectionProps {
  module: LearningModule;
  progress?: UserProgress;
  onProgressUpdated: (updated: UserProgress) => void;
  onModuleVideoUpdated?: (moduleId: string, videoUrl?: string, title?: string, duration?: number) => void;
  userRole?: 'siswa' | 'guru' | 'admin';
}

export const VideoPlayerSection: React.FC<VideoPlayerSectionProps> = ({
  module,
  progress,
  onProgressUpdated,
  onModuleVideoUpdated,
  userRole = 'siswa',
}) => {
  const isTeacherOrAdmin = userRole === 'guru' || userRole === 'admin';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(module.videoDurationSeconds || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Teacher video upload / link state
  const [showAddVideoForm, setShowAddVideoForm] = useState<boolean>(false);
  const [newVideoUrl, setNewVideoUrl] = useState<string>('');
  const [newVideoTitle, setNewVideoTitle] = useState<string>('');
  const [addVideoError, setAddVideoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Speeds requested by user: 1.0, 1.25, 1.5, 2.0
  const speedOptions = [1.0, 1.25, 1.5, 2.0];

  const hasTeacherVideo = Boolean(module.videoUrl && module.videoAddedByTeacher);

  // Resume from previous watch position if video exists
  useEffect(() => {
    if (hasTeacherVideo && videoRef.current && progress?.videoWatchedSeconds && !progress.videoCompleted) {
      videoRef.current.currentTime = progress.videoWatchedSeconds;
    }
  }, [module.id, hasTeacherVideo]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || module.videoDurationSeconds || 1;
    setCurrentTime(cur);
    setDuration(dur);

    // Save progress periodically or upon reaching 90%
    const percent = Math.min(100, Math.round((cur / dur) * 100));
    if (Math.abs(cur - (progress?.videoWatchedSeconds || 0)) > 5 || percent >= 90) {
      const updated = saveVideoProgress(module.id, cur, dur);
      onProgressUpdated(updated);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    const dur = videoRef.current?.duration || module.videoDurationSeconds || 1;
    const updated = saveVideoProgress(module.id, dur, dur);
    onProgressUpdated(updated);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      const updated = saveVideoProgress(module.id, videoRef.current.currentTime, videoRef.current.duration || duration);
      onProgressUpdated(updated);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleToggleCompleted = () => {
    const isCompleted = !progress?.videoCompleted;
    const targetTime = isCompleted ? duration || 60 : 0;
    const updated = saveVideoProgress(module.id, targetTime, duration || 60);
    onProgressUpdated(updated);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSaveTeacherVideoUrl = () => {
    if (!newVideoUrl.trim()) {
      setAddVideoError('Masukkan URL video pembelajaran yang valid');
      return;
    }
    const finalTitle = newVideoTitle.trim() || `Video Penjelasan: ${module.title}`;
    if (onModuleVideoUpdated) {
      onModuleVideoUpdated(module.id, newVideoUrl.trim(), finalTitle, 300);
    }
    setShowAddVideoForm(false);
    setNewVideoUrl('');
    setNewVideoTitle('');
    setAddVideoError(null);
  };

  const handleTeacherFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setAddVideoError('Harap pilih berkas video (MP4, WebM, dsb.)');
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    const finalTitle = newVideoTitle.trim() || file.name.replace(/\.[^/.]+$/, '');

    if (onModuleVideoUpdated) {
      onModuleVideoUpdated(module.id, blobUrl, finalTitle, 180);
    }
    setShowAddVideoForm(false);
    setAddVideoError(null);
  };

  const handleRemoveTeacherVideo = () => {
    if (window.confirm('Hapus video pengajar ini dari modul?')) {
      if (onModuleVideoUpdated) {
        onModuleVideoUpdated(module.id, undefined, undefined, undefined);
      }
    }
  };

  // IF NO VIDEO ADDED BY TEACHER:
  if (!hasTeacherVideo) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 space-y-6 shadow-xl">
        <div className="max-w-xl mx-auto text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">
            Belum Ada Video dari Pengajar
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {isTeacherOrAdmin
              ? 'Materi ini belum memiliki video pembahasan resmi. Sebagai guru/admin, Anda dapat mengunggah berkas video MP4/WebM atau memasukkan tautan Google Drive/URL di bawah ini.'
              : 'Guru pengajar belum menambahkan video pembahasan resmi untuk modul ini. Silakan eksplorasi praktikum melalui simulasi Flash interaktif dan pelajari kurikulum pada tab Submateri.'}
          </p>

          {isTeacherOrAdmin && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setShowAddVideoForm(!showAddVideoForm)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddVideoForm ? 'Tutup Formulir' : 'Tambahkan Video Pengajar (MP4/URL)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Form to add teacher video */}
        {showAddVideoForm && (
          <div className="max-w-xl mx-auto bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Unggah / Tautkan Video Pembahasan Resmi Pengajar</span>
            </div>

            {addVideoError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addVideoError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Judul Video Pengajar:</label>
                <input
                  type="text"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  placeholder={`Contoh: Video Penjelasan Konsep ${module.title}`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">URL Video Langsung (MP4 / WebM / Link Drive):</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://.../video.mp4"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTeacherVideoUrl}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl whitespace-nowrap"
                  >
                    Simpan Video
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <span className="text-slate-500 text-[11px]">ATAU</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="video/*"
                  onChange={handleTeacherFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pilih Berkas Video dari Komputer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // WHEN TEACHER VIDEO IS PRESENT:
  const percentWatched =
    duration > 0
      ? Math.min(100, Math.round((currentTime / duration) * 100))
      : progress?.videoProgressPercent || 0;
  const isVideoDone = progress?.videoCompleted || percentWatched >= 90;

  return (
    <div ref={containerRef} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Video Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">
                {module.videoTitle || `Video Penjelasan Pengajar: ${module.title}`}
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" />
                Video Pengajar
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Pengajar: {module.author}</span>
              <span>&bull;</span>
              <span>Durasi: {formatTime(duration)}</span>
              <span>&bull;</span>
              <span>
                Progres Ditonton: <strong className="text-sky-400 font-mono">{percentWatched}%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Video Actions: Completion & Teacher Removal */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleToggleCompleted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              isVideoDone
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isVideoDone ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>{isVideoDone ? 'Video Selesai Ditonton' : 'Tandai Selesai'}</span>
          </button>

          {onModuleVideoUpdated && (
            <button
              onClick={handleRemoveTeacherVideo}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 border border-slate-700 transition"
              title="Hapus Video Pengajar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Video Element Container */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center group">
        <video
          ref={videoRef}
          src={module.videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          muted={isMuted}
        />

        {/* Center Big Play Button if paused */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition hover:bg-black/30"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-2xl transition-transform hover:scale-110">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Video Overlay Completion Badge */}
        {isVideoDone && (
          <div className="absolute top-3 left-3 bg-emerald-950/90 backdrop-blur border border-emerald-500/40 text-emerald-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold shadow">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tuntas 100%</span>
          </div>
        )}

        {/* Active speed indicator on video */}
        {playbackSpeed !== 1.0 && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur border border-slate-700 text-amber-300 text-xs px-2.5 py-1 rounded-lg font-mono font-bold shadow">
            {playbackSpeed.toFixed(2).replace(/\.?0+$/, '')}x
          </div>
        )}
      </div>

      {/* Custom Progress Bar & Controls */}
      <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
        {/* Progress Timeline Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span className="text-amber-400 font-bold">{percentWatched}% Selesai</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow"
              title={isPlaying ? 'Jeda Video' : 'Putar Video'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Putar Ulang dari Awal"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title={isMuted ? 'Buka Suara' : 'Bisukan Suara'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Layar Penuh"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Speed Status */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span className="text-[11px]">Kecepatan Aktif:</span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-bold">
              {playbackSpeed.toFixed(2).replace(/\.?0+$/, '')}x
            </span>
          </div>
        </div>

        {/* Dedicated Prominent Speed Control Card: Pengatur Kecepatan Putar Video (1.0x, 1.25x, 1.5x, 2.0x) */}
        <div className="pt-3 border-t border-slate-800/80 mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Pengatur Kecepatan Putar Video (1.0x, 1.25x, 1.5x, 2.0x)
              </span>
              <span className="text-[10px] text-slate-400">
                Pilih kecepatan pemutaran materi video pengajar sesuai kebutuhan belajar
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {speedOptions.map((spd) => {
              const isActive = playbackSpeed === spd;
              const label = `${spd.toFixed(2).replace(/\.?0+$/, '')}x`;
              return (
                <button
                  key={spd}
                  type="button"
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50 scale-105'
                      : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`Atur kecepatan pemutaran video ke ${label}`}
                >
                  <span>{label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
