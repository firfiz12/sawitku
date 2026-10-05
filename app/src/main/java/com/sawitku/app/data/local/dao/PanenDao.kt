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
    @Query("SELECT * FROM panen ORDER BY tanggal DESC")
    fun getAll(): Flow<List<PanenEntity>>

    @Query("SELECT * FROM panen ORDER BY tanggal DESC")
    suspend fun getAllOnce(): List<PanenEntity>

    @Query("SELECT * FROM panen WHERE kebunId = :kebunId ORDER BY tanggal DESC")
    fun getByKebun(kebunId: Long): Flow<List<PanenEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(panen: PanenEntity): Long

    @Update
    suspend fun update(panen: PanenEntity)

    @Delete
    suspend fun delete(panen: PanenEntity)
}
