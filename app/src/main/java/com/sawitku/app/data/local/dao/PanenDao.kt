package com.sawitku.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.sawitku.app.data.local.entity.PanenEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PanenDao {
    @Query("SELECT * FROM panen WHERE isDeleted = 0 ORDER BY tanggal DESC")
    fun getAll(): Flow<List<PanenEntity>>

    @Query("SELECT * FROM panen WHERE isDeleted = 0 ORDER BY tanggal DESC")
    suspend fun getAllOnce(): List<PanenEntity>

    @Query("SELECT * FROM panen WHERE kebunId = :kebunId AND isDeleted = 0 ORDER BY tanggal DESC")
    fun getByKebun(kebunId: String): Flow<List<PanenEntity>>

    @Query("SELECT * FROM panen WHERE id = :id AND isDeleted = 0")
    suspend fun getById(id: String): PanenEntity?

    @Query("SELECT * FROM panen WHERE id = :id")
    suspend fun getByIdIncludingDeleted(id: String): PanenEntity?

    @Query("SELECT * FROM panen WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSync(): List<PanenEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(panen: PanenEntity)

    @Update
    suspend fun update(panen: PanenEntity)

    @Query("UPDATE panen SET isDeleted = 1, syncStatus = 'PENDING', updatedAt = :updatedAt WHERE id = :id")
    suspend fun softDelete(id: String, updatedAt: Long = System.currentTimeMillis())

    @Delete
    suspend fun hardDelete(panen: PanenEntity)
}
