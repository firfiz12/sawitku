package com.sawitku.app.data.local.dao;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityDeletionOrUpdateAdapter;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.sawitku.app.data.local.entity.PerawatanEntity;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Long;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;
import kotlinx.coroutines.flow.Flow;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class PerawatanDao_Impl implements PerawatanDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<PerawatanEntity> __insertionAdapterOfPerawatanEntity;

  private final EntityDeletionOrUpdateAdapter<PerawatanEntity> __deletionAdapterOfPerawatanEntity;

  private final EntityDeletionOrUpdateAdapter<PerawatanEntity> __updateAdapterOfPerawatanEntity;

  public PerawatanDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfPerawatanEntity = new EntityInsertionAdapter<PerawatanEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `perawatan` (`id`,`tanggal`,`kebunId`,`jenis`,`jenisPupuk`,`jenisRacun`,`deskripsi`,`biaya`,`reminderEnabled`,`reminderTanggal`) VALUES (nullif(?, 0),?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PerawatanEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindLong(2, entity.getTanggal());
        statement.bindLong(3, entity.getKebunId());
        statement.bindString(4, entity.getJenis());
        statement.bindString(5, entity.getJenisPupuk());
        statement.bindString(6, entity.getJenisRacun());
        statement.bindString(7, entity.getDeskripsi());
        statement.bindDouble(8, entity.getBiaya());
        final int _tmp = entity.getReminderEnabled() ? 1 : 0;
        statement.bindLong(9, _tmp);
        statement.bindLong(10, entity.getReminderTanggal());
      }
    };
    this.__deletionAdapterOfPerawatanEntity = new EntityDeletionOrUpdateAdapter<PerawatanEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `perawatan` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PerawatanEntity entity) {
        statement.bindLong(1, entity.getId());
      }
    };
    this.__updateAdapterOfPerawatanEntity = new EntityDeletionOrUpdateAdapter<PerawatanEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `perawatan` SET `id` = ?,`tanggal` = ?,`kebunId` = ?,`jenis` = ?,`jenisPupuk` = ?,`jenisRacun` = ?,`deskripsi` = ?,`biaya` = ?,`reminderEnabled` = ?,`reminderTanggal` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PerawatanEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindLong(2, entity.getTanggal());
        statement.bindLong(3, entity.getKebunId());
        statement.bindString(4, entity.getJenis());
        statement.bindString(5, entity.getJenisPupuk());
        statement.bindString(6, entity.getJenisRacun());
        statement.bindString(7, entity.getDeskripsi());
        statement.bindDouble(8, entity.getBiaya());
        final int _tmp = entity.getReminderEnabled() ? 1 : 0;
        statement.bindLong(9, _tmp);
        statement.bindLong(10, entity.getReminderTanggal());
        statement.bindLong(11, entity.getId());
      }
    };
  }

  @Override
  public Object insert(final PerawatanEntity perawatan,
      final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfPerawatanEntity.insertAndReturnId(perawatan);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object delete(final PerawatanEntity perawatan,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfPerawatanEntity.handle(perawatan);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object update(final PerawatanEntity perawatan,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfPerawatanEntity.handle(perawatan);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<PerawatanEntity>> getAll() {
    final String _sql = "SELECT * FROM perawatan ORDER BY tanggal DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"perawatan"}, new Callable<List<PerawatanEntity>>() {
      @Override
      @NonNull
      public List<PerawatanEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "tanggal");
          final int _cursorIndexOfKebunId = CursorUtil.getColumnIndexOrThrow(_cursor, "kebunId");
          final int _cursorIndexOfJenis = CursorUtil.getColumnIndexOrThrow(_cursor, "jenis");
          final int _cursorIndexOfJenisPupuk = CursorUtil.getColumnIndexOrThrow(_cursor, "jenisPupuk");
          final int _cursorIndexOfJenisRacun = CursorUtil.getColumnIndexOrThrow(_cursor, "jenisRacun");
          final int _cursorIndexOfDeskripsi = CursorUtil.getColumnIndexOrThrow(_cursor, "deskripsi");
          final int _cursorIndexOfBiaya = CursorUtil.getColumnIndexOrThrow(_cursor, "biaya");
          final int _cursorIndexOfReminderEnabled = CursorUtil.getColumnIndexOrThrow(_cursor, "reminderEnabled");
          final int _cursorIndexOfReminderTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "reminderTanggal");
          final List<PerawatanEntity> _result = new ArrayList<PerawatanEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PerawatanEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final long _tmpTanggal;
            _tmpTanggal = _cursor.getLong(_cursorIndexOfTanggal);
            final long _tmpKebunId;
            _tmpKebunId = _cursor.getLong(_cursorIndexOfKebunId);
            final String _tmpJenis;
            _tmpJenis = _cursor.getString(_cursorIndexOfJenis);
            final String _tmpJenisPupuk;
            _tmpJenisPupuk = _cursor.getString(_cursorIndexOfJenisPupuk);
            final String _tmpJenisRacun;
            _tmpJenisRacun = _cursor.getString(_cursorIndexOfJenisRacun);
            final String _tmpDeskripsi;
            _tmpDeskripsi = _cursor.getString(_cursorIndexOfDeskripsi);
            final double _tmpBiaya;
            _tmpBiaya = _cursor.getDouble(_cursorIndexOfBiaya);
            final boolean _tmpReminderEnabled;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfReminderEnabled);
            _tmpReminderEnabled = _tmp != 0;
            final long _tmpReminderTanggal;
            _tmpReminderTanggal = _cursor.getLong(_cursorIndexOfReminderTanggal);
            _item = new PerawatanEntity(_tmpId,_tmpTanggal,_tmpKebunId,_tmpJenis,_tmpJenisPupuk,_tmpJenisRacun,_tmpDeskripsi,_tmpBiaya,_tmpReminderEnabled,_tmpReminderTanggal);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public Object getAllOnce(final Continuation<? super List<PerawatanEntity>> $completion) {
    final String _sql = "SELECT * FROM perawatan ORDER BY tanggal DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<PerawatanEntity>>() {
      @Override
      @NonNull
      public List<PerawatanEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "tanggal");
          final int _cursorIndexOfKebunId = CursorUtil.getColumnIndexOrThrow(_cursor, "kebunId");
          final int _cursorIndexOfJenis = CursorUtil.getColumnIndexOrThrow(_cursor, "jenis");
          final int _cursorIndexOfJenisPupuk = CursorUtil.getColumnIndexOrThrow(_cursor, "jenisPupuk");
          final int _cursorIndexOfJenisRacun = CursorUtil.getColumnIndexOrThrow(_cursor, "jenisRacun");
          final int _cursorIndexOfDeskripsi = CursorUtil.getColumnIndexOrThrow(_cursor, "deskripsi");
          final int _cursorIndexOfBiaya = CursorUtil.getColumnIndexOrThrow(_cursor, "biaya");
          final int _cursorIndexOfReminderEnabled = CursorUtil.getColumnIndexOrThrow(_cursor, "reminderEnabled");
          final int _cursorIndexOfReminderTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "reminderTanggal");
          final List<PerawatanEntity> _result = new ArrayList<PerawatanEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PerawatanEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final long _tmpTanggal;
            _tmpTanggal = _cursor.getLong(_cursorIndexOfTanggal);
            final long _tmpKebunId;
            _tmpKebunId = _cursor.getLong(_cursorIndexOfKebunId);
            final String _tmpJenis;
            _tmpJenis = _cursor.getString(_cursorIndexOfJenis);
            final String _tmpJenisPupuk;
            _tmpJenisPupuk = _cursor.getString(_cursorIndexOfJenisPupuk);
            final String _tmpJenisRacun;
            _tmpJenisRacun = _cursor.getString(_cursorIndexOfJenisRacun);
            final String _tmpDeskripsi;
            _tmpDeskripsi = _cursor.getString(_cursorIndexOfDeskripsi);
            final double _tmpBiaya;
            _tmpBiaya = _cursor.getDouble(_cursorIndexOfBiaya);
            final boolean _tmpReminderEnabled;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfReminderEnabled);
            _tmpReminderEnabled = _tmp != 0;
            final long _tmpReminderTanggal;
            _tmpReminderTanggal = _cursor.getLong(_cursorIndexOfReminderTanggal);
            _item = new PerawatanEntity(_tmpId,_tmpTanggal,_tmpKebunId,_tmpJenis,_tmpJenisPupuk,_tmpJenisRacun,_tmpDeskripsi,_tmpBiaya,_tmpReminderEnabled,_tmpReminderTanggal);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<PerawatanEntity>> getByKebun(final long kebunId) {
    final String _sql = "SELECT * FROM perawatan WHERE kebunId = ? ORDER BY tanggal DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, kebunId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"perawatan"}, new Callable<List<PerawatanEntity>>() {
      @Override
      @NonNull
      public List<PerawatanEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "tanggal");
          final int _cursorIndexOfKebunId = CursorUtil.getColumnIndexOrThrow(_cursor, "kebunId");
          final int _cursorIndexOfJenis = CursorUtil.getColumnIndexOrThrow(_cursor, "jenis");
          final int _cursorIndexOfJenisPupuk = CursorUtil.getColumnIndexOrThrow(_cursor, "jenisPupuk");
          final int _cursorIndexOfJenisRacun = CursorUtil.getColumnIndexOrThrow(_cursor, "jenisRacun");
          final int _cursorIndexOfDeskripsi = CursorUtil.getColumnIndexOrThrow(_cursor, "deskripsi");
          final int _cursorIndexOfBiaya = CursorUtil.getColumnIndexOrThrow(_cursor, "biaya");
          final int _cursorIndexOfReminderEnabled = CursorUtil.getColumnIndexOrThrow(_cursor, "reminderEnabled");
          final int _cursorIndexOfReminderTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "reminderTanggal");
          final List<PerawatanEntity> _result = new ArrayList<PerawatanEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PerawatanEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final long _tmpTanggal;
            _tmpTanggal = _cursor.getLong(_cursorIndexOfTanggal);
            final long _tmpKebunId;
            _tmpKebunId = _cursor.getLong(_cursorIndexOfKebunId);
            final String _tmpJenis;
            _tmpJenis = _cursor.getString(_cursorIndexOfJenis);
            final String _tmpJenisPupuk;
            _tmpJenisPupuk = _cursor.getString(_cursorIndexOfJenisPupuk);
            final String _tmpJenisRacun;
            _tmpJenisRacun = _cursor.getString(_cursorIndexOfJenisRacun);
            final String _tmpDeskripsi;
            _tmpDeskripsi = _cursor.getString(_cursorIndexOfDeskripsi);
            final double _tmpBiaya;
            _tmpBiaya = _cursor.getDouble(_cursorIndexOfBiaya);
            final boolean _tmpReminderEnabled;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfReminderEnabled);
            _tmpReminderEnabled = _tmp != 0;
            final long _tmpReminderTanggal;
            _tmpReminderTanggal = _cursor.getLong(_cursorIndexOfReminderTanggal);
            _item = new PerawatanEntity(_tmpId,_tmpTanggal,_tmpKebunId,_tmpJenis,_tmpJenisPupuk,_tmpJenisRacun,_tmpDeskripsi,_tmpBiaya,_tmpReminderEnabled,_tmpReminderTanggal);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
