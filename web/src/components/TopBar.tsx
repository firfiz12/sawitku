import React from 'react';
import { Menu, Bell, Sprout, Trees, Database } from 'lucide-react';
import type { NavTab } from './Sidebar';
import type { DatabaseStatus } from '../services/dataService';

interface TopBarProps {
  currentTab: NavTab;
  onToggleMobileMenu: () => void;
  overdueHarvestCount: number;
  onQuickAddPanen: () => void;
  onQuickAddKebun: () => void;
  onShowAlerts: () => void;
  dbStatus: DatabaseStatus | null;
  onOpenDbStatus: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onToggleMobileMenu,
  overdueHarvestCount,
  onQuickAddPanen,
  onQuickAddKebun,
  onShowAlerts,
  dbStatus,
  onOpenDbStatus,
}) => {
  const titles: Record<NavTab, string> = {
    dashboard: 'Ringkasan & Dashboard',
    kebun: 'Daftar Kebun Sawit',
    panen: 'Catatan & Riwayat Panen',
    perawatan: 'Pencatatan Perawatan Kebun',
    'pengeluaran-lain': 'Pengeluaran Lain Operasional',
    laporan: 'Laporan Finansial & Analitik',
  };

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <button
          id="btn-mobile-menu"
          className="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label="Buka Menu"
        >
          <Menu size={22} />
        </button>
        <div className="page-title-wrap">
          <h1 className="page-title">{titles[currentTab]}</h1>
          <span className="page-subtitle">
            <span>SawitKu</span>
            <span>•</span>
            <span style={{ color: '#059669', fontWeight: 600 }}>Sistem Manajemen Kelapa Sawit Modern</span>
          </span>
        </div>
      </div>

      <div className="top-bar-actions">
        {/* Database Status Button */}
        <button
          id="btn-topbar-db"
          onClick={onOpenDbStatus}
          className={`btn-db-pill ${dbStatus?.isConnected ? 'online' : 'offline'}`}
          title="Klik untuk detail koneksi Database Supabase"
        >
          <span className={`status-dot ${dbStatus?.isConnected ? 'online' : 'offline'}`} />
          <Database size={14} />
          <span className="hidden-mobile">
            {dbStatus?.isConnected ? 'Supabase Online' : 'Lokal / Offline'}
          </span>
        </button>

        <button
          id="btn-quick-panen"
          className="btn btn-primary topbar-quick"
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          onClick={onQuickAddPanen}
        >
          <Sprout size={16} />
          <span className="hidden-mobile">+ Catat Panen</span>
        </button>

        <button
          id="btn-quick-kebun"
          className="btn btn-secondary topbar-quick"
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          onClick={onQuickAddKebun}
        >
          <Trees size={16} />
          <span className="hidden-mobile">+ Kebun</span>
        </button>

        <button
          id="btn-notification-bell"
          className="btn btn-secondary btn-icon"
          style={{ position: 'relative' }}
          onClick={onShowAlerts}
          title="Notifikasi Pengingat Panen"
        >
          <Bell size={18} />
          {overdueHarvestCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 6px #ef4444',
              }}
            />
          )}
        </button>
      </div>
    </header>
  );
};
