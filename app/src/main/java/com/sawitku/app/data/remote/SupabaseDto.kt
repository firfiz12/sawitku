package com.sawitku.app.data.remote

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * DTO (Data Transfer Object) untuk komunikasi dengan Supabase.
 * Nama field menggunakan snake_case sesuai skema PostgreSQL.
 */

@Serializable
data class KebunDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    val nama: String,
    @SerialName("luas_ha") val luasHa: Double,
    @SerialName("jumlah_pohon") val jumlahPohon: Int,
    val keterangan: String,
    @SerialName("rotasi_panen_hari") val rotasiPanenHari: Int,
    @SerialName("tanggal_panen_terakhir") val tanggalPanenTerakhir: String?,
    @SerialName("is_deleted") val isDeleted: Boolean,
    @SerialName("updated_at") val updatedAt: String
)

@Serializable
data class PanenDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("kebun_id") val kebunId: String,
    val tanggal: String,
    @SerialName("berat_kg") val beratKg: Double,
    @SerialName("harga_per_kg") val hargaPerKg: Double,
    @SerialName("berat_brondolan_kg") val beratBrondolanKg: Double,
    @SerialName("harga_brondolan_per_kg") val hargaBrondolanPerKg: Double,
    @SerialName("pendapatan_brondolan") val pendapatanBrondolan: Double,
    val pendapatan: Double,
    @SerialName("biaya_produksi") val biayaProduksi: Double,
    val keterangan: String,
    @SerialName("reminder_enabled") val reminderEnabled: Boolean,
    @SerialName("reminder_tanggal") val reminderTanggal: String?,
    @SerialName("is_deleted") val isDeleted: Boolean,
    @SerialName("updated_at") val updatedAt: String
)

@Serializable
data class PerawatanDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("kebun_id") val kebunId: String,
    val tanggal: String,
    val jenis: String,
    @SerialName("jenis_pupuk") val jenisPupuk: String,
    @SerialName("jenis_racun") val jenisRacun: String,
    val deskripsi: String,
    val biaya: Double,
    @SerialName("reminder_enabled") val reminderEnabled: Boolean,
    @SerialName("reminder_tanggal") val reminderTanggal: String?,
    @SerialName("is_deleted") val isDeleted: Boolean,
    @SerialName("updated_at") val updatedAt: String
)

@Serializable
data class PengeluaranLainDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("kebun_id") val kebunId: String?,
    val tanggal: String,
    val kategori: String,
    val deskripsi: String,
    val jumlah: Double,
    @SerialName("is_deleted") val isDeleted: Boolean,
    @SerialName("updated_at") val updatedAt: String
)
