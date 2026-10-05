package com.sawitku.app.data.repository

import com.sawitku.app.data.local.SawitDatabase
import com.sawitku.app.data.local.entity.BiayaEntity
import com.sawitku.app.data.local.entity.KebunEntity
import com.sawitku.app.data.local.entity.PanenEntity
import com.sawitku.app.data.local.entity.PerawatanEntity
import kotlinx.coroutines.flow.Flow

class SawitRepository(private val db: SawitDatabase) {

    // Kebun
    fun getAllKebun(): Flow<List<KebunEntity>> = db.kebunDao().getAll()
    suspend fun getKebunById(id: Long): KebunEntity? = db.kebunDao().getById(id)
    suspend fun insertKebun(kebun: KebunEntity): Long = db.kebunDao().insert(kebun)
    suspend fun updateKebun(kebun: KebunEntity) = db.kebunDao().update(kebun)
    suspend fun deleteKebun(kebun: KebunEntity) = db.kebunDao().delete(kebun)

    // Perawatan
    fun getAllPerawatan(): Flow<List<PerawatanEntity>> = db.perawatanDao().getAll()
    suspend fun getAllPerawatanOnce(): List<PerawatanEntity> = db.perawatanDao().getAllOnce()
    fun getPerawatanByKebun(kebunId: Long): Flow<List<PerawatanEntity>> = db.perawatanDao().getByKebun(kebunId)
    suspend fun insertPerawatan(perawatan: PerawatanEntity): Long = db.perawatanDao().insert(perawatan)
    suspend fun updatePerawatan(perawatan: PerawatanEntity) = db.perawatanDao().update(perawatan)
    suspend fun deletePerawatan(perawatan: PerawatanEntity) = db.perawatanDao().delete(perawatan)

    // Panen
    fun getAllPanen(): Flow<List<PanenEntity>> = db.panenDao().getAll()
    suspend fun getAllPanenOnce(): List<PanenEntity> = db.panenDao().getAllOnce()
    fun getPanenByKebun(kebunId: Long): Flow<List<PanenEntity>> = db.panenDao().getByKebun(kebunId)
    suspend fun insertPanen(panen: PanenEntity): Long = db.panenDao().insert(panen)
    suspend fun updatePanen(panen: PanenEntity) = db.panenDao().update(panen)
    suspend fun deletePanen(panen: PanenEntity) = db.panenDao().delete(panen)

    // Biaya
    fun getAllBiaya(): Flow<List<BiayaEntity>> = db.biayaDao().getAll()
    suspend fun getAllBiayaOnce(): List<BiayaEntity> = db.biayaDao().getAllOnce()
    suspend fun getBiayaBySource(sourceType: String, sourceId: Long): BiayaEntity? = db.biayaDao().getBySource(sourceType, sourceId)
    suspend fun deleteBiayaBySource(sourceType: String, sourceId: Long) = db.biayaDao().deleteBySource(sourceType, sourceId)
    suspend fun insertBiaya(biaya: BiayaEntity): Long = db.biayaDao().insert(biaya)
    suspend fun updateBiaya(biaya: BiayaEntity) = db.biayaDao().update(biaya)
    suspend fun deleteBiaya(biaya: BiayaEntity) = db.biayaDao().delete(biaya)
}
