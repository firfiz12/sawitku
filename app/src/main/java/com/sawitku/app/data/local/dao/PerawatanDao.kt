package com.sawitku.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.sawitku.app.data.local.entity.PerawatanEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PerawatanDao {
    @Query("SELECT * FROM perawatan WHERE isDeleted = 0 ORDER BY tanggal DESC")
    fun getAll(): Flow<List<PerawatanEntity>>

    @Query("SELECT * FROM perawatan WHERE isDeleted = 0 ORDER BY tanggal DESC")
    suspend fun getAllOnce(): List<PerawatanEntity>

    @Query("SELECT * FROM perawatan WHERE kebunId = :kebunId AND isDeleted = 0 ORDER BY tanggal DESC")
    fun getByKebun(kebunId: String): Flow<List<PerawatanEntity>>

    @Query("SELECT * FROM perawatan WHERE id = :id AND isDeleted = 0")
    suspend fun getById(id: String): PerawatanEntity?

    @Query("SELECT * FROM perawatan WHERE id = :id")
    suspend fun getByIdIncludingDeleted(id: String): PerawatanEntity?

    @Query("SELECT * FROM perawatan WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSync(): List<PerawatanEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(perawatan: PerawatanEntity)

    @Update
    suspend fun update(perawatan: PerawatanEntity)

    @Query("UPDATE perawatan SET isDeleted = 1, syncStatus = 'PENDING', updatedAt = :updatedAt WHERE id = :id")
    suspend fun softDelete(id: String, updatedAt: Long = System.currentTimeMillis())

    @Delete
    suspend fun hardDelete(perawatan: PerawatanEntity)
}
