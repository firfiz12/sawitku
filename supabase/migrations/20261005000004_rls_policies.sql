-- =============================================================================
-- MIGRATION 004: Row Level Security (RLS)
--
-- Aturan: setiap pengguna HANYA bisa membaca dan menulis data miliknya sendiri.
-- user_id di setiap baris harus sama dengan auth.uid() (ID user yang login).
--
-- PENTING: Setelah menjalankan migration ini, pastikan Anda TIDAK menggunakan
-- service_role key di aplikasi klien (Android/Web). Gunakan HANYA anon/public key.
-- =============================================================================

-- ========================
-- Aktifkan RLS di semua tabel
-- ========================
ALTER TABLE kebun            ENABLE ROW LEVEL SECURITY;
ALTER TABLE panen            ENABLE ROW LEVEL SECURITY;
ALTER TABLE perawatan        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengeluaran_lain ENABLE ROW LEVEL SECURITY;

-- ========================
-- KEBUN: RLS Policies
-- ========================

-- SELECT: user hanya bisa lihat kebun miliknya
CREATE POLICY "kebun_select_own" ON kebun
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: user hanya bisa insert kebun dengan user_id = dirinya sendiri
CREATE POLICY "kebun_insert_own" ON kebun
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: user hanya bisa update kebun miliknya
CREATE POLICY "kebun_update_own" ON kebun
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: user hanya bisa delete kebun miliknya
-- (soft delete dilakukan via UPDATE is_deleted=true, ini backup jika perlu hard delete)
CREATE POLICY "kebun_delete_own" ON kebun
    FOR DELETE
    USING (auth.uid() = user_id);

-- ========================
-- PANEN: RLS Policies
-- ========================
CREATE POLICY "panen_select_own" ON panen
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "panen_insert_own" ON panen
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "panen_update_own" ON panen
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "panen_delete_own" ON panen
    FOR DELETE USING (auth.uid() = user_id);

-- ========================
-- PERAWATAN: RLS Policies
-- ========================
CREATE POLICY "perawatan_select_own" ON perawatan
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "perawatan_insert_own" ON perawatan
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "perawatan_update_own" ON perawatan
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "perawatan_delete_own" ON perawatan
    FOR DELETE USING (auth.uid() = user_id);

-- ========================
-- PENGELUARAN_LAIN: RLS Policies
-- ========================
CREATE POLICY "pengeluaran_lain_select_own" ON pengeluaran_lain
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "pengeluaran_lain_insert_own" ON pengeluaran_lain
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pengeluaran_lain_update_own" ON pengeluaran_lain
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pengeluaran_lain_delete_own" ON pengeluaran_lain
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- Verifikasi setup Auth
-- Supabase secara default sudah mengaktifkan email+password auth.
-- Tidak perlu SQL khusus — cukup aktifkan di dashboard Supabase:
--   Authentication > Providers > Email > Enable
--
-- Pengaturan yang DISARANKAN untuk produksi:
--   - Confirm email: aktifkan (agar tidak ada akun spam)
--   - Minimum password length: 8
--   - Double confirm email change: aktifkan
-- =============================================================================

-- Grant akses execute ke functions untuk authenticated users
GRANT EXECUTE ON FUNCTION fn_dashboard_ringkasan(UUID, UUID)    TO authenticated;
GRANT EXECUTE ON FUNCTION fn_pendapatan_6_bulan(UUID, UUID)     TO authenticated;
GRANT EXECUTE ON FUNCTION fn_distribusi_biaya_tahunan(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_jadwal_rotasi_panen(UUID)          TO authenticated;
