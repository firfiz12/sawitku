package com.sawitku.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(tableName = "perawatan")
data class PerawatanEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val tanggal: Long = 0L,
    val kebunId: String = "",
    val jenis: String = "",
    val jenisPupuk: String = "",
    val jenisRacun: String = "",
    val deskripsi: String = "",
    val biaya: Double = 0.0,
    val reminderEnabled: Boolean = false,
    val reminderTanggal: Long = 0L,
    val updatedAt: Long = System.currentTimeMillis(),
    val syncStatus: String = SyncStatus.PENDING,
    val isDeleted: Boolean = false
)
