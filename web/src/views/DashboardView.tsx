import React from 'react';
import {
  Trees,
  Sprout,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type {
  Kebun,
  Panen,
  PengingatPanenInfo,
  DashboardStats,
} from '../types';
import type { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  stats: DashboardStats;
  pengingatList: PengingatPanenInfo[];
  recentPanen: Panen[];
  kebunList: Kebun[];
  onNavigate: (tab: NavTab) => void;
  onOpenPanenModal: (preselectedKebunId?: string) => void;
  onOpenPerawatanModal: () => void;
  onOpenPengeluaranLainModal: () => void;
  onOpenKebunModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  pengingatList,
  recentPanen,
  kebunList,
  onNavigate,
  onOpenPanenModal,
  onOpenPerawatanModal,
  onOpenPengeluaranLainModal,
  onOpenKebunModal,
}) => {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getKebunName = (id: string) => {
    const k = kebunList.find((item) => item.id === id);
    return k ? k.nama : 'Kebun';
  };

  const overdueList = pengingatList.filter(
    (p) => p.status === 'LEWAT_JADWAL' || p.status === 'HARI_INI'
  );

  return (
    <div>
      {/* Pengingat Rotasi Panen Alert Banner */}
      {overdueList.length > 0 && (
        <div className="harvest-alert-banner" id="banner-harvest-alerts">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'rgba(239,68,68,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={22} color="#f87171" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fecaca' }}>
                Perhatian: {overdueList.length} Kebun Siap / Lewat Jadwal Panen!
              </div>
              <div style={{ fontSize: '0.85rem', color: '#fed7aa', marginTop: 2 }}>
                {overdueList.map((k) => `${k.namaKebun} (${k.hariTersisa < 0 ? `${Math.abs(k.hariTersisa)} hari terlambat` : 'Jadwal hari ini'})`).join(' • ')}
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', flexShrink: 0 }}
            onClick={() => onOpenPanenModal(overdueList[0]?.kebunId)}
          >
            <Sprout size={16} />
            <span>Panen Sekarang</span>
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <Trees size={22} color="#10b981" />
          </div>
          <div className="stat-label">Total Luas Kebun</div>
          <div className="stat-value">{stats.totalLuasHa.toFixed(1)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Ha</span></div>
          <div className="stat-subtext">
            <span>{stats.totalKebun} Blok kebun aktif</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <Sprout size={22} color="#f59e0b" />
          </div>
          <div className="stat-label">Produksi Bulan Ini</div>
          <div className="stat-value">
            {stats.totalProduksiBulanIniKg.toLocaleString('id-ID')} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Kg</span>
          </div>
          <div className="stat-subtext">
            <TrendingUp size={14} color="#10b981" />
            <span>TBS Sawit Segar</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>
            <ArrowUpRight size={22} color="#06b6d4" />
          </div>
          <div className="stat-label">Pendapatan Bulan Ini</div>
          <div className="stat-value" style={{ color: '#34d399' }}>
            {formatRupiah(stats.totalPendapatanBulanIni)}
          </div>
          <div className="stat-subtext">
            <span>Dari hasil penjualan TBS</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <ArrowDownRight size={22} color="#ef4444" />
          </div>
          <div className="stat-label">Pengeluaran Bulan Ini</div>
          <div className="stat-value" style={{ color: '#f87171' }}>
            {formatRupiah(stats.totalPengeluaranBulanIni)}
          </div>
          <div className="stat-subtext">
            <span>Perawatan & Pengeluaran Lain</span>
          </div>
        </div>
      </div>

      {/* Laba Bersih Banner Card */}
      <div
        className="card"
        style={{
          background: stats.labaBersihBulanIni >= 0
            ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(245,158,11,0.1) 100%)',
          borderColor: stats.labaBersihBulanIni >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            Estimasi Laba Bersih Bulan Berjalan
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: stats.labaBersihBulanIni >= 0 ? '#10b981' : '#f87171', marginTop: 4 }}>
            {formatRupiah(stats.labaBersihBulanIni)}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Total Pendapatan ({formatRupiah(stats.totalPendapatanBulanIni)}) dikurangi Semua Pengeluaran ({formatRupiah(stats.totalPengeluaranBulanIni)})
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('laporan')}>
            Lihat Analisis Lengkap
          </button>
        </div>
      </div>

      {/* Grid 2 Kolom: Jadwal Rotasi & Riwayat Terkini */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Kolom 1: Status Rotasi Panen per Kebun */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Rotasi & Pengingat Panen</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Status kesiapan panen per blok kebun</p>
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => onNavigate('kebun')}
            >
              Semua Kebun
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pengingatList.map((p) => {
              const isOverdue = p.status === 'LEWAT_JADWAL';
              const isToday = p.status === 'HARI_INI';
              const isSoon = p.status === 'SEGERA';

              let badgeClass = 'badge-success';
              let badgeText = `${p.hariTersisa} hari lagi`;
              if (isOverdue) {
                badgeClass = 'badge-danger';
                badgeText = `${Math.abs(p.hariTersisa)} hr terlambat`;
              } else if (isToday) {
                badgeClass = 'badge-warning';
                badgeText = 'Hari Ini!';
              } else if (isSoon) {
                badgeClass = 'badge-warning';
                badgeText = `${p.hariTersisa} hari lagi`;
              }

              return (
                <div
                  key={p.kebunId}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#f0fdf4' }}>{p.namaKebun}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Clock size={12} />
                      <span>Rotasi: {p.rotasiHari} hari</span>
                      <span>•</span>
                      <span>Terakhir: {p.terakhirPanen || 'Belum pernah'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge ${badgeClass}`}>{badgeText}</span>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      onClick={() => onOpenPanenModal(p.kebunId)}
                      title="Catat panen kebun ini"
                    >
                      Panen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom 2: Aktivitas Panen Terakhir */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Panen Terbaru</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Catatan penerimaan panen sawit terkini</p>
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => onNavigate('panen')}
            >
              Lihat Semua
            </button>
          </div>

          {recentPanen.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Belum ada data panen yang tercatat.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentPanen.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: 'rgba(16,185,129,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Sprout size={18} color="#10b981" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f0fdf4' }}>{getKebunName(p.kebun_id)}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {p.tanggal} • {p.berat_kg.toLocaleString('id-ID')} Kg ({p.jumlah_janjang} janjang)
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
                      {formatRupiah(p.total_pendapatan)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      @ Rp {p.harga_per_kg.toLocaleString('id-ID')}/kg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Aksi Cepat Bawah */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: 14 }}>Aksi Cepat Pengelolaan</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <button className="btn btn-secondary" style={{ padding: '14px', justifyContent: 'flex-start' }} onClick={() => onOpenPanenModal()}>
            <Sprout size={18} color="#10b981" />
            <span>+ Catat Panen Baru</span>
          </button>
          <button className="btn btn-secondary" style={{ padding: '14px', justifyContent: 'flex-start' }} onClick={onOpenPerawatanModal}>
            <TrendingUp size={18} color="#06b6d4" />
            <span>+ Catat Perawatan</span>
          </button>
          <button className="btn btn-secondary" style={{ padding: '14px', justifyContent: 'flex-start' }} onClick={onOpenPengeluaranLainModal}>
            <Receipt size={18} color="#f59e0b" />
            <span>+ Pengeluaran Lain</span>
          </button>
          <button className="btn btn-secondary" style={{ padding: '14px', justifyContent: 'flex-start' }} onClick={onOpenKebunModal}>
            <Trees size={18} color="#34d399" />
            <span>+ Tambah Blok Kebun</span>
          </button>
        </div>
      </div>
    </div>
  );
};
