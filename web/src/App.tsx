import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AuthModal } from './components/AuthModal';
import { PwaBanner } from './components/PwaBanner';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { DashboardView } from './views/DashboardView';
import { KebunView } from './views/KebunView';
import { PanenView } from './views/PanenView';
import { PerawatanView } from './views/PerawatanView';
import { PengeluaranLainView } from './views/PengeluaranLainView';
import { LaporanView } from './views/LaporanView';
import { dataService, setCurrentUser } from './services/dataService';
import type { DatabaseStatus } from './services/dataService';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import type {
  Kebun,
  Panen,
  Perawatan,
  PengeluaranLain,
} from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isDbStatusModalOpen, setIsDbStatusModalOpen] = useState(false);

  // Check Database status
  const refreshDbStatus = async () => {
    try {
      const status = await dataService.checkDatabaseStatus();
      setDbStatus(status);
    } catch (e) {
      console.error('Failed to check database status:', e);
    }
  };

  // Data States
  const [kebunList, setKebunList] = useState<Kebun[]>([]);
  const [panenList, setPanenList] = useState<Panen[]>([]);
  const [perawatanList, setPerawatanList] = useState<Perawatan[]>([]);
  const [pengeluaranLainList, setPengeluaranLainList] = useState<PengeluaranLain[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Modal States
  const [isKebunModalOpen, setIsKebunModalOpen] = useState(false);
  const [isPanenModalOpen, setIsPanenModalOpen] = useState(false);
  const [isPerawatanModalOpen, setIsPerawatanModalOpen] = useState(false);
  const [isPengeluaranLainModalOpen, setIsPengeluaranLainModalOpen] = useState(false);
  const [preselectedKebunId, setPreselectedKebunId] = useState<string | undefined>();
  // Filter bulan untuk analitik dashboard ('YYYY-MM'; kosong = bulan berjalan)
  const [dashboardMonth, setDashboardMonth] = useState<string>('');

  // Fetch initial data
  const loadAllData = async () => {
    try {
      // Retry antrian sinkronisasi yang tertunda terlebih dahulu
      await dataService.flushPendingSync();

      const [k, p, pw, pl] = await Promise.all([
        dataService.getKebun(),
        dataService.getPanen(),
        dataService.getPerawatan(),
        dataService.getPengeluaranLain(),
      ]);
      setKebunList(k);
      setPanenList(p);
      setPerawatanList(pw);
      setPengeluaranLainList(pl);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email || null);
      setUserId(session?.user?.id || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
      setUserId(session?.user?.id || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Isolasi storage per-akun & muat data setiap sesi berubah
  useEffect(() => {
    setCurrentUser(userId);
    loadAllData();
    refreshDbStatus();

    // Koneksi kembali online → kirim semua perubahan yang tertunda lalu muat ulang
    const handleOnline = () => {
      dataService.flushPendingSync().then(() => {
        loadAllData();
        refreshDbStatus();
      });
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [userId]);

  // Computed: Pengingat Panen Info
  const pengingatList = useMemo(() => {
    return dataService.calculatePengingatPanen(kebunList, panenList);
  }, [kebunList, panenList]);

  // Computed: Stats
  const stats = useMemo(() => {
    return dataService.calculateStats(
      kebunList,
      panenList,
      perawatanList,
      pengeluaranLainList,
      dashboardMonth || undefined
    );
  }, [kebunList, panenList, perawatanList, pengeluaranLainList, dashboardMonth]);

  const overdueHarvestCount = pengingatList.filter(
    (p) => p.status === 'LEWAT_JADWAL' || p.status === 'HARI_INI'
  ).length;

  // CRUD Handlers - Kebun
  const handleSaveKebun = async (kebun: Omit<Kebun, 'id'> & { id?: string }) => {
    await dataService.saveKebun(kebun);
    await loadAllData();
  };

  const handleDeleteKebun = async (id: string) => {
    await dataService.deleteKebun(id);
    await loadAllData();
  };

  // CRUD Handlers - Panen
  const handleSavePanen = async (panen: Omit<Panen, 'id'> & { id?: string }) => {
    await dataService.savePanen(panen);
    await loadAllData();
  };

  const handleDeletePanen = async (id: string) => {
    await dataService.deletePanen(id);
    await loadAllData();
  };

  // CRUD Handlers - Perawatan
  const handleSavePerawatan = async (pw: Omit<Perawatan, 'id'> & { id?: string }) => {
    await dataService.savePerawatan(pw);
    await loadAllData();
  };

  const handleDeletePerawatan = async (id: string) => {
    await dataService.deletePerawatan(id);
    await loadAllData();
  };

  // CRUD Handlers - Pengeluaran Lain
  const handleSavePengeluaranLain = async (pl: Omit<PengeluaranLain, 'id'> & { id?: string }) => {
    await dataService.savePengeluaranLain(pl);
    await loadAllData();
  };

  const handleDeletePengeluaranLain = async (id: string) => {
    await dataService.deletePengeluaranLain(id);
    await loadAllData();
  };

  // Shortcuts (untuk tombol aksi cepat dari tab lain, pindah dulu ke tab terkait
  // karena modal dirender di dalam masing-masing view)
  const handleOpenPanenModal = (kebunId?: string) => {
    setPreselectedKebunId(kebunId);
    setCurrentTab('panen');
    setIsPanenModalOpen(true);
  };

  const handleOpenKebunModal = () => {
    setCurrentTab('kebun');
    setIsKebunModalOpen(true);
  };

  const handleOpenPerawatanModal = () => {
    setCurrentTab('perawatan');
    setIsPerawatanModalOpen(true);
  };

  const handleOpenPengeluaranLainModal = () => {
    setCurrentTab('pengeluaran-lain');
    setIsPengeluaranLainModalOpen(true);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUserEmail(null);
    setUserId(null);
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        overdueHarvestCount={overdueHarvestCount}
        userEmail={userEmail}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        dbStatus={dbStatus}
        onOpenDbStatus={() => setIsDbStatusModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="app-main">
        <PwaBanner />
        <TopBar
          currentTab={currentTab}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          overdueHarvestCount={overdueHarvestCount}
          onQuickAddPanen={() => handleOpenPanenModal()}
          onQuickAddKebun={handleOpenKebunModal}
          onShowAlerts={() => setCurrentTab('dashboard')}
          dbStatus={dbStatus}
          onOpenDbStatus={() => setIsDbStatusModalOpen(true)}
        />

        <main className="content-body">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              dashboardMonth={dashboardMonth}
              onDashboardMonthChange={setDashboardMonth}
              pengingatList={pengingatList}
              recentPanen={panenList}
              kebunList={kebunList}
              onNavigate={setCurrentTab}
              onOpenPanenModal={handleOpenPanenModal}
              onOpenPerawatanModal={handleOpenPerawatanModal}
              onOpenPengeluaranLainModal={handleOpenPengeluaranLainModal}
              onOpenKebunModal={handleOpenKebunModal}
            />
          )}

          {currentTab === 'kebun' && (
            <KebunView
              kebunList={kebunList}
              onSaveKebun={handleSaveKebun}
              onDeleteKebun={handleDeleteKebun}
              onPanenKebun={handleOpenPanenModal}
              isModalOpen={isKebunModalOpen}
              onOpenModal={() => setIsKebunModalOpen(true)}
              onCloseModal={() => setIsKebunModalOpen(false)}
            />
          )}

          {currentTab === 'panen' && (
            <PanenView
              panenList={panenList}
              kebunList={kebunList}
              onSavePanen={handleSavePanen}
              onDeletePanen={handleDeletePanen}
              isModalOpen={isPanenModalOpen}
              onOpenModal={handleOpenPanenModal}
              onCloseModal={() => setIsPanenModalOpen(false)}
              preselectedKebunId={preselectedKebunId}
            />
          )}

          {currentTab === 'perawatan' && (
            <PerawatanView
              perawatanList={perawatanList}
              kebunList={kebunList}
              onSavePerawatan={handleSavePerawatan}
              onDeletePerawatan={handleDeletePerawatan}
              isModalOpen={isPerawatanModalOpen}
              onOpenModal={() => setIsPerawatanModalOpen(true)}
              onCloseModal={() => setIsPerawatanModalOpen(false)}
            />
          )}

          {currentTab === 'pengeluaran-lain' && (
            <PengeluaranLainView
              pengeluaranList={pengeluaranLainList}
              onSavePengeluaranLain={handleSavePengeluaranLain}
              onDeletePengeluaranLain={handleDeletePengeluaranLain}
              isModalOpen={isPengeluaranLainModalOpen}
              onOpenModal={() => setIsPengeluaranLainModalOpen(true)}
              onCloseModal={() => setIsPengeluaranLainModalOpen(false)}
            />
          )}

          {currentTab === 'laporan' && (
            <LaporanView
              kebunList={kebunList}
              panenList={panenList}
              perawatanList={perawatanList}
              pengeluaranLainList={pengeluaranLainList}
            />
          )}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(email) => setUserEmail(email)}
      />

      {/* Database Status Modal */}
      <DatabaseStatusModal
        isOpen={isDbStatusModalOpen}
        onClose={() => setIsDbStatusModalOpen(false)}
        status={dbStatus}
        onRefresh={refreshDbStatus}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />
    </div>
  );
};

export default App;
