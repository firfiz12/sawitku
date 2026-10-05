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
    @Query("SELECT * FROM perawatan ORDER BY tanggal DESC")
    fun getAll(): Flow<List<PerawatanEntity>>

    @Query("SELECT * FROM perawatan ORDER BY tanggal DESC")
    suspend fun getAllOnce(): List<PerawatanEntity>

    @Query("SELECT * FROM perawatan WHERE kebunId = :kebunId ORDER BY tanggal DESC")
    fun getByKebun(kebunId: Long): Flow<List<PerawatanEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(perawatan: PerawatanEntity): Long

    @Update
    suspend fun update(perawatan: PerawatanEntity)

    @Delete
    suspend fun delete(perawatan: PerawatanEntity)
}
