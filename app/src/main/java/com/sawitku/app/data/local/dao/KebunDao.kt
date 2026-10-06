package com.sawitku.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.sawitku.app.data.local.entity.KebunEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface KebunDao {
    @Query("SELECT * FROM kebun WHERE isDeleted = 0 ORDER BY nama ASC")
    fun getAll(): Flow<List<KebunEntity>>

    @Query("SELECT * FROM kebun WHERE isDeleted = 0 ORDER BY nama ASC")
    suspend fun getAllOnce(): List<KebunEntity>

    @Query("SELECT * FROM kebun WHERE id = :id AND isDeleted = 0")
    suspend fun getById(id: String): KebunEntity?

    @Query("SELECT * FROM kebun WHERE id = :id")
    suspend fun getByIdIncludingDeleted(id: String): KebunEntity?

    @Query("SELECT * FROM kebun WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSync(): List<KebunEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(kebun: KebunEntity)

    @Update
    suspend fun update(kebun: KebunEntity)

    @Query("UPDATE kebun SET isDeleted = 1, syncStatus = 'PENDING', updatedAt = :updatedAt WHERE id = :id")
    suspend fun softDelete(id: String, updatedAt: Long = System.currentTimeMillis())

    @Delete
    suspend fun hardDelete(kebun: KebunEntity)
}
