# BAB V: ANALISIS DAN EVALUASI HASIL IMPLEMENTASI

## 5.2 Data Pendukung

Data pendukung pada bagian ini menyajikan analisis komparatif antara **kondisi operasional eksisting (proses manual)** dengan **hasil pengujian simulasi kinerja sistem serta penyerahan kode program (*Repository Handover*)** dari **Sistem Informasi Ticketing & Manajemen Layanan IT Yayasan Assakinah**.

> **Catatan Tahapan Implementasi & Serah Terima**:  
> Setelah seluruh tahapan pengembangan, migrasi data inventaris (4.512 item), dan pengujian simulasi sistem (*Internal Benchmark Testing*) selesai dilaksanakan, **kode program (*source code*) dan repositori pengembangan aplikasi secara resmi telah diserahterimakan kepada pihak pengurus Yayasan Assakinah** untuk dapat di-deploy dan dijalankan pada infrastruktur internal yayasan.

---

### 5.2.1 Metodologi & Sumber Data Pendukung

Data pendukung disusun berdasarkan 3 sumber utama:

1. **Observasi & Wawancara Lapangan (*Before*)**:
   - Analisis terhadap proses pelaporan masalah IT/sarpras secara manual via WhatsApp/lisan di unit-unit Yayasan Assakinah (RA, MI, MTs, MA, SPKh, Ponpes, Masjid).
   - Audit data inventaris eksisting yang belum terpusat (berhasil dihimpun dan dimigrasikan sebanyak 4.512 item inventaris fisik).
2. **Pengujian Kinerja & Simulasi Skenario Sistem (*After / Internal Benchmark*)**:
   - Pengujian simulasi pembuatan tiket, pencarian data inventaris, dan alur penanganan masalah menggunakan sistem ticketing digital untuk mengukur durasi dan tingkat efisiensi proses.
3. **Penyerahan Luaran Kode Program (*Repository Handover*)**:
   - Bukti penyerahan repositori *source code* aplikasi, dokumentasi kebutuhan teknis (NFR), data inventaris terstruktur, serta panduan pengoperasian sistem kepada pihak pengelola IT Yayasan Assakinah.

---

### 5.2.2 Tabel Perbandingan Kinerja Proses (Manual vs Sistem Digital)

Berikut adalah perbandingan parametrik antara proses manual yang berjalan saat ini dengan hasil pengujian simulasi alur kerja sistem ticketing digital yang telah diserahterimakan:

| No | Parameter Operasional | Kondisi Eksisting (Manual Saat Ini) | Hasil Pengujian Simulasi (Sistem Digital) | Dampak & Efisiensi | Status Verifikasi & Handover |
|---|---|---|---|---|:---:|
| 1 | **Waktu Pelaporan Kendala** | 15 - 30 Menit (Mencari kontak IT/menulis pesan WA terpisah) | **1 - 2 Menit** (Form tiket terstruktur di web) | Hemat waktu hingga **90%** | Kode Diserahterimakan |
| 2 | **Kejelasan & Tracking Status Tiket** | Tidak ada (Harus bertanya ulang via chat/lisan) | **Real-time** (Status: *Open*, *In Progress*, *Resolved*) | Transparansi 100% | Kode Diserahterimakan |
| 3 | **Pencarian Data Inventaris Barang** | > 15 Menit (Mencari di buku/file Excel per unit) | **< 5 Detik** (Pencarian terpusat 4.512 item) | Pencarian lebih cepat **99%** | Data Diserahterimakan |
| 4 | **Pencatatan Riwayat Kerusakan** | Tidak terdokumentasi / rawan hilang | **Tersimpan otomatis** pada database & log audit | Dokumentasi terpusat | Kode Diserahterimakan |
| 5 | **Pengukuran Kinerja Layanan IT (SLA)** | Tidak ada indikator terukur | **Terukur otomatis** (SLA latency & response time) | Monitoring terstandar | Kode Diserahterimakan |

---

### 5.2.3 Grafik Visualisasi Perbandingan Durasi Proses (Menit)

```text
[PERBANDINGAN DURASI PROSES PELAPORAN & PENCARIAN DATA (DALAM MENIT)]

Waktu Pelaporan Kendala IT:
MANUAL   [██████████████████████████████] 20 Menit
SISTEM   [██] 2 Menit (Efisiensi 90%)

Waktu Pencarian Data Inventaris Barang:
MANUAL   [████████████████████] 15 Menit
SISTEM   [█] < 0.1 Menit / 5 Detik (Efisiensi 99%)

Kepastian Tracking Status Pelaporan:
MANUAL   [░░░░░░░░░░░░░░░░░░░░] 0% (Manual Chat)
SISTEM   [████████████████████] 100% (Real-Time System & Ready for Deployment)
```

---

### 5.2.4 Matriks Berkas & Kode Program yang Diserahterimakan

Sebagai bentuk pertanggungjawaban penyelesaian kegiatan, berikut adalah rincian aset digital yang telah diserahkan kepada Yayasan Assakinah:

| No | Aset / Deliverables | Bentuk Penyerahan | Deskripsi & Isi Berkas | Status Penyerahan |
|---|---|---|---|:---:|
| 1 | **Source Code Sistem Ticketing** | Repositori GitHub / ZIP Project | Kode sumber aplikasi berbasis Next.js & Supabase | **Sudah Diserahkan** |
| 2 | **Database Inventaris Digital** | Dokumen SQL / File Markdown / CSV | 4.512 data barang inventaris terstruktur dari 12 unit | **Sudah Diserahkan** |
| 3 | **Dokumentasi Kebutuhan Teknis** | Dokumen `NFR.md` & `README.md` | Panduan arsitektur, NFR (Non-Functional Requirements), dan langkah instalasi | **Sudah Diserahkan** |
| 4 | **SOP & Panduan Pengoperasian** | Dokumen Petunjuk Pengguna | Panduan penggunaan untuk Admin, Teknisi, dan User | **Sudah Diserahkan** |

---

### 5.2.5 Analisis Data Pendukung

Berdasarkan data observasi, hasil simulasi, dan proses penyerahan kode program di atas, diperoleh temuan analisis sebagai berikut:

1. **Efisiensi Waktu Operasional**
   - Proses pelaporan manual yang semula memakan waktu hingga 30 menit dapat dipangkas menjadi 1-2 menit saja melalui formulir digital yang sistematis.
2. **Kerapihan Pengelolaan 4.512 Item Inventaris**
   - Penataan data inventaris fisik dari 12 lokasi/unit (MTs, MA, MI, RA, Ponpes, Masjid, dll.) yang sebelumnya terpisah kini berhasil diintegrasikan. Kecepatan pencarian data inventaris mengalami peningkatan efisiensi sebesar 99% (< 5 detik).
3. **Kesiapan Infrastruktur & Kesinambungan Layanan (*Sustainability*)**
   - Dengan dilakukannya penyerahan repositori *source code* dan dokumentasi teknis secara resmi, pihak Yayasan Assakinah memiliki kendali penuh untuk melakukan *deployment*, pemeliharaan, serta pengembangan fitur lebih lanjut di masa mendatang.

---

### 5.2.6 Dokumentasi Foto Pengumpulan Data & Serah Terima Repositori

*(Melampirkan foto-foto bukti kegiatan observasi lapangan, pengujian sistem, serta proses serah terima kode program kepada pengurus)*

| Gambar Dokumentasi | Deskripsi Kegiatan | Keterangan |
|---|---|---|
| `[Foto_1_Observasi_Inventaris.jpg]` | Observasi dan pendataan sarana prasarana IT/Mebelair fisik di unit kerja Yayasan Assakinah. | Pengumpulan data dasar (*Before*). |
| `[Foto_2_Simulasi_Sistem.jpg]` | Pengujian simulasi pembuatan tiket dan pencarian inventaris pada antarmuka aplikasi. | Verifikasi simulasi kinerja (*After*). |
| `[Foto_3_Serah_Terima_Repo.jpg]` | Penyerahan repositori kode program (*source code*) dan dokumentasi sistem secara resmi kepada pengurus Yayasan Assakinah. | Bukti penyerahan luaran proyek (*Handover*). |

---

> **Catatan**: Seluruh dokumentasi foto dan berkas berita acara serah terima (BAST) disisipkan pada cetakan laporan akhir sebagai bukti fisik pertanggungjawaban kegiatan.
