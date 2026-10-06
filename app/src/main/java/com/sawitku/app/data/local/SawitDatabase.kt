package com.sawitku.app.data.local

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.util.Log
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
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

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

/**
 * Migrasi dari Versi 4 (Auto-increment Long IDs, offline-only)
 * ke Versi 5 (UUID String Primary Keys, soft delete, syncStatus, updatedAt).
 *
 * Menjaga seluruh data lama di HP tetap aman:
 * 1. Menghasilkan UUID baru untuk setiap baris lama.
 * 2. Memetakan relasi kebunId dan sourceId agar tetap terhubung dengan UUID baru.
 * 3. Menandai semua data hasil migrasi dengan status PENDING agar otomatis terunggah saat online sync diaktifkan.
 */
val MIGRATION_4_5 = object : Migration(4, 5) {
    override fun migrate(db: SupportSQLiteDatabase) {
        val now = System.currentTimeMillis()

        // 1. Buat tabel sementara dengan struktur v5 baru
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS `kebun_new` (
                `id` TEXT NOT NULL,
                `nama` TEXT NOT NULL,
                `luasHa` REAL NOT NULL,
                `jumlahPohon` INTEGER NOT NULL,
                `keterangan` TEXT NOT NULL,
                `rotasiPanenHari` INTEGER NOT NULL,
                `tanggalPanenTerakhir` INTEGER NOT NULL,
                `updatedAt` INTEGER NOT NULL,
                `syncStatus` TEXT NOT NULL,
                `isDeleted` INTEGER NOT NULL,
                PRIMARY KEY(`id`)
            )
        """.trimIndent())

        db.execSQL("""
            CREATE TABLE IF NOT EXISTS `panen_new` (
                `id` TEXT NOT NULL,
                `tanggal` INTEGER NOT NULL,
                `kebunId` TEXT NOT NULL,
                `beratKg` REAL NOT NULL,
                `hargaPerKg` REAL NOT NULL,
                `beratBrondolanKg` REAL NOT NULL,
                `hargaBrondolanPerKg` REAL NOT NULL,
                `pendapatanBrondolan` REAL NOT NULL,
                `pendapatan` REAL NOT NULL,
                `biayaProduksi` REAL NOT NULL,
                `keterangan` TEXT NOT NULL,
                `reminderEnabled` INTEGER NOT NULL,
                `reminderTanggal` INTEGER NOT NULL,
                `updatedAt` INTEGER NOT NULL,
                `syncStatus` TEXT NOT NULL,
                `isDeleted` INTEGER NOT NULL,
                PRIMARY KEY(`id`)
            )
        """.trimIndent())

        db.execSQL("""
            CREATE TABLE IF NOT EXISTS `perawatan_new` (
                `id` TEXT NOT NULL,
                `tanggal` INTEGER NOT NULL,
                `kebunId` TEXT NOT NULL,
                `jenis` TEXT NOT NULL,
                `jenisPupuk` TEXT NOT NULL,
                `jenisRacun` TEXT NOT NULL,
                `deskripsi` TEXT NOT NULL,
                `biaya` REAL NOT NULL,
                `reminderEnabled` INTEGER NOT NULL,
                `reminderTanggal` INTEGER NOT NULL,
                `updatedAt` INTEGER NOT NULL,
                `syncStatus` TEXT NOT NULL,
                `isDeleted` INTEGER NOT NULL,
                PRIMARY KEY(`id`)
            )
        """.trimIndent())

        db.execSQL("""
            CREATE TABLE IF NOT EXISTS `biaya_new` (
                `id` TEXT NOT NULL,
                `tanggal` INTEGER NOT NULL,
                `kebunId` TEXT,
                `kategori` TEXT NOT NULL,
                `deskripsi` TEXT NOT NULL,
                `jumlah` REAL NOT NULL,
                `sourceType` TEXT NOT NULL,
                `sourceId` TEXT NOT NULL,
                `updatedAt` INTEGER NOT NULL,
                `syncStatus` TEXT NOT NULL,
                `isDeleted` INTEGER NOT NULL,
                PRIMARY KEY(`id`)
            )
        """.trimIndent())

        val kebunIdMap = mutableMapOf<Long, String>()
        val panenIdMap = mutableMapOf<Long, String>()
        val perawatanIdMap = mutableMapOf<Long, String>()

        // 2. Migrasi data kebun
        db.query("SELECT id, nama, luasHa, jumlahPohon, keterangan, rotasiPanenHari, tanggalPanenTerakhir FROM kebun").use { cursor ->
            val idIdx = cursor.getColumnIndex("id")
            val namaIdx = cursor.getColumnIndex("nama")
            val luasHaIdx = cursor.getColumnIndex("luasHa")
            val jumlahPohonIdx = cursor.getColumnIndex("jumlahPohon")
            val ketIdx = cursor.getColumnIndex("keterangan")
            val rotasiIdx = cursor.getColumnIndex("rotasiPanenHari")
            val tglPanenIdx = cursor.getColumnIndex("tanggalPanenTerakhir")

            while (cursor.moveToNext()) {
                val oldId = cursor.getLong(idIdx)
                val newUuid = UUID.randomUUID().toString()
                kebunIdMap[oldId] = newUuid

                val values = ContentValues().apply {
                    put("id", newUuid)
                    put("nama", cursor.getString(namaIdx))
                    put("luasHa", cursor.getDouble(luasHaIdx))
                    put("jumlahPohon", cursor.getInt(jumlahPohonIdx))
                    put("keterangan", cursor.getString(ketIdx))
                    put("rotasiPanenHari", cursor.getInt(rotasiIdx))
                    put("tanggalPanenTerakhir", cursor.getLong(tglPanenIdx))
                    put("updatedAt", now)
                    put("syncStatus", "PENDING")
                    put("isDeleted", 0)
                }
                db.insert("kebun_new", SQLiteDatabase.CONFLICT_REPLACE, values)
            }
        }

        // 3. Migrasi data panen
        db.query("SELECT id, tanggal, kebunId, beratKg, hargaPerKg, beratBrondolanKg, hargaBrondolanPerKg, pendapatanBrondolan, pendapatan, biayaProduksi, keterangan, reminderEnabled, reminderTanggal FROM panen").use { cursor ->
            val idIdx = cursor.getColumnIndex("id")
            val tglIdx = cursor.getColumnIndex("tanggal")
            val kebunIdIdx = cursor.getColumnIndex("kebunId")
            val beratIdx = cursor.getColumnIndex("beratKg")
            val hargaIdx = cursor.getColumnIndex("hargaPerKg")
            val brondolanKgIdx = cursor.getColumnIndex("beratBrondolanKg")
            val hargaBrondolanIdx = cursor.getColumnIndex("hargaBrondolanPerKg")
            val pendBrondolanIdx = cursor.getColumnIndex("pendapatanBrondolan")
            val pendIdx = cursor.getColumnIndex("pendapatan")
            val biayaProdIdx = cursor.getColumnIndex("biayaProduksi")
            val ketIdx = cursor.getColumnIndex("keterangan")
            val reminderEnIdx = cursor.getColumnIndex("reminderEnabled")
            val reminderTglIdx = cursor.getColumnIndex("reminderTanggal")

            while (cursor.moveToNext()) {
                val oldId = cursor.getLong(idIdx)
                val newUuid = UUID.randomUUID().toString()
                panenIdMap[oldId] = newUuid

                val oldKebunId = cursor.getLong(kebunIdIdx)
                val newKebunId = kebunIdMap[oldKebunId] ?: UUID.randomUUID().toString()

                val values = ContentValues().apply {
                    put("id", newUuid)
                    put("tanggal", cursor.getLong(tglIdx))
                    put("kebunId", newKebunId)
                    put("beratKg", cursor.getDouble(beratIdx))
                    put("hargaPerKg", cursor.getDouble(hargaIdx))
                    put("beratBrondolanKg", cursor.getDouble(brondolanKgIdx))
                    put("hargaBrondolanPerKg", cursor.getDouble(hargaBrondolanIdx))
                    put("pendapatanBrondolan", cursor.getDouble(pendBrondolanIdx))
                    put("pendapatan", cursor.getDouble(pendIdx))
                    put("biayaProduksi", cursor.getDouble(biayaProdIdx))
                    put("keterangan", cursor.getString(ketIdx))
                    put("reminderEnabled", cursor.getInt(reminderEnIdx))
                    put("reminderTanggal", cursor.getLong(reminderTglIdx))
                    put("updatedAt", now)
                    put("syncStatus", "PENDING")
                    put("isDeleted", 0)
                }
                db.insert("panen_new", SQLiteDatabase.CONFLICT_REPLACE, values)
            }
        }

        // 4. Migrasi data perawatan
        db.query("SELECT id, tanggal, kebunId, jenis, jenisPupuk, jenisRacun, deskripsi, biaya, reminderEnabled, reminderTanggal FROM perawatan").use { cursor ->
            val idIdx = cursor.getColumnIndex("id")
            val tglIdx = cursor.getColumnIndex("tanggal")
            val kebunIdIdx = cursor.getColumnIndex("kebunId")
            val jenisIdx = cursor.getColumnIndex("jenis")
            val jenisPupukIdx = cursor.getColumnIndex("jenisPupuk")
            val jenisRacunIdx = cursor.getColumnIndex("jenisRacun")
            val deskripsiIdx = cursor.getColumnIndex("deskripsi")
            val biayaIdx = cursor.getColumnIndex("biaya")
            val reminderEnIdx = cursor.getColumnIndex("reminderEnabled")
            val reminderTglIdx = cursor.getColumnIndex("reminderTanggal")

            while (cursor.moveToNext()) {
                val oldId = cursor.getLong(idIdx)
                val newUuid = UUID.randomUUID().toString()
                perawatanIdMap[oldId] = newUuid

                val oldKebunId = cursor.getLong(kebunIdIdx)
                val newKebunId = kebunIdMap[oldKebunId] ?: UUID.randomUUID().toString()

                val values = ContentValues().apply {
                    put("id", newUuid)
                    put("tanggal", cursor.getLong(tglIdx))
                    put("kebunId", newKebunId)
                    put("jenis", cursor.getString(jenisIdx))
                    put("jenisPupuk", cursor.getString(jenisPupukIdx))
                    put("jenisRacun", cursor.getString(jenisRacunIdx))
                    put("deskripsi", cursor.getString(deskripsiIdx))
                    put("biaya", cursor.getDouble(biayaIdx))
                    put("reminderEnabled", cursor.getInt(reminderEnIdx))
                    put("reminderTanggal", cursor.getLong(reminderTglIdx))
                    put("updatedAt", now)
                    put("syncStatus", "PENDING")
                    put("isDeleted", 0)
                }
                db.insert("perawatan_new", SQLiteDatabase.CONFLICT_REPLACE, values)
            }
        }

        // 5. Migrasi data biaya
        db.query("SELECT id, tanggal, kebunId, kategori, deskripsi, jumlah, sourceType, sourceId FROM biaya").use { cursor ->
            val tglIdx = cursor.getColumnIndex("tanggal")
            val kebunIdIdx = cursor.getColumnIndex("kebunId")
            val katIdx = cursor.getColumnIndex("kategori")
            val deskripsiIdx = cursor.getColumnIndex("deskripsi")
            val jmlIdx = cursor.getColumnIndex("jumlah")
            val srcTypeIdx = cursor.getColumnIndex("sourceType")
            val srcIdIdx = cursor.getColumnIndex("sourceId")

            while (cursor.moveToNext()) {
                val newUuid = UUID.randomUUID().toString()
                val oldKebunId = if (cursor.isNull(kebunIdIdx)) null else cursor.getLong(kebunIdIdx)
                val newKebunId = oldKebunId?.let { kebunIdMap[it] }

                val srcType = cursor.getString(srcTypeIdx) ?: ""
                val oldSrcId = cursor.getLong(srcIdIdx)
                val newSourceId = when (srcType) {
                    "PERAWATAN" -> perawatanIdMap[oldSrcId] ?: ""
                    "PANEN" -> panenIdMap[oldSrcId] ?: ""
                    else -> ""
                }

                val values = ContentValues().apply {
                    put("id", newUuid)
                    put("tanggal", cursor.getLong(tglIdx))
                    if (newKebunId != null) put("kebunId", newKebunId) else putNull("kebunId")
                    put("kategori", cursor.getString(katIdx))
                    put("deskripsi", cursor.getString(deskripsiIdx))
                    put("jumlah", cursor.getDouble(jmlIdx))
                    put("sourceType", srcType)
                    put("sourceId", newSourceId)
                    put("updatedAt", now)
                    put("syncStatus", "PENDING")
                    put("isDeleted", 0)
                }
                db.insert("biaya_new", SQLiteDatabase.CONFLICT_REPLACE, values)
            }
        }

        // 6. Ganti tabel lama dengan tabel baru
        db.execSQL("DROP TABLE kebun")
        db.execSQL("DROP TABLE panen")
        db.execSQL("DROP TABLE perawatan")
        db.execSQL("DROP TABLE biaya")

        db.execSQL("ALTER TABLE kebun_new RENAME TO kebun")
        db.execSQL("ALTER TABLE panen_new RENAME TO panen")
        db.execSQL("ALTER TABLE perawatan_new RENAME TO perawatan")
        db.execSQL("ALTER TABLE biaya_new RENAME TO biaya")
    }
}

@Database(
    entities = [
        KebunEntity::class,
        PerawatanEntity::class,
        PanenEntity::class,
        BiayaEntity::class
    ],
    version = 5,
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

        /**
         * Melakukan backup file database sebelum migrasi berjalan untuk mencegah kehilangan data.
         */
        private fun performBackupIfNeeded(context: Context) {
            try {
                val dbFile = context.getDatabasePath("sawitku.db")
                if (!dbFile.exists()) return

                // Cek versi database saat ini
                val currentVersion = SQLiteDatabase.openDatabase(
                    dbFile.path,
                    null,
                    SQLiteDatabase.OPEN_READONLY
                ).use { it.version }

                // Jika database ada di versi 1 s/d 4 dan perlu naik ke 5, buat backup
                if (currentVersion in 1 until 5) {
                    val backupDir = File(context.filesDir, "database_backups").apply { mkdirs() }
                    val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
                    val backupFile = File(backupDir, "sawitku_v${currentVersion}_backup_$timestamp.db")

                    dbFile.copyTo(backupFile, overwrite = true)

                    val walFile = File(dbFile.path + "-wal")
                    if (walFile.exists()) walFile.copyTo(File(backupFile.path + "-wal"), overwrite = true)
                    val shmFile = File(dbFile.path + "-shm")
                    if (shmFile.exists()) shmFile.copyTo(File(backupFile.path + "-shm"), overwrite = true)

                    Log.i("SawitDatabase", "Backup database v$currentVersion berhasil dibuat: ${backupFile.absolutePath}")
                }
            } catch (e: Exception) {
                Log.e("SawitDatabase", "Peringatan: Gagal membuat backup database otomatis sebelum migrasi", e)
            }
        }

        fun getDatabase(context: Context): SawitDatabase {
            return INSTANCE ?: synchronized(this) {
                performBackupIfNeeded(context)
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    SawitDatabase::class.java,
                    "sawitku.db"
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4, MIGRATION_4_5)
                    // fallbackToDestructiveMigration() SENGAJA DIHAPUS agar Room tidak pernah menghapus data pengguna
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
