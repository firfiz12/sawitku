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
  ChevronRight,
} from 'lucide-react';
import type { DatabaseStatus } from '../services/dataService';

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
  dbStatus: DatabaseStatus | null;
  onOpenDbStatus: () => void;
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
  dbStatus,
  onOpenDbStatus,
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
          style={{ zIndex: 35, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
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
          <div style={{ padding: '0 12px 8px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Menu Utama
          </div>
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
                <Icon size={19} />
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="nav-badge danger">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {/* Status Database Card (Klik untuk Modal Diagnostik) */}
          <div
            onClick={onOpenDbStatus}
            className="sync-status-card"
            style={{
              marginBottom: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Klik untuk diagnosa koneksi database Supabase"
          >
            {dbStatus?.isConnected ? (
              <>
                <div className="sync-indicator" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>Supabase Cloud</div>
                  <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                    {dbStatus.userEmail ? 'Tersinkronisasi' : 'Online (Tamu)'}
                  </div>
                </div>
                <CloudCheck size={18} color="#059669" />
                <ChevronRight size={14} color="#94a3b8" />
              </>
            ) : (
              <>
                <div className="sync-indicator" style={{ background: '#f59e0b', boxShadow: 'none' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>Mode Offline Lokal</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Tersimpan di perangkat</div>
                </div>
                <CloudOff size={18} color="#64748b" />
                <ChevronRight size={14} color="#94a3b8" />
              </>
            )}
          </div>

          {userEmail ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(5, 150, 105, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={16} color="#059669" />
                </div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#1e293b', fontWeight: 600 }}>
                  {userEmail}
                </div>
              </div>
              <button
                id="btn-logout"
                title="Keluar Akun"
                onClick={onLogout}
                className="btn btn-secondary btn-icon"
                style={{ padding: '6px' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              id="btn-open-login"
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.85rem', padding: '10px 12px', justifyContent: 'center' }}
              onClick={onOpenAuth}
            >
              <User size={16} />
              <span>Masuk / Sinkron Akun</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
