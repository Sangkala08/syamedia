import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  BookOpen,
  Award,
  FileText,
  HelpCircle,
  Download,
  Share2,
  User,
  Calendar,
  Save,
  Check,
  Film,
  Video,
  Layers,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckSquare,
  Square,
  Sparkles,
  ShieldCheck,
  ListOrdered,
  Upload,
  Trash2,
  Play,
  Flame,
  AlertCircle,
  FolderPlus,
  CloudDownload,
  Plus,
  Edit3,
  Undo2,
  Redo2
} from 'lucide-react';
import {
  LearningModule,
  UserProgress,
  SubTopic,
  SubSubTopic,
  UploadedSwfFile,
  getSubTopicUploadedFiles
} from '../types';
import { RufflePlayer, ActiveSwfSource } from './RufflePlayer';
import { VideoPlayerSection } from './VideoPlayerSection';
import { ModuleBatchUploadModal } from './ModuleBatchUploadModal';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';
import { EditModuleModal } from './EditModuleModal';
import {
  getNote,
  saveNote,
  saveProgress,
  getAllProgress,
  toggleBookmark,
  toggleSubSubTopicCompleted,
  saveSwfBlob,
  deleteSwfBlob,
  saveModuleOverride
} from '../services/storage';
import {
  googleSignIn,
  getAccessToken,
  listFilesInDriveFolder,
  downloadDriveSwfBlob,
  VERBAL_DRIVE_FOLDER_ID,
  VERBAL_DRIVE_FOLDER_URL,
} from '../services/googleDrive';

interface ModuleViewerProps {
  module: LearningModule;
  onBack: () => void;
  onOpenCertificate: (module: LearningModule, score: number) => void;
  onOpenConverter?: (module: LearningModule) => void;
  onModuleVideoUpdated?: (moduleId: string, videoUrl?: string, title?: string, duration?: number) => void;
  onModuleUpdated?: (module: LearningModule) => void;
  userRole?: 'siswa' | 'admin' | 'guru';
}

export const ModuleViewer: React.FC<ModuleViewerProps> = ({
  module,
  onBack,
  onOpenCertificate,
  onOpenConverter,
  onModuleVideoUpdated,
  onModuleUpdated,
  userRole = 'siswa',
}) => {
  const isAdmin = userRole === 'admin' || userRole === 'guru';
  const [currentModule, setCurrentModule] = useState<LearningModule>(module);
  const [activeSwfSource, setActiveSwfSource] = useState<ActiveSwfSource | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<{ message: string; isError?: boolean } | null>(null);
  const mainModuleFileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'submateri' | 'lks' | 'video' | 'quiz' | 'notes' | 'info'>('submateri');
  const [currentProgress, setCurrentProgress] = useState<UserProgress | undefined>(undefined);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [studentNote, setStudentNote] = useState<string>('');
  const [noteSavedFeedback, setNoteSavedFeedback] = useState<boolean>(false);

  // Expanded subtopics accordion state
  const [expandedSubTopics, setExpandedSubTopics] = useState<Record<string, boolean>>({});

  // Active sub-subtopic modal or preview
  const [selectedSubSubTopic, setSelectedSubSubTopic] = useState<SubSubTopic | null>(null);

  // Batch upload, Google Drive & Edit Module modal state (Admin only, inside module/submodules)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isEditModuleModalOpen, setIsEditModuleModalOpen] = useState<boolean>(false);
  const [modalInitialTargetId, setModalInitialTargetId] = useState<string>('main');

  // Inline Submateri Add / Edit / Delete states (Admin only)
  const [isAddingSubTopicInline, setIsAddingSubTopicInline] = useState<boolean>(false);
  const [newSubTopicTitle, setNewSubTopicTitle] = useState<string>('');
  const [newSubTopicSummary, setNewSubTopicSummary] = useState<string>('');
  const [editingSubTopicId, setEditingSubTopicId] = useState<string | null>(null);
  const [editSubTopicTitle, setEditSubTopicTitle] = useState<string>('');
  const [editSubTopicSummary, setEditSubTopicSummary] = useState<string>('');
  const [confirmDeleteSubTopicId, setConfirmDeleteSubTopicId] = useState<string | null>(null);
  const [addingSubSubTopicForId, setAddingSubSubTopicForId] = useState<string | null>(null);
  const [newSubSubTitle, setNewSubSubTitle] = useState<string>('');
  const [newSubSubContent, setNewSubSubContent] = useState<string>('');
  const [newSubSubDuration, setNewSubSubDuration] = useState<number>(15);

  // Undo / Redo History Stack for Admin Edits
  const [undoStack, setUndoStack] = useState<{ module: LearningModule; actionLabel: string }[]>([]);
  const [redoStack, setRedoStack] = useState<{ module: LearningModule; actionLabel: string }[]>([]);

  const pushModuleHistory = (actionLabel: string) => {
    const snapshot: LearningModule = JSON.parse(JSON.stringify(currentModule));
    setUndoStack((prev) => [...prev, { module: snapshot, actionLabel }]);
    setRedoStack([]);
  };

  const persistRestoredModule = (restoredMod: LearningModule) => {
    setCurrentModule(restoredMod);
    saveModuleOverride(restoredMod.id, {
      title: restoredMod.title,
      description: restoredMod.description,
      subject: restoredMod.subject,
      level: restoredMod.level,
      durationMinutes: restoredMod.durationMinutes,
      swfSourceType: restoredMod.swfSourceType,
      blobKey: restoredMod.blobKey,
      fileName: restoredMod.fileName,
      fileSizeBytes: restoredMod.fileSizeBytes,
      subTopics: restoredMod.subTopics,
    });
    if (onModuleUpdated) {
      onModuleUpdated(restoredMod);
    }
  };

  const handleAdminUndo = () => {
    if (undoStack.length === 0) return;
    const prevEntry = undoStack[undoStack.length - 1];
    const currentSnapshot: LearningModule = JSON.parse(JSON.stringify(currentModule));

    setRedoStack((prev) => [...prev, { module: currentSnapshot, actionLabel: prevEntry.actionLabel }]);
    setUndoStack((prev) => prev.slice(0, -1));

    persistRestoredModule(prevEntry.module);
    setUploadFeedback({
      message: `Undo berhasil: Membatalkan perubahan "${prevEntry.actionLabel}".`,
    });
    setTimeout(() => setUploadFeedback(null), 3500);
  };

  const handleAdminRedo = () => {
    if (redoStack.length === 0) return;
    const nextEntry = redoStack[redoStack.length - 1];
    const currentSnapshot: LearningModule = JSON.parse(JSON.stringify(currentModule));

    setUndoStack((prev) => [...prev, { module: currentSnapshot, actionLabel: nextEntry.actionLabel }]);
    setRedoStack((prev) => prev.slice(0, -1));

    persistRestoredModule(nextEntry.module);
    setUploadFeedback({
      message: `Redo berhasil: Mengembalikan perubahan "${nextEntry.actionLabel}".`,
    });
    setTimeout(() => setUploadFeedback(null), 3500);
  };

  const handleOpenBatchForTarget = (targetId: string = 'main') => {
    setModalInitialTargetId(targetId);
    setIsBatchModalOpen(true);
  };

  const handleOpenDriveForTarget = (targetId: string = 'main') => {
    setModalInitialTargetId(targetId);
    setIsDriveModalOpen(true);
  };

  const handleModalModuleUpdated = (
    updatedMod: LearningModule,
    lastActiveTarget?: { targetId: string; blobKey: string; fileName: string; title: string }
  ) => {
    pushModuleHistory(
      lastActiveTarget
        ? `Unggah SWF "${lastActiveTarget.fileName}"`
        : 'Pembaruan Berkas SWF'
    );
    setCurrentModule(updatedMod);
    if (onModuleUpdated) {
      onModuleUpdated(updatedMod);
    }
    if (lastActiveTarget) {
      if (lastActiveTarget.targetId === 'main') {
        setActiveSwfSource({
          title: updatedMod.title,
          sourceType: 'uploaded_blob',
          blobKey: lastActiveTarget.blobKey,
          fileName: lastActiveTarget.fileName,
        });
      } else {
        setActiveSwfSource({
          title: lastActiveTarget.title,
          sourceType: 'uploaded_blob',
          blobKey: lastActiveTarget.blobKey,
          fileName: lastActiveTarget.fileName,
        });
        setExpandedSubTopics((prev) => ({ ...prev, [lastActiveTarget.targetId]: true }));
      }
      setUploadFeedback({
        message: `Berkas SWF "${lastActiveTarget.fileName}" beserta antrean berhasil dipasang dan siap diputar!`,
      });
      setTimeout(() => setUploadFeedback(null), 5000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Load progress and note
  useEffect(() => {
    const all = getAllProgress();
    const progress = all[module.id];
    setCurrentProgress(progress);
    if (progress) {
      setIsBookmarked(!!progress.bookmarked);
      if (progress.score !== undefined) {
        setUserScore(progress.score);
      }
    }
    const note = getNote(module.id);
    setStudentNote(note);

    // Expand all subtopics by default so uploaded materials per submateri are immediately visible
    if (module.subTopics && module.subTopics.length > 0) {
      const allExpanded: Record<string, boolean> = {};
      module.subTopics.forEach((st) => {
        allExpanded[st.id] = true;
      });
      setExpandedSubTopics(allExpanded);
    }
  }, [module.id]);

  useEffect(() => {
    setCurrentModule(module);
  }, [module]);

  const handleBookmark = () => {
    const state = toggleBookmark(module.id);
    setIsBookmarked(state);
  };

  const handleMainModuleSwfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.swf')) {
      setUploadFeedback({ message: 'Harap pilih berkas dengan ekstensi .swf', isError: true });
      setTimeout(() => setUploadFeedback(null), 3500);
      return;
    }

    try {
      const blobKey = `swf_mod_${currentModule.id}_${Date.now()}`;
      await saveSwfBlob(blobKey, file);

      pushModuleHistory(`Unggah SWF Modul Utama "${file.name}"`);

      const updated: LearningModule = {
        ...currentModule,
        swfSourceType: 'uploaded_blob',
        blobKey,
        fileName: file.name,
        fileSizeBytes: file.size,
      };

      setCurrentModule(updated);
      saveModuleOverride(currentModule.id, {
        swfSourceType: 'uploaded_blob',
        blobKey,
        fileName: file.name,
        fileSizeBytes: file.size,
      });

      if (onModuleUpdated) {
        onModuleUpdated(updated);
      }

      setActiveSwfSource({
        title: updated.title,
        sourceType: 'uploaded_blob',
        blobKey,
        fileName: file.name,
      });

      setUploadFeedback({
        message: `Berkas Flash .SWF "${file.name}" berhasil diunggah dan dipasang pada Modul Utama!`,
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    } catch (err: any) {
      setUploadFeedback({ message: `Gagal menyimpan berkas SWF: ${err.message}`, isError: true });
      setTimeout(() => setUploadFeedback(null), 4000);
    }
  };

  const handleSubTopicFilesUpload = async (subTopicId: string, filesInput: FileList | File[]) => {
    const validFiles = Array.from(filesInput).filter((f) => f.name.toLowerCase().endsWith('.swf'));
    if (validFiles.length === 0) {
      setUploadFeedback({ message: 'Harap pilih berkas dengan ekstensi .swf', isError: true });
      setTimeout(() => setUploadFeedback(null), 3500);
      return;
    }

    try {
      const nowFormatted = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      const newEntries: UploadedSwfFile[] = [];
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const blobKey = `swf_sub_${subTopicId}_${Date.now()}_${i}`;
        await saveSwfBlob(blobKey, file);
        newEntries.push({
          id: blobKey,
          blobKey,
          fileName: file.name,
          fileSizeBytes: file.size,
          uploadedAt: nowFormatted,
          source: validFiles.length > 1 ? 'batch' : 'local',
        });
      }

      const lastEntry = newEntries[newEntries.length - 1];
      const targetSt = (currentModule.subTopics || []).find((s) => s.id === subTopicId);

      pushModuleHistory(`Unggah ${newEntries.length} SWF ke "${targetSt?.title || subTopicId}"`);

      const updatedSubTopics = (currentModule.subTopics || []).map((st) => {
        if (st.id === subTopicId) {
          const existing = getSubTopicUploadedFiles(st);
          return {
            ...st,
            blobKey: lastEntry.blobKey,
            fileName: lastEntry.fileName,
            fileSizeBytes: lastEntry.fileSizeBytes,
            uploadedFiles: [...existing, ...newEntries],
          };
        }
        return st;
      });

      const updated: LearningModule = {
        ...currentModule,
        subTopics: updatedSubTopics,
      };

      setCurrentModule(updated);
      saveModuleOverride(currentModule.id, { subTopics: updatedSubTopics });

      if (onModuleUpdated) {
        onModuleUpdated(updated);
      }

      setActiveSwfSource({
        title: `${targetSt?.title || 'Submateri'} — ${lastEntry.fileName}`,
        sourceType: 'uploaded_blob',
        blobKey: lastEntry.blobKey,
        fileName: lastEntry.fileName,
      });

      setUploadFeedback({
        message: `${newEntries.length} berkas SWF berhasil terupload pada Submateri ${targetSt?.title || subTopicId} dan ditampilkan pada daftar materi!`,
      });
      setTimeout(() => setUploadFeedback(null), 5000);
    } catch (err: any) {
      setUploadFeedback({ message: `Gagal menyimpan berkas SWF: ${err.message}`, isError: true });
      setTimeout(() => setUploadFeedback(null), 4000);
    }
  };

  const handleDeleteUploadedSwfItem = (subTopicId: string, fileItem: UploadedSwfFile) => {
    pushModuleHistory(`Hapus SWF "${fileItem.fileName}"`);

    const updatedSubTopics = (currentModule.subTopics || []).map((st) => {
      if (st.id === subTopicId) {
        const remaining = getSubTopicUploadedFiles(st).filter((f) => f.id !== fileItem.id && f.blobKey !== fileItem.blobKey);
        const latest = remaining[remaining.length - 1];
        const copy: SubTopic = {
          ...st,
          uploadedFiles: remaining,
        };
        if (latest) {
          copy.blobKey = latest.blobKey;
          copy.fileName = latest.fileName;
          copy.fileSizeBytes = latest.fileSizeBytes;
          copy.swfUrl = latest.swfUrl;
        } else {
          delete copy.blobKey;
          delete copy.fileName;
          delete copy.fileSizeBytes;
          delete copy.swfUrl;
        }
        return copy;
      }
      return st;
    });

    const updated: LearningModule = {
      ...currentModule,
      subTopics: updatedSubTopics,
    };

    setCurrentModule(updated);
    saveModuleOverride(currentModule.id, { subTopics: updatedSubTopics });
    if (onModuleUpdated) onModuleUpdated(updated);

    if (activeSwfSource?.blobKey === fileItem.blobKey) {
      setActiveSwfSource(null);
    }

    setUploadFeedback({ message: `Materi "${fileItem.fileName}" telah dihapus dari submateri (Klik Undo untuk mengembalikan).` });
    setTimeout(() => setUploadFeedback(null), 3500);
  };

  const handleToggleSubTopicAccordion = (subTopicId: string) => {
    setExpandedSubTopics((prev) => ({
      ...prev,
      [subTopicId]: !prev[subTopicId],
    }));
  };

  // Admin: Tambah Submateri Baru secara langsung
  const handleAddSubTopicInline = () => {
    const trimmedTitle = newSubTopicTitle.trim();
    if (!trimmedTitle) {
      setUploadFeedback({ message: 'Judul submateri baru tidak boleh kosong.', isError: true });
      setTimeout(() => setUploadFeedback(null), 3500);
      return;
    }

    pushModuleHistory(`Tambah Submateri "${trimmedTitle}"`);

    const slug = trimmedTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const newId = `st-${slug || 'sub'}-${Date.now().toString().slice(-4)}`;

    const newSubTopic: SubTopic = {
      id: newId,
      title: trimmedTitle,
      summary:
        newSubTopicSummary.trim() ||
        `Submateri pembahasan, latihan soal, dan simulasi interaktif ${trimmedTitle}.`,
      subSubTopics: [
        {
          id: `sst-${slug || 'sub'}-1-${Date.now().toString().slice(-4)}`,
          title: `1. Konsep & Latihan ${trimmedTitle}`,
          content:
            newSubTopicSummary.trim() ||
            `Pelajari materi dan simulasi interaktif untuk submateri ${trimmedTitle}.`,
          durationMinutes: 15,
          keyPoints: [`Konsep dasar ${trimmedTitle}`, 'Latihan & evaluasi pemahaman'],
        },
      ],
      uploadedFiles: [],
    };

    const updatedSubTopics = [...(currentModule.subTopics || []), newSubTopic];
    const updated: LearningModule = {
      ...currentModule,
      subTopics: updatedSubTopics,
    };

    setCurrentModule(updated);
    saveModuleOverride(currentModule.id, { subTopics: updatedSubTopics });
    if (onModuleUpdated) onModuleUpdated(updated);

    setExpandedSubTopics((prev) => ({ ...prev, [newId]: true }));
    setNewSubTopicTitle('');
    setNewSubTopicSummary('');
    setIsAddingSubTopicInline(false);

    setUploadFeedback({
      message: `Submateri "${trimmedTitle}" berhasil ditambahkan ke dalam modul!`,
    });
    setTimeout(() => setUploadFeedback(null), 4000);
  };

  // Admin: Simpan Edit Judul & Ringkasan Submateri
  const handleSaveEditSubTopicInline = (subTopicId: string) => {
    const trimmedTitle = editSubTopicTitle.trim();
    if (!trimmedTitle) {
      setUploadFeedback({ message: 'Judul submateri tidak boleh kosong.', isError: true });
      setTimeout(() => setUploadFeedback(null), 3500);
      return;
    }

    pushModuleHistory(`Edit Submateri "${trimmedTitle}"`);

    const updatedSubTopics = (currentModule.subTopics || []).map((st) =>
      st.id === subTopicId
        ? {
            ...st,
            title: trimmedTitle,
            summary: editSubTopicSummary.trim() || st.summary,
          }
        : st
    );

    const updated: LearningModule = {
      ...currentModule,
      subTopics: updatedSubTopics,
    };

    setCurrentModule(updated);
    saveModuleOverride(currentModule.id, { subTopics: updatedSubTopics });
    if (onModuleUpdated) onModuleUpdated(updated);

    setEditingSubTopicId(null);
    setUploadFeedback({
      message: `Submateri "${trimmedTitle}" berhasil diperbarui!`,
    });
    setTimeout(() => setUploadFeedback(null), 3500);
  };

  // Admin: Hapus Submateri dari Modul
  const handleDeleteSubTopic = (subTopic: SubTopic) => {
    pushModuleHistory(`Hapus Submateri "${subTopic.title}"`);

    const updatedSubTopics = (currentModule.subTopics || []).filter(
      (st) => st.id !== subTopic.id
    );

    const updated: LearningModule = {
      ...currentModule,
      subTopics: updatedSubTopics,
    };

    setCurrentModule(updated);
    saveModuleOverride(currentModule.id, { subTopics: updatedSubTopics });
    if (onModuleUpdated) onModuleUpdated(updated);

    setConfirmDeleteSubTopicId(null);
    setUploadFeedback({
      message: `Submateri "${subTopic.title}" telah dihapus (Gunakan tombol Undo untuk mengembalikan).`,
    });
    setTimeout(() => setUploadFeedback(null), 4000);
  };

  // Admin: Tambah Sub-submateri ke dalam Submateri
  const [isSyncingVerbalFolder, setIsSyncingVerbalFolder] = useState<boolean>(false);

  const handleSyncVerbalDriveFolder = async () => {
    setIsSyncingVerbalFolder(true);
    try {
      let token = getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        token = authRes.accessToken;
      }

      const folderFiles = await listFilesInDriveFolder(VERBAL_DRIVE_FOLDER_ID, token);
      if (folderFiles.length === 0) {
        setUploadFeedback({
          message: `Folder Google Drive (${VERBAL_DRIVE_FOLDER_ID}) terhubung, menampilkan semua file pada Submateri 1: Kemampuan Penalaran Verbal.`,
        });
        setTimeout(() => setUploadFeedback(null), 4000);
        return;
      }

      pushModuleHistory('Sinkronisasi Semua File Folder Drive ke Submateri 1');

      const nowFormatted = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      const importedEntries: UploadedSwfFile[] = [];
      for (let i = 0; i < folderFiles.length; i++) {
        const f = folderFiles[i];
        const blob = await downloadDriveSwfBlob(f.id, token);
        const blobKey = `swf_gdrive_folder_${VERBAL_DRIVE_FOLDER_ID}_${f.id}`;
        await saveSwfBlob(blobKey, blob);
        importedEntries.push({
          id: blobKey,
          blobKey,
          fileName: f.name,
          fileSizeBytes: blob.size || Number(f.size) || 0,
          uploadedAt: `Folder Drive (${nowFormatted})`,
          source: 'gdrive',
        });
      }

      const updatedSubTopics = (currentModule.subTopics || []).map((st) => {
        if (st.id === 'sub-verbal') {
          return {
            ...st,
            blobKey: importedEntries[0].blobKey,
            fileName: importedEntries[0].fileName,
            fileSizeBytes: importedEntries[0].fileSizeBytes,
            uploadedFiles: importedEntries,
          };
        }
        return st;
      });

      const updated: LearningModule = {
        ...currentModule,
        subTopics: updatedSubTopics,
      };

      setCurrentModule(updated);
      saveModuleOverride(currentModule.id, { subTopics: updatedSubTopics });
      if (onModuleUpdated) onModuleUpdated(updated);

      setActiveSwfSource({
        title: `Submateri 1: Kemampuan Penalaran Verbal — ${importedEntries[0].fileName}`,
        sourceType: 'uploaded_blob',
        blobKey: importedEntries[0].blobKey,
        fileName: importedEntries[0].fileName,
      });

      setUploadFeedback({
        message: `Berhasil memuat ${importedEntries.length} file dari folder Google Drive ke Submateri 1: Kemampuan Penalaran Verbal!`,
      });
      setTimeout(() => setUploadFeedback(null), 5000);
    } catch (err: any) {
      setUploadFeedback({
        message:
          err.message ||
          'Gagal menyinkronkan langsung dari Google Drive. File bawaan folder Submateri 1 tetap ditampilkan.',
      });
      setTimeout(() => setUploadFeedback(null), 5000);
    } finally {
      setIsSyncingVerbalFolder(false);
    }
  };

  const handleAddSubSubTopicInline = (subTopicId: string) => {
    if (!newSubSubTitle.trim()) return;
    pushModuleHistory(`Tambah Sub-submateri "${newSubSubTitle.trim()}"`);

    const newSst: SubSubTopic = {
      id: `sst-${subTopicId}-${Date.now().toString().slice(-4)}`,
      title: newSubSubTitle.trim(),
      content:
        newSubSubContent.trim() ||
        `Pembahasan materi dan latihan interaktif untuk ${newSubSubTitle.trim()}.`,
      durationMinutes: Number(newSubSubDuration) || 15,
      keyPoints: [`Pemahaman materi ${newSubSubTitle.trim()}`],
    };

    const updatedSubTopics = (currentModule.subTopics || []).map((st) =>
      st.id === subTopicId
        ? {
            ...st,
            subSubTopics: [...(st.subSubTopics || []), newSst],
          }
        : st
    );

    const updated: LearningModule = {
      ...currentModule,
      subTopics: updatedSubTopics,
    };

    setCurrentModule(updated);
    saveModuleOverride(currentModule.id, { subTopics: updatedSubTopics });
    if (onModuleUpdated) onModuleUpdated(updated);

    setNewSubSubTitle('');
    setNewSubSubContent('');
    setNewSubSubDuration(15);
    setAddingSubSubTopicForId(null);
    setUploadFeedback({
      message: `Sub-submateri "${newSst.title}" berhasil ditambahkan!`,
    });
    setTimeout(() => setUploadFeedback(null), 3500);
  };

  // Admin: Hapus Sub-submateri dari Submateri
  const handleDeleteSubSubTopicInline = (subTopicId: string, sstId: string) => {
    pushModuleHistory('Hapus Sub-submateri');

    const updatedSubTopics = (currentModule.subTopics || []).map((st) =>
      st.id === subTopicId
        ? {
            ...st,
            subSubTopics: (st.subSubTopics || []).filter((sst) => sst.id !== sstId),
          }
        : st
    );

    const updated: LearningModule = {
      ...currentModule,
      subTopics: updatedSubTopics,
    };

    setCurrentModule(updated);
    saveModuleOverride(currentModule.id, { subTopics: updatedSubTopics });
    if (onModuleUpdated) onModuleUpdated(updated);
  };

  const handleToggleSubSubTopic = (subSubTopicId: string) => {
    const updated = toggleSubSubTopicCompleted(module.id, subSubTopicId);
    setCurrentProgress(updated);
  };

  const handleSelectAnswer = (qId: string, optIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const handleQuizSubmit = () => {
    let correctCount = 0;
    module.quiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const score = Math.round((correctCount / module.quiz.length) * 100);
    setUserScore(score);
    setQuizSubmitted(true);

    saveProgress({
      moduleId: module.id,
      completed: true,
      score,
      quizCompletedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      bookmarked: isBookmarked,
      completedSubSubTopicIds: currentProgress?.completedSubSubTopicIds,
    });

    if (score >= 70) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe fallback
      }
    }
  };

  const handleSaveNote = () => {
    saveNote(module.id, studentNote);
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 2000);
  };

  const handleDownloadNote = () => {
    const blob = new Blob(
      [
        `CATATAN BELAJAR FLASHLEARN\n` +
          `Materi: ${module.title}\n` +
          `Mata Pelajaran: ${module.subject} (${module.level})\n` +
          `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n` +
          `-----------------------------------------\n\n` +
          `${studentNote || '(Belum ada catatan)'}\n`,
      ],
      { type: 'text/plain;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Catatan_${module.title.substring(0, 20)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Submateri stats
  const subTopicsList = currentModule.subTopics || [];
  const allSubSubTopics = subTopicsList.flatMap((st) => st.subSubTopics || []);
  const totalSubSubTopicsCount = allSubSubTopics.length;
  const completedSubSubTopicsCount = allSubSubTopics.filter((sst) =>
    currentProgress?.completedSubSubTopicIds?.includes(sst.id)
  ).length;
  const subSubProgressPercent =
    totalSubSubTopicsCount > 0
      ? Math.round((completedSubSubTopicsCount / totalSubSubTopicsCount) * 100)
      : 0;

  const hasTeacherVideo = Boolean(currentModule.videoUrl && currentModule.videoAddedByTeacher);

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Toast Upload Feedback */}
      {uploadFeedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold transition shadow-lg ${
            uploadFeedback.isError
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
              : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {uploadFeedback.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{uploadFeedback.message}</span>
          </div>
          <button
            onClick={() => setUploadFeedback(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-amber-400 font-medium text-sm transition self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Modul</span>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isBookmarked
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{isBookmarked ? 'Tersimpan di Favorit' : 'Simpan Favorit'}</span>
          </button>

          {/* Converter Button */}
          {isAdmin && onOpenConverter && (
            <button
              onClick={() => onOpenConverter(currentModule)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-sky-400 border border-slate-700 transition"
              title="Konversi animasi Flash ini menjadi berkas video MP4"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Konversi ke Video (MP4)</span>
            </button>
          )}

          {/* Certificate Button if passed */}
          {userScore !== null && (
            <button
              onClick={() => onOpenCertificate(currentModule, userScore)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Sertifikat ({userScore}%)</span>
            </button>
          )}
        </div>
      </div>

      {/* Panel Unggah SWF Modul Utama (Hanya Tersedia di Mode Admin) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-900 border border-purple-500/40 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center shrink-0 font-bold">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Pusat Unggah & Impor Berkas .SWF Modul & Submateri (Mode Admin)
                </span>
                <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 text-[10px] border border-purple-500/30">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Berkas Modul Utama: <strong className="text-white font-mono">{currentModule.fileName || 'tpa_laboratorium_interaktif.swf'}</strong>
                {currentModule.fileSizeBytes ? ` (${Math.round(currentModule.fileSizeBytes / 1024)} KB)` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {activeSwfSource && (
              <button
                onClick={() => setActiveSwfSource(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
              >
                ← Putar SWF Modul Utama
              </button>
            )}

            {/* Unggah 1 File SWF */}
            <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs cursor-pointer border border-amber-500/30 transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah 1 File .SWF</span>
              <input
                ref={mainModuleFileInputRef}
                type="file"
                accept=".swf"
                className="hidden"
                onChange={handleMainModuleSwfUpload}
              />
            </label>

            {/* Unggah Banyak File Sekaligus (Batch) */}
            <button
              type="button"
              onClick={() => handleOpenBatchForTarget('main')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition hover:scale-105 active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Unggah Banyak File Sekaligus (Batch)</span>
            </button>

            {/* Impor Langsung dari Google Drive */}
            <button
              type="button"
              onClick={() => handleOpenDriveForTarget('main')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md transition hover:scale-105 active:scale-95"
            >
              <CloudDownload className="w-4 h-4" />
              <span>Langsung dari Google Drive</span>
            </button>

            {/* Edit Modul & Submateri */}
            <button
              type="button"
              onClick={() => setIsEditModuleModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md border border-purple-400/30 transition hover:scale-105 active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Modul & Submateri</span>
            </button>

            {/* Undo & Redo Buttons (Mode Admin) */}
            <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                disabled={undoStack.length === 0}
                onClick={handleAdminUndo}
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
                onClick={handleAdminRedo}
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
          </div>
        </div>
      )}

      {/* SWF Interactive Player Section */}
      <RufflePlayer
        module={currentModule}
        activeSwfSource={activeSwfSource}
        onSelectMainModuleSwf={() => setActiveSwfSource(null)}
      />

      {/* Secondary Tabs Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-wrap gap-1.5">
        {/* Tab Submateri & Subsubmateri */}
        <button
          onClick={() => setActiveTab('submateri')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'submateri'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Submateri & Sub-submateri</span>
          {totalSubSubTopicsCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                subSubProgressPercent === 100
                  ? 'bg-emerald-600 text-white'
                  : activeTab === 'submateri'
                  ? 'bg-slate-950 text-amber-300'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {completedSubSubTopicsCount}/{totalSubSubTopicsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content Display */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
        {/* Tab Submateri & Sub-submateri */}
        {activeTab === 'submateri' && (
          <div className="space-y-6">
            {/* Header & Submateri Progress Bar */}
            <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    Struktur Kurikulum: Submateri & Sub-submateri ({subTopicsList.length} Submateri)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pelajari setiap sub-topik terperinci dan tandai sub-submateri yang telah Anda kuasai.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {isAdmin && (
                    <>
                      {/* Tombol Undo & Redo di bagian Submateri */}
                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          disabled={undoStack.length === 0}
                          onClick={handleAdminUndo}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 text-amber-300 text-xs font-bold border border-slate-800 transition"
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
                          onClick={handleAdminRedo}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 text-sky-300 text-xs font-bold border border-slate-800 transition"
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
                        type="button"
                        onClick={() => setIsAddingSubTopicInline((prev) => !prev)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow transition hover:scale-105 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tambah Submateri</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditModuleModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold text-xs transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Modul & Submateri</span>
                      </button>
                    </>
                  )}
                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400">Total Progres:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {completedSubSubTopicsCount} dari {totalSubSubTopicsCount} Selesai ({subSubProgressPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${subSubProgressPercent}%` }}
                ></div>
              </div>

              {/* Form Inline Tambah Submateri Baru (Khusus Admin) */}
              {isAdmin && isAddingSubTopicInline && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      Tambah Submateri Baru ke Modul "{currentModule.title}"
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingSubTopicInline(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      ✕ Tutup
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Nama / Judul Submateri *
                      </label>
                      <input
                        type="text"
                        value={newSubTopicTitle}
                        onChange={(e) => setNewSubTopicTitle(e.target.value)}
                        placeholder="Contoh: Penalaran Spasial / Figural"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Ringkasan / Deskripsi Submateri
                      </label>
                      <input
                        type="text"
                        value={newSubTopicSummary}
                        onChange={(e) => setNewSubTopicSummary(e.target.value)}
                        placeholder="Contoh: Analisis rotasi gambar, jaring-jaring kubus, dan pola spasial."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingSubTopicInline(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleAddSubTopicInline}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Submateri Baru</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SubTopics Hierarchy */}
            {subTopicsList.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-3">
                <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-300">Belum Ada Submateri Terstruktur</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Materi ini belum memiliki pembagian sub-materi dan sub-submateri khusus.
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsAddingSubTopicInline(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Submateri Pertama</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {subTopicsList.map((st, stIdx) => {
                  const isExpanded = expandedSubTopics[st.id] ?? true;
                  const stSubSubs = st.subSubTopics || [];
                  const stCompletedCount = stSubSubs.filter((sst) =>
                    currentProgress?.completedSubSubTopicIds?.includes(sst.id)
                  ).length;
                  const isAllStDone = stSubSubs.length > 0 && stCompletedCount === stSubSubs.length;
                  const uploadedFilesList = getSubTopicUploadedFiles(st);

                  return (
                    <div
                      key={st.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow"
                    >
                      {/* SubTopic Header (Accordion trigger) */}
                      <button
                        onClick={() => handleToggleSubTopicAccordion(st.id)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/60 transition gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isAllStDone
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {stIdx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm sm:text-base font-bold text-slate-100">
                                {st.title}
                              </h4>
                              {uploadedFilesList.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                                  <Flame className="w-3 h-3 fill-current text-emerald-400" />
                                  {uploadedFilesList.length} Materi SWF Terupload
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                                  Belum ada SWF terupload
                                </span>
                              )}
                              {isAllStDone && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                  <Check className="w-3 h-3" /> Tuntas
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{st.summary}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                            {stCompletedCount}/{stSubSubs.length} Sub-submateri
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* SubTopic Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-slate-800/80 p-4 space-y-4 bg-slate-900/30">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                            <div className="text-xs text-slate-300 italic">
                              {st.summary}
                            </div>

                            {/* Admin Controls for Editing / Adding Sub-submateri / Deleting this Submateri */}
                            {isAdmin && (
                              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSubTopicId(
                                      editingSubTopicId === st.id ? null : st.id
                                    );
                                    setEditSubTopicTitle(st.title);
                                    setEditSubTopicSummary(st.summary);
                                    setConfirmDeleteSubTopicId(null);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit Submateri</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingSubSubTopicForId(
                                      addingSubSubTopicForId === st.id ? null : st.id
                                    );
                                    setNewSubSubTitle('');
                                    setNewSubSubContent('');
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-bold transition"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+ Sub-submateri</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmDeleteSubTopicId(
                                      confirmDeleteSubTopicId === st.id ? null : st.id
                                    )
                                  }
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Hapus Submateri</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Inline Edit Submateri Form (Admin Only) */}
                          {isAdmin && editingSubTopicId === st.id && (
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3">
                              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Submateri "{st.title}"</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                    Judul Submateri
                                  </label>
                                  <input
                                    type="text"
                                    value={editSubTopicTitle}
                                    onChange={(e) => setEditSubTopicTitle(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                    Ringkasan Submateri
                                  </label>
                                  <input
                                    type="text"
                                    value={editSubTopicSummary}
                                    onChange={(e) => setEditSubTopicSummary(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingSubTopicId(null)}
                                  className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditSubTopicInline(st.id)}
                                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Simpan Perubahan</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Inline Delete Confirmation for Submateri (Admin Only) */}
                          {isAdmin && confirmDeleteSubTopicId === st.id && (
                            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                              <span className="text-rose-200 font-semibold">
                                Apakah Anda yakin ingin menghapus submateri <strong>"{st.title}"</strong> beserta seluruh materi di dalamnya?
                              </span>
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteSubTopicId(null)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubTopic(st)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold shadow"
                                >
                                  Ya, Hapus Submateri
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Inline Add Sub-submateri Form (Admin Only) */}
                          {isAdmin && addingSubSubTopicForId === st.id && (
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-sky-500/40 space-y-3">
                              <div className="text-xs font-bold text-sky-400">
                                + Tambah Sub-submateri Baru pada "{st.title}"
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <input
                                  type="text"
                                  value={newSubSubTitle}
                                  onChange={(e) => setNewSubSubTitle(e.target.value)}
                                  placeholder="Judul Sub-submateri..."
                                  className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                                />
                                <input
                                  type="number"
                                  min={5}
                                  value={newSubSubDuration}
                                  onChange={(e) => setNewSubSubDuration(Number(e.target.value))}
                                  placeholder="Durasi (menit)"
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                                />
                                <input
                                  type="text"
                                  value={newSubSubContent}
                                  onChange={(e) => setNewSubSubContent(e.target.value)}
                                  placeholder="Ringkasan pembahasan sub-submateri..."
                                  className="sm:col-span-3 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setAddingSubSubTopicForId(null)}
                                  className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddSubSubTopicInline(st.id)}
                                  className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                                >
                                  Simpan Sub-submateri
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Bagian Daftar Materi (.SWF) yang Sudah Terupload pada Submateri Ini */}
                          <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-inner">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  uploadedFilesList.length > 0
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  <Flame className="w-4 h-4 fill-current" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs sm:text-sm font-bold text-white">
                                      Materi Flash (.SWF) Terupload — Submateri {st.title}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      uploadedFilesList.length > 0
                                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                        : 'bg-slate-900 text-slate-400 border-slate-800'
                                    }`}>
                                      {uploadedFilesList.length} File Terupload
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    {uploadedFilesList.length > 0
                                      ? 'Klik "Putar Materi" pada daftar di bawah untuk menjalankan simulasi SWF di player atas.'
                                      : 'Belum ada berkas materi .SWF yang diunggah pada submateri ini.'}
                                  </p>
                                </div>
                              </div>

                              {/* Upload controls strictly for Admin mode inside submodule */}
                              {isAdmin && (
                                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition shadow hover:scale-105 active:scale-95">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>+ Unggah SWF</span>
                                    <input
                                      type="file"
                                      accept=".swf"
                                      multiple
                                      className="hidden"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          handleSubTopicFilesUpload(st.id, e.target.files);
                                          e.target.value = '';
                                        }
                                      }}
                                    />
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenBatchForTarget(st.id)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs transition"
                                    title="Buka dialog Batch Upload multi-file untuk submateri ini"
                                  >
                                    <FolderPlus className="w-3.5 h-3.5" />
                                    <span>Batch Multi-File</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenDriveForTarget(st.id)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-bold text-xs transition"
                                    title="Impor langsung berkas SWF dari Google Drive ke submateri ini"
                                  >
                                    <CloudDownload className="w-3.5 h-3.5" />
                                    <span>Dari GDrive</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Info & Sinkronisasi Folder Google Drive khusus Submateri 1: Kemampuan Penalaran Verbal */}
                            {st.id === 'sub-verbal' && (
                              <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <CloudDownload className="w-4 h-4 text-sky-400 shrink-0" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-sky-300">
                                        Folder Google Drive Terintegrasi:
                                      </span>
                                      <a
                                        href={VERBAL_DRIVE_FOLDER_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-[11px] text-amber-300 hover:underline truncate"
                                      >
                                        drive.google.com/drive/u/0/folders/{VERBAL_DRIVE_FOLDER_ID}
                                      </a>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                      Seluruh berkas dari folder Google Drive tersebut telah dimasukkan ke Submateri 1: Kemampuan Penalaran Verbal di bawah ini.
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleSyncVerbalDriveFolder}
                                  disabled={isSyncingVerbalFolder}
                                  className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/40 font-bold text-[11px] transition shrink-0 flex items-center gap-1.5 self-end sm:self-auto"
                                  title="Sinkronkan ulang seluruh file langsung dari folder Google Drive Anda"
                                >
                                  <CloudDownload className="w-3.5 h-3.5" />
                                  <span>
                                    {isSyncingVerbalFolder
                                      ? 'Menyinkronkan Folder...'
                                      : 'Sinkronkan dari Akun Drive'}
                                  </span>
                                </button>
                              </div>
                            )}

                            {/* Daftar Materi yang Sudah Terupload */}
                            {uploadedFilesList.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2.5 pt-1">
                                {uploadedFilesList.map((fileItem, fIdx) => {
                                  const isCurrentlyPlaying =
                                    activeSwfSource?.blobKey === fileItem.blobKey &&
                                    Boolean(fileItem.blobKey);
                                  const cleanTitle = fileItem.fileName
                                    .replace(/\.swf$/i, '')
                                    .replace(/[_-]+/g, ' ');

                                  return (
                                    <div
                                      key={fileItem.id || `${fileItem.blobKey}-${fIdx}`}
                                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                                        isCurrentlyPlaying
                                          ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                                          isCurrentlyPlaying
                                            ? 'bg-emerald-500 text-slate-950'
                                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                        }`}>
                                          {fIdx + 1}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs sm:text-sm font-bold text-white truncate">
                                              {cleanTitle}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 font-mono text-[10px] border border-slate-800">
                                              {fileItem.fileName}
                                            </span>
                                            {isCurrentlyPlaying && (
                                              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                                                ● Sedang Diputar
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                                            {fileItem.fileSizeBytes && (
                                              <span>Ukuran: {(fileItem.fileSizeBytes / 1024).toFixed(1)} KB</span>
                                            )}
                                            <span>•</span>
                                            <span>
                                              Sumber:{' '}
                                              {fileItem.source === 'gdrive'
                                                ? 'Google Drive'
                                                : fileItem.source === 'batch'
                                                ? 'Batch Upload'
                                                : 'Unggahan Lokal'}
                                            </span>
                                            {fileItem.uploadedAt && (
                                              <>
                                                <span>•</span>
                                                <span>Diunggah: {fileItem.uploadedAt}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveSwfSource({
                                              title: `${st.title} — ${cleanTitle}`,
                                              sourceType: 'uploaded_blob',
                                              blobKey: fileItem.blobKey,
                                              fileName: fileItem.fileName,
                                              swfUrl: fileItem.swfUrl,
                                            });
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition shadow ${
                                            isCurrentlyPlaying
                                              ? 'bg-emerald-500 text-slate-950'
                                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                          }`}
                                        >
                                          <Play className="w-3.5 h-3.5 fill-current" />
                                          <span>{isCurrentlyPlaying ? 'Diputar di Atas' : 'Putar Materi'}</span>
                                        </button>

                                        {isAdmin && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteUploadedSwfItem(st.id, fileItem)}
                                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 transition"
                                            title="Hapus materi SWF ini dari submateri"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400">
                                Belum ada materi <code className="text-amber-400">.swf</code> yang diunggah pada submateri <strong>{st.title}</strong>.
                                {isAdmin && ' Gunakan tombol "+ Unggah SWF", "Batch Multi-File", atau "Dari GDrive" di kanan atas untuk menambahkan materi.'}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {stSubSubs.map((sst) => {
                              const isCompleted =
                                currentProgress?.completedSubSubTopicIds?.includes(sst.id) ?? false;

                              return (
                                <div
                                  key={sst.id}
                                  className={`p-4 rounded-xl border transition ${
                                    isCompleted
                                      ? 'bg-emerald-950/20 border-emerald-500/40'
                                      : 'bg-slate-900 border-slate-800'
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5 mb-2.5">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleToggleSubSubTopic(sst.id)}
                                        className="text-slate-400 hover:text-amber-400 transition"
                                        title={isCompleted ? 'Batalkan status selesai' : 'Tandai selesai'}
                                      >
                                        {isCompleted ? (
                                          <CheckSquare className="w-5 h-5 text-emerald-400" />
                                        ) : (
                                          <Square className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                                        )}
                                      </button>
                                      <h5
                                        className={`text-xs sm:text-sm font-bold ${
                                          isCompleted ? 'text-emerald-300 line-through' : 'text-slate-100'
                                        }`}
                                      >
                                        {sst.title}
                                      </h5>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="flex items-center gap-1 text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                                        <Clock className="w-3 h-3 text-amber-400" />
                                        {sst.durationMinutes} menit
                                      </span>
                                      <button
                                        onClick={() => handleToggleSubSubTopic(sst.id)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                          isCompleted
                                            ? 'bg-emerald-500 text-slate-950'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                      >
                                        {isCompleted ? 'Selesai' : 'Tandai Selesai'}
                                      </button>
                                      {isAdmin && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSubSubTopicInline(st.id, sst.id)}
                                          className="p-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 transition"
                                          title="Hapus sub-submateri ini"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Sub-submateri Content Description */}
                                  <p className="text-xs text-slate-300 leading-relaxed pl-7">
                                    {sst.content}
                                  </p>

                                  {/* Sub-submateri Key Points */}
                                  {sst.keyPoints && sst.keyPoints.length > 0 && (
                                    <div className="mt-3 pl-7 pt-2 border-t border-slate-800/40">
                                      <span className="text-[11px] font-bold text-amber-400 block mb-1">
                                        Poin Kunci Pemahaman:
                                      </span>
                                      <ul className="flex flex-wrap gap-1.5">
                                        {sst.keyPoints.map((kp, kpIdx) => (
                                          <li
                                            key={kpIdx}
                                            className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px] flex items-center gap-1.5"
                                          >
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                            <span>{kp}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Video (Pengajar Only) */}
        {activeTab === 'video' && (
          <VideoPlayerSection
            module={module}
            progress={currentProgress}
            onProgressUpdated={(updated) => setCurrentProgress(updated)}
            onModuleVideoUpdated={onModuleVideoUpdated}
            userRole={userRole}
          />
        )}

        {/* Tab LKS & Teori */}
        {activeTab === 'lks' && (
          <div className="space-y-6">
            {/* Learning Objectives */}
            <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                Tujuan Pembelajaran:
              </h3>
              <ul className="space-y-2">
                {module.learningObjectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                      {i + 1}
                    </span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Practical Steps */}
            <div>
              <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                Petunjuk Praktikum Interaktif di Simulasi Flash:
              </h3>
              <div className="space-y-2.5">
                {module.practicalSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80"
                  >
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold mt-0.5">
                      Langkah {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Theory Content */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-400" />
                Dasar Teori & Rumus Terkait:
              </h3>
              <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950 p-5 rounded-2xl border border-slate-800">
                {module.theoryContent}
              </div>
            </div>
          </div>
        )}

        {/* Tab Quiz */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Kuis Pemahaman Modul</h3>
                <p className="text-xs text-slate-400">
                  Jawab pertanyaan berikut berdasarkan hasil eksplorasi simulasi Flash di atas.
                </p>
              </div>

              {quizSubmitted && (
                <div className="text-right">
                  <div className="text-xs text-slate-400">Skor Akhir Anda:</div>
                  <div className={`text-2xl font-black ${userScore! >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {userScore} / 100
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {module.quiz.map((q, idx) => {
                const selected = selectedAnswers[q.id];
                const isCorrect = selected === q.correctAnswer;

                return (
                  <div key={q.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-200 leading-snug">{q.question}</h4>
                    </div>

                    {/* Options */}
                    <div className="space-y-2 pl-8">
                      {q.options.map((opt, oIdx) => {
                        let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700';

                        if (quizSubmitted) {
                          if (oIdx === q.correctAnswer) {
                            btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                          } else if (selected === oIdx) {
                            btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                          } else {
                            btnStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60';
                          }
                        } else if (selected === oIdx) {
                          btnStyle = 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow';
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={quizSubmitted}
                            onClick={() => handleSelectAnswer(q.id, oIdx)}
                            className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-3 transition ${btnStyle}`}
                          >
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 font-mono">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation after submission */}
                    {quizSubmitted && (
                      <div
                        className={`mt-3 p-3 rounded-xl text-xs border ${
                          isCorrect
                            ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="font-bold block mb-1">
                          {isCorrect ? 'Benar!' : 'Penjelasan Kunci Jawaban:'}
                        </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quiz Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              {!quizSubmitted ? (
                <button
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(selectedAnswers).length < module.quiz.length}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-sm transition shadow-lg"
                >
                  Kirim Jawaban & Periksa Skor
                </button>
              ) : (
                <div className="flex items-center gap-3 w-full justify-between">
                  <button
                    onClick={() => {
                      setQuizSubmitted(false);
                      setSelectedAnswers({});
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Ulangi Kuis
                  </button>

                  {userScore !== null && (
                    <button
                      onClick={() => onOpenCertificate(module, userScore)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg"
                    >
                      <Award className="w-4 h-4" />
                      Cetak Sertifikat Kelulusan
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Catatan Belajar Siswa</h3>
                <p className="text-xs text-slate-400">
                  Tuliskan hasil pengamatan simulasi Flash, data angka, hipotesis, atau rangkuman pribadi.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadNote}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  title="Unduh Catatan .TXT"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh .txt</span>
                </button>
                <button
                  onClick={handleSaveNote}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow"
                >
                  {noteSavedFeedback ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{noteSavedFeedback ? 'Tersimpan!' : 'Simpan Catatan'}</span>
                </button>
              </div>
            </div>

            <textarea
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              placeholder="Contoh catatan: Pada saat jarak benda s = 20cm dan fokus f = 10cm, bayangan jatuh tepat di 20cm dengan perbesaran 1x (sama besar)..."
              rows={10}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
            />
          </div>
        )}

        {/* Tab Info */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <h4 className="font-bold text-amber-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Informasi Pengajar & Kontributor
              </h4>
              <div className="space-y-2 text-slate-300">
                <div>
                  Pengembang / Guru: <span className="font-semibold text-white">{module.author}</span>
                </div>
                <div>
                  Peran / Institusi: <span className="text-slate-400">{module.authorRole}</span>
                </div>
                <div>
                  Tanggal Publikasi: <span className="text-slate-400">{module.createdAt}</span>
                </div>
                <div>
                  Jenjang Pendidikan:{' '}
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-xs">
                    {module.level}
                  </span>
                </div>
                <div>
                  Video Pengajar:{' '}
                  <span
                    className={`font-semibold ${hasTeacherVideo ? 'text-emerald-400' : 'text-slate-400'}`}
                  >
                    {hasTeacherVideo ? '✓ Tersedia dari pengajar' : 'Belum ditambahkan'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <h4 className="font-bold text-sky-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Teknologi Multimedia Flash (.SWF)
              </h4>
              <div className="space-y-2 text-slate-300">
                <div>
                  Nama Berkas: <span className="font-mono text-slate-200">{module.fileName || 'module.swf'}</span>
                </div>
                <div>
                  Ukuran Berkas:{' '}
                  <span className="font-mono text-slate-200">
                    {module.fileSizeBytes
                      ? `${(module.fileSizeBytes / 1024).toFixed(1)} KB`
                      : '380 KB'}
                  </span>
                </div>
                <div>
                  Standar Flash: <span className="text-slate-200">Adobe Flash Player {module.flashVersion || 8}+</span>
                </div>
                <div>
                  Bahasa Skrip: <span className="text-slate-200">{module.actionScriptVersion || 'ActionScript 2.0'}</span>
                </div>
                <div className="pt-2 text-[11px] text-slate-500">
                  Dijalankan langsung melalui WebAssembly Ruffle Emulator tanpa memerlukan plugin tambahan di browser.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals for Multi-File Batch Upload & Direct Google Drive Import (Admin Only) */}
      {isAdmin && (
        <>
          <ModuleBatchUploadModal
            isOpen={isBatchModalOpen}
            onClose={() => setIsBatchModalOpen(false)}
            module={currentModule}
            initialTargetId={modalInitialTargetId}
            onModuleUpdated={handleModalModuleUpdated}
          />

          <GoogleDrivePickerModal
            isOpen={isDriveModalOpen}
            onClose={() => setIsDriveModalOpen(false)}
            module={currentModule}
            initialTargetId={modalInitialTargetId}
            onModuleUpdated={handleModalModuleUpdated}
          />

          <EditModuleModal
            isOpen={isEditModuleModalOpen}
            onClose={() => setIsEditModuleModalOpen(false)}
            module={currentModule}
            onModuleUpdated={(updatedMod, actionLabel) => {
              pushModuleHistory(actionLabel || `Edit Modul "${updatedMod.title}"`);
              setCurrentModule(updatedMod);
              if (onModuleUpdated) onModuleUpdated(updatedMod);
              setUploadFeedback({
                message: `Perubahan modul "${updatedMod.title}" (${(updatedMod.subTopics || []).length} submateri) berhasil disimpan!`,
              });
              setTimeout(() => setUploadFeedback(null), 4000);
            }}
          />
        </>
      )}
    </div>
  );
};
