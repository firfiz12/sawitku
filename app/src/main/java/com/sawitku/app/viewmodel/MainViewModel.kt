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
                                sourceId = p.id
                            )
                        )
                    } else if (existing.jumlah != p.biaya || existing.tanggal != p.tanggal || existing.kebunId != p.kebunId || existing.kategori != kategoriDesc) {
                        repository.updateBiaya(
                            existing.copy(
                                tanggal = p.tanggal,
                                kebunId = p.kebunId,
                                kategori = kategoriDesc,
                                deskripsi = p.deskripsi.ifBlank { existing.deskripsi },
                                jumlah = p.biaya
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
                                sourceId = pn.id
                            )
                        )
                    } else if (existing.jumlah != pn.biayaProduksi || existing.tanggal != pn.tanggal || existing.kebunId != pn.kebunId) {
                        repository.updateBiaya(
                            existing.copy(
                                tanggal = pn.tanggal,
                                kebunId = pn.kebunId,
                                kategori = "Biaya Panen",
                                deskripsi = pn.keterangan.ifBlank { existing.deskripsi },
                                jumlah = pn.biayaProduksi
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
            if (isEdit) repository.updateKebun(kebun) else repository.insertKebun(kebun)
        }
    }

    fun deleteKebun(kebun: KebunEntity) {
        viewModelScope.launch { repository.deleteKebun(kebun) }
    }

    // Perawatan Management
    fun savePerawatan(perawatan: PerawatanEntity, isEdit: Boolean) {
        viewModelScope.launch {
            val context = getApplication<Application>().applicationContext
            val savedId = if (isEdit) {
                repository.updatePerawatan(perawatan)
                perawatan.id
            } else {
                repository.insertPerawatan(perawatan)
            }

            // Sync with Biaya
            val kategoriDesc = formatPerawatanKategori(perawatan)
            val existingBiaya = repository.getBiayaBySource("PERAWATAN", savedId)

            if (perawatan.biaya > 0) {
                if (existingBiaya != null) {
                    repository.updateBiaya(
                        existingBiaya.copy(
                            tanggal = perawatan.tanggal,
                            kebunId = perawatan.kebunId,
                            kategori = kategoriDesc,
                            deskripsi = perawatan.deskripsi.ifBlank { "Biaya perawatan: ${perawatan.jenis}" },
                            jumlah = perawatan.biaya
                        )
                    )
                } else {
                    repository.insertBiaya(
                        BiayaEntity(
                            tanggal = perawatan.tanggal,
                            kebunId = perawatan.kebunId,
                            kategori = kategoriDesc,
                            deskripsi = perawatan.deskripsi.ifBlank { "Biaya perawatan: ${perawatan.jenis}" },
                            jumlah = perawatan.biaya,
                            sourceType = "PERAWATAN",
                            sourceId = savedId
                        )
                    )
                }
            } else if (existingBiaya != null) {
                repository.deleteBiaya(existingBiaya)
            }

            // Schedule reminder if enabled
            val reminderId = (100000 + savedId).toInt()
            if (perawatan.reminderEnabled && perawatan.reminderTanggal > System.currentTimeMillis()) {
                val detail = if (perawatan.jenisPupuk.isNotBlank()) " (${perawatan.jenisPupuk})"
                else if (perawatan.jenisRacun.isNotBlank()) " (${perawatan.jenisRacun})"
                else ""
                ReminderScheduler.scheduleReminder(
                    context = context,
                    reminderId = reminderId,
                    triggerAtMillis = perawatan.reminderTanggal,
                    title = "Jadwal Perawatan: ${perawatan.jenis}",
                    message = "Waktunya melakukan ${perawatan.jenis}$detail pada tanggal ${Formatters.formatDate(perawatan.reminderTanggal)}"
                )
            } else {
                ReminderScheduler.cancelReminder(context, reminderId)
            }
        }
    }

    fun deletePerawatan(perawatan: PerawatanEntity) {
        viewModelScope.launch {
            val context = getApplication<Application>().applicationContext
            ReminderScheduler.cancelReminder(context, (100000 + perawatan.id).toInt())
            repository.deleteBiayaBySource("PERAWATAN", perawatan.id)
            repository.deletePerawatan(perawatan)
        }
    }

    // Panen Management
    fun savePanen(panen: PanenEntity, isEdit: Boolean) {
        viewModelScope.launch {
            val context = getApplication<Application>().applicationContext
            val savedId = if (isEdit) {
                repository.updatePanen(panen)
                panen.id
            } else {
                repository.insertPanen(panen)
            }

            // Update tanggal panen terakhir di kebun
            val kebun = repository.getKebunById(panen.kebunId)
            if (kebun != null && panen.tanggal > kebun.tanggalPanenTerakhir) {
                repository.updateKebun(kebun.copy(tanggalPanenTerakhir = panen.tanggal))
            }

            // Sync with Biaya for production cost
            val existingBiaya = repository.getBiayaBySource("PANEN", savedId)
            if (panen.biayaProduksi > 0) {
                if (existingBiaya != null) {
                    repository.updateBiaya(
                        existingBiaya.copy(
                            tanggal = panen.tanggal,
                            kebunId = panen.kebunId,
                            kategori = "Biaya Panen",
                            deskripsi = panen.keterangan.ifBlank { "Biaya produksi panen" },
                            jumlah = panen.biayaProduksi
                        )
                    )
                } else {
                    repository.insertBiaya(
                        BiayaEntity(
                            tanggal = panen.tanggal,
                            kebunId = panen.kebunId,
                            kategori = "Biaya Panen",
                            deskripsi = panen.keterangan.ifBlank { "Biaya produksi panen" },
                            jumlah = panen.biayaProduksi,
                            sourceType = "PANEN",
                            sourceId = savedId
                        )
                    )
                }
            } else if (existingBiaya != null) {
                repository.deleteBiaya(existingBiaya)
            }

            // Schedule reminder for next harvest
            val reminderId = (200000 + savedId).toInt()
            if (panen.reminderEnabled && panen.reminderTanggal > System.currentTimeMillis()) {
                val kebunNama = kebun?.nama ?: "Kebun Sawit"
                ReminderScheduler.scheduleReminder(
                    context = context,
                    reminderId = reminderId,
                    triggerAtMillis = panen.reminderTanggal,
                    title = "Jadwal Panen: $kebunNama",
                    message = "Waktunya panen berikutnya untuk $kebunNama pada tanggal ${Formatters.formatDate(panen.reminderTanggal)}"
                )
            } else {
                ReminderScheduler.cancelReminder(context, reminderId)
            }
        }
    }

    fun deletePanen(panen: PanenEntity) {
        viewModelScope.launch {
            val context = getApplication<Application>().applicationContext
            ReminderScheduler.cancelReminder(context, (200000 + panen.id).toInt())
            repository.deleteBiayaBySource("PANEN", panen.id)
            repository.deletePanen(panen)
        }
    }

    // Biaya Mandiri
    fun saveBiaya(biaya: BiayaEntity, isEdit: Boolean) {
        viewModelScope.launch {
            val itemToSave = if (biaya.sourceType.isBlank()) biaya.copy(sourceType = "MANDIRI") else biaya
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
