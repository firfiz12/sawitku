import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type { DatabaseStatus } from '../services/dataService';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DatabaseStatus | null;
  onRefresh: () => Promise<void>;
  onOpenAuth: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh,
  onOpenAuth,
}) => {
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen || !status) return null;

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await onRefresh();
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div style={{ textAlign: 'center', padding: '16px 8px 8px' }}>
          {/* Icon Status */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: status.isConnected ? '#ecfdf5' : '#fef2f2',
              border: `2px solid ${status.isConnected ? '#a7f3d0' : '#fecaca'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            {status.isConnected ? (
              <CheckCircle2 size={36} color="#059669" />
            ) : (
              <XCircle size={36} color="#dc2626" />
            )}
          </div>

          {/* Judul & Keterangan Utama */}
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            {status.isConnected ? 'Database Sudah Terhubung' : 'Database Belum Terhubung'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, margin: '0 auto 20px', maxWidth: '380px' }}>
            {status.isConnected
              ? 'Seluruh data kebun, hasil panen, dan keuangan Anda tersimpan dengan aman dan tersinkronisasi otomatis.'
              : 'Aplikasi saat ini berjalan dalam mode penyimpanan lokal (offline). Sambungkan internet untuk menyinkronkan data.'}
          </p>

          {/* Info Akun Ringkas */}
          <div style={{ marginBottom: '24px' }}>
            {status.userEmail ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: '#f8fafc',
                  borderRadius: '30px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.84rem',
                  color: '#334155',
                }}
              >
                <ShieldCheck size={16} color="#059669" />
                <span>Akun: <strong>{status.userEmail}</strong></span>
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 16px',
                  background: '#fffbeb',
                  borderRadius: '30px',
                  border: '1px solid #fef3c7',
                  fontSize: '0.84rem',
                  color: '#92400e',
                }}
              >
                <span>Mode Tamu (Offline)</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Masuk Akun
                </button>
              </div>
            )}
          </div>

          {/* Tombol Aksi */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="btn btn-secondary"
              style={{ padding: '10px 16px', fontSize: '0.86rem' }}
              title="Periksa ulang koneksi ke server"
            >
              <RefreshCw size={15} className={isTesting ? 'spin-icon' : ''} />
              <span>{isTesting ? 'Memeriksa...' : 'Periksa Ulang'}</span>
            </button>
            <button
              onClick={onClose}
              className="btn btn-primary"
              style={{ padding: '10px 28px', fontSize: '0.86rem' }}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
