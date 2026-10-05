package com.sawitku.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "biaya")
data class BiayaEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val tanggal: Long = 0L,
    val kebunId: Long? = null,
    val kategori: String = "",
    val deskripsi: String = "",
    val jumlah: Double = 0.0,
    val sourceType: String = "", // "PERAWATAN", "PANEN", "MANDIRI"
    val sourceId: Long = 0L
)
