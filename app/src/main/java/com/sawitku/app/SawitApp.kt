package com.sawitku.app

import android.app.Application
import com.sawitku.app.data.local.SawitDatabase
import com.sawitku.app.data.repository.SawitRepository
import com.sawitku.app.notification.NotificationHelper

class SawitApp : Application() {
    override fun onCreate() {
        super.onCreate()
        SawitkuAppProvider.init(this)
        NotificationHelper.createNotificationChannel(this)
    }

    val database by lazy { SawitDatabase.getDatabase(this) }
    val repository by lazy { SawitRepository(database) }
}
