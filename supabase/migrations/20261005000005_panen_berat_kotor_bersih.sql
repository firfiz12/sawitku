-- =============================================================================
-- MIGRATION 005: Tambah kolom berat kotor & berat bersih pada tabel panen
--
-- Latar belakang:
--   Sebelumnya hanya ada `berat_kg` (berat TBS). Kini berat panen dirinci
--   menjadi berat kotor (timbangan) dan berat bersih (setelah potongan).
--   Kolom `berat_kg` tetap dipertahankan dan diisi = berat_bersih_kg agar
--   VIEW/FUNCTION lama (v_dashboard_bulanan, fn_dashboard_ringkasan) tetap valid.
--
-- Catatan: kolom brondol (berat_brondolan_kg, harga_brondolan_per_kg,
--   pendapatan_brondolan) dan biaya_produksi sudah ada sejak migration 001.
-- =============================================================================

ALTER TABLE panen
    ADD COLUMN IF NOT EXISTS berat_kotor_kg  NUMERIC(12, 3) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS berat_bersih_kg NUMERIC(12, 3) NOT NULL DEFAULT 0;

-- Backfill data lama: berat_bersih_kg mengikuti berat_kg bila belum terisi.
UPDATE panen
SET berat_bersih_kg = berat_kg
WHERE berat_bersih_kg = 0
  AND berat_kg <> 0;

COMMENT ON COLUMN panen.berat_kotor_kg  IS 'Berat TBS kotor (timbangan awal), opsional';
COMMENT ON COLUMN panen.berat_bersih_kg IS 'Berat TBS bersih (setelah potongan); sumber utama pendapatan TBS';
