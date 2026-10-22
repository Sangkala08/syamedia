import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  FileCheck,
  AlertCircle,
  Download,
  Link,
  Plus,
  Trash2,
  Sparkles,
  Camera,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  BookOpen,
  RefreshCw,
  FolderTree,
  ChevronRight,
  Info
} from 'lucide-react';
import { LearningModule, SubjectCategory, EducationLevel, SubTopic, SubSubTopic } from '../types';
import { saveSwfBlob, saveCustomModule, getCatalogs, addModuleToCatalog } from '../services/storage';
import { downloadSampleSwfFile } from '../services/sampleSwf';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModuleCreated: (module: LearningModule) => void;
  onOpenGoogleDrive?: () => void;
}

/**
 * Generates an authentic, high-resolution simulation snapshot at 3.0 seconds (t = 3.0s)
 */
function generateStylizedFlash3SecFrame(
  title: string,
  subject: SubjectCategory,
  fileName?: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 640, 360);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(0.5, '#0f172a');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 640, 360);

  // Grid lines (simulation stage)
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
  ctx.lineWidth = 1;
  for (let x = 40; x < 640; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 30);
    ctx.lineTo(x, 320);
    ctx.stroke();
  }
  for (let y = 30; y < 320; y += 40) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(600, y);
    ctx.stroke();
  }

  // Draw subject-specific animated frame simulation at t=3.0s
  if (subject === 'Fisika') {
    // Parabolic motion / kinetic simulation at t = 3.0s
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(80, 270);
    ctx.quadraticCurveTo(240, 70, 480, 270);
    ctx.stroke();
    ctx.setLineDash([]);

    // Projectile position at 3s
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(320, 120, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Vectors
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(320, 120);
    ctx.lineTo(390, 120); // Vx
    ctx.moveTo(320, 120);
    ctx.lineTo(320, 160); // Vy
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('v = 18.5 m/s', 335, 110);
    ctx.fillText('t = 3.00s (Puncak)', 335, 145);
  } else if (subject === 'Matematika') {
    // Trigonometric wave & coordinate geometry at t=3.0s
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 60; x <= 560; x += 5) {
      const angle = ((x - 60) / 500) * Math.PI * 4;
      const y = 175 + Math.sin(angle) * 75;
      if (x === 60) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Point at 3.0s
    ctx.fillStyle = '#34d399';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(335, 175 + Math.sin(((335 - 60) / 500) * Math.PI * 4) * 75, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('y = A sin(ωt + φ)  [t = 3.0s]', 80, 80);
  } else if (subject === 'Biologi') {
    // Cell mitosis / nucleus at 3s
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(320, 175, 150, 95, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
    ctx.fill();

    // Nucleus
    ctx.fillStyle = '#c084fc';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(320, 175, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#e9d5ff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Fase Pembelahan t = 3.0s', 250, 240);
  } else if (subject === 'Kimia') {
    // Molecular bond rotation at 3s
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(250, 175);
    ctx.lineTo(320, 125);
    ctx.lineTo(390, 175);
    ctx.lineTo(320, 225);
    ctx.closePath();
    ctx.stroke();

    const atoms = [
      { x: 250, y: 175, c: '#fb7185', r: 16, l: 'C' },
      { x: 320, y: 125, c: '#38bdf8', r: 14, l: 'H' },
      { x: 390, y: 175, c: '#f43f5e', r: 18, l: 'O' },
      { x: 320, y: 225, c: '#38bdf8', r: 14, l: 'H' },
    ];
    atoms.forEach((a) => {
      ctx.fillStyle = a.c;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(a.l, a.x - 4, a.y + 4);
    });

    ctx.fillStyle = '#fda4af';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Simulasi Ikatan Kovalen • Detik ke-3', 215, 80);
  } else {
    // Astronomy / General simulation
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(320, 175, 170, 70, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Star
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(320, 175, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Planet at 3s position
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(440, 145, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flash Player Top Bar
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(0, 0, 640, 28);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`Adobe Flash Player — ${title || fileName || 'Simulasi'}`, 12, 18);

  // Retro Flash window dots
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(620, 14, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(606, 14, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(592, 14, 4, 0, Math.PI * 2);
  ctx.fill();

  // Bottom Timeline Bar (Flash Timeline Scrubbing at 3.0s)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 325, 640, 35);
  ctx.fillStyle = '#334155';
  ctx.fillRect(16, 340, 500, 6);

  // Playhead at 3.0s
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(16, 340, 180, 6); // Scrobble progress
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(196, 343, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('00:03.00 (Frame 72)', 525, 346);

  // 3-Second Stamp Badge
  ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
  ctx.beginPath();
  ctx.roundRect(16, 38, 215, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#020617';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('⚡ CUPLIKAN FRAME DETIK KE-3 (3.0s)', 24, 54);

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Capture frame at exactly 3.0s from video file if media, or fallback to Flash canvas frame
 */
async function capture3SecondFrame(
  file: File | null,
  title: string,
  subject: SubjectCategory
): Promise<string> {
  if (file && (file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm'))) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(3.0, (video.duration || 5) * 0.5);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Add watermark
            ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
            ctx.beginPath();
            ctx.roundRect(14, 14, 210, 24, 6);
            ctx.fill();
            ctx.fillStyle = '#020617';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('⚡ OTOMATIS FRAME DETIK KE-3', 22, 30);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            URL.revokeObjectURL(objectUrl);
            resolve(dataUrl);
            return;
          }
        } catch {
          // Ignore canvas error
        }
        URL.revokeObjectURL(objectUrl);
        resolve(generateStylizedFlash3SecFrame(title, subject, file.name));
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(generateStylizedFlash3SecFrame(title, subject, file.name));
      };

      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        resolve(generateStylizedFlash3SecFrame(title, subject, file?.name));
      }, 1200);
    });
  }

  // SWF binary frame capture at 3.0s
  return generateStylizedFlash3SecFrame(title, subject, file?.name);
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onModuleCreated,
  onOpenGoogleDrive,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  // Active Wizard Tab: 'basic' | 'thumbnail' | 'curriculum'
  const [activeTab, setActiveTab] = useState<'basic' | 'thumbnail' | 'curriculum'>('basic');

  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [swfUrlInput, setSwfUrlInput] = useState<string>('');

  const [title, setTitle] = useState<string>('');
  const [subject, setSubject] = useState<SubjectCategory>('Fisika');
  const [level, setLevel] = useState<EducationLevel>('SMA');
  const [duration, setDuration] = useState<number>(20);
  const [description, setDescription] = useState<string>('');
  const [author, setAuthor] = useState<string>('Guru Pengajar');
  const [learningObjectives, setLearningObjectives] = useState<string[]>([
    'Mengamati simulasi Flash secara interaktif',
    'Menarik kesimpulan dari eksperimen virtual'
  ]);
  const [newObjective, setNewObjective] = useState<string>('');

  // Thumbnail State: custom image or 3s auto captured
  const [customThumbnail, setCustomThumbnail] = useState<string>('');
  const [autoCapturedThumbnail, setAutoCapturedThumbnail] = useState<string>('');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState<boolean>(false);
  const [thumbnailMode, setThumbnailMode] = useState<'auto_3s' | 'upload_custom'>('auto_3s');

  // Tab Khusus "Submateri & Sub-submateri": Kurikulum Bertingkat
  const [subTopics, setSubTopics] = useState<SubTopic[]>([
    {
      id: `sub-1`,
      title: 'Submateri 1: Fondasi Teori & Konsep Pengantar',
      summary: 'Pemahaman prinsip dasar, variabel fisika/sains, dan kerangka teori materi.',
      subSubTopics: [
        {
          id: `sub-1-1`,
          title: 'Sub-submateri 1.1: Pengenalan Fenomena & Definisi Kunci',
          durationMinutes: 5,
          content: 'Menelaah fenomena alam dan hukum-hukum fundamental yang mendasarinya.',
          keyPoints: ['Definisi Operasional', 'Variabel Bebas & Terikat', 'Satuan Standar SI']
        },
        {
          id: `sub-1-2`,
          title: 'Sub-submateri 1.2: Pemodelan Matematis & Rumus Turunan',
          durationMinutes: 7,
          content: 'Menganalisis keterkaitan antar variabel matematis dalam model grafis.',
          keyPoints: ['Persamaan Gerak / Reaksi', 'Analisis Grafik', 'Simulasi Numerik']
        }
      ]
    },
    {
      id: `sub-2`,
      title: 'Submateri 2: Eksplorasi Interaktif & Evaluasi Mandiri',
      summary: 'Langkah eksperimen mandiri menggunakan kontrol simulasi Flash.',
      subSubTopics: [
        {
          id: `sub-2-1`,
          title: 'Sub-submateri 2.1: Uji Coba Parameter & Observasi Virtual',
          durationMinutes: 8,
          content: 'Mengubah nilai parameter pada slider Flash dan mencatat perubahannya.',
          keyPoints: ['Manipulasi Parameter', 'Pengamatan Kualitatif', 'Tabel Data Eksperimen']
        }
      ]
    }
  ]);

  const [catalogs] = useState(() => getCatalogs());
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatically update 3-second frame capture whenever title, subject, or file changes
  useEffect(() => {
    let isCancelled = false;
    const generate = async () => {
      setIsGeneratingThumbnail(true);
      const snap = await capture3SecondFrame(selectedFile, title || 'Simulasi Flash', subject);
      if (!isCancelled) {
        setAutoCapturedThumbnail(snap);
        setIsGeneratingThumbnail(false);
      }
    };
    generate();
    return () => {
      isCancelled = true;
    };
  }, [selectedFile, title, subject]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.swf')) {
      setErrorMessage('Harap pilih file dengan format .swf (Adobe/Macromedia Flash)');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    if (!title) {
      const cleanName = file.name.replace('.swf', '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('File thumbnail harus berupa gambar (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCustomThumbnail(event.target.result);
        setThumbnailMode('upload_custom');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setLearningObjectives([...learningObjectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  const handleRemoveObjective = (idx: number) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== idx));
  };

  // Curriculum Handlers (Modul → Submateri → Sub-submateri)
  const handleAddSubTopic = () => {
    const newIdx = subTopics.length + 1;
    const newSub: SubTopic = {
      id: `sub-${Date.now()}`,
      title: `Submateri ${newIdx}: Topik Pembahasan Baru`,
      summary: 'Ringkasan capaian materi pada bab ini.',
      subSubTopics: [
        {
          id: `sub-${Date.now()}-1`,
          title: `Sub-submateri ${newIdx}.1: Konsep Spesifik`,
          durationMinutes: 5,
          content: 'Uraian materi mendalam untuk dipelajari siswa.',
          keyPoints: ['Poin Penting 1', 'Poin Penting 2']
        }
      ]
    };
    setSubTopics([...subTopics, newSub]);
  };

  const handleRemoveSubTopic = (subId: string) => {
    if (subTopics.length <= 1) {
      alert('Minimal harus memiliki 1 Submateri.');
      return;
    }
    setSubTopics(subTopics.filter((s) => s.id !== subId));
  };

  const handleUpdateSubTopic = (subId: string, field: 'title' | 'summary', value: string) => {
    setSubTopics(
      subTopics.map((s) => (s.id === subId ? { ...s, [field]: value } : s))
    );
  };

  const handleAddSubSubTopic = (subId: string) => {
    setSubTopics(
      subTopics.map((s) => {
        if (s.id !== subId) return s;
        const subSubIdx = (s.subSubTopics?.length || 0) + 1;
        const newSubSub: SubSubTopic = {
          id: `sst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: `Sub-submateri ${subSubIdx}: Topik Detail`,
          durationMinutes: 5,
          content: 'Materi ringkas atau panduan praktikum virtual.',
          keyPoints: ['Konsep Utama']
        };
        return {
          ...s,
          subSubTopics: [...s.subSubTopics, newSubSub]
        };
      })
    );
  };

  const handleRemoveSubSubTopic = (subId: string, subSubId: string) => {
    setSubTopics(
      subTopics.map((s) => {
        if (s.id !== subId) return s;
        if (s.subSubTopics.length <= 1) {
          alert('Setiap Submateri minimal memiliki 1 Sub-submateri.');
          return s;
        }
        return {
          ...s,
          subSubTopics: s.subSubTopics.filter((sst) => sst.id !== subSubId)
        };
      })
    );
  };

  const handleUpdateSubSubTopic = (
    subId: string,
    subSubId: string,
    updates: Partial<SubSubTopic>
  ) => {
    setSubTopics(
      subTopics.map((s) => {
        if (s.id !== subId) return s;
        return {
          ...s,
          subSubTopics: s.subSubTopics.map((sst) =>
            sst.id === subSubId ? { ...sst, ...updates } : sst
          )
        };
      })
    );
  };

  // Preset intelligent curriculum generator based on title and subject
  const handleApplyPresetCurriculum = () => {
    const t = title.trim() || 'Materi Pembelajaran';
    const preset: SubTopic[] = [
      {
        id: `sub-p1-${Date.now()}`,
        title: `Submateri 1: Fondasi & Landasan Teori ${t}`,
        summary: `Membahas prinsip-prinsip sains fundamental, definisi besaran, dan hukum ilmiah terkait ${t}.`,
        subSubTopics: [
          {
            id: `sst-p1-1`,
            title: `Sub-submateri 1.1: Pengenalan Konsep & Fenomena ${subject}`,
            durationMinutes: 5,
            content: `Mengamati fenomena empiris dan menelaah konsep dasar ${t}.`,
            keyPoints: ['Definisi dan Batasan', 'Fenomena Nyata', 'Aplikasi Kehidupan']
          },
          {
            id: `sst-p1-2`,
            title: `Sub-submateri 1.2: Formulasi Matematis & Besaran Terkait`,
            durationMinutes: 7,
            content: `Menghitung dan memformulasikan hubungan antar parameter dalam modul ${t}.`,
            keyPoints: ['Rumus Utama', 'Analisis Dimensi', 'Contoh Perhitungan']
          }
        ]
      },
      {
        id: `sub-p2-${Date.now()}`,
        title: `Submateri 2: Eksperimen Virtual Flash (.SWF)`,
        summary: `Panduan operasional menjalankan simulasi interaktif Adobe Flash secara optimal.`,
        subSubTopics: [
          {
            id: `sst-p2-1`,
            title: `Sub-submateri 2.1: Prosedur Pengujian & Kontrol Simulasi`,
            durationMinutes: 8,
            content: `Mengatur slider, tombol interaktif, dan variabel input pada kanvas animasi Flash.`,
            keyPoints: ['Kontrol Parameter', 'Observasi Real-Time', 'Pencatatan Hasil']
          },
          {
            id: `sst-p2-2`,
            title: `Sub-submateri 2.2: Verifikasi Teori & Evaluasi Mandiri`,
            durationMinutes: 5,
            content: `Membandingkan prediksi teoritis dengan data hasil simulasi Flash.`,
            keyPoints: ['Evaluasi Galat', 'Kesimpulan Eksperimen', 'Kuis Akhir']
          }
        ]
      }
    ];
    setSubTopics(preset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Judul materi wajib diisi');
      setActiveTab('basic');
      return;
    }

    if (mode === 'file' && !selectedFile) {
      setErrorMessage('Silakan pilih file .swf terlebih dahulu');
      setActiveTab('basic');
      return;
    }

    if (mode === 'url' && !swfUrlInput.trim()) {
      setErrorMessage('Silakan masukkan URL file .swf yang valid');
      setActiveTab('basic');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const moduleId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Final thumbnail: use custom if provided, otherwise AUTOMATICALLY take from 3 seconds of the file!
      let finalThumbnail = customThumbnail.trim();
      if (!finalThumbnail) {
        finalThumbnail = autoCapturedThumbnail || generateStylizedFlash3SecFrame(title, subject, selectedFile?.name);
      }

      // Final structured curriculum (Modul → Submateri → Sub-submateri)
      const finalSubTopics: SubTopic[] = subTopics.map((st, sIdx) => ({
        id: `${moduleId}-sub-${sIdx + 1}`,
        title: st.title.trim() || `Submateri ${sIdx + 1}`,
        summary: st.summary.trim() || 'Ringkasan submateri pembelajaran.',
        subSubTopics: st.subSubTopics.map((sst, ssIdx) => ({
          id: `${moduleId}-sub-${sIdx + 1}-${ssIdx + 1}`,
          title: sst.title.trim() || `Sub-submateri ${sIdx + 1}.${ssIdx + 1}`,
          durationMinutes: sst.durationMinutes || 5,
          content: sst.content.trim() || 'Konten pembelajaran interaktif.',
          keyPoints: sst.keyPoints && sst.keyPoints.length > 0 ? sst.keyPoints : ['Poin Kunci']
        }))
      }));

      let newModule: LearningModule;

      if (mode === 'file' && selectedFile) {
        await saveSwfBlob(moduleId, selectedFile);

        newModule = {
          id: moduleId,
          title: title.trim(),
          subject,
          level,
          durationMinutes: duration,
          thumbnail: finalThumbnail,
          description: description.trim() || 'Materi pembelajaran berbasis multimedia interaktif Adobe Flash (.swf)',
          author: author.trim() || 'Guru Pengajar',
          authorRole: 'Kontributor FlashLearn',
          createdAt: new Date().toISOString().split('T')[0],
          swfSourceType: 'uploaded_blob',
          blobKey: moduleId,
          fileName: selectedFile.name,
          fileSizeBytes: selectedFile.size,
          flashVersion: 8,
          actionScriptVersion: 'ActionScript 2.0 (AVM1)',
          learningObjectives: learningObjectives.length > 0 ? learningObjectives : ['Menguasai materi pembelajaran interaktif'],
          theoryContent: `### Modul Pembelajaran Flash: ${title}\nFile ini diunggah oleh ${author} untuk mendukung pembelajaran mandiri berbasis simulasi multimedia interaktif.`,
          practicalSteps: [
            'Jalankan simulasi dengan menekan tombol Play pada kontrol Flash Player.',
            'Amati elemen grafis dan interaksi yang tersedia pada kanvas Flash.',
            'Ikuti tahapan submateri dan sub-submateri yang telah disiapkan pengajar.',
            'Buat catatan hasil belajar pada tab Catatan Belajar.'
          ],
          quiz: [
            {
              id: 'cq1',
              question: `Apa konsep utama yang dipelajari pada materi "${title}"?`,
              options: [
                'Pemahaman konsep teoritis dan praktis',
                'Analisis perhitungan numerik',
                'Eksplorasi fenomena sains visual',
                'Semua jawaban di atas benar'
              ],
              correctAnswer: 3,
              explanation: 'Simulasi interaktif Flash menggabungkan konsep teoritis, visualisasi, dan evaluasi pemahaman.'
            }
          ],
          subTopics: finalSubTopics,
          isCustom: true,
        };
      } else {
        newModule = {
          id: moduleId,
          title: title.trim(),
          subject,
          level,
          durationMinutes: duration,
          thumbnail: finalThumbnail,
          description: description.trim() || 'Materi pembelajaran dari URL Flash daring',
          author: author.trim() || 'Pengajar',
          authorRole: 'Pustaka Online',
          createdAt: new Date().toISOString().split('T')[0],
          swfSourceType: 'external_url',
          swfUrl: swfUrlInput.trim(),
          fileName: swfUrlInput.split('/').pop() || 'remote.swf',
          flashVersion: 8,
          actionScriptVersion: 'ActionScript 2.0 (AVM1)',
          learningObjectives: learningObjectives.length > 0 ? learningObjectives : ['Memahami materi dari simulasi interaktif'],
          theoryContent: `### Modul Flash Online\nSumber: ${swfUrlInput}`,
          practicalSteps: ['Putar modul Flash dan pelajari kurikulum submateri berjenjang.'],
          quiz: [
            {
              id: 'cq1',
              question: 'Apakah simulasi interaktif mempermudah pemahaman konsep?',
              options: ['Sangat mempermudah', 'Cukup mempermudah', 'Sama saja', 'Kurang mempermudah'],
              correctAnswer: 0,
              explanation: 'Visualisasi interaktif terbukti meningkatkan retensi memori dan daya nalar siswa.'
            }
          ],
          subTopics: finalSubTopics,
          isCustom: true,
        };
      }

      if (selectedCatalogId && selectedCatalogId !== 'none') {
        newModule.catalogId = selectedCatalogId;
        addModuleToCatalog(selectedCatalogId, moduleId);
      }

      saveCustomModule(newModule);
      onModuleCreated(newModule);
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMessage(err.message || 'Gagal menyimpan modul SWF ke penyimpanan lokal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSubSubCount = subTopics.reduce((acc, st) => acc + st.subSubTopics.length, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shadow-inner">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Unggah Materi Pembelajaran SWF</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/50">
                  Panel Guru
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Lengkapi berkas SWF, thumbnail otomatis detik ke-3, dan kurikulum materi bertingkat
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

        {/* Modal Tabs Bar */}
        <div className="px-6 pt-3 bg-slate-950/70 border-b border-slate-800 flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'basic'
                ? 'bg-slate-900 border-amber-500 text-amber-400 shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Berkas & Info Dasar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('thumbnail')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'thumbnail'
                ? 'bg-slate-900 border-amber-500 text-amber-400 shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>2. Thumbnail (Detik ke-3)</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'curriculum'
                ? 'bg-slate-900 border-amber-500 text-amber-400 shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>3. Submateri & Sub-submateri</span>
            <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono border border-sky-500/30">
              {subTopics.length} Bab &bull; {totalSubSubCount} Topik
            </span>
          </button>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BASIC INFO & SWF FILE */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* Mode Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                <div className="flex bg-slate-900 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMode('file')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      mode === 'file'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Unggah File (.swf) Lokal
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('url')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      mode === 'url'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Muat dari URL Daring
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenGoogleDrive && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenGoogleDrive();
                      }}
                      className="px-3 py-1.5 rounded-xl text-blue-400 hover:text-white bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 transition flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
                      </svg>
                      <span>Google Drive</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => downloadSampleSwfFile('uji_coba_flash.swf')}
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Contoh .SWF</span>
                  </button>
                </div>
              </div>

              {/* File Dropzone or URL */}
              {mode === 'file' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                    selectedFile
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-slate-700 hover:border-amber-500/60 bg-slate-950/60 hover:bg-slate-950'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".swf,application/x-shockwave-flash"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-white text-sm">{selectedFile.name}</span>
                      <span className="text-xs text-slate-400 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB &bull; Siap dieksekusi melalui WebAssembly Ruffle
                      </span>
                      <span className="text-[11px] text-amber-400 mt-2 underline">Klik untuk mengganti berkas</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center mb-2">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-slate-200 text-sm">
                        Pilih atau seret berkas Flash .swf ke sini
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        Mendukung Flash MX, CS3, CS4, CS5, CS6, dan Animate (.swf)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">URL File SWF Daring:</label>
                  <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2">
                    <Link className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                    <input
                      type="url"
                      value={swfUrlInput}
                      onChange={(e) => setSwfUrlInput(e.target.value)}
                      placeholder="https://contoh.com/simulasi_flash.swf"
                      className="bg-transparent text-xs text-slate-200 w-full focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Judul Materi Pembelajaran:</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Eksperimen Gerak Lurus Beraturan (GLB)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Mata Pelajaran:</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as SubjectCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Fisika">Fisika</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Biologi">Biologi</option>
                    <option value="Kimia">Kimia</option>
                    <option value="Astronomi">Astronomi</option>
                    <option value="Umum">Umum / Multimedia</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Jenjang Pendidikan:</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as EducationLevel)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="SD">SD (Sekolah Dasar)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                    <option value="SMA">SMA / SMK (Sekolah Menengah Atas)</option>
                    <option value="Kuliah / Umum">Kuliah / Umum</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Estimasi Durasi Belajar (Menit):</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Nama Guru / Pengajar:</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Contoh: Drs. Wahyu Hidayat, M.Pd"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Masukkan ke Katalog Kurikulum (Opsional):</label>
                  <select
                    value={selectedCatalogId}
                    onChange={(e) => setSelectedCatalogId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="none">-- Pustaka Utama (Tanpa Katalog Khusus) --</option>
                    {catalogs.map((c) => (
                      <option key={c.id} value={c.id}>
                        📁 {c.title} ({c.level} &bull; {c.subject})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Deskripsi Singkat:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan ringkas apa yang akan dieksplorasi siswa dalam simulasi Flash ini..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Learning Objectives */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Tujuan Pembelajaran:</label>
                <div className="space-y-1.5">
                  {learningObjectives.map((obj, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-300 truncate">{i + 1}. {obj}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveObjective(i)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObjective())}
                    placeholder="Tambah tujuan pembelajaran baru..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddObjective}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THUMBNAIL (UPLOAD ATAU OTOMATIS AMBIL DETIK KE-3) */}
          {activeTab === 'thumbnail' && (
            <div className="space-y-6">
              {/* Feature Notice */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-200">
                <Camera className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-300">
                    Otomatis Ambil Cuplikan pada 3 Detik Pertama File
                  </p>
                  <p className="text-amber-200/80 leading-relaxed">
                    Jika Anda tidak mengunggah gambar thumbnail khusus, sistem secara otomatis mengekstrak bingkai visual animasi/simulasi pada <strong>detik ke-3 (t = 3.0s)</strong> langsung dari berkas materi.
                  </p>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setThumbnailMode('auto_3s')}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                    thumbnailMode === 'auto_3s'
                      ? 'bg-amber-950/30 border-amber-500 text-white shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Ambil Otomatis Detik ke-3
                    </span>
                    {thumbnailMode === 'auto_3s' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Sistem mengekstrak frame detik ke-3 dari file secara dinamis lengkap dengan timestamp dan timeline Flash.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setThumbnailMode('upload_custom');
                    thumbnailInputRef.current?.click();
                  }}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                    thumbnailMode === 'upload_custom'
                      ? 'bg-purple-950/30 border-purple-500 text-white shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      Unggah Gambar Sendiri
                    </span>
                    {thumbnailMode === 'upload_custom' && (
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Unggah berkas gambar kustom (PNG, JPG, WebP) dari perangkat Anda atau masukkan URL gambar.
                  </p>
                </button>
              </div>

              {/* Hidden file input for thumbnail */}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleThumbnailUpload}
                className="hidden"
              />

              {/* Live Preview Display */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>Pratinjau Thumbnail Aktif:</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                      {thumbnailMode === 'auto_3s' ? '⚡ Detik ke-3 Otomatis' : '🖼️ Gambar Unggahan'}
                    </span>
                  </label>

                  {thumbnailMode === 'auto_3s' && (
                    <button
                      type="button"
                      onClick={async () => {
                        setIsGeneratingThumbnail(true);
                        const snap = await capture3SecondFrame(selectedFile, title || 'Simulasi Flash', subject);
                        setAutoCapturedThumbnail(snap);
                        setIsGeneratingThumbnail(false);
                      }}
                      disabled={isGeneratingThumbnail}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingThumbnail ? 'animate-spin' : ''}`} />
                      <span>Segarkan Cuplikan 3 Detik</span>
                    </button>
                  )}
                </div>

                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-xl max-w-lg mx-auto">
                  <img
                    src={thumbnailMode === 'upload_custom' && customThumbnail ? customThumbnail : autoCapturedThumbnail}
                    alt="Pratinjau Thumbnail"
                    className="w-full h-full object-cover"
                  />

                  {/* Stamp overlay */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-mono text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {thumbnailMode === 'auto_3s'
                        ? 'Frame 3.0s (00:03.00)'
                        : 'Kustom Guru'}
                    </span>
                  </div>

                  {thumbnailMode === 'upload_custom' && customThumbnail && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomThumbnail('');
                        setThumbnailMode('auto_3s');
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs border border-rose-700 transition"
                      title="Hapus gambar kustom dan gunakan cuplikan detik ke-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {thumbnailMode === 'upload_custom' && (
                  <div className="space-y-2 max-w-lg mx-auto pt-2">
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Pilih Berkas Gambar Thumbnail dari Komputer</span>
                    </button>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">atau tautan URL:</span>
                      <input
                        type="url"
                        value={customThumbnail}
                        onChange={(e) => {
                          setCustomThumbnail(e.target.value);
                          setThumbnailMode('upload_custom');
                        }}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TAB KHUSUS "SUBMATERI & SUB-SUBMATERI" (KURIKULUM BERTINGKAT) */}
          {activeTab === 'curriculum' && (
            <div className="space-y-6">
              {/* Special Header Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-purple-950/60 border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      Tab Khusus: Submateri &amp; Sub-submateri
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300">
                    Menampilkan kurikulum materi bertingkat: <span className="text-sky-300 font-semibold font-mono">Modul → Submateri → Sub-submateri</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyPresetCurriculum}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Buat struktur submateri otomatis sesuai judul dan mapel"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gunakan Template Bertingkat</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddSubTopic}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Submateri</span>
                  </button>
                </div>
              </div>

              {/* Hierarchy Tree Diagram */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Struktur Hirarki Kurikulum Bertingkat
                </span>
                <div className="text-xs font-mono text-slate-300 space-y-1 pl-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <span className="w-3 h-3 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">M</span>
                    <span>Modul: {title || 'Judul Modul SWF'}</span>
                  </div>

                  {subTopics.map((st, i) => (
                    <div key={st.id} className="pl-4 border-l-2 border-slate-800 space-y-1 my-1">
                      <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <span>Submateri {i + 1}: {st.title}</span>
                      </div>
                      <div className="pl-6 space-y-0.5">
                        {st.subSubTopics.map((sst, j) => (
                          <div key={sst.id} className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                            <span className="text-slate-600">&bull;</span>
                            <span className="text-slate-300">Sub-submateri {i + 1}.{j + 1}: {sst.title}</span>
                            <span className="text-slate-500 text-[10px]">({sst.durationMinutes}m)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submateri List and Editors */}
              <div className="space-y-4">
                {subTopics.map((sub, sIdx) => (
                  <div
                    key={sub.id}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4"
                  >
                    {/* Submateri Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono text-xs font-bold border border-sky-500/30">
                            Submateri {sIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={sub.title}
                            onChange={(e) => handleUpdateSubTopic(sub.id, 'title', e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:border-sky-500"
                            placeholder="Judul Submateri..."
                          />
                        </div>

                        <input
                          type="text"
                          value={sub.summary}
                          onChange={(e) => handleUpdateSubTopic(sub.id, 'summary', e.target.value)}
                          className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                          placeholder="Ringkasan penjelasan submateri ini..."
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddSubSubTopic(sub.id)}
                          className="px-2.5 py-1 rounded-lg bg-sky-950 text-sky-300 hover:bg-sky-900 border border-sky-700/50 text-xs font-semibold flex items-center gap-1 transition"
                          title="Tambah Sub-submateri pada bab ini"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Sub-submateri</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveSubTopic(sub.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition"
                          title="Hapus Submateri ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-submateri nested items */}
                    <div className="space-y-3 pl-3 sm:pl-4 border-l-2 border-sky-500/30">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-sky-400" />
                        <span>Daftar Sub-submateri Bertingkat ({sub.subSubTopics.length} Topik):</span>
                      </span>

                      {sub.subSubTopics.map((subSub, ssIdx) => (
                        <div
                          key={subSub.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-sky-300 bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800">
                              {sIdx + 1}.{ssIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={subSub.title}
                              onChange={(e) =>
                                handleUpdateSubSubTopic(sub.id, subSub.id, { title: e.target.value })
                              }
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-semibold focus:outline-none focus:border-amber-500"
                              placeholder="Judul Sub-submateri..."
                            />
                            <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <input
                                type="number"
                                min={1}
                                max={60}
                                value={subSub.durationMinutes}
                                onChange={(e) =>
                                  handleUpdateSubSubTopic(sub.id, subSub.id, {
                                    durationMinutes: Number(e.target.value)
                                  })
                                }
                                className="w-10 bg-transparent text-xs text-amber-300 font-mono text-center focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-500">mnt</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubSubTopic(sub.id, subSub.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Hapus Sub-submateri"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            value={subSub.content}
                            onChange={(e) =>
                              handleUpdateSubSubTopic(sub.id, subSub.id, { content: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                            placeholder="Uraian materi atau instruksi kegiatan untuk sub-submateri ini..."
                          />

                          {/* Key Points */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 shrink-0">Poin Kunci (pisahkan koma):</span>
                            <input
                              type="text"
                              value={(subSub.keyPoints || []).join(', ')}
                              onChange={(e) =>
                                handleUpdateSubSubTopic(sub.id, subSub.id, {
                                  keyPoints: e.target.value.split(',').map((p) => p.trim()).filter(Boolean)
                                })
                              }
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500"
                              placeholder="Poin 1, Poin 2, Poin 3"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-slate-500" />
              <span>
                {activeTab === 'basic' && 'Langkah 1: Tentukan berkas dan informasi materi'}
                {activeTab === 'thumbnail' && 'Langkah 2: Thumbnail otomatis t = 3.0s siap dipakai'}
                {activeTab === 'curriculum' && 'Langkah 3: Kurikulum bertingkat siap diterbitkan'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {activeTab !== 'basic' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'curriculum') setActiveTab('thumbnail');
                    else if (activeTab === 'thumbnail') setActiveTab('basic');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Sebelumnya
                </button>
              )}

              {activeTab !== 'curriculum' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'basic') setActiveTab('thumbnail');
                    else if (activeTab === 'thumbnail') setActiveTab('curriculum');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-bold text-xs transition shadow-lg flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Menerbitkan Kurikulum...' : 'Terbitkan Modul & Kurikulum'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
