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
import com.sawitku.app.data.local.entity.PanenEntity;
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
public final class PanenDao_Impl implements PanenDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<PanenEntity> __insertionAdapterOfPanenEntity;

  private final EntityDeletionOrUpdateAdapter<PanenEntity> __deletionAdapterOfPanenEntity;

  private final EntityDeletionOrUpdateAdapter<PanenEntity> __updateAdapterOfPanenEntity;

  public PanenDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfPanenEntity = new EntityInsertionAdapter<PanenEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `panen` (`id`,`tanggal`,`kebunId`,`beratKg`,`hargaPerKg`,`beratBrondolanKg`,`hargaBrondolanPerKg`,`pendapatanBrondolan`,`pendapatan`,`biayaProduksi`,`keterangan`,`reminderEnabled`,`reminderTanggal`) VALUES (nullif(?, 0),?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PanenEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindLong(2, entity.getTanggal());
        statement.bindLong(3, entity.getKebunId());
        statement.bindDouble(4, entity.getBeratKg());
        statement.bindDouble(5, entity.getHargaPerKg());
        statement.bindDouble(6, entity.getBeratBrondolanKg());
        statement.bindDouble(7, entity.getHargaBrondolanPerKg());
        statement.bindDouble(8, entity.getPendapatanBrondolan());
        statement.bindDouble(9, entity.getPendapatan());
        statement.bindDouble(10, entity.getBiayaProduksi());
        statement.bindString(11, entity.getKeterangan());
        final int _tmp = entity.getReminderEnabled() ? 1 : 0;
        statement.bindLong(12, _tmp);
        statement.bindLong(13, entity.getReminderTanggal());
      }
    };
    this.__deletionAdapterOfPanenEntity = new EntityDeletionOrUpdateAdapter<PanenEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `panen` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PanenEntity entity) {
        statement.bindLong(1, entity.getId());
      }
    };
    this.__updateAdapterOfPanenEntity = new EntityDeletionOrUpdateAdapter<PanenEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `panen` SET `id` = ?,`tanggal` = ?,`kebunId` = ?,`beratKg` = ?,`hargaPerKg` = ?,`beratBrondolanKg` = ?,`hargaBrondolanPerKg` = ?,`pendapatanBrondolan` = ?,`pendapatan` = ?,`biayaProduksi` = ?,`keterangan` = ?,`reminderEnabled` = ?,`reminderTanggal` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PanenEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindLong(2, entity.getTanggal());
        statement.bindLong(3, entity.getKebunId());
        statement.bindDouble(4, entity.getBeratKg());
        statement.bindDouble(5, entity.getHargaPerKg());
        statement.bindDouble(6, entity.getBeratBrondolanKg());
        statement.bindDouble(7, entity.getHargaBrondolanPerKg());
        statement.bindDouble(8, entity.getPendapatanBrondolan());
        statement.bindDouble(9, entity.getPendapatan());
        statement.bindDouble(10, entity.getBiayaProduksi());
        statement.bindString(11, entity.getKeterangan());
        final int _tmp = entity.getReminderEnabled() ? 1 : 0;
        statement.bindLong(12, _tmp);
        statement.bindLong(13, entity.getReminderTanggal());
        statement.bindLong(14, entity.getId());
      }
    };
  }

  @Override
  public Object insert(final PanenEntity panen, final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfPanenEntity.insertAndReturnId(panen);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object delete(final PanenEntity panen, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfPanenEntity.handle(panen);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object update(final PanenEntity panen, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfPanenEntity.handle(panen);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<PanenEntity>> getAll() {
    final String _sql = "SELECT * FROM panen ORDER BY tanggal DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"panen"}, new Callable<List<PanenEntity>>() {
      @Override
      @NonNull
      public List<PanenEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "tanggal");
          final int _cursorIndexOfKebunId = CursorUtil.getColumnIndexOrThrow(_cursor, "kebunId");
          final int _cursorIndexOfBeratKg = CursorUtil.getColumnIndexOrThrow(_cursor, "beratKg");
          final int _cursorIndexOfHargaPerKg = CursorUtil.getColumnIndexOrThrow(_cursor, "hargaPerKg");
          final int _cursorIndexOfBeratBrondolanKg = CursorUtil.getColumnIndexOrThrow(_cursor, "beratBrondolanKg");
          final int _cursorIndexOfHargaBrondolanPerKg = CursorUtil.getColumnIndexOrThrow(_cursor, "hargaBrondolanPerKg");
          final int _cursorIndexOfPendapatanBrondolan = CursorUtil.getColumnIndexOrThrow(_cursor, "pendapatanBrondolan");
          final int _cursorIndexOfPendapatan = CursorUtil.getColumnIndexOrThrow(_cursor, "pendapatan");
          final int _cursorIndexOfBiayaProduksi = CursorUtil.getColumnIndexOrThrow(_cursor, "biayaProduksi");
          final int _cursorIndexOfKeterangan = CursorUtil.getColumnIndexOrThrow(_cursor, "keterangan");
          final int _cursorIndexOfReminderEnabled = CursorUtil.getColumnIndexOrThrow(_cursor, "reminderEnabled");
          final int _cursorIndexOfReminderTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "reminderTanggal");
          final List<PanenEntity> _result = new ArrayList<PanenEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PanenEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final long _tmpTanggal;
            _tmpTanggal = _cursor.getLong(_cursorIndexOfTanggal);
            final long _tmpKebunId;
            _tmpKebunId = _cursor.getLong(_cursorIndexOfKebunId);
            final double _tmpBeratKg;
            _tmpBeratKg = _cursor.getDouble(_cursorIndexOfBeratKg);
            final double _tmpHargaPerKg;
            _tmpHargaPerKg = _cursor.getDouble(_cursorIndexOfHargaPerKg);
            final double _tmpBeratBrondolanKg;
            _tmpBeratBrondolanKg = _cursor.getDouble(_cursorIndexOfBeratBrondolanKg);
            final double _tmpHargaBrondolanPerKg;
            _tmpHargaBrondolanPerKg = _cursor.getDouble(_cursorIndexOfHargaBrondolanPerKg);
            final double _tmpPendapatanBrondolan;
            _tmpPendapatanBrondolan = _cursor.getDouble(_cursorIndexOfPendapatanBrondolan);
            final double _tmpPendapatan;
            _tmpPendapatan = _cursor.getDouble(_cursorIndexOfPendapatan);
            final double _tmpBiayaProduksi;
            _tmpBiayaProduksi = _cursor.getDouble(_cursorIndexOfBiayaProduksi);
            final String _tmpKeterangan;
            _tmpKeterangan = _cursor.getString(_cursorIndexOfKeterangan);
            final boolean _tmpReminderEnabled;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfReminderEnabled);
            _tmpReminderEnabled = _tmp != 0;
            final long _tmpReminderTanggal;
            _tmpReminderTanggal = _cursor.getLong(_cursorIndexOfReminderTanggal);
            _item = new PanenEntity(_tmpId,_tmpTanggal,_tmpKebunId,_tmpBeratKg,_tmpHargaPerKg,_tmpBeratBrondolanKg,_tmpHargaBrondolanPerKg,_tmpPendapatanBrondolan,_tmpPendapatan,_tmpBiayaProduksi,_tmpKeterangan,_tmpReminderEnabled,_tmpReminderTanggal);
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
  public Object getAllOnce(final Continuation<? super List<PanenEntity>> $completion) {
    final String _sql = "SELECT * FROM panen ORDER BY tanggal DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<PanenEntity>>() {
      @Override
      @NonNull
      public List<PanenEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "tanggal");
          final int _cursorIndexOfKebunId = CursorUtil.getColumnIndexOrThrow(_cursor, "kebunId");
          final int _cursorIndexOfBeratKg = CursorUtil.getColumnIndexOrThrow(_cursor, "beratKg");
          final int _cursorIndexOfHargaPerKg = CursorUtil.getColumnIndexOrThrow(_cursor, "hargaPerKg");
          final int _cursorIndexOfBeratBrondolanKg = CursorUtil.getColumnIndexOrThrow(_cursor, "beratBrondolanKg");
          final int _cursorIndexOfHargaBrondolanPerKg = CursorUtil.getColumnIndexOrThrow(_cursor, "hargaBrondolanPerKg");
          final int _cursorIndexOfPendapatanBrondolan = CursorUtil.getColumnIndexOrThrow(_cursor, "pendapatanBrondolan");
          final int _cursorIndexOfPendapatan = CursorUtil.getColumnIndexOrThrow(_cursor, "pendapatan");
          final int _cursorIndexOfBiayaProduksi = CursorUtil.getColumnIndexOrThrow(_cursor, "biayaProduksi");
          final int _cursorIndexOfKeterangan = CursorUtil.getColumnIndexOrThrow(_cursor, "keterangan");
          final int _cursorIndexOfReminderEnabled = CursorUtil.getColumnIndexOrThrow(_cursor, "reminderEnabled");
          final int _cursorIndexOfReminderTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "reminderTanggal");
          final List<PanenEntity> _result = new ArrayList<PanenEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PanenEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final long _tmpTanggal;
            _tmpTanggal = _cursor.getLong(_cursorIndexOfTanggal);
            final long _tmpKebunId;
            _tmpKebunId = _cursor.getLong(_cursorIndexOfKebunId);
            final double _tmpBeratKg;
            _tmpBeratKg = _cursor.getDouble(_cursorIndexOfBeratKg);
            final double _tmpHargaPerKg;
            _tmpHargaPerKg = _cursor.getDouble(_cursorIndexOfHargaPerKg);
            final double _tmpBeratBrondolanKg;
            _tmpBeratBrondolanKg = _cursor.getDouble(_cursorIndexOfBeratBrondolanKg);
            final double _tmpHargaBrondolanPerKg;
            _tmpHargaBrondolanPerKg = _cursor.getDouble(_cursorIndexOfHargaBrondolanPerKg);
            final double _tmpPendapatanBrondolan;
            _tmpPendapatanBrondolan = _cursor.getDouble(_cursorIndexOfPendapatanBrondolan);
            final double _tmpPendapatan;
            _tmpPendapatan = _cursor.getDouble(_cursorIndexOfPendapatan);
            final double _tmpBiayaProduksi;
            _tmpBiayaProduksi = _cursor.getDouble(_cursorIndexOfBiayaProduksi);
            final String _tmpKeterangan;
            _tmpKeterangan = _cursor.getString(_cursorIndexOfKeterangan);
            final boolean _tmpReminderEnabled;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfReminderEnabled);
            _tmpReminderEnabled = _tmp != 0;
            final long _tmpReminderTanggal;
            _tmpReminderTanggal = _cursor.getLong(_cursorIndexOfReminderTanggal);
            _item = new PanenEntity(_tmpId,_tmpTanggal,_tmpKebunId,_tmpBeratKg,_tmpHargaPerKg,_tmpBeratBrondolanKg,_tmpHargaBrondolanPerKg,_tmpPendapatanBrondolan,_tmpPendapatan,_tmpBiayaProduksi,_tmpKeterangan,_tmpReminderEnabled,_tmpReminderTanggal);
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
  public Flow<List<PanenEntity>> getByKebun(final long kebunId) {
    final String _sql = "SELECT * FROM panen WHERE kebunId = ? ORDER BY tanggal DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, kebunId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"panen"}, new Callable<List<PanenEntity>>() {
      @Override
      @NonNull
      public List<PanenEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "tanggal");
          final int _cursorIndexOfKebunId = CursorUtil.getColumnIndexOrThrow(_cursor, "kebunId");
          final int _cursorIndexOfBeratKg = CursorUtil.getColumnIndexOrThrow(_cursor, "beratKg");
          final int _cursorIndexOfHargaPerKg = CursorUtil.getColumnIndexOrThrow(_cursor, "hargaPerKg");
          final int _cursorIndexOfBeratBrondolanKg = CursorUtil.getColumnIndexOrThrow(_cursor, "beratBrondolanKg");
          final int _cursorIndexOfHargaBrondolanPerKg = CursorUtil.getColumnIndexOrThrow(_cursor, "hargaBrondolanPerKg");
          final int _cursorIndexOfPendapatanBrondolan = CursorUtil.getColumnIndexOrThrow(_cursor, "pendapatanBrondolan");
          final int _cursorIndexOfPendapatan = CursorUtil.getColumnIndexOrThrow(_cursor, "pendapatan");
          final int _cursorIndexOfBiayaProduksi = CursorUtil.getColumnIndexOrThrow(_cursor, "biayaProduksi");
          final int _cursorIndexOfKeterangan = CursorUtil.getColumnIndexOrThrow(_cursor, "keterangan");
          final int _cursorIndexOfReminderEnabled = CursorUtil.getColumnIndexOrThrow(_cursor, "reminderEnabled");
          final int _cursorIndexOfReminderTanggal = CursorUtil.getColumnIndexOrThrow(_cursor, "reminderTanggal");
          final List<PanenEntity> _result = new ArrayList<PanenEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PanenEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final long _tmpTanggal;
            _tmpTanggal = _cursor.getLong(_cursorIndexOfTanggal);
            final long _tmpKebunId;
            _tmpKebunId = _cursor.getLong(_cursorIndexOfKebunId);
            final double _tmpBeratKg;
            _tmpBeratKg = _cursor.getDouble(_cursorIndexOfBeratKg);
            final double _tmpHargaPerKg;
            _tmpHargaPerKg = _cursor.getDouble(_cursorIndexOfHargaPerKg);
            final double _tmpBeratBrondolanKg;
            _tmpBeratBrondolanKg = _cursor.getDouble(_cursorIndexOfBeratBrondolanKg);
            final double _tmpHargaBrondolanPerKg;
            _tmpHargaBrondolanPerKg = _cursor.getDouble(_cursorIndexOfHargaBrondolanPerKg);
            final double _tmpPendapatanBrondolan;
            _tmpPendapatanBrondolan = _cursor.getDouble(_cursorIndexOfPendapatanBrondolan);
            final double _tmpPendapatan;
            _tmpPendapatan = _cursor.getDouble(_cursorIndexOfPendapatan);
            final double _tmpBiayaProduksi;
            _tmpBiayaProduksi = _cursor.getDouble(_cursorIndexOfBiayaProduksi);
            final String _tmpKeterangan;
            _tmpKeterangan = _cursor.getString(_cursorIndexOfKeterangan);
            final boolean _tmpReminderEnabled;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfReminderEnabled);
            _tmpReminderEnabled = _tmp != 0;
            final long _tmpReminderTanggal;
            _tmpReminderTanggal = _cursor.getLong(_cursorIndexOfReminderTanggal);
            _item = new PanenEntity(_tmpId,_tmpTanggal,_tmpKebunId,_tmpBeratKg,_tmpHargaPerKg,_tmpBeratBrondolanKg,_tmpHargaBrondolanPerKg,_tmpPendapatanBrondolan,_tmpPendapatan,_tmpBiayaProduksi,_tmpKeterangan,_tmpReminderEnabled,_tmpReminderTanggal);
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
