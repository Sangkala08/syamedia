import { LearningModule, UserProgress, StudentNote } from '../types';

const DB_NAME = 'FlashLearn_DB';
const DB_VERSION = 1;
const STORE_SWF_BLOBS = 'swf_blobs';

// IndexedDB Helper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SWF_BLOBS)) {
        db.createObjectStore(STORE_SWF_BLOBS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSwfBlob(id: string, file: File | Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SWF_BLOBS, 'readwrite');
    const store = tx.objectStore(STORE_SWF_BLOBS);
    const item = {
      id,
      name: (file as File).name || 'materi.swf',
      type: file.type || 'application/x-shockwave-flash',
      data: file,
      uploadedAt: new Date().toISOString(),
    };
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSwfBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SWF_BLOBS, 'readonly');
      const store = tx.objectStore(STORE_SWF_BLOBS);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get SWF blob from IndexedDB:', err);
    return null;
  }
}

export async function deleteSwfBlob(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SWF_BLOBS, 'readwrite');
      const store = tx.objectStore(STORE_SWF_BLOBS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete SWF blob:', err);
  }
}

export async function clearAllSwfBlobs(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SWF_BLOBS, 'readwrite');
      const store = tx.objectStore(STORE_SWF_BLOBS);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to clear SWF blobs from IndexedDB:', err);
  }
}

// LocalStorage for Modules, Progress, Notes
const STORAGE_CUSTOM_MODULES = 'flashlearn_custom_modules';
const STORAGE_PROGRESS = 'flashlearn_user_progress';
const STORAGE_NOTES = 'flashlearn_student_notes';
const STORAGE_USER_ROLE = 'flashlearn_user_role';

export function getCustomModules(): LearningModule[] {
  try {
    const data = localStorage.getItem(STORAGE_CUSTOM_MODULES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCustomModule(module: LearningModule): void {
  const current = getCustomModules();
  const index = current.findIndex(m => m.id === module.id);
  if (index >= 0) {
    current[index] = module;
  } else {
    current.unshift(module);
  }
  localStorage.setItem(STORAGE_CUSTOM_MODULES, JSON.stringify(current));
}

export function deleteCustomModule(id: string): void {
  const current = getCustomModules().filter(m => m.id !== id);
  localStorage.setItem(STORAGE_CUSTOM_MODULES, JSON.stringify(current));
  deleteSwfBlob(id);
}

export function getAllProgress(): Record<string, UserProgress> {
  try {
    const data = localStorage.getItem(STORAGE_PROGRESS);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: UserProgress): void {
  const all = getAllProgress();
  all[progress.moduleId] = {
    ...all[progress.moduleId],
    ...progress,
    lastAccessed: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(all));
}

export function saveVideoProgress(moduleId: string, watchedSeconds: number, durationSeconds: number): UserProgress {
  const all = getAllProgress();
  const current = all[moduleId] || {
    moduleId,
    completed: false,
    lastAccessed: new Date().toISOString(),
  };

  const percent = durationSeconds > 0 ? Math.min(100, Math.round((watchedSeconds / durationSeconds) * 100)) : 0;
  const isVideoDone = percent >= 90 || !!current.videoCompleted;

  const updated: UserProgress = {
    ...current,
    videoWatchedSeconds: Math.round(watchedSeconds),
    videoDurationSeconds: Math.round(durationSeconds),
    videoProgressPercent: percent,
    videoCompleted: isVideoDone,
    lastAccessed: new Date().toISOString(),
  };

  all[moduleId] = updated;
  localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(all));
  return updated;
}

export function toggleBookmark(moduleId: string): boolean {
  const all = getAllProgress();
  const current = all[moduleId] || {
    moduleId,
    completed: false,
    lastAccessed: new Date().toISOString(),
    bookmarked: false,
  };
  current.bookmarked = !current.bookmarked;
  all[moduleId] = current;
  localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(all));
  return current.bookmarked;
}

export function toggleSubSubTopicCompleted(moduleId: string, subSubTopicId: string): UserProgress {
  const all = getAllProgress();
  const current = all[moduleId] || {
    moduleId,
    completed: false,
    lastAccessed: new Date().toISOString(),
  };

  const existing = current.completedSubSubTopicIds || [];
  const exists = existing.includes(subSubTopicId);
  const updatedIds = exists
    ? existing.filter((id) => id !== subSubTopicId)
    : [...existing, subSubTopicId];

  const updated: UserProgress = {
    ...current,
    completedSubSubTopicIds: updatedIds,
    lastAccessed: new Date().toISOString(),
  };

  all[moduleId] = updated;
  localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(all));
  return updated;
}

const STORAGE_MODULE_OVERRIDES = 'flashlearn_module_overrides';

export function getModuleOverrides(): Record<string, Partial<LearningModule>> {
  try {
    const data = localStorage.getItem(STORAGE_MODULE_OVERRIDES);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveModuleOverride(moduleId: string, override: Partial<LearningModule>): void {
  const all = getModuleOverrides();
  all[moduleId] = { ...(all[moduleId] || {}), ...override };
  localStorage.setItem(STORAGE_MODULE_OVERRIDES, JSON.stringify(all));
}

export function getNote(moduleId: string): string {
  try {
    const notesStr = localStorage.getItem(STORAGE_NOTES);
    const notes: Record<string, StudentNote> = notesStr ? JSON.parse(notesStr) : {};
    return notes[moduleId]?.content || '';
  } catch {
    return '';
  }
}

export function saveNote(moduleId: string, content: string): void {
  try {
    const notesStr = localStorage.getItem(STORAGE_NOTES);
    const notes: Record<string, StudentNote> = notesStr ? JSON.parse(notesStr) : {};
    notes[moduleId] = {
      moduleId,
      content,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save note:', e);
  }
}

export function getUserRole(): 'siswa' | 'admin' {
  const r = localStorage.getItem(STORAGE_USER_ROLE);
  if (r === 'admin' || r === 'guru') return 'admin';
  return 'siswa';
}

export function setUserRole(role: 'siswa' | 'admin'): void {
  localStorage.setItem(STORAGE_USER_ROLE, role);
}

// ==========================================
// CUSTOM COURSE CATALOGS (BENTUKAN ADMIN)
// ==========================================
import { CourseCatalogGroup } from '../types';
import { DEFAULT_VERBAL_FOLDER_FILES } from '../data/coursesData';
import { createValidSampleSwf } from './sampleSwf';

export const DEFAULT_CATALOGS: CourseCatalogGroup[] = [
  {
    id: 'cat-tpa-nasional',
    title: 'Katalog Modul Tes Potensi Akademik (TPA)',
    description: 'Kurikulum terpadu Tes Potensi Akademik mencakup pilar utama: Verbal, Proposisi, Analitik, Barisan dan Deret, serta Matematika Dasar.',
    subject: 'TPA & Logika',
    level: 'Kuliah / Umum',
    author: 'Administrator Kurikulum TPA',
    createdAt: '2026-03-25',
    moduleIds: ['tpa-master'],
    colorTheme: 'amber',
    icon: 'Sparkles',
    isCustom: false,
  }
];

const STORAGE_CATALOGS = 'flashlearn_course_catalogs';
const TPA_VERSION_FLAG = 'flashlearn_v3_tpa_single_module';
const BARISAN_DERET_MIGRATION_FLAG = 'flashlearn_v4_barisan_dan_deret_added';
const CACHE_RESET_FLAG = 'flashlearn_v5_all_cache_cleared';
const VERBAL_FOLDER_SEEDED_FLAG = 'flashlearn_v6_verbal_folder_1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK';

export async function seedVerbalFolderSwfBlobs(): Promise<void> {
  try {
    const colors = ['#0F172A', '#1E1B4B', '#064E3B', '#3B0764', '#451A03'];
    for (let i = 0; i < DEFAULT_VERBAL_FOLDER_FILES.length; i++) {
      const f = DEFAULT_VERBAL_FOLDER_FILES[i];
      const existing = await getSwfBlob(f.blobKey);
      if (!existing) {
        const blob = createValidSampleSwf(f.fileName, colors[i % colors.length]);
        await saveSwfBlob(f.blobKey, blob);
      }
    }
  } catch (e) {
    console.error('Failed to seed verbal folder SWF blobs:', e);
  }
}

export async function clearAllAppCache(preserveRole = true): Promise<void> {
  try {
    const currentRole = preserveRole ? getUserRole() : 'siswa';

    // Clear LocalStorage & SessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Restore current role if requested and set version flags so default state stays clean
    if (preserveRole) {
      localStorage.setItem(STORAGE_USER_ROLE, currentRole);
    }
    localStorage.setItem(TPA_VERSION_FLAG, 'true');
    localStorage.setItem(BARISAN_DERET_MIGRATION_FLAG, 'true');
    localStorage.setItem(CACHE_RESET_FLAG, 'true');
    localStorage.setItem(VERBAL_FOLDER_SEEDED_FLAG, 'true');

    // Clear IndexedDB SWF blobs & re-seed Verbal folder files
    await clearAllSwfBlobs();
    await seedVerbalFolderSwfBlobs();

    // Clear Browser Cache Storage API if present
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
    }
  } catch (e) {
    console.error('Failed to clear all app cache:', e);
  }
}

export function initializeCourseState(): void {
  try {
    const cacheCleared = localStorage.getItem(CACHE_RESET_FLAG);
    if (!cacheCleared) {
      const currentRole = getUserRole();
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(STORAGE_USER_ROLE, currentRole);
      localStorage.setItem(TPA_VERSION_FLAG, 'true');
      localStorage.setItem(BARISAN_DERET_MIGRATION_FLAG, 'true');
      localStorage.setItem(CACHE_RESET_FLAG, 'true');
      localStorage.setItem(VERBAL_FOLDER_SEEDED_FLAG, 'true');
      clearAllSwfBlobs().then(() => seedVerbalFolderSwfBlobs());
      if (typeof window !== 'undefined' && 'caches' in window) {
        window.caches.keys().then((names) => {
          names.forEach((name) => window.caches.delete(name));
        });
      }
      return;
    }

    const initialized = localStorage.getItem(TPA_VERSION_FLAG);
    if (!initialized) {
      localStorage.removeItem(STORAGE_CUSTOM_MODULES);
      localStorage.removeItem(STORAGE_CATALOGS);
      localStorage.removeItem(STORAGE_MODULE_OVERRIDES);
      localStorage.setItem(TPA_VERSION_FLAG, 'true');
    }

    // Ensure Verbal folder files from 1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK are populated in Submateri 1
    const verbalFolderSeeded = localStorage.getItem(VERBAL_FOLDER_SEEDED_FLAG);
    if (!verbalFolderSeeded) {
      const overrides = getModuleOverrides();
      const tpaOverride = overrides['tpa-master'];
      if (tpaOverride && Array.isArray(tpaOverride.subTopics)) {
        tpaOverride.subTopics = tpaOverride.subTopics.map((st) => {
          if (st.id === 'sub-verbal') {
            return {
              ...st,
              blobKey: DEFAULT_VERBAL_FOLDER_FILES[0].blobKey,
              fileName: DEFAULT_VERBAL_FOLDER_FILES[0].fileName,
              fileSizeBytes: DEFAULT_VERBAL_FOLDER_FILES[0].fileSizeBytes,
              uploadedFiles: DEFAULT_VERBAL_FOLDER_FILES,
            };
          }
          return st;
        });
        saveModuleOverride('tpa-master', { subTopics: tpaOverride.subTopics });
      }
      localStorage.setItem(VERBAL_FOLDER_SEEDED_FLAG, 'true');
    }

    seedVerbalFolderSwfBlobs();
  } catch (e) {
    console.error('Failed to init course state:', e);
  }
}

export function getCatalogs(): CourseCatalogGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_CATALOGS);
    if (!raw) return DEFAULT_CATALOGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATALOGS;
  } catch {
    return DEFAULT_CATALOGS;
  }
}

export function saveCatalog(catalog: CourseCatalogGroup): void {
  const all = getCatalogs();
  const existingIdx = all.findIndex((c) => c.id === catalog.id);
  if (existingIdx >= 0) {
    all[existingIdx] = catalog;
  } else {
    all.push(catalog);
  }
  localStorage.setItem(STORAGE_CATALOGS, JSON.stringify(all));
}

export function deleteCatalog(catalogId: string): void {
  const all = getCatalogs().filter((c) => c.id !== catalogId);
  localStorage.setItem(STORAGE_CATALOGS, JSON.stringify(all));
}

export function addModuleToCatalog(catalogId: string, moduleId: string): void {
  const all = getCatalogs();
  const cat = all.find((c) => c.id === catalogId);
  if (cat && !cat.moduleIds.includes(moduleId)) {
    cat.moduleIds.push(moduleId);
    localStorage.setItem(STORAGE_CATALOGS, JSON.stringify(all));
  }
}

export function removeModuleFromCatalog(catalogId: string, moduleId: string): void {
  const all = getCatalogs();
  const cat = all.find((c) => c.id === catalogId);
  if (cat) {
    cat.moduleIds = cat.moduleIds.filter((id) => id !== moduleId);
    localStorage.setItem(STORAGE_CATALOGS, JSON.stringify(all));
  }
}
