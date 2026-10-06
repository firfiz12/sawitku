package com.sawitku.app.data.local

import android.content.ContentValues
import android.database.sqlite.SQLiteDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class Migration4To5Test {

    @Test
    fun testMigration4To5PreservesDataAndMapsUuids() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        context.deleteDatabase("test_migration_4_5.db")

        // 1. Buat database versi 4 dengan FrameworkSQLiteOpenHelper
        val config = androidx.sqlite.db.SupportSQLiteOpenHelper.Configuration.builder(context)
            .name("test_migration_4_5.db")
            .callback(object : androidx.sqlite.db.SupportSQLiteOpenHelper.Callback(4) {
                override fun onCreate(db: SupportSQLiteDatabase) {
                    // Skema tabel v4 asli
                    db.execSQL("""
                        CREATE TABLE `kebun` (
                            `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                            `nama` TEXT NOT NULL,
                            `luasHa` REAL NOT NULL,
                            `jumlahPohon` INTEGER NOT NULL,
                            `keterangan` TEXT NOT NULL,
                            `rotasiPanenHari` INTEGER NOT NULL DEFAULT 14,
                            `tanggalPanenTerakhir` INTEGER NOT NULL DEFAULT 0
                        )
                    """.trimIndent())

                    db.execSQL("""
                        CREATE TABLE `panen` (
                            `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                            `tanggal` INTEGER NOT NULL,
                            `kebunId` INTEGER NOT NULL,
                            `beratKg` REAL NOT NULL,
                            `hargaPerKg` REAL NOT NULL,
                            `beratBrondolanKg` REAL NOT NULL DEFAULT 0.0,
                            `hargaBrondolanPerKg` REAL NOT NULL DEFAULT 0.0,
                            `pendapatanBrondolan` REAL NOT NULL DEFAULT 0.0,
                            `pendapatan` REAL NOT NULL,
                            `biayaProduksi` REAL NOT NULL,
                            `keterangan` TEXT NOT NULL,
                            `reminderEnabled` INTEGER NOT NULL DEFAULT 0,
                            `reminderTanggal` INTEGER NOT NULL DEFAULT 0
                        )
                    """.trimIndent())

                    db.execSQL("""
                        CREATE TABLE `perawatan` (
                            `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                            `tanggal` INTEGER NOT NULL,
                            `kebunId` INTEGER NOT NULL,
                            `jenis` TEXT NOT NULL,
                            `jenisPupuk` TEXT NOT NULL DEFAULT '',
                            `jenisRacun` TEXT NOT NULL DEFAULT '',
                            `deskripsi` TEXT NOT NULL,
                            `biaya` REAL NOT NULL,
                            `reminderEnabled` INTEGER NOT NULL DEFAULT 0,
                            `reminderTanggal` INTEGER NOT NULL DEFAULT 0
                        )
                    """.trimIndent())

                    db.execSQL("""
                        CREATE TABLE `biaya` (
                            `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                            `tanggal` INTEGER NOT NULL,
                            `kebunId` INTEGER,
                            `kategori` TEXT NOT NULL,
                            `deskripsi` TEXT NOT NULL,
                            `jumlah` REAL NOT NULL,
                            `sourceType` TEXT NOT NULL DEFAULT '',
                            `sourceId` INTEGER NOT NULL DEFAULT 0
                        )
                    """.trimIndent())
                }

                override fun onUpgrade(db: SupportSQLiteDatabase, oldVersion: Int, newVersion: Int) {}
            })
            .build()

        val helper = FrameworkSQLiteOpenHelperFactory().create(config)
        val db = helper.writableDatabase

        // 2. Masukkan data contoh versi 4 (Long IDs auto-increment)
        val kebunValues = ContentValues().apply {
            put("nama", "Kebun Sawit Blok A")
            put("luasHa", 2.5)
            put("jumlahPohon", 320)
            put("keterangan", "Bibit Marihat")
            put("rotasiPanenHari", 14)
            put("tanggalPanenTerakhir", 1700000000000L)
        }
        val oldKebunId = db.insert("kebun", SQLiteDatabase.CONFLICT_REPLACE, kebunValues)
        assertEquals(1L, oldKebunId)

        val panenValues = ContentValues().apply {
            put("tanggal", 1700000000000L)
            put("kebunId", oldKebunId)
            put("beratKg", 1250.0)
            put("hargaPerKg", 2400.0)
            put("beratBrondolanKg", 50.0)
            put("hargaBrondolanPerKg", 2000.0)
            put("pendapatanBrondolan", 100000.0)
            put("pendapatan", 3100000.0)
            put("biayaProduksi", 250000.0)
            put("keterangan", "Panen putaran ke-5")
            put("reminderEnabled", 1)
            put("reminderTanggal", 1701209600000L)
        }
        val oldPanenId = db.insert("panen", SQLiteDatabase.CONFLICT_REPLACE, panenValues)
        assertEquals(1L, oldPanenId)

        val perawatanValues = ContentValues().apply {
            put("tanggal", 1699000000000L)
            put("kebunId", oldKebunId)
            put("jenis", "Pemupukan")
            put("jenisPupuk", "NPK 13-6-27")
            put("jenisRacun", "")
            put("deskripsi", "Pemupukan semester 2")
            put("biaya", 850000.0)
            put("reminderEnabled", 0)
            put("reminderTanggal", 0L)
        }
        val oldPerawatanId = db.insert("perawatan", SQLiteDatabase.CONFLICT_REPLACE, perawatanValues)
        assertEquals(1L, oldPerawatanId)

        // Biaya derived dari perawatan
        val biayaPerawatanValues = ContentValues().apply {
            put("tanggal", 1699000000000L)
            put("kebunId", oldKebunId)
            put("kategori", "Perawatan: Pemupukan")
            put("deskripsi", "Pemupukan semester 2")
            put("jumlah", 850000.0)
            put("sourceType", "PERAWATAN")
            put("sourceId", oldPerawatanId)
        }
        db.insert("biaya", SQLiteDatabase.CONFLICT_REPLACE, biayaPerawatanValues)

        // Biaya mandiri umum (tanpa kebun)
        val biayaMandiriValues = ContentValues().apply {
            put("tanggal", 1699500000000L)
            putNull("kebunId")
            put("kategori", "Alat & Perlengkapan")
            put("deskripsi", "Beli dodos baru")
            put("jumlah", 175000.0)
            put("sourceType", "MANDIRI")
            put("sourceId", 0L)
        }
        db.insert("biaya", SQLiteDatabase.CONFLICT_REPLACE, biayaMandiriValues)

        // 3. Jalankan MIGRATION_4_5
        MIGRATION_4_5.migrate(db)

        // 4. Verifikasi hasil migrasi kebun
        var newKebunUuid: String? = null
        db.query("SELECT id, nama, luasHa, syncStatus, isDeleted, updatedAt FROM kebun").use { cursor ->
            assertTrue("Tabel kebun harus memiliki 1 baris", cursor.moveToNext())
            newKebunUuid = cursor.getString(cursor.getColumnIndexOrThrow("id"))
            assertNotNull(newKebunUuid)
            assertTrue("UUID harus berformat valid (36 char)", newKebunUuid!!.length == 36)
            assertEquals("Kebun Sawit Blok A", cursor.getString(cursor.getColumnIndexOrThrow("nama")))
            assertEquals(2.5, cursor.getDouble(cursor.getColumnIndexOrThrow("luasHa")), 0.001)
            assertEquals("PENDING", cursor.getString(cursor.getColumnIndexOrThrow("syncStatus")))
            assertEquals(0, cursor.getInt(cursor.getColumnIndexOrThrow("isDeleted")))
            assertTrue(cursor.getLong(cursor.getColumnIndexOrThrow("updatedAt")) > 0)
            assertFalse("Tidak boleh ada baris lain", cursor.moveToNext())
        }

        // 5. Verifikasi panen (FK kebunId harus sama dengan newKebunUuid)
        var newPanenUuid: String? = null
        db.query("SELECT id, kebunId, beratKg, syncStatus, isDeleted FROM panen").use { cursor ->
            assertTrue(cursor.moveToNext())
            newPanenUuid = cursor.getString(cursor.getColumnIndexOrThrow("id"))
            assertNotNull(newPanenUuid)
            assertEquals("kebunId di panen harus terpetakan ke UUID kebun baru", newKebunUuid, cursor.getString(cursor.getColumnIndexOrThrow("kebunId")))
            assertEquals(1250.0, cursor.getDouble(cursor.getColumnIndexOrThrow("beratKg")), 0.001)
            assertEquals("PENDING", cursor.getString(cursor.getColumnIndexOrThrow("syncStatus")))
            assertEquals(0, cursor.getInt(cursor.getColumnIndexOrThrow("isDeleted")))
        }

        // 6. Verifikasi perawatan (FK kebunId harus sama dengan newKebunUuid)
        var newPerawatanUuid: String? = null
        db.query("SELECT id, kebunId, jenis, syncStatus, isDeleted FROM perawatan").use { cursor ->
            assertTrue(cursor.moveToNext())
            newPerawatanUuid = cursor.getString(cursor.getColumnIndexOrThrow("id"))
            assertNotNull(newPerawatanUuid)
            assertEquals("kebunId di perawatan harus terpetakan ke UUID kebun baru", newKebunUuid, cursor.getString(cursor.getColumnIndexOrThrow("kebunId")))
            assertEquals("Pemupukan", cursor.getString(cursor.getColumnIndexOrThrow("jenis")))
            assertEquals("PENDING", cursor.getString(cursor.getColumnIndexOrThrow("syncStatus")))
        }

        // 7. Verifikasi biaya
        db.query("SELECT id, kebunId, sourceType, sourceId, jumlah, syncStatus, isDeleted FROM biaya ORDER BY sourceType ASC").use { cursor ->
            // Biaya Mandiri
            assertTrue(cursor.moveToNext())
            assertEquals("MANDIRI", cursor.getString(cursor.getColumnIndexOrThrow("sourceType")))
            assertTrue("Biaya mandiri tanpa kebun kebunId harus null", cursor.isNull(cursor.getColumnIndexOrThrow("kebunId")))
            assertEquals("", cursor.getString(cursor.getColumnIndexOrThrow("sourceId")))
            assertEquals(175000.0, cursor.getDouble(cursor.getColumnIndexOrThrow("jumlah")), 0.001)
            assertEquals("PENDING", cursor.getString(cursor.getColumnIndexOrThrow("syncStatus")))

            // Biaya Perawatan (sourceId harus terpetakan ke newPerawatanUuid)
            assertTrue(cursor.moveToNext())
            assertEquals("PERAWATAN", cursor.getString(cursor.getColumnIndexOrThrow("sourceType")))
            assertEquals(newKebunUuid, cursor.getString(cursor.getColumnIndexOrThrow("kebunId")))
            assertEquals("sourceId biaya perawatan harus sesuai dengan newPerawatanUuid", newPerawatanUuid, cursor.getString(cursor.getColumnIndexOrThrow("sourceId")))
            assertEquals(850000.0, cursor.getDouble(cursor.getColumnIndexOrThrow("jumlah")), 0.001)
            assertEquals("PENDING", cursor.getString(cursor.getColumnIndexOrThrow("syncStatus")))
        }

        // 8. Verifikasi Soft Delete
        db.execSQL("UPDATE kebun SET isDeleted = 1 WHERE id = '$newKebunUuid'")
        db.query("SELECT * FROM kebun WHERE isDeleted = 0").use { cursor ->
            assertFalse("Data yang di-soft-delete tidak boleh muncul di query WHERE isDeleted = 0", cursor.moveToNext())
        }

        db.close()
        context.deleteDatabase("test_migration_4_5.db")
    }
}
