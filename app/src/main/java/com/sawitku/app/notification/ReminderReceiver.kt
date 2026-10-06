package com.sawitku.app.notification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.sawitku.app.SawitkuAppProvider
import com.sawitku.app.util.Formatters
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            reschedulePendingReminders(context)
            return
        }

        val id = intent.getIntExtra(EXTRA_ID, 0)
        val title = intent.getStringExtra(EXTRA_TITLE) ?: "Pengingat Sawitku"
        val message = intent.getStringExtra(EXTRA_MESSAGE) ?: "Saatnya jadwal kebun sawit Anda."

        NotificationHelper.showNotification(context, id, title, message)
    }

    private fun reschedulePendingReminders(context: Context) {
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val repository = SawitkuAppProvider.app.repository
                val now = System.currentTimeMillis()

                repository.getAllPerawatanOnce()
                    .filter { it.reminderEnabled && it.reminderTanggal > now }
                    .forEach { perawatan ->
                        val detail = if (perawatan.jenisPupuk.isNotBlank()) " (${perawatan.jenisPupuk})"
                            else if (perawatan.jenisRacun.isNotBlank()) " (${perawatan.jenisRacun})"
                            else ""
                        ReminderScheduler.scheduleReminder(
                            context = context,
                            reminderId = ReminderScheduler.getPerawatanReminderId(perawatan.id),
                            triggerAtMillis = perawatan.reminderTanggal,
                            title = "Jadwal Perawatan: ${perawatan.jenis}",
                            message = "Waktunya melakukan ${perawatan.jenis}$detail pada tanggal ${Formatters.formatDate(perawatan.reminderTanggal)}"
                        )
                    }

                repository.getAllPanenOnce()
                    .filter { it.reminderEnabled && it.reminderTanggal > now }
                    .forEach { panen ->
                        val kebunNama = repository.getKebunById(panen.kebunId)?.nama ?: "Kebun Sawit"
                        ReminderScheduler.scheduleReminder(
                            context = context,
                            reminderId = ReminderScheduler.getPanenReminderId(panen.id),
                            triggerAtMillis = panen.reminderTanggal,
                            title = "Jadwal Panen: $kebunNama",
                            message = "Waktunya panen berikutnya untuk $kebunNama pada tanggal ${Formatters.formatDate(panen.reminderTanggal)}"
                        )
                    }
            } catch (_: Exception) {
                // DB access errors should not crash the boot receiver
            } finally {
                pendingResult.finish()
            }
        }
    }

    companion object {
        const val EXTRA_ID = "extra_id"
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_MESSAGE = "extra_message"
    }
}