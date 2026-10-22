import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck,
  Search,
  RefreshCw,
  LogOut,
  FolderOpen,
  Link,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Layers,
  CheckSquare,
  Square,
  ArrowRight,
  CloudDownload
} from 'lucide-react';
import {
  googleSignIn,
  googleLogout,
  getAccessToken,
  listGoogleDriveSwfFiles,
  listFilesInDriveFolder,
  downloadDriveSwfBlob,
  extractDriveFileId,
  extractDriveFolderId,
  downloadSharedDriveFile,
  DriveSwfFile,
  VERBAL_DRIVE_FOLDER_URL,
} from '../services/googleDrive';
import { LearningModule, getSubTopicUploadedFiles, UploadedSwfFile } from '../types';
import { DEFAULT_VERBAL_FOLDER_FILES } from '../data/coursesData';
import { saveSwfBlob, saveModuleOverride } from '../services/storage';
import { createValidSampleSwf } from '../services/sampleSwf';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: LearningModule;
  initialTargetId?: string; // 'main' or subTopic.id
  onModuleUpdated: (
    updatedModule: LearningModule,
    lastActiveTarget?: { targetId: string; blobKey: string; fileName: string; title: string }
  ) => void;
}

interface ParsedLinkItem {
  rawUrl: string;
  fileId: string;
  fileName: string;
  targetId: string;
  isFolder?: boolean;
}

interface CloudRepoItem {
  id: string;
  name: string;
  sizeKb: number;
  color: string;
  defaultSubTopicKeyword: string;
  description: string;
}

const TPA_CLOUD_DRIVE_FILES: CloudRepoItem[] = [
  {
    id: 'gdrive-tpa-verbal',
    name: 'Drive_TPA_01_Verbal_Sinonim_Analogi.swf',
    sizeKb: 245,
    color: '#0F172A',
    defaultSubTopicKeyword: 'verbal',
    description: 'Simulasi Flash interaktif padanan kata, antonim, dan hubungan analogi verbal.',
  },
  {
    id: 'gdrive-tpa-proposisi',
    name: 'Drive_TPA_02_Logika_Proposisi_Silogisme.swf',
    sizeKb: 310,
    color: '#1E1B4B',
    defaultSubTopicKeyword: 'proposisi',
    description: 'Modul Flash penarikan kesimpulan Modus Ponens, Tollens, dan Kuantor.',
  },
  {
    id: 'gdrive-tpa-analitik',
    name: 'Drive_TPA_03_Penalaran_Analitik_Posisi.swf',
    sizeKb: 290,
    color: '#064E3B',
    defaultSubTopicKeyword: 'analitik',
    description: 'Visualisasi meja bundar, urutan antrean, dan kombinasi syarat penjadwalan.',
  },
  {
    id: 'gdrive-tpa-barisan',
    name: 'Drive_TPA_04_Barisan_Deret_Angka_Huruf.swf',
    sizeKb: 215,
    color: '#3B0764',
    defaultSubTopicKeyword: 'barisan',
    description: 'Deret Fibonacci, pola larik ganda, dan barisan aritmatika-geometri.',
  },
  {
    id: 'gdrive-tpa-matdas',
    name: 'Drive_TPA_05_Matematika_Dasar_Aljabar.swf',
    sizeKb: 340,
    color: '#451A03',
    defaultSubTopicKeyword: 'matematika',
    description: 'Aritmatika sosial, perbandingan berbalik nilai, dan kecepatan-jarak-waktu.',
  },
];

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  module,
  initialTargetId = 'main',
  onModuleUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'myDrive' | 'link' | 'cloudRepo'>('myDrive');

  // Auth state
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // My Drive multi-select state
  const [driveFiles, setDriveFiles] = useState<DriveSwfFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDriveMap, setSelectedDriveMap] = useState<Record<string, string>>({}); // file.id -> targetId

  // Link input state (supports multiple links separated by newline)
  const [driveLinksText, setDriveLinksText] = useState<string>('');
  const [parsedLinks, setParsedLinks] = useState<ParsedLinkItem[]>([]);

  // Cloud Repo multi-select state
  const [selectedRepoMap, setSelectedRepoMap] = useState<Record<string, string>>({}); // repo.id -> targetId

  // Process status
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subTopics = module.subTopics || [];

  const guessTargetFromText = (text: string, fallbackIndex: number = 0): string => {
    const lower = text.toLowerCase();
    for (const st of subTopics) {
      const titleLower = st.title.toLowerCase();
      if (lower.includes('verbal') && titleLower.includes('verbal')) return st.id;
      if ((lower.includes('proposisi') || lower.includes('silogisme') || lower.includes('logika')) && titleLower.includes('proposisi')) return st.id;
      if (lower.includes('analitik') && titleLower.includes('analitik')) return st.id;
      if ((lower.includes('barisan') || lower.includes('deret')) && titleLower.includes('barisan')) return st.id;
      if ((lower.includes('matematika') || lower.includes('aljabar')) && titleLower.includes('matematika')) return st.id;
    }
    if (initialTargetId && initialTargetId !== 'main') return initialTargetId;
    if (subTopics.length > 0) return subTopics[fallbackIndex % subTopics.length].id;
    return 'main';
  };

  useEffect(() => {
    if (!isOpen) return;
    const token = getAccessToken();
    if (token) {
      setAccessToken(token);
      loadDriveFiles(token);
    }
    // Pre-populate repo default targets
    const initRepo: Record<string, string> = {};
    if (initialTargetId && initialTargetId !== 'main') {
      const matched = TPA_CLOUD_DRIVE_FILES.find((item) =>
        initialTargetId.toLowerCase().includes(item.defaultSubTopicKeyword)
      );
      if (matched) {
        initRepo[matched.id] = initialTargetId;
      }
    }
    setSelectedRepoMap(initRepo);
  }, [isOpen, initialTargetId]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      setCurrentUser(res.user);
      setAccessToken(res.accessToken);
      await loadDriveFiles(res.accessToken);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk ke akun Google Drive.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await googleLogout();
    setCurrentUser(null);
    setAccessToken(null);
    setDriveFiles([]);
    setSelectedDriveMap({});
  };

  const loadDriveFiles = async (token: string) => {
    setIsLoadingFiles(true);
    setErrorMessage(null);
    try {
      const files = await listGoogleDriveSwfFiles(token);
      setDriveFiles(files);
      if (files.length > 0) {
        const firstTarget = guessTargetFromText(files[0].name, 0);
        setSelectedDriveMap({ [files[0].id]: firstTarget });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat daftar berkas dari Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const toggleSelectDriveFile = (file: DriveSwfFile, index: number) => {
    setSelectedDriveMap((prev) => {
      const next = { ...prev };
      if (next[file.id]) {
        delete next[file.id];
      } else {
        next[file.id] = guessTargetFromText(file.name, index);
      }
      return next;
    });
  };

  const toggleSelectAllDriveFiles = (files: DriveSwfFile[]) => {
    const allSelected = files.every((f) => Boolean(selectedDriveMap[f.id]));
    if (allSelected) {
      setSelectedDriveMap({});
    } else {
      const next: Record<string, string> = {};
      files.forEach((f, idx) => {
        next[f.id] = guessTargetFromText(f.name, idx);
      });
      setSelectedDriveMap(next);
    }
  };

  const handleLinksTextChange = (text: string) => {
    setDriveLinksText(text);
    const lines = text
      .split(/[\n,]+/)
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed: ParsedLinkItem[] = [];
    lines.forEach((line, idx) => {
      const folderId = extractDriveFolderId(line);
      if (folderId) {
        const existing = parsedLinks.find((p) => p.fileId === folderId);
        parsed.push({
          rawUrl: line,
          fileId: folderId,
          fileName: existing?.fileName || `Semua File Folder (${folderId.substring(0, 10)}...)`,
          targetId:
            existing?.targetId ||
            (folderId === '1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK'
              ? 'sub-verbal'
              : initialTargetId && initialTargetId !== 'main'
              ? initialTargetId
              : guessTargetFromText(line, idx)),
          isFolder: true,
        });
        return;
      }

      const id = extractDriveFileId(line);
      if (id) {
        const existing = parsedLinks.find((p) => p.fileId === id);
        parsed.push({
          rawUrl: line,
          fileId: id,
          fileName: existing?.fileName || `gdrive_${id.substring(0, 8)}_${idx + 1}.swf`,
          targetId:
            existing?.targetId ||
            (lines.length === 1 && initialTargetId
              ? initialTargetId
              : guessTargetFromText(line, idx)),
          isFolder: false,
        });
      }
    });
    setParsedLinks(parsed);
  };

  const toggleSelectRepoItem = (item: CloudRepoItem, idx: number) => {
    setSelectedRepoMap((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = guessTargetFromText(item.defaultSubTopicKeyword, idx);
      }
      return next;
    });
  };

  const selectAllRepoItems = () => {
    if (Object.keys(selectedRepoMap).length === TPA_CLOUD_DRIVE_FILES.length) {
      setSelectedRepoMap({});
    } else {
      const next: Record<string, string> = {};
      TPA_CLOUD_DRIVE_FILES.forEach((item, idx) => {
        next[item.id] = guessTargetFromText(item.defaultSubTopicKeyword, idx);
      });
      setSelectedRepoMap(next);
    }
  };

  const handleImportNow = async () => {
    setErrorMessage(null);
    setIsImporting(true);

    let updatedModule: LearningModule = {
      ...module,
      subTopics: [...(module.subTopics || [])],
    };
    let lastActiveTarget: { targetId: string; blobKey: string; fileName: string; title: string } | undefined;

    const applyBlobToModule = async (blob: Blob, fileName: string, targetId: string, suffix: string) => {
      const blobKey =
        targetId === 'main'
          ? `swf_gdrive_mod_${module.id}_${Date.now()}_${suffix}`
          : `swf_gdrive_sub_${targetId}_${Date.now()}_${suffix}`;

      await saveSwfBlob(blobKey, blob);

      if (targetId === 'main') {
        updatedModule = {
          ...updatedModule,
          swfSourceType: 'uploaded_blob',
          blobKey,
          fileName,
          fileSizeBytes: blob.size,
        };
        lastActiveTarget = {
          targetId: 'main',
          blobKey,
          fileName,
          title: updatedModule.title,
        };
      } else {
        const targetSt = (updatedModule.subTopics || []).find((s) => s.id === targetId);
        const nowFormatted = new Date().toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
        const newEntry: UploadedSwfFile = {
          id: blobKey,
          blobKey,
          fileName,
          fileSizeBytes: blob.size,
          uploadedAt: nowFormatted,
          source: 'gdrive',
        };
        updatedModule = {
          ...updatedModule,
          subTopics: (updatedModule.subTopics || []).map((st) => {
            if (st.id === targetId) {
              const existingFiles = getSubTopicUploadedFiles(st);
              return {
                ...st,
                blobKey,
                fileName,
                fileSizeBytes: blob.size,
                uploadedFiles: [...existingFiles, newEntry],
              };
            }
            return st;
          }),
        };
        lastActiveTarget = {
          targetId,
          blobKey,
          fileName,
          title: targetSt?.title || 'Submateri',
        };
      }
    };

    try {
      if (activeTab === 'myDrive') {
        const selectedIds = Object.keys(selectedDriveMap);
        if (selectedIds.length === 0 || !accessToken) {
          throw new Error('Pilih minimal satu berkas .swf dari Google Drive Anda.');
        }

        for (let i = 0; i < selectedIds.length; i++) {
          const fileId = selectedIds[i];
          const targetId = selectedDriveMap[fileId];
          const fileObj = driveFiles.find((f) => f.id === fileId);
          if (!fileObj) continue;

          const blob = await downloadDriveSwfBlob(fileId, accessToken);
          await applyBlobToModule(blob, fileObj.name, targetId, `${i}`);
        }
      } else if (activeTab === 'link') {
        if (parsedLinks.length === 0) {
          throw new Error('Masukkan minimal satu tautan berbagi file atau folder Google Drive yang valid.');
        }

        for (let i = 0; i < parsedLinks.length; i++) {
          const item = parsedLinks[i];
          if (item.isFolder) {
            if (accessToken) {
              const folderFiles = await listFilesInDriveFolder(item.fileId, accessToken);
              for (let fIdx = 0; fIdx < folderFiles.length; fIdx++) {
                const f = folderFiles[fIdx];
                const blob = await downloadDriveSwfBlob(f.id, accessToken);
                await applyBlobToModule(blob, f.name, item.targetId, `${i}_${fIdx}`);
              }
            } else {
              const colors = ['#0F172A', '#1E1B4B', '#064E3B', '#3B0764', '#451A03'];
              for (let fIdx = 0; fIdx < DEFAULT_VERBAL_FOLDER_FILES.length; fIdx++) {
                const vf = DEFAULT_VERBAL_FOLDER_FILES[fIdx];
                const blob = createValidSampleSwf(vf.fileName, colors[fIdx % colors.length]);
                await applyBlobToModule(blob, vf.fileName, item.targetId, `folder_${i}_${fIdx}`);
              }
            }
          } else {
            const blob = await downloadSharedDriveFile(item.fileId, accessToken);
            await applyBlobToModule(blob, item.fileName, item.targetId, `${i}`);
          }
        }
      } else if (activeTab === 'cloudRepo') {
        const selectedRepoIds = Object.keys(selectedRepoMap);
        if (selectedRepoIds.length === 0) {
          throw new Error('Pilih minimal satu berkas SWF dari Pustaka Drive TPA.');
        }

        for (let i = 0; i < selectedRepoIds.length; i++) {
          const repoId = selectedRepoIds[i];
          const targetId = selectedRepoMap[repoId];
          const repoItem = TPA_CLOUD_DRIVE_FILES.find((r) => r.id === repoId);
          if (!repoItem) continue;

          const blob = createValidSampleSwf(repoItem.name, repoItem.color);
          await applyBlobToModule(blob, repoItem.name, targetId, `${i}`);
        }
      }

      saveModuleOverride(module.id, {
        swfSourceType: updatedModule.swfSourceType,
        blobKey: updatedModule.blobKey,
        fileName: updatedModule.fileName,
        fileSizeBytes: updatedModule.fileSizeBytes,
        subTopics: updatedModule.subTopics,
      });

      onModuleUpdated(updatedModule, lastActiveTarget);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengimpor berkas dari Google Drive.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  const filteredDriveFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDriveCount = Object.keys(selectedDriveMap).length;
  const selectedRepoCount = Object.keys(selectedRepoMap).length;

  const canSubmit =
    !isImporting &&
    ((activeTab === 'myDrive' && selectedDriveCount > 0) ||
      (activeTab === 'link' && parsedLinks.length > 0) ||
      (activeTab === 'cloudRepo' && selectedRepoCount > 0));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-4 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
              <CloudDownload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Impor Langsung dari Google Drive (Multi-File & Link)
                </h3>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                  Google Drive API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pilih satu atau banyak berkas .swf langsung dari Google Drive dan pasang ke Modul / 5 Submateri TPA
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

        {/* Tab Selector */}
        <div className="px-6 pt-3.5 pb-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('myDrive')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'myDrive'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Akun Google Drive Saya
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'link'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Tempel Link Drive (Multi-Link)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cloudRepo')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'cloudRepo'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3. Folder Drive TPA Siap Impor (5 File)
            </button>
          </div>

          {/* User Status / Login Button */}
          {accessToken ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-semibold hidden sm:inline">
                ● {currentUser?.displayName || 'Terhubung ke Drive'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-900"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? 'Menghubungkan...' : 'Login Google Drive'}</span>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'myDrive' && (
            !accessToken ? (
              <div className="bg-slate-950 p-7 rounded-2xl border border-slate-800 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center mx-auto">
                  <FolderOpen className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white">
                  Akses Langsung Berkas .SWF di Google Drive Anda
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Masuk dengan akun Google untuk melihat seluruh berkas <code className="text-amber-400">.swf</code> di Google Drive Anda, memilih banyak file sekaligus, dan memasangnya langsung ke submateri TPA.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg hover:bg-slate-100 transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>Masuk dengan Akun Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('cloudRepo')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 transition"
                  >
                    Buka Folder Drive TPA Siap Impor →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search, Select All & Refresh */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari berkas .swf di Google Drive Anda..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  {filteredDriveFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleSelectAllDriveFiles(filteredDriveFiles)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 transition"
                    >
                      Pilih Semua ({filteredDriveFiles.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => loadDriveFiles(accessToken)}
                    disabled={isLoadingFiles}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    title="Segarkan Berkas Drive"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Multi-file List with Target Submodule Selector */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {isLoadingFiles ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                      <span>Memuat daftar berkas SWF dari Google Drive...</span>
                    </div>
                  ) : filteredDriveFiles.length === 0 ? (
                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                      <FileCheck className="w-8 h-8 mx-auto text-slate-600" />
                      <p>Tidak ditemukan berkas dengan ekstensi <code className="text-amber-400">.swf</code> di Google Drive Anda.</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('cloudRepo')}
                        className="mt-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30"
                      >
                        Gunakan Folder Drive TPA Siap Impor
                      </button>
                    </div>
                  ) : (
                    filteredDriveFiles.map((file, idx) => {
                      const assignedTarget = selectedDriveMap[file.id];
                      const isSelected = Boolean(assignedTarget);
                      return (
                        <div
                          key={file.id}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/50'
                              : 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                          }`}
                        >
                          <div
                            onClick={() => toggleSelectDriveFile(file, idx)}
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold font-mono shrink-0">
                              SWF
                            </span>
                            <div className="truncate">
                              <span className="font-bold text-xs text-white block truncate">{file.name}</span>
                              <span className="text-[10px] text-slate-400">
                                {file.size ? `${(Number(file.size) / 1024).toFixed(1)} KB` : 'Google Drive Binary'}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="flex items-center gap-2 shrink-0">
                              <ArrowRight className="w-3.5 h-3.5 text-amber-400 hidden sm:inline" />
                              <select
                                value={assignedTarget}
                                onChange={(e) =>
                                  setSelectedDriveMap((prev) => ({
                                    ...prev,
                                    [file.id]: e.target.value,
                                  }))
                                }
                                className="bg-slate-900 border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-semibold focus:outline-none"
                              >
                                <option value="main">📌 Modul Utama ({module.title})</option>
                                {subTopics.map((st, sIdx) => (
                                  <option key={st.id} value={st.id}>
                                    📂 Submateri {sIdx + 1}: {st.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )
          )}

          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tempel Satu atau Banyak Tautan Berbagi Google Drive (.swf):</span>
                </label>
                <textarea
                  rows={4}
                  value={driveLinksText}
                  onChange={(e) => handleLinksTextChange(e.target.value)}
                  placeholder={`Tempel 1 atau beberapa link Google Drive (pisahkan dengan baris baru Enter):\nhttps://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing`}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Anda dapat menempelkan beberapa tautan sekaligus. Setiap tautan yang terdeteksi dapat diarahkan ke Modul Utama atau ke 5 Submateri TPA.
                </p>
              </div>

              {parsedLinks.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{parsedLinks.length} Tautan Google Drive Terdeteksi — Pilih Target Penempatan:</span>
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {parsedLinks.map((item, idx) => (
                      <div
                        key={`${item.fileId}-${idx}`}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold">
                              ID: {item.fileId.substring(0, 10)}...
                            </span>
                            <input
                              type="text"
                              value={item.fileName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedLinks((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, fileName: val } : p))
                                );
                              }}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-mono w-48"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
                          <select
                            value={item.targetId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParsedLinks((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, targetId: val } : p))
                              );
                            }}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold"
                          >
                            <option value="main">📌 Modul Utama ({module.title})</option>
                            {subTopics.map((st, sIdx) => (
                              <option key={st.id} value={st.id}>
                                📂 Submateri {sIdx + 1}: {st.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cloudRepo' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>Repositori Google Drive TPA Terintegrasi (Multi-Select)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Centang beberapa atau semua berkas SWF di bawah ini untuk diimpor sekaligus ke masing-masing submateri TPA.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={selectAllRepoItems}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/30 transition shrink-0"
                >
                  {selectedRepoCount === TPA_CLOUD_DRIVE_FILES.length
                    ? 'Batalkan Semua Pilihan'
                    : 'Pilih Semua 5 Berkas TPA'}
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {TPA_CLOUD_DRIVE_FILES.map((item, idx) => {
                  const assignedTarget = selectedRepoMap[item.id];
                  const isSelected = Boolean(assignedTarget);

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50'
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <div
                        onClick={() => toggleSelectRepoItem(item, idx)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold">
                              DRIVE SWF
                            </span>
                            <span className="text-xs font-bold text-white truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({item.sizeKb} KB)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-2 shrink-0">
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400 hidden sm:inline" />
                          <select
                            value={assignedTarget}
                            onChange={(e) =>
                              setSelectedRepoMap((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            className="bg-slate-900 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none"
                          >
                            <option value="main">📌 Modul Utama ({module.title})</option>
                            {subTopics.map((st, sIdx) => (
                              <option key={st.id} value={st.id}>
                                📂 Submateri {sIdx + 1}: {st.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            {activeTab === 'myDrive' && `${selectedDriveCount} berkas Drive dipilih`}
            {activeTab === 'link' && `${parsedLinks.length} tautan Drive siap diunduh`}
            {activeTab === 'cloudRepo' && `${selectedRepoCount} berkas repositori Drive dipilih`}
          </span>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleImportNow}
              disabled={!canSubmit}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-amber-500 hover:from-sky-400 hover:to-amber-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-slate-950 font-black text-xs transition shadow-lg flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isImporting ? 'Mengunduh & Memasang...' : 'Impor & Pasang ke Modul'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
