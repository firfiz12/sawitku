package com.sawitku.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.sawitku.app.data.local.dao.BiayaDao
import com.sawitku.app.data.local.dao.KebunDao
import com.sawitku.app.data.local.dao.PanenDao
import com.sawitku.app.data.local.dao.PerawatanDao
import com.sawitku.app.data.local.entity.BiayaEntity
import com.sawitku.app.data.local.entity.KebunEntity
import com.sawitku.app.data.local.entity.PanenEntity
import com.sawitku.app.data.local.entity.PerawatanEntity

val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE kebun ADD COLUMN rotasiPanenHari INTEGER NOT NULL DEFAULT 14")
        db.execSQL("ALTER TABLE kebun ADD COLUMN tanggalPanenTerakhir INTEGER NOT NULL DEFAULT 0")

        db.execSQL("ALTER TABLE perawatan ADD COLUMN jenisPupuk TEXT NOT NULL DEFAULT ''")
        db.execSQL("ALTER TABLE perawatan ADD COLUMN jenisRacun TEXT NOT NULL DEFAULT ''")
        db.execSQL("ALTER TABLE perawatan ADD COLUMN reminderEnabled INTEGER NOT NULL DEFAULT 0")
        db.execSQL("ALTER TABLE perawatan ADD COLUMN reminderTanggal INTEGER NOT NULL DEFAULT 0")

        db.execSQL("ALTER TABLE panen ADD COLUMN reminderEnabled INTEGER NOT NULL DEFAULT 0")
        db.execSQL("ALTER TABLE panen ADD COLUMN reminderTanggal INTEGER NOT NULL DEFAULT 0")
    }
}

val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE panen ADD COLUMN beratBrondolanKg REAL NOT NULL DEFAULT 0.0")
        db.execSQL("ALTER TABLE panen ADD COLUMN hargaBrondolanPerKg REAL NOT NULL DEFAULT 0.0")
        db.execSQL("ALTER TABLE panen ADD COLUMN pendapatanBrondolan REAL NOT NULL DEFAULT 0.0")
    }
}

val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE biaya ADD COLUMN sourceType TEXT NOT NULL DEFAULT ''")
        db.execSQL("ALTER TABLE biaya ADD COLUMN sourceId INTEGER NOT NULL DEFAULT 0")
    }
}

@Database(
    entities = [
        KebunEntity::class,
        PerawatanEntity::class,
        PanenEntity::class,
        BiayaEntity::class
    ],
    version = 4,
    exportSchema = false
)
abstract class SawitDatabase : RoomDatabase() {
    abstract fun kebunDao(): KebunDao
    abstract fun perawatanDao(): PerawatanDao
    abstract fun panenDao(): PanenDao
    abstract fun biayaDao(): BiayaDao

    companion object {
        @Volatile
        private var INSTANCE: SawitDatabase? = null

        fun getDatabase(context: Context): SawitDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    SawitDatabase::class.java,
                    "sawitku.db"
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4)
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
