# Panduan Setup Backend Supabase — Proyek "SawitKu"

Dokumen ini berisi panduan lengkap langkah demi langkah untuk menyiapkan backend Supabase proyek **SawitKu**.

---

## 1. Membuat Proyek di Supabase

1. Buka browser dan kunjungi [https://supabase.com](https://supabase.com).
2. Masuk (**Sign in**) menggunakan akun GitHub atau Email Anda.
3. Di dashboard Supabase, klik tombol **"New project"**.
4. Isi konfigurasi proyek:
   - **Name**: `sawitku`
   - **Database Password**: Masukkan password yang kuat dan catat di tempat aman (password manager).
   - **Region**: Pilih region terdekat dengan lokasi pengguna (disarankan: `Singapore (ap-southeast-1)` untuk Indonesia).
   - **Pricing Plan**: Pilih **Free Tier**.
5. Klik **"Create new project"** dan tunggu 1-2 menit hingga proses provisi selesai.

---

## 2. Menjalankan SQL Migrasi

Semua skrip migrasi database tersimpan di direktori `supabase/migrations/` secara berurutan:

1. Di dashboard Supabase proyek Anda, buka menu **SQL Editor** di sidebar kiri (ikon `>_`).
2. Buat query baru (**New Query**) untuk setiap file migrasi di bawah ini, salin isinya, lalu klik **"Run"** (Ctrl+Enter):

   - **Langkah 2.1 — Skema Tabel Utama**:
     Buka file `supabase/migrations/20261005000001_initial_schema.sql`, salin seluruh isinya ke SQL Editor, lalu jalankan.
     *Hasil*: 4 tabel utama (`kebun`, `panen`, `perawatan`, `pengeluaran_lain`) dengan UUID PK, soft delete, dan audit fields.

   - **Langkah 2.2 — Triggers Otomatis**:
     Buka file `supabase/migrations/20261005000002_triggers.sql`, salin dan jalankan.
     *Hasil*: Trigger auto-update `updated_at` saat data dimodifikasi dan auto-sync `tanggal_panen_terakhir` pada tabel `kebun`.

   - **Langkah 2.3 — Views & Functions (Kalkulasi Dashboard & Pengeluaran)**:
     Buka file `supabase/migrations/20261005000003_views_functions.sql`, salin dan jalankan.
     *Hasil*: SQL Views (`v_pengeluaran_lengkap`, `v_dashboard_statistik`, `v_laporan_bulanan`) dan fungsi RPC (`get_dashboard_summary`, `get_laporan_tahunan`) yang perhitungannya 100% identik dengan logika Android.

   - **Langkah 2.4 — Row Level Security (RLS)**:
     Buka file `supabase/migrations/20261005000004_rls_policies.sql`, salin dan jalankan.
     *Hasil*: Proteksi data per-user aktif. Pengguna hanya dapat membaca dan memanipulasi data milik `user_id` mereka sendiri.

---

## 3. Konfigurasi Autentikasi (Auth)

1. Di menu sidebar Supabase, buka **Authentication** > **Providers**.
2. Pastikan provider **Email** dalam status **Enabled**.
3. Di tab **Authentication** > **URL Configuration**:
   - Jika untuk pengembangan lokal web: tambahkan `http://localhost:5173` atau `http://localhost:3000` ke **Redirect URLs**.
4. (Opsional untuk testing cepat): Di **Authentication** > **Providers** > **Email**, Anda bisa menonaktifkan **"Confirm email"** jika ingin user langsung aktif setelah register tanpa harus klik tautan verifikasi email terlebih dahulu.

---

## 4. Mengambil Kunci API (API Keys)

1. Buka menu **Project Settings** (ikon gear di pojok kiri bawah) > **API**.
2. Salin data berikut ke file konfigurasi Anda:
   - **Project URL**: contoh `https://abcdefghijklm.supabase.co`
   - **Project API keys** -> **`anon` / `public`**: kunci publik yang aman dipakai di Android dan Web.
3. ⚠️ **PERINGATAN KEAMANAN**:
   - **JANGAN PERNAH** membagikan atau menaruh kunci `service_role` (secret) di aplikasi Android, frontend Web, maupun commit ke Git!
   - Klien hanya boleh menggunakan kunci `anon` / `public`.

---

## 5. Salin ke File Environment (`.env`)

Salin file `.env.example` menjadi `.env` di root proyek:
```bash
cp .env.example .env
```
Lalu isi nilainya:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJh...
```

---

## 6. Penanganan Proyek Gratis Supabase (Auto-Pause Prevention)

### Aturan Supabase Free Tier:
- Proyek gratis Supabase akan **otomatis di-pause (inaktif)** jika tidak ada request API selama **7 hari berturut-turut**.
- Data database Anda **TIDAK HILANG** saat di-pause.

### Cara Menghidupkan Kembali (Jika Terlanjur Di-pause):
1. Buka dashboard Supabase.
2. Klik proyek `sawitku`.
3. Klik tombol **"Restore project"**. Proyek akan aktif kembali dalam 1–2 menit.

### Tips Agar Proyek Tetap Aktif Otomatis:
1. **Gunakan GitHub Actions (Cron Job)**:
   Buat alur kerja terjadwal mingguan sederhana yang melakukan ping GET ke endpoint REST Supabase Anda:
   ```yaml
   name: Keep Supabase Alive
   on:
     schedule:
       - cron: '0 0 * * 1,4' # Berjalan setiap Senin dan Kamis
   jobs:
     ping:
       runs-on: ubuntu-latest
       steps:
         - name: Ping Supabase API
           run: curl -s "${{ secrets.SUPABASE_URL }}/rest/v1/" -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" > /dev/null
   ```
2. Atau cukup buka aplikasi Android / Web SawitKu minimal seminggu sekali untuk sinkronisasi data.
