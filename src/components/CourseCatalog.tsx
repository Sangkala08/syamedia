import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  BookOpen,
  Clock,
  User,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Trash2,
  Play,
  Upload,
  Layers,
  HelpCircle,
  FileCode2,
  Video,
  Film,
  FolderPlus,
  FolderTree,
  Globe,
  Plus,
  X,
  RotateCcw,
  ShieldCheck,
  GraduationCap,
  ChevronRight,
  Folder,
  Edit3
} from 'lucide-react';
import { LearningModule, SubjectCategory, EducationLevel, UserProgress, CourseCatalogGroup, getSubTopicUploadedFiles } from '../types';
import { DashboardStats } from './DashboardStats';
import { getCatalogs, deleteCatalog, addModuleToCatalog, removeModuleFromCatalog } from '../services/storage';
import { CreateCatalogModal } from './CreateCatalogModal';
import { EditModuleModal } from './EditModuleModal';

interface CourseCatalogProps {
  modules: LearningModule[];
  progressMap: Record<string, UserProgress>;
  userRole: 'siswa' | 'admin' | 'guru';
  onSelectModule: (module: LearningModule) => void;
  onOpenUpload?: () => void;
  onOpenBatchUpload?: () => void;
  onOpenGoogleDrive?: () => void;
  onOpenConverter?: (module?: LearningModule) => void;
  onOpenGuide?: () => void;
  onToggleBookmark: (moduleId: string) => void;
  onDeleteCustomModule?: (moduleId: string) => void;
  onModuleUpdated?: (updatedModule: LearningModule) => void;
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({
  modules,
  progressMap,
  userRole,
  onSelectModule,
  onOpenUpload,
  onOpenBatchUpload,
  onOpenGoogleDrive,
  onOpenConverter,
  onOpenGuide,
  onToggleBookmark,
  onDeleteCustomModule,
  onModuleUpdated,
}) => {
  const isAdmin = userRole === 'admin' || userRole === 'guru';
  // Catalogs State
  const [catalogs, setCatalogs] = useState<CourseCatalogGroup[]>(() => getCatalogs());
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('all');
  const [isCreateCatalogOpen, setIsCreateCatalogOpen] = useState<boolean>(false);
  const [editingModule, setEditingModule] = useState<LearningModule | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('Semua');
  const [selectedLevel, setSelectedLevel] = useState<string>('Semua');
  const [viewTab, setViewTab] = useState<'all' | 'custom' | 'bookmarked'>('all');
  const [featureFilter, setFeatureFilter] = useState<'all' | 'video' | 'subtopics'>('all');

  // Sync catalogs on mount or storage events
  useEffect(() => {
    setCatalogs(getCatalogs());
  }, []);

  const subjects = ['Semua', 'Fisika', 'Matematika', 'Biologi', 'Kimia', 'Astronomi', 'Umum'];
  const levels = ['Semua', 'SD', 'SMP', 'SMA', 'Kuliah / Umum'];

  const activeCatalog = useMemo(() => {
    if (selectedCatalogId === 'all') return null;
    return catalogs.find((c) => c.id === selectedCatalogId) || null;
  }, [catalogs, selectedCatalogId]);

  // Real-time dynamic count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: modules.length };
    subjects.forEach((sub) => {
      if (sub !== 'Semua') {
        counts[sub] = modules.filter((m) => m.subject === sub).length;
      }
    });
    return counts;
  }, [modules]);

  // Real-time filtered modules
  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      // Catalog filter
      if (selectedCatalogId !== 'all' && activeCatalog) {
        const inCatalog = activeCatalog.moduleIds.includes(m.id) || m.catalogId === activeCatalog.id;
        if (!inCatalog) return false;
      }

      // Tab filter
      if (viewTab === 'custom' && !m.isCustom) return false;
      if (viewTab === 'bookmarked' && !progressMap[m.id]?.bookmarked) return false;

      // Feature filter
      if (featureFilter === 'video' && !(m.videoUrl && m.videoAddedByTeacher)) return false;
      if (featureFilter === 'subtopics' && !(m.subTopics && m.subTopics.length > 0)) return false;

      // Subject filter
      if (selectedSubject !== 'Semua' && m.subject !== selectedSubject) return false;

      // Level filter
      if (selectedLevel !== 'Semua' && m.level !== selectedLevel) return false;

      // Real-time Search query matching across title, subject, level, desc, author, objectives, and subtopics
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchSubject = m.subject.toLowerCase().includes(q);
        const matchLevel = m.level.toLowerCase().includes(q);
        const matchDesc = m.description.toLowerCase().includes(q);
        const matchAuthor = m.author.toLowerCase().includes(q);
        const matchFileName = m.fileName?.toLowerCase().includes(q);
        const matchObjectives = m.learningObjectives.some((obj) => obj.toLowerCase().includes(q));
        const matchSubTopics = m.subTopics?.some(
          (st) =>
            st.title.toLowerCase().includes(q) ||
            st.summary.toLowerCase().includes(q) ||
            st.subSubTopics.some(
              (sst) => sst.title.toLowerCase().includes(q) || sst.content.toLowerCase().includes(q)
            )
        );

        if (
          !matchTitle &&
          !matchSubject &&
          !matchLevel &&
          !matchDesc &&
          !matchAuthor &&
          !matchFileName &&
          !matchObjectives &&
          !matchSubTopics
        ) {
          return false;
        }
      }

      return true;
    });
  }, [modules, selectedCatalogId, activeCatalog, viewTab, featureFilter, selectedSubject, selectedLevel, searchQuery, progressMap]);

  // Statistics
  const totalModules = modules.length;
  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;
  const customCount = modules.filter((m) => m.isCustom).length;
  const teacherVideosCount = modules.filter((m) => m.videoUrl && m.videoAddedByTeacher).length;
  const withSubTopicsCount = modules.filter((m) => m.subTopics && m.subTopics.length > 0).length;

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSubject !== 'Semua' ||
    selectedLevel !== 'Semua' ||
    featureFilter !== 'all' ||
    viewTab !== 'all' ||
    selectedCatalogId !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('Semua');
    setSelectedLevel('Semua');
    setFeatureFilter('all');
    setViewTab('all');
    setSelectedCatalogId('all');
  };

  const handleDeleteCatalog = (catId: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus katalog "${title}"?`)) {
      deleteCatalog(catId);
      const updated = getCatalogs();
      setCatalogs(updated);
      if (selectedCatalogId === catId) {
        setSelectedCatalogId('all');
      }
    }
  };

  const handleCatalogCreated = (newCat: CourseCatalogGroup) => {
    const updated = getCatalogs();
    setCatalogs(updated);
    setSelectedCatalogId(newCat.id);
  };

  const getSubjectColorBadge = (subject: SubjectCategory) => {
    switch (subject) {
      case 'Fisika':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Matematika':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Biologi':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Kimia':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Astronomi':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Visual Progress Summary Dashboard Section */}
      <DashboardStats
        modules={modules}
        progressMap={progressMap}
        onSelectModule={onSelectModule}
      />

      {/* ============================================================== */}
      {/* KATALOG & KOLEKSI KURIKULUM (GURU DAPAT MEMBENTUK KATALOG BARU) */}
      {/* ============================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shadow-inner">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Koleksi &amp; Katalog Pembelajaran</span>
              </h3>
              <p className="text-xs text-slate-400">
                Pilih katalog untuk menyaring modul sesuai kelompok kurikulum, atau bentuk katalog baru khusus pengajar
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsCreateCatalogOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs transition shadow-lg flex items-center gap-1.5 self-start sm:self-auto hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Bentuk Katalog Baru</span>
            </button>
          )}
        </div>

        {/* Selected Catalog Detailed View Banner */}
        {activeCatalog && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/50 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 text-[10px]">
                  Katalog Sedang Aktif
                </span>
                <h4 className="font-bold text-white text-sm">{activeCatalog.title}</h4>
              </div>
              <p className="text-slate-300 text-[11px] max-w-2xl">{activeCatalog.description}</p>
              <div className="flex items-center gap-3 text-slate-400 text-[10px] pt-0.5 font-mono">
                <span>Penggagas: <strong className="text-slate-200">{activeCatalog.author}</strong></span>
                <span>&bull;</span>
                <span>Jenjang: <strong className="text-slate-200">{activeCatalog.level}</strong></span>
                <span>&bull;</span>
                <span>Mata Pelajaran: <strong className="text-slate-200">{activeCatalog.subject}</strong></span>
                <span>&bull;</span>
                <span>Jumlah Materi: <strong className="text-amber-400">{filteredModules.length} Modul</strong></span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCatalogId('all')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 whitespace-nowrap transition"
            >
              Kembali ke Semua Katalog
            </button>
          </div>
        )}
      </div>

      {/* Real-time Search & Category Filter Section */}
      <div id="search-catalog-section" className="space-y-4 bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl">
        {/* Top Controls Row: View Tabs & Upload Shortcut */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold gap-1">
            <button
              onClick={() => setViewTab('all')}
              className={`px-4 py-2 rounded-xl transition ${
                viewTab === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua Modul ({modules.length})
            </button>
            <button
              onClick={() => setViewTab('custom')}
              className={`px-4 py-2 rounded-xl transition ${
                viewTab === 'custom'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Koleksi Unggahan ({customCount})
            </button>
            <button
              onClick={() => setViewTab('bookmarked')}
              className={`px-4 py-2 rounded-xl transition ${
                viewTab === 'bookmarked'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Favorit Tersimpan
            </button>
          </div>

          {/* Feature Quick Filters */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden lg:inline">Filter Khusus:</span>
            <button
              onClick={() => setFeatureFilter(featureFilter === 'video' ? 'all' : 'video')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 ${
                featureFilter === 'video'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              <span>Video Pengajar ({teacherVideosCount})</span>
            </button>

            <button
              onClick={() => setFeatureFilter(featureFilter === 'subtopics' ? 'all' : 'subtopics')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 ${
                featureFilter === 'subtopics'
                  ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Submateri ({withSubTopicsCount})</span>
            </button>
          </div>
        </div>

        {/* Real-time Search Input Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Keystroke-triggered Search Bar */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari materi, judul, submateri, jenjang, atau pengajar secara real-time..."
              className="w-full bg-slate-950 border border-slate-700/80 text-slate-100 placeholder-slate-500 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Level Filter Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 text-slate-200 rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500"
            >
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  Jenjang: {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Status & Reset Button */}
          <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-2 text-xs">
            <span className="text-slate-400 font-mono">
              <strong>{filteredModules.length}</strong> / {totalModules} Modul
            </span>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Category Filter Buttons (Mata Pelajaran) with Count Badges */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            Kategori:
          </span>
          {subjects.map((sub) => {
            const isSelected = selectedSubject === sub;
            const count = categoryCounts[sub] || 0;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <span>{sub}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-850 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Course Grid Cards */}
      {filteredModules.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-slate-200">Tidak ada materi SWF yang sesuai kriteria</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? `Tidak ditemukan modul yang cocok dengan kata kunci "${searchQuery}". Coba gunakan istilah lain atau reset filter.`
              : 'Belum ada modul yang cocok dengan kombinasi filter kategori atau katalog saat ini.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua Filter</span>
              </button>
            )}
            {isAdmin && modules.length > 0 && (
              <button
                onClick={() => onSelectModule(modules[0])}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 border border-slate-700"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Buka Modul TPA</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => {
            const prog = progressMap[module.id];
            const isCompleted = prog?.completed;
            const isBookmarked = prog?.bookmarked;
            const score = prog?.score;

            const hasTeacherVideo = Boolean(module.videoUrl && module.videoAddedByTeacher);
            const subTopicsCount = module.subTopics?.length || 0;
            const subSubTopicsCount =
              module.subTopics?.reduce((acc, st) => acc + (st.subSubTopics?.length || 0), 0) || 0;
            const completedSubSubCount =
              module.subTopics
                ?.flatMap((st) => st.subSubTopics || [])
                .filter((sst) => prog?.completedSubSubTopicIds?.includes(sst.id)).length || 0;

            // Catalogs this module is included in
            const moduleCatalogs = catalogs.filter((c) => c.moduleIds.includes(module.id));

            return (
              <div
                key={module.id}
                className="group bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
              >
                <div>
                  {/* Thumbnail & Flash Badge */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={module.thumbnail}
                      alt={module.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                    />

                    {/* Top badging */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                        .SWF FLASH
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur text-slate-300 text-[10px] font-semibold border border-slate-700">
                        {module.level}
                      </span>
                      {hasTeacherVideo && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-bold shadow flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Video Pengajar
                        </span>
                      )}
                    </div>

                    {/* Bookmark quick button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(module.id);
                      }}
                      className={`absolute top-2.5 right-2.5 p-1.5 rounded-xl backdrop-blur transition ${
                        isBookmarked
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-950/70 text-slate-300 hover:text-white'
                      }`}
                      title={isBookmarked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                    >
                      {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    {/* Completion status */}
                    {isCompleted && (
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-bold shadow">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selesai {score !== undefined ? `(${score}%)` : ''}</span>
                      </div>
                    )}

                    {/* Submateri progress pill */}
                    {subSubTopicsCount > 0 && (
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur border border-slate-700 text-slate-300 text-[10px] font-mono">
                        <Layers className="w-3 h-3 text-sky-400" />
                        <span>
                          {completedSubSubCount}/{subSubTopicsCount} Topik
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold border text-[11px] ${getSubjectColorBadge(
                          module.subject
                        )}`}
                      >
                        {module.subject}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {module.durationMinutes} Menit
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm line-clamp-2 leading-snug group-hover:text-amber-400 transition">
                      {module.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {module.description}
                    </p>

                    {/* Submateri & Materi Terupload info */}
                    {subTopicsCount >= 0 && (
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-2 text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-sky-400 font-semibold">
                            <Layers className="w-3.5 h-3.5" />
                            {subTopicsCount} Submateri
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">
                              {subSubTopicsCount} Sub-submateri
                            </span>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingModule(module);
                                }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 text-[10px] font-bold transition"
                                title="Edit Modul: Tambah atau Hapus Submateri"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                <span>Edit Submateri</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1 pt-1 border-t border-slate-800/70">
                          {(module.subTopics || []).map((st, sIdx) => {
                            const uploadedList = getSubTopicUploadedFiles(st);
                            return (
                              <div
                                key={st.id}
                                className="flex items-center justify-between gap-2 text-[10px] py-0.5"
                              >
                                <span className="text-slate-300 truncate font-medium">
                                  {sIdx + 1}. {st.title}
                                </span>
                                {uploadedList.length > 0 ? (
                                  <span
                                    className="px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 font-mono font-bold shrink-0 truncate max-w-[140px]"
                                    title={uploadedList.map((f) => f.fileName).join(', ')}
                                  >
                                    ✓ {uploadedList.length} File ({uploadedList[uploadedList.length - 1].fileName})
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-mono shrink-0">
                                    Belum ada SWF
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Catalog tags if in catalogs */}
                    {moduleCatalogs.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {moduleCatalogs.map((c) => (
                          <span
                            key={c.id}
                            className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-[10px] text-purple-300 font-mono truncate max-w-[160px]"
                            title={`Termasuk dalam ${c.title}`}
                          >
                            📁 {c.title}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{module.author}</span>
                      </div>

                      <span className="font-mono text-slate-500 text-[10px]">
                        {module.fileName || 'module.swf'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => onSelectModule(module)}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg ${
                      isAdmin
                        ? 'bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-slate-950 font-black'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isAdmin ? 'Buka Modul & Kelola / Unggah SWF' : 'Mulai Belajar Modul TPA'}</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModule(module);
                      }}
                      className="p-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 transition"
                      title="Edit Modul (Tambah & Hapus Submateri)"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {isAdmin && onOpenConverter && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenConverter(module);
                      }}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-400 border border-slate-700 transition"
                      title="Konversi Modul Flash Ini ke Video MP4"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  )}

                  {isAdmin && module.isCustom && onDeleteCustomModule && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomModule(module.id);
                      }}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                      title="Hapus Modul Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to Form New Catalog (Bentukan Guru) */}
      <CreateCatalogModal
        isOpen={isCreateCatalogOpen}
        onClose={() => setIsCreateCatalogOpen(false)}
        modules={modules}
        onCatalogCreated={handleCatalogCreated}
      />

      {/* Modal to Edit Module & Submateri (Admin Only) */}
      {isAdmin && editingModule && (
        <EditModuleModal
          isOpen={Boolean(editingModule)}
          onClose={() => setEditingModule(null)}
          module={editingModule}
          onModuleUpdated={(updatedMod) => {
            if (onModuleUpdated) {
              onModuleUpdated(updatedMod);
            }
            setEditingModule(null);
          }}
        />
      )}
    </div>
  );
};
