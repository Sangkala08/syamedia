import React from 'react';
import { X, ShieldCheck, Cpu, HelpCircle, Layers, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

interface CompatibilityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompatibilityGuideModal: React.FC<CompatibilityGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Panduan & Kompatibilitas Berkas Flash (.SWF)</h3>
              <p className="text-xs text-slate-400">Menjalankan materi multimedia edukasi lawas di era browser modern</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs sm:text-sm text-slate-300">
          {/* Section 1: Apa itu Ruffle & Flash? */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-amber-400 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Bagaimana Platform Ini Menjalankan File Flash (.SWF)?
            </h4>
            <p className="leading-relaxed">
              Adobe Flash Player resmi dihentikan oleh Adobe dan dinonaktifkan di seluruh browser besar (Chrome, Firefox, Safari, Edge) sejak akhir tahun 2020. Akibatnya, ribuan materi pembelajaran interaktif sekolah, animasi fisika/biologi, dan CD pembelajaran mandiri tidak dapat dibuka kembali.
            </p>
            <p className="leading-relaxed">
              Platform FlashLearn menggunakan teknologi open-source emulator <strong className="text-white">Ruffle (WebAssembly/Rust)</strong>. Ruffle mengompilasi ulang bytecode Flash secara langsung di dalam lingkungan browser modern tanpa perlu plugin pihak ketiga, tanpa NPAPI, dan tanpa instalasi software desktop berbahaya.
            </p>
          </div>

          {/* Section 2: Keamanan */}
          <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-800/60 space-y-2">
            <h4 className="font-bold text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Mengapa Ruffle WebAssembly 100% Aman?
            </h4>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Isolasi Memori Penuh (Sandbox):</strong> Ruffle dieksekusi di dalam WebAssembly sandbox per-tab browser, sehingga berkas SWF tidak memiliki izin mengakses sistem file komputer lokal.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Bebas Celah Keamanan C++ Lawas:</strong> Berbeda dengan Adobe Flash Player klasik, Ruffle ditulis dalam bahasa pemrograman Rust yang aman dari celah buffer-overflow dan memory corruption.</span>
              </li>
            </ul>
          </div>

          {/* Section 3: Kompatibilitas Versi Flash */}
          <div className="space-y-3">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              Status Dukungan Format & ActionScript:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="font-bold text-emerald-400 mb-1 flex items-center justify-between">
                  <span>ActionScript 1.0 & 2.0 (AVM1)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">99% Didukung</span>
                </div>
                <p className="text-slate-400">
                  Digunakan pada Macromedia Flash 5, MX 2004, Flash 8, dan animasi BSE Kemdikbud lawas. Menjalankan navigasi gotoAndPlay, tombol klik, drag & drop, kalkulator sederhana, dan sound effects dengan sempurna.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="font-bold text-amber-400 mb-1 flex items-center justify-between">
                  <span>ActionScript 3.0 (AVM2)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px]">Dukungan Parsial</span>
                </div>
                <p className="text-slate-400">
                  Digunakan pada Adobe Flash CS3-CS6 dan Adobe Animate. Animasi vektor dan grafik berjalan baik, sementara skrip pemrograman tingkat lanjut terus diperbarui oleh komunitas Ruffle.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Tips untuk Guru & Sekolah */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Tips Menggunakan Media Flash dari CD Pembelajaran Sekolah:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Buka file explorer pada CD pembelajaran Anda.</li>
              <li>Cari berkas dengan ekstensi <code>.swf</code> (sering berada di folder <code>/materi</code>, <code>/animasi</code>, atau <code>/assets</code>).</li>
              <li>Gunakan tombol <strong>"Unggah Berkas SWF"</strong> di halaman utama platform ini.</li>
              <li>File akan disimpan secara instan di dalam memori lokal browser (IndexedDB) sehingga Anda bisa memainkannya kapan saja tanpa perlu internet!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-850 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
