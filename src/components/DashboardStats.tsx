import React from 'react';
import {
  Trophy,
  CheckCircle2,
  Clock,
  PlayCircle,
  Bookmark,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { LearningModule, UserProgress } from '../types';

interface DashboardStatsProps {
  modules: LearningModule[];
  progressMap: Record<string, UserProgress>;
  onSelectModule: (module: LearningModule) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  modules,
  progressMap,
  onSelectModule,
}) => {
  const totalModules = modules.length;

  // Calculate Course Completion stats
  const completedModules = modules.filter(
    (m) => progressMap[m.id]?.completed
  );
  const completedCount = completedModules.length;
  const overallPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  // Calculate Video Progress stats (Hanya video yang ditambahkan pengajar)
  const modulesWithVideos = modules.filter((m) => m.videoUrl && m.videoAddedByTeacher);
  const totalVideos = modulesWithVideos.length;
  const completedVideosCount = modulesWithVideos.filter(
    (m) => progressMap[m.id]?.videoCompleted || (progressMap[m.id]?.videoProgressPercent || 0) >= 90
  ).length;

  const totalVideoProgressSum = modulesWithVideos.reduce(
    (acc, m) => acc + (progressMap[m.id]?.videoProgressPercent || 0),
    0
  );
  const videoAveragePercent = totalVideos > 0 ? Math.round(totalVideoProgressSum / totalVideos) : 0;

  // Calculate Submateri & Sub-submateri progress across all modules
  const allSubSubTopics = modules.flatMap((m) => m.subTopics?.flatMap((st) => st.subSubTopics) || []);
  const totalSubSubTopics = allSubSubTopics.length;
  const completedSubSubTopics = Object.values(progressMap).reduce((acc, p) => {
    return acc + (p.completedSubSubTopicIds?.length || 0);
  }, 0);
  const subSubPercent =
    totalSubSubTopics > 0 ? Math.min(100, Math.round((completedSubSubTopics / totalSubSubTopics) * 100)) : 0;

  // Calculate Quiz Average Score
  const scoresArray = Object.values(progressMap)
    .filter((p) => p.score !== undefined)
    .map((p) => p.score as number);
  const averageQuizScore =
    scoresArray.length > 0
      ? Math.round(scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length)
      : 0;

  // Total Study Minutes
  const totalStudyMinutes = completedModules.reduce((acc, m) => acc + m.durationMinutes, 0);

  // Subject breakdown stats
  const subjectList = ['Fisika', 'Matematika', 'Biologi', 'Kimia', 'Astronomi'] as const;
  const subjectStats = subjectList.map((sub) => {
    const subModules = modules.filter((m) => m.subject === sub);
    const subCompleted = subModules.filter((m) => progressMap[m.id]?.completed).length;
    const subPercent = subModules.length > 0 ? Math.round((subCompleted / subModules.length) * 100) : 0;
    return {
      subject: sub,
      total: subModules.length,
      completed: subCompleted,
      percent: subPercent,
    };
  }).filter((s) => s.total > 0);

  // Find last accessed module for quick resume
  let lastAccessedModule: LearningModule | null = null;
  let latestTime = 0;
  modules.forEach((m) => {
    const p = progressMap[m.id];
    if (p?.lastAccessed) {
      const t = new Date(p.lastAccessed).getTime();
      if (t > latestTime) {
        latestTime = t;
        lastAccessedModule = m;
      }
    }
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Dashboard Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">Ringkasan Progres & Aktivitas Belajar</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistik pencapaian praktikum multimedia Flash, progres penontonan video, dan skor kuis
          </p>
        </div>

        {lastAccessedModule && (
          <button
            onClick={() => onSelectModule(lastAccessedModule!)}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition"
          >
            <span>Lanjutkan: {(lastAccessedModule as LearningModule).title.substring(0, 26)}...</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Tuntas / Lulus</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">{completedCount} <span className="text-xs text-slate-500 font-normal">Modul</span></div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Rata-rata Kuis</span>
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono">
            {averageQuizScore > 0 ? `${averageQuizScore}%` : '-'}
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Waktu Praktikum</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">{totalStudyMinutes} <span className="text-xs text-slate-500 font-normal">Menit</span></div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <PlayCircle className="w-4 h-4 text-purple-400" />
            <span>Video Pembahasan</span>
          </div>
          <div className="text-xl font-bold text-purple-300 font-mono">{completedVideosCount} / {totalVideos}</div>
        </div>
      </div>

      {/* Subject Progres Breakdown */}
      {subjectStats.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Distribusi Progres per Mata Pelajaran:</span>
            <span>Rincian Kurikulum</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {subjectStats.map((item) => (
              <div key={item.subject} className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{item.subject}</span>
                  <span className="font-mono text-amber-400 font-bold">{item.percent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>{item.completed} selesai</span>
                  <span>dari {item.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
