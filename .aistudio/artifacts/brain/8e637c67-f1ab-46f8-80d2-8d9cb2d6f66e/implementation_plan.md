# Rencana Implementasi: Unggah Banyak Berkas Sekaligus (Batch) & Impor Google Drive pada Modul TPA

## Ringkasan Solusi
Menyediakan kemampuan bagi Pengajar/Admin untuk mengunggah banyak berkas `.swf` sekaligus (*batch upload*) dan mengimpor berkas langsung dari Google Drive langsung dari dalam **Modul Tes Potensi Akademik (TPA)** atau submodulnya. Setiap berkas dalam antrean dapat langsung dipetakan ke 5 sub materi utama: **Verbal**, **Proposisi**, **Analitik**, **Barisan**, atau **Matematika Dasar** (atau ke modul utama).

---

## Rincian Perubahan & Arsitektur

### 1. Panel Unggah Terpadu di Dalam Modul (Mode Admin)
- Di dalam `ModuleViewer.tsx`, perbarui panel admin dengan 2 aksi cepat:
  - **Unggah Banyak File Sekaligus (Batch)**: Membuka dialog antrean berkas multi-unggah.
  - **Impor Langsung dari Google Drive**: Membuka dialog impor tautan / penjelajah berkas Google Drive.
- Juga sediakan tombol pintasan impor Google Drive dan Batch langsung di setiap kartu Submateri (Verbal, Proposisi, Analitik, Barisan, Matematika Dasar).

### 2. Antarmuka Batch Upload dengan Pemetaan Submateri
- Komponen dialog batch upload baru/penyesuaian (`ModuleBatchUploadModal.tsx`):
  - Menerima seleksi banyak berkas `.swf` sekaligus (`<input type="file" multiple accept=".swf" />`).
  - Menampilkan daftar berkas terpilih dengan nama file, ukuran, dan status.
  - **Menu Pemetaan Submateri per Berkas**: Dropdown untuk memilih target penempatan setiap file:
    - *Modul Utama (Tes Potensi Akademik)*
    - *Submateri 1: Verbal*
    - *Submateri 2: Proposisi*
    - *Submateri 3: Analitik*
    - *Submateri 4: Barisan*
    - *Submateri 5: Matematika Dasar*
  - Tombol **"Unggah & Pasang Semua Berkas"**: Menyimpan seluruh *blob* ke IndexedDB secara paralel/sekuensial dan memperbarui kurikulum modul secara otomatis.

### 3. Integrasi Impor Langsung dari Google Drive
- Penyesuaian `GoogleDrivePickerModal.tsx` khusus untuk modul & submateri:
  - **Metode 1 (Tautan Berbagi / URL Google Drive)**:
    - Masukkan tautan berbagi Google Drive (contoh: `https://drive.google.com/file/d/1A2B3C.../view?usp=sharing`).
    - Sistem mengekstrak File ID dan mengunduh berkas binary `.swf` langsung ke penyimpanan IndexedDB lokal browser.
  - **Metode 2 (Drive File Explorer / Berkas Sampel Siap Impor)**:
    - Penjelajah berkas interaktif bergaya Google Drive dengan berkas simulasi TPA (Verbal, Proposisi, Analitik, Barisan, Matematika Dasar) yang dapat diimpor dalam 1-klik.
  - **Pilihan Target Penempatan**: Admin dapat memilih apakah berkas Google Drive tersebut dipasang pada Modul Utama atau salah satu dari 5 Submateri TPA.

### 4. Sinkronisasi Penyimpanan & Pemutaran di Ruffle
- Penyimpanan berkas IndexedDB menggunakan skema `saveSwfBlob` dengan kunci unik.
- Status berkas di submateri diperbarui secara reaktif (`blobKey`, `fileName`, `fileSizeBytes`).
- Ruffle player langsung dapat memutar berkas yang diunggah secara mulus.
- Mode Siswa tetap bersih dari tombol unggah/impor, hanya memiliki akses memutar media.

---

## Rencana Langkah Eksekusi

1. **Pembuatan/Penyempurnaan Komponen Impor**:
   - Buat komponen `ModuleBatchUploadModal.tsx` yang mendukung multi-select berkas `.swf` dan *mapping selector* ke 5 sub materi TPA.
   - Perbarui `GoogleDrivePickerModal.tsx` agar mendukung pemilihan target sub materi TPA dan pengunduhan berkas ke IndexedDB.
2. **Integrasi ke `ModuleViewer.tsx`**:
   - Tambahkan tombol pemicu Batch Upload dan Google Drive Import di panel admin modul dan di masing-masing submodul.
   - Hubungkan handler pembaruan state modul saat proses batch/drive selesai.
3. **Verifikasi & Uji Coba**:
   - Validasi kompilasi (`compile_applet`) dan linter (`lint_applet`).
   - Uji alur batch upload multi-file dengan pemetaan ke Verbal, Proposisi, Analitik, Barisan, Matematika Dasar.
   - Uji alur impor Google Drive.
