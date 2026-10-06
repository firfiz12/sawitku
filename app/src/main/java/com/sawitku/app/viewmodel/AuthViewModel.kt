package com.sawitku.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.sawitku.app.data.remote.AuthRepository
import com.sawitku.app.data.sync.SyncWorker
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthState {
    data object Idle : AuthState()
    data object Loading : AuthState()
    data object LoggedIn : AuthState()
    data object LoggedOut : AuthState()
    data class Error(val message: String) : AuthState()
}

/**
 * ViewModel untuk manajemen autentikasi pengguna (login, register, logout).
 * State-nya diobservasi oleh AuthScreen.
 */
class AuthViewModel(application: Application) : AndroidViewModel(application) {

    private val authRepository = AuthRepository()

    private val _authState = MutableStateFlow<AuthState>(
        if (authRepository.isLoggedIn()) AuthState.LoggedIn else AuthState.LoggedOut
    )
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    val currentUserEmail: String?
        get() = authRepository.currentUserEmail()

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _authState.value = AuthState.Error("Email dan password tidak boleh kosong.")
            return
        }
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            val result = authRepository.login(email, password)
            result.fold(
                onSuccess = {
                    _authState.value = AuthState.LoggedIn
                    // Langsung jalankan sync setelah login — upload data offline yang terakumulasi
                    SyncWorker.runNow(getApplication())
                    SyncWorker.schedule(getApplication())
                },
                onFailure = { e ->
                    _authState.value = AuthState.Error(
                        e.message?.let { parseSupabaseError(it) } ?: "Login gagal. Coba lagi."
                    )
                }
            )
        }
    }

    fun register(email: String, password: String, confirmPassword: String) {
        when {
            email.isBlank() || password.isBlank() -> {
                _authState.value = AuthState.Error("Email dan password tidak boleh kosong.")
                return
            }
            password.length < 6 -> {
                _authState.value = AuthState.Error("Password minimal 6 karakter.")
                return
            }
            password != confirmPassword -> {
                _authState.value = AuthState.Error("Konfirmasi password tidak cocok.")
                return
            }
        }
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            val result = authRepository.register(email, password)
            result.fold(
                onSuccess = {
                    // Setelah register, langsung login agar user tidak perlu verifikasi email
                    // (jika konfirmasi email dinonaktifkan di Supabase dashboard)
                    login(email, password)
                },
                onFailure = { e ->
                    _authState.value = AuthState.Error(
                        e.message?.let { parseSupabaseError(it) } ?: "Pendaftaran gagal. Coba lagi."
                    )
                }
            )
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _authState.value = AuthState.LoggedOut
        }
    }

    fun clearError() {
        if (_authState.value is AuthState.Error) {
            _authState.value = if (authRepository.isLoggedIn()) AuthState.LoggedIn else AuthState.LoggedOut
        }
    }

    /** Terjemahkan pesan error Supabase ke bahasa Indonesia. */
    private fun parseSupabaseError(message: String): String {
        return when {
            message.contains("Invalid login credentials", ignoreCase = true) ->
                "Email atau password salah. Coba lagi."
            message.contains("User already registered", ignoreCase = true) ->
                "Email ini sudah terdaftar. Silakan login."
            message.contains("Unable to validate email address", ignoreCase = true) ->
                "Format email tidak valid."
            message.contains("Password should be at least", ignoreCase = true) ->
                "Password terlalu pendek (minimal 6 karakter)."
            message.contains("network", ignoreCase = true) ||
            message.contains("timeout", ignoreCase = true) ||
            message.contains("connect", ignoreCase = true) ->
                "Tidak ada koneksi internet. Periksa jaringan Anda."
            else -> message
        }
    }
}
