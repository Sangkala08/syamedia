import React, { useRef, useEffect, useState } from 'react';
import { Award, Download, X, CheckCircle, Share2, Sparkles } from 'lucide-react';
import { LearningModule } from '../types';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: LearningModule;
  score: number;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, onClose, module, score }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [studentName, setStudentName] = useState<string>('Siswa Berprestasi');
  const [downloadReady, setDownloadReady] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Draw Certificate Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Decorative Borders
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, w - 64, h - 64);

    // Corner decorative accents
    const drawCorner = (x: number, y: number) => {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCorner(44, 44);
    drawCorner(w - 44, 44);
    drawCorner(44, h - 44);
    drawCorner(w - 44, h - 44);

    // Platform Header
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FLASHLEARN INDONESIA \u2022 PLATFORM E-LEARNING SWF', w / 2, 80);

    // Main Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px "Plus Jakarta Sans", serif';
    ctx.fillText('SERTIFIKAT KELULUSAN', w / 2, 130);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Nomor: FL/CERT/' + module.id.toUpperCase() + '/' + Date.now().toString().slice(-6), w / 2, 155);

    // Subtitle
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Diberikan secara resmi kepada:', w / 2, 205);

    // Student Name
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(studentName || 'Siswa Berprestasi', w / 2, 255);

    // Line under name
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 200, 275);
    ctx.lineTo(w / 2 + 200, 275);
    ctx.stroke();

    // Achievement text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `Telah berhasil menyelesaikan praktikum interaktif Flash dan evaluasi pemahaman:`,
      w / 2,
      315
    );

    // Module Title
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`"${module.title}"`, w / 2, 350);

    // Score and Metadata
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `Mata Pelajaran: ${module.subject} (${module.level})  |  Nilai Evaluasi: ${score}/100 (Predikat: ${
        score >= 90 ? 'Sangat Memuaskan' : score >= 75 ? 'Memuaskan' : 'Lulus'
      })`,
      w / 2,
      385
    );

    // Signatures & Gold Seal
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Date
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Diterbitkan pada: ${today}`, w / 2, 435);

    // Gold Medal / Seal Stamp
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.beginPath();
    ctx.arc(w / 2, 495, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, 495, 34, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('TERVERIFIKASI', w / 2, 490);
    ctx.fillText('RUFFLE WASM', w / 2, 506);

    // Signatures left and right
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(module.author, 90, 500);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Instruktur Pengembang Materi', 90, 520);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Tim Akademik FlashLearn', w - 90, 500);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Direktorat Media Interaktif', w - 90, 520);

    setDownloadReady(true);
  }, [isOpen, module, score, studentName]);

  if (!isOpen) return null;

  const handleDownloadCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sertifikat_${studentName.replace(/\s+/g, '_')}_${module.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sertifikat Kelulusan Modul Interaktif</h3>
              <p className="text-xs text-slate-400">Bukti capaian kompetensi praktikum multimedia Flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Name field */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">Nama Penerima Sertifikat:</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Masukkan Nama Lengkap Anda"
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 w-full sm:w-64 font-bold"
            />
          </div>

          <button
            onClick={handleDownloadCertificate}
            disabled={!downloadReady}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Sertifikat (PNG)</span>
          </button>
        </div>

        {/* Canvas Display */}
        <div className="p-4 sm:p-6 flex items-center justify-center bg-slate-950/80 overflow-x-auto">
          <canvas
            ref={canvasRef}
            width={850}
            height={560}
            className="w-full max-w-[800px] h-auto rounded-xl border border-slate-800 shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};
