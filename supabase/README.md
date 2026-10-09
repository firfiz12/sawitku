# Panduan Setup Backend Supabase - Proyek SawitKu

Panduan lengkap langkah demi langkah untuk menyiapkan backend Supabase **SawitKu**.
Dirancang untuk pemula yang baru pertama kali memakai Supabase.

> Semua skrip migrasi sudah ada di folder `supabase/migrations/` (4 file berurutan).
> Anda tinggal menyalin isinya ke SQL Editor di dashboard Supabase.

---

## 1. Membuat Proyek di Supabase

1. Buka https://supabase.com dan buat akun (bisa pakai GitHub atau email).
2. Di dashboard, klik **New project**.
3. Isi konfigurasi:
   - **Name**: `sawitku`
   - **Database Password**: buat password kuat dan simpan di tempat aman (password manager).
   - **Region**: pilih **Singapore (ap-southeast-1)** supaya dekat dengan Indonesia.
   - **Pricing Plan**: pilih **Free Tier**.
4. Klik **Create new project** dan tunggu 1–2 menit hingga provisi selesai.

---

## 2. Menjalankan SQL Migrasi (urut, dari 001 ke 004)

1. Di dashboard Supabase, buka menu **SQL Editor** di sidebar kiri (ikon `>_`).
2. Klik **New query**, salin seluruh isi file migrasi, lalu klik **Run** (Ctrl+Enter).

Jalankan **empat file berikut secara berurutan**:

### Migrasi 001 - Skema Tabel Utama
```
supabase/migrations/20261005000001_initial_schema.sql
```
Membuat 4 tabel: `kebun`, `panen`, `perawatan`, `pengeluaran_lain`, lengkap dengan
UUID primary key, `user_id`, soft delete (`is_deleted`), dan timestamp audit
(`created_at`, `updated_at`).

### Migrasi 002 - Trigger Otomatis
```
supabase/migrations/20261005000002_triggers.sql
```
- Auto-update `updated_at` setiap baris diubah (penting untuk sinkronisasi delta).
- Auto-sync `tanggal_panen_terakhir` di tabel `kebun` setiap ada perubahan panen.

### Migrasi 003 - Views & Functions
```
supabase/migrations/20261005000003_views_functions.sql
```
Membuat views (`v_semua_pengeluaran`, `v_dashboard_bulanan`, `v_pengeluaran_bulanan`)
dan fungsi RPC (`fn_dashboard_ringkasan`, `fn_pendapatan_6_bulan`,
`fn_distribusi_biaya_tahunan`, `fn_jadwal_rotasi_panen`) dengan kalkulasi
identik dengan versi Android.

### Migrasi 004 - Row Level Security (RLS)
```
supabase/migrations/20261005000004_rls_policies.sql
```
Mengaktifkan RLS di keempat tabel. **Ini kunci privasi data per-akun**:
setiap pengguna HANYA bisa membaca/menulis data dengan `user_id` miliknya sendiri,
di mana pun aplikasi dipakai (web atau Android).

> **HASTAH HITAM**: setelah RLS aktif, aplikasi klien HANYA boleh pakai
> `anon/public key`. JANGAN pernah memasang `service_role key` di kode
> Android/web — itu kunci secret untuk server-side saja.

---

## 3. Konfigurasi Autentikasi (Login Email)

1. Di sidebar Supabase, buka **Authentication → Providers**.
2. Pastikan provider **Email** dalam status **Enabled**.
3. (Opsional, untuk testing cepat) matikan **"Confirm email"** di menu Email
   supaya registrasi langsung login tanpa klik tautan verifikasi.
   Untuk produksi, nyalakan kembali.
4. Di **Authentication → URL Configuration**, isi **Site URL** dengan
   `http://localhost:5173` saat development (dan URL hosting setelah deploy).
   Web app SawitKu memakai alur email + password (`AuthModal.tsx`).

---

## 4. Mengambil Kunci API

1. Buka **Project Settings** (ikon gear di kiri bawah) → **API**.
2. Salin dua nilai:
   - **Project URL**: contoh `https://abcdefghijklm.supabase.co`
   - **Project API keys → `anon` / `public`**: kunci aman untuk klien.

> **PERINGATAN KEAMANAN**
> - JANGAN pernah membagikan atau memasang kunci `service_role` di aplikasi
>   Android, frontend web, atau commit ke Git.
> - Klien hanya boleh menggunakan kunci `anon` / `public`.
> - Anon key aman dipublikasikan karena RLS yang melindungi data, bukan kuncinya.

---

## 5. Mengisi File Environment

### Untuk Web (Vite + React)
Salin file `.env.example` menjadi `.env` di folder `web`, lalu isi:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

File `.env` WAJIB ada sebelum `npm run dev`. Jika kredensial kosong, aplikasi
berjalan dalam Mode Demo Lokal (data hanya di perangkat).

### Untuk Android
Masukkan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` ke BuildConfig / kredensial
sesuai konfigurasi project Android.

> JANGAN commit file `.env` ke repository (sudah ada di `.gitignore` biasanya).

---

## 6. Arsitektur Offline-First & Isolasi Data Per-Akun

SawitKu (web) menerapkan **offline-first**:

- `localStorage` adalah **source of truth**. Setiap tulis disimpan lokal dulu,
  lalu disinkronkan ke Supabase.
- Storage dipisah per akun: kunci `sawitku_local_<tabel>_u_<userId>`.
  Akun yang satu TIDAK akan melihat/modifikasi data akun lain.
- Jika offline, tulis masuk antrian **pending sync** dan di-retry otomatis
  saat koneksi kembali.
- Mode tamu (belum login) memakai seed data demo dan tersimpan di perangkat itu saja.

Backend (RLS) memastikan isolasi ini tetap valid meski akses lewat API langsung:
setiap query hanya mengembalikan baris dengan `user_id` = user yang login.

### Cara menguji isolasi benar-benar bekerja
1. Di browser A: daftar akun baru, tambah 1 kebun → muncul di dashboard.
2. Buka browser incognito/privasi, daftar akun lain → dashboard harus **kosong**.
3. Buka **Table Editor** di Supabase → baris yang baru dibuat harus memiliki
   `user_id` milik akun A, bukan akun lain.

---

## 7. Penanganan Proyek Gratis Supabase (Auto-Pause)

### Aturan Free Tier
- Proyek gratis otomatis **di-pause (nonaktif)** jika tidak ada request API
  selama **7 hari berturut-turut**.
- Data database **TIDAK hilang** saat di-pause.

### Menghidupkan kembali
1. Buka dashboard Supabase.
2. Klik proyek `sawitku`.
3. Klik **Restore project** (aktif kembali dalam 1–2 menit).

### Tips agar tetap aktif
- Buka aplikasi SawitKu minimal seminggu sekali untuk sinkronisasi, atau
- Pakai GitHub Actions cron bulanan/mingguan yang ping endpoint REST Supabase:

```yaml
name: Keep Supabase Alive
on:
  schedule:
    - cron: '0 0 * * 1,4' # Senin & Kamis
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase API
        run: curl -s "${{ secrets.SUPABASE_URL }}/rest/v1/" -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" > /dev/null
```

---

## 8. Verifikasi Akhir

1. Jalankan `npm run dev` di folder `web`.
2. Buka aplikasi → ikon database di topbar → status harus **"Terhubung ke
   Supabase Cloud”** dan keempat tabel **Aktif**.
3. Uji offline: matikan jaringan (mode pesawat), input data, hidupkan kembali →
   data tersinkron otomatis.