import React from 'react';
import {
  Flame,
  BookOpen,
  Award,
  HelpCircle,
  Download,
  GraduationCap,
  ShieldCheck,
  Video,
  Undo2,
  Redo2,
  RotateCcw
} from 'lucide-react';
import { downloadSampleSwfFile } from '../services/sampleSwf';

interface NavbarProps {
  currentView: 'catalog' | 'viewer';
  onNavigateHome: () => void;
  onOpenConverter?: () => void;
  onOpenGuide: () => void;
  userRole: 'siswa' | 'admin';
  onToggleRole: () => void;
  completedCount: number;
  totalCount: number;
  undoCount?: number;
  redoCount?: number;
  onUndo?: () => void;
  onRedo?: () => void;
  onClearCache?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigateHome,
  onOpenConverter,
  onOpenGuide,
  userRole,
  onToggleRole,
  completedCount,
  totalCount,
  undoCount = 0,
  redoCount = 0,
  onUndo,
  onRedo,
  onClearCache,
}) => {
  const isAdmin = userRole === 'admin';

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${
      isAdmin
        ? 'bg-slate-900/95 border-purple-900/40'
        : 'bg-slate-900/95 border-emerald-900/30'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Active Mode Subtext */}
        <div
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition group-hover:scale-105 ${
            isAdmin
              ? 'bg-gradient-to-br from-purple-500 to-amber-500 shadow-purple-500/20'
              : 'bg-gradient-to-br from-emerald-400 to-amber-400 shadow-emerald-500/20'
          }`}>
            <Flame className="w-6 h-6 text-slate-950 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">FlashLearn</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30">
                .SWF
              </span>
              {/* Role pill badge next to logo */}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ml-1 ${
                isAdmin
                  ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
              }`}>
                {isAdmin ? '🛡️ Mode Admin' : '🎓 Mode Siswa'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              {isAdmin
                ? 'Panel Admin: Pengelolaan Modul TPA & Unggahan Berkas SWF'
                : 'Portal Belajar & Latihan Interaktif Siswa'}
            </p>
          </div>
        </div>

        {/* Center / Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Admin Undo & Redo Controls */}
          {isAdmin && (onUndo || onRedo) && (
            <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-purple-500/30">
              <button
                type="button"
                disabled={undoCount === 0}
                onClick={onUndo}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-amber-300 text-xs font-bold border border-slate-800 transition"
                title={undoCount > 0 ? `Undo perubahan terakhir (${undoCount} tersedia)` : 'Belum ada perubahan untuk di-Undo'}
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Undo</span>
                {undoCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                    {undoCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                disabled={redoCount === 0}
                onClick={onRedo}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-sky-300 text-xs font-bold border border-slate-800 transition"
                title={redoCount > 0 ? `Redo perubahan (${redoCount} tersedia)` : 'Belum ada perubahan untuk di-Redo'}
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Redo</span>
                {redoCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono">
                    {redoCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Clear All Cache Button */}
          {onClearCache && (
            <button
              type="button"
              onClick={onClearCache}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 text-xs font-semibold transition"
              title="Bersihkan seluruh cache aplikasi (LocalStorage, SessionStorage, IndexedDB SWF, dan Browser Cache)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Clear Cache</span>
            </button>
          )}

          {/* Demo SWF download - for testing */}
          <button
            onClick={() => downloadSampleSwfFile('sample_flash_demo.swf')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
            title="Unduh contoh file .swf untuk pengujian"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Demo .SWF</span>
          </button>

          {/* Distinct Role Switcher (Mode Siswa <-> Mode Admin) */}
          <button
            onClick={onToggleRole}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition shadow-md ${
              isAdmin
                ? 'bg-gradient-to-r from-purple-950 to-slate-900 border-purple-500/50 text-purple-300 hover:border-purple-400'
                : 'bg-gradient-to-r from-emerald-950 to-slate-900 border-emerald-500/50 text-emerald-300 hover:border-emerald-400'
            }`}
            title={`Saat ini: ${isAdmin ? 'Mode Admin' : 'Mode Siswa'}. Klik untuk beralih mode.`}
          >
            {isAdmin ? (
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            ) : (
              <GraduationCap className="w-4 h-4 text-emerald-400" />
            )}
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[10px] text-slate-400 font-normal">Peran Aktif:</span>
              <span className="font-bold text-white text-[11px]">
                {isAdmin ? 'Mode Admin' : 'Mode Siswa'}
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono hidden sm:inline">
              Ganti
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
