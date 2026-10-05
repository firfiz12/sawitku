-- =============================================================================
-- MIGRATION 002: Triggers updated_at otomatis
-- Setiap kali baris diupdate, kolom updated_at di-set ke NOW() secara otomatis.
-- Trigger ini penting untuk logika sinkronisasi delta (PULL):
--   Android menyimpan lastSyncTime dan hanya mengambil baris dengan updated_at > lastSyncTime.
-- =============================================================================

-- Fungsi trigger generik (dipakai oleh semua tabel)
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk tabel kebun
CREATE TRIGGER trg_kebun_updated_at
    BEFORE UPDATE ON kebun
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

-- Trigger untuk tabel panen
CREATE TRIGGER trg_panen_updated_at
    BEFORE UPDATE ON panen
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

-- Trigger untuk tabel perawatan
CREATE TRIGGER trg_perawatan_updated_at
    BEFORE UPDATE ON perawatan
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

-- Trigger untuk tabel pengeluaran_lain
CREATE TRIGGER trg_pengeluaran_lain_updated_at
    BEFORE UPDATE ON pengeluaran_lain
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- Trigger: Update tanggal_panen_terakhir di kebun secara otomatis
-- Setiap kali baris panen diinsert/update/soft-delete, field ini diperbarui
-- agar konsisten antara server dan Android.
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_sync_tanggal_panen_terakhir()
RETURNS TRIGGER AS $$
BEGIN
    -- Hitung ulang tanggal_panen_terakhir dari panen aktif untuk kebun yang bersangkutan
    UPDATE kebun
    SET tanggal_panen_terakhir = (
        SELECT MAX(tanggal)
        FROM panen
        WHERE kebun_id = COALESCE(NEW.kebun_id, OLD.kebun_id)
          AND is_deleted = FALSE
    )
    WHERE id = COALESCE(NEW.kebun_id, OLD.kebun_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_panen_sync_kebun
    AFTER INSERT OR UPDATE OR DELETE ON panen
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_tanggal_panen_terakhir();
