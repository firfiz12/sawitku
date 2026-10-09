import React, { useState, useEffect } from 'react';
import { Download, WifiOff, X, RefreshCw } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaBanner: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    // 1. Setup Service Worker Register & Auto/Prompt Update
    const reload = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        console.log('SawitKu siap dijalankan secara offline');
      },
    });
    setUpdateSW(() => reload);

    // 2. Listen to online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Listen to beforeinstallprompt event (PWA Install trigger)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const handleUpdateClick = () => {
    if (updateSW) {
      updateSW();
    }
  };

  return (
    <>
      {/* 1. Offline Mode Alert Banner */}
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'relative',
            zIndex: 'auto',
            background: 'linear-gradient(90deg, #b45309, #d97706)',
            color: '#ffffff',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <WifiOff size={18} />
          <span>Mode Offline Aktif — Anda tetap bisa input & lihat data. Perubahan tersimpan lokal di perangkat ini.</span>
        </div>
      )}

      {/* 2. Update Available Banner */}
      {needRefresh && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(24px + var(--safe-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99,
            background: '#ffffff',
            border: '1px solid #10b981',
            borderRadius: '14px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            rowGap: '8px',
            width: '100%',
            maxWidth: 'min(560px, calc(100vw - 32px))',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
            color: '#0f172a',
          }}
        >
          <RefreshCw size={20} color="#059669" className="spin-icon" />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Versi baru SawitKu tersedia!</span>
          <button
            onClick={handleUpdateClick}
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            Perbarui Sekarang
          </button>
        </div>
      )}

      {/* 3. Install PWA Floating Prompt */}
      {installPrompt && !isInstalled && !isDismissed && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(24px + var(--safe-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90,
            background: '#ffffff',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '16px',
            padding: '18px',
            width: '100%',
            maxWidth: 'min(340px, calc(100vw - 32px))',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeInUp 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src="/icons/icon-96x96.png"
                alt="SawitKu"
                style={{ width: 42, height: 42, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                  Pasang SawitKu
                </div>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                  Gunakan seperti aplikasi Android/Desktop
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsDismissed(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: 4,
              }}
              title="Tutup"
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
            Akses lebih cepat, bisa dibuka tanpa browser bar, dan berjalan offline di kebun sawit.
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleInstallClick}
              className="btn btn-primary"
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem', justifyContent: 'center' }}
            >
              <Download size={15} />
              <span>Pasang Sekarang</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            >
              Nanti Saja
            </button>
          </div>
        </div>
      )}
    </>
  );
};
