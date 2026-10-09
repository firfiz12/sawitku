import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Server,
  ShieldCheck,
  Zap,
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: status.isConnected ? 'rgba(5, 150, 105, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${status.isConnected ? 'rgba(5, 150, 105, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
              }}
            >
              <Database size={22} color={status.isConnected ? '#059669' : '#dc2626'} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Status Koneksi Database
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Backend Supabase Cloud & Sinkronisasi
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Pill Card */}
        <div
          style={{
            padding: '16px',
            borderRadius: '14px',
            background: status.isConnected ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${status.isConnected ? '#a7f3d0' : '#fecaca'}`,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          {status.isConnected ? (
            <CheckCircle2 size={28} color="#059669" />
          ) : (
            <XCircle size={28} color="#dc2626" />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: status.isConnected ? '#065f46' : '#991b1b' }}>
              {status.isConnected ? 'Database Supabase Terhubung!' : 'Koneksi Terputus / Belum Diisi'}
            </div>
            <div style={{ fontSize: '0.82rem', color: status.isConnected ? '#047857' : '#b91c1c', marginTop: '2px' }}>
              {status.message}
            </div>
          </div>
        </div>

        {/* Detail Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              background: '#f8fafc',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              <Server size={14} color="#059669" />
              <span>Project Host</span>
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              cbthjsxmhibtdicknzns
            </div>
          </div>

          <div
            style={{
              background: '#f8fafc',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              <Zap size={14} color="#d97706" />
              <span>Latensi Server</span>
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
              {status.latencyMs} ms
            </div>
          </div>
        </div>

        {/* Tabel Pemeriksaan Skema */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pemeriksaan Tabel PostgreSQL:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { name: 'kebun', label: 'Tabel Kebun Sawit', ok: status.tables.kebun },
              { name: 'panen', label: 'Tabel Riwayat Panen TBS', ok: status.tables.panen },
              { name: 'perawatan', label: 'Tabel Perawatan & Pupuk', ok: status.tables.perawatan },
              { name: 'pengeluaran_lain', label: 'Tabel Biaya & Pengeluaran', ok: status.tables.pengeluaran_lain },
            ].map((tbl) => (
              <div
                key={tbl.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.84rem',
                }}
              >
                <span style={{ color: '#334155', fontWeight: 500 }}>
                  {tbl.label} (<code style={{ color: '#059669', background: 'rgba(5,150,105,0.08)', padding: '2px 6px', borderRadius: 4 }}>{tbl.name}</code>)
                </span>
                {tbl.ok ? (
                  <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                    <CheckCircle2 size={15} /> Aktif
                  </span>
                ) : (
                  <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                    <XCircle size={15} /> Belum Ada
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Auth / Account State */}
        <div
          style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color={status.userEmail ? '#059669' : '#d97706'} />
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                {status.userEmail ? `Akun: ${status.userEmail}` : 'Mode Tamu (Data Lokal)'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                {status.userEmail
                  ? 'RLS Aktif — Data tersinkronisasi otomatis ke cloud Anda'
                  : 'Masuk dengan email Supabase untuk mengaktifkan sinkronisasi otomatis'}
              </div>
            </div>
          </div>
          {!status.userEmail && (
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              Masuk
            </button>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
          >
            <RefreshCw size={16} className={isTesting ? 'spin-icon' : ''} />
            <span>{isTesting ? 'Menguji...' : 'Uji Koneksi Ulang'}</span>
          </button>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '10px 24px', justifyContent: 'center' }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
