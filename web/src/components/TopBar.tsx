import React from 'react';
import { Menu, Sprout, Trees, Database } from 'lucide-react';
import type { NavTab } from './Sidebar';
import type { DatabaseStatus } from '../services/dataService';

interface TopBarProps {
  currentTab: NavTab;
  onToggleMobileMenu: () => void;
  onQuickAddPanen: () => void;
  onQuickAddKebun: () => void;
  dbStatus: DatabaseStatus | null;
  onOpenDbStatus: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onToggleMobileMenu,
  onQuickAddPanen,
  onQuickAddKebun,
  dbStatus,
  onOpenDbStatus,
}) => {
  const titles: Record<NavTab, string> = {
    dashboard: 'Dashboard',
    kebun: 'Daftar Kebun',
    panen: 'Catatan Panen',
    perawatan: 'Perawatan Kebun',
    'pengeluaran-lain': 'Pengeluaran Lain',
    laporan: 'Laporan Keuangan',
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
            <span style={{ color: '#059669', fontWeight: 600 }}>Sistem Manajemen Sawit</span>
          </span>
        </div>
      </div>

      <div className="top-bar-actions">
        {/* Database Status Button */}
        <button
          id="btn-topbar-db"
          onClick={onOpenDbStatus}
          className={`btn-db-pill ${dbStatus?.isConnected ? 'online' : 'offline'}`}
          title="Status Koneksi Database"
        >
          <span className={`status-dot ${dbStatus?.isConnected ? 'online' : 'offline'}`} />
          <Database size={14} />
          <span className="hidden-mobile">
            {dbStatus?.isConnected ? 'Database Terhubung' : 'Mode Offline'}
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
      </div>
    </header>
  );
};
