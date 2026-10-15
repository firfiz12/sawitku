import React, { useState, useMemo } from 'react';
import {
  Trees,
  Sprout,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Filter,
  Receipt,
} from 'lucide-react';
import type {
  Kebun,
  Panen,
  Perawatan,
  PengeluaranLain,
  PengingatPanenInfo,
  DashboardStats,
} from '../types';
import type { NavTab } from '../components/Sidebar';
import { MonthFilter } from '../components/MonthFilter';
import { dataService } from '../services/dataService';

interface DashboardViewProps {
  stats: DashboardStats;
  dashboardMonth: string; // YYYY-MM, kosong = bulan berjalan
  onDashboardMonthChange: (ym: string) => void;
  pengingatList: PengingatPanenInfo[];
  recentPanen: Panen[];
  kebunList: Kebun[];
  perawatanList?: Perawatan[];
  pengeluaranLainList?: PengeluaranLain[];
  onNavigate: (tab: NavTab) => void;
  onOpenPanenModal: (preselectedKebunId?: string) => void;
  onOpenPerawatanModal: () => void;
  onOpenPengeluaranLainModal: () => void;
  onOpenKebunModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  dashboardMonth,
  onDashboardMonthChange,
  pengingatList,
  recentPanen,
  kebunList,
  perawatanList = [],
  pengeluaranLainList = [],
  onNavigate,
  onOpenPanenModal,
  onOpenPerawatanModal,
  onOpenPengeluaranLainModal,
  onOpenKebunModal,
}) => {
  const [filterKebunId, setFilterKebunId] = useState<string>('all');

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

  const monthLabel = dashboardMonth
    ? (() => {
        const [y, m] = dashboardMonth.split('-').map(Number);
        const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${names[(m || 1) - 1]} ${y}`;
      })()
    : 'Semua Riwayat (Akumulasi)';

  // Stats yang dihitung berdasarkan filter kebun
  const effectiveStats = useMemo(() => {
    if (filterKebunId === 'all') return stats;
    const filteredKebun = kebunList.filter((k) => k.id === filterKebunId);
    const filteredPanen = recentPanen.filter((p) => p.kebun_id === filterKebunId);
    const filteredPerawatan = perawatanList.filter((p) => p.kebun_id === filterKebunId);
    const filteredPengeluaranLain = pengeluaranLainList.filter((pl) => pl.kebun_id === filterKebunId);
    return dataService.calculateStats(
      filteredKebun,
      filteredPanen,
      filteredPerawatan,
      filteredPengeluaranLain,
      dashboardMonth || undefined
    );
  }, [filterKebunId, stats, kebunList, recentPanen, perawatanList, pengeluaranLainList, dashboardMonth]);

  const filteredPengingat = useMemo(() => {
    if (filterKebunId === 'all') return pengingatList;
    return pengingatList.filter((p) => p.kebunId === filterKebunId);
  }, [filterKebunId, pengingatList]);

  const filteredPanenList = useMemo(() => {
    if (filterKebunId === 'all') return recentPanen;
    return recentPanen.filter((p) => p.kebun_id === filterKebunId);
  }, [filterKebunId, recentPanen]);

  const overdueList = filteredPengingat.filter(
    (p) => p.status === 'LEWAT_JADWAL' || p.status === 'HARI_INI'
  );

  return (
    <div>
      {/* Pengingat Rotasi Panen Alert Banner */}
      {overdueList.length > 0 && (
        <div className="harvest-alert-banner" id="banner-harvest-alerts" style={{ marginBottom: 20 }}>
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
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#991b1b' }}>
                Pemberitahuan: {overdueList.length} Blok Kebun Siap / Lewat Jadwal Panen!
              </div>
              <div style={{ fontSize: '0.84rem', color: '#b45309', marginTop: 2, fontWeight: 500 }}>
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

      {/* Filter Bar Dashboard (Periode & Kebun) */}
      <div className="card filter-bar" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} color="#94a3b8" />
            <span style={{ fontSize: '0.86rem', color: '#64748b', fontWeight: 600 }}>Filter:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trees size={16} color="#059669" />
            <select
              id="filter-kebun-dashboard"
              className="form-select filter-control"
              style={{ width: 'auto', minWidth: 0 }}
              value={filterKebunId}
              onChange={(e) => setFilterKebunId(e.target.value)}
              title="Filter Blok Kebun"
            >
              <option value="all">Semua Blok Kebun</option>
              {kebunList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama} ({k.luas_hektar} Ha)</option>
              ))}
            </select>
          </div>

          <MonthFilter id="filter-month-dashboard" value={dashboardMonth} onChange={onDashboardMonthChange} />
        </div>

        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginTop: 6 }}>
          Menampilkan: <strong style={{ color: '#0f172a' }}>{filterKebunId === 'all' ? 'Semua Kebun' : getKebunName(filterKebunId)}</strong> • <strong style={{ color: '#0f172a' }}>{monthLabel}</strong>
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.12)' }}>
              <Trees size={20} color="#059669" />
            </div>
            <div className="stat-label">Total Luas Kebun</div>
          </div>
          <div className="stat-value">{effectiveStats.totalLuasHa.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b' }}>Ha</span></div>
          <div className="stat-subtext">
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{effectiveStats.totalKebun}</span>
            <span>Blok kebun aktif</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'rgba(217, 119, 6, 0.12)' }}>
              <Sprout size={20} color="#d97706" />
            </div>
            <div className="stat-label">{dashboardMonth ? `Produksi ${monthLabel}` : 'Total Produksi TBS'}</div>
          </div>
          <div className="stat-value">
            {effectiveStats.totalProduksiBulanIniKg.toLocaleString('id-ID')} <span style={{ fontSize: '1rem', color: '#64748b' }}>Kg</span>
          </div>
          <div className="stat-subtext">
            <TrendingUp size={14} color="#059669" />
            <span style={{ color: '#047857', fontWeight: 600 }}>TBS Sawit Segar</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)' }}>
              <ArrowUpRight size={20} color="#059669" />
            </div>
            <div className="stat-label">{dashboardMonth ? `Pendapatan ${monthLabel}` : 'Total Pendapatan TBS'}</div>
          </div>
          <div className="stat-value" style={{ color: '#047857' }}>
            {formatRupiah(effectiveStats.totalPendapatanBulanIni)}
          </div>
          <div className="stat-subtext">
            <span>Hasil penjualan TBS</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'rgba(220, 38, 38, 0.12)' }}>
              <ArrowDownRight size={20} color="#dc2626" />
            </div>
            <div className="stat-label">{dashboardMonth ? `Pengeluaran ${monthLabel}` : 'Total Pengeluaran'}</div>
          </div>
          <div className="stat-value" style={{ color: '#b91c1c' }}>
            {formatRupiah(effectiveStats.totalPengeluaranBulanIni)}
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
          background: effectiveStats.labaBersihBulanIni >= 0
            ? 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)'
            : 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)',
          borderColor: effectiveStats.labaBersihBulanIni >= 0 ? '#a7f3d0' : '#fecaca',
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
          <div style={{ fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', overflowWrap: 'anywhere' }}>
            {dashboardMonth ? `Estimasi Laba Bersih (${monthLabel})` : 'Estimasi Laba Bersih (Keseluruhan)'}
          </div>
          <div className="laba-value" style={{ color: effectiveStats.labaBersihBulanIni >= 0 ? '#047857' : '#b91c1c' }}>
            {formatRupiah(effectiveStats.labaBersihBulanIni)}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 4, overflowWrap: 'anywhere', lineHeight: 1.5 }}>
            Pendapatan (<strong style={{ color: '#047857' }}>{formatRupiah(effectiveStats.totalPendapatanBulanIni)}</strong>) − Pengeluaran (<strong style={{ color: '#b91c1c' }}>{formatRupiah(effectiveStats.totalPengeluaranBulanIni)}</strong>)
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
              <h3 className="h3-card-title">Rotasi & Pengingat Panen</h3>
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
            {filteredPengingat.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '0.88rem' }}>
                Tidak ada data rotasi panen untuk filter ini.
              </div>
            ) : (
              filteredPengingat.map((p) => {
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
                      flexWrap: 'wrap',
                      gap: 10,
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
              })
            )}
          </div>
        </div>

        {/* Kolom 2: Aktivitas Panen Terakhir */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="h3-card-title">Panen Terbaru</h3>
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

          {filteredPanenList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b', fontSize: '0.9rem' }}>
              Belum ada data panen yang tercatat.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredPanenList.slice(0, 5).map((p) => (
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
                    flexWrap: 'wrap',
                    gap: 10,
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
                        {p.tanggal} • {p.berat_bersih_kg.toLocaleString('id-ID')} Kg 
                        {p.berat_brondolan_kg > 0 ? ` + ${p.berat_brondolan_kg.toLocaleString('id-ID')} Kg brondol` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 0 }}>
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
        <h3 className="h3-card-title" style={{ marginBottom: 14 }}>Aksi Cepat Pengelolaan</h3>
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
