package com.sawitku.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(tableName = "kebun")
data class KebunEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val nama: String = "",
    val luasHa: Double = 0.0,
    val jumlahPohon: Int = 0,
    val keterangan: String = "",
    val rotasiPanenHari: Int = 14,
    val tanggalPanenTerakhir: Long = 0L,
    val updatedAt: Long = System.currentTimeMillis(),
    val syncStatus: String = SyncStatus.PENDING,
    val isDeleted: Boolean = false
)
