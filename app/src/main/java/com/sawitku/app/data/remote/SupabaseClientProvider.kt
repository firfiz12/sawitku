package com.sawitku.app.data.remote

import com.sawitku.app.BuildConfig
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.ktor.client.engine.okhttp.OkHttp

/**
 * Singleton Supabase client untuk seluruh aplikasi.
 * URL dan anon key dibaca dari BuildConfig (bersumber dari local.properties — tidak di-commit).
 */
object SupabaseClientProvider {
    val client by lazy {
        createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            install(Auth)
            install(Postgrest)
            httpEngine = OkHttp.create()
        }
    }
}
