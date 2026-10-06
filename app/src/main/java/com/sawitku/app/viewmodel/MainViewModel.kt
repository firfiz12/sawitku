package com.sawitku.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.sawitku.app.SawitkuAppProvider
import com.sawitku.app.data.local.entity.BiayaEntity
import com.sawitku.app.data.local.entity.KebunEntity
import com.sawitku.app.data.local.entity.PanenEntity
import com.sawitku.app.data.local.entity.PerawatanEntity
import com.sawitku.app.data.local.entity.SyncStatus
import com.sawitku.app.data.repository.SawitRepository
import com.sawitku.app.notification.ReminderScheduler
import com.sawitku.app.util.Formatters
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainViewModel(
    application: Application,
    private val repository: SawitRepository
) : AndroidViewModel(application) {

    val kebunList: StateFlow<List<KebunEntity>> = repository.getAllKebun()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val perawatanList: StateFlow<List<PerawatanEntity>> = repository.getAllPerawatan()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val panenList: StateFlow<List<PanenEntity>> = repository.getAllPanen()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val biayaList: StateFlow<List<BiayaEntity>> = repository.getAllBiaya()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        // Auto sync all existing perawatan & panen expenses on app startup
        syncExistingExpenses()
    }

    private fun syncExistingExpenses() {
        viewModelScope.launch {
            val allPerawatan = repository.getAllPerawatanOnce()
            for (p in allPerawatan) {
                if (p.biaya > 0) {
                    val existing = repository.getBiayaBySource("PERAWATAN", p.id)
                    val kategoriDesc = formatPerawatanKategori(p)
                    if (existing == null) {
                        repository.insertBiaya(
                            BiayaEntity(
                                tanggal = p.tanggal,
                                kebunId = p.kebunId,
                                kategori = kategoriDesc,
                                deskripsi = p.deskripsi.ifBlank { "Biaya perawatan: ${p.jenis}" },
                                jumlah = p.biaya,
                                sourceType = "PERAWATAN",
                                sourceId = p.id,
                                updatedAt = System.currentTimeMillis(),
                                syncStatus = SyncStatus.PENDING,
                                isDeleted = false
                            )
                        )
                    } else if (existing.jumlah != p.biaya || existing.tanggal != p.tanggal || existing.kebunId != p.kebunId || existing.kategori != kategoriDesc) {
                        repository.updateBiaya(
                            existing.copy(
                                tanggal = p.tanggal,
                                kebunId = p.kebunId,
                                kategori = kategoriDesc,
                                deskripsi = p.deskripsi.ifBlank { existing.deskripsi },
                                jumlah = p.biaya,
                                updatedAt = System.currentTimeMillis(),
                                syncStatus = SyncStatus.PENDING
                            )
                        )
                    }
                } else {
                    repository.deleteBiayaBySource("PERAWATAN", p.id)
                }
            }

            val allPanen = repository.getAllPanenOnce()
            for (pn in allPanen) {
                if (pn.biayaProduksi > 0) {
                    val existing = repository.getBiayaBySource("PANEN", pn.id)
                    if (existing == null) {
                        repository.insertBiaya(
                            BiayaEntity(
                                tanggal = pn.tanggal,
                                kebunId = pn.kebunId,
                                kategori = "Biaya Panen",
                                deskripsi = pn.keterangan.ifBlank { "Biaya produksi panen" },
                                jumlah = pn.biayaProduksi,
                                sourceType = "PANEN",
                                sourceId = pn.id,
                                updatedAt = System.currentTimeMillis(),
                                syncStatus = SyncStatus.PENDING,
                                isDeleted = false
                            )
                        )
                    } else if (existing.jumlah != pn.biayaProduksi || existing.tanggal != pn.tanggal || existing.kebunId != pn.kebunId) {
                        repository.updateBiaya(
                            existing.copy(
                                tanggal = pn.tanggal,
                                kebunId = pn.kebunId,
                                kategori = "Biaya Panen",
                                deskripsi = pn.keterangan.ifBlank { existing.deskripsi },
                                jumlah = pn.biayaProduksi,
                                updatedAt = System.currentTimeMillis(),
                                syncStatus = SyncStatus.PENDING
                            )
                        )
                    }
                } else {
                    repository.deleteBiayaBySource("PANEN", pn.id)
                }
            }
        }
    }

    private fun formatPerawatanKategori(p: PerawatanEntity): String {
        return when {
            p.jenis == "Pemupukan" && p.jenisPupuk.isNotBlank() -> "Perawatan: Pemupukan (${p.jenisPupuk})"
            p.jenis == "Penyemprotan" && p.jenisRacun.isNotBlank() -> "Perawatan: Penyemprotan (${p.jenisRacun})"
            else -> "Perawatan: ${p.jenis}"
        }
    }

    // Kebun Management
    fun saveKebun(kebun: KebunEntity, isEdit: Boolean) {
        viewModelScope.launch {
            val toSave = kebun.copy(
                updatedAt = System.currentTimeMillis(),
                syncStatus = SyncStatus.PENDING,
                isDeleted = false
            )
            if (isEdit) repository.updateKebun(toSave) else repository.insertKebun(toSave)
        }
    }

    fun deleteKebun(kebun: KebunEntity) {
        viewModelScope.launch { repository.deleteKebun(kebun) }
    }

    // Perawatan Management
    fun savePerawatan(perawatan: PerawatanEntity, isEdit: Boolean) {
        viewModelScope.launch {
            val context = getApplication<Application>().applicationContext
            val toSave = perawatan.copy(
                updatedAt = System.currentTimeMillis(),
                syncStatus = SyncStatus.PENDING,
                isDeleted = false
            )
            if (isEdit) {
                repository.updatePerawatan(toSave)
            } else {
                repository.insertPerawatan(toSave)
            }
            val savedId = toSave.id

            // Sync with Biaya
            val kategoriDesc = formatPerawatanKategori(toSave)
            val existingBiaya = repository.getBiayaBySource("PERAWATAN", savedId)

            if (toSave.biaya > 0) {
                if (existingBiaya != null) {
                    repository.updateBiaya(
                        existingBiaya.copy(
                            tanggal = toSave.tanggal,
                            kebunId = toSave.kebunId,
                            kategori = kategoriDesc,
                            deskripsi = toSave.deskripsi.ifBlank { "Biaya perawatan: ${toSave.jenis}" },
                            jumlah = toSave.biaya,
                            updatedAt = System.currentTimeMillis(),
                            syncStatus = SyncStatus.PENDING
                        )
                    )
                } else {
                    repository.insertBiaya(
                        BiayaEntity(
                            tanggal = toSave.tanggal,
                            kebunId = toSave.kebunId,
                            kategori = kategoriDesc,
                            deskripsi = toSave.deskripsi.ifBlank { "Biaya perawatan: ${toSave.jenis}" },
                            jumlah = toSave.biaya,
                            sourceType = "PERAWATAN",
                            sourceId = savedId,
                            updatedAt = System.currentTimeMillis(),
                            syncStatus = SyncStatus.PENDING,
                            isDeleted = false
                        )
                    )
                }
            } else if (existingBiaya != null) {
                repository.deleteBiaya(existingBiaya)
            }

            // Schedule reminder if enabled
            val reminderId = ReminderScheduler.getPerawatanReminderId(savedId)
            if (toSave.reminderEnabled && toSave.reminderTanggal > System.currentTimeMillis()) {
                val detail = if (toSave.jenisPupuk.isNotBlank()) " (${toSave.jenisPupuk})"
                else if (toSave.jenisRacun.isNotBlank()) " (${toSave.jenisRacun})"
                else ""
                ReminderScheduler.scheduleReminder(
                    context = context,
                    reminderId = reminderId,
                    triggerAtMillis = toSave.reminderTanggal,
                    title = "Jadwal Perawatan: ${toSave.jenis}",
                    message = "Waktunya melakukan ${toSave.jenis}$detail pada tanggal ${Formatters.formatDate(toSave.reminderTanggal)}"
                )
            } else {
                ReminderScheduler.cancelReminder(context, reminderId)
            }
        }
    }

    fun deletePerawatan(perawatan: PerawatanEntity) {
        viewModelScope.launch {
            val context = getApplication<Application>().applicationContext
            ReminderScheduler.cancelReminder(context, ReminderScheduler.getPerawatanReminderId(perawatan.id))
            repository.deleteBiayaBySource("PERAWATAN", perawatan.id)
            repository.deletePerawatan(perawatan)
        }
    }

    // Panen Management
    fun savePanen(panen: PanenEntity, isEdit: Boolean) {
        viewModelScope.launch {
            val context = getApplication<Application>().applicationContext
            val toSave = panen.copy(
                updatedAt = System.currentTimeMillis(),
                syncStatus = SyncStatus.PENDING,
                isDeleted = false
            )
            if (isEdit) {
                repository.updatePanen(toSave)
            } else {
                repository.insertPanen(toSave)
            }
            val savedId = toSave.id

            // Update tanggal panen terakhir di kebun
            val kebun = repository.getKebunById(toSave.kebunId)
            if (kebun != null && toSave.tanggal > kebun.tanggalPanenTerakhir) {
                repository.updateKebun(
                    kebun.copy(
                        tanggalPanenTerakhir = toSave.tanggal,
                        updatedAt = System.currentTimeMillis(),
                        syncStatus = SyncStatus.PENDING
                    )
                )
            }

            // Sync with Biaya for production cost
            val existingBiaya = repository.getBiayaBySource("PANEN", savedId)
            if (toSave.biayaProduksi > 0) {
                if (existingBiaya != null) {
                    repository.updateBiaya(
                        existingBiaya.copy(
                            tanggal = toSave.tanggal,
                            kebunId = toSave.kebunId,
                            kategori = "Biaya Panen",
                            deskripsi = toSave.keterangan.ifBlank { "Biaya produksi panen" },
                            jumlah = toSave.biayaProduksi,
                            updatedAt = System.currentTimeMillis(),
                            syncStatus = SyncStatus.PENDING
                        )
                    )
                } else {
                    repository.insertBiaya(
                        BiayaEntity(
                            tanggal = toSave.tanggal,
                            kebunId = toSave.kebunId,
                            kategori = "Biaya Panen",
                            deskripsi = toSave.keterangan.ifBlank { "Biaya produksi panen" },
                            jumlah = toSave.biayaProduksi,
                            sourceType = "PANEN",
                            sourceId = savedId,
                            updatedAt = System.currentTimeMillis(),
                            syncStatus = SyncStatus.PENDING,
                            isDeleted = false
                        )
                    )
                }
            } else if (existingBiaya != null) {
                repository.deleteBiaya(existingBiaya)
            }

            // Schedule reminder for next harvest
            val reminderId = ReminderScheduler.getPanenReminderId(savedId)
            if (toSave.reminderEnabled && toSave.reminderTanggal > System.currentTimeMillis()) {
                val kebunNama = kebun?.nama ?: "Kebun Sawit"
                ReminderScheduler.scheduleReminder(
                    context = context,
                    reminderId = reminderId,
                    triggerAtMillis = toSave.reminderTanggal,
                    title = "Jadwal Panen: $kebunNama",
                    message = "Waktunya panen berikutnya untuk $kebunNama pada tanggal ${Formatters.formatDate(toSave.reminderTanggal)}"
                )
            } else {
                ReminderScheduler.cancelReminder(context, reminderId)
            }
        }
    }

    fun deletePanen(panen: PanenEntity) {
        viewModelScope.launch {
            val context = getApplication<Application>().applicationContext
            ReminderScheduler.cancelReminder(context, ReminderScheduler.getPanenReminderId(panen.id))
            repository.deleteBiayaBySource("PANEN", panen.id)
            repository.deletePanen(panen)
        }
    }

    // Biaya Mandiri
    fun saveBiaya(biaya: BiayaEntity, isEdit: Boolean) {
        viewModelScope.launch {
            val baseItem = if (biaya.sourceType.isBlank()) biaya.copy(sourceType = "MANDIRI") else biaya
            val itemToSave = baseItem.copy(
                updatedAt = System.currentTimeMillis(),
                syncStatus = SyncStatus.PENDING,
                isDeleted = false
            )
            if (isEdit) repository.updateBiaya(itemToSave) else repository.insertBiaya(itemToSave)
        }
    }

    fun deleteBiaya(biaya: BiayaEntity) {
        viewModelScope.launch { repository.deleteBiaya(biaya) }
    }

    class Factory : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            val app = SawitkuAppProvider.app
            return MainViewModel(app, app.repository) as T
        }
    }
}
