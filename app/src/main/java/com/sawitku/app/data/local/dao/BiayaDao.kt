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
    @Query("SELECT * FROM biaya ORDER BY tanggal DESC")
    fun getAll(): Flow<List<BiayaEntity>>

    @Query("SELECT * FROM biaya ORDER BY tanggal DESC")
    suspend fun getAllOnce(): List<BiayaEntity>

    @Query("SELECT * FROM biaya WHERE sourceType = :sourceType AND sourceId = :sourceId LIMIT 1")
    suspend fun getBySource(sourceType: String, sourceId: Long): BiayaEntity?

    @Query("DELETE FROM biaya WHERE sourceType = :sourceType AND sourceId = :sourceId")
    suspend fun deleteBySource(sourceType: String, sourceId: Long)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(biaya: BiayaEntity): Long

    @Update
    suspend fun update(biaya: BiayaEntity)

    @Delete
    suspend fun delete(biaya: BiayaEntity)
}
