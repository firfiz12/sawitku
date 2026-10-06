import React from 'react';
import {
  LayoutDashboard,
  Trees,
  Sprout,
  Wrench,
  Receipt,
  BarChart3,
  CloudCheck,
  CloudOff,
  User,
  LogOut,
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export type NavTab = 'dashboard' | 'kebun' | 'panen' | 'perawatan' | 'pengeluaran-lain' | 'laporan';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  overdueHarvestCount: number;
  userEmail: string | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  overdueHarvestCount,
  userEmail,
  onOpenAuth,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard, badge: overdueHarvestCount > 0 ? overdueHarvestCount : null },
    { id: 'kebun' as NavTab, label: 'Manajemen Kebun', icon: Trees },
    { id: 'panen' as NavTab, label: 'Riwayat Panen', icon: Sprout },
    { id: 'perawatan' as NavTab, label: 'Riwayat Perawatan', icon: Wrench },
    { id: 'pengeluaran-lain' as NavTab, label: 'Pengeluaran Lain', icon: Receipt },
    { id: 'laporan' as NavTab, label: 'Laporan & Analitik', icon: BarChart3 },
  ];

  return (
    <>
      {isOpenMobile && (
        <div
          className="modal-overlay"
          style={{ zIndex: 35, background: 'rgba(0,0,0,0.6)' }}
          onClick={onCloseMobile}
        />
      )}
      <aside className={`app-sidebar ${isOpenMobile ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon-box">
            <Trees size={26} color="#ffffff" />
          </div>
          <div>
            <div className="brand-title">SawitKu</div>
            <div className="brand-subtitle">Smart Palm Manager</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="nav-badge danger">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sync-status-card" style={{ marginBottom: 12 }}>
            {isSupabaseConfigured ? (
              <>
                <div className="sync-indicator" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#f0fdf4' }}>Supabase Cloud</div>
                  <div style={{ fontSize: '0.72rem', color: '#86efac' }}>Online-first terhubung</div>
                </div>
                <CloudCheck size={18} color="#10b981" />
              </>
            ) : (
              <>
                <div className="sync-indicator" style={{ background: '#f59e0b', boxShadow: 'none' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#f0fdf4' }}>Mode Offline Lokal</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tersimpan di browser</div>
                </div>
                <CloudOff size={18} color="#94a3b8" />
              </>
            )}
          </div>

          {userEmail ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} color="#10b981" />
                </div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#e2e8f0' }}>
                  {userEmail}
                </div>
              </div>
              <button
                id="btn-logout"
                title="Keluar"
                onClick={onLogout}
                className="btn btn-secondary btn-icon"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              id="btn-open-login"
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px' }}
              onClick={onOpenAuth}
            >
              <User size={16} />
              <span>Masuk / Daftar Akun</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
