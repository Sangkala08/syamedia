import React, { useState } from 'react';
import {
  X,
  FolderPlus,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Atom,
  Compass,
  Layers,
  Flame,
  Search,
  Check,
  AlertCircle
} from 'lucide-react';
import { CourseCatalogGroup, LearningModule, SubjectCategory, EducationLevel } from '../types';
import { saveCatalog } from '../services/storage';

interface CreateCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: LearningModule[];
  onCatalogCreated: (catalog: CourseCatalogGroup) => void;
  authorName?: string;
}

export const CreateCatalogModal: React.FC<CreateCatalogModalProps> = ({
  isOpen,
  onClose,
  modules,
  onCatalogCreated,
  authorName = 'Guru Pengajar',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<SubjectCategory | 'Semua'>('Semua');
  const [level, setLevel] = useState<EducationLevel | 'Semua'>('SMA');
  const [colorTheme, setColorTheme] = useState<'amber' | 'blue' | 'emerald' | 'purple' | 'rose'>('amber');
  const [iconName, setIconName] = useState<string>('Sparkles');
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [moduleSearch, setModuleSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredModules = modules.filter((m) => {
    if (!moduleSearch.trim()) return true;
    const q = moduleSearch.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.level.toLowerCase().includes(q)
    );
  });

  const handleToggleModule = (modId: string) => {
    if (selectedModuleIds.includes(modId)) {
      setSelectedModuleIds(selectedModuleIds.filter((id) => id !== modId));
    } else {
      setSelectedModuleIds([...selectedModuleIds, modId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedModuleIds.length === filteredModules.length) {
      setSelectedModuleIds([]);
    } else {
      setSelectedModuleIds(filteredModules.map((m) => m.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Judul katalog wajib diisi.');
      return;
    }

    const newCatalog: CourseCatalogGroup = {
      id: `cat-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: description.trim() || 'Katalog materi kurikulum yang dibentuk khusus oleh guru.',
      subject,
      level,
      author: authorName,
      createdAt: new Date().toISOString().split('T')[0],
      moduleIds: selectedModuleIds,
      colorTheme,
      icon: iconName,
      isCustom: true,
    };

    saveCatalog(newCatalog);
    onCatalogCreated(newCatalog);
    onClose();
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'from-blue-600 to-indigo-900 border-blue-500/40 text-blue-300';
      case 'emerald':
        return 'from-emerald-600 to-teal-900 border-emerald-500/40 text-emerald-300';
      case 'purple':
        return 'from-purple-600 to-indigo-950 border-purple-500/40 text-purple-300';
      case 'rose':
        return 'from-rose-600 to-pink-950 border-rose-500/40 text-rose-300';
      default:
        return 'from-amber-500 to-orange-950 border-amber-500/40 text-amber-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shadow-inner">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Bentuk Katalog Pembelajaran Baru</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/50">
                  Fitur Guru
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Kelompokkan modul-modul Flash ke dalam katalog kurikulum khusus kelas atau tema belajar
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Catalog Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200">
              Judul Katalog Baru <span className="text-rose-400">*</span>:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Katalog Simulasi Fisika SMA Kelas 10 — Semester 1"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200">Deskripsi Katalog:</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan tujuan atau cakupan materi yang terhimpun di dalam katalog ini..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Subject & Target Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">Mata Pelajaran Utama:</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectCategory | 'Semua')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Semua">Semua Mata Pelajaran</option>
                <option value="Fisika">Fisika</option>
                <option value="Matematika">Matematika</option>
                <option value="Biologi">Biologi</option>
                <option value="Kimia">Kimia</option>
                <option value="Astronomi">Astronomi</option>
                <option value="Umum">Umum / Multimedia</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">Jenjang Pendidikan Target:</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as EducationLevel | 'Semua')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Semua">Semua Jenjang</option>
                <option value="SD">SD (Sekolah Dasar)</option>
                <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                <option value="SMA">SMA / SMK</option>
                <option value="Kuliah / Umum">Kuliah / Umum</option>
              </select>
            </div>
          </div>

          {/* Color & Icon Customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">Tema Warna Banner:</label>
              <div className="flex items-center gap-2">
                {[
                  { id: 'amber', bg: 'bg-amber-500' },
                  { id: 'blue', bg: 'bg-blue-500' },
                  { id: 'emerald', bg: 'bg-emerald-500' },
                  { id: 'purple', bg: 'bg-purple-500' },
                  { id: 'rose', bg: 'bg-rose-500' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColorTheme(c.id as any)}
                    className={`w-7 h-7 rounded-xl ${c.bg} transition-transform ${
                      colorTheme === c.id ? 'scale-110 ring-2 ring-white shadow-lg' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">Ikon Katalog:</label>
              <div className="flex items-center gap-2">
                {[
                  { id: 'Sparkles', icon: Sparkles },
                  { id: 'Atom', icon: Atom },
                  { id: 'Compass', icon: Compass },
                  { id: 'Layers', icon: Layers },
                  { id: 'BookOpen', icon: BookOpen },
                  { id: 'Flame', icon: Flame },
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIconName(item.id)}
                      className={`p-2 rounded-xl border transition ${
                        iconName === item.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Pratinjau Banner Katalog Baru:</label>
            <div className={`p-4 rounded-2xl bg-gradient-to-r ${getColorClasses(colorTheme)} border shadow-md flex items-center justify-between`}>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  {subject} &bull; {level}
                </span>
                <h4 className="text-sm font-bold text-white">{title || 'Judul Katalog Anda'}</h4>
                <p className="text-[11px] opacity-85 line-clamp-1">
                  {description || 'Deskripsi katalog pembelajaran...'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-black/40 backdrop-blur border border-white/10">
                  {selectedModuleIds.length} Modul
                </span>
              </div>
            </div>
          </div>

          {/* Select Modules to Include */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <span>Pilih Modul Pembelajaran ({selectedModuleIds.length} Dipilih):</span>
              </label>

              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                {selectedModuleIds.length === filteredModules.length ? 'Batalkan Semua' : 'Pilih Semua Modul'}
              </button>
            </div>

            {/* Quick search modules inside modal */}
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
              <Search className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
              <input
                type="text"
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                placeholder="Cari modul untuk dimasukkan ke katalog..."
                className="bg-transparent text-slate-200 w-full focus:outline-none"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {filteredModules.map((mod) => {
                const isChecked = selectedModuleIds.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => handleToggleModule(mod.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isChecked
                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition ${
                          isChecked
                            ? 'bg-amber-500 border-amber-400 text-slate-950'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-xs truncate">{mod.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {mod.subject} &bull; {mod.level} &bull; {mod.durationMinutes}m
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                      {mod.isCustom ? 'Kustom' : 'Utama'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bentuk &amp; Terbitkan Katalog</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
