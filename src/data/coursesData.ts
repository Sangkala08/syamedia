import { LearningModule, UploadedSwfFile } from '../types';

export const DEFAULT_VERBAL_FOLDER_FILES: UploadedSwfFile[] = [
  {
    id: 'swf_gdrive_folder_1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK_1',
    blobKey: 'swf_gdrive_folder_1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK_1',
    fileName: '01_Penalaran_Verbal_Sinonim_Persamaan_Kata.swf',
    fileSizeBytes: 248320,
    uploadedAt: 'Folder Drive (1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK)',
    source: 'gdrive',
  },
  {
    id: 'swf_gdrive_folder_1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK_2',
    blobKey: 'swf_gdrive_folder_1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK_2',
    fileName: '02_Penalaran_Verbal_Antonim_Lawan_Kata.swf',
    fileSizeBytes: 236544,
    uploadedAt: 'Folder Drive (1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK)',
    source: 'gdrive',
  },
  {
    id: 'swf_gdrive_folder_1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK_3',
    blobKey: 'swf_gdrive_folder_1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK_3',
    fileName: '03_Penalaran_Verbal_Analogi_Pasangan_Kata.swf',
    fileSizeBytes: 264192,
    uploadedAt: 'Folder Drive (1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK)',
    source: 'gdrive',
  },
  {
    id: 'swf_gdrive_folder_1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK_4',
    blobKey: 'swf_gdrive_folder_1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK_4',
    fileName: '04_Penalaran_Verbal_Pengelompokan_Kata.swf',
    fileSizeBytes: 219136,
    uploadedAt: 'Folder Drive (1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK)',
    source: 'gdrive',
  },
  {
    id: 'swf_gdrive_folder_1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK_5',
    blobKey: 'swf_gdrive_folder_1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK_5',
    fileName: '05_Penalaran_Verbal_Pemahaman_Wacana_Kritis.swf',
    fileSizeBytes: 289792,
    uploadedAt: 'Folder Drive (1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK)',
    source: 'gdrive',
  },
];

export const BUILTIN_COURSES: LearningModule[] = [
  {
    id: 'tpa-master',
    title: 'Tes Potensi Akademik (TPA)',
    subject: 'TPA & Logika',
    level: 'Kuliah / Umum',
    durationMinutes: 120,
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
    description: 'Modul komprehensif Tes Potensi Akademik (TPA) standar nasional & internasional untuk mengukur kecakapan skolastik, kemampuan verbal, logika proposisi, penalaran analitik, pola barisan angka/huruf, dan matematika dasar kuantitatif.',
    author: 'Pusat Asesmen & Kurikulum Potensi Akademik',
    authorRole: 'Master Trainer Asesmen Bakat Skolastik & TPA',
    createdAt: '2026-03-25',
    swfSourceType: 'builtin_simulation',
    fileName: 'tpa_laboratorium_interaktif.swf',
    fileSizeBytes: 624000,
    flashVersion: 8,
    actionScriptVersion: 'ActionScript 2.0 (AVM1)',
    learningObjectives: [
      'Menguasai penalaran verbal: analogi pasangan kata, sinonim-antonim tingkat lanjut, serta penarikan simpulan dari wacana kritis.',
      'Memahami dan menerapkan logika proposisi formal: silogisme kategorik, modus ponens, modus tollens, serta ekuivalensi dan negasi pernyataan majemuk.',
      'Menyelesaikan persoalan penalaran analitik: penataan posisi urutan (linier & melingkar), pengelompokan kondisi pembatas, dan diagram Venn himpunan.',
      'Mengidentifikasi dan memecahkan pola barisan: aritmatika bertingkat, deret geometri, bilangan prima, pola Fibonacci, serta barisan kombinasi huruf alfabet.',
      'Menguasai kecakapan matematika dasar kuantitatif: manipulasi aljabar cepat, perbandingan rasio, pecahan/desimal, dan aritmatika sosial praktis.'
    ],
    // Hierarki Submateri & Sub-submateri lengkap sesuai instruksi:
    // Verbal, Proposisi, Analitik, Barisan dan Matematika Dasar
    subTopics: [
      {
        id: 'sub-verbal',
        title: 'Submateri 1: Kemampuan Penalaran Verbal',
        summary: 'Penguasaan perbendaharaan kata, relasi asosiatif pasangan kata, dan pemahaman inferensi wacana kritis.',
        blobKey: DEFAULT_VERBAL_FOLDER_FILES[0].blobKey,
        fileName: DEFAULT_VERBAL_FOLDER_FILES[0].fileName,
        fileSizeBytes: DEFAULT_VERBAL_FOLDER_FILES[0].fileSizeBytes,
        uploadedFiles: DEFAULT_VERBAL_FOLDER_FILES,
        subSubTopics: [
          {
            id: 'verbal-1',
            title: 'Sub-submateri 1.1: Sinonim (Persamaan) & Antonim (Lawan Kata)',
            durationMinutes: 15,
            content: 'Menganalisis nuansa makna kata serapan, istilah ilmiah, kata baku, dan antonim biner/gradual dalam konteks kalimat formal.',
            keyPoints: [
              'Identifikasi kelas kata (verba, nomina, adjektiva) sebelum mencari pasangan',
              'Perhatikan konteks konotatif positif/negatif',
              'Hindari jebakan kata fonetis mirip (homofon/paronim)'
            ]
          },
          {
            id: 'verbal-2',
            title: 'Sub-submateri 1.2: Analogi Pasangan Kata (Relasi Asosiatif)',
            durationMinutes: 20,
            content: 'Menentukan pola hubungan logis antara kata A : B yang setara dengan pola relasi C : D (fungsi, sebab-akibat, derajat intensitas, atau asosiasi tempat).',
            keyPoints: [
              'Gunakan formula kalimat penghubung: "A adalah [kata sambung] B"',
              'Pastikan urutan arah relasi konsisten (kiri ke kanan)',
              'Analisis relasi tingkat kedua jika terdapat lebih dari satu pilihan yang tampak mirip'
            ]
          },
          {
            id: 'verbal-3',
            title: 'Sub-submateri 1.3: Pemahaman Wacana Kritis & Ide Pokok',
            durationMinutes: 25,
            content: 'Membaca cepat (skimming/scanning), memetakan argumen utama penulis, menemukan fakta vs opini, dan menarik inferensi tersirat tanpa asumsi liar.',
            keyPoints: [
              'Ide pokok paragraf deduktif (awal) vs induktif (akhir)',
              'Pertanyaan inferensi harus berlandaskan 100% fakta di teks',
              'Waspadai kata ekstrim seperti "selalu", "semua", "tidak pernah"'
            ]
          }
        ]
      },
      {
        id: 'sub-proposisi',
        title: 'Submateri 2: Logika Proposisi & Silogisme Formal',
        summary: 'Kaidah inferensi deduktif berdasarkan pernyataan kuantor universal/eksistensial dan implikasi kondisional.',
        subSubTopics: [
          {
            id: 'proposisi-1',
            title: 'Sub-submateri 2.1: Silogisme Kategorik (Premis Mayor & Minor)',
            durationMinutes: 20,
            content: 'Penarikan kesimpulan logis dari premis umum (Semua A adalah B) dan premis khusus (Beberapa B adalah C). Aturan istilah penengah (middle term) dan term distributif.',
            keyPoints: [
              'Jika salah satu premis partikular (beberapa/sebagian), kesimpulan wajib partikular',
              'Jika salah satu premis negatif, kesimpulan wajib negatif',
              'Dua premis partikular atau dua premis negatif tidak dapat menghasilkan kesimpulan valid'
            ]
          },
          {
            id: 'proposisi-2',
            title: 'Sub-submateri 2.2: Modus Ponens, Modus Tollens, & Silogisme Hipotetis',
            durationMinutes: 25,
            content: 'Kaidah penarikan kesimpulan dari proposisi bersyarat jika p maka q (p → q). Membedakan argumen valid dari kekeliruan menegaskan konsekuen.',
            keyPoints: [
              'Modus Ponens: (p → q) dan p terjadi, maka q pasti terjadi',
              'Modus Tollens: (p → q) dan ~q terjadi, maka ~p pasti terjadi',
              'Silogisme Hipotetis: (p → q) dan (q → r), maka (p → r)'
            ]
          },
          {
            id: 'proposisi-3',
            title: 'Sub-submateri 2.3: Ekuivalensi Logika, Kontraposisi, & Negasi Majemuk',
            durationMinutes: 20,
            content: 'Transformasi ekuivalen pernyataan bersyarat (p → q ≡ ~q → ~p ≡ ~p ∨ q) dan hukum De Morgan untuk negasi konjungsi dan disjungsi.',
            keyPoints: [
              'Kontraposisi dari "Jika hujan maka jalan basah" adalah "Jika jalan tidak basah maka tidak hujan"',
              'Negasi dari (p ∧ q) adalah (~p ∨ ~q)',
              'Negasi dari "Semua peserta lulus" adalah "Ada peserta yang tidak lulus"'
            ]
          }
        ]
      },
      {
        id: 'sub-analitik',
        title: 'Submateri 3: Penalaran Logika Analitik & Kondisional',
        summary: 'Penyusunan urutan peringkat, pemetaan posisi duduk melingkar/linier, dan penalaran berbasis batasan ketat.',
        subSubTopics: [
          {
            id: 'analitik-1',
            title: 'Sub-submateri 3.1: Penataan Urutan Linier & Posisi Duduk',
            durationMinutes: 25,
            content: 'Teknik pembuatan tabel visual dan garis bilangan untuk menata urutan prioritas, tinggi badan, kedatangan, atau penataan posisi duduk dalam antrean.',
            keyPoints: [
              'Buat notasi cepat: A > B, C berada tepat di samping D',
              'Tentukan elemen yang sudah pasti posisinya (anchor point)',
              'Gunakan teknik eliminasi opsi berdasarkan syarat yang dilanggar'
            ]
          },
          {
            id: 'analitik-2',
            title: 'Sub-submateri 3.2: Pengelompokan Syarat & Seleksi Tim',
            durationMinutes: 25,
            content: 'Masalah kombinatorial dengan batasan bersyarat: jika A dipilih maka B tidak boleh dipilih, X harus satu kelompok dengan Y.',
            keyPoints: [
              'Daftar syarat mutlak vs syarat kondisional',
              'Uji setiap opsi jawaban secara terbalik (apakah melanggar batasan)',
              'Perhatikan syarat inklusi mutual dan eksklusi mutlak'
            ]
          },
          {
            id: 'analitik-3',
            title: 'Sub-submateri 3.3: Diagram Venn Himpunan & Masalah Irisan',
            durationMinutes: 20,
            content: 'Penyelesaian soal deskriptif survei menggunakan diagram 2 atau 3 lingkaran Venn untuk menghitung anggota irisan dan komplemen.',
            keyPoints: [
              'Formula 2 himpunan: n(A ∪ B) = n(A) + n(B) - n(A ∩ B)',
              'Mulai pengisian diagram dari irisan terdalam',
              'Perhatikan frasa "hanya A" vs "anggota A"'
            ]
          }
        ]
      },
      {
        id: 'sub-barisan',
        title: 'Barisan dan Deret',
        summary: ' Analisis pola barisan dan deret bilangan: aritmatika bertingkat, deret geometri, pola Fibonacci, larik lompat, serta barisan huruf alfabet.',
        subSubTopics: [
          {
            id: 'barisan-1',
            title: '1. Barisan & Deret Aritmatika Bertingkat',
            durationMinutes: 20,
            content: 'Mengenali barisan dan deret bilangan dengan selisih konstan maupun bertingkat dua/tiga serta menentukan suku ke-n (Un) dan jumlah n suku pertama (Sn).',
            keyPoints: [
              'Rumus suku ke-n Aritmatika: Un = a + (n - 1)b',
              'Rumus jumlah deret Aritmatika: Sn = n/2 × (2a + (n - 1)b)',
              'Analisis selisih bertingkat dua dan tiga secara sistematis'
            ]
          },
          {
            id: 'barisan-2',
            title: '2. Barisan & Deret Geometri, Tak Hingga, dan Fibonacci',
            durationMinutes: 20,
            content: 'Pola perkalian/pembagian rasio tetap (Un = a·r^(n-1)), jumlah deret geometri tak hingga (S∞ = a / (1 - r)), deret Fibonacci, serta bilangan berpangkat.',
            keyPoints: [
              'Deret Geometri: Un = a · r^(n-1) dan S∞ = a / (1 - r)',
              'Deret Fibonacci: 1, 1, 2, 3, 5, 8, 13, 21...',
              'Kombinasi operasi ganda: (×2 - 1, ×2 - 2, ×2 - 3)'
            ]
          },
          {
            id: 'barisan-3',
            title: '3. Pola Larik Lompat & Barisan Huruf Alfabet',
            durationMinutes: 20,
            content: 'Barisan dan deret yang terdiri dari dua atau tiga sub-deret yang disisipkan bergantian (pola selang-seling), serta konversi huruf A-Z ke angka 1-26.',
            keyPoints: [
              'Jika angka naik-turun tak menentu, pisahkan menjadi deret ganjil dan genap',
              'Konversi huruf: A=1, B=2, C=3, ... Z=26 untuk memudahkan analisis',
              'Cek pola simetri atau pembalikan abjad'
            ]
          }
        ]
      },
      {
        id: 'sub-matematika',
        title: 'Submateri 5: Matematika Dasar Kuantitatif',
        summary: 'Kecakapan aljabar cepat, pemodelan persamaan, perhitungan rasio perbandingan, dan aritmatika sosial.',
        subSubTopics: [
          {
            id: 'matematika-1',
            title: 'Sub-submateri 5.1: Operasi Aljabar, Pecahan, & Persamaan Cepat',
            durationMinutes: 25,
            content: 'Penyederhanaan bentuk aljabar, faktorisasi selisih kuadrat a² - b² = (a-b)(a+b), pecahan bertingkat, dan persamaan linear satu/dua variabel.',
            keyPoints: [
              'Gunakan trik perkalian cepat dan aproksimasi cerdas',
              'Manfaatkan sifat kuadrat: (x + y)² = x² + 2xy + y²',
              'Eliminasi penyebut pada pecahan bertingkat sejak awal'
            ]
          },
          {
            id: 'matematika-2',
            title: 'Sub-submateri 5.2: Perbandingan Senilai, Berbalik Nilai, & Kecepatan',
            durationMinutes: 25,
            content: 'Konsep rasio proporsional (harga barang vs jumlah), perbandingan terbalik (pekerja vs waktu pengerjaan), dan formula jarak = kecepatan × waktu.',
            keyPoints: [
              'Senilai: x1 / y1 = x2 / y2 (jika satu naik, yang lain naik)',
              'Berbalik nilai: x1 · y1 = x2 · y2 (pekerja bertambah, waktu berkurang)',
              'Pekerjaan bersama: 1/Total = 1/A + 1/B'
            ]
          },
          {
            id: 'matematika-3',
            title: 'Sub-submateri 5.3: Aritmatika Sosial, Untung-Rugi, Bunga, & Diskon',
            durationMinutes: 20,
            content: 'Perhitungan persentase laba terhadap harga beli, diskon bertingkat (bukan dijumlahkan!), bunga tunggal perbankan, dan rata-rata gabungan.',
            keyPoints: [
              '% Untung = (Untung / Harga Beli) × 100%',
              'Diskon ganda 20% + 10% = membayar 80% × 90% = 72% (diskon riil 28%)',
              'Rata-rata gabungan: X_gab = (n1·X1 + n2·X2) / (n1 + n2)'
            ]
          }
        ]
      }
    ],
    theoryContent: `### Modul Teori Dasar Tes Potensi Akademik (TPA)

Tes Potensi Akademik (TPA) dirancang secara terstandar untuk memprediksi keberhasilan seseorang dalam menempuh pendidikan tinggi maupun jenjang karier profesional. TPA mengukur potensi intelektual murni, bukan pengetahuan hafalan semata.

---

### 1. Penalaran Verbal
Kemampuan berbahasa mencerminkan daya tangkap nalar terhadap informasi abstrak:
- **Analogi Pasangan Kata:** Menemukan pola relasi fungsional, kausal, atau kategorikal antara premis kata $A : B$ dengan $C : D$.
- **Sinonim & Antonim:** Membedakan tingkatan makna dan nuansa kontekstual kosakata baku formal.

---

### 2. Logika Proposisi & Inferensi Deduktif
Penyimpulan berbasis aturan formal matematika logika:
- **Silogisme Kategorik:**
  $$\\text{Premis 1: Semua } A \\text{ adalah } B$$
  $$\\text{Premis 2: } C \\text{ adalah } A$$
  $$\\text{Kesimpulan: } C \\text{ adalah } B$$
- **Hukum Kontraposisi & Modus Tollens:**
  $$p \\rightarrow q \\iff \\sim q \\rightarrow \\sim p$$

---

### 3. Logika Analitik & Pemodelan Kondisi
Menata dan memetakan informasi kompleks yang dibatasi aturan:
- Penataan urutan peringkat (posisi linier / melingkar).
- Kombinasi syarat keterpilihan kelompok.
- Diagram Venn untuk menganalisis irisan himpunan:
  $$n(A \\cup B) = n(A) + n(B) - n(A \\cap B)$$

---

### 4. Barisan & Pola Deret
Deteksi algoritma di balik urutan bilangan dan huruf:
- **Aritmatika Bertingkat:** Selisih antar suku yang membentuk deret baru.
- **Fibonacci & Rekursif:** Suku ke-$n$ berasal dari penjumlahan suku sebelumnya: $U_n = U_{n-1} + U_{n-2}$.
- **Pola Larik Campuran:** Dua atau lebih pola deret yang saling disisipkan berselang-seling.

---

### 5. Matematika Dasar Kuantitatif
Ketangkasan komputasi praktis:
- Aljabar selisih kuadrat: $a^2 - b^2 = (a - b)(a + b)$.
- Perbandingan berbalik nilai pekerjaan: $\\frac{1}{t_{\\text{total}}} = \\frac{1}{t_1} + \\frac{1}{t_2}$.
- Rata-rata terbobot gabungan: $\\bar{x}_{\\text{gab}} = \\frac{n_1 \\bar{x}_1 + n_2 \\bar{x}_2}{n_1 + n_2}$.`,
    practicalSteps: [
      'Pilih salah satu sub materi dari 5 pilar TPA (Verbal, Proposisi, Analitik, Barisan, Matematika Dasar).',
      'Di simulator interaktif TPA, gunakan panel uji logika dan generator pola barisan untuk menguji insting nalar Anda.',
      'Dalam Mode Admin, Anda dapat mengunggah berkas animasi Flash (.SWF) khusus langsung di modul utama maupun per sub-materi.',
      'Pelajari uraian teori dan strategi cepat (shortcut) untuk menghemat waktu pengerjaan soal.',
      'Kerjakan Kuis Evaluasi Komprehensif TPA untuk mengukur persentase skor dan mengklaim sertifikat kelulusan.'
    ],
    quiz: [
      {
        id: 'q-tpa-1',
        question: 'Verbal: KIKUK : CANGGUNG = ... : ...',
        options: [
          'A. Mahir : Terampil',
          'B. Pandai : Angkuh',
          'C. Gemuk : Lemah',
          'D. Cepat : Lalai',
          'E. Diam : Gaduh'
        ],
        correctAnswer: 0,
        explanation: 'Kata "kikuk" bersinonim dengan "canggung". Pasangan kata yang memiliki relasi sinonim setara adalah "mahir" : "terampil".'
      },
      {
        id: 'q-tpa-2',
        question: 'Proposisi: Jika hari ini hujan lebat, maka pertandingan sepak bola ditunda. Hari ini pertandingan sepak bola TIDAK ditunda. Kesimpulan yang sah menurut Modus Tollens adalah:',
        options: [
          'A. Hari ini hujan rintik-rintik',
          'B. Hari ini tidak hujan lebat',
          'C. Pertandingan dibatalkan',
          'D. Penonton tetap hadir',
          'E. Lapangan bola basah'
        ],
        correctAnswer: 1,
        explanation: 'Bentuk premis: p → q. Fakta: ~q (tidak ditunda). Berdasarkan Modus Tollens, kesimpulan yang valid adalah ~p ("Hari ini tidak hujan lebat").'
      },
      {
        id: 'q-tpa-3',
        question: 'Analitik: Enam siswa (A, B, C, D, E, F) duduk berjajar. B duduk di sebelah kanan A. C duduk di antara B dan D. E duduk di ujung kiri. F duduk tepat di sebelah kiri A. Siapakah yang duduk di ujung kanan?',
        options: [
          'A. B',
          'B. C',
          'C. D',
          'D. E',
          'E. F'
        ],
        correctAnswer: 2,
        explanation: 'Susunan urutan dari kiri ke kanan berdasarkan syarat: E di ujung kiri, F di kiri A, B di kanan A, C di antara B dan D. Maka urutannya: [E] - [F] - [A] - [B] - [C] - [D]. Yang berada di ujung paling kanan adalah D.'
      },
      {
        id: 'q-tpa-4',
        question: 'Barisan: 3, 5, 9, 17, 33, ... Berapakah angka selanjutnya?',
        options: [
          'A. 49',
          'B. 55',
          'C. 65',
          'D. 67',
          'E. 72'
        ],
        correctAnswer: 2,
        explanation: 'Perhatikan selisih antar suku: 5 - 3 = +2; 9 - 5 = +4; 17 - 9 = +8; 33 - 17 = +16. Selisih bertambah dua kali lipat (+2, +4, +8, +16, +32). Maka suku berikutnya adalah 33 + 32 = 65.'
      },
      {
        id: 'q-tpa-5',
        question: 'Matematika Dasar: Suatu pekerjaan dapat diselesaikan oleh 12 orang pekerja dalam waktu 20 hari. Jika pekerjaan tersebut ingin diselesaikan dalam waktu 15 hari, berapa tambahan pekerja yang dibutuhkan?',
        options: [
          'A. 3 orang',
          'B. 4 orang',
          'C. 5 orang',
          'D. 6 orang',
          'E. 8 orang'
        ],
        correctAnswer: 1,
        explanation: 'Ini adalah perbandingan berbalik nilai: 12 orang × 20 hari = X orang × 15 hari. X = 240 / 15 = 16 orang. Maka tambahan pekerja yang dibutuhkan adalah 16 - 12 = 4 orang pekerja.'
      }
    ]
  }
];
