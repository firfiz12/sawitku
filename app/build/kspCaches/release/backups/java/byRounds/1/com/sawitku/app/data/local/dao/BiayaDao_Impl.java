package com.sawitku.app.data.local.dao;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityDeletionOrUpdateAdapter;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.sawitku.app.data.local.entity.BiayaEntity;
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
public final class BiayaDao_Impl implements BiayaDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<BiayaEntity> __insertionAdapterOfBiayaEntity;

  private final EntityDeletionOrUpdateAdapter<BiayaEntity> __deletionAdapterOfBiayaEntity;

  private final EntityDeletionOrUpdateAdapter<BiayaEntity> __updateAdapterOfBiayaEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteBySource;

  public BiayaDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfBiayaEntity = new EntityInsertionAdapter<BiayaEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `biaya` (`id`,`tanggal`,`kebunId`,`kategori`,`deskripsi`,`jumlah`,`sourceType`,`sourceId`) VALUES (nullif(?, 0),?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final BiayaEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindLong(2, entity.getTanggal());
        if (entity.getKebunId() == null) {
          statement.bindNull(3);
        } else {
          statement.bindLong(3, entity.getKebunId());
        }
        statement.bindString(4, entity.getKategori());
        statement.bindString(5, entity.getDeskripsi());
        statement.bindDouble(6, entity.getJumlah());
        statement.bindString(7, entity.getSourceType());
        statement.bindLong(8, entity.getSourceId());
      }
    };
    this.__deletionAdapterOfBiayaEntity = new EntityDeletionOrUpdateAdapter<BiayaEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `biaya` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final BiayaEntity entity) {
        statement.bindLong(1, entity.getId());
      }
    };
    this.__updateAdapterOfBiayaEntity = new EntityDeletionOrUpdateAdapter<BiayaEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `biaya` SET `id` = ?,`tanggal` = ?,`kebunId` = ?,`kategori` = ?,`deskripsi` = ?,`jumlah` = ?,`sourceType` = ?,`sourceId` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final BiayaEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindLong(2, entity.getTanggal());
        if (entity.getKebunId() == null) {
          statement.bindNull(3);
        } else {
          statement.bindLong(3, entity.getKebunId());
        }
        statement.bindString(4, entity.getKategori());
        statement.bindString(5, entity.getDeskripsi());
        statement.bindDouble(6, entity.getJumlah());
        statement.bindString(7, entity.getSourceType());
        statement.bindLong(8, entity.getSourceId());
        statement.bindLong(9, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteBySource = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM biaya WHERE sourceType = ? AND sourceId = ?";
        return _query;
      }
    };
  }

  @Override
  public Object insert(final BiayaEntity biaya, final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfBiayaEntity.insertAndReturnId(biaya);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object delete(final BiayaEntity biaya, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfBiayaEntity.handle(biaya);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object update(final BiayaEntity biaya, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfBiayaEntity.handle(biaya);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteBySource(final String sourceType, final long sourceId,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteBySource.acquire();
        int _argIndex = 1;
        _stmt.bindString(_argIndex, sourceType);
        _argIndex = 2;
        _stmt.bindLong(_argIndex, sourceId);
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfDeleteBySource.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<BiayaEntity>> getAll() {
    final String _sql = "SELECT * FROM biaya ORDER BY tanggal DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"biaya"}, new Callable<List<BiayaEntity>>() {
      @Override
      @NonNull
      public List<BiayaEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "tanggal");
          final int _cursorIndexOfKebunId = CursorUtil.getColumnIndexOrThrow(_cursor, "kebunId");
          final int _cursorIndexOfKategori = CursorUtil.getColumnIndexOrThrow(_cursor, "kategori");
          final int _cursorIndexOfDeskripsi = CursorUtil.getColumnIndexOrThrow(_cursor, "deskripsi");
          final int _cursorIndexOfJumlah = CursorUtil.getColumnIndexOrThrow(_cursor, "jumlah");
          final int _cursorIndexOfSourceType = CursorUtil.getColumnIndexOrThrow(_cursor, "sourceType");
          final int _cursorIndexOfSourceId = CursorUtil.getColumnIndexOrThrow(_cursor, "sourceId");
          final List<BiayaEntity> _result = new ArrayList<BiayaEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final BiayaEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final long _tmpTanggal;
            _tmpTanggal = _cursor.getLong(_cursorIndexOfTanggal);
            final Long _tmpKebunId;
            if (_cursor.isNull(_cursorIndexOfKebunId)) {
              _tmpKebunId = null;
            } else {
              _tmpKebunId = _cursor.getLong(_cursorIndexOfKebunId);
            }
            final String _tmpKategori;
            _tmpKategori = _cursor.getString(_cursorIndexOfKategori);
            final String _tmpDeskripsi;
            _tmpDeskripsi = _cursor.getString(_cursorIndexOfDeskripsi);
            final double _tmpJumlah;
            _tmpJumlah = _cursor.getDouble(_cursorIndexOfJumlah);
            final String _tmpSourceType;
            _tmpSourceType = _cursor.getString(_cursorIndexOfSourceType);
            final long _tmpSourceId;
            _tmpSourceId = _cursor.getLong(_cursorIndexOfSourceId);
            _item = new BiayaEntity(_tmpId,_tmpTanggal,_tmpKebunId,_tmpKategori,_tmpDeskripsi,_tmpJumlah,_tmpSourceType,_tmpSourceId);
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
  public Object getAllOnce(final Continuation<? super List<BiayaEntity>> $completion) {
    final String _sql = "SELECT * FROM biaya ORDER BY tanggal DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<BiayaEntity>>() {
      @Override
      @NonNull
      public List<BiayaEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "tanggal");
          final int _cursorIndexOfKebunId = CursorUtil.getColumnIndexOrThrow(_cursor, "kebunId");
          final int _cursorIndexOfKategori = CursorUtil.getColumnIndexOrThrow(_cursor, "kategori");
          final int _cursorIndexOfDeskripsi = CursorUtil.getColumnIndexOrThrow(_cursor, "deskripsi");
          final int _cursorIndexOfJumlah = CursorUtil.getColumnIndexOrThrow(_cursor, "jumlah");
          final int _cursorIndexOfSourceType = CursorUtil.getColumnIndexOrThrow(_cursor, "sourceType");
          final int _cursorIndexOfSourceId = CursorUtil.getColumnIndexOrThrow(_cursor, "sourceId");
          final List<BiayaEntity> _result = new ArrayList<BiayaEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final BiayaEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final long _tmpTanggal;
            _tmpTanggal = _cursor.getLong(_cursorIndexOfTanggal);
            final Long _tmpKebunId;
            if (_cursor.isNull(_cursorIndexOfKebunId)) {
              _tmpKebunId = null;
            } else {
              _tmpKebunId = _cursor.getLong(_cursorIndexOfKebunId);
            }
            final String _tmpKategori;
            _tmpKategori = _cursor.getString(_cursorIndexOfKategori);
            final String _tmpDeskripsi;
            _tmpDeskripsi = _cursor.getString(_cursorIndexOfDeskripsi);
            final double _tmpJumlah;
            _tmpJumlah = _cursor.getDouble(_cursorIndexOfJumlah);
            final String _tmpSourceType;
            _tmpSourceType = _cursor.getString(_cursorIndexOfSourceType);
            final long _tmpSourceId;
            _tmpSourceId = _cursor.getLong(_cursorIndexOfSourceId);
            _item = new BiayaEntity(_tmpId,_tmpTanggal,_tmpKebunId,_tmpKategori,_tmpDeskripsi,_tmpJumlah,_tmpSourceType,_tmpSourceId);
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
  public Object getBySource(final String sourceType, final long sourceId,
      final Continuation<? super BiayaEntity> $completion) {
    final String _sql = "SELECT * FROM biaya WHERE sourceType = ? AND sourceId = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 2);
    int _argIndex = 1;
    _statement.bindString(_argIndex, sourceType);
    _argIndex = 2;
    _statement.bindLong(_argIndex, sourceId);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<BiayaEntity>() {
      @Override
      @Nullable
      public BiayaEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "tanggal");
          final int _cursorIndexOfKebunId = CursorUtil.getColumnIndexOrThrow(_cursor, "kebunId");
          final int _cursorIndexOfKategori = CursorUtil.getColumnIndexOrThrow(_cursor, "kategori");
          final int _cursorIndexOfDeskripsi = CursorUtil.getColumnIndexOrThrow(_cursor, "deskripsi");
          final int _cursorIndexOfJumlah = CursorUtil.getColumnIndexOrThrow(_cursor, "jumlah");
          final int _cursorIndexOfSourceType = CursorUtil.getColumnIndexOrThrow(_cursor, "sourceType");
          final int _cursorIndexOfSourceId = CursorUtil.getColumnIndexOrThrow(_cursor, "sourceId");
          final BiayaEntity _result;
          if (_cursor.moveToFirst()) {
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final long _tmpTanggal;
            _tmpTanggal = _cursor.getLong(_cursorIndexOfTanggal);
            final Long _tmpKebunId;
            if (_cursor.isNull(_cursorIndexOfKebunId)) {
              _tmpKebunId = null;
            } else {
              _tmpKebunId = _cursor.getLong(_cursorIndexOfKebunId);
            }
            final String _tmpKategori;
            _tmpKategori = _cursor.getString(_cursorIndexOfKategori);
            final String _tmpDeskripsi;
            _tmpDeskripsi = _cursor.getString(_cursorIndexOfDeskripsi);
            final double _tmpJumlah;
            _tmpJumlah = _cursor.getDouble(_cursorIndexOfJumlah);
            final String _tmpSourceType;
            _tmpSourceType = _cursor.getString(_cursorIndexOfSourceType);
            final long _tmpSourceId;
            _tmpSourceId = _cursor.getLong(_cursorIndexOfSourceId);
            _result = new BiayaEntity(_tmpId,_tmpTanggal,_tmpKebunId,_tmpKategori,_tmpDeskripsi,_tmpJumlah,_tmpSourceType,_tmpSourceId);
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
