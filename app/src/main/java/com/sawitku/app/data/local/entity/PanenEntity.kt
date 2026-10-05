package com.sawitku.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "panen")
data class PanenEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val tanggal: Long = 0L,
    val kebunId: Long = 0L,
    val beratKg: Double = 0.0, // Berat TBS
    val hargaPerKg: Double = 0.0, // Harga TBS per kg
    val beratBrondolanKg: Double = 0.0, // Opsional berat brondolan
    val hargaBrondolanPerKg: Double = 0.0, // Opsional harga brondolan per kg
    val pendapatanBrondolan: Double = 0.0, // Opsional total pendapatan brondolan
    val pendapatan: Double = 0.0, // Total gabungan TBS + Brondolan
    val biayaProduksi: Double = 0.0,
    val keterangan: String = "",
    val reminderEnabled: Boolean = false,
    val reminderTanggal: Long = 0L
)
