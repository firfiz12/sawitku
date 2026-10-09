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
  ChevronRight,
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
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={24} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#991b1b' }}>
                Perhatian: {overdueList.length} Blok Kebun Siap / Lewat Jadwal Panen!
              </div>
              <div style={{ fontSize: '0.85rem', color: '#b45309', marginTop: 2, fontWeight: 500 }}>
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
          <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.12)' }}>
            <Trees size={22} color="#059669" />
          </div>
          <div className="stat-label">Total Luas Kebun</div>
          <div className="stat-value">{stats.totalLuasHa.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b' }}>Ha</span></div>
          <div className="stat-subtext">
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{stats.totalKebun}</span>
            <span>Blok kebun produktif</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(217, 119, 6, 0.12)' }}>
            <Sprout size={22} color="#d97706" />
          </div>
          <div className="stat-label">Produksi Bulan Ini</div>
          <div className="stat-value">
            {stats.totalProduksiBulanIniKg.toLocaleString('id-ID')} <span style={{ fontSize: '1rem', color: '#64748b' }}>Kg</span>
          </div>
          <div className="stat-subtext">
            <TrendingUp size={14} color="#059669" />
            <span style={{ color: '#047857', fontWeight: 600 }}>TBS Sawit Segar</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)' }}>
            <ArrowUpRight size={22} color="#059669" />
          </div>
          <div className="stat-label">Pendapatan Bulan Ini</div>
          <div className="stat-value" style={{ color: '#047857' }}>
            {formatRupiah(stats.totalPendapatanBulanIni)}
          </div>
          <div className="stat-subtext">
            <span>Hasil penjualan TBS</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(220, 38, 38, 0.12)' }}>
            <ArrowDownRight size={22} color="#dc2626" />
          </div>
          <div className="stat-label">Pengeluaran Bulan Ini</div>
          <div className="stat-value" style={{ color: '#b91c1c' }}>
            {formatRupiah(stats.totalPengeluaranBulanIni)}
          </div>
          <div className="stat-subtext">
            <span>Perawatan & Operasional</span>
          </div>
        </div>
      </div>

      {/* Laba Bersih Banner Card */}
      <div
        className="card"
        style={{
          background: stats.labaBersihBulanIni >= 0
            ? 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)'
            : 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)',
          borderColor: stats.labaBersihBulanIni >= 0 ? '#a7f3d0' : '#fecaca',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
            Estimasi Laba Bersih Bulan Berjalan
          </div>
          <div className="laba-value" style={{ color: stats.labaBersihBulanIni >= 0 ? '#047857' : '#b91c1c' }}>
            {formatRupiah(stats.labaBersihBulanIni)}
          </div>
          <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: 4 }}>
            Total Pendapatan (<strong style={{ color: '#047857' }}>{formatRupiah(stats.totalPendapatanBulanIni)}</strong>) dikurangi Pengeluaran (<strong style={{ color: '#b91c1c' }}>{formatRupiah(stats.totalPengeluaranBulanIni)}</strong>)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('laporan')} style={{ fontWeight: 700 }}>
            <span>Lihat Analisis Lengkap</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid 2 Kolom: Jadwal Rotasi & Riwayat Terkini */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Kolom 1: Status Rotasi Panen per Kebun */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Rotasi & Pengingat Panen</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Status kesiapan panen per blok kebun</p>
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
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.96rem' }}>{p.namaKebun}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <Clock size={13} color="#94a3b8" />
                      <span>Rotasi: {p.rotasiHari} hari</span>
                      <span>•</span>
                      <span>Terakhir: {p.terakhirPanen || 'Belum pernah'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span className={`badge ${badgeClass}`}>{badgeText}</span>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Panen Terbaru</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Catatan penerimaan TBS kelapa sawit terkini</p>
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
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b', fontSize: '0.9rem' }}>
              Belum ada data panen yang tercatat.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentPanen.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(5, 150, 105, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Sprout size={20} color="#059669" />
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getKebunName(p.kebun_id)}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2, whiteSpace: 'nowrap' }}>
                        {p.tanggal} • {p.berat_kg.toLocaleString('id-ID')} Kg ({p.jumlah_janjang} janjang)
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 0, marginLeft: 10 }}>
                    <div style={{ fontWeight: 800, color: '#047857', fontSize: '0.98rem', whiteSpace: 'nowrap' }}>
                      {formatRupiah(p.total_pendapatan)}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', whiteSpace: 'nowrap' }}>
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
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 14 }}>Aksi Cepat Pengelolaan</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <button className="btn btn-secondary" style={{ padding: '14px', justifyContent: 'flex-start', background: '#f8fafc' }} onClick={() => onOpenPanenModal()}>
            <Sprout size={18} color="#059669" />
            <span style={{ fontWeight: 700 }}>+ Catat Panen Baru</span>
          </button>
          <button className="btn btn-secondary" style={{ padding: '14px', justifyContent: 'flex-start', background: '#f8fafc' }} onClick={onOpenPerawatanModal}>
            <TrendingUp size={18} color="#0284c7" />
            <span style={{ fontWeight: 700 }}>+ Catat Perawatan</span>
          </button>
          <button className="btn btn-secondary" style={{ padding: '14px', justifyContent: 'flex-start', background: '#f8fafc' }} onClick={onOpenPengeluaranLainModal}>
            <Receipt size={18} color="#d97706" />
            <span style={{ fontWeight: 700 }}>+ Pengeluaran Lain</span>
          </button>
          <button className="btn btn-secondary" style={{ padding: '14px', justifyContent: 'flex-start', background: '#f8fafc' }} onClick={onOpenKebunModal}>
            <Trees size={18} color="#059669" />
            <span style={{ fontWeight: 700 }}>+ Tambah Blok Kebun</span>
          </button>
        </div>
      </div>
    </div>
  );
};
