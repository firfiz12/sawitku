import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './views/DashboardView';
import { KebunView } from './views/KebunView';
import { PanenView } from './views/PanenView';
import { PerawatanView } from './views/PerawatanView';
import { PengeluaranLainView } from './views/PengeluaranLainView';
import { LaporanView } from './views/LaporanView';
import { dataService } from './services/dataService';
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

  // Data States
  const [kebunList, setKebunList] = useState<Kebun[]>([]);
  const [panenList, setPanenList] = useState<Panen[]>([]);
  const [perawatanList, setPerawatanList] = useState<Perawatan[]>([]);
  const [pengeluaranLainList, setPengeluaranLainList] = useState<PengeluaranLain[]>([]);

  // Modal States
  const [isKebunModalOpen, setIsKebunModalOpen] = useState(false);
  const [isPanenModalOpen, setIsPanenModalOpen] = useState(false);
  const [isPerawatanModalOpen, setIsPerawatanModalOpen] = useState(false);
  const [isPengeluaranLainModalOpen, setIsPengeluaranLainModalOpen] = useState(false);
  const [preselectedKebunId, setPreselectedKebunId] = useState<string | undefined>();

  // Fetch initial data
  const loadAllData = async () => {
    try {
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
    loadAllData();

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUserEmail(session?.user?.email || null);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserEmail(session?.user?.email || null);
        loadAllData();
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Computed: Pengingat Panen Info
  const pengingatList = useMemo(() => {
    return dataService.calculatePengingatPanen(kebunList, panenList);
  }, [kebunList, panenList]);

  // Computed: Stats
  const stats = useMemo(() => {
    return dataService.calculateStats(kebunList, panenList, perawatanList, pengeluaranLainList);
  }, [kebunList, panenList, perawatanList, pengeluaranLainList]);

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

  // Shortcuts
  const handleOpenPanenModal = (kebunId?: string) => {
    setPreselectedKebunId(kebunId);
    setIsPanenModalOpen(true);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUserEmail(null);
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
      />

      {/* Main Content Area */}
      <div className="app-main">
        <TopBar
          currentTab={currentTab}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          overdueHarvestCount={overdueHarvestCount}
          onQuickAddPanen={() => handleOpenPanenModal()}
          onQuickAddKebun={() => setIsKebunModalOpen(true)}
          onShowAlerts={() => setCurrentTab('dashboard')}
        />

        <main className="content-body">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              pengingatList={pengingatList}
              recentPanen={panenList}
              kebunList={kebunList}
              onNavigate={setCurrentTab}
              onOpenPanenModal={handleOpenPanenModal}
              onOpenPerawatanModal={() => setIsPerawatanModalOpen(true)}
              onOpenPengeluaranLainModal={() => setIsPengeluaranLainModalOpen(true)}
              onOpenKebunModal={() => setIsKebunModalOpen(true)}
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
    </div>
  );
};

export default App;
