-- =============================================================================
-- MIGRATION 001: Initial Schema SawitKu
-- Dibuat untuk: Supabase PostgreSQL (proyek "sawitku")
-- Tanggal: 2026-10-05
--
-- Membuat 4 tabel utama yang memetakan entity Room Android:
--   kebun, panen, perawatan, pengeluaran_lain (= biaya MANDIRI)
--
-- Catatan penting:
--   - Biaya DERIVED (dari perawatan/panen) TIDAK disimpan di tabel terpisah;
--     dihitung via VIEW di migration 003 agar identik dengan kalkulasi Android.
--   - Semua tanggal disimpan sebagai TIMESTAMPTZ.
--   - Uang dan berat pakai NUMERIC, bukan FLOAT, agar tidak ada floating-point error.
--   - Semua tabel punya: id UUID, user_id, updated_at, is_deleted.
-- =============================================================================

-- ========================
-- TABEL: kebun
-- ========================
CREATE TABLE IF NOT EXISTS kebun (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Kolom bisnis (memetakan KebunEntity Android)
    nama                    TEXT        NOT NULL,
    luas_ha                 NUMERIC(10, 4) NOT NULL DEFAULT 0,
    jumlah_pohon            INTEGER     NOT NULL DEFAULT 0,
    keterangan              TEXT        NOT NULL DEFAULT '',
    rotasi_panen_hari       INTEGER     NOT NULL DEFAULT 14,
    tanggal_panen_terakhir  TIMESTAMPTZ,          -- NULL = belum pernah panen

    -- Kolom sinkronisasi
    is_deleted              BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- TABEL: panen
-- ========================
CREATE TABLE IF NOT EXISTS panen (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kebun_id                UUID        NOT NULL REFERENCES kebun(id),

    -- Kolom bisnis (memetakan PanenEntity Android)
    tanggal                 TIMESTAMPTZ NOT NULL,
    berat_kg                NUMERIC(12, 3) NOT NULL DEFAULT 0,   -- Berat TBS
    harga_per_kg            NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- Harga TBS/kg
    berat_brondolan_kg      NUMERIC(12, 3) NOT NULL DEFAULT 0,   -- Opsional
    harga_brondolan_per_kg  NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- Opsional
    pendapatan_brondolan    NUMERIC(15, 2) NOT NULL DEFAULT 0,   -- = berat_brondolan × harga_brondolan
    pendapatan              NUMERIC(15, 2) NOT NULL DEFAULT 0,   -- Total TBS + brondolan
    biaya_produksi          NUMERIC(15, 2) NOT NULL DEFAULT 0,   -- Biaya produksi panen
    keterangan              TEXT        NOT NULL DEFAULT '',
    reminder_enabled        BOOLEAN     NOT NULL DEFAULT FALSE,
    reminder_tanggal        TIMESTAMPTZ,          -- NULL = tidak ada reminder

    -- Kolom sinkronisasi
    is_deleted              BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- TABEL: perawatan
-- ========================
CREATE TABLE IF NOT EXISTS perawatan (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kebun_id         UUID        NOT NULL REFERENCES kebun(id),

    -- Kolom bisnis (memetakan PerawatanEntity Android)
    tanggal          TIMESTAMPTZ NOT NULL,
    jenis            TEXT        NOT NULL DEFAULT '',  -- "Pemupukan","Penyemprotan", dll.
    jenis_pupuk      TEXT        NOT NULL DEFAULT '',  -- hanya terisi bila jenis=Pemupukan
    jenis_racun      TEXT        NOT NULL DEFAULT '',  -- hanya terisi bila jenis=Penyemprotan
    deskripsi        TEXT        NOT NULL DEFAULT '',
    biaya            NUMERIC(15, 2) NOT NULL DEFAULT 0,
    reminder_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
    reminder_tanggal TIMESTAMPTZ,

    -- Kolom sinkronisasi
    is_deleted       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- TABEL: pengeluaran_lain
-- (memetakan BiayaEntity Android dengan sourceType = 'MANDIRI')
-- Biaya turunan dari perawatan/panen dihitung via VIEW, tidak disimpan di sini.
-- ========================
CREATE TABLE IF NOT EXISTS pengeluaran_lain (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kebun_id    UUID        REFERENCES kebun(id),   -- NULLABLE: biaya umum tanpa kebun

    -- Kolom bisnis (memetakan BiayaEntity Android sourceType='MANDIRI')
    tanggal     TIMESTAMPTZ NOT NULL,
    kategori    TEXT        NOT NULL DEFAULT '',
    deskripsi   TEXT        NOT NULL DEFAULT '',
    jumlah      NUMERIC(15, 2) NOT NULL DEFAULT 0,

    -- Kolom sinkronisasi
    is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- INDEX untuk performa query umum
-- ========================
CREATE INDEX IF NOT EXISTS idx_kebun_user_id       ON kebun(user_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_panen_user_id        ON panen(user_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_panen_kebun_id       ON panen(kebun_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_panen_tanggal        ON panen(user_id, tanggal DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_perawatan_user_id    ON perawatan(user_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_perawatan_kebun_id   ON perawatan(kebun_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_pengeluaran_user_id  ON pengeluaran_lain(user_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_pengeluaran_kebun_id ON pengeluaran_lain(kebun_id) WHERE is_deleted = FALSE;

-- Index untuk sinkronisasi delta (pull: ambil data yang updated_at > lastSyncTime)
CREATE INDEX IF NOT EXISTS idx_kebun_updated_at        ON kebun(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_panen_updated_at         ON panen(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_perawatan_updated_at     ON perawatan(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_pengeluaran_updated_at   ON pengeluaran_lain(user_id, updated_at);
