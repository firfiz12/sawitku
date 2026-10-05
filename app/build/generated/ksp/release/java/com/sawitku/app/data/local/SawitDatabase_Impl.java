package com.sawitku.app.data.local;

import androidx.annotation.NonNull;
import androidx.room.DatabaseConfiguration;
import androidx.room.InvalidationTracker;
import androidx.room.RoomDatabase;
import androidx.room.RoomOpenHelper;
import androidx.room.migration.AutoMigrationSpec;
import androidx.room.migration.Migration;
import androidx.room.util.DBUtil;
import androidx.room.util.TableInfo;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteOpenHelper;
import com.sawitku.app.data.local.dao.BiayaDao;
import com.sawitku.app.data.local.dao.BiayaDao_Impl;
import com.sawitku.app.data.local.dao.KebunDao;
import com.sawitku.app.data.local.dao.KebunDao_Impl;
import com.sawitku.app.data.local.dao.PanenDao;
import com.sawitku.app.data.local.dao.PanenDao_Impl;
import com.sawitku.app.data.local.dao.PerawatanDao;
import com.sawitku.app.data.local.dao.PerawatanDao_Impl;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.Generated;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class SawitDatabase_Impl extends SawitDatabase {
  private volatile KebunDao _kebunDao;

  private volatile PerawatanDao _perawatanDao;

  private volatile PanenDao _panenDao;

  private volatile BiayaDao _biayaDao;

  @Override
  @NonNull
  protected SupportSQLiteOpenHelper createOpenHelper(@NonNull final DatabaseConfiguration config) {
    final SupportSQLiteOpenHelper.Callback _openCallback = new RoomOpenHelper(config, new RoomOpenHelper.Delegate(4) {
      @Override
      public void createAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS `kebun` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `nama` TEXT NOT NULL, `luasHa` REAL NOT NULL, `jumlahPohon` INTEGER NOT NULL, `keterangan` TEXT NOT NULL, `rotasiPanenHari` INTEGER NOT NULL, `tanggalPanenTerakhir` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `perawatan` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `tanggal` INTEGER NOT NULL, `kebunId` INTEGER NOT NULL, `jenis` TEXT NOT NULL, `jenisPupuk` TEXT NOT NULL, `jenisRacun` TEXT NOT NULL, `deskripsi` TEXT NOT NULL, `biaya` REAL NOT NULL, `reminderEnabled` INTEGER NOT NULL, `reminderTanggal` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `panen` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `tanggal` INTEGER NOT NULL, `kebunId` INTEGER NOT NULL, `beratKg` REAL NOT NULL, `hargaPerKg` REAL NOT NULL, `beratBrondolanKg` REAL NOT NULL, `hargaBrondolanPerKg` REAL NOT NULL, `pendapatanBrondolan` REAL NOT NULL, `pendapatan` REAL NOT NULL, `biayaProduksi` REAL NOT NULL, `keterangan` TEXT NOT NULL, `reminderEnabled` INTEGER NOT NULL, `reminderTanggal` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `biaya` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `tanggal` INTEGER NOT NULL, `kebunId` INTEGER, `kategori` TEXT NOT NULL, `deskripsi` TEXT NOT NULL, `jumlah` REAL NOT NULL, `sourceType` TEXT NOT NULL, `sourceId` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)");
        db.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, '1773e6fbe15d2087010d61043b955e71')");
      }

      @Override
      public void dropAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("DROP TABLE IF EXISTS `kebun`");
        db.execSQL("DROP TABLE IF EXISTS `perawatan`");
        db.execSQL("DROP TABLE IF EXISTS `panen`");
        db.execSQL("DROP TABLE IF EXISTS `biaya`");
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onDestructiveMigration(db);
          }
        }
      }

      @Override
      public void onCreate(@NonNull final SupportSQLiteDatabase db) {
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onCreate(db);
          }
        }
      }

      @Override
      public void onOpen(@NonNull final SupportSQLiteDatabase db) {
        mDatabase = db;
        internalInitInvalidationTracker(db);
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onOpen(db);
          }
        }
      }

      @Override
      public void onPreMigrate(@NonNull final SupportSQLiteDatabase db) {
        DBUtil.dropFtsSyncTriggers(db);
      }

      @Override
      public void onPostMigrate(@NonNull final SupportSQLiteDatabase db) {
      }

      @Override
      @NonNull
      public RoomOpenHelper.ValidationResult onValidateSchema(
          @NonNull final SupportSQLiteDatabase db) {
        final HashMap<String, TableInfo.Column> _columnsKebun = new HashMap<String, TableInfo.Column>(7);
        _columnsKebun.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsKebun.put("nama", new TableInfo.Column("nama", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsKebun.put("luasHa", new TableInfo.Column("luasHa", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsKebun.put("jumlahPohon", new TableInfo.Column("jumlahPohon", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsKebun.put("keterangan", new TableInfo.Column("keterangan", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsKebun.put("rotasiPanenHari", new TableInfo.Column("rotasiPanenHari", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsKebun.put("tanggalPanenTerakhir", new TableInfo.Column("tanggalPanenTerakhir", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysKebun = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesKebun = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoKebun = new TableInfo("kebun", _columnsKebun, _foreignKeysKebun, _indicesKebun);
        final TableInfo _existingKebun = TableInfo.read(db, "kebun");
        if (!_infoKebun.equals(_existingKebun)) {
          return new RoomOpenHelper.ValidationResult(false, "kebun(com.sawitku.app.data.local.entity.KebunEntity).\n"
                  + " Expected:\n" + _infoKebun + "\n"
                  + " Found:\n" + _existingKebun);
        }
        final HashMap<String, TableInfo.Column> _columnsPerawatan = new HashMap<String, TableInfo.Column>(10);
        _columnsPerawatan.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerawatan.put("tanggal", new TableInfo.Column("tanggal", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerawatan.put("kebunId", new TableInfo.Column("kebunId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerawatan.put("jenis", new TableInfo.Column("jenis", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerawatan.put("jenisPupuk", new TableInfo.Column("jenisPupuk", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerawatan.put("jenisRacun", new TableInfo.Column("jenisRacun", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerawatan.put("deskripsi", new TableInfo.Column("deskripsi", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerawatan.put("biaya", new TableInfo.Column("biaya", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerawatan.put("reminderEnabled", new TableInfo.Column("reminderEnabled", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerawatan.put("reminderTanggal", new TableInfo.Column("reminderTanggal", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysPerawatan = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesPerawatan = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoPerawatan = new TableInfo("perawatan", _columnsPerawatan, _foreignKeysPerawatan, _indicesPerawatan);
        final TableInfo _existingPerawatan = TableInfo.read(db, "perawatan");
        if (!_infoPerawatan.equals(_existingPerawatan)) {
          return new RoomOpenHelper.ValidationResult(false, "perawatan(com.sawitku.app.data.local.entity.PerawatanEntity).\n"
                  + " Expected:\n" + _infoPerawatan + "\n"
                  + " Found:\n" + _existingPerawatan);
        }
        final HashMap<String, TableInfo.Column> _columnsPanen = new HashMap<String, TableInfo.Column>(13);
        _columnsPanen.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPanen.put("tanggal", new TableInfo.Column("tanggal", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPanen.put("kebunId", new TableInfo.Column("kebunId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPanen.put("beratKg", new TableInfo.Column("beratKg", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPanen.put("hargaPerKg", new TableInfo.Column("hargaPerKg", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPanen.put("beratBrondolanKg", new TableInfo.Column("beratBrondolanKg", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPanen.put("hargaBrondolanPerKg", new TableInfo.Column("hargaBrondolanPerKg", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPanen.put("pendapatanBrondolan", new TableInfo.Column("pendapatanBrondolan", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPanen.put("pendapatan", new TableInfo.Column("pendapatan", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPanen.put("biayaProduksi", new TableInfo.Column("biayaProduksi", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPanen.put("keterangan", new TableInfo.Column("keterangan", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPanen.put("reminderEnabled", new TableInfo.Column("reminderEnabled", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPanen.put("reminderTanggal", new TableInfo.Column("reminderTanggal", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysPanen = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesPanen = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoPanen = new TableInfo("panen", _columnsPanen, _foreignKeysPanen, _indicesPanen);
        final TableInfo _existingPanen = TableInfo.read(db, "panen");
        if (!_infoPanen.equals(_existingPanen)) {
          return new RoomOpenHelper.ValidationResult(false, "panen(com.sawitku.app.data.local.entity.PanenEntity).\n"
                  + " Expected:\n" + _infoPanen + "\n"
                  + " Found:\n" + _existingPanen);
        }
        final HashMap<String, TableInfo.Column> _columnsBiaya = new HashMap<String, TableInfo.Column>(8);
        _columnsBiaya.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBiaya.put("tanggal", new TableInfo.Column("tanggal", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBiaya.put("kebunId", new TableInfo.Column("kebunId", "INTEGER", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBiaya.put("kategori", new TableInfo.Column("kategori", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBiaya.put("deskripsi", new TableInfo.Column("deskripsi", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBiaya.put("jumlah", new TableInfo.Column("jumlah", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBiaya.put("sourceType", new TableInfo.Column("sourceType", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBiaya.put("sourceId", new TableInfo.Column("sourceId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysBiaya = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesBiaya = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoBiaya = new TableInfo("biaya", _columnsBiaya, _foreignKeysBiaya, _indicesBiaya);
        final TableInfo _existingBiaya = TableInfo.read(db, "biaya");
        if (!_infoBiaya.equals(_existingBiaya)) {
          return new RoomOpenHelper.ValidationResult(false, "biaya(com.sawitku.app.data.local.entity.BiayaEntity).\n"
                  + " Expected:\n" + _infoBiaya + "\n"
                  + " Found:\n" + _existingBiaya);
        }
        return new RoomOpenHelper.ValidationResult(true, null);
      }
    }, "1773e6fbe15d2087010d61043b955e71", "af7d6324de64a9c256e2fa2070957ce9");
    final SupportSQLiteOpenHelper.Configuration _sqliteConfig = SupportSQLiteOpenHelper.Configuration.builder(config.context).name(config.name).callback(_openCallback).build();
    final SupportSQLiteOpenHelper _helper = config.sqliteOpenHelperFactory.create(_sqliteConfig);
    return _helper;
  }

  @Override
  @NonNull
  protected InvalidationTracker createInvalidationTracker() {
    final HashMap<String, String> _shadowTablesMap = new HashMap<String, String>(0);
    final HashMap<String, Set<String>> _viewTables = new HashMap<String, Set<String>>(0);
    return new InvalidationTracker(this, _shadowTablesMap, _viewTables, "kebun","perawatan","panen","biaya");
  }

  @Override
  public void clearAllTables() {
    super.assertNotMainThread();
    final SupportSQLiteDatabase _db = super.getOpenHelper().getWritableDatabase();
    try {
      super.beginTransaction();
      _db.execSQL("DELETE FROM `kebun`");
      _db.execSQL("DELETE FROM `perawatan`");
      _db.execSQL("DELETE FROM `panen`");
      _db.execSQL("DELETE FROM `biaya`");
      super.setTransactionSuccessful();
    } finally {
      super.endTransaction();
      _db.query("PRAGMA wal_checkpoint(FULL)").close();
      if (!_db.inTransaction()) {
        _db.execSQL("VACUUM");
      }
    }
  }

  @Override
  @NonNull
  protected Map<Class<?>, List<Class<?>>> getRequiredTypeConverters() {
    final HashMap<Class<?>, List<Class<?>>> _typeConvertersMap = new HashMap<Class<?>, List<Class<?>>>();
    _typeConvertersMap.put(KebunDao.class, KebunDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(PerawatanDao.class, PerawatanDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(PanenDao.class, PanenDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(BiayaDao.class, BiayaDao_Impl.getRequiredConverters());
    return _typeConvertersMap;
  }

  @Override
  @NonNull
  public Set<Class<? extends AutoMigrationSpec>> getRequiredAutoMigrationSpecs() {
    final HashSet<Class<? extends AutoMigrationSpec>> _autoMigrationSpecsSet = new HashSet<Class<? extends AutoMigrationSpec>>();
    return _autoMigrationSpecsSet;
  }

  @Override
  @NonNull
  public List<Migration> getAutoMigrations(
      @NonNull final Map<Class<? extends AutoMigrationSpec>, AutoMigrationSpec> autoMigrationSpecs) {
    final List<Migration> _autoMigrations = new ArrayList<Migration>();
    return _autoMigrations;
  }

  @Override
  public KebunDao kebunDao() {
    if (_kebunDao != null) {
      return _kebunDao;
    } else {
      synchronized(this) {
        if(_kebunDao == null) {
          _kebunDao = new KebunDao_Impl(this);
        }
        return _kebunDao;
      }
    }
  }

  @Override
  public PerawatanDao perawatanDao() {
    if (_perawatanDao != null) {
      return _perawatanDao;
    } else {
      synchronized(this) {
        if(_perawatanDao == null) {
          _perawatanDao = new PerawatanDao_Impl(this);
        }
        return _perawatanDao;
      }
    }
  }

  @Override
  public PanenDao panenDao() {
    if (_panenDao != null) {
      return _panenDao;
    } else {
      synchronized(this) {
        if(_panenDao == null) {
          _panenDao = new PanenDao_Impl(this);
        }
        return _panenDao;
      }
    }
  }

  @Override
  public BiayaDao biayaDao() {
    if (_biayaDao != null) {
      return _biayaDao;
    } else {
      synchronized(this) {
        if(_biayaDao == null) {
          _biayaDao = new BiayaDao_Impl(this);
        }
        return _biayaDao;
      }
    }
  }
}
