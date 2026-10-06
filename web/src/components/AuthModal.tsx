import React, { useState } from 'react';
import { X, Lock, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email || !password) {
      setErrorMessage('Silakan isi email dan kata sandi.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (!isSupabaseConfigured) {
      // Demo mode fallback
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onSuccess(email);
        onClose();
      }, 600);
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.session) {
          setInfoMessage('Pendaftaran berhasil! Cek email konfirmasi Anda atau login.');
        } else {
          onSuccess(email);
          onClose();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          onSuccess(email);
          onClose();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan autentikasi.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{isRegister ? 'Daftar Akun SawitKu' : 'Masuk ke SawitKu'}</h2>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>
              Sinkronkan data kebun Anda antara HP Android dan Web
            </p>
          </div>
          <button id="btn-close-auth-modal" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {!isSupabaseConfigured && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              marginBottom: 16,
              fontSize: '0.8rem',
              color: '#fbbf24',
            }}
          >
            ⚠️ Supabase credentials belum diisi di file <code>.env</code>. Anda dapat mencoba mode demo lokal langsung.
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: 16,
              fontSize: '0.85rem',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: 16,
              fontSize: '0.85rem',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Alamat Email</label>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-email"
                type="email"
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="nama@sawitku.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail
                size={16}
                color="#94a3b8"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Kata Sandi</label>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-password"
                type="password"
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock
                size={16}
                color="#94a3b8"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <button
            id="btn-auth-submit"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Memproses...' : isRegister ? 'Daftar Akun Baru' : 'Masuk Sekarang'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            type="button"
            style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '0.88rem', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMessage(null);
              setInfoMessage(null);
            }}
          >
            {isRegister
              ? 'Sudah punya akun? Masuk di sini'
              : 'Belum punya akun? Daftar akun baru'}
          </button>
        </div>
      </div>
    </div>
  );
};
