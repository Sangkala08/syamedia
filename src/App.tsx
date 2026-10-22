import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CourseCatalog } from './components/CourseCatalog';
import { ModuleViewer } from './components/ModuleViewer';
import { SwfToVideoConverterModal } from './components/SwfToVideoConverterModal';
import { CertificateModal } from './components/CertificateModal';
import { CompatibilityGuideModal } from './components/CompatibilityGuideModal';
import { BUILTIN_COURSES } from './data/coursesData';
import { LearningModule, UserProgress } from './types';
import {
  initializeCourseState,
  getCustomModules,
  saveCustomModule,
  deleteCustomModule,
  getAllProgress,
  toggleBookmark,
  getUserRole,
  setUserRole,
  getModuleOverrides,
  saveModuleOverride,
  clearAllAppCache,
} from './services/storage';
import { Flame, ShieldCheck, Cpu, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>({});
  const [userRole, setUserRoleState] = useState<'siswa' | 'admin'>('siswa');

  const [isConverterOpen, setIsConverterOpen] = useState<boolean>(false);
  const [converterTargetModule, setConverterTargetModule] = useState<LearningModule | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [certificateData, setCertificateData] = useState<{ module: LearningModule; score: number } | null>(null);
  const [cacheClearedNotice, setCacheClearedNotice] = useState<string | null>(null);

  // Global Undo & Redo stack for Admin module edits
  const [globalUndoStack, setGlobalUndoStack] = useState<LearningModule[][]>([]);
  const [globalRedoStack, setGlobalRedoStack] = useState<LearningModule[][]>([]);

  const loadCleanOrPersistedState = () => {
    const custom = getCustomModules();
    const overrides = getModuleOverrides();
    const combined = [...custom, ...BUILTIN_COURSES].map((m) => {
      if (overrides[m.id]) {
        return { ...m, ...overrides[m.id] };
      }
      return JSON.parse(JSON.stringify(m));
    });
    setModules(combined);
    setProgressMap(getAllProgress());
    setUserRoleState(getUserRole());
  };

  // Initialize course state and load single TPA module on mount
  useEffect(() => {
    initializeCourseState();
    loadCleanOrPersistedState();
  }, []);

  const handleClearAllCache = async () => {
    await clearAllAppCache(true);
    setGlobalUndoStack([]);
    setGlobalRedoStack([]);
    const freshModules = BUILTIN_COURSES.map((m) => JSON.parse(JSON.stringify(m)));
    setModules(freshModules);
    setProgressMap({});
    if (selectedModule) {
      const freshSelected = freshModules.find((m) => m.id === selectedModule.id) || null;
      setSelectedModule(freshSelected);
    }
    setCacheClearedNotice('Semua cache (LocalStorage, SessionStorage, IndexedDB & Browser Cache) berhasil dibersihkan.');
    setTimeout(() => setCacheClearedNotice(null), 4000);
  };

  const refreshProgress = () => {
    setProgressMap(getAllProgress());
  };

  const handleSelectModule = (module: LearningModule) => {
    setSelectedModule(module);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCatalog = () => {
    setSelectedModule(null);
    refreshProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleModuleUpdated = (updatedMod: LearningModule) => {
    setGlobalUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(modules))]);
    setGlobalRedoStack([]);
    setModules((prev) =>
      prev.map((m) => (m.id === updatedMod.id ? updatedMod : m))
    );
    if (selectedModule?.id === updatedMod.id) {
      setSelectedModule(updatedMod);
    }
  };

  const persistModulesSnapshot = (snapshot: LearningModule[]) => {
    setModules(snapshot);
    snapshot.forEach((mod) => {
      saveModuleOverride(mod.id, {
        title: mod.title,
        description: mod.description,
        subject: mod.subject,
        level: mod.level,
        durationMinutes: mod.durationMinutes,
        swfSourceType: mod.swfSourceType,
        blobKey: mod.blobKey,
        fileName: mod.fileName,
        fileSizeBytes: mod.fileSizeBytes,
        subTopics: mod.subTopics,
      });
      if (mod.isCustom) {
        saveCustomModule(mod);
      }
    });
    if (selectedModule) {
      const found = snapshot.find((m) => m.id === selectedModule.id);
      if (found) setSelectedModule(found);
    }
  };

  const handleGlobalUndo = () => {
    if (globalUndoStack.length === 0) return;
    const prevSnapshot = globalUndoStack[globalUndoStack.length - 1];
    setGlobalRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(modules))]);
    setGlobalUndoStack((prev) => prev.slice(0, -1));
    persistModulesSnapshot(prevSnapshot);
  };

  const handleGlobalRedo = () => {
    if (globalRedoStack.length === 0) return;
    const nextSnapshot = globalRedoStack[globalRedoStack.length - 1];
    setGlobalUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(modules))]);
    setGlobalRedoStack((prev) => prev.slice(0, -1));
    persistModulesSnapshot(nextSnapshot);
  };

  const handleOpenConverter = (target?: LearningModule) => {
    setConverterTargetModule(target || selectedModule || null);
    setIsConverterOpen(true);
  };

  const handleVideoAttachedToModule = (moduleId: string, videoBlobUrl: string, durationSeconds: number) => {
    handleModuleVideoUpdated(
      moduleId,
      videoBlobUrl,
      `Video Pembahasan Resmi Pengajar: ${modules.find((m) => m.id === moduleId)?.title || ''}`,
      durationSeconds
    );
  };

  const handleModuleVideoUpdated = (
    moduleId: string,
    videoUrl?: string,
    title?: string,
    duration?: number
  ) => {
    const override: Partial<LearningModule> = {
      videoUrl: videoUrl || undefined,
      videoDurationSeconds: duration || undefined,
      videoTitle: title || undefined,
      videoAddedByTeacher: Boolean(videoUrl),
    };

    saveModuleOverride(moduleId, override);

    setModules((prev) =>
      prev.map((m) => {
        if (m.id === moduleId) {
          const updated = {
            ...m,
            ...override,
          };
          if (m.isCustom) {
            saveCustomModule(updated);
          }
          return updated;
        }
        return m;
      })
    );

    if (selectedModule?.id === moduleId) {
      setSelectedModule((prev) => (prev ? { ...prev, ...override } : null));
    }
  };

  const handleDeleteModule = (id: string) => {
    deleteCustomModule(id);
    setModules((prev) => prev.filter((m) => m.id !== id));
    if (selectedModule?.id === id) {
      setSelectedModule(null);
    }
    refreshProgress();
  };

  const handleToggleBookmark = (id: string) => {
    toggleBookmark(id);
    refreshProgress();
  };

  const handleToggleRole = () => {
    const nextRole = userRole === 'siswa' ? 'admin' : 'siswa';
    setUserRoleState(nextRole);
    setUserRole(nextRole);
  };

  const handleOpenCertificate = (mod: LearningModule, score: number) => {
    setCertificateData({ module: mod, score });
  };

  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        currentView={selectedModule ? 'viewer' : 'catalog'}
        onNavigateHome={handleBackToCatalog}
        onOpenConverter={() => handleOpenConverter()}
        onOpenGuide={() => setIsGuideOpen(true)}
        userRole={userRole}
        onToggleRole={handleToggleRole}
        completedCount={completedCount}
        totalCount={modules.length}
        undoCount={globalUndoStack.length}
        redoCount={globalRedoStack.length}
        onUndo={handleGlobalUndo}
        onRedo={handleGlobalRedo}
        onClearCache={handleClearAllCache}
      />

      {cacheClearedNotice && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-3">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-medium shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cacheClearedNotice}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {selectedModule ? (
          <ModuleViewer
            module={selectedModule}
            onBack={handleBackToCatalog}
            onOpenCertificate={handleOpenCertificate}
            onOpenConverter={handleOpenConverter}
            onModuleVideoUpdated={handleModuleVideoUpdated}
            onModuleUpdated={handleModuleUpdated}
            userRole={userRole}
          />
        ) : (
          <CourseCatalog
            modules={modules}
            progressMap={progressMap}
            userRole={userRole}
            onSelectModule={handleSelectModule}
            onOpenConverter={handleOpenConverter}
            onOpenGuide={() => setIsGuideOpen(true)}
            onToggleBookmark={handleToggleBookmark}
            onDeleteCustomModule={handleDeleteModule}
            onModuleUpdated={handleModuleUpdated}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 px-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-slate-950 ${
              userRole === 'admin' ? 'bg-amber-500' : 'bg-emerald-400'
            }`}>
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <span className="font-bold text-white">FlashLearn E-Learning</span>
          </div>
        </div>
      </footer>

      {/* Converter & Guide Modals */}
      <SwfToVideoConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
        modules={modules}
        initialSelectedModule={converterTargetModule}
        onVideoAttachedToModule={handleVideoAttachedToModule}
      />

      <CompatibilityGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {certificateData && (
        <CertificateModal
          isOpen={!!certificateData}
          onClose={() => setCertificateData(null)}
          module={certificateData.module}
          score={certificateData.score}
        />
      )}
    </div>
  );
}
