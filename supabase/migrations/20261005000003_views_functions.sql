-- =============================================================================
-- MIGRATION 003: Views & Functions untuk Dashboard
--
-- Tujuan: hasil kalkulasi di server (web) IDENTIK dengan kalkulasi Android.
-- Android menghitung semua biaya dari 3 sumber:
--   1. pengeluaran_lain (MANDIRI)
--   2. perawatan.biaya (derived)
--   3. panen.biaya_produksi (derived)
--
-- View ini menggabungkan ketiganya agar hasilnya sama persis.
-- =============================================================================

-- ============================================================
-- VIEW: v_semua_pengeluaran
-- Menggabungkan 3 sumber biaya menjadi satu view seragam.
-- Dipakai oleh dashboard dan laporan web.
-- CATATAN: Kolom 'sumber' menunjukkan asal biaya:
--   'MANDIRI'   = dari tabel pengeluaran_lain
--   'PERAWATAN' = dari tabel perawatan (biaya > 0)
--   'PANEN'     = dari tabel panen (biaya_produksi > 0)
-- ============================================================
CREATE OR REPLACE VIEW v_semua_pengeluaran AS

-- Sumber 1: Pengeluaran mandiri (input langsung user)
SELECT
    pl.id,
    pl.user_id,
    pl.kebun_id,
    pl.tanggal,
    pl.kategori,
    pl.deskripsi,
    pl.jumlah,
    'MANDIRI'::TEXT AS sumber,
    pl.is_deleted
FROM pengeluaran_lain pl

UNION ALL

-- Sumber 2: Biaya dari perawatan (hanya yang biaya > 0)
SELECT
    pr.id,
    pr.user_id,
    pr.kebun_id,
    pr.tanggal,
    CASE
        WHEN pr.jenis = 'Pemupukan'    AND pr.jenis_pupuk  != '' THEN 'Perawatan: Pemupukan ('    || pr.jenis_pupuk  || ')'
        WHEN pr.jenis = 'Penyemprotan' AND pr.jenis_racun  != '' THEN 'Perawatan: Penyemprotan (' || pr.jenis_racun  || ')'
        ELSE 'Perawatan: ' || pr.jenis
    END AS kategori,
    CASE WHEN pr.deskripsi != '' THEN pr.deskripsi
         ELSE 'Biaya perawatan: ' || pr.jenis
    END AS deskripsi,
    pr.biaya AS jumlah,
    'PERAWATAN'::TEXT AS sumber,
    pr.is_deleted
FROM perawatan pr
WHERE pr.biaya > 0

UNION ALL

-- Sumber 3: Biaya produksi dari panen (hanya yang biaya_produksi > 0)
SELECT
    pn.id,
    pn.user_id,
    pn.kebun_id,
    pn.tanggal,
    'Biaya Panen'::TEXT AS kategori,
    CASE WHEN pn.keterangan != '' THEN pn.keterangan
         ELSE 'Biaya produksi panen'
    END AS deskripsi,
    pn.biaya_produksi AS jumlah,
    'PANEN'::TEXT AS sumber,
    pn.is_deleted
FROM panen pn
WHERE pn.biaya_produksi > 0;

-- ============================================================
-- VIEW: v_dashboard_bulanan
-- Ringkasan panen per bulan per user per kebun.
-- Dipakai di dashboard Android (lewat API) dan web.
-- ============================================================
CREATE OR REPLACE VIEW v_dashboard_bulanan AS
SELECT
    p.user_id,
    p.kebun_id,
    DATE_TRUNC('month', p.tanggal)          AS bulan,
    SUM(p.pendapatan)                        AS total_pendapatan,
    SUM(p.berat_kg + p.berat_brondolan_kg)  AS total_berat_kg,
    SUM(p.biaya_produksi)                   AS total_biaya_panen,
    COUNT(*)                                 AS jumlah_panen
FROM panen p
WHERE p.is_deleted = FALSE
GROUP BY p.user_id, p.kebun_id, DATE_TRUNC('month', p.tanggal);

-- ============================================================
-- VIEW: v_pengeluaran_bulanan
-- Total semua pengeluaran (mandiri + perawatan + panen) per bulan.
-- ============================================================
CREATE OR REPLACE VIEW v_pengeluaran_bulanan AS
SELECT
    sp.user_id,
    sp.kebun_id,
    DATE_TRUNC('month', sp.tanggal) AS bulan,
    SUM(sp.jumlah)                   AS total_pengeluaran,
    COUNT(*)                         AS jumlah_transaksi,
    sp.sumber
FROM v_semua_pengeluaran sp
WHERE sp.is_deleted = FALSE
GROUP BY sp.user_id, sp.kebun_id, DATE_TRUNC('month', sp.tanggal), sp.sumber;

-- ============================================================
-- FUNCTION: fn_dashboard_ringkasan
-- Menghitung ringkasan dashboard untuk 1 user + filter kebun opsional.
-- Mengembalikan: pendapatan, berat, biaya, laba, per bulan dan tahun.
-- Web app memanggil fungsi ini via Supabase RPC.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_dashboard_ringkasan(
    p_user_id   UUID,
    p_kebun_id  UUID DEFAULT NULL     -- NULL = semua kebun
)
RETURNS TABLE (
    bulan_ini_pendapatan    NUMERIC,
    bulan_ini_berat_kg      NUMERIC,
    bulan_ini_total_biaya   NUMERIC,
    bulan_ini_laba          NUMERIC,
    bulan_ini_jml_panen     BIGINT,
    tahun_ini_pendapatan    NUMERIC,
    tahun_ini_berat_kg      NUMERIC,
    tahun_ini_total_biaya   NUMERIC,
    tahun_ini_laba          NUMERIC,
    tahun_ini_jml_panen     BIGINT
) AS $$
DECLARE
    v_now       TIMESTAMPTZ := NOW();
    v_bln_start TIMESTAMPTZ := DATE_TRUNC('month', v_now);
    v_thn_start TIMESTAMPTZ := DATE_TRUNC('year',  v_now);
BEGIN
    RETURN QUERY
    SELECT
        -- Bulan ini: pendapatan
        COALESCE(SUM(CASE WHEN p.tanggal >= v_bln_start THEN p.pendapatan ELSE 0 END), 0),
        -- Bulan ini: berat
        COALESCE(SUM(CASE WHEN p.tanggal >= v_bln_start THEN p.berat_kg + p.berat_brondolan_kg ELSE 0 END), 0),
        -- Bulan ini: biaya (semua sumber)
        COALESCE((
            SELECT SUM(sp.jumlah)
            FROM v_semua_pengeluaran sp
            WHERE sp.user_id   = p_user_id
              AND (p_kebun_id IS NULL OR sp.kebun_id = p_kebun_id)
              AND sp.is_deleted = FALSE
              AND sp.tanggal   >= v_bln_start
        ), 0),
        -- Bulan ini: laba (pendapatan - biaya)
        COALESCE(SUM(CASE WHEN p.tanggal >= v_bln_start THEN p.pendapatan ELSE 0 END), 0)
        - COALESCE((
            SELECT SUM(sp.jumlah)
            FROM v_semua_pengeluaran sp
            WHERE sp.user_id   = p_user_id
              AND (p_kebun_id IS NULL OR sp.kebun_id = p_kebun_id)
              AND sp.is_deleted = FALSE
              AND sp.tanggal   >= v_bln_start
        ), 0),
        -- Bulan ini: jumlah panen
        COUNT(CASE WHEN p.tanggal >= v_bln_start THEN 1 END),
        -- Tahun ini: pendapatan
        COALESCE(SUM(CASE WHEN p.tanggal >= v_thn_start THEN p.pendapatan ELSE 0 END), 0),
        -- Tahun ini: berat
        COALESCE(SUM(CASE WHEN p.tanggal >= v_thn_start THEN p.berat_kg + p.berat_brondolan_kg ELSE 0 END), 0),
        -- Tahun ini: biaya
        COALESCE((
            SELECT SUM(sp.jumlah)
            FROM v_semua_pengeluaran sp
            WHERE sp.user_id   = p_user_id
              AND (p_kebun_id IS NULL OR sp.kebun_id = p_kebun_id)
              AND sp.is_deleted = FALSE
              AND sp.tanggal   >= v_thn_start
        ), 0),
        -- Tahun ini: laba
        COALESCE(SUM(CASE WHEN p.tanggal >= v_thn_start THEN p.pendapatan ELSE 0 END), 0)
        - COALESCE((
            SELECT SUM(sp.jumlah)
            FROM v_semua_pengeluaran sp
            WHERE sp.user_id   = p_user_id
              AND (p_kebun_id IS NULL OR sp.kebun_id = p_kebun_id)
              AND sp.is_deleted = FALSE
              AND sp.tanggal   >= v_thn_start
        ), 0),
        -- Tahun ini: jumlah panen
        COUNT(CASE WHEN p.tanggal >= v_thn_start THEN 1 END)
    FROM panen p
    WHERE p.user_id   = p_user_id
      AND (p_kebun_id IS NULL OR p.kebun_id = p_kebun_id)
      AND p.is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- FUNCTION: fn_pendapatan_6_bulan
-- Pendapatan per bulan untuk 6 bulan terakhir (grafik bar chart).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_pendapatan_6_bulan(
    p_user_id  UUID,
    p_kebun_id UUID DEFAULT NULL
)
RETURNS TABLE (
    bulan           TIMESTAMPTZ,
    total_pendapatan NUMERIC,
    jumlah_panen    BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE_TRUNC('month', gs.month_start)   AS bulan,
        COALESCE(SUM(p.pendapatan), 0)         AS total_pendapatan,
        COUNT(p.id)                            AS jumlah_panen
    FROM
        generate_series(
            DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
            DATE_TRUNC('month', NOW()),
            INTERVAL '1 month'
        ) AS gs(month_start)
    LEFT JOIN panen p
        ON DATE_TRUNC('month', p.tanggal) = gs.month_start
       AND p.user_id   = p_user_id
       AND (p_kebun_id IS NULL OR p.kebun_id = p_kebun_id)
       AND p.is_deleted = FALSE
    GROUP BY gs.month_start
    ORDER BY gs.month_start ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- FUNCTION: fn_distribusi_biaya_tahunan
-- Distribusi biaya per kategori untuk 1 tahun (donut chart laporan).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_distribusi_biaya_tahunan(
    p_user_id  UUID,
    p_kebun_id UUID DEFAULT NULL,
    p_tahun    INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER
)
RETURNS TABLE (
    kategori     TEXT,
    total_jumlah NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sp.kategori,
        SUM(sp.jumlah) AS total_jumlah
    FROM v_semua_pengeluaran sp
    WHERE sp.user_id   = p_user_id
      AND (p_kebun_id IS NULL OR sp.kebun_id = p_kebun_id)
      AND sp.is_deleted = FALSE
      AND EXTRACT(YEAR FROM sp.tanggal) = p_tahun
    GROUP BY sp.kategori
    ORDER BY total_jumlah DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- FUNCTION: fn_jadwal_rotasi_panen
-- Estimasi jadwal panen berikutnya berdasarkan rotasi kebun.
-- Dipakai oleh web dashboard (Android menghitungnya sendiri dari Room).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_jadwal_rotasi_panen(p_user_id UUID)
RETURNS TABLE (
    kebun_id                UUID,
    kebun_nama              TEXT,
    rotasi_panen_hari       INTEGER,
    tanggal_panen_terakhir  TIMESTAMPTZ,
    estimasi_panen_berikutnya TIMESTAMPTZ,
    hari_tersisa            INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        k.id                                                     AS kebun_id,
        k.nama                                                   AS kebun_nama,
        k.rotasi_panen_hari,
        k.tanggal_panen_terakhir,
        k.tanggal_panen_terakhir + (k.rotasi_panen_hari || ' days')::INTERVAL
                                                                 AS estimasi_panen_berikutnya,
        (
            EXTRACT(DAY FROM (
                k.tanggal_panen_terakhir
                + (k.rotasi_panen_hari || ' days')::INTERVAL
                - NOW()
            ))
        )::INTEGER                                               AS hari_tersisa
    FROM kebun k
    WHERE k.user_id        = p_user_id
      AND k.is_deleted     = FALSE
      AND k.tanggal_panen_terakhir IS NOT NULL
      AND k.rotasi_panen_hari > 0
    ORDER BY estimasi_panen_berikutnya ASC;
END;
$$ LANGUAGE plpgsql STABLE;
