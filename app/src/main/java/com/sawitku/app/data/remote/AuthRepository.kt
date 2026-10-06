package com.sawitku.app.data.remote

import android.util.Log
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.user.UserInfo
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private const val TAG = "AuthRepository"

/**
 * Repository untuk semua operasi autentikasi Supabase:
 * - Daftar akun baru (register)
 * - Masuk (login)
 * - Keluar (logout)
 * - Cek status sesi aktif
 */
class AuthRepository {

    private val auth = SupabaseClientProvider.client.auth

    /** Mendaftar akun baru dengan email + password. */
    suspend fun register(email: String, password: String): Result<Unit> {
        return try {
            auth.signUpWith(Email) {
                this.email = email
                this.password = password
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Register gagal", e)
            Result.failure(e)
        }
    }

    /**
     * Login dengan email + password.
     * Sesi disimpan otomatis oleh Supabase SDK di internal storage (aman).
     */
    suspend fun login(email: String, password: String): Result<Unit> {
        return try {
            auth.signInWith(Email) {
                this.email = email
                this.password = password
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Login gagal", e)
            Result.failure(e)
        }
    }

    /** Logout: hapus sesi lokal dan remote. */
    suspend fun logout(): Result<Unit> {
        return try {
            auth.signOut()
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Logout gagal", e)
            Result.failure(e)
        }
    }

    /** Kembalikan UserInfo user yang sedang login, atau null jika belum login. */
    fun currentUser(): UserInfo? = auth.currentUserOrNull()

    /** ID user yang sedang login (UUID string), atau null. */
    fun currentUserId(): String? = auth.currentUserOrNull()?.id

    /** Email user yang sedang login, atau null. */
    fun currentUserEmail(): String? = auth.currentUserOrNull()?.email

    /** True jika ada sesi aktif (user sudah login). */
    fun isLoggedIn(): Boolean = auth.currentUserOrNull() != null

    /**
     * Flow yang memancarkan status login (true = login, false = logout).
     * Berguna untuk UI yang perlu reaktif terhadap perubahan sesi.
     */
    val authStateFlow: Flow<Boolean> = auth.sessionStatus.map { status ->
        auth.currentUserOrNull() != null
    }
}
