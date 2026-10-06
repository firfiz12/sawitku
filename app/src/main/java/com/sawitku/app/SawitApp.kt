package com.sawitku.app

import android.app.Application
import com.sawitku.app.data.local.SawitDatabase
import com.sawitku.app.data.remote.SupabaseClientProvider
import com.sawitku.app.data.repository.SawitRepository
import com.sawitku.app.data.sync.SyncWorker
import com.sawitku.app.notification.NotificationHelper

class SawitApp : Application() {
    override fun onCreate() {
        super.onCreate()
        SawitkuAppProvider.init(this)
        NotificationHelper.createNotificationChannel(this)

        // Inisialisasi Supabase client (lazy, dibuat saat pertama diakses)
        // Trigger eager init agar siap saat SyncWorker pertama kali berjalan
        SupabaseClientProvider.client

        // Jadwalkan sync periodik jika user sudah login
        SyncWorker.schedule(this)
    }

    val database by lazy { SawitDatabase.getDatabase(this) }
    val repository by lazy { SawitRepository(database) }
}
