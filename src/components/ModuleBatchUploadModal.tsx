import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  CheckCircle2,
  Trash2,
  Layers,
  Sparkles,
  AlertCircle,
  FolderPlus,
  FileCode,
  ArrowRight,
  Wand2
} from 'lucide-react';
import { LearningModule, getSubTopicUploadedFiles, UploadedSwfFile } from '../types';
import { saveSwfBlob, saveModuleOverride } from '../services/storage';
import { createValidSampleSwf } from '../services/sampleSwf';

export interface ModuleBatchFileItem {
  id: string;
  file: File;
  targetId: string; // 'main' or subTopic.id
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

interface ModuleBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: LearningModule;
  initialTargetId?: string; // 'main' or subTopic.id
  onModuleUpdated: (updatedModule: LearningModule, lastActiveTarget?: { targetId: string; blobKey: string; fileName: string; title: string }) => void;
}

export const ModuleBatchUploadModal: React.FC<ModuleBatchUploadModalProps> = ({
  isOpen,
  onClose,
  module,
  initialTargetId = 'main',
  onModuleUpdated,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [queue, setQueue] = useState<ModuleBatchFileItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const subTopics = module.subTopics || [];

  // Smart auto-detection of target subtopic based on filename
  const guessTargetFromFilename = (fileName: string, index: number): string => {
    const lower = fileName.toLowerCase();
    for (const st of subTopics) {
      const titleLower = st.title.toLowerCase();
      if (lower.includes('verbal') && titleLower.includes('verbal')) return st.id;
      if ((lower.includes('proposisi') || lower.includes('silogisme') || lower.includes('logika')) && titleLower.includes('proposisi')) return st.id;
      if (lower.includes('analitik') && titleLower.includes('analitik')) return st.id;
      if ((lower.includes('barisan') || lower.includes('deret')) && titleLower.includes('barisan')) return st.id;
      if ((lower.includes('matematika') || lower.includes('aritmatika') || lower.includes('aljabar')) && titleLower.includes('matematika')) return st.id;
    }

    if (initialTargetId && initialTargetId !== 'main') {
      return initialTargetId;
    }

    // If uploading multiple files and no specific keyword matched, distribute across subtopics
    if (subTopics.length > 0) {
      return subTopics[index % subTopics.length].id;
    }

    return 'main';
  };

  const handleFilesSelected = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    const newItems: ModuleBatchFileItem[] = [];
    const fileArray = Array.from(files);

    fileArray.forEach((file, idx) => {
      if (file.name.toLowerCase().endsWith('.swf')) {
        const autoTarget =
          fileArray.length === 1 && initialTargetId
            ? initialTargetId
            : guessTargetFromFilename(file.name, queue.length + idx);

        newItems.push({
          id: `mbatch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          file,
          targetId: autoTarget,
          status: 'pending',
        });
      }
    });

    if (newItems.length === 0) {
      setErrorMessage('Tidak ada berkas berformat .swf yang ditemukan. Pastikan memilih file berekstensi .swf');
      return;
    }

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleGenerateSampleBatchFiles = () => {
    setErrorMessage(null);
    const sampleDefinitions = [
      { name: 'TPA_01_Verbal_Analogi_Sinonim.swf', color: '#0F172A' },
      { name: 'TPA_02_Proposisi_Silogisme_Logika.swf', color: '#1E1B4B' },
      { name: 'TPA_03_Penalaran_Analitik_Posisi.swf', color: '#064E3B' },
      { name: 'TPA_04_Barisan_Deret_Angka_Huruf.swf', color: '#3B0764' },
      { name: 'TPA_05_Matematika_Dasar_Kuantitatif.swf', color: '#451A03' },
    ];

    const generatedFiles: File[] = sampleDefinitions.map((def) => {
      const blob = createValidSampleSwf(def.name, def.color);
      return new File([blob], def.name, { type: 'application/x-shockwave-flash' });
    });

    handleFilesSelected(generatedFiles);
  };

  const handleUpdateTarget = (id: string, newTargetId: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, targetId: newTargetId } : item))
    );
  };

  const handleAutoDistributeTargets = () => {
    if (subTopics.length === 0) return;
    setQueue((prev) =>
      prev.map((item, idx) => ({
        ...item,
        targetId: subTopics[idx % subTopics.length].id,
      }))
    );
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStartBatchUpload = async () => {
    if (queue.length === 0) return;
    setIsProcessing(true);
    setProcessedCount(0);
    setErrorMessage(null);

    let updatedModule: LearningModule = {
      ...module,
      subTopics: [...(module.subTopics || [])],
    };

    let lastActiveTarget: { targetId: string; blobKey: string; fileName: string; title: string } | undefined;
    const nowFormatted = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      setQueue((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: 'processing' } : it))
      );

      try {
        const blobKey =
          item.targetId === 'main'
            ? `swf_mod_${module.id}_${Date.now()}_${i}`
            : `swf_sub_${item.targetId}_${Date.now()}_${i}`;

        await saveSwfBlob(blobKey, item.file);

        if (item.targetId === 'main') {
          updatedModule = {
            ...updatedModule,
            swfSourceType: 'uploaded_blob',
            blobKey,
            fileName: item.file.name,
            fileSizeBytes: item.file.size,
          };
          lastActiveTarget = {
            targetId: 'main',
            blobKey,
            fileName: item.file.name,
            title: updatedModule.title,
          };
        } else {
          const targetSt = (updatedModule.subTopics || []).find((s) => s.id === item.targetId);
          const newEntry: UploadedSwfFile = {
            id: blobKey,
            blobKey,
            fileName: item.file.name,
            fileSizeBytes: item.file.size,
            uploadedAt: nowFormatted,
            source: 'batch',
          };

          updatedModule = {
            ...updatedModule,
            subTopics: (updatedModule.subTopics || []).map((st) => {
              if (st.id === item.targetId) {
                const existingFiles = getSubTopicUploadedFiles(st);
                return {
                  ...st,
                  blobKey,
                  fileName: item.file.name,
                  fileSizeBytes: item.file.size,
                  uploadedFiles: [...existingFiles, newEntry],
                };
              }
              return st;
            }),
          };
          lastActiveTarget = {
            targetId: item.targetId,
            blobKey,
            fileName: item.file.name,
            title: targetSt?.title || 'Submateri',
          };
        }

        setQueue((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'done' } : it))
        );
        setProcessedCount((c) => c + 1);
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: 'error', errorMessage: err.message } : it
          )
        );
      }
    }

    // Persist module override
    saveModuleOverride(module.id, {
      swfSourceType: updatedModule.swfSourceType,
      blobKey: updatedModule.blobKey,
      fileName: updatedModule.fileName,
      fileSizeBytes: updatedModule.fileSizeBytes,
      subTopics: updatedModule.subTopics,
    });

    onModuleUpdated(updatedModule, lastActiveTarget);
    setIsProcessing(false);

    setTimeout(() => {
      setQueue([]);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-4 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Unggah Banyak Berkas .SWF Sekaligus (Batch Upload)
                </h3>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                  Mode Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pilih banyak file Flash (.swf) sekaligus dan petakan langsung ke Modul Utama atau 5 Submateri TPA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Dropzone Multi-select */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFilesSelected(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-amber-500/40 hover:border-amber-400 bg-slate-950/60 hover:bg-slate-950'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".swf,application/x-shockwave-flash"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-100 text-sm">
                Klik atau Seret Banyak Berkas .SWF Sekaligus ke Sini
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Mendukung pemilihan multi-file (<kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+Click</kbd> atau <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Shift+Click</kbd>). Sistem otomatis mendeteksi penempatan submateri dari nama file.
              </p>
            </div>
          </div>

          {/* Quick Demo Batch Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/70 border border-slate-800 px-4 py-3 rounded-xl">
            <div className="text-xs text-slate-300">
              Ingin mencoba simulasi unggah 5 berkas SWF sekaligus untuk ke-5 Submateri TPA?
            </div>
            <button
              type="button"
              onClick={handleGenerateSampleBatchFiles}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 transition shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Muat 5 Sampel SWF TPA Sekaligus</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Queue List */}
          {queue.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Antrean Berkas & Pemetaan Submateri ({queue.length} File)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoDistributeTargets}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold border border-slate-700 transition"
                  >
                    Sebar Otomatis ke 5 Submateri
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueue([])}
                    disabled={isProcessing}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 font-semibold border border-rose-800/50 transition"
                  >
                    Kosongkan Antrean
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {queue.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                      item.status === 'done'
                        ? 'bg-emerald-950/30 border-emerald-500/40'
                        : item.status === 'error'
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    {/* Left: File Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-xs font-bold text-white truncate">
                            {item.file.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Ukuran: {(item.file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>

                    {/* Right: Target Submodule Selector & Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
                      <select
                        value={item.targetId}
                        disabled={isProcessing}
                        onChange={(e) => handleUpdateTarget(item.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none"
                      >
                        <option value="main">📌 Modul Utama ({module.title})</option>
                        {subTopics.map((st, sIdx) => (
                          <option key={st.id} value={st.id}>
                            📂 Submateri {sIdx + 1}: {st.title}
                          </option>
                        ))}
                      </select>

                      {item.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition"
                          title="Hapus dari antrean"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            {isProcessing ? (
              <span className="text-amber-400 font-semibold">
                Memproses {processedCount} dari {queue.length} berkas...
              </span>
            ) : (
              <span>
                Total antrean: <strong className="text-white">{queue.length} berkas .swf</strong> siap dipasang
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleStartBatchUpload}
              disabled={isProcessing || queue.length === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-slate-950 font-black text-xs transition shadow-lg flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'Menyimpan ke Modul...'
                  : `Unggah & Pasang ${queue.length > 0 ? queue.length : ''} Berkas`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
