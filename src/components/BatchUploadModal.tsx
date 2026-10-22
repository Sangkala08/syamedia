import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileCheck,
  CheckCircle2,
  Trash2,
  Layers,
  Sparkles,
  AlertCircle,
  FolderPlus,
  Play
} from 'lucide-react';
import { LearningModule, SubjectCategory, EducationLevel, BatchUploadItem } from '../types';
import { saveSwfBlob, saveCustomModule } from '../services/storage';

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchCompleted: (modules: LearningModule[]) => void;
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  isOpen,
  onClose,
  onBatchCompleted,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [queue, setQueue] = useState<BatchUploadItem[]>([]);
  const [globalSubject, setGlobalSubject] = useState<SubjectCategory>('Fisika');
  const [globalLevel, setGlobalLevel] = useState<EducationLevel>('SMP');
  const [authorName, setAuthorName] = useState<string>('Guru Pengajar');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    const newItems: BatchUploadItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.toLowerCase().endsWith('.swf')) {
        const cleanTitle = file.name
          .replace('.swf', '')
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        newItems.push({
          id: `batch-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          file,
          title: cleanTitle,
          subject: globalSubject,
          level: globalLevel,
          size: file.size,
          status: 'pending',
        });
      }
    }

    if (newItems.length === 0) {
      setErrorMessage('Tidak ada file berformat .swf yang ditemukan di antara file yang Anda pilih.');
      return;
    }

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplyGlobalSettings = () => {
    setQueue((prev) =>
      prev.map((item) => ({
        ...item,
        subject: globalSubject,
        level: globalLevel,
      }))
    );
  };

  const handleUpdateItemTitle = (id: string, newTitle: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
  };

  const handleUpdateItemSubject = (id: string, newSubject: SubjectCategory) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, subject: newSubject } : item))
    );
  };

  const handleStartBatchProcess = async () => {
    if (queue.length === 0) return;
    setIsProcessing(true);
    setProcessedCount(0);
    setErrorMessage(null);

    const completedModules: LearningModule[] = [];

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      // Update status to processing
      setQueue((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: 'processing' } : it))
      );

      try {
        const moduleId = `custom-swf-${Date.now()}-${i}`;
        // Save to IndexedDB
        await saveSwfBlob(moduleId, item.file);

        const newModule: LearningModule = {
          id: moduleId,
          title: item.title,
          subject: item.subject,
          level: item.level,
          durationMinutes: 20,
          thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
          description: `Materi multimedia interaktif Flash (.swf) "${item.title}". Dikelompokkan ke mata pelajaran ${item.subject}.`,
          author: authorName.trim() || 'Guru Pengajar',
          authorRole: 'Kontributor Pustaka Media Sekolah',
          createdAt: new Date().toISOString().split('T')[0],
          swfSourceType: 'uploaded_blob',
          blobKey: moduleId,
          fileName: item.file.name,
          fileSizeBytes: item.file.size,
          flashVersion: 8,
          actionScriptVersion: 'ActionScript 2.0 (AVM1)',
          learningObjectives: [
            `Eksplorasi konsep pembelajaran pada materi ${item.title}`,
            'Analisis hasil percobaan virtual berbasis interaksi Flash'
          ],
          theoryContent: `### Modul Flash: ${item.title}\nBerkas ini diimpor melalui fitur Impor Multi-File untuk pembelajaran terstruktur.`,
          practicalSteps: [
            'Nyalakan pemutar simulasi Flash dengan tombol Play.',
            'Amati elemen interaktif dan visualisasi grafis.',
            'Tulis kesimpulan pada lembar catatan belajar.'
          ],
          quiz: [
            {
              id: `q-${moduleId}-1`,
              question: `Apakah konsep dalam berkas "${item.title}" tersampaikan dengan baik?`,
              options: ['Sangat jelas dan interaktif', 'Cukup jelas', 'Perlu penjelasan tambahan', 'Belum dipelajari'],
              correctAnswer: 0,
              explanation: 'Media berbasis Flash memberikan visualisasi kinetik yang memperkuat pemahaman.'
            }
          ],
          subTopics: [
            {
              id: `${moduleId}-sub1`,
              title: `Submateri 1: Fondasi & Pengantar ${item.title}`,
              summary: `Pengantar materi pokok dan kerangka konseptual ${item.title}.`,
              subSubTopics: [
                {
                  id: `${moduleId}-sub1-1`,
                  title: `Sub-submateri 1.1: Pemahaman Konseptual`,
                  durationMinutes: 5,
                  content: `Eksplorasi konsep dan fenomena utama dalam berkas Flash ini.`,
                  keyPoints: ['Tujuan pembelajaran', 'Konsep kunci']
                },
                {
                  id: `${moduleId}-sub1-2`,
                  title: `Sub-submateri 1.2: Observasi Simulasi`,
                  durationMinutes: 5,
                  content: `Melakukan pengamatan interaktif terhadap animasi dan simulasi.`,
                  keyPoints: ['Parameter interaksi', 'Catatan observasi']
                }
              ]
            }
          ],
          isCustom: true,
        };

        saveCustomModule(newModule);
        completedModules.push(newModule);

        // Update status to done
        setQueue((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'done' } : it))
        );
        setProcessedCount((c) => c + 1);
      } catch (err: any) {
        console.error('Error importing file:', err);
        setQueue((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: 'error', errorMessage: err.message } : it
          )
        );
      }
    }

    setIsProcessing(false);
    if (completedModules.length > 0) {
      onBatchCompleted(completedModules);
      setTimeout(() => {
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Unggah Banyak File SWF Sekaligus (Batch Import)</h3>
              <p className="text-xs text-slate-400">Pilih beberapa file .swf dari komputer Anda untuk ditambahkan ke katalog</p>
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
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition"
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
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-100 text-sm">
                Pilih atau Tarik Banyak Berkas .SWF ke Sini
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Tahan tombol <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px]">Ctrl</kbd> atau <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px]">Shift</kbd> untuk memilih banyak file .swf sekaligus.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Batch Settings Bar */}
          {queue.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Pengaturan Massal ({queue.length} Berkas Dipilih)
                </span>
                <button
                  type="button"
                  onClick={handleApplyGlobalSettings}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline"
                >
                  Terapkan ke Semua Berkas di Antrean
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Mata Pelajaran:</label>
                  <select
                    value={globalSubject}
                    onChange={(e) => setGlobalSubject(e.target.value as SubjectCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200"
                  >
                    <option value="Fisika">Fisika</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Biologi">Biologi</option>
                    <option value="Kimia">Kimia</option>
                    <option value="Astronomi">Astronomi</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Jenjang:</label>
                  <select
                    value={globalLevel}
                    onChange={(e) => setGlobalLevel(e.target.value as EducationLevel)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200"
                  >
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="Kuliah / Umum">Kuliah / Umum</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Nama Guru / Pengajar:</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Queue List */}
          {queue.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Daftar Berkas yang Akan Diimpor:</span>
                <button
                  onClick={() => setQueue([])}
                  className="text-rose-400 hover:text-rose-300"
                >
                  Bersihkan Antrean
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 flex-1 truncate">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                        {item.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <FileCheck className="w-4 h-4" />
                        )}
                      </div>
                      <div className="truncate flex-1">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateItemTitle(item.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-200 text-xs w-full focus:outline-none focus:border-amber-400"
                        />
                        <div className="text-[10px] text-slate-500 mt-0.5 flex gap-2">
                          <span>{item.file.name}</span>
                          <span>&bull;</span>
                          <span>{(item.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={item.subject}
                        onChange={(e) => handleUpdateItemSubject(item.id, e.target.value as SubjectCategory)}
                        className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="Fisika">Fisika</option>
                        <option value="Matematika">Matematika</option>
                        <option value="Biologi">Biologi</option>
                        <option value="Kimia">Kimia</option>
                        <option value="Astronomi">Astronomi</option>
                        <option value="Umum">Umum</option>
                      </select>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isProcessing}
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar during Batch processing */}
          {isProcessing && (
            <div className="space-y-1.5 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Memproses & Menyimpan Berkas ke Memori Lokal...</span>
                <span className="font-mono text-amber-400 font-bold">
                  {processedCount} / {queue.length} Selesai
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(processedCount / queue.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Total {queue.length} file dalam antrean
          </span>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Tutup
            </button>
            <button
              onClick={handleStartBatchProcess}
              disabled={queue.length === 0 || isProcessing}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs transition shadow flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? 'Mengimpor Massal...' : 'Impor Semua Berkas Sekaligus'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
