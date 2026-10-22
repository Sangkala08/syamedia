import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  Layers,
  Save,
  BookOpen,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  FileText,
  Clock,
  Undo2,
  Redo2
} from 'lucide-react';
import {
  LearningModule,
  SubTopic,
  SubSubTopic,
  SubjectCategory,
  EducationLevel,
  getSubTopicUploadedFiles
} from '../types';
import { saveModuleOverride, saveCustomModule } from '../services/storage';

interface EditModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: LearningModule;
  onModuleUpdated: (updatedModule: LearningModule, actionLabel?: string) => void;
}

interface ModalSnapshot {
  title: string;
  description: string;
  subject: SubjectCategory;
  level: EducationLevel;
  durationMinutes: number;
  subTopics: SubTopic[];
  actionLabel: string;
}

export const EditModuleModal: React.FC<EditModuleModalProps> = ({
  isOpen,
  onClose,
  module,
  onModuleUpdated,
}) => {
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description);
  const [subject, setSubject] = useState<SubjectCategory>(module.subject);
  const [level, setLevel] = useState<EducationLevel>(module.level);
  const [durationMinutes, setDurationMinutes] = useState<number>(module.durationMinutes || 60);
  const [subTopics, setSubTopics] = useState<SubTopic[]>(module.subTopics || []);

  // Undo / Redo history stacks inside the modal
  const [undoStack, setUndoStack] = useState<ModalSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<ModalSnapshot[]>([]);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Form state for adding a new Submateri
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSubSummary, setNewSubSummary] = useState('');
  const [newSubFirstTopicTitle, setNewSubFirstTopicTitle] = useState('');
  const [newSubFirstTopicContent, setNewSubFirstTopicContent] = useState('');

  // Inline editing state for existing Submateri
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubTitle, setEditSubTitle] = useState('');
  const [editSubSummary, setEditSubSummary] = useState('');

  // Inline delete confirmation state for Submateri
  const [confirmDeleteSubId, setConfirmDeleteSubId] = useState<string | null>(null);

  // Form state for adding a Sub-submateri inside a Submateri
  const [addingSubSubForId, setAddingSubSubForId] = useState<string | null>(null);
  const [newSubSubTitle, setNewSubSubTitle] = useState('');
  const [newSubSubContent, setNewSubSubContent] = useState('');
  const [newSubSubDuration, setNewSubSubDuration] = useState<number>(15);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(module.title);
      setDescription(module.description);
      setSubject(module.subject);
      setLevel(module.level);
      setDurationMinutes(module.durationMinutes || 60);
      setSubTopics(module.subTopics ? JSON.parse(JSON.stringify(module.subTopics)) : []);
      setUndoStack([]);
      setRedoStack([]);
      setStatusFeedback(null);
      setNewSubTitle('');
      setNewSubSummary('');
      setNewSubFirstTopicTitle('');
      setNewSubFirstTopicContent('');
      setEditingSubId(null);
      setConfirmDeleteSubId(null);
      setAddingSubSubForId(null);
      setErrorMsg(null);
    }
  }, [isOpen, module]);

  if (!isOpen) return null;

  const pushSnapshot = (actionLabel: string) => {
    const snap: ModalSnapshot = {
      title,
      description,
      subject,
      level,
      durationMinutes,
      subTopics: JSON.parse(JSON.stringify(subTopics)),
      actionLabel,
    };
    setUndoStack((prev) => [...prev, snap]);
    setRedoStack([]);
  };

  const handleModalUndo = () => {
    if (undoStack.length === 0) return;
    const prevSnap = undoStack[undoStack.length - 1];
    const currentSnap: ModalSnapshot = {
      title,
      description,
      subject,
      level,
      durationMinutes,
      subTopics: JSON.parse(JSON.stringify(subTopics)),
      actionLabel: prevSnap.actionLabel,
    };

    setRedoStack((prev) => [...prev, currentSnap]);
    setUndoStack((prev) => prev.slice(0, -1));

    setTitle(prevSnap.title);
    setDescription(prevSnap.description);
    setSubject(prevSnap.subject);
    setLevel(prevSnap.level);
    setDurationMinutes(prevSnap.durationMinutes);
    setSubTopics(prevSnap.subTopics);
    setStatusFeedback(`Undo: membatalkan "${prevSnap.actionLabel}"`);
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const handleModalRedo = () => {
    if (redoStack.length === 0) return;
    const nextSnap = redoStack[redoStack.length - 1];
    const currentSnap: ModalSnapshot = {
      title,
      description,
      subject,
      level,
      durationMinutes,
      subTopics: JSON.parse(JSON.stringify(subTopics)),
      actionLabel: nextSnap.actionLabel,
    };

    setUndoStack((prev) => [...prev, currentSnap]);
    setRedoStack((prev) => prev.slice(0, -1));

    setTitle(nextSnap.title);
    setDescription(nextSnap.description);
    setSubject(nextSnap.subject);
    setLevel(nextSnap.level);
    setDurationMinutes(nextSnap.durationMinutes);
    setSubTopics(nextSnap.subTopics);
    setStatusFeedback(`Redo: mengembalikan "${nextSnap.actionLabel}"`);
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const handleAddSubTopic = () => {
    const trimmedTitle = newSubTitle.trim();
    if (!trimmedTitle) {
      setErrorMsg('Nama / Judul Submateri tidak boleh kosong.');
      return;
    }

    pushSnapshot(`Tambah Submateri "${trimmedTitle}"`);

    const slug = trimmedTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const newId = `st-${slug || 'sub'}-${Date.now().toString().slice(-4)}`;

    const initialSubSubTopics: SubSubTopic[] = [];
    if (newSubFirstTopicTitle.trim()) {
      initialSubSubTopics.push({
        id: `sst-${slug || 'sub'}-1-${Date.now().toString().slice(-4)}`,
        title: newSubFirstTopicTitle.trim(),
        content:
          newSubFirstTopicContent.trim() ||
          `Pembahasan materi dan latihan interaktif untuk topik ${newSubFirstTopicTitle.trim()}.`,
        durationMinutes: 15,
        keyPoints: [`Konsep dasar ${trimmedTitle}`, `Latihan soal ${newSubFirstTopicTitle.trim()}`],
      });
    } else {
      initialSubSubTopics.push({
        id: `sst-${slug || 'sub'}-1-${Date.now().toString().slice(-4)}`,
        title: `1. Konsep & Latihan ${trimmedTitle}`,
        content:
          newSubSummary.trim() ||
          `Pelajari materi dan simulasi interaktif untuk submateri ${trimmedTitle}.`,
        durationMinutes: 15,
        keyPoints: [`Pemahaman konsep ${trimmedTitle}`, 'Evaluasi dan pembahasan soal'],
      });
    }

    const newSub: SubTopic = {
      id: newId,
      title: trimmedTitle,
      summary:
        newSubSummary.trim() ||
        `Submateri pembahasan, latihan soal, dan simulasi interaktif ${trimmedTitle}.`,
      subSubTopics: initialSubSubTopics,
      uploadedFiles: [],
    };

    setSubTopics((prev) => [...prev, newSub]);
    setNewSubTitle('');
    setNewSubSummary('');
    setNewSubFirstTopicTitle('');
    setNewSubFirstTopicContent('');
    setErrorMsg(null);
  };

  const handleStartEditSub = (st: SubTopic) => {
    setEditingSubId(st.id);
    setEditSubTitle(st.title);
    setEditSubSummary(st.summary);
    setConfirmDeleteSubId(null);
  };

  const handleSaveEditSub = (stId: string) => {
    if (!editSubTitle.trim()) {
      setErrorMsg('Judul submateri tidak boleh kosong.');
      return;
    }
    pushSnapshot(`Edit Submateri "${editSubTitle.trim()}"`);
    setSubTopics((prev) =>
      prev.map((st) =>
        st.id === stId
          ? {
              ...st,
              title: editSubTitle.trim(),
              summary: editSubSummary.trim() || st.summary,
            }
          : st
      )
    );
    setEditingSubId(null);
    setErrorMsg(null);
  };

  const handleConfirmDeleteSub = (st: SubTopic) => {
    pushSnapshot(`Hapus Submateri "${st.title}"`);
    setSubTopics((prev) => prev.filter((item) => item.id !== st.id));
    setConfirmDeleteSubId(null);
  };

  const handleMoveSubTopic = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subTopics.length) return;
    pushSnapshot(`Urutkan Submateri "${subTopics[index].title}"`);
    const copy = [...subTopics];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setSubTopics(copy);
  };

  const handleAddSubSubTopic = (subTopicId: string) => {
    if (!newSubSubTitle.trim()) return;
    pushSnapshot(`Tambah Sub-submateri "${newSubSubTitle.trim()}"`);
    const newSst: SubSubTopic = {
      id: `sst-${subTopicId}-${Date.now().toString().slice(-4)}`,
      title: newSubSubTitle.trim(),
      content:
        newSubSubContent.trim() ||
        `Pembahasan materi dan latihan untuk ${newSubSubTitle.trim()}.`,
      durationMinutes: Number(newSubSubDuration) || 15,
      keyPoints: [`Poin utama ${newSubSubTitle.trim()}`],
    };

    setSubTopics((prev) =>
      prev.map((st) =>
        st.id === subTopicId
          ? {
              ...st,
              subSubTopics: [...(st.subSubTopics || []), newSst],
            }
          : st
      )
    );
    setNewSubSubTitle('');
    setNewSubSubContent('');
    setNewSubSubDuration(15);
    setAddingSubSubForId(null);
  };

  const handleDeleteSubSubTopic = (subTopicId: string, sstId: string) => {
    pushSnapshot('Hapus Sub-submateri');
    setSubTopics((prev) =>
      prev.map((st) =>
        st.id === subTopicId
          ? {
              ...st,
              subSubTopics: (st.subSubTopics || []).filter((sst) => sst.id !== sstId),
            }
          : st
      )
    );
  };

  const handleSaveAllChanges = () => {
    if (!title.trim()) {
      setErrorMsg('Judul modul tidak boleh kosong.');
      return;
    }

    const updatedModule: LearningModule = {
      ...module,
      title: title.trim(),
      description: description.trim() || module.description,
      subject,
      level,
      durationMinutes: Number(durationMinutes) || 60,
      subTopics,
    };

    saveModuleOverride(module.id, {
      title: updatedModule.title,
      description: updatedModule.description,
      subject: updatedModule.subject,
      level: updatedModule.level,
      durationMinutes: updatedModule.durationMinutes,
      subTopics: updatedModule.subTopics,
    });

    if (module.isCustom) {
      saveCustomModule(updatedModule);
    }

    onModuleUpdated(updatedModule, `Edit Modul "${updatedModule.title}"`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Edit Modul & Kelola Submateri
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                  Mode Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ubah informasi modul, tambah submateri baru, edit, urutkan, atau hapus submateri.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo & Redo Buttons inside EditModuleModal */}
            <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                disabled={undoStack.length === 0}
                onClick={handleModalUndo}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-amber-300 text-xs font-bold border border-slate-800 transition"
                title={
                  undoStack.length > 0
                    ? `Undo: Batalkan "${undoStack[undoStack.length - 1].actionLabel}"`
                    : 'Belum ada perubahan untuk di-Undo'
                }
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
                {undoStack.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                    {undoStack.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                disabled={redoStack.length === 0}
                onClick={handleModalRedo}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-sky-300 text-xs font-bold border border-slate-800 transition"
                title={
                  redoStack.length > 0
                    ? `Redo: Kembalikan "${redoStack[redoStack.length - 1].actionLabel}"`
                    : 'Belum ada perubahan untuk di-Redo'
                }
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>Redo</span>
                {redoStack.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono">
                    {redoStack.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {statusFeedback && (
            <div className="p-3 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-between">
              <span>{statusFeedback}</span>
              <button onClick={() => setStatusFeedback(null)} className="text-amber-400 hover:text-white">
                ✕
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
                ✕
              </button>
            </div>
          )}

          {/* Bagian 1: Informasi Utama Modul */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              1. Informasi Utama Modul
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul Modul
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Tes Potensi Akademik (TPA)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deskripsi Modul
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi singkat modul..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kategori Mata Pelajaran
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as SubjectCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Umum">Umum</option>
                  <option value="Matematika">Matematika</option>
                  <option value="Fisika">Fisika</option>
                  <option value="Biologi">Biologi</option>
                  <option value="Kimia">Kimia</option>
                  <option value="Astronomi">Astronomi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jenjang
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as EducationLevel)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="Kuliah / Umum">Kuliah / Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Durasi (Menit)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 2: Form Tambah Submateri Baru */}
          <div className="bg-gradient-to-br from-emerald-950/30 via-slate-950 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                2. Tambah Submateri Baru
              </h3>
              <span className="text-[11px] text-slate-400">
                Total saat ini: <strong className="text-white">{subTopics.length} Submateri</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama / Judul Submateri Baru *
                </label>
                <input
                  type="text"
                  value={newSubTitle}
                  onChange={(e) => setNewSubTitle(e.target.value)}
                  placeholder="Contoh: Penalaran Spasial / Geometri"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ringkasan Submateri
                </label>
                <input
                  type="text"
                  value={newSubSummary}
                  onChange={(e) => setNewSubSummary(e.target.value)}
                  placeholder="Contoh: Analisis rotasi bangun ruang, jaring-jaring, dan pencerminan."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Judul Sub-submateri Pertama (Opsional)
                </label>
                <input
                  type="text"
                  value={newSubFirstTopicTitle}
                  onChange={(e) => setNewSubFirstTopicTitle(e.target.value)}
                  placeholder="Contoh: 1. Rotasi & Pencerminan Gambar 2D/3D"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Deskripsi Sub-submateri Pertama (Opsional)
                </label>
                <input
                  type="text"
                  value={newSubFirstTopicContent}
                  onChange={(e) => setNewSubFirstTopicContent(e.target.value)}
                  placeholder="Penjelasan singkat sub-submateri..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddSubTopic}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah ke Daftar Submateri</span>
              </button>
            </div>
          </div>

          {/* Bagian 3: Daftar Submateri (Edit, Urutkan, Hapus, & Kelola Sub-submateri) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                3. Daftar Submateri ({subTopics.length} Submateri)
              </h3>
              <span className="text-[11px] text-slate-400">
                Admin dapat mengubah judul, mengurutkan, atau menghapus submateri
              </span>
            </div>

            {subTopics.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-400">
                Belum ada submateri pada modul ini. Gunakan formulir di atas untuk menambahkan submateri baru.
              </div>
            ) : (
              <div className="space-y-3">
                {subTopics.map((st, idx) => {
                  const uploadedCount = getSubTopicUploadedFiles(st).length;
                  const isEditing = editingSubId === st.id;
                  const isConfirmingDelete = confirmDeleteSubId === st.id;
                  const isAddingSubSub = addingSubSubForId === st.id;

                  return (
                    <div
                      key={st.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 transition hover:border-slate-700"
                    >
                      {isEditing ? (
                        <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-amber-500/40">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-amber-400 mb-1">
                                Judul Submateri
                              </label>
                              <input
                                type="text"
                                value={editSubTitle}
                                onChange={(e) => setEditSubTitle(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-amber-400 mb-1">
                                Ringkasan / Deskripsi Submateri
                              </label>
                              <input
                                type="text"
                                value={editSubSummary}
                                onChange={(e) => setEditSubSummary(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingSubId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditSub(st.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Terapkan Perubahan</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-white">{st.title}</h4>
                                <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono">
                                  {(st.subSubTopics || []).length} Sub-submateri
                                </span>
                                {uploadedCount > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                    {uploadedCount} File SWF
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{st.summary}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveSubTopic(idx, 'up')}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
                              title="Geser ke atas"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === subTopics.length - 1}
                              onClick={() => handleMoveSubTopic(idx, 'down')}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
                              title="Geser ke bawah"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAddingSubSubForId(isAddingSubSub ? null : st.id)
                              }
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition"
                              title="Tambah Sub-submateri"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Sub-topik</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEditSub(st)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition"
                              title="Edit Judul & Ringkasan Submateri"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDeleteSubId(isConfirmingDelete ? null : st.id)
                              }
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-xs font-bold transition"
                              title="Hapus Submateri Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Inline Delete Confirmation */}
                      {isConfirmingDelete && (
                        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <span className="text-rose-200 font-semibold">
                            Yakin ingin menghapus submateri <strong>"{st.title}"</strong>? (Dapat dikembalikan dengan tombol Undo)
                          </span>
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteSubId(null)}
                              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmDeleteSub(st)}
                              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                            >
                              Ya, Hapus Submateri
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Add Sub-submateri Form */}
                      {isAddingSubSub && (
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-sky-500/40 space-y-3">
                          <div className="text-xs font-bold text-sky-400">
                            + Tambah Sub-submateri ke "{st.title}"
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <input
                              type="text"
                              value={newSubSubTitle}
                              onChange={(e) => setNewSubSubTitle(e.target.value)}
                              placeholder="Judul Sub-submateri..."
                              className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <input
                                type="number"
                                min={5}
                                value={newSubSubDuration}
                                onChange={(e) => setNewSubSubDuration(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                              />
                              <span className="text-[11px] text-slate-400 shrink-0">mnt</span>
                            </div>
                            <input
                              type="text"
                              value={newSubSubContent}
                              onChange={(e) => setNewSubSubContent(e.target.value)}
                              placeholder="Penjelasan materi sub-topik..."
                              className="sm:col-span-3 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setAddingSubSubForId(null)}
                              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddSubSubTopic(st.id)}
                              className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                            >
                              Simpan Sub-submateri
                            </button>
                          </div>
                        </div>
                      )}

                      {/* List of Sub-submateri pills */}
                      {(st.subSubTopics || []).length > 0 && (
                        <div className="pt-2 border-t border-slate-800/70 flex flex-wrap gap-1.5">
                          {(st.subSubTopics || []).map((sst) => (
                            <div
                              key={sst.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                            >
                              <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate max-w-[220px]">{sst.title}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubSubTopic(st.id, sst.id)}
                                className="text-slate-500 hover:text-rose-400 ml-1"
                                title="Hapus sub-submateri ini"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={undoStack.length === 0}
              onClick={handleModalUndo}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-amber-300 text-xs font-bold border border-slate-800 transition"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo ({undoStack.length})</span>
            </button>

            <button
              type="button"
              disabled={redoStack.length === 0}
              onClick={handleModalRedo}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-sky-300 text-xs font-bold border border-slate-800 transition"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span>Redo ({redoStack.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveAllChanges}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Modul ({subTopics.length} Submateri)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
