package com.sawitku.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(tableName = "biaya")
data class BiayaEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val tanggal: Long = 0L,
    val kebunId: String? = null,
    val kategori: String = "",
    val deskripsi: String = "",
    val jumlah: Double = 0.0,
    val sourceType: String = "", // "PERAWATAN", "PANEN", "MANDIRI"
    val sourceId: String = "",   // UUID of referenced perawatan/panen, or "" for MANDIRI
    val updatedAt: Long = System.currentTimeMillis(),
    val syncStatus: String = SyncStatus.PENDING,
    val isDeleted: Boolean = false
)
