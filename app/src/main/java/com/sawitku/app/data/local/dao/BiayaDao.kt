package com.sawitku.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.sawitku.app.data.local.entity.BiayaEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BiayaDao {
    @Query("SELECT * FROM biaya WHERE isDeleted = 0 ORDER BY tanggal DESC")
    fun getAll(): Flow<List<BiayaEntity>>

    @Query("SELECT * FROM biaya WHERE isDeleted = 0 ORDER BY tanggal DESC")
    suspend fun getAllOnce(): List<BiayaEntity>

    @Query("SELECT * FROM biaya WHERE sourceType = :sourceType AND sourceId = :sourceId AND isDeleted = 0 LIMIT 1")
    suspend fun getBySource(sourceType: String, sourceId: String): BiayaEntity?

    @Query("SELECT * FROM biaya WHERE id = :id AND isDeleted = 0")
    suspend fun getById(id: String): BiayaEntity?

    @Query("SELECT * FROM biaya WHERE id = :id")
    suspend fun getByIdIncludingDeleted(id: String): BiayaEntity?

    @Query("UPDATE biaya SET isDeleted = 1, syncStatus = 'PENDING', updatedAt = :updatedAt WHERE sourceType = :sourceType AND sourceId = :sourceId AND isDeleted = 0")
    suspend fun softDeleteBySource(sourceType: String, sourceId: String, updatedAt: Long = System.currentTimeMillis())

    @Query("SELECT * FROM biaya WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSync(): List<BiayaEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(biaya: BiayaEntity)

    @Update
    suspend fun update(biaya: BiayaEntity)

    @Query("UPDATE biaya SET isDeleted = 1, syncStatus = 'PENDING', updatedAt = :updatedAt WHERE id = :id")
    suspend fun softDelete(id: String, updatedAt: Long = System.currentTimeMillis())

    @Delete
    suspend fun hardDelete(biaya: BiayaEntity)
}
