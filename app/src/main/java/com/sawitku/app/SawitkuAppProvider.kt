package com.sawitku.app

import android.content.Context

object SawitkuAppProvider {
    lateinit var app: SawitApp
        private set

    fun init(context: Context) {
        if (!::app.isInitialized) {
            app = context.applicationContext as SawitApp
        }
    }
}
