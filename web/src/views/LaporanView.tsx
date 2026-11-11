import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowDownRight,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Info,
  Lightbulb,
  Minus,
  Percent,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  Sprout,
  Target,
  TrendingDown,
  TrendingUp,
  Trees,
  Wallet,
} from 'lucide-react';
import type { Kebun, Panen, Perawatan, PengeluaranLain } from '../types';
import { MonthFilter } from '../components/MonthFilter';
import { allocatePengeluaranLain } from '../services/dataService';
import { todayISO } from '../lib/date';
import {
  CostDonut,
  FinancialTrendChart,
  ProductionTrendChart,
} from '../components/ReportCharts';
import type { DonutSlice, TrendPoint } from '../components/ReportCharts';
import writeXlsxFile from 'write-excel-file/browser';
import type { SheetData } from 'write-excel-file/browser';
import './LaporanView.css';

interface LaporanViewProps {
  kebunList: Kebun[];
  panenList: Panen[];
  perawatanList: Perawatan[];
  pengeluaranLainList: PengeluaranLain[];
}

interface ReportFilter {
  kebunId: string;
  year: string;
  month: string;
  startDate: string;
  endDate: string;
  useRange: boolean;
}

interface Period {
  start: string | null;
  end: string | null;
  label: string;
}

interface PeriodStats {
  panen: Panen[];
  perawatan: Perawatan[];
  pengeluaran: PengeluaranLain[];
  pengeluaranRaw: PengeluaranLain[];
  totalBeratBersih: number;
  totalBeratBrondolan: number;
  totalProduksi: number;
  totalPendapatan: number;
  totalPendapatanTbs: number;
  totalBiayaPanen: number;
  totalBiayaPerawatan: number;
  totalPengeluaranLain: number;
  totalPengeluaran: number;
  labaBersih: number;
  marginProfit: number;
}

type DetailType =
  | 'Pendapatan Panen'
  | 'Upah Panen'
  | 'Pengeluaran Perawatan'
  | 'Pengeluaran Lainnya';

interface DetailRow {
  id: string;
  tanggal: string;
  type: DetailType;
  kebunNama: string;
  kategori: string;
  keterangan: string;
  volume: number | null;
  hargaSatuan: number | null;
  nominal: number;
  isIncome: boolean;
}

type InsightTone = 'positive' | 'warning' | 'negative' | 'neutral';

interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  description: string;
}

interface DeltaInfo {
  label: string;
  tone: 'positive' | 'negative' | 'neutral';
  direction: 'up' | 'down' | 'flat';
}

interface TrendResult {
  points: TrendPoint[];
  mode: 'day' | 'month' | 'year';
}

interface KebunPerformanceRow {
  kebun: Kebun;
  production: number;
  revenue: number;
  totalExpense: number;
  laba: number;
  margin: number | null;
  yieldKgPerHa: number | null;
  contribution: number;
}

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

const DEFAULT_FILTER: ReportFilter = {
  kebunId: 'all',
  year: 'all',
  month: '',
  startDate: '',
  endDate: '',
  useRange: false,
};

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 1,
});

function formatRupiah(value: number): string {
  return rupiahFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatNumber(value: number): string {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatDecimal(value: number): string {
  return decimalFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatCompactRupiah(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `Rp ${formatDecimal(value / 1_000_000_000)} M`;
  if (abs >= 1_000_000) return `Rp ${formatDecimal(value / 1_000_000)} jt`;
  if (abs >= 1_000) return `Rp ${formatDecimal(value / 1_000)} rb`;
  return `Rp ${formatNumber(value)}`;
}

function formatKg(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000) return `${formatDecimal(value / 1_000)} t`;
  return `${formatNumber(value)} kg`;
}

function parseISODate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(value: string, days: number): string {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function daysInclusive(start: string, end: string): number {
  const startDate = parseISODate(start).getTime();
  const endDate = parseISODate(end).getTime();
  return Math.max(1, Math.round((endDate - startDate) / 86_400_000) + 1);
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatDateID(value: string): string {
  const date = parseISODate(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatRangeLabel(start: string | null, end: string | null): string {
  if (start && end) return `${formatDateID(start)} – ${formatDateID(end)}`;
  if (start) return `Sejak ${formatDateID(start)}`;
  if (end) return `Hingga ${formatDateID(end)}`;
  return 'Semua Riwayat';
}

function resolvePeriod(filter: ReportFilter): Period {
  if (filter.useRange) {
    return {
      start: filter.startDate || null,
      end: filter.endDate || null,
      label: formatRangeLabel(filter.startDate || null, filter.endDate || null),
    };
  }

  if (filter.month) {
    const [year, month] = filter.month.split('-').map(Number);
    const endDay = lastDayOfMonth(year, month - 1);
    return {
      start: `${filter.month}-01`,
      end: `${filter.month}-${String(endDay).padStart(2, '0')}`,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
    };
  }

  if (filter.year !== 'all') {
    return {
      start: `${filter.year}-01-01`,
      end: `${filter.year}-12-31`,
      label: `Tahun ${filter.year}`,
    };
  }

  return { start: null, end: null, label: 'Semua Riwayat' };
}

function getPreviousPeriod(filter: ReportFilter, current: Period): Period | null {
  if (filter.useRange) {
    if (!current.start || !current.end) return null;
    const days = daysInclusive(current.start, current.end);
    const previousEnd = addDays(current.start, -1);
    const previousStart = addDays(previousEnd, -(days - 1));
    return {
      start: previousStart,
      end: previousEnd,
      label: formatRangeLabel(previousStart, previousEnd),
    };
  }

  if (filter.month) {
    const [year, month] = filter.month.split('-').map(Number);
    const previous = new Date(year, month - 2, 1);
    const previousYear = previous.getFullYear();
    const previousMonth = previous.getMonth();
    return {
      start: toISODate(new Date(previousYear, previousMonth, 1)),
      end: toISODate(new Date(previousYear, previousMonth + 1, 0)),
      label: `${MONTH_NAMES[previousMonth]} ${previousYear}`,
    };
  }

  if (filter.year !== 'all') {
    const year = Number(filter.year) - 1;
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      label: `Tahun ${year}`,
    };
  }

  return null;
}

function matchesPeriod(dateStr: string, period: Period): boolean {
  if (!dateStr) return false;
  if (period.start && dateStr < period.start) return false;
  if (period.end && dateStr > period.end) return false;
  return true;
}

function calculateStats(
  panenList: Panen[],
  perawatanList: Perawatan[],
  pengeluaranLainList: PengeluaranLain[],
  period: Period,
  kebunId: string,
  totalKebun: number
): PeriodStats {
  const panen = panenList.filter(
    (item) =>
      matchesPeriod(item.tanggal, period) &&
      (kebunId === 'all' || item.kebun_id === kebunId)
  );
  const perawatan = perawatanList.filter(
    (item) =>
      matchesPeriod(item.tanggal, period) &&
      (kebunId === 'all' || item.kebun_id === kebunId)
  );
  const pengeluaranRaw = pengeluaranLainList.filter((item) =>
    matchesPeriod(item.tanggal, period)
  );
  const pengeluaran = allocatePengeluaranLain(pengeluaranRaw, kebunId, totalKebun);

  const totalBeratBersih = panen.reduce(
    (total, item) => total + (Number(item.berat_bersih_kg) || 0),
    0
  );
  const totalBeratBrondolan = panen.reduce(
    (total, item) => total + (Number(item.berat_brondolan_kg) || 0),
    0
  );
  const totalProduksi = totalBeratBersih + totalBeratBrondolan;
  const totalPendapatan = panen.reduce(
    (total, item) => total + (Number(item.total_pendapatan) || 0),
    0
  );
  const totalPendapatanTbs = panen.reduce(
    (total, item) =>
      total + (Number(item.berat_bersih_kg) || 0) * (Number(item.harga_per_kg) || 0),
    0
  );
  const totalBiayaPanen = panen.reduce(
    (total, item) => total + (Number(item.upah_panen) || 0),
    0
  );
  const totalBiayaPerawatan = perawatan.reduce(
    (total, item) => total + (Number(item.total_biaya) || 0),
    0
  );
  const totalPengeluaranLain = pengeluaran.reduce(
    (total, item) => total + (Number(item.jumlah) || 0),
    0
  );
  const totalPengeluaran =
    totalBiayaPanen + totalBiayaPerawatan + totalPengeluaranLain;
  const labaBersih = totalPendapatan - totalPengeluaran;
  const marginProfit = totalPendapatan > 0 ? (labaBersih / totalPendapatan) * 100 : 0;

  return {
    panen,
    perawatan,
    pengeluaran,
    pengeluaranRaw,
    totalBeratBersih,
    totalBeratBrondolan,
    totalProduksi,
    totalPendapatan,
    totalPendapatanTbs,
    totalBiayaPanen,
    totalBiayaPerawatan,
    totalPengeluaranLain,
    totalPengeluaran,
    labaBersih,
    marginProfit,
  };
}

function buildTrendData(
  stats: PeriodStats,
  filter: ReportFilter,
  period: Period
): TrendResult {
  const allDates = [
    ...stats.panen.map((item) => item.tanggal),
    ...stats.perawatan.map((item) => item.tanggal),
    ...stats.pengeluaran.map((item) => item.tanggal),
  ]
    .filter(Boolean)
    .sort();

  const dataStart = allDates[0] ?? null;
  const dataEnd = allDates[allDates.length - 1] ?? null;
  const start = period.start ?? dataStart;
  const end = period.end ?? dataEnd;

  if (!start || !end) return { points: [], mode: 'month' };

  let mode: TrendResult['mode'];
  if (filter.useRange) {
    const span = daysInclusive(start, end);
    mode = span <= 45 ? 'day' : span <= 730 ? 'month' : 'year';
  } else if (filter.month) {
    mode = 'day';
  } else if (filter.year !== 'all') {
    mode = 'month';
  } else {
    const span = daysInclusive(start, end);
    mode = span <= 730 ? 'month' : 'year';
  }

  const buckets: { key: string; label: string; fullLabel: string }[] = [];

  if (mode === 'day') {
    let cursor = start;
    let guard = 0;
    while (cursor <= end && guard < 400) {
      buckets.push({
        key: cursor,
        label: String(Number(cursor.slice(8, 10))),
        fullLabel: formatDateID(cursor),
      });
      cursor = addDays(cursor, 1);
      guard += 1;
    }
  } else if (mode === 'month') {
    let cursor = `${start.slice(0, 7)}-01`;
    const endMonth = end.slice(0, 7);
    let guard = 0;
    while (cursor.slice(0, 7) <= endMonth && guard < 400) {
      const [year, month] = cursor.split('-').map(Number);
      buckets.push({
        key: cursor.slice(0, 7),
        label: `${MONTHS_SHORT[month - 1]} '${String(year).slice(-2)}`,
        fullLabel: `${MONTH_NAMES[month - 1]} ${year}`,
      });
      cursor = toISODate(new Date(year, month, 1));
      guard += 1;
    }
  } else {
    const startYear = Number(start.slice(0, 4));
    const endYear = Number(end.slice(0, 4));
    for (let year = startYear; year <= endYear; year += 1) {
      buckets.push({
        key: String(year),
        label: String(year),
        fullLabel: `Tahun ${year}`,
      });
    }
  }

  const inBucket = (dateStr: string, key: string) => {
    if (mode === 'day') return dateStr === key;
    return dateStr.startsWith(key);
  };

  const points = buckets.map((bucket) => {
    const panen = stats.panen.filter((item) => inBucket(item.tanggal, bucket.key));
    const perawatan = stats.perawatan.filter((item) =>
      inBucket(item.tanggal, bucket.key)
    );
    const pengeluaran = stats.pengeluaran.filter((item) =>
      inBucket(item.tanggal, bucket.key)
    );

    const production = panen.reduce(
      (total, item) =>
        total + (Number(item.berat_bersih_kg) || 0) + (Number(item.berat_brondolan_kg) || 0),
      0
    );
    const pendapatan = panen.reduce(
      (total, item) => total + (Number(item.total_pendapatan) || 0),
      0
    );
    const totalPengeluaran =
      panen.reduce((total, item) => total + (Number(item.upah_panen) || 0), 0) +
      perawatan.reduce((total, item) => total + (Number(item.total_biaya) || 0), 0) +
      pengeluaran.reduce((total, item) => total + (Number(item.jumlah) || 0), 0);

    return {
      key: bucket.key,
      label: bucket.label,
      fullLabel: bucket.fullLabel,
      pendapatan,
      pengeluaran: totalPengeluaran,
      laba: pendapatan - totalPengeluaran,
      production,
      hasProduction: panen.length > 0,
    };
  });

  return { points, mode };
}

function buildDetailRows(stats: PeriodStats, kebunList: Kebun[]): DetailRow[] {
  const kebunMap = new Map(kebunList.map((kebun) => [kebun.id, kebun.nama]));
  const rows: DetailRow[] = [];

  stats.panen.forEach((item) => {
    const kebunNama = kebunMap.get(item.kebun_id) || 'Kebun';
    const volume =
      (Number(item.berat_bersih_kg) || 0) + (Number(item.berat_brondolan_kg) || 0);
    const keterangan = [
      item.pembeli ? `Pembeli: ${item.pembeli}` : '',
      item.catatan || '',
      Number(item.berat_brondolan_kg) > 0
        ? `Brondolan ${formatNumber(item.berat_brondolan_kg)} kg`
        : '',
    ]
      .filter(Boolean)
      .join(' · ');

    rows.push({
      id: `panen-${item.id}-pendapatan`,
      tanggal: item.tanggal,
      type: 'Pendapatan Panen',
      kebunNama,
      kategori: 'Penjualan TBS',
      keterangan: keterangan || 'Penjualan TBS',
      volume,
      hargaSatuan: Number(item.harga_per_kg) || 0,
      nominal: Number(item.total_pendapatan) || 0,
      isIncome: true,
    });

    if ((Number(item.upah_panen) || 0) > 0) {
      rows.push({
        id: `panen-${item.id}-upah`,
        tanggal: item.tanggal,
        type: 'Upah Panen',
        kebunNama,
        kategori: 'Biaya Panen',
        keterangan: ['Upah panen', item.pembeli || '', item.catatan || '']
          .filter(Boolean)
          .join(' · '),
        volume: null,
        hargaSatuan: null,
        nominal: Number(item.upah_panen) || 0,
        isIncome: false,
      });
    }
  });

  stats.perawatan.forEach((item) => {
    rows.push({
      id: `perawatan-${item.id}`,
      tanggal: item.tanggal,
      type: 'Pengeluaran Perawatan',
      kebunNama: kebunMap.get(item.kebun_id) || 'Kebun',
      kategori: item.jenis_perawatan || 'Perawatan',
      keterangan:
        [
          item.nama_bahan || '',
          item.dosis ? `Dosis ${item.dosis}` : '',
          item.catatan || '',
        ]
          .filter(Boolean)
          .join(' · ') || 'Biaya perawatan kebun',
      volume: null,
      hargaSatuan: null,
      nominal: Number(item.total_biaya) || 0,
      isIncome: false,
    });
  });

  stats.pengeluaran.forEach((item) => {
    rows.push({
      id: `pengeluaran-${item.id}`,
      tanggal: item.tanggal,
      type: 'Pengeluaran Lainnya',
      kebunNama: item.kebun_id ? kebunMap.get(item.kebun_id) || 'Kebun' : 'Umum',
      kategori: item.kategori || 'Operasional',
      keterangan: item.keterangan || 'Pengeluaran operasional',
      volume: null,
      hargaSatuan: null,
      nominal: Number(item.jumlah) || 0,
      isIncome: false,
    });
  });

  return rows;
}

function makeDelta(
  current: number | null,
  previous: number | null,
  options: { invert?: boolean; margin?: boolean } = {}
): DeltaInfo {
  if (current === null) {
    return { label: 'Data belum tersedia', tone: 'neutral', direction: 'flat' };
  }
  if (previous === null) {
    return { label: 'Belum ada pembanding', tone: 'neutral', direction: 'flat' };
  }

  if (options.margin) {
    const difference = current - previous;
    if (Math.abs(difference) < 0.05) {
      return { label: 'Stabil', tone: 'neutral', direction: 'flat' };
    }
    const isGood = options.invert ? difference < 0 : difference > 0;
    return {
      label: `${difference > 0 ? '+' : ''}${difference.toFixed(1)} pp`,
      tone: isGood ? 'positive' : 'negative',
      direction: difference > 0 ? 'up' : 'down',
    };
  }

  if (previous === 0) {
    if (current === 0) {
      return { label: 'Stabil', tone: 'neutral', direction: 'flat' };
    }
    const isGood = options.invert ? current < 0 : current > 0;
    return {
      label: 'Baru tercatat',
      tone: isGood ? 'positive' : 'negative',
      direction: current > 0 ? 'up' : 'down',
    };
  }

  const change = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(change) < 0.05) {
    return { label: 'Stabil', tone: 'neutral', direction: 'flat' };
  }
  const isGood = options.invert ? change < 0 : change > 0;
  return {
    label: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
    tone: isGood ? 'positive' : 'negative',
    direction: change > 0 ? 'up' : 'down',
  };
}

type ExcelCell = NonNullable<SheetData[number][number]>;

const excelTitle = (value: string): ExcelCell => ({
  value,
  fontWeight: 'bold',
  fontSize: 15,
  textColor: '#0f172a',
});

const excelSection = (value: string): ExcelCell => ({
  value,
  fontWeight: 'bold',
  backgroundColor: '#ecfdf5',
  textColor: '#047857',
  borderColor: '#d1fae5',
  borderStyle: 'thin',
});

const excelHeader = (value: string): ExcelCell => ({
  value,
  fontWeight: 'bold',
  backgroundColor: '#0f766e',
  textColor: '#ffffff',
  align: 'center',
  alignVertical: 'center',
  wrap: true,
  borderColor: '#cbd5e1',
  borderStyle: 'thin',
});

const excelLabel = (value: string): ExcelCell => ({
  value,
  fontWeight: 'bold',
  borderColor: '#e2e8f0',
  borderStyle: 'thin',
});

const excelText = (value: unknown): ExcelCell => ({
  value: value === null || value === undefined || value === '' ? '—' : String(value),
  borderColor: '#e2e8f0',
  borderStyle: 'thin',
  wrap: true,
});

const excelNumber = (value: number | null, format = '#,##0'): ExcelCell =>
  value === null
    ? excelText('—')
    : {
        value,
        type: Number,
        format,
        align: 'right',
        borderColor: '#e2e8f0',
        borderStyle: 'thin',
      };

const DeltaBadge: React.FC<{ delta: DeltaInfo }> = ({ delta }) => {
  const Icon =
    delta.direction === 'up'
      ? ArrowUpRight
      : delta.direction === 'down'
        ? ArrowDownRight
        : Minus;
  return (
    <span className={`report-delta ${delta.tone}`}>
      <Icon size={13} />
      {delta.label}
    </span>
  );
};

const EmptyState: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div className="report-empty">
    <strong>{title}</strong>
    {description}
  </div>
);

function renderInsightIcon(tone: InsightTone): React.ReactNode {
  switch (tone) {
    case 'positive':
      return <CheckCircle2 size={15} />;
    case 'warning':
      return <AlertTriangle size={15} />;
    case 'negative':
      return <TrendingDown size={15} />;
    default:
      return <Info size={15} />;
  }
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  kebunList,
  panenList,
  perawatanList,
  pengeluaranLainList,
}) => {
  const [draft, setDraft] = useState<ReportFilter>({ ...DEFAULT_FILTER });
  const [applied, setApplied] = useState<ReportFilter>({ ...DEFAULT_FILTER });
  const [filterError, setFilterError] = useState('');
  const [detailSearch, setDetailSearch] = useState('');
  const [detailType, setDetailType] = useState<'all' | DetailType>('all');
  const [detailSort, setDetailSort] = useState<{
    key: 'tanggal' | 'nominal';
    dir: 'asc' | 'desc';
  }>({ key: 'tanggal', dir: 'desc' });
  const [detailPage, setDetailPage] = useState(1);
  const [detailPageSize, setDetailPageSize] = useState(10);
  const [blockSort, setBlockSort] = useState<
    'laba' | 'pendapatan' | 'pengeluaran' | 'produksi' | 'yield' | 'margin'
  >('laba');
  const [currentYear] = useState(() => new Date().getFullYear());
  const [generatedAt] = useState(() => new Date().toLocaleString('id-ID'));

  const availableYears = useMemo(() => {
    const yearSet = new Set<number>([currentYear]);
    [...panenList, ...perawatanList, ...pengeluaranLainList].forEach((item) => {
      if (!item.tanggal) return;
      const year = parseInt(item.tanggal.slice(0, 4), 10);
      if (!Number.isNaN(year)) yearSet.add(year);
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [currentYear, panenList, perawatanList, pengeluaranLainList]);

  const period = useMemo(() => resolvePeriod(applied), [applied]);
  const previousPeriod = useMemo(
    () => getPreviousPeriod(applied, period),
    [applied, period]
  );

  const stats = useMemo(
    () =>
      calculateStats(
        panenList,
        perawatanList,
        pengeluaranLainList,
        period,
        applied.kebunId,
        kebunList.length
      ),
    [panenList, perawatanList, pengeluaranLainList, period, applied.kebunId, kebunList.length]
  );

  const previousStats = useMemo(
    () =>
      previousPeriod
        ? calculateStats(
            panenList,
            perawatanList,
            pengeluaranLainList,
            previousPeriod,
            applied.kebunId,
            kebunList.length
          )
        : null,
    [
      panenList,
      perawatanList,
      pengeluaranLainList,
      previousPeriod,
      applied.kebunId,
      kebunList.length,
    ]
  );

  const trend = useMemo(
    () => buildTrendData(stats, applied, period),
    [stats, applied, period]
  );
  const trendData = trend.points;
  const trendUnit = trend.mode === 'day' ? 'hari' : trend.mode === 'month' ? 'bulan' : 'tahun';

  const expenseSlices = useMemo<DonutSlice[]>(
    () =>
      [
        {
          label: 'Upah Panen',
          value: stats.totalBiayaPanen,
          color: '#dc2626',
        },
        {
          label: 'Perawatan Kebun',
          value: stats.totalBiayaPerawatan,
          color: '#0284c7',
        },
        {
          label: 'Pengeluaran Lain',
          value: stats.totalPengeluaranLain,
          color: '#d97706',
        },
      ].filter((slice) => slice.value > 0),
    [stats.totalBiayaPanen, stats.totalBiayaPerawatan, stats.totalPengeluaranLain]
  );

  const largestExpense = useMemo(
    () =>
      expenseSlices.reduce<DonutSlice | null>(
        (best, slice) => (!best || slice.value > best.value ? slice : best),
        null
      ),
    [expenseSlices]
  );

  const kebunLabel =
    applied.kebunId === 'all'
      ? 'Semua Blok Kebun'
      : kebunList.find((kebun) => kebun.id === applied.kebunId)?.nama || 'Blok terpilih';

  const detailRows = useMemo(
    () => buildDetailRows(stats, kebunList),
    [stats, kebunList]
  );

  const filteredDetailRows = useMemo(() => {
    const query = detailSearch.trim().toLowerCase();
    return detailRows.filter((row) => {
      if (detailType !== 'all' && row.type !== detailType) return false;
      if (!query) return true;
      return [row.tanggal, row.type, row.kebunNama, row.kategori, row.keterangan].some(
        (value) => value.toLowerCase().includes(query)
      );
    });
  }, [detailRows, detailSearch, detailType]);

  const sortedDetailRows = useMemo(() => {
    const direction = detailSort.dir === 'asc' ? 1 : -1;
    return [...filteredDetailRows].sort((a, b) => {
      if (detailSort.key === 'tanggal') {
        const comparison = a.tanggal.localeCompare(b.tanggal);
        if (comparison !== 0) return comparison * direction;
        return a.id.localeCompare(b.id) * direction;
      }
      return (a.nominal - b.nominal) * direction;
    });
  }, [filteredDetailRows, detailSort]);

  const detailTotals = useMemo(
    () =>
      sortedDetailRows.reduce(
        (totals, row) => {
          if (row.isIncome) totals.income += row.nominal;
          else totals.expense += row.nominal;
          return totals;
        },
        { income: 0, expense: 0 }
      ),
    [sortedDetailRows]
  );

  const detailPageCount = Math.max(1, Math.ceil(sortedDetailRows.length / detailPageSize));
  const safeDetailPage = Math.min(detailPage, detailPageCount);
  const paginatedDetailRows = sortedDetailRows.slice(
    (safeDetailPage - 1) * detailPageSize,
    safeDetailPage * detailPageSize
  );
  const detailStart =
    sortedDetailRows.length === 0 ? 0 : (safeDetailPage - 1) * detailPageSize + 1;
  const detailEnd = Math.min(safeDetailPage * detailPageSize, sortedDetailRows.length);

  const kebunPerformance = useMemo<KebunPerformanceRow[]>(() => {
    const displayedKebun =
      applied.kebunId === 'all'
        ? kebunList
        : kebunList.filter((kebun) => kebun.id === applied.kebunId);

    const rows = displayedKebun.map((kebun) => {
      const kebunPanen = stats.panen.filter((item) => item.kebun_id === kebun.id);
      const production = kebunPanen.reduce(
        (total, item) =>
          total + (Number(item.berat_bersih_kg) || 0) + (Number(item.berat_brondolan_kg) || 0),
        0
      );
      const revenue = kebunPanen.reduce(
        (total, item) => total + (Number(item.total_pendapatan) || 0),
        0
      );
      const harvestCost = kebunPanen.reduce(
        (total, item) => total + (Number(item.upah_panen) || 0),
        0
      );
      const maintenanceCost = stats.perawatan
        .filter((item) => item.kebun_id === kebun.id)
        .reduce((total, item) => total + (Number(item.total_biaya) || 0), 0);
      const otherCost = allocatePengeluaranLain(
        stats.pengeluaranRaw,
        kebun.id,
        kebunList.length
      ).reduce((total, item) => total + (Number(item.jumlah) || 0), 0);
      const totalExpense = harvestCost + maintenanceCost + otherCost;
      const laba = revenue - totalExpense;

      return {
        kebun,
        production,
        revenue,
        totalExpense,
        laba,
        margin: revenue > 0 ? (laba / revenue) * 100 : null,
        yieldKgPerHa:
          Number(kebun.luas_hektar) > 0 ? production / Number(kebun.luas_hektar) : null,
        contribution: stats.totalProduksi > 0 ? (production / stats.totalProduksi) * 100 : 0,
      };
    });

    const sortValue = (row: KebunPerformanceRow) => {
      switch (blockSort) {
        case 'pendapatan':
          return row.revenue;
        case 'pengeluaran':
          return row.totalExpense;
        case 'produksi':
          return row.production;
        case 'yield':
          return row.yieldKgPerHa ?? -Infinity;
        case 'margin':
          return row.margin ?? -Infinity;
        case 'laba':
        default:
          return row.laba;
      }
    };

    return rows.sort((a, b) => sortValue(b) - sortValue(a));
  }, [kebunList, stats, applied.kebunId, blockSort]);

  const blockTotals = useMemo(() => {
    const total = kebunPerformance.reduce(
      (accumulator, row) => ({
        luas: accumulator.luas + (Number(row.kebun.luas_hektar) || 0),
        production: accumulator.production + row.production,
        revenue: accumulator.revenue + row.revenue,
        totalExpense: accumulator.totalExpense + row.totalExpense,
        laba: accumulator.laba + row.laba,
      }),
      { luas: 0, production: 0, revenue: 0, totalExpense: 0, laba: 0 }
    );

    return {
      ...total,
      yieldKgPerHa: total.luas > 0 ? total.production / total.luas : null,
      margin: total.revenue > 0 ? (total.laba / total.revenue) * 100 : null,
    };
  }, [kebunPerformance]);

  const efficiencyItems = useMemo(() => {
    const revenuePerKg =
      stats.totalProduksi > 0 ? stats.totalPendapatan / stats.totalProduksi : null;
    const previousRevenuePerKg =
      previousStats && previousStats.totalProduksi > 0
        ? previousStats.totalPendapatan / previousStats.totalProduksi
        : null;
    const costPerKg =
      stats.totalProduksi > 0 ? stats.totalPengeluaran / stats.totalProduksi : null;
    const previousCostPerKg =
      previousStats && previousStats.totalProduksi > 0
        ? previousStats.totalPengeluaran / previousStats.totalProduksi
        : null;
    const profitPerKg =
      stats.totalProduksi > 0 ? stats.labaBersih / stats.totalProduksi : null;
    const previousProfitPerKg =
      previousStats && previousStats.totalProduksi > 0
        ? previousStats.labaBersih / previousStats.totalProduksi
        : null;
    const margin = stats.totalPendapatan > 0 ? stats.marginProfit : null;
    const previousMargin =
      previousStats && previousStats.totalPendapatan > 0
        ? previousStats.marginProfit
        : null;
    const costRatio =
      stats.totalPendapatan > 0
        ? (stats.totalPengeluaran / stats.totalPendapatan) * 100
        : null;
    const previousCostRatio =
      previousStats && previousStats.totalPendapatan > 0
        ? (previousStats.totalPengeluaran / previousStats.totalPendapatan) * 100
        : null;

    return [
      {
        label: 'Pendapatan / kg',
        value: revenuePerKg !== null ? `${formatRupiah(revenuePerKg)}/kg` : '—',
        sub: 'Pendapatan dibagi total produksi',
        delta: makeDelta(revenuePerKg, previousRevenuePerKg),
      },
      {
        label: 'Biaya / kg',
        value: costPerKg !== null ? `${formatRupiah(costPerKg)}/kg` : '—',
        sub: 'Pengeluaran dibagi total produksi',
        delta: makeDelta(costPerKg, previousCostPerKg, { invert: true }),
      },
      {
        label: 'Laba / kg',
        value: profitPerKg !== null ? `${formatRupiah(profitPerKg)}/kg` : '—',
        sub: 'Laba bersih dibagi total produksi',
        delta: makeDelta(profitPerKg, previousProfitPerKg),
      },
      {
        label: 'Margin Laba',
        value: margin !== null ? `${margin.toFixed(1)}%` : '—',
        sub: 'Laba bersih dibanding pendapatan',
        delta: makeDelta(margin, previousMargin, { margin: true }),
      },
      {
        label: 'Rasio Biaya',
        value: costRatio !== null ? `${costRatio.toFixed(1)}%` : '—',
        sub: 'Pengeluaran dibanding pendapatan',
        delta: makeDelta(costRatio, previousCostRatio, { margin: true, invert: true }),
      },
    ];
  }, [stats, previousStats]);

  const comparisonRows = useMemo(() => {
    const currentMargin = stats.totalPendapatan > 0 ? stats.marginProfit : null;
    const previousMargin =
      previousStats && previousStats.totalPendapatan > 0
        ? previousStats.marginProfit
        : null;
    const currentCostRatio =
      stats.totalPendapatan > 0
        ? (stats.totalPengeluaran / stats.totalPendapatan) * 100
        : null;
    const previousCostRatio =
      previousStats && previousStats.totalPendapatan > 0
        ? (previousStats.totalPengeluaran / previousStats.totalPendapatan) * 100
        : null;

    return [
      {
        label: 'Produksi TBS',
        current: stats.totalProduksi,
        previous: previousStats?.totalProduksi ?? null,
        display: (value: number) => `${formatNumber(value)} kg`,
        delta: makeDelta(stats.totalProduksi, previousStats?.totalProduksi ?? null),
      },
      {
        label: 'Pendapatan',
        current: stats.totalPendapatan,
        previous: previousStats?.totalPendapatan ?? null,
        display: formatRupiah,
        delta: makeDelta(stats.totalPendapatan, previousStats?.totalPendapatan ?? null),
      },
      {
        label: 'Pengeluaran',
        current: stats.totalPengeluaran,
        previous: previousStats?.totalPengeluaran ?? null,
        display: formatRupiah,
        delta: makeDelta(stats.totalPengeluaran, previousStats?.totalPengeluaran ?? null, {
          invert: true,
        }),
      },
      {
        label: 'Laba Bersih',
        current: stats.labaBersih,
        previous: previousStats?.labaBersih ?? null,
        display: formatRupiah,
        delta: makeDelta(stats.labaBersih, previousStats?.labaBersih ?? null),
      },
      {
        label: 'Margin Laba',
        current: currentMargin,
        previous: previousMargin,
        display: (value: number) => `${value.toFixed(1)}%`,
        delta: makeDelta(currentMargin, previousMargin, { margin: true }),
      },
      {
        label: 'Rasio Biaya',
        current: currentCostRatio,
        previous: previousCostRatio,
        display: (value: number) => `${value.toFixed(1)}%`,
        delta: makeDelta(currentCostRatio, previousCostRatio, {
          margin: true,
          invert: true,
        }),
      },
    ];
  }, [stats, previousStats]);

  const insights = useMemo<Insight[]>(() => {
    const list: Insight[] = [];

    if (stats.totalPengeluaran > 0 && largestExpense) {
      list.push({
        id: 'largest-expense',
        tone: largestExpense.label === 'Upah Panen' ? 'warning' : 'neutral',
        title: `Biaya terbesar: ${largestExpense.label}`,
        description: `${formatRupiah(largestExpense.value)} atau ${(
          (largestExpense.value / stats.totalPengeluaran) *
          100
        ).toFixed(1)}% dari total pengeluaran periode ini.`,
      });
    }

    if (previousStats) {
      if (previousStats.totalPendapatan > 0) {
        const delta = makeDelta(stats.totalPendapatan, previousStats.totalPendapatan);
        list.push({
          id: 'revenue-trend',
          tone: delta.tone,
          title: `Pendapatan ${
            delta.direction === 'up'
              ? 'naik'
              : delta.direction === 'down'
                ? 'turun'
                : 'stabil'
          } ${delta.label}`,
          description: `Pendapatan periode ini ${formatRupiah(
            stats.totalPendapatan
          )} dibanding ${formatRupiah(previousStats.totalPendapatan)} pada ${
            previousPeriod?.label || 'periode sebelumnya'
          }.`,
        });
      } else if (stats.totalPendapatan > 0) {
        list.push({
          id: 'revenue-new',
          tone: 'positive',
          title: 'Pendapatan mulai tercatat',
          description: `Belum ada pendapatan pada ${
            previousPeriod?.label || 'periode sebelumnya'
          }, sedangkan periode ini sudah ${formatRupiah(stats.totalPendapatan)}.`,
        });
      }
    } else {
      list.push({
        id: 'no-comparison',
        tone: 'neutral',
        title: 'Belum ada periode pembanding',
        description:
          'Pilih bulan, tahun, atau rentang tanggal yang memiliki data sebelumnya untuk melihat perbandingan.',
      });
    }

    if (stats.totalPendapatan > 0) {
      const tone: InsightTone =
        stats.marginProfit >= 20
          ? 'positive'
          : stats.marginProfit >= 0
            ? 'warning'
            : 'negative';
      list.push({
        id: 'margin',
        tone,
        title: `Margin laba ${stats.marginProfit.toFixed(1)}%`,
        description:
          stats.marginProfit >= 20
            ? 'Margin berada di zona sehat. Pertahankan efisiensi biaya panen dan perawatan.'
            : stats.marginProfit >= 0
              ? 'Margin masih tipis. Tinjau biaya terbesar dan efisiensi produksi.'
              : 'Laba bersih negatif. Pengeluaran melebihi pendapatan pada periode ini.',
      });
    }

    const bestBlock = [...kebunPerformance].sort((a, b) => b.laba - a.laba)[0];
    if (bestBlock && bestBlock.revenue > 0) {
      list.push({
        id: 'best-block',
        tone: 'positive',
        title: `Blok paling menguntungkan: ${bestBlock.kebun.nama}`,
        description: `Laba bersih ${formatRupiah(bestBlock.laba)} dengan margin ${
          bestBlock.margin !== null ? `${bestBlock.margin.toFixed(1)}%` : '—'
        } dari pendapatan ${formatRupiah(bestBlock.revenue)}.`,
      });
    }

    const costPerKg =
      stats.totalProduksi > 0 ? stats.totalPengeluaran / stats.totalProduksi : null;
    const previousCostPerKg =
      previousStats && previousStats.totalProduksi > 0
        ? previousStats.totalPengeluaran / previousStats.totalProduksi
        : null;
    if (costPerKg !== null && previousCostPerKg !== null && previousCostPerKg > 0) {
      const delta = makeDelta(costPerKg, previousCostPerKg, { invert: true });
      list.push({
        id: 'cost-per-kg',
        tone: delta.tone,
        title: `Biaya per kg ${
          delta.direction === 'up' ? 'naik' : delta.direction === 'down' ? 'turun' : 'stabil'
        } ${delta.label}`,
        description: `Biaya produksi periode ini ${formatRupiah(
          costPerKg
        )}/kg dibanding ${formatRupiah(previousCostPerKg)}/kg pada ${
          previousPeriod?.label || 'periode sebelumnya'
        }.`,
      });
    }

    if (list.length === 0) {
      list.push({
        id: 'empty',
        tone: 'neutral',
        title: 'Belum ada data pada periode ini',
        description:
          'Tambahkan catatan panen, perawatan, atau pengeluaran lain, atau pilih periode yang berbeda.',
      });
    }

    return list.slice(0, 5);
  }, [stats, previousStats, previousPeriod, largestExpense, kebunPerformance]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(applied);

  const updateDraft = (patch: Partial<ReportFilter>) => {
    setDraft((previous) => ({ ...previous, ...patch }));
    setFilterError('');
  };

  const handleYearChange = (year: string) => {
    setDraft((previous) => ({
      ...previous,
      year,
      month:
        year === 'all'
          ? ''
          : previous.month && !previous.month.startsWith(year)
            ? ''
            : previous.month,
      useRange: false,
    }));
    setFilterError('');
  };

  const handleMonthChange = (month: string) => {
    setDraft((previous) => ({
      ...previous,
      month,
      year: month ? month.slice(0, 4) : previous.year,
      useRange: false,
    }));
    setFilterError('');
  };

  const handleRangeToggle = () => {
    setDraft((previous) => ({
      ...previous,
      useRange: !previous.useRange,
      month: !previous.useRange ? '' : previous.month,
    }));
    setFilterError('');
  };

  const handleApply = () => {
    if (draft.useRange) {
      if (!draft.startDate && !draft.endDate) {
        setFilterError('Isi minimal salah satu tanggal pada rentang tanggal.');
        return;
      }
      if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) {
        setFilterError('Tanggal mulai tidak boleh melebihi tanggal akhir.');
        return;
      }
    }
    setApplied({ ...draft });
    setFilterError('');
    setDetailPage(1);
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_FILTER });
    setApplied({ ...DEFAULT_FILTER });
    setFilterError('');
    setDetailSearch('');
    setDetailType('all');
    setDetailSort({ key: 'tanggal', dir: 'desc' });
    setDetailPage(1);
  };

  const handleExportExcel = async () => {
    const summary: SheetData = [
      [{ ...excelTitle('Laporan & Analitik SawitKu'), columnSpan: 4 }, null, null, null],
      [excelLabel('Periode'), excelText(period.label)],
      [excelLabel('Kebun'), excelText(kebunLabel)],
      [excelLabel('Dibuat'), excelText(new Date().toLocaleString('id-ID'))],
      [],
      [{ ...excelSection('Ringkasan Laporan'), columnSpan: 2 }, null],
      [excelLabel('Total Pendapatan (Rp)'), excelNumber(stats.totalPendapatan)],
      [excelLabel('Total Pengeluaran (Rp)'), excelNumber(stats.totalPengeluaran)],
      [excelLabel('Laba Bersih (Rp)'), excelNumber(stats.labaBersih)],
      [excelLabel('Total Produksi (kg)'), excelNumber(stats.totalProduksi)],
      [
        excelLabel('Margin Laba (%)'),
        excelNumber(stats.marginProfit, '0.00'),
      ],
      [],
      [{ ...excelSection('Perbandingan Periode'), columnSpan: 4 }, null, null, null],
      [
        excelHeader('Indikator'),
        excelHeader('Periode Ini'),
        excelHeader(previousPeriod?.label || 'Periode Sebelumnya'),
        excelHeader('Perubahan'),
      ],
      ...comparisonRows.map((row) => [
        excelLabel(row.label),
        excelText(row.current !== null ? row.display(row.current) : '—'),
        excelText(row.previous !== null ? row.display(row.previous) : '—'),
        excelText(row.delta.label),
      ]),
      [],
      [{ ...excelSection('Analisis per Blok Kebun'), columnSpan: 9 }, null, null, null, null, null, null, null, null],
      [
        excelHeader('Blok Kebun'),
        excelHeader('Luas (Ha)'),
        excelHeader('Produksi (kg)'),
        excelHeader('Yield (kg/ha)'),
        excelHeader('Pendapatan (Rp)'),
        excelHeader('Pengeluaran (Rp)'),
        excelHeader('Laba Bersih (Rp)'),
        excelHeader('Margin (%)'),
        excelHeader('Kontribusi (%)'),
      ],
      ...kebunPerformance.map((row) => [
        excelText(row.kebun.nama),
        excelNumber(Number(row.kebun.luas_hektar) || 0, '#,##0.0'),
        excelNumber(row.production),
        excelNumber(row.yieldKgPerHa, '#,##0'),
        excelNumber(row.revenue),
        excelNumber(row.totalExpense),
        excelNumber(row.laba),
        excelNumber(row.margin, '0.0'),
        excelNumber(row.contribution, '0.0'),
      ]),
      [
        excelLabel('Total'),
        excelNumber(blockTotals.luas, '#,##0.0'),
        excelNumber(blockTotals.production),
        excelNumber(blockTotals.yieldKgPerHa, '#,##0'),
        excelNumber(blockTotals.revenue),
        excelNumber(blockTotals.totalExpense),
        excelNumber(blockTotals.laba),
        excelNumber(blockTotals.margin, '0.0'),
        excelNumber(blockTotals.production > 0 ? 100 : null, '0.0'),
      ],
    ];

    const detail: SheetData = [
      [{ ...excelTitle('Rincian Transaksi SawitKu'), columnSpan: 9 }, null, null, null, null, null, null, null, null],
      [excelLabel('Periode'), excelText(period.label)],
      [excelLabel('Kebun'), excelText(kebunLabel)],
      [],
      [
        excelHeader('Tanggal'),
        excelHeader('Jenis'),
        excelHeader('Kebun'),
        excelHeader('Kategori'),
        excelHeader('Keterangan'),
        excelHeader('Volume (kg)'),
        excelHeader('Harga Satuan (Rp)'),
        excelHeader('Pendapatan (Rp)'),
        excelHeader('Pengeluaran (Rp)'),
      ],
      ...sortedDetailRows.map((row) => [
        excelText(formatDateID(row.tanggal)),
        excelText(row.type),
        excelText(row.kebunNama),
        excelText(row.kategori),
        excelText(row.keterangan),
        excelNumber(row.volume),
        excelNumber(row.hargaSatuan),
        row.isIncome ? excelNumber(row.nominal) : excelText('—'),
        row.isIncome ? excelText('—') : excelNumber(row.nominal),
      ]),
      [],
      [
        { ...excelLabel('Total Pendapatan Transaksi'), columnSpan: 7 },
        null,
        null,
        null,
        null,
        null,
        null,
        excelNumber(detailTotals.income),
        excelText('—'),
      ],
      [
        { ...excelLabel('Total Pengeluaran Transaksi'), columnSpan: 7 },
        null,
        null,
        null,
        null,
        null,
        null,
        excelText('—'),
        excelNumber(detailTotals.expense),
      ],
      [
        { ...excelLabel('Laba Bersih Transaksi'), columnSpan: 7 },
        null,
        null,
        null,
        null,
        null,
        null,
        excelNumber(detailTotals.income - detailTotals.expense),
        excelText('—'),
      ],
    ];

    await writeXlsxFile(
      [
        {
          data: summary,
          sheet: 'Ringkasan',
          columns: [
            { width: 30 },
            { width: 20 },
            { width: 20 },
            { width: 16 },
            { width: 18 },
            { width: 18 },
            { width: 18 },
            { width: 14 },
            { width: 14 },
          ],
        },
        {
          data: detail,
          sheet: 'Rincian Transaksi',
          columns: [
            { width: 14 },
            { width: 22 },
            { width: 22 },
            { width: 22 },
            { width: 42 },
            { width: 14 },
            { width: 18 },
            { width: 18 },
            { width: 18 },
          ],
        },
      ],
      { fontFamily: 'Calibri', fontSize: 11 }
    ).toFile(`Laporan_SawitKu_${todayISO()}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleDetailSort = (key: 'tanggal' | 'nominal') => {
    setDetailSort((previous) =>
      previous.key === key
        ? { key, dir: previous.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'desc' }
    );
  };

  const renderSortIcon = (key: 'tanggal' | 'nominal') => {
    if (detailSort.key !== key) return <ArrowUpDown size={12} />;
    return detailSort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  return (
    <div className="report-page">
      <div className="report-print-header">
        <h2>Laporan &amp; Analitik SawitKu</h2>
        <p>
          Periode: {period.label} · Kebun: {kebunLabel} · Dicetak: {generatedAt}
        </p>
      </div>

      <section className="report-hero">
        <div>
          <div className="report-eyebrow">
            <BarChart3 size={14} />
            Financial Reporting
          </div>
          <h2 className="report-title">Laporan &amp; Analitik</h2>
          <p className="report-subtitle">
            Analisis pendapatan, pengeluaran, laba, dan produktivitas kebun dari data
            aktual. Semua kartu, grafik, dan tabel mengikuti filter periode dan blok
            yang diterapkan.
          </p>
          <div className="report-hero-meta">
            <span className="report-period-pill">
              <CalendarDays size={12} />
              {period.label}
            </span>
            <span className="report-period-pill">
              <Trees size={12} />
              {kebunLabel}
            </span>
            <span className="report-period-pill">{detailRows.length} transaksi</span>
          </div>
        </div>
        <div className="report-actions">
          <button type="button" className="btn btn-secondary" onClick={handleExportExcel}>
            <Download size={16} />
            <span>Ekspor Excel</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </section>

      <section className="card report-filter-card">
        <div className="report-filter-head">
          <div>
            <h3 className="report-filter-title">Filter Laporan</h3>
            <p className="report-filter-subtitle">
              Pilih blok, tahun, bulan, atau rentang tanggal lalu terapkan filter.
            </p>
          </div>
          {isDirty && (
            <span className="report-dirty">
              <Info size={13} />
              Perubahan belum diterapkan
            </span>
          )}
        </div>

        <div className="report-filter-grid">
          <label className="report-field">
            <span>Blok Kebun</span>
            <select
              id="filter-kebun-laporan"
              className="form-select filter-control"
              value={draft.kebunId}
              onChange={(event) => updateDraft({ kebunId: event.target.value })}
            >
              <option value="all">Semua Blok Kebun</option>
              {kebunList.map((kebun) => (
                <option key={kebun.id} value={kebun.id}>
                  {kebun.nama} ({kebun.luas_hektar} Ha)
                </option>
              ))}
            </select>
          </label>

          <label className="report-field">
            <span>Tahun</span>
            <select
              id="filter-tahun-laporan"
              className="form-select filter-control"
              value={draft.year}
              onChange={(event) => handleYearChange(event.target.value)}
              disabled={draft.useRange}
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map((year) => (
                <option key={year} value={String(year)}>
                  Tahun {year}
                </option>
              ))}
            </select>
          </label>

          <div
            className="report-field"
            style={{
              opacity: draft.useRange ? 0.55 : 1,
              pointerEvents: draft.useRange ? 'none' : 'auto',
            }}
          >
            <span>Bulan</span>
            <MonthFilter
              id="filter-month-laporan"
              value={draft.month}
              onChange={handleMonthChange}
              showConvenience={false}
            />
          </div>

          <div className="report-field">
            <span>Rentang Tanggal</span>
            <button
              type="button"
              className={`btn ${
                draft.useRange ? 'btn-primary' : 'btn-secondary'
              } report-range-toggle`}
              onClick={handleRangeToggle}
            >
              <CalendarRange size={16} />
              {draft.useRange ? 'Rentang Aktif' : 'Gunakan Rentang'}
            </button>
          </div>
        </div>

        {draft.useRange && (
          <div className="report-range-row">
            <label className="report-range-field">
              <span>Dari Tanggal</span>
              <input
                type="date"
                className="form-input"
                value={draft.startDate}
                onChange={(event) => updateDraft({ startDate: event.target.value })}
              />
            </label>
            <label className="report-range-field">
              <span>Sampai Tanggal</span>
              <input
                type="date"
                className="form-input"
                value={draft.endDate}
                onChange={(event) => updateDraft({ endDate: event.target.value })}
              />
            </label>
            <span className="report-filter-note">
              Rentang tanggal mengabaikan filter Tahun/Bulan.
            </span>
          </div>
        )}

        <div className="report-filter-footer">
          <div className="report-filter-summary">
            Menampilkan <strong>{period.label}</strong> untuk <strong>{kebunLabel}</strong>{' '}
            · {stats.panen.length} panen, {stats.perawatan.length} perawatan,{' '}
            {stats.pengeluaran.length} pengeluaran.
          </div>
          <div className="report-filter-actions">
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              <RotateCcw size={16} />
              <span>Reset Filter</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={handleApply}>
              <Filter size={16} />
              <span>Terapkan Filter</span>
            </button>
          </div>
        </div>

        {filterError && (
          <div className="report-filter-error">
            <AlertTriangle size={14} />
            {filterError}
          </div>
        )}
      </section>

      <div className="report-kpi-grid">
        <div className="report-kpi-card income">
          <div className="report-kpi-top">
            <span className="report-kpi-icon">
              <Wallet size={17} />
            </span>
            <span className="report-kpi-label">Total Pendapatan</span>
          </div>
          <div className="report-kpi-value">{formatRupiah(stats.totalPendapatan)}</div>
          <div className="report-kpi-sub">
            {formatNumber(stats.totalProduksi)} kg produksi · {stats.panen.length} catatan
            panen
          </div>
          <DeltaBadge
            delta={makeDelta(
              stats.totalPendapatan,
              previousStats?.totalPendapatan ?? null
            )}
          />
        </div>

        <div className="report-kpi-card expense">
          <div className="report-kpi-top">
            <span className="report-kpi-icon">
              <Receipt size={17} />
            </span>
            <span className="report-kpi-label">Total Pengeluaran</span>
          </div>
          <div className="report-kpi-value">{formatRupiah(stats.totalPengeluaran)}</div>
          <div className="report-kpi-sub">
            Upah {formatRupiah(stats.totalBiayaPanen)} · Perawatan{' '}
            {formatRupiah(stats.totalBiayaPerawatan)}
          </div>
          <DeltaBadge
            delta={makeDelta(
              stats.totalPengeluaran,
              previousStats?.totalPengeluaran ?? null,
              { invert: true }
            )}
          />
        </div>

        <div className="report-kpi-card profit">
          <div className="report-kpi-top">
            <span className="report-kpi-icon">
              <TrendingUp size={17} />
            </span>
            <span className="report-kpi-label">Laba Bersih</span>
          </div>
          <div className="report-kpi-value">{formatRupiah(stats.labaBersih)}</div>
          <div className="report-kpi-sub">
            Margin {stats.totalPendapatan > 0 ? `${stats.marginProfit.toFixed(1)}%` : '—'} dari
            pendapatan
          </div>
          <DeltaBadge
            delta={makeDelta(stats.labaBersih, previousStats?.labaBersih ?? null)}
          />
        </div>

        <div className="report-kpi-card margin">
          <div className="report-kpi-top">
            <span className="report-kpi-icon">
              <Percent size={17} />
            </span>
            <span className="report-kpi-label">Margin Keuntungan</span>
          </div>
          <div className="report-kpi-value">
            {stats.totalPendapatan > 0 ? `${stats.marginProfit.toFixed(1)}%` : '—'}
          </div>
          <div className="report-kpi-sub">
            Laba {formatRupiah(stats.labaBersih)} dari pendapatan
          </div>
          <DeltaBadge
            delta={makeDelta(
              stats.totalPendapatan > 0 ? stats.marginProfit : null,
              previousStats && previousStats.totalPendapatan > 0
                ? previousStats.marginProfit
                : null,
              { margin: true }
            )}
          />
        </div>

        <div className="report-kpi-card production">
          <div className="report-kpi-top">
            <span className="report-kpi-icon">
              <Sprout size={17} />
            </span>
            <span className="report-kpi-label">Total Produksi TBS</span>
          </div>
          <div className="report-kpi-value">{formatNumber(stats.totalProduksi)} kg</div>
          <div className="report-kpi-sub">
            TBS {formatNumber(stats.totalBeratBersih)} kg · Brondol{' '}
            {formatNumber(stats.totalBeratBrondolan)} kg
          </div>
          <DeltaBadge
            delta={makeDelta(stats.totalProduksi, previousStats?.totalProduksi ?? null)}
          />
        </div>
      </div>

      <div className="report-grid">
        <section className="card report-span-8">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">Tren Pendapatan, Pengeluaran &amp; Laba</h3>
              <p className="report-card-subtitle">
                Nilai nominal per {trendUnit} dalam periode terpilih.
              </p>
            </div>
            <div className="report-chart-legend">
              <span className="report-legend-item">
                <i className="report-legend-dot" style={{ background: '#10b981' }} />
                Pendapatan
              </span>
              <span className="report-legend-item">
                <i className="report-legend-dot" style={{ background: '#f97316' }} />
                Pengeluaran
              </span>
              <span className="report-legend-item">
                <i className="report-legend-dot" style={{ background: '#0f172a' }} />
                Laba bersih
              </span>
            </div>
          </div>
          {trendData.length > 0 ? (
            <FinancialTrendChart
              data={trendData}
              formatRupiah={formatRupiah}
              formatCompact={formatCompactRupiah}
            />
          ) : (
            <EmptyState
              title="Belum ada data tren"
              description="Belum ada transaksi pada periode dan blok yang dipilih."
            />
          )}
        </section>

        <section className="card report-span-4">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">Alokasi Biaya</h3>
              <p className="report-card-subtitle">
                Proporsi upah panen, perawatan, dan pengeluaran lain.
              </p>
            </div>
          </div>

          {stats.totalPengeluaran > 0 ? (
            <div className="report-donut-layout">
              <CostDonut
                slices={expenseSlices}
                total={stats.totalPengeluaran}
                formatRupiah={formatRupiah}
              />
              <div className="report-donut-legend">
                {expenseSlices.map((slice) => (
                  <div className="report-donut-legend-item" key={slice.label}>
                    <span
                      className="report-legend-dot"
                      style={{ background: slice.color }}
                    />
                    <div className="report-donut-legend-main">
                      <div className="report-donut-legend-name">{slice.label}</div>
                      <div className="report-donut-legend-sub">
                        {((slice.value / stats.totalPengeluaran) * 100).toFixed(1)}% dari
                        total
                      </div>
                    </div>
                    <div
                      className="report-donut-legend-value"
                      style={{ color: slice.color }}
                    >
                      {formatRupiah(slice.value)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="report-avg-price">
                <span>Rata-rata harga TBS</span>
                <strong>
                  {stats.totalBeratBersih > 0
                    ? `${formatRupiah(
                        stats.totalPendapatanTbs / stats.totalBeratBersih
                      )}/kg`
                    : '—'}
                </strong>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Belum ada pengeluaran"
              description="Tidak ada biaya panen, perawatan, atau pengeluaran lain pada periode ini."
            />
          )}
        </section>

        <section className="card report-span-12">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">Tren Produksi TBS</h3>
              <p className="report-card-subtitle">
                Volume panen per {trendUnit}. Batang abu-abu putus-putus menandakan belum
                ada catatan panen.
              </p>
            </div>
            <div className="report-chart-legend">
              <span className="report-legend-item">
                <i className="report-legend-dot" style={{ background: '#10b981' }} />
                Produksi tercatat
              </span>
              <span className="report-legend-item">
                <i
                  className="report-legend-dot"
                  style={{ background: '#e2e8f0', border: '1px dashed #cbd5e1' }}
                />
                Belum ada catatan
              </span>
            </div>
          </div>
          {trendData.length > 0 ? (
            <ProductionTrendChart
              data={trendData}
              formatKg={formatKg}
              formatNumber={formatNumber}
            />
          ) : (
            <EmptyState
              title="Belum ada data produksi"
              description="Belum ada catatan panen pada periode dan blok yang dipilih."
            />
          )}
        </section>
      </div>

      <section className="card">
        <div className="report-card-header">
          <div>
            <h3 className="report-card-title">Rincian Transaksi</h3>
            <p className="report-card-subtitle">
              Pendapatan panen, upah panen, perawatan, dan pengeluaran lain. Biaya umum
              dialokasikan merata pada analisis per blok.
            </p>
          </div>
          <span className="badge badge-info">{sortedDetailRows.length} transaksi</span>
        </div>

        <div className="report-table-toolbar">
          <div className="report-search">
            <Search size={15} />
            <input
              type="search"
              className="form-input"
              placeholder="Cari tanggal, blok, kategori, atau keterangan..."
              value={detailSearch}
              onChange={(event) => {
                setDetailSearch(event.target.value);
                setDetailPage(1);
              }}
            />
          </div>
          <select
            className="form-select report-toolbar-select"
            value={detailType}
            onChange={(event) => {
              setDetailType(event.target.value as 'all' | DetailType);
              setDetailPage(1);
            }}
          >
            <option value="all">Semua Jenis</option>
            <option value="Pendapatan Panen">Pendapatan Panen</option>
            <option value="Upah Panen">Upah Panen</option>
            <option value="Pengeluaran Perawatan">Pengeluaran Perawatan</option>
            <option value="Pengeluaran Lainnya">Pengeluaran Lainnya</option>
          </select>
          <select
            className="form-select report-toolbar-select"
            value={detailPageSize}
            onChange={(event) => {
              setDetailPageSize(Number(event.target.value));
              setDetailPage(1);
            }}
          >
            <option value={10}>10 baris</option>
            <option value={25}>25 baris</option>
            <option value={50}>50 baris</option>
          </select>
        </div>

        {sortedDetailRows.length === 0 ? (
          <EmptyState
            title="Tidak ada transaksi"
            description="Ubah kata kunci, jenis transaksi, atau filter periode untuk menampilkan data."
          />
        ) : (
          <>
            <div className="desktop-only-table report-table-wrap">
              <table className="table-modern report-detail-table">
                <colgroup>
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '13%' }} />
                  <col />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      <button
                        type="button"
                        className="report-sort-btn"
                        onClick={() => toggleDetailSort('tanggal')}
                      >
                        Tanggal {renderSortIcon('tanggal')}
                      </button>
                    </th>
                    <th>Jenis</th>
                    <th>Kebun</th>
                    <th>Kategori</th>
                    <th>Keterangan</th>
                    <th>Volume / Harga</th>
                    <th style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="report-sort-btn"
                        onClick={() => toggleDetailSort('nominal')}
                      >
                        Total {renderSortIcon('nominal')}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDetailRows.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDateID(row.tanggal)}</td>
                      <td>
                        <span
                          className={`report-tx-badge ${
                            row.isIncome ? 'income' : 'expense'
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td>{row.kebunNama}</td>
                      <td>{row.kategori}</td>
                      <td className="report-cell-wrap">{row.keterangan || '—'}</td>
                      <td>
                        <div className="report-volume-cell">
                          <span>
                            {row.volume !== null
                              ? `${formatNumber(row.volume)} kg`
                              : '—'}
                          </span>
                          <span className="report-volume-price">
                            {row.hargaSatuan !== null
                              ? formatRupiah(row.hargaSatuan)
                              : '—'}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 800,
                          color: row.isIncome ? '#047857' : '#b91c1c',
                        }}
                      >
                        {row.isIncome ? '+' : '−'} {formatRupiah(row.nominal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-only-cards">
              {paginatedDetailRows.map((row) => (
                <div className="report-mobile-card" key={row.id}>
                  <div className="report-mobile-card-top">
                    <span
                      className={`report-tx-badge ${
                        row.isIncome ? 'income' : 'expense'
                      }`}
                    >
                      {row.type}
                    </span>
                    <strong
                      className={`report-mobile-amount ${
                        row.isIncome ? 'income' : 'expense'
                      }`}
                    >
                      {row.isIncome ? '+' : '−'} {formatRupiah(row.nominal)}
                    </strong>
                  </div>
                  <div className="report-mobile-meta">
                    <span>{formatDateID(row.tanggal)}</span>
                    <span>{row.kebunNama}</span>
                    <span>{row.kategori}</span>
                  </div>
                  <div className="report-mobile-desc">{row.keterangan || '—'}</div>
                  <div className="report-mobile-detail">
                    <span>
                      Volume:{' '}
                      {row.volume !== null ? `${formatNumber(row.volume)} kg` : '—'}
                    </span>
                    <span>
                      Harga:{' '}
                      {row.hargaSatuan !== null ? formatRupiah(row.hargaSatuan) : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="report-detail-totals">
              <div className="report-total-pill income">
                <span>Total Pendapatan</span>
                <strong>{formatRupiah(detailTotals.income)}</strong>
              </div>
              <div className="report-total-pill expense">
                <span>Total Pengeluaran</span>
                <strong>{formatRupiah(detailTotals.expense)}</strong>
              </div>
              <div className="report-total-pill net">
                <span>Laba Bersih</span>
                <strong>{formatRupiah(detailTotals.income - detailTotals.expense)}</strong>
              </div>
            </div>

            <div className="report-pagination">
              <span>
                Menampilkan {detailStart}–{detailEnd} dari {sortedDetailRows.length}{' '}
                transaksi
              </span>
              <div className="report-page-controls">
                <button
                  type="button"
                  className="report-page-btn"
                  disabled={safeDetailPage <= 1}
                  onClick={() => setDetailPage((page) => Math.max(1, page - 1))}
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft size={15} />
                </button>
                <span>
                  Halaman {safeDetailPage} / {detailPageCount}
                </span>
                <button
                  type="button"
                  className="report-page-btn"
                  disabled={safeDetailPage >= detailPageCount}
                  onClick={() =>
                    setDetailPage((page) => Math.min(detailPageCount, page + 1))
                  }
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <div className="report-card-header">
          <div>
            <h3 className="report-card-title">Perbandingan Periode</h3>
            <p className="report-card-subtitle">
              {period.label} dibanding {previousPeriod?.label || 'periode sebelumnya'}.
            </p>
          </div>
          <span
            className={`badge ${
              previousStats ? 'badge-success' : 'badge-warning'
            }`}
          >
            {previousStats ? 'Pembanding tersedia' : 'Belum ada pembanding'}
          </span>
        </div>

        {!previousStats && (
          <p className="report-filter-note" style={{ paddingBottom: 10 }}>
            Tidak ada data pada periode pembanding untuk filter yang sama. Nilai
            perbandingan ditampilkan sebagai tanda —.
          </p>
        )}

        <div className="desktop-only-table report-table-wrap">
          <table className="table-modern" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Indikator</th>
                <th>Periode Ini</th>
                <th>{previousPeriod?.label || 'Periode Sebelumnya'}</th>
                <th>Perubahan</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label}>
                  <td style={{ fontWeight: 700 }}>{row.label}</td>
                  <td>{row.current !== null ? row.display(row.current) : '—'}</td>
                  <td>{row.previous !== null ? row.display(row.previous) : '—'}</td>
                  <td>
                    <DeltaBadge delta={row.delta} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-only-cards">
          {comparisonRows.map((row) => (
            <div className="report-mobile-card" key={row.label}>
              <div className="report-mobile-card-top">
                <strong>{row.label}</strong>
                <DeltaBadge delta={row.delta} />
              </div>
              <div className="report-mobile-stats">
                <div>
                  <div className="report-mobile-stat-label">Periode ini</div>
                  <div className="report-mobile-stat-value">
                    {row.current !== null ? row.display(row.current) : '—'}
                  </div>
                </div>
                <div>
                  <div className="report-mobile-stat-label">Sebelumnya</div>
                  <div className="report-mobile-stat-value">
                    {row.previous !== null ? row.display(row.previous) : '—'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="report-card-header">
          <div>
            <h3 className="report-card-title">Analisis per Blok Kebun</h3>
            <p className="report-card-subtitle">
              Produksi, pendapatan, pengeluaran, dan laba per blok. Biaya umum
              dialokasikan merata ke seluruh blok.
            </p>
          </div>
          <select
            className="form-select report-toolbar-select"
            value={blockSort}
            onChange={(event) =>
              setBlockSort(
                event.target.value as
                  | 'laba'
                  | 'pendapatan'
                  | 'pengeluaran'
                  | 'produksi'
                  | 'yield'
                  | 'margin'
              )
            }
          >
            <option value="laba">Urutkan: Laba tertinggi</option>
            <option value="pendapatan">Urutkan: Pendapatan tertinggi</option>
            <option value="pengeluaran">Urutkan: Pengeluaran terbesar</option>
            <option value="produksi">Urutkan: Produksi tertinggi</option>
            <option value="yield">Urutkan: Yield tertinggi</option>
            <option value="margin">Urutkan: Margin tertinggi</option>
          </select>
        </div>

        {kebunPerformance.length === 0 ? (
          <EmptyState
            title="Belum ada blok kebun"
            description="Tambahkan data kebun terlebih dahulu untuk melihat analisis per blok."
          />
        ) : (
          <>
            <div className="desktop-only-table report-table-wrap">
              <table className="table-modern report-block-table">
                <colgroup>
                  <col style={{ width: '19%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Blok Kebun</th>
                    <th>Luas</th>
                    <th>Produksi</th>
                    <th>Pendapatan</th>
                    <th>Pengeluaran</th>
                    <th>Laba Bersih</th>
                    <th>Margin</th>
                    <th>Kontrib.</th>
                  </tr>
                </thead>
                <tbody>
                  {kebunPerformance.map((row) => (
                    <tr key={row.kebun.id}>
                      <td className="report-block-name" style={{ fontWeight: 700 }}>
                        {row.kebun.nama}
                      </td>
                      <td>{formatDecimal(Number(row.kebun.luas_hektar) || 0)} Ha</td>
                      <td>
                        <div className="report-prod-cell">
                          <span>{formatNumber(row.production)} kg</span>
                          <span className="report-prod-yield">
                            {row.yieldKgPerHa !== null
                              ? `${formatNumber(row.yieldKgPerHa)} kg/ha`
                              : '—'}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#047857' }}>
                        {formatRupiah(row.revenue)}
                      </td>
                      <td style={{ fontWeight: 700, color: '#b91c1c' }}>
                        {formatRupiah(row.totalExpense)}
                      </td>
                      <td
                        style={{
                          fontWeight: 800,
                          color: row.laba >= 0 ? '#047857' : '#b91c1c',
                        }}
                      >
                        {formatRupiah(row.laba)}
                      </td>
                      <td>{row.margin !== null ? `${row.margin.toFixed(1)}%` : '—'}</td>
                      <td>{row.contribution.toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td>Total</td>
                    <td>{formatDecimal(blockTotals.luas)} Ha</td>
                    <td>
                      <div className="report-prod-cell">
                        <span>{formatNumber(blockTotals.production)} kg</span>
                        <span className="report-prod-yield">
                          {blockTotals.yieldKgPerHa !== null
                            ? `${formatNumber(blockTotals.yieldKgPerHa)} kg/ha`
                            : '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: '#047857' }}>{formatRupiah(blockTotals.revenue)}</td>
                    <td style={{ color: '#b91c1c' }}>
                      {formatRupiah(blockTotals.totalExpense)}
                    </td>
                    <td style={{ color: blockTotals.laba >= 0 ? '#047857' : '#b91c1c' }}>
                      {formatRupiah(blockTotals.laba)}
                    </td>
                    <td>
                      {blockTotals.margin !== null
                        ? `${blockTotals.margin.toFixed(1)}%`
                        : '—'}
                    </td>
                    <td>{blockTotals.production > 0 ? '100%' : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mobile-only-cards">
              {kebunPerformance.map((row) => (
                <div className="report-mobile-card" key={row.kebun.id}>
                  <div className="report-mobile-card-top">
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>
                        {row.kebun.nama}
                      </div>
                      <div className="report-mobile-meta">
                        {formatDecimal(Number(row.kebun.luas_hektar) || 0)} Ha ·{' '}
                        {row.contribution.toFixed(1)}% kontribusi
                      </div>
                    </div>
                    <span className="badge badge-success">
                      {row.yieldKgPerHa !== null
                        ? `${formatNumber(row.yieldKgPerHa)} kg/ha`
                        : '—'}
                    </span>
                  </div>
                  <div className="report-mobile-stats">
                    <div>
                      <div className="report-mobile-stat-label">Produksi</div>
                      <div className="report-mobile-stat-value">
                        {formatNumber(row.production)} kg
                      </div>
                    </div>
                    <div>
                      <div className="report-mobile-stat-label">Pendapatan</div>
                      <div className="report-mobile-stat-value" style={{ color: '#047857' }}>
                        {formatRupiah(row.revenue)}
                      </div>
                    </div>
                    <div>
                      <div className="report-mobile-stat-label">Pengeluaran</div>
                      <div className="report-mobile-stat-value" style={{ color: '#b91c1c' }}>
                        {formatRupiah(row.totalExpense)}
                      </div>
                    </div>
                    <div>
                      <div className="report-mobile-stat-label">Laba Bersih</div>
                      <div
                        className="report-mobile-stat-value"
                        style={{ color: row.laba >= 0 ? '#047857' : '#b91c1c' }}
                      >
                        {formatRupiah(row.laba)}
                      </div>
                    </div>
                    <div>
                      <div className="report-mobile-stat-label">Margin</div>
                      <div className="report-mobile-stat-value">
                        {row.margin !== null ? `${row.margin.toFixed(1)}%` : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="report-mobile-stat-label">Kontribusi</div>
                      <div className="report-mobile-stat-value">
                        {row.contribution.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="report-grid">
        <section className="card report-span-5">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">Insight &amp; Rekomendasi</h3>
              <p className="report-card-subtitle">
                Ringkasan otomatis dari data aktual pada periode terpilih.
              </p>
            </div>
            <Lightbulb size={18} color="#d97706" />
          </div>

          <div className="report-insight-list">
            {insights.map((insight) => (
              <div
                className={`report-insight ${insight.tone}`}
                key={insight.id}
              >
                <span className="report-insight-icon">
                  {renderInsightIcon(insight.tone)}
                </span>
                <div>
                  <div className="report-insight-title">{insight.title}</div>
                  <div className="report-insight-desc">{insight.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card report-span-7">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">Indikator Efisiensi</h3>
              <p className="report-card-subtitle">
                Rasio pendapatan, biaya, laba, dan margin terhadap produksi serta
                pendapatan.
              </p>
            </div>
            <Target size={18} color="#0284c7" />
          </div>

          <div className="report-efficiency-grid">
            {efficiencyItems.map((item) => (
              <div className="report-efficiency-item" key={item.label}>
                <div className="report-efficiency-label">{item.label}</div>
                <div className="report-efficiency-value">{item.value}</div>
                <div className="report-efficiency-sub">{item.sub}</div>
                <DeltaBadge delta={item.delta} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

