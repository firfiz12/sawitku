package com.sawitku.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "perawatan")
data class PerawatanEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val tanggal: Long = 0L,
    val kebunId: Long = 0L,
    val jenis: String = "",
    val jenisPupuk: String = "",
    val jenisRacun: String = "",
    val deskripsi: String = "",
    val biaya: Double = 0.0,
    val reminderEnabled: Boolean = false,
    val reminderTanggal: Long = 0L
)
