import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  TrendingUp,
  Calculator,
  Compass,
  FileQuestion,
  BookOpen
} from 'lucide-react';

export const TpaSimulation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'verbal' | 'proposisi' | 'analitik' | 'barisan' | 'matematika'>('verbal');

  // --- 1. VERBAL STATE ---
  const [selectedAnalogiIndex, setSelectedAnalogiIndex] = useState<number>(0);
  const [userVerbalAnswer, setUserVerbalAnswer] = useState<number | null>(null);
  const [verbalSubmitted, setVerbalSubmitted] = useState<boolean>(false);

  const analogiList = [
    {
      premis: 'KIKUK : CANGGUNG',
      relasi: 'Sinonim / Kesetaraan Makna',
      options: ['Mahir : Terampil', 'Pandai : Angkuh', 'Gemuk : Lemah', 'Cepat : Lalai'],
      correctIndex: 0,
      penjelasan: 'Kikuk memiliki makna setara dengan canggung. Demikian pula mahir bermakna setara dengan terampil.'
    },
    {
      premis: 'APOTEKER : OBAT',
      relasi: 'Pelaku : Objek Profesi',
      options: ['Koki : Dapur', 'Petani : Padi', 'Supir : Mobil', 'Penulis : Buku'],
      correctIndex: 3,
      penjelasan: 'Apoteker bertugas meracik/membuat obat secara spesifik, sebagaimana penulis memproduksi/menulis buku.'
    },
    {
      premis: 'HAUS : AIR',
      relasi: 'Kondisi Kebutuhan : Solusi Pemenuhan',
      options: ['Lapar : Makanan', 'Kantuk : Bantal', 'Dingin : Selimut', 'Capek : Olahraga'],
      correctIndex: 0,
      penjelasan: 'Rasa haus dihilangkan dengan meminum air, sebagaimana rasa lapar dihilangkan dengan mengonsumsi makanan.'
    }
  ];

  // --- 2. PROPOSISI STATE ---
  const [premis1, setPremis1] = useState<string>('semua_a_adalah_b');
  const [premis2, setPremis2] = useState<string>('c_adalah_a');

  // --- 3. ANALITIK STATE (POSISI DUDUK 6 ORANG) ---
  const [chairs, setChairs] = useState<string[]>(['E', 'F', 'A', 'B', 'C', 'D']);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const checkAnalitikCondition = () => {
    const posA = chairs.indexOf('A');
    const posB = chairs.indexOf('B');
    const posC = chairs.indexOf('C');
    const posD = chairs.indexOf('D');
    const posE = chairs.indexOf('E');
    const posF = chairs.indexOf('F');

    const cond1 = posE === 0; // E di ujung kiri
    const cond2 = posF === posA - 1; // F tepat di kiri A
    const cond3 = posB > posA; // B di kanan A
    const cond4 = (posC > posB && posC < posD) || (posC > posD && posC < posB); // C di antara B dan D

    return {
      cond1,
      cond2,
      cond3,
      cond4,
      allValid: cond1 && cond2 && cond3 && cond4,
      rightEnd: chairs[5]
    };
  };

  const swapChairs = (i: number, j: number) => {
    const updated = [...chairs];
    const temp = updated[i];
    updated[i] = updated[j];
    updated[j] = temp;
    setChairs(updated);
  };

  // --- 4. BARISAN STATE ---
  const [barisanStep, setBarisanStep] = useState<number>(33);
  const [barisanInput, setBarisanInput] = useState<string>('');
  const [barisanResult, setBarisanResult] = useState<boolean | null>(null);

  // --- 5. MATEMATIKA DASAR STATE ---
  const [pekerjaAwal, setPekerjaAwal] = useState<number>(12);
  const [hariAwal, setHariAwal] = useState<number>(20);
  const [hariTarget, setHariTarget] = useState<number>(15);

  const totalManDays = pekerjaAwal * hariAwal;
  const pekerjaDibutuhkan = Math.ceil(totalManDays / (hariTarget || 1));
  const tambahanPekerja = Math.max(0, pekerjaDibutuhkan - pekerjaAwal);

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-6">
      {/* Simulation Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[11px] font-bold border border-amber-500/30">
              SIMULASI FLASH INTERAKTIF
            </span>
            <span className="text-slate-400 text-xs">Laboratorium TPA Terpadu</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white mt-1">
            Visualisasi &amp; Eksperimen Logika Tes Potensi Akademik
          </h3>
        </div>

        {/* 5 Sub-materi Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          {(
            [
              { key: 'verbal', label: '1. Verbal', icon: BookOpen },
              { key: 'proposisi', label: '2. Proposisi', icon: Sparkles },
              { key: 'analitik', label: '3. Analitik', icon: Layers },
              { key: 'barisan', label: '4. Barisan', icon: TrendingUp },
              { key: 'matematika', label: '5. Mat-Dasar', icon: Calculator }
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. SUBMATERI VERBAL                                            */}
      {/* ============================================================== */}
      {activeTab === 'verbal' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-amber-400">Pilar 1: Penalaran Verbal</span>
              <p className="text-xs text-slate-300">
                Uji kemampuan relasi asosiatif dan pola semantik antar pasangan kata.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Soal {selectedAnalogiIndex + 1} dari {analogiList.length}</span>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="text-center py-4 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block mb-1">
                Premis Analogi Kata
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-wide">
                {analogiList[selectedAnalogiIndex].premis}
              </span>
              <span className="text-xs text-slate-400 block mt-1">
                Pola Relasi: <span className="text-slate-200 font-semibold">{analogiList[selectedAnalogiIndex].relasi}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analogiList[selectedAnalogiIndex].options.map((opt, optIdx) => {
                const isSelected = userVerbalAnswer === optIdx;
                const isCorrect = optIdx === analogiList[selectedAnalogiIndex].correctIndex;
                let btnStyle = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-amber-500/50';

                if (verbalSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-300';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/40 border-rose-500 text-rose-300';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-amber-500/20 border-amber-500 text-amber-300';
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => {
                      if (!verbalSubmitted) {
                        setUserVerbalAnswer(optIdx);
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-left font-medium text-xs sm:text-sm transition flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {verbalSubmitted && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setUserVerbalAnswer(null);
                  setVerbalSubmitted(false);
                  setSelectedAnalogiIndex((prev) => (prev + 1) % analogiList.length);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
              >
                Ganti Soal Lainnya
              </button>

              {!verbalSubmitted ? (
                <button
                  disabled={userVerbalAnswer === null}
                  onClick={() => setVerbalSubmitted(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition shadow"
                >
                  Uji Jawaban Analogi
                </button>
              ) : (
                <div className="text-xs text-slate-300 max-w-sm text-right">
                  {userVerbalAnswer === analogiList[selectedAnalogiIndex].correctIndex ? (
                    <span className="text-emerald-400 font-bold">✓ Tepat! {analogiList[selectedAnalogiIndex].penjelasan}</span>
                  ) : (
                    <span className="text-rose-400 font-bold">✕ Kurang tepat. {analogiList[selectedAnalogiIndex].penjelasan}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. SUBMATERI PROPOSISI                                         */}
      {/* ============================================================== */}
      {activeTab === 'proposisi' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-amber-400">Pilar 2: Silogisme &amp; Logika Proposisi</span>
            <p className="text-xs text-slate-300">
              Pilih premis deduktif dan amati penarikan kesimpulan berdasarkan kaidah Modus Ponens / Tollens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Premis 1 Selector */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Premis Mayor (Aturan Umum / Implikasi):
              </label>
              <select
                value={premis1}
                onChange={(e) => setPremis1(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="semua_a_adalah_b">Semua Mahasiswa TPA (A) rajin belajar (B)</option>
                <option value="jika_p_maka_q">Jika lulus ujian TPA (p), maka mendapat beasiswa (q)</option>
                <option value="tidak_ada_a_yang_c">Tidak ada peserta curang (A) yang diterima (C)</option>
              </select>

              <label className="text-xs font-bold text-slate-300 block pt-2">
                Premis Minor (Fakta Khusus):
              </label>
              <select
                value={premis2}
                onChange={(e) => setPremis2(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {premis1 === 'semua_a_adalah_b' && (
                  <>
                    <option value="c_adalah_a">Budi (C) adalah Mahasiswa TPA (A)</option>
                    <option value="beberapa_c_adalah_a">Beberapa peserta (C) adalah Mahasiswa TPA (A)</option>
                  </>
                )}
                {premis1 === 'jika_p_maka_q' && (
                  <>
                    <option value="p_terjadi">Budi lulus ujian TPA (p terjadi)</option>
                    <option value="tidak_q">Budi tidak mendapat beasiswa (~q terjadi)</option>
                  </>
                )}
                {premis1 === 'tidak_ada_a_yang_c' && (
                  <>
                    <option value="dono_adalah_a">Dono terbukti curang (A)</option>
                    <option value="dono_diterima">Dono diterima di kampus (C)</option>
                  </>
                )}
              </select>
            </div>

            {/* Inference Result Card */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-amber-400 font-bold block mb-1">
                  KESIMPULAN DEDUKTIF VALID:
                </span>
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-300 font-bold text-sm sm:text-base leading-relaxed">
                  {premis1 === 'semua_a_adalah_b' && premis2 === 'c_adalah_a' && (
                    <span>&quot;Budi (C) pasti rajin belajar (B).&quot;</span>
                  )}
                  {premis1 === 'semua_a_adalah_b' && premis2 === 'beberapa_c_adalah_a' && (
                    <span>&quot;Beberapa peserta (C) rajin belajar (B).&quot;</span>
                  )}
                  {premis1 === 'jika_p_maka_q' && premis2 === 'p_terjadi' && (
                    <span>&quot;Budi mendapat beasiswa (Modus Ponens: p → q, p ⊢ q).&quot;</span>
                  )}
                  {premis1 === 'jika_p_maka_q' && premis2 === 'tidak_q' && (
                    <span>&quot;Budi tidak lulus ujian TPA (Modus Tollens: p → q, ~q ⊢ ~p).&quot;</span>
                  )}
                  {premis1 === 'tidak_ada_a_yang_c' && premis2 === 'dono_adalah_a' && (
                    <span>&quot;Dono tidak diterima di kampus.&quot;</span>
                  )}
                  {premis1 === 'tidak_ada_a_yang_c' && premis2 === 'dono_diterima' && (
                    <span>&quot;Dono terbukti bukan peserta yang curang.&quot;</span>
                  )}
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                💡 <span className="font-semibold text-slate-200">Kaidah Ekuivalen:</span> Aturan penarikan kesimpulan ini memenuhi hukum logika formal standar TPA nasional.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SUBMATERI ANALITIK                                          */}
      {/* ============================================================== */}
      {activeTab === 'analitik' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-amber-400">Pilar 3: Penalaran Logika Analitik (Urutan Duduk)</span>
            <p className="text-xs text-slate-300">
              Enam peserta (A, B, C, D, E, F) duduk berjajar dari kursi 1 (kiri) ke kursi 6 (kanan). Klik dua kursi untuk menukar posisi!
            </p>
          </div>

          {/* Condition Checklist */}
          {(() => {
            const status = checkAnalitikCondition();
            return (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className={`p-2 rounded-lg border flex items-center gap-2 ${status.cond1 ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <span>{status.cond1 ? '✓' : '○'} Syarat 1: E duduk di kursi paling kiri (1)</span>
                  </div>
                  <div className={`p-2 rounded-lg border flex items-center gap-2 ${status.cond2 ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <span>{status.cond2 ? '✓' : '○'} Syarat 2: F tepat di sebelah kiri A</span>
                  </div>
                  <div className={`p-2 rounded-lg border flex items-center gap-2 ${status.cond3 ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <span>{status.cond3 ? '✓' : '○'} Syarat 3: B berada di sebelah kanan A</span>
                  </div>
                  <div className={`p-2 rounded-lg border flex items-center gap-2 ${status.cond4 ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <span>{status.cond4 ? '✓' : '○'} Syarat 4: C berada di antara B dan D</span>
                  </div>
                </div>

                {/* Chair visualizer */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                    <span>Ujung Kiri (1)</span>
                    <span>Ujung Kanan (6)</span>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {chairs.map((person, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (draggedItem === null) {
                            setDraggedItem(idx);
                          } else {
                            swapChairs(draggedItem, idx);
                            setDraggedItem(null);
                          }
                        }}
                        className={`h-16 rounded-xl border flex flex-col items-center justify-center font-bold font-mono transition ${
                          draggedItem === idx
                            ? 'bg-amber-500 text-slate-950 border-amber-300 scale-105 shadow-lg'
                            : 'bg-slate-900 border-slate-700 hover:border-amber-400 text-white'
                        }`}
                      >
                        <span className="text-lg">{person}</span>
                        <span className="text-[10px] text-slate-400 font-normal">Kursi {idx + 1}</span>
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-center text-slate-400 pt-1">
                    {draggedItem === null ? 'Klik sebuah kursi lalu klik kursi kedua untuk menukar susunan' : `Pilih kursi tujuan untuk menukar ${chairs[draggedItem]}`}
                  </p>
                </div>

                {/* Result indicator */}
                <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${status.allValid ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300' : 'bg-amber-950/30 border-amber-500/40 text-amber-300'}`}>
                  <span>{status.allValid ? '🎉 Semua syarat terpenuhi!' : '⚠️ Masih ada syarat yang belum cocok.'}</span>
                  <span>Peserta di ujung paling kanan: <span className="underline font-mono text-white text-sm">{status.rightEnd}</span></span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. SUBMATERI BARISAN                                           */}
      {/* ============================================================== */}
      {activeTab === 'barisan' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-amber-400">Pilar 4: Barisan Bilangan &amp; Deret Aritmatika Bertingkat</span>
            <p className="text-xs text-slate-300">
              Analisis lompatan selisih antar angka berdekatan dan temukan keteraturan pola.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-5">
            {/* Sequence Display */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-4 bg-slate-950 rounded-xl border border-slate-800">
              {[3, 5, 9, 17, 33].map((num, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center font-mono font-bold text-base text-amber-400 shadow">
                    <span>{num}</span>
                    <span className="text-[9px] text-slate-500 font-normal">U{i + 1}</span>
                  </div>
                  {i < 4 && (
                    <div className="text-center font-mono text-xs text-slate-400">
                      <span>+{[2, 4, 8, 16][i]}</span>
                      <ArrowRight className="w-3.5 h-3.5 mx-auto text-slate-600" />
                    </div>
                  )}
                </div>
              ))}

              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border-2 border-dashed border-amber-500 flex flex-col items-center justify-center font-mono font-bold text-base text-amber-300 shadow">
                <span>?</span>
                <span className="text-[9px] text-amber-400 font-normal">U6</span>
              </div>
            </div>

            {/* Pattern Explanation Box */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-amber-400 block">Pola Selisih Antar Suku:</span>
              <p>5 - 3 = <strong>+2</strong> &bull; 9 - 5 = <strong>+4</strong> &bull; 17 - 9 = <strong>+8</strong> &bull; 33 - 17 = <strong>+16</strong></p>
              <p className="text-slate-400">Setiap lompatan dikalikan 2 (deret geometri selisih). Maka selisih berikutnya adalah 16 × 2 = <strong>+32</strong>.</p>
            </div>

            {/* User Input & Test */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="number"
                  placeholder="Masukkan angka suku berikutnya (U6)..."
                  value={barisanInput}
                  onChange={(e) => setBarisanInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <button
                onClick={() => {
                  const val = parseInt(barisanInput, 10);
                  setBarisanResult(val === 65);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow shrink-0"
              >
                Cek Pola
              </button>
            </div>

            {barisanResult !== null && (
              <div className={`p-3 rounded-xl border text-xs font-bold ${barisanResult ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-rose-950/40 border-rose-500 text-rose-300'}`}>
                {barisanResult ? '✓ Tepat sekali! U6 = 33 + 32 = 65.' : '✕ Kurang tepat. Hitung: 33 + (16 × 2) = ?'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. SUBMATERI MATEMATIKA DASAR                                  */}
      {/* ============================================================== */}
      {activeTab === 'matematika' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-amber-400">Pilar 5: Matematika Dasar &amp; Perbandingan Berbalik Nilai</span>
            <p className="text-xs text-slate-300">
              Simulasi interaktif proyek: Hubungan antara jumlah pekerja dengan target hari penyelesaian.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Jumlah Pekerja Awal: <strong className="text-white font-mono">{pekerjaAwal} Orang</strong>
                </label>
                <input
                  type="range"
                  min="4"
                  max="30"
                  value={pekerjaAwal}
                  onChange={(e) => setPekerjaAwal(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Waktu Rencana Awal: <strong className="text-white font-mono">{hariAwal} Hari</strong>
                </label>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={hariAwal}
                  onChange={(e) => setHariAwal(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Target Penyelesaian Baru: <strong className="text-amber-400 font-mono">{hariTarget} Hari</strong>
                </label>
                <input
                  type="range"
                  min="5"
                  max="35"
                  value={hariTarget}
                  onChange={(e) => setHariTarget(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] font-mono text-amber-400 font-bold block mb-1">
                  RUMUS PERBANDINGAN BERBALIK NILAI:
                </span>
                <p className="text-xs text-slate-300 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  Total Beban Kerja = {pekerjaAwal} × {hariAwal} = {totalManDays} orang-hari
                </p>

                <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Pekerja Dibutuhkan:</span>
                    <span className="font-bold text-white font-mono">{pekerjaDibutuhkan} Orang</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-slate-800 pt-1.5">
                    <span className="text-amber-400 font-bold">Tambahan Pekerja Diperlukan:</span>
                    <span className="font-extrabold text-amber-300 font-mono text-sm">+{tambahanPekerja} Orang</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Formula: <code className="text-amber-300 font-mono">X = (P_awal × H_awal) / H_target</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
