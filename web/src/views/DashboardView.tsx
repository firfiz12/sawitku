import React, { useState, useMemo } from 'react';
import {
  Trees,
  Sprout,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Filter,
  Receipt,
  Wrench,
  Lightbulb,
  Info,
  ArrowUpDown,
  CalendarDays,
  Minus,
} from 'lucide-react';
import type {
  Kebun,
  Panen,
  Perawatan,
  PengeluaranLain,
  PengingatPanenStatus,
  DashboardStats,
} from '../types';
import type { NavTab } from '../components/Sidebar';
import { MonthFilter } from '../components/MonthFilter';
import { dataService, allocatePengeluaranLain } from '../services/dataService';
import { currentYear, currentYearMonth } from '../lib/date';
import { ProductionTrendChart } from '../components/ReportCharts';
import type { TrendPoint } from '../components/ReportCharts';
import './DashboardView.css';

interface DashboardViewProps {
  stats: DashboardStats;
  dashboardMonth: string; // YYYY-MM, kosong = bulan berjalan
  onDashboardMonthChange: (ym: string) => void;
  pengingatList: import('../types').PengingatPanenInfo[];
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

type HarvestStatus =
  | 'TERLAMBAT'
  | 'SEGERA'
  | 'MENDATANG'
  | 'SUDAH_DIPANEN'
  | 'BELUM_ADA_JADWAL';

interface HarvestReminder {
  kebunId: string;
  namaKebun: string;
  rotasiHari: number;
  terakhirPanen: string | null;
  panenBerikutnya: string | null;
  hariTersisa: number | null;
  status: HarvestStatus;
}

type InsightTone = 'danger' | 'warning' | 'positive' | 'neutral';

interface DashboardInsight {
  id: string;
  tone: InsightTone;
  title: string;
  description: string;
  basis: string;
}

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const HARVEST_STATUS_META: Record<
  HarvestStatus,
  { label: string; className: string; priority: number }
> = {
  TERLAMBAT: { label: 'Terlambat', className: 'dash-status danger', priority: 0 },
  SEGERA: { label: 'Segera Panen', className: 'dash-status warning', priority: 1 },
  BELUM_ADA_JADWAL: {
    label: 'Belum Ada Jadwal',
    className: 'dash-status neutral',
    priority: 2,
  },
  SUDAH_DIPANEN: {
    label: 'Sudah Dipanen',
    className: 'dash-status success',
    priority: 3,
  },
  MENDATANG: {
    label: 'Jadwal Mendatang',
    className: 'dash-status info',
    priority: 4,
  },
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDateID(value: string | null): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return `${String(day).padStart(2, '0')} ${MONTHS_SHORT[month - 1]} ${year}`;
}

function shiftMonth(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isInPeriod(dateStr: string, month: string, year: string): boolean {
  if (!dateStr) return false;
  if (month) return dateStr.startsWith(month);
  if (year !== 'all') return dateStr.startsWith(year);
  return true;
}

function toHarvestStatus(status: PengingatPanenStatus): HarvestStatus {
  switch (status) {
    case 'LEWAT_JADWAL':
      return 'TERLAMBAT';
    case 'HARI_INI':
    case 'SEGERA':
      return 'SEGERA';
    case 'SUDAH_DIPANEN':
      return 'SUDAH_DIPANEN';
    case 'BELUM_ADA_JADWAL':
      return 'BELUM_ADA_JADWAL';
    default:
      return 'MENDATANG';
  }
}

function harvestDaysText(reminder: HarvestReminder): string {
  switch (reminder.status) {
    case 'TERLAMBAT':
      return `${Math.abs(reminder.hariTersisa ?? 0)} hari terlambat`;
    case 'SEGERA':
      return (reminder.hariTersisa ?? 0) <= 0
        ? 'Jadwal hari ini'
        : `${reminder.hariTersisa} hari lagi`;
    case 'MENDATANG':
      return `${reminder.hariTersisa ?? 0} hari lagi`;
    case 'SUDAH_DIPANEN':
      return 'Panen tercatat hari ini';
    default:
      return 'Belum ada catatan panen';
  }
}

const EmptyState: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div className="dash-empty">
    <strong>{title}</strong>
    <span>{description}</span>
  </div>
);

function renderInsightIcon(tone: InsightTone): React.ReactNode {
  switch (tone) {
    case 'danger':
      return <AlertTriangle size={18} color="#b91c1c" />;
    case 'warning':
      return <Wrench size={18} color="#b45309" />;
    case 'positive':
      return <TrendingUp size={18} color="#047857" />;
    default:
      return <Lightbulb size={18} color="#0369a1" />;
  }
}

export const DashboardView: React.FC<DashboardViewProps> = ({
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
  const [selectedYear, setSelectedYear] = useState<string>('all'); // 'all' atau 'YYYY'
  const [blockSort, setBlockSort] = useState<'desc' | 'asc'>('desc');

  const getKebunName = (id: string) => {
    const kebun = kebunList.find((item) => item.id === id);
    return kebun ? kebun.nama : 'Kebun';
  };

  // Daftar tahun yang tersedia dari data riwayat
  const availableYears = useMemo(() => {
    const currentY = Number(currentYear());
    const yearSet = new Set<number>([currentY]);
    const collect = (items: Array<{ tanggal: string }>) => {
      items.forEach((item) => {
        if (!item.tanggal) return;
        const year = parseInt(item.tanggal.slice(0, 4), 10);
        if (!Number.isNaN(year)) yearSet.add(year);
      });
    };
    collect(recentPanen);
    collect(perawatanList);
    collect(pengeluaranLainList);
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [recentPanen, perawatanList, pengeluaranLainList]);

  const periodLabel = useMemo(() => {
    if (dashboardMonth) {
      const [year, month] = dashboardMonth.split('-').map(Number);
      return `${MONTHS_SHORT[(month || 1) - 1]} ${year}`;
    }
    if (selectedYear !== 'all') return `Tahun ${selectedYear}`;
    return 'Semua Riwayat (Akumulasi)';
  }, [dashboardMonth, selectedYear]);

  const filteredKebunList = useMemo(
    () =>
      filterKebunId === 'all'
        ? kebunList
        : kebunList.filter((kebun) => kebun.id === filterKebunId),
    [filterKebunId, kebunList]
  );

  const panenByKebun = useMemo(
    () =>
      filterKebunId === 'all'
        ? recentPanen
        : recentPanen.filter((item) => item.kebun_id === filterKebunId),
    [filterKebunId, recentPanen]
  );

  const perawatanByKebun = useMemo(
    () =>
      filterKebunId === 'all'
        ? perawatanList
        : perawatanList.filter((item) => item.kebun_id === filterKebunId),
    [filterKebunId, perawatanList]
  );

  const pengeluaranByKebun = useMemo(
    () =>
      filterKebunId === 'all'
        ? pengeluaranLainList
        : allocatePengeluaranLain(
            pengeluaranLainList,
            filterKebunId,
            kebunList.length
          ),
    [filterKebunId, pengeluaranLainList, kebunList.length]
  );

  const panenInPeriod = useMemo(
    () =>
      panenByKebun.filter((item) =>
        isInPeriod(item.tanggal, dashboardMonth, selectedYear)
      ),
    [panenByKebun, dashboardMonth, selectedYear]
  );

  const perawatanInPeriod = useMemo(
    () =>
      perawatanByKebun.filter((item) =>
        isInPeriod(item.tanggal, dashboardMonth, selectedYear)
      ),
    [perawatanByKebun, dashboardMonth, selectedYear]
  );

  const pengeluaranInPeriod = useMemo(
    () =>
      pengeluaranByKebun.filter((item) =>
        isInPeriod(item.tanggal, dashboardMonth, selectedYear)
      ),
    [pengeluaranByKebun, dashboardMonth, selectedYear]
  );

  const effectiveStats = useMemo(
    () =>
      dataService.calculateStats(
        filteredKebunList,
        panenInPeriod,
        perawatanInPeriod,
        pengeluaranInPeriod
      ),
    [filteredKebunList, panenInPeriod, perawatanInPeriod, pengeluaranInPeriod]
  );

  const totalProduction = useMemo(
    () =>
      panenInPeriod.reduce(
        (total, item) =>
          total +
          (Number(item.berat_bersih_kg) || 0) +
          (Number(item.berat_brondolan_kg) || 0),
        0
      ),
    [panenInPeriod]
  );

  const hasPanenData = panenInPeriod.length > 0;
  const profitMargin =
    effectiveStats.totalPendapatanBulanIni > 0
      ? (effectiveStats.labaBersihBulanIni /
          effectiveStats.totalPendapatanBulanIni) *
        100
      : null;

  const harvestReminders = useMemo<HarvestReminder[]>(() => {
    const filtered =
      filterKebunId === 'all'
        ? pengingatList
        : pengingatList.filter((item) => item.kebunId === filterKebunId);

    return filtered
      .map<HarvestReminder>((item) => ({
        kebunId: item.kebunId,
        namaKebun: item.namaKebun,
        rotasiHari: item.rotasiHari,
        terakhirPanen: item.terakhirPanen,
        panenBerikutnya: item.panenBerikutnya,
        hariTersisa: item.hariTersisa,
        status: toHarvestStatus(item.status),
      }))
      .sort((a, b) => {
        const priorityDiff =
          HARVEST_STATUS_META[a.status].priority -
          HARVEST_STATUS_META[b.status].priority;
        if (priorityDiff !== 0) return priorityDiff;
        return (
          (a.hariTersisa ?? Number.MAX_SAFE_INTEGER) -
          (b.hariTersisa ?? Number.MAX_SAFE_INTEGER)
        );
      });
  }, [filterKebunId, pengingatList]);

  const overdueHarvest = useMemo(
    () => harvestReminders.filter((item) => item.status === 'TERLAMBAT'),
    [harvestReminders]
  );

  const latestHarvests = useMemo(
    () =>
      [...panenInPeriod]
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
        .slice(0, 5),
    [panenInPeriod]
  );

  const maintenanceOverview = useMemo(() => {
    const latestByKebun = new Map<string, Perawatan>();
    perawatanByKebun.forEach((item) => {
      const current = latestByKebun.get(item.kebun_id);
      if (!current || item.tanggal > current.tanggal) {
        latestByKebun.set(item.kebun_id, item);
      }
    });

    return filteredKebunList
      .map((kebun) => ({
        kebun,
        last: latestByKebun.get(kebun.id) ?? null,
      }))
      .sort((a, b) => {
        if (!a.last && !b.last) return a.kebun.nama.localeCompare(b.kebun.nama);
        if (!a.last) return 1;
        if (!b.last) return -1;
        return b.last.tanggal.localeCompare(a.last.tanggal);
      });
  }, [filteredKebunList, perawatanByKebun]);

  const blockPerformance = useMemo(() => {
    const rows = filteredKebunList.map((kebun) => {
      const kebunPanen = panenInPeriod.filter(
        (item) => item.kebun_id === kebun.id
      );
      const production = kebunPanen.reduce(
        (total, item) =>
          total +
          (Number(item.berat_bersih_kg) || 0) +
          (Number(item.berat_brondolan_kg) || 0),
        0
      );
      const luas = Number(kebun.luas_hektar) || 0;
      const hasPanen = kebunPanen.length > 0;
      const yieldKgPerHa =
        luas > 0 && hasPanen ? production / luas : null;

      return { kebun, luas, production, hasPanen, yieldKgPerHa };
    });

    rows.sort((a, b) => {
      if (a.yieldKgPerHa === null && b.yieldKgPerHa === null) {
        return a.kebun.nama.localeCompare(b.kebun.nama);
      }
      if (a.yieldKgPerHa === null) return 1;
      if (b.yieldKgPerHa === null) return -1;
      return blockSort === 'desc'
        ? b.yieldKgPerHa - a.yieldKgPerHa
        : a.yieldKgPerHa - b.yieldKgPerHa;
    });

    return rows;
  }, [filteredKebunList, panenInPeriod, blockSort]);

  const maxYield = useMemo(
    () =>
      Math.max(
        0,
        ...blockPerformance.map((row) => row.yieldKgPerHa ?? 0)
      ) || 1,
    [blockPerformance]
  );

  const trendEndMonth = useMemo(() => {
    if (dashboardMonth) return dashboardMonth;
    if (selectedYear !== 'all') {
      const currentY = currentYear();
      return selectedYear === currentY
        ? currentYearMonth()
        : `${selectedYear}-12`;
    }
    return currentYearMonth();
  }, [dashboardMonth, selectedYear]);

  const productionTrend = useMemo<TrendPoint[]>(() => {
    const months: string[] = [];
    for (let index = 5; index >= 0; index -= 1) {
      months.push(shiftMonth(trendEndMonth, -index));
    }

    return months.map((yearMonth) => {
      const [year, month] = yearMonth.split('-').map(Number);
      const monthPanen = panenByKebun.filter((item) =>
        item.tanggal.startsWith(yearMonth)
      );
      const production = monthPanen.reduce(
        (total, item) =>
          total +
          (Number(item.berat_bersih_kg) || 0) +
          (Number(item.berat_brondolan_kg) || 0),
        0
      );

      return {
        key: yearMonth,
        label: `${MONTHS_SHORT[month - 1]} '${String(year).slice(-2)}`,
        fullLabel: `${MONTH_NAMES[month - 1]} ${year}`,
        pendapatan: 0,
        pengeluaran: 0,
        laba: 0,
        production,
        hasProduction: monthPanen.length > 0,
      };
    });
  }, [panenByKebun, trendEndMonth]);

  const trendIndicator = useMemo(() => {
    const last = productionTrend[productionTrend.length - 1];
    const previous = productionTrend[productionTrend.length - 2];

    if (!last || !previous) {
      return {
        tone: 'neutral' as InsightTone,
        label: 'Belum cukup data',
        detail: 'Butuh minimal dua bulan data untuk membandingkan produksi.',
      };
    }

    if (!last.hasProduction || !previous.hasProduction) {
      const missing = !last.hasProduction ? last.fullLabel : previous.fullLabel;
      return {
        tone: 'neutral' as InsightTone,
        label: 'Belum bisa dibandingkan',
        detail: `Belum ada catatan panen pada ${missing}.`,
      };
    }

    if (previous.production === 0) {
      if (last.production > 0) {
        return {
          tone: 'positive' as InsightTone,
          label: 'Produksi mulai tercatat',
          detail: `${previous.fullLabel}: 0 kg → ${last.fullLabel}: ${formatNumber(
            last.production
          )} kg.`,
        };
      }
      return {
        tone: 'neutral' as InsightTone,
        label: 'Tidak ada perubahan',
        detail: 'Kedua bulan tercatat 0 kg.',
      };
    }

    const delta =
      ((last.production - previous.production) / previous.production) * 100;

    if (Math.abs(delta) < 0.05) {
      return {
        tone: 'neutral' as InsightTone,
        label: 'Produksi stabil',
        detail: `${previous.fullLabel} dan ${last.fullLabel} sama-sama ${formatNumber(
          last.production
        )} kg.`,
      };
    }

    return {
      tone: (delta > 0 ? 'positive' : 'danger') as InsightTone,
      label: `Produksi ${delta > 0 ? 'naik' : 'turun'} ${Math.abs(delta).toFixed(
        1
      )}%`,
      detail: `${previous.fullLabel}: ${formatNumber(
        previous.production
      )} kg → ${last.fullLabel}: ${formatNumber(last.production)} kg.`,
    };
  }, [productionTrend]);

  const insights = useMemo<DashboardInsight[]>(() => {
    const list: DashboardInsight[] = [];

    if (overdueHarvest.length > 0) {
      list.push({
        id: 'overdue-harvest',
        tone: 'danger',
        title: `${overdueHarvest.length} blok terlambat panen`,
        description: overdueHarvest
          .map((item) => item.namaKebun)
          .join(', '),
        basis:
          'Dasar: jadwal panen berikutnya (panen terakhir + rotasi) sudah lewat dari hari ini.',
      });
    }

    const withoutMaintenance = maintenanceOverview.filter(
      (row) => !row.last
    );
    if (withoutMaintenance.length > 0) {
      list.push({
        id: 'no-maintenance',
        tone: 'warning',
        title: `${withoutMaintenance.length} blok belum punya catatan perawatan`,
        description: withoutMaintenance
          .map((row) => row.kebun.nama)
          .join(', '),
        basis: 'Dasar: tidak ada transaksi perawatan tercatat untuk blok tersebut.',
      });
    }

    const withYield = blockPerformance.filter(
      (row) => row.yieldKgPerHa !== null
    );
    if (withYield.length > 0) {
      const best = [...withYield].sort(
        (a, b) => (b.yieldKgPerHa ?? 0) - (a.yieldKgPerHa ?? 0)
      )[0];
      list.push({
        id: 'best-yield',
        tone: 'positive',
        title: `Produktivitas tertinggi: ${best.kebun.nama}`,
        description: `${formatNumber(
          best.yieldKgPerHa ?? 0
        )} kg/ha dari ${formatNumber(best.production)} kg produksi.`,
        basis: `Dasar: ${formatNumber(best.production)} kg ÷ ${formatDecimal(
          best.luas
        )} Ha pada ${periodLabel}.`,
      });
    }

    if (trendIndicator.tone !== 'neutral') {
      list.push({
        id: 'production-trend',
        tone: trendIndicator.tone,
        title: trendIndicator.label,
        description: trendIndicator.detail,
        basis:
          'Dasar: perbandingan total produksi dua bulan terakhir pada grafik tren.',
      });
    } else if (productionTrend.some((point) => point.hasProduction)) {
      list.push({
        id: 'production-trend-neutral',
        tone: 'neutral',
        title: 'Tren produksi belum bisa disimpulkan',
        description: trendIndicator.detail,
        basis: 'Dasar: data bulanan belum lengkap untuk dibandingkan.',
      });
    }

    return list;
  }, [
    overdueHarvest,
    maintenanceOverview,
    blockPerformance,
    trendIndicator,
    productionTrend,
    periodLabel,
  ]);

  const hasActiveFilter =
    filterKebunId !== 'all' || selectedYear !== 'all' || dashboardMonth !== '';

  return (
    <div className="dash-page">
      {/* Notifikasi rotasi panen */}
      {overdueHarvest.length > 0 && (
        <div
          className="harvest-alert-banner dash-alert"
          id="banner-harvest-alerts"
        >
          <div className="dash-alert-main">
            <div className="dash-alert-icon">
              <AlertTriangle size={22} color="#dc2626" />
            </div>
            <div>
              <div className="dash-alert-title">
                Pemberitahuan: {overdueHarvest.length} blok siap / lewat jadwal
                panen
              </div>
              <div className="dash-alert-sub">
                {overdueHarvest
                  .map(
                    (item) =>
                      `${item.namaKebun} (${
                        Math.abs(item.hariTersisa ?? 0)
                      } hari terlambat)`
                  )
                  .join(' • ')}
              </div>
            </div>
          </div>
          <span className="dash-alert-note">
            Tindak lanjut tersedia pada kartu Rotasi &amp; Pengingat Panen.
          </span>
        </div>
      )}

      {/* Filter kebun & periode */}
      <div className="card filter-bar dash-filter-bar">
        <div className="dash-filter-controls">
          <div className="dash-filter-label">
            <Filter size={16} color="#94a3b8" />
            <span>Filter:</span>
          </div>

          <div className="dash-filter-group">
            <Trees size={16} color="#059669" />
            <select
              id="filter-kebun-dashboard"
              className="form-select filter-control"
              value={filterKebunId}
              onChange={(event) => setFilterKebunId(event.target.value)}
              title="Filter Blok Kebun"
            >
              <option value="all">Semua Blok Kebun</option>
              {kebunList.map((kebun) => (
                <option key={kebun.id} value={kebun.id}>
                  {kebun.nama} ({kebun.luas_hektar} Ha)
                </option>
              ))}
            </select>
          </div>

          <select
            id="filter-tahun-dashboard"
            className="form-select filter-control"
            value={selectedYear}
            onChange={(event) => {
              const year = event.target.value;
              setSelectedYear(year);
              if (year === 'all') {
                onDashboardMonthChange('');
              } else if (
                dashboardMonth &&
                !dashboardMonth.startsWith(year)
              ) {
                onDashboardMonthChange('');
              }
            }}
            title="Filter Tahun"
          >
            <option value="all">Semua Tahun</option>
            {availableYears.map((year) => (
              <option key={year} value={String(year)}>
                Tahun {year}
              </option>
            ))}
          </select>

          <MonthFilter
            id="filter-month-dashboard"
            value={dashboardMonth}
            onChange={(yearMonth) => {
              onDashboardMonthChange(yearMonth);
              if (yearMonth) {
                setSelectedYear(yearMonth.slice(0, 4));
              }
            }}
          />

          {hasActiveFilter && (
            <button
              type="button"
              className="btn btn-secondary dash-reset-btn"
              onClick={() => {
                setFilterKebunId('all');
                setSelectedYear('all');
                onDashboardMonthChange('');
              }}
            >
              Reset
            </button>
          )}
        </div>

        <span className="dash-filter-summary">
          Menampilkan:{' '}
          <strong>
            {filterKebunId === 'all'
              ? 'Semua Kebun'
              : getKebunName(filterKebunId)}
          </strong>{' '}
          • <strong>{periodLabel}</strong>
          {filterKebunId !== 'all' && kebunList.length > 0 && (
            <> • Biaya umum dibagi ke {kebunList.length} kebun</>
          )}
        </span>
      </div>

      {/* Empat kartu statistik utama */}
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-header">
            <div
              className="stat-icon"
              style={{ background: 'rgba(5, 150, 105, 0.12)' }}
            >
              <Trees size={20} color="#059669" />
            </div>
            <div className="stat-label">Total Luas Kebun</div>
          </div>
          <div className="stat-value">
            {effectiveStats.totalLuasHa.toFixed(1)}{' '}
            <span style={{ fontSize: '1rem', color: '#64748b' }}>Ha</span>
          </div>
          <div className="stat-subtext">
            <span style={{ fontWeight: 600, color: '#0f172a' }}>
              {effectiveStats.totalKebun}
            </span>
            <span>Blok kebun aktif</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <div
              className="stat-icon"
              style={{ background: 'rgba(217, 119, 6, 0.12)' }}
            >
              <Sprout size={20} color="#d97706" />
            </div>
            <div className="stat-label">
              {dashboardMonth || selectedYear !== 'all'
                ? `Produksi (${periodLabel})`
                : 'Total Produksi TBS'}
            </div>
          </div>
          <div className="stat-value">
            {hasPanenData ? (
              <>
                {formatNumber(totalProduction)}{' '}
                <span style={{ fontSize: '1rem', color: '#64748b' }}>Kg</span>
              </>
            ) : (
              <span style={{ color: '#94a3b8' }}>—</span>
            )}
          </div>
          <div className="stat-subtext">
            {hasPanenData ? (
              <>
                <TrendingUp size={14} color="#059669" />
                <span style={{ color: '#047857', fontWeight: 600 }}>
                  TBS + brondolan
                </span>
              </>
            ) : (
              <>
                <Info size={14} color="#94a3b8" />
                <span>Belum ada catatan panen</span>
              </>
            )}
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <div
              className="stat-icon"
              style={{ background: 'rgba(16, 185, 129, 0.12)' }}
            >
              <ArrowUpRight size={20} color="#059669" />
            </div>
            <div className="stat-label">
              {dashboardMonth || selectedYear !== 'all'
                ? `Pendapatan (${periodLabel})`
                : 'Total Pendapatan TBS'}
            </div>
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
            <div
              className="stat-icon"
              style={{ background: 'rgba(220, 38, 38, 0.12)' }}
            >
              <ArrowDownRight size={20} color="#dc2626" />
            </div>
            <div className="stat-label">
              {dashboardMonth || selectedYear !== 'all'
                ? `Pengeluaran (${periodLabel})`
                : 'Total Pengeluaran'}
            </div>
          </div>
          <div className="stat-value" style={{ color: '#b91c1c' }}>
            {formatRupiah(effectiveStats.totalPengeluaranBulanIni)}
          </div>
          <div className="stat-subtext">
            <span>Perawatan &amp; operasional</span>
          </div>
        </div>
      </div>

      {/* Ringkasan laba bersih */}
      <div
        className={`card dash-profit ${
          effectiveStats.labaBersihBulanIni >= 0 ? 'positive' : 'negative'
        }`}
      >
        <div className="dash-profit-main">
          <div className="dash-profit-label">
            Estimasi Laba Bersih ({periodLabel})
          </div>
          <div
            className="dash-profit-value"
            style={{
              color:
                effectiveStats.labaBersihBulanIni >= 0 ? '#047857' : '#b91c1c',
            }}
          >
            {formatRupiah(effectiveStats.labaBersihBulanIni)}
          </div>
          <div className="dash-profit-meta">
            Pendapatan{' '}
            <strong className="income">
              {formatRupiah(effectiveStats.totalPendapatanBulanIni)}
            </strong>{' '}
            − Pengeluaran{' '}
            <strong className="expense">
              {formatRupiah(effectiveStats.totalPengeluaranBulanIni)}
            </strong>
          </div>
        </div>

        <div className="dash-profit-side">
          <div className="dash-profit-margin">
            <span>Margin keuntungan</span>
            <strong>{profitMargin !== null ? `${profitMargin.toFixed(1)}%` : '—'}</strong>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('laporan')}
          >
            <span>Lihat Analisis Lengkap</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Rotasi & Panen Terbaru */}
      <div className="dash-grid-2">
        <section className="card">
          <div className="dash-card-header">
            <div>
              <h3 className="h3-card-title">Rotasi &amp; Pengingat Panen</h3>
              <p className="dash-card-subtitle">
                Status per blok berdasarkan transaksi panen aktual dan rotasi.
              </p>
            </div>
            <span className="badge badge-info">
              {harvestReminders.length} blok
            </span>
          </div>

          {harvestReminders.length === 0 ? (
            <EmptyState
              title="Belum ada blok kebun"
              description="Tambahkan blok kebun untuk melihat status rotasi panen."
            />
          ) : (
            <div className="dash-reminder-list">
              {harvestReminders.map((reminder) => {
                const meta = HARVEST_STATUS_META[reminder.status];
                return (
                  <div className="dash-reminder" key={reminder.kebunId}>
                    <div className="dash-reminder-main">
                      <div className="dash-reminder-name">
                        {reminder.namaKebun}
                      </div>
                      <div className="dash-reminder-meta">
                        <span>
                          <Clock size={12} /> Rotasi {reminder.rotasiHari} hari
                        </span>
                        <span>
                          Terakhir: {formatDateID(reminder.terakhirPanen)}
                        </span>
                        <span>
                          Berikutnya: {formatDateID(reminder.panenBerikutnya)}
                        </span>
                      </div>
                    </div>
                    <div className="dash-reminder-side">
                      <div className="dash-reminder-status">
                        <span className={meta.className}>{meta.label}</span>
                        <span className="dash-days">
                          {harvestDaysText(reminder)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary dash-btn-sm"
                        onClick={() => onOpenPanenModal(reminder.kebunId)}
                        title="Catat panen blok ini"
                      >
                        <Sprout size={14} />
                        <span>Catat Panen</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card">
          <div className="dash-card-header">
            <div>
              <h3 className="h3-card-title">Panen Terbaru</h3>
              <p className="dash-card-subtitle">
                Tanggal, blok, berat, harga, dan total penerimaan.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary dash-btn-sm"
              onClick={() => onNavigate('panen')}
            >
              <span>Lihat Semua</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {latestHarvests.length === 0 ? (
            <EmptyState
              title="Belum ada panen pada periode ini"
              description="Ubah filter periode atau catat panen baru untuk menampilkan data."
            />
          ) : (
            <div className="dash-panen-list">
              {latestHarvests.map((item) => (
                <div className="dash-panen-item" key={item.id}>
                  <div className="dash-panen-main">
                    <div className="dash-panen-name">
                      {getKebunName(item.kebun_id)}
                    </div>
                    <div className="dash-panen-meta">
                      <span>{formatDateID(item.tanggal)}</span>
                      <span>
                        {formatNumber(item.berat_bersih_kg)} kg TBS
                        {item.berat_brondolan_kg > 0
                          ? ` + ${formatNumber(item.berat_brondolan_kg)} kg brondol`
                          : ''}
                      </span>
                      <span>@ {formatRupiah(item.harga_per_kg)}/kg</span>
                    </div>
                  </div>
                  <div className="dash-panen-amount">
                    <strong>{formatRupiah(item.total_pendapatan)}</strong>
                    <span>Total penerimaan</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Aktivitas perawatan */}
      <section className="card">
        <div className="dash-card-header">
          <div>
            <h3 className="h3-card-title">Aktivitas Perawatan</h3>
            <p className="dash-card-subtitle">
              Riwayat perawatan aktual per blok. Tidak ada jadwal rekaan.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary dash-btn-sm"
            onClick={onOpenPerawatanModal}
          >
            <Wrench size={14} />
            <span>Catat Perawatan</span>
          </button>
        </div>

        {maintenanceOverview.length === 0 ? (
          <EmptyState
            title="Belum ada blok kebun"
            description="Tambahkan blok kebun untuk menampilkan aktivitas perawatan."
          />
        ) : (
          <div className="dash-maint-grid">
            {maintenanceOverview.map(({ kebun, last }) => (
              <div className="dash-maint-item" key={kebun.id}>
                <div className="dash-maint-head">
                  <strong>{kebun.nama}</strong>
                  <span
                    className={
                      last ? 'dash-status success' : 'dash-status neutral'
                    }
                  >
                    {last ? 'Sudah Dilaksanakan' : 'Belum Ada Aktivitas'}
                  </span>
                </div>
                {last ? (
                  <>
                    <div className="dash-maint-meta">
                      <Wrench size={12} /> {last.jenis_perawatan}
                    </div>
                    <div className="dash-maint-meta">
                      <CalendarDays size={12} /> {formatDateID(last.tanggal)}
                    </div>
                    {(last.nama_bahan || last.dosis) && (
                      <div className="dash-maint-note">
                        {last.nama_bahan}
                        {last.nama_bahan && last.dosis ? ' · ' : ''}
                        {last.dosis}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="dash-maint-meta">
                    Belum ada transaksi perawatan untuk blok ini.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Produktivitas & Tren */}
      <div className="dash-grid-2">
        <section className="card">
          <div className="dash-card-header">
            <div>
              <h3 className="h3-card-title">Produktivitas per Blok</h3>
              <p className="dash-card-subtitle">
                Produksi dan kg/ha pada {periodLabel}.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary dash-btn-sm"
              onClick={() =>
                setBlockSort((previous) =>
                  previous === 'desc' ? 'asc' : 'desc'
                )
              }
              title="Ubah urutan produktivitas"
            >
              <ArrowUpDown size={14} />
              <span>{blockSort === 'desc' ? 'Tertinggi' : 'Terendah'}</span>
            </button>
          </div>

          {blockPerformance.length === 0 ? (
            <EmptyState
              title="Belum ada blok kebun"
              description="Tambahkan blok kebun untuk melihat produktivitas."
            />
          ) : (
            <>
              <div className="dash-table-wrap desktop-only-table">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Blok Kebun</th>
                      <th>Luas</th>
                      <th>Produksi</th>
                      <th>Produktivitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockPerformance.map((row) => (
                      <tr key={row.kebun.id}>
                        <td>
                          <span className="dash-block-name">
                            {row.kebun.nama}
                          </span>
                        </td>
                        <td>{formatDecimal(row.luas)} Ha</td>
                        <td>
                          {row.hasPanen
                            ? `${formatNumber(row.production)} kg`
                            : '—'}
                        </td>
                        <td>
                          <div className="dash-yield">
                            <strong>
                              {row.yieldKgPerHa !== null
                                ? `${formatNumber(row.yieldKgPerHa)} kg/ha`
                                : '—'}
                            </strong>
                            <div className="dash-bar-track">
                              <div
                                className="dash-bar-fill"
                                style={{
                                  width: `${
                                    row.yieldKgPerHa !== null &&
                                    maxYield > 0
                                      ? Math.max(
                                          4,
                                          (row.yieldKgPerHa / maxYield) * 100
                                        )
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-only-cards dash-mobile-cards">
                {blockPerformance.map((row) => (
                  <div className="dash-mobile-card" key={row.kebun.id}>
                    <div className="dash-mobile-card-head">
                      <strong>{row.kebun.nama}</strong>
                      <span className="badge badge-success">
                        {row.yieldKgPerHa !== null
                          ? `${formatNumber(row.yieldKgPerHa)} kg/ha`
                          : '—'}
                      </span>
                    </div>
                    <div className="dash-mobile-card-meta">
                      <span>{formatDecimal(row.luas)} Ha</span>
                      <span>
                        {row.hasPanen
                          ? `${formatNumber(row.production)} kg`
                          : 'Belum ada panen'}
                      </span>
                    </div>
                    <div className="dash-bar-track">
                      <div
                        className="dash-bar-fill"
                        style={{
                          width: `${
                            row.yieldKgPerHa !== null && maxYield > 0
                              ? Math.max(
                                  4,
                                  (row.yieldKgPerHa / maxYield) * 100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="card">
          <div className="dash-card-header">
            <div>
              <h3 className="h3-card-title">Tren Produksi 6 Bulan</h3>
              <p className="dash-card-subtitle">
                {productionTrend[0]?.fullLabel} –{' '}
                {productionTrend[productionTrend.length - 1]?.fullLabel}
              </p>
            </div>
            <span
              className={`dash-status ${
                trendIndicator.tone === 'positive'
                  ? 'success'
                  : trendIndicator.tone === 'danger'
                    ? 'danger'
                    : 'neutral'
              }`}
            >
              {trendIndicator.tone === 'positive' ? (
                <TrendingUp size={12} />
              ) : trendIndicator.tone === 'danger' ? (
                <TrendingDown size={12} />
              ) : (
                <Minus size={12} />
              )}
              {trendIndicator.label}
            </span>
          </div>

          <div className="dash-chart-shell">
            <ProductionTrendChart
              data={productionTrend}
              formatKg={(value) => `${formatNumber(value)} kg`}
              formatNumber={formatNumber}
            />
          </div>

          <div className="dash-trend-note">{trendIndicator.detail}</div>
          <div className="dash-trend-legend">
            <span>
              <i className="solid" /> Ada catatan panen
            </span>
            <span>
              <i className="dashed" /> Belum ada data
            </span>
          </div>
        </section>
      </div>

      {/* Insight kondisi kebun */}
      <section className="card">
        <div className="dash-card-header">
          <div>
            <h3 className="h3-card-title">Insight Kondisi Kebun</h3>
            <p className="dash-card-subtitle">
              Ringkasan otomatis dari data aktual dan filter yang dipilih.
            </p>
          </div>
          <span className="badge badge-info">{insights.length} insight</span>
        </div>

        {insights.length === 0 ? (
          <EmptyState
            title="Belum ada insight"
            description="Tambahkan data kebun, panen, dan perawatan untuk melihat insight."
          />
        ) : (
          <div className="dash-insight-grid">
            {insights.map((insight) => (
              <div
                className={`dash-insight ${insight.tone}`}
                key={insight.id}
              >
                <div className="dash-insight-icon">
                  {renderInsightIcon(insight.tone)}
                </div>
                <div>
                  <div className="dash-insight-title">{insight.title}</div>
                  <div className="dash-insight-desc">
                    {insight.description}
                  </div>
                  <div className="dash-insight-basis">{insight.basis}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Aksi cepat */}
      <section className="card">
        <div className="dash-card-header">
          <div>
            <h3 className="h3-card-title">Aksi Cepat</h3>
            <p className="dash-card-subtitle">
              Pintasan pencatatan operasional harian.
            </p>
          </div>
        </div>
        <div className="dash-actions">
          <button
            type="button"
            className="btn btn-secondary dash-action"
            onClick={() => onOpenPanenModal()}
          >
            <Sprout size={18} color="#059669" />
            <span>Catat Panen</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary dash-action"
            onClick={onOpenPerawatanModal}
          >
            <Wrench size={18} color="#0284c7" />
            <span>Catat Perawatan</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary dash-action"
            onClick={onOpenPengeluaranLainModal}
          >
            <Receipt size={18} color="#d97706" />
            <span>Pengeluaran Lain</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary dash-action"
            onClick={onOpenKebunModal}
          >
            <Trees size={18} color="#059669" />
            <span>Tambah Blok Kebun</span>
          </button>
        </div>
      </section>
    </div>
  );
};
