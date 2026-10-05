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
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.sawitku.app.data.local.entity.KebunEntity;
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
public final class KebunDao_Impl implements KebunDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<KebunEntity> __insertionAdapterOfKebunEntity;

  private final EntityDeletionOrUpdateAdapter<KebunEntity> __deletionAdapterOfKebunEntity;

  private final EntityDeletionOrUpdateAdapter<KebunEntity> __updateAdapterOfKebunEntity;

  public KebunDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfKebunEntity = new EntityInsertionAdapter<KebunEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `kebun` (`id`,`nama`,`luasHa`,`jumlahPohon`,`keterangan`,`rotasiPanenHari`,`tanggalPanenTerakhir`) VALUES (nullif(?, 0),?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final KebunEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getNama());
        statement.bindDouble(3, entity.getLuasHa());
        statement.bindLong(4, entity.getJumlahPohon());
        statement.bindString(5, entity.getKeterangan());
        statement.bindLong(6, entity.getRotasiPanenHari());
        statement.bindLong(7, entity.getTanggalPanenTerakhir());
      }
    };
    this.__deletionAdapterOfKebunEntity = new EntityDeletionOrUpdateAdapter<KebunEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `kebun` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final KebunEntity entity) {
        statement.bindLong(1, entity.getId());
      }
    };
    this.__updateAdapterOfKebunEntity = new EntityDeletionOrUpdateAdapter<KebunEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `kebun` SET `id` = ?,`nama` = ?,`luasHa` = ?,`jumlahPohon` = ?,`keterangan` = ?,`rotasiPanenHari` = ?,`tanggalPanenTerakhir` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final KebunEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getNama());
        statement.bindDouble(3, entity.getLuasHa());
        statement.bindLong(4, entity.getJumlahPohon());
        statement.bindString(5, entity.getKeterangan());
        statement.bindLong(6, entity.getRotasiPanenHari());
        statement.bindLong(7, entity.getTanggalPanenTerakhir());
        statement.bindLong(8, entity.getId());
      }
    };
  }

  @Override
  public Object insert(final KebunEntity kebun, final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfKebunEntity.insertAndReturnId(kebun);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object delete(final KebunEntity kebun, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfKebunEntity.handle(kebun);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object update(final KebunEntity kebun, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfKebunEntity.handle(kebun);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<KebunEntity>> getAll() {
    final String _sql = "SELECT * FROM kebun ORDER BY nama ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"kebun"}, new Callable<List<KebunEntity>>() {
      @Override
      @NonNull
      public List<KebunEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfNama = CursorUtil.getColumnIndexOrThrow(_cursor, "nama");
          final int _cursorIndexOfLuasHa = CursorUtil.getColumnIndexOrThrow(_cursor, "luasHa");
          final int _cursorIndexOfJumlahPohon = CursorUtil.getColumnIndexOrThrow(_cursor, "jumlahPohon");
          final int _cursorIndexOfKeterangan = CursorUtil.getColumnIndexOrThrow(_cursor, "keterangan");
          final int _cursorIndexOfRotasiPanenHari = CursorUtil.getColumnIndexOrThrow(_cursor, "rotasiPanenHari");
          final int _cursorIndexOfTanggalPanenTerakhir = CursorUtil.getColumnIndexOrThrow(_cursor, "tanggalPanenTerakhir");
          final List<KebunEntity> _result = new ArrayList<KebunEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final KebunEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpNama;
            _tmpNama = _cursor.getString(_cursorIndexOfNama);
            final double _tmpLuasHa;
            _tmpLuasHa = _cursor.getDouble(_cursorIndexOfLuasHa);
            final int _tmpJumlahPohon;
            _tmpJumlahPohon = _cursor.getInt(_cursorIndexOfJumlahPohon);
            final String _tmpKeterangan;
            _tmpKeterangan = _cursor.getString(_cursorIndexOfKeterangan);
            final int _tmpRotasiPanenHari;
            _tmpRotasiPanenHari = _cursor.getInt(_cursorIndexOfRotasiPanenHari);
            final long _tmpTanggalPanenTerakhir;
            _tmpTanggalPanenTerakhir = _cursor.getLong(_cursorIndexOfTanggalPanenTerakhir);
            _item = new KebunEntity(_tmpId,_tmpNama,_tmpLuasHa,_tmpJumlahPohon,_tmpKeterangan,_tmpRotasiPanenHari,_tmpTanggalPanenTerakhir);
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
  public Object getById(final long id, final Continuation<? super KebunEntity> $completion) {
    final String _sql = "SELECT * FROM kebun WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<KebunEntity>() {
      @Override
      @Nullable
      public KebunEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfNama = CursorUtil.getColumnIndexOrThrow(_cursor, "nama");
          final int _cursorIndexOfLuasHa = CursorUtil.getColumnIndexOrThrow(_cursor, "luasHa");
          final int _cursorIndexOfJumlahPohon = CursorUtil.getColumnIndexOrThrow(_cursor, "jumlahPohon");
          final int _cursorIndexOfKeterangan = CursorUtil.getColumnIndexOrThrow(_cursor, "keterangan");
          final int _cursorIndexOfRotasiPanenHari = CursorUtil.getColumnIndexOrThrow(_cursor, "rotasiPanenHari");
          final int _cursorIndexOfTanggalPanenTerakhir = CursorUtil.getColumnIndexOrThrow(_cursor, "tanggalPanenTerakhir");
          final KebunEntity _result;
          if (_cursor.moveToFirst()) {
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpNama;
            _tmpNama = _cursor.getString(_cursorIndexOfNama);
            final double _tmpLuasHa;
            _tmpLuasHa = _cursor.getDouble(_cursorIndexOfLuasHa);
            final int _tmpJumlahPohon;
            _tmpJumlahPohon = _cursor.getInt(_cursorIndexOfJumlahPohon);
            final String _tmpKeterangan;
            _tmpKeterangan = _cursor.getString(_cursorIndexOfKeterangan);
            final int _tmpRotasiPanenHari;
            _tmpRotasiPanenHari = _cursor.getInt(_cursorIndexOfRotasiPanenHari);
            final long _tmpTanggalPanenTerakhir;
            _tmpTanggalPanenTerakhir = _cursor.getLong(_cursorIndexOfTanggalPanenTerakhir);
            _result = new KebunEntity(_tmpId,_tmpNama,_tmpLuasHa,_tmpJumlahPohon,_tmpKeterangan,_tmpRotasiPanenHari,_tmpTanggalPanenTerakhir);
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
