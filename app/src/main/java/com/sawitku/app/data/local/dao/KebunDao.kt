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
    @Query("SELECT * FROM kebun ORDER BY nama ASC")
    fun getAll(): Flow<List<KebunEntity>>

    @Query("SELECT * FROM kebun WHERE id = :id")
    suspend fun getById(id: Long): KebunEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(kebun: KebunEntity): Long

    @Update
    suspend fun update(kebun: KebunEntity)

    @Delete
    suspend fun delete(kebun: KebunEntity)
}
