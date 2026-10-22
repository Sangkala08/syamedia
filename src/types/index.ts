export type SubjectCategory = 'TPA & Logika' | 'Fisika' | 'Matematika' | 'Biologi' | 'Kimia' | 'Astronomi' | 'Umum';
export type EducationLevel = 'SD' | 'SMP' | 'SMA' | 'Kuliah / Umum';
export type UserRole = 'siswa' | 'admin';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface SubSubTopic {
  id: string;
  title: string;
  durationMinutes: number;
  content: string;
  keyPoints?: string[];
  // SWF attachment for sub-subtopic
  swfUrl?: string;
  blobKey?: string;
  fileName?: string;
  fileSizeBytes?: number;
}

export interface UploadedSwfFile {
  id: string;
  blobKey: string;
  fileName: string;
  fileSizeBytes?: number;
  uploadedAt: string;
  source?: 'local' | 'batch' | 'gdrive';
  swfUrl?: string;
}

export interface SubTopic {
  id: string;
  title: string;
  summary: string;
  subSubTopics: SubSubTopic[];
  // SWF attachment for subtopic / submodul
  swfUrl?: string;
  blobKey?: string;
  fileName?: string;
  fileSizeBytes?: number;
  uploadedFiles?: UploadedSwfFile[];
}

export function getSubTopicUploadedFiles(st: SubTopic): UploadedSwfFile[] {
  const list: UploadedSwfFile[] = [...(st.uploadedFiles || [])];
  if ((st.blobKey || st.swfUrl) && !list.some((f) => f.blobKey === st.blobKey && f.fileName === st.fileName)) {
    list.unshift({
      id: st.blobKey || `legacy-${st.id}`,
      blobKey: st.blobKey || '',
      fileName: st.fileName || 'materi_submodul.swf',
      fileSizeBytes: st.fileSizeBytes,
      uploadedAt: 'Tersimpan',
      source: 'local',
      swfUrl: st.swfUrl,
    });
  }
  return list;
}

export interface LearningModule {
  id: string;
  title: string;
  subject: SubjectCategory;
  level: EducationLevel;
  durationMinutes: number;
  thumbnail: string;
  description: string;
  author: string;
  authorRole: string;
  createdAt: string;
  
  // SWF details
  swfSourceType: 'builtin_simulation' | 'external_url' | 'uploaded_blob';
  swfUrl?: string; // Direct link or blob URL
  blobKey?: string; // Key in IndexedDB for uploaded SWF
  fileName?: string;
  fileSizeBytes?: number;
  flashVersion?: number;
  actionScriptVersion?: string;

  // Educational content
  learningObjectives: string[];
  theoryContent: string;
  practicalSteps: string[];
  quiz: QuizQuestion[];
  isCustom?: boolean;

  // Hierarchical curriculum: Sub-materi & Sub-sub-materi
  subTopics?: SubTopic[];

  // Video explanation companion (Hanya jika ditambahkan dari pengajar)
  videoUrl?: string;
  videoDurationSeconds?: number;
  videoTitle?: string;
  videoAddedByTeacher?: boolean;

  // Custom Catalog affiliation
  catalogId?: string;
}

export interface CourseCatalogGroup {
  id: string;
  title: string;
  description: string;
  subject?: SubjectCategory | 'Semua';
  level?: EducationLevel | 'Semua';
  author: string;
  createdAt: string;
  moduleIds: string[];
  colorTheme?: string;
  icon?: string;
  isCustom?: boolean;
}

export interface UserProgress {
  moduleId: string;
  completed: boolean;
  score?: number;
  quizCompletedAt?: string;
  lastAccessed: string;
  bookmarked?: boolean;
  // Video Progress tracking
  videoWatchedSeconds?: number;
  videoDurationSeconds?: number;
  videoProgressPercent?: number; // 0 - 100
  videoCompleted?: boolean;
  // Submateri & Sub-submateri progress
  completedSubSubTopicIds?: string[];
}

export interface BatchUploadItem {
  id: string;
  file: File;
  title: string;
  subject: SubjectCategory;
  level: EducationLevel;
  size: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

export interface ConversionConfig {
  durationSeconds: number;
  fps: number;
  resolution: '480p' | '720p' | '1080p';
  format: 'mp4' | 'webm';
}

export interface StudentNote {
  moduleId: string;
  content: string;
  updatedAt: string;
}

export interface PlayerSettings {
  aspectRatio: '4:3' | '16:9' | 'fit';
  scaleMode: 'showAll' | 'exactFit' | 'noBorder';
  bgColor: string;
  volume: number;
  isMuted: boolean;
}
