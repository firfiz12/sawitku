package com.sawitku.app.data.remote

import android.util.Log
import com.sawitku.app.data.local.entity.BiayaEntity
import com.sawitku.app.data.local.entity.KebunEntity
import com.sawitku.app.data.local.entity.PanenEntity
import com.sawitku.app.data.local.entity.PerawatanEntity
import com.sawitku.app.data.local.entity.SyncStatus
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.filter.FilterOperation
import io.github.jan.supabase.postgrest.query.filter.FilterOperator
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

private const val TAG = "SupabaseDataSource"

/**
 * Helper konversi timestamp Long (millis) <-> ISO-8601 string (Supabase).
 */
private val ISO_FORMAT = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
    timeZone = TimeZone.getTimeZone("UTC")
}

private fun Long.toIso(): String = ISO_FORMAT.format(Date(this))
private fun Long?.toIsoOrNull(): String? = if (this == null || this == 0L) null else this.toIso()
private fun String?.toMillis(): Long = if (this.isNullOrBlank()) 0L else try {
    ISO_FORMAT.parse(this)?.time ?: 0L
} catch (e: Exception) { 0L }

/**
 * Remote data source: semua operasi push/pull ke Supabase PostgREST.
 */
class SupabaseDataSource {

    private val client = SupabaseClientProvider.client

    // =============================
    // Auth helpers
    // =============================

    fun currentUserId(): String? = client.auth.currentUserOrNull()?.id

    // =============================
    // PUSH (Upload ke Supabase)
    // =============================

    /**
     * Upsert kebun ke tabel "kebun" Supabase.
     * Memanfaatkan upsert agar idempotent (insert atau update sesuai id).
     */
    suspend fun upsertKebun(entity: KebunEntity, userId: String): Boolean {
        return try {
            val dto = KebunDto(
                id = entity.id,
                userId = userId,
                nama = entity.nama,
                luasHa = entity.luasHa,
                jumlahPohon = entity.jumlahPohon,
                keterangan = entity.keterangan,
                rotasiPanenHari = entity.rotasiPanenHari,
                tanggalPanenTerakhir = entity.tanggalPanenTerakhir.toIsoOrNull(),
                isDeleted = entity.isDeleted,
                updatedAt = entity.updatedAt.toIso()
            )
            client.postgrest["kebun"].upsert(dto)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Gagal upsert kebun ${entity.id}", e)
            false
        }
    }

    suspend fun upsertPanen(entity: PanenEntity, userId: String): Boolean {
        return try {
            val dto = PanenDto(
                id = entity.id,
                userId = userId,
                kebunId = entity.kebunId,
                tanggal = entity.tanggal.toIso(),
                beratKg = entity.beratKg,
                hargaPerKg = entity.hargaPerKg,
                beratBrondolanKg = entity.beratBrondolanKg,
                hargaBrondolanPerKg = entity.hargaBrondolanPerKg,
                pendapatanBrondolan = entity.pendapatanBrondolan,
                pendapatan = entity.pendapatan,
                biayaProduksi = entity.biayaProduksi,
                keterangan = entity.keterangan,
                reminderEnabled = entity.reminderEnabled,
                reminderTanggal = entity.reminderTanggal.toIsoOrNull(),
                isDeleted = entity.isDeleted,
                updatedAt = entity.updatedAt.toIso()
            )
            client.postgrest["panen"].upsert(dto)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Gagal upsert panen ${entity.id}", e)
            false
        }
    }

    suspend fun upsertPerawatan(entity: PerawatanEntity, userId: String): Boolean {
        return try {
            val dto = PerawatanDto(
                id = entity.id,
                userId = userId,
                kebunId = entity.kebunId,
                tanggal = entity.tanggal.toIso(),
                jenis = entity.jenis,
                jenisPupuk = entity.jenisPupuk,
                jenisRacun = entity.jenisRacun,
                deskripsi = entity.deskripsi,
                biaya = entity.biaya,
                reminderEnabled = entity.reminderEnabled,
                reminderTanggal = entity.reminderTanggal.toIsoOrNull(),
                isDeleted = entity.isDeleted,
                updatedAt = entity.updatedAt.toIso()
            )
            client.postgrest["perawatan"].upsert(dto)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Gagal upsert perawatan ${entity.id}", e)
            false
        }
    }

    /**
     * Upsert BiayaEntity ke tabel "pengeluaran_lain" Supabase.
     * Hanya entri dengan sourceType == "MANDIRI" yang disimpan sebagai baris independen di Supabase.
     * Entri PERAWATAN/PANEN dihitung via VIEW Supabase dan tidak di-upsert.
     */
    suspend fun upsertPengeluaranLain(entity: BiayaEntity, userId: String): Boolean {
        if (entity.sourceType != "MANDIRI") return true // skip, dihitung via VIEW
        return try {
            val dto = PengeluaranLainDto(
                id = entity.id,
                userId = userId,
                kebunId = entity.kebunId,
                tanggal = entity.tanggal.toIso(),
                kategori = entity.kategori,
                deskripsi = entity.deskripsi,
                jumlah = entity.jumlah,
                isDeleted = entity.isDeleted,
                updatedAt = entity.updatedAt.toIso()
            )
            client.postgrest["pengeluaran_lain"].upsert(dto)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Gagal upsert pengeluaran_lain ${entity.id}", e)
            false
        }
    }

    // =============================
    // PULL (Download dari Supabase)
    // =============================

    /**
     * Ambil semua kebun user dari Supabase yang updated_at > lastSyncEpoch.
     * Ini adalah delta-sync: hanya data yang berubah sejak sinkronisasi terakhir.
     */
    suspend fun fetchKebunSince(userId: String, lastSyncEpoch: Long): List<KebunEntity> {
        return try {
            val since = lastSyncEpoch.toIso()
            val dtos = client.postgrest["kebun"]
                .select(columns = Columns.ALL) {
                    filter {
                        eq("user_id", userId)
                        gt("updated_at", since)
                    }
                }.decodeList<KebunDto>()

            dtos.map { dto ->
                KebunEntity(
                    id = dto.id,
                    nama = dto.nama,
                    luasHa = dto.luasHa,
                    jumlahPohon = dto.jumlahPohon,
                    keterangan = dto.keterangan,
                    rotasiPanenHari = dto.rotasiPanenHari,
                    tanggalPanenTerakhir = dto.tanggalPanenTerakhir.toMillis(),
                    updatedAt = dto.updatedAt.toMillis(),
                    syncStatus = SyncStatus.SYNCED,
                    isDeleted = dto.isDeleted
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Gagal fetch kebun", e)
            emptyList()
        }
    }

    suspend fun fetchPanenSince(userId: String, lastSyncEpoch: Long): List<PanenEntity> {
        return try {
            val since = lastSyncEpoch.toIso()
            val dtos = client.postgrest["panen"]
                .select(columns = Columns.ALL) {
                    filter {
                        eq("user_id", userId)
                        gt("updated_at", since)
                    }
                }.decodeList<PanenDto>()

            dtos.map { dto ->
                PanenEntity(
                    id = dto.id,
                    tanggal = dto.tanggal.toMillis(),
                    kebunId = dto.kebunId,
                    beratKg = dto.beratKg,
                    hargaPerKg = dto.hargaPerKg,
                    beratBrondolanKg = dto.beratBrondolanKg,
                    hargaBrondolanPerKg = dto.hargaBrondolanPerKg,
                    pendapatanBrondolan = dto.pendapatanBrondolan,
                    pendapatan = dto.pendapatan,
                    biayaProduksi = dto.biayaProduksi,
                    keterangan = dto.keterangan,
                    reminderEnabled = dto.reminderEnabled,
                    reminderTanggal = dto.reminderTanggal.toMillis(),
                    updatedAt = dto.updatedAt.toMillis(),
                    syncStatus = SyncStatus.SYNCED,
                    isDeleted = dto.isDeleted
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Gagal fetch panen", e)
            emptyList()
        }
    }

    suspend fun fetchPerawatanSince(userId: String, lastSyncEpoch: Long): List<PerawatanEntity> {
        return try {
            val since = lastSyncEpoch.toIso()
            val dtos = client.postgrest["perawatan"]
                .select(columns = Columns.ALL) {
                    filter {
                        eq("user_id", userId)
                        gt("updated_at", since)
                    }
                }.decodeList<PerawatanDto>()

            dtos.map { dto ->
                PerawatanEntity(
                    id = dto.id,
                    tanggal = dto.tanggal.toMillis(),
                    kebunId = dto.kebunId,
                    jenis = dto.jenis,
                    jenisPupuk = dto.jenisPupuk,
                    jenisRacun = dto.jenisRacun,
                    deskripsi = dto.deskripsi,
                    biaya = dto.biaya,
                    reminderEnabled = dto.reminderEnabled,
                    reminderTanggal = dto.reminderTanggal.toMillis(),
                    updatedAt = dto.updatedAt.toMillis(),
                    syncStatus = SyncStatus.SYNCED,
                    isDeleted = dto.isDeleted
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Gagal fetch perawatan", e)
            emptyList()
        }
    }

    suspend fun fetchPengeluaranLainSince(userId: String, lastSyncEpoch: Long): List<BiayaEntity> {
        return try {
            val since = lastSyncEpoch.toIso()
            val dtos = client.postgrest["pengeluaran_lain"]
                .select(columns = Columns.ALL) {
                    filter {
                        eq("user_id", userId)
                        gt("updated_at", since)
                    }
                }.decodeList<PengeluaranLainDto>()

            dtos.map { dto ->
                BiayaEntity(
                    id = dto.id,
                    tanggal = dto.tanggal.toMillis(),
                    kebunId = dto.kebunId,
                    kategori = dto.kategori,
                    deskripsi = dto.deskripsi,
                    jumlah = dto.jumlah,
                    sourceType = "MANDIRI",
                    sourceId = "",
                    updatedAt = dto.updatedAt.toMillis(),
                    syncStatus = SyncStatus.SYNCED,
                    isDeleted = dto.isDeleted
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Gagal fetch pengeluaran_lain", e)
            emptyList()
        }
    }
}
