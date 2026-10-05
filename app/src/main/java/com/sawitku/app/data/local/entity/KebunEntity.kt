package com.sawitku.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "kebun")
data class KebunEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val nama: String = "",
    val luasHa: Double = 0.0,
    val jumlahPohon: Int = 0,
    val keterangan: String = "",
    val rotasiPanenHari: Int = 14,
    val tanggalPanenTerakhir: Long = 0L
)
