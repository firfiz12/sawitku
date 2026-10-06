package com.sawitku.app.data.sync

import android.content.Context
import android.util.Log
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.sawitku.app.SawitkuAppProvider
import com.sawitku.app.data.local.entity.SyncStatus
import com.sawitku.app.data.remote.AuthRepository
import com.sawitku.app.data.remote.SupabaseDataSource
import java.util.concurrent.TimeUnit

private const val TAG = "SyncWorker"
private const val WORK_NAME = "sawitku_periodic_sync"

/**
 * WorkManager worker untuk sinkronisasi offline-first:
 *
 * Proses:
 * 1. PUSH: Upload semua data lokal ber-status PENDING ke Supabase (upsert)
 * 2. PULL: Download perubahan dari Supabase sejak sinkronisasi terakhir
 * 3. Perbarui syncStatus lokal menjadi SYNCED setelah berhasil
 *
 * Worker ini hanya berjalan ketika ada koneksi internet.
 * Dijadwalkan periodik setiap 15 menit.
 */
class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    private val app = SawitkuAppProvider.app
    private val repository = app.repository
    private val authRepository = AuthRepository()
    private val remoteSource = SupabaseDataSource()
    private val prefs = app.getSharedPreferences("sync_prefs", Context.MODE_PRIVATE)

    override suspend fun doWork(): Result {
        val userId = authRepository.currentUserId()
        if (userId == null) {
            Log.d(TAG, "User belum login, sync dilewati.")
            return Result.success()
        }

        Log.i(TAG, "Mulai sinkronisasi untuk user: $userId")

        return try {
            // === FASE 1: PUSH — upload data PENDING ke Supabase ===
            pushPendingData(userId)

            // === FASE 2: PULL — ambil perubahan dari Supabase ===
            val lastSync = prefs.getLong(KEY_LAST_SYNC, 0L)
            pullRemoteChanges(userId, lastSync)

            // Simpan timestamp sinkronisasi terakhir
            prefs.edit().putLong(KEY_LAST_SYNC, System.currentTimeMillis()).apply()

            Log.i(TAG, "Sinkronisasi selesai.")
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Sinkronisasi gagal", e)
            Result.retry()
        }
    }

    // ================================
    // PUSH: Upload data PENDING
    // ================================

    private suspend fun pushPendingData(userId: String) {
        // Push kebun
        val pendingKebun = repository.getPendingSyncKebun()
        for (kebun in pendingKebun) {
            val ok = remoteSource.upsertKebun(kebun, userId)
            if (ok) {
                repository.updateKebun(kebun.copy(syncStatus = SyncStatus.SYNCED))
                Log.d(TAG, "Push kebun OK: ${kebun.id}")
            } else {
                repository.updateKebun(kebun.copy(syncStatus = SyncStatus.FAILED))
            }
        }

        // Push panen
        val pendingPanen = repository.getPendingSyncPanen()
        for (panen in pendingPanen) {
            val ok = remoteSource.upsertPanen(panen, userId)
            if (ok) {
                repository.updatePanen(panen.copy(syncStatus = SyncStatus.SYNCED))
                Log.d(TAG, "Push panen OK: ${panen.id}")
            } else {
                repository.updatePanen(panen.copy(syncStatus = SyncStatus.FAILED))
            }
        }

        // Push perawatan
        val pendingPerawatan = repository.getPendingSyncPerawatan()
        for (perawatan in pendingPerawatan) {
            val ok = remoteSource.upsertPerawatan(perawatan, userId)
            if (ok) {
                repository.updatePerawatan(perawatan.copy(syncStatus = SyncStatus.SYNCED))
                Log.d(TAG, "Push perawatan OK: ${perawatan.id}")
            } else {
                repository.updatePerawatan(perawatan.copy(syncStatus = SyncStatus.FAILED))
            }
        }

        // Push biaya MANDIRI saja (PERAWATAN/PANEN dihitung via VIEW di Supabase)
        val pendingBiaya = repository.getPendingSyncBiaya()
        for (biaya in pendingBiaya.filter { it.sourceType == "MANDIRI" }) {
            val ok = remoteSource.upsertPengeluaranLain(biaya, userId)
            if (ok) {
                repository.updateBiaya(biaya.copy(syncStatus = SyncStatus.SYNCED))
                Log.d(TAG, "Push pengeluaran_lain OK: ${biaya.id}")
            } else {
                repository.updateBiaya(biaya.copy(syncStatus = SyncStatus.FAILED))
            }
        }

        // Tandai PERAWATAN/PANEN biaya sebagai SYNCED (tidak perlu upload, hanya lokal)
        val derivedBiaya = pendingBiaya.filter { it.sourceType != "MANDIRI" }
        for (biaya in derivedBiaya) {
            repository.updateBiaya(biaya.copy(syncStatus = SyncStatus.SYNCED))
        }
    }

    // ================================
    // PULL: Download remote changes
    // ================================

    private suspend fun pullRemoteChanges(userId: String, lastSync: Long) {
        // Pull kebun
        val remoteKebun = remoteSource.fetchKebunSince(userId, lastSync)
        for (kebun in remoteKebun) {
            val local = repository.getKebunByIdIncludingDeleted(kebun.id)
            if (local == null) {
                // Data baru dari device lain — insert lokal
                repository.insertKebun(kebun)
            } else if (kebun.updatedAt > local.updatedAt) {
                // Remote lebih baru — update lokal (remote menang)
                repository.updateKebun(kebun)
            }
            // Jika lokal lebih baru (PENDING), biarkan — akan di-push di siklus berikut
        }

        // Pull panen
        val remotePanen = remoteSource.fetchPanenSince(userId, lastSync)
        for (panen in remotePanen) {
            val local = repository.getPanenByIdIncludingDeleted(panen.id)
            if (local == null) {
                repository.insertPanen(panen)
            } else if (panen.updatedAt > local.updatedAt) {
                repository.updatePanen(panen)
            }
        }

        // Pull perawatan
        val remotePerawatan = remoteSource.fetchPerawatanSince(userId, lastSync)
        for (perawatan in remotePerawatan) {
            val local = repository.getPerawatanByIdIncludingDeleted(perawatan.id)
            if (local == null) {
                repository.insertPerawatan(perawatan)
            } else if (perawatan.updatedAt > local.updatedAt) {
                repository.updatePerawatan(perawatan)
            }
        }

        // Pull pengeluaran lain
        val remoteBiaya = remoteSource.fetchPengeluaranLainSince(userId, lastSync)
        for (biaya in remoteBiaya) {
            val local = repository.getBiayaByIdIncludingDeleted(biaya.id)
            if (local == null) {
                repository.insertBiaya(biaya)
            } else if (biaya.updatedAt > local.updatedAt) {
                repository.updateBiaya(biaya)
            }
        }
    }

    companion object {
        private const val KEY_LAST_SYNC = "last_sync_epoch"

        /**
         * Jadwalkan sinkronisasi periodik setiap 15 menit (minimum WorkManager).
         * Hanya berjalan ketika ada koneksi internet.
         * Gunakan KEEP agar jadwal existing tidak diganti jika sudah ada.
         */
        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val workRequest = PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                workRequest
            )

            Log.i(TAG, "SyncWorker dijadwalkan (periodik 15 menit).")
        }

        /**
         * Jalankan sinkronisasi segera (one-shot), misalnya setelah login.
         * Tetap memerlukan koneksi internet.
         */
        fun runNow(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val workRequest = androidx.work.OneTimeWorkRequestBuilder<SyncWorker>()
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueue(workRequest)
            Log.i(TAG, "SyncWorker dijadwalkan untuk jalan segera.")
        }

        /** Reset timestamp sinkronisasi terakhir (untuk full sync ulang). */
        fun resetLastSync(context: Context) {
            context.getSharedPreferences("sync_prefs", Context.MODE_PRIVATE)
                .edit().remove("last_sync_epoch").apply()
        }
    }
}
