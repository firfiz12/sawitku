import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Download,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  Trees,
} from 'lucide-react';
import type { Kebun, Panen, Perawatan, PengeluaranLain } from '../types';
import { MonthFilter } from '../components/MonthFilter';
import { todayISO } from '../lib/date';

interface LaporanViewProps {
  kebunList: Kebun[];
  panenList: Panen[];
  perawatanList: Perawatan[];
  pengeluaranLainList: PengeluaranLain[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  kebunList,
  panenList,
  perawatanList,
  pengeluaranLainList,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('all'); // 'all' atau 'YYYY'
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(''); // YYYY-MM
  const [filterKebunId, setFilterKebunId] = useState<string>('all');

  const [now] = useState(() => new Date());
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Daftar tahun yang tersedia dari data riwayat
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>([currentYear]);
    panenList.forEach((p) => {
      if (p.tanggal) {
        const y = parseInt(p.tanggal.slice(0, 4), 10);
        if (!isNaN(y)) yearSet.add(y);
      }
    });
    perawatanList.forEach((p) => {
      if (p.tanggal) {
        const y = parseInt(p.tanggal.slice(0, 4), 10);
        if (!isNaN(y)) yearSet.add(y);
      }
    });
    pengeluaranLainList.forEach((p) => {
      if (p.tanggal) {
        const y = parseInt(p.tanggal.slice(0, 4), 10);
        if (!isNaN(y)) yearSet.add(y);
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [currentYear, panenList, perawatanList, pengeluaranLainList]);

  const isIncludedInPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    // Bulan spesifik (YYYY-MM) menang jika dipilih
    if (selectedYearMonth) return dateStr.startsWith(selectedYearMonth);
    // Tahun spesifik jika dipilih (bukan 'all')
    if (selectedYear !== 'all') return dateStr.startsWith(selectedYear);
    // Default: Semua Riwayat
    return true;
  };

  const filteredPanen = panenList.filter((p) => {
    if (!isIncludedInPeriod(p.tanggal)) return false;
    if (filterKebunId !== 'all' && p.kebun_id !== filterKebunId) return false;
    return true;
  });

  const filteredPerawatan = perawatanList.filter((p) => {
    if (!isIncludedInPeriod(p.tanggal)) return false;
    if (filterKebunId !== 'all' && p.kebun_id !== filterKebunId) return false;
    return true;
  });

  const filteredPengeluaranLain = pengeluaranLainList.filter((p) => {
    if (!isIncludedInPeriod(p.tanggal)) return false;
    if (filterKebunId !== 'all' && p.kebun_id && p.kebun_id !== filterKebunId) return false;
    return true;
  });

  // Totals
  const totalBeratBersih = filteredPanen.reduce((acc, p) => acc + (Number(p.berat_bersih_kg) || 0), 0);
  const totalBeratBrondol = filteredPanen.reduce((acc, p) => acc + (Number(p.berat_brondolan_kg) || 0), 0);
  const totalBeratTBS = totalBeratBersih + totalBeratBrondol;
  const pendapatanTbs = filteredPanen.reduce(
    (acc, p) => acc + (Number(p.berat_bersih_kg) || 0) * (Number(p.harga_per_kg) || 0),
    0
  );
  const totalPendapatan = filteredPanen.reduce((acc, p) => acc + (Number(p.total_pendapatan) || 0), 0);
  const totalBiayaPerawatan = filteredPerawatan.reduce((acc, p) => acc + (Number(p.total_biaya) || 0), 0);
  const totalPengeluaranLain = filteredPengeluaranLain.reduce((acc, p) => acc + (Number(p.jumlah) || 0), 0);
  const totalBiayaPanen = filteredPanen.reduce((acc, p) => acc + (Number(p.upah_panen) || 0), 0);
  const totalPengeluaran = totalBiayaPerawatan + totalPengeluaranLain + totalBiayaPanen;
  const labaBersih = totalPendapatan - totalPengeluaran;
  const marginProfit = totalPendapatan > 0 ? (labaBersih / totalPendapatan) * 100 : 0;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Yield Per Kebun (hanya tampilkan kebun yang difilter atau semua kebun)
  const displayedKebunList = filterKebunId === 'all'
    ? kebunList
    : kebunList.filter((k) => k.id === filterKebunId);

  const kebunPerformance = displayedKebunList.map((k) => {
    const kPanen = filteredPanen.filter((p) => p.kebun_id === k.id);
    const kBerat = kPanen.reduce(
      (acc, p) => acc + (Number(p.berat_bersih_kg) || 0) + (Number(p.berat_brondolan_kg) || 0),
      0
    );
    const kPendapatan = kPanen.reduce((acc, p) => acc + (Number(p.total_pendapatan) || 0), 0);
    const kPerawatan = filteredPerawatan
      .filter((p) => p.kebun_id === k.id)
      .reduce((acc, p) => acc + (Number(p.total_biaya) || 0), 0);
    const yieldKgPerHa = k.luas_hektar > 0 ? kBerat / k.luas_hektar : 0;

    return {
      kebun: k,
      totalBerat: kBerat,
      totalPendapatan: kPendapatan,
      totalPerawatan: kPerawatan,
      yieldKgPerHa,
      kontribusiPersen: totalBeratTBS > 0 ? (kBerat / totalBeratTBS) * 100 : 0,
    };
  });

  // Monthly Aggregations for 6 Months Chart — mengikuti filter kebun
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyData: { label: string; yearMonth: string; tbsKg: number; pendapatan: number; pengeluaran: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const target = new Date(currentYear, currentMonth - i, 1);
    const ym = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
    const label = `${months[target.getMonth()]} '${String(target.getFullYear()).slice(-2)}`;

    // Gunakan data yang sudah difilter kebun (bukan raw list)
    const pBulan = filteredPanen.filter((p) => p.tanggal.startsWith(ym));
    const pwBulan = filteredPerawatan.filter((p) => p.tanggal.startsWith(ym));
    const plBulan = filteredPengeluaranLain.filter((p) => p.tanggal.startsWith(ym));

    const tbsKg = pBulan.reduce(
      (acc, p) => acc + (Number(p.berat_bersih_kg) || 0) + (Number(p.berat_brondolan_kg) || 0),
      0
    );
    const pendapatan = pBulan.reduce((acc, p) => acc + (Number(p.total_pendapatan) || 0), 0);
    const pengeluaran =
      pwBulan.reduce((acc, p) => acc + (Number(p.total_biaya) || 0), 0) +
      plBulan.reduce((acc, p) => acc + (Number(p.jumlah) || 0), 0) +
      pBulan.reduce((acc, p) => acc + (Number(p.upah_panen) || 0), 0);

    monthlyData.push({ label, yearMonth: ym, tbsKg, pendapatan, pengeluaran });
  }

  const maxTbs = Math.max(...monthlyData.map((m) => m.tbsKg), 1000);

  // ── SVG Pie Chart helpers ──────────────────────────────────────────────────
  const pieSlices = [
    { label: 'Perawatan Kebun', value: totalBiayaPerawatan, color: '#0284c7' },
    { label: 'Pengeluaran Lain', value: totalPengeluaranLain, color: '#d97706' },
    { label: 'Upah Panen', value: totalBiayaPanen, color: '#dc2626' },
  ].filter((s) => s.value > 0);

  const computePieCoords = (slices: typeof pieSlices) => {
    let cumAngle = -Math.PI / 2; // mulai dari atas
    return slices.map((s) => {
      const pct = totalPengeluaran > 0 ? s.value / totalPengeluaran : 0;
      const startAngle = cumAngle;
      const sweep = pct * 2 * Math.PI;
      cumAngle += sweep;
      const endAngle = cumAngle;
      const cx = 90, cy = 90, r = 72;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = sweep > Math.PI ? 1 : 0;
      const path = pct >= 0.9999
        ? `M ${cx} ${cy} m 0 ${-r} a ${r} ${r} 0 1 1 -0.001 0 Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return { ...s, pct, path };
    });
  };
  const pieData = computePieCoords(pieSlices);

  // CSV Export
  const handleExportCSV = () => {
    let csv = 'Tanggal,Tipe,Kategori/Kebun,Keterangan,Penerimaan_Rp,Pengeluaran_Rp\n';

    filteredPanen.forEach((p) => {
      const k = kebunList.find((item) => item.id === p.kebun_id)?.nama || 'Kebun';
      const brondol = p.berat_brondolan_kg > 0
        ? ` + Brondol ${p.berat_brondolan_kg} kg @ Rp ${p.harga_brondolan_per_kg}`
        : '';
      csv += `"${p.tanggal}","Panen","${k}","TBS Bersih ${p.berat_bersih_kg} kg @ Rp ${p.harga_per_kg}${brondol}",${p.total_pendapatan},0\n`;
      if (p.upah_panen > 0) {
        csv += `"${p.tanggal}","Biaya Panen","${k}","Upah panen",0,${p.upah_panen}\n`;
      }
    });

    filteredPerawatan.forEach((p) => {
      const k = kebunList.find((item) => item.id === p.kebun_id)?.nama || 'Kebun';
      csv += `"${p.tanggal}","Perawatan","${k}","${p.jenis_perawatan} - ${p.nama_bahan || ''}",0,${p.total_biaya}\n`;
    });

    filteredPengeluaranLain.forEach((p) => {
      csv += `"${p.tanggal}","Pengeluaran Lain","${p.kategori}","${p.keterangan || ''}",0,${p.jumlah}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_SawitKu_${todayISO()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Top Filter & Export Bar */}
      <div className="card filter-bar" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trees size={16} color="#059669" />
            <select
              id="filter-kebun-laporan"
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

          <select
            id="filter-tahun-laporan"
            className="form-select filter-control"
            style={{ width: 'auto', minWidth: 0 }}
            value={selectedYear}
            onChange={(e) => {
              const y = e.target.value;
              setSelectedYear(y);
              if (y === 'all') {
                setSelectedYearMonth('');
              } else if (selectedYearMonth && !selectedYearMonth.startsWith(y)) {
                setSelectedYearMonth('');
              }
            }}
            title="Filter Tahun"
          >
            <option value="all">Semua Tahun</option>
            {availableYears.map((yr) => (
              <option key={yr} value={String(yr)}>Tahun {yr}</option>
            ))}
          </select>

          <MonthFilter
            id="filter-month-laporan"
            value={selectedYearMonth}
            onChange={(ym) => {
              setSelectedYearMonth(ym);
              if (ym) {
                setSelectedYear(ym.slice(0, 4));
              }
            }}
            showConvenience={false}
          />

          {(filterKebunId !== 'all' || selectedYear !== 'all' || selectedYearMonth !== '') && (
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                setFilterKebunId('all');
                setSelectedYear('all');
                setSelectedYearMonth('');
              }}
            >
              Reset
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button id="btn-export-csv" className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Ekspor CSV</span>
          </button>
          <button id="btn-print-report" className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.12)' }}>
              <ArrowUpRight size={22} color="#059669" />
            </div>
            <div className="stat-label">Total Pendapatan</div>
          </div>
          <div className="stat-value" style={{ color: '#047857' }}>
            {formatRupiah(totalPendapatan)}
          </div>
          <div className="stat-subtext">
            <span>
              {totalBeratBersih.toLocaleString('id-ID')} Kg TBS
              {totalBeratBrondol > 0 ? ` + ${totalBeratBrondol.toLocaleString('id-ID')} Kg Brondol` : ''}
            </span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'rgba(220, 38, 38, 0.12)' }}>
              <ArrowDownRight size={22} color="#dc2626" />
            </div>
            <div className="stat-label">Total Pengeluaran</div>
          </div>
          <div className="stat-value" style={{ color: '#b91c1c' }}>
            {formatRupiah(totalPengeluaran)}
          </div>
          <div className="stat-subtext" style={{ overflowWrap: 'anywhere' }}>
            <span>Perawatan: {formatRupiah(totalBiayaPerawatan)}</span>
            <span>Panen: {formatRupiah(totalBiayaPanen)}</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: labaBersih >= 0 ? 'rgba(5, 150, 105, 0.12)' : 'rgba(220, 38, 38, 0.12)' }}>
              <TrendingUp size={22} color={labaBersih >= 0 ? '#059669' : '#dc2626'} />
            </div>
            <div className="stat-label">Laba Bersih</div>
          </div>
          <div className="stat-value" style={{ color: labaBersih >= 0 ? '#047857' : '#b91c1c' }}>
            {formatRupiah(labaBersih)}
          </div>
          <div className="stat-subtext">
            <span>Margin Keuntungan: {marginProfit.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Production Chart & Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Visual Chart Produksi TBS Bulanan */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="h3-card-title">Tren Produksi TBS (6 Bulan Terakhir)</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Volume panen dalam satuan Kilogram (Kg)</p>
            </div>
          </div>

          <div style={{ padding: '16px 0', height: 240, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            {monthlyData.map((m) => {
              const heightPercent = maxTbs > 0 ? Math.max((m.tbsKg / maxTbs) * 100, 6) : 6;
              const isSelected = selectedYearMonth === m.yearMonth;
              return (
                <div
                  key={m.yearMonth}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 6, fontWeight: 700 }}>
                    {m.tbsKg > 0 ? `${(m.tbsKg / 1000).toFixed(1)}t` : '0'}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 38,
                      height: `${heightPercent}%`,
                      background: isSelected
                        ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                      borderRadius: '6px 6px 0 0',
                      boxShadow: isSelected ? '0 0 10px rgba(217, 119, 6, 0.35)' : '0 0 10px rgba(16, 185, 129, 0.25)',
                      transition: 'height 0.4s ease',
                    }}
                    title={`${m.label}: ${m.tbsKg.toLocaleString('id-ID')} Kg${isSelected ? ' (bulan terpilih)' : ''}`}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 10, fontWeight: 700 }}>
                    {m.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie Chart Alokasi Biaya */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="h3-card-title">Rincian Alokasi Biaya</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Proporsi pengeluaran perawatan dan operasional</p>
            </div>
          </div>

          {totalPengeluaran === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '0.88rem' }}>
              Belum ada data pengeluaran pada periode ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
              {/* SVG Pie Chart */}
              <div style={{ position: 'relative', width: 180, height: 180 }}>
                <svg viewBox="0 0 180 180" width="180" height="180">
                  {pieData.map((slice, i) => (
                    <path
                      key={i}
                      d={slice.path}
                      fill={slice.color}
                      stroke="#fff"
                      strokeWidth={2.5}
                      style={{ transition: 'opacity 0.2s' }}
                    >
                      <title>{slice.label}: {formatRupiah(slice.value)} ({(slice.pct * 100).toFixed(1)}%)</title>
                    </path>
                  ))}
                  {/* Center label */}
                  <text
                    x="90"
                    y="86"
                    textAnchor="middle"
                    style={{ fontSize: '10px', fill: '#64748b', fontWeight: 600 }}
                  >
                    Total
                  </text>
                  <text
                    x="90"
                    y="100"
                    textAnchor="middle"
                    style={{ fontSize: '9px', fill: '#0f172a', fontWeight: 800 }}
                  >
                    {formatRupiah(totalPengeluaran).replace('Rp\u00a0', 'Rp ')}
                  </text>
                </svg>
              </div>

              {/* Legend Table */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pieData.map((slice, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        background: slice.color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#1e293b' }}>{slice.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{(slice.pct * 100).toFixed(1)}% dari total pengeluaran</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: slice.color, textAlign: 'right', flexShrink: 0 }}>
                      {formatRupiah(slice.value)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rata-rata Harga TBS */}
              <div
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                  Rata-rata Harga Jual TBS Periode Ini:
                </div>
                <div className="num-xl" style={{ color: '#0f172a', marginTop: 4 }}>
                  Rp {totalBeratBersih > 0 ? Math.round(pendapatanTbs / totalBeratBersih).toLocaleString('id-ID') : 0}{' '}
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>/ Kg TBS</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Produktivitas & Kinerja per Blok Kebun */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="h3-card-title">Analisis Produktivitas per Blok Kebun (Yield Kg/Ha)</h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Kinerja hasil panen dan pendapatan setiap blok lahan</p>
          </div>
        </div>

        <div className="table-wrapper desktop-only-table">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Nama Kebun</th>
                <th>Luas (Ha)</th>
                <th>Total Panen (Kg)</th>
                <th>Produktivitas (Kg/Ha)</th>
                <th>Total Pendapatan</th>
                <th>Biaya Perawatan</th>
                <th>Kontribusi %</th>
              </tr>
            </thead>
            <tbody>
              {kebunPerformance.map((item) => (
                <tr key={item.kebun.id}>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.kebun.nama}</td>
                  <td>{item.kebun.luas_hektar} Ha</td>
                  <td style={{ fontWeight: 600 }}>{item.totalBerat.toLocaleString('id-ID')} Kg</td>
                  <td>
                    <span className="badge badge-success">
                      {Math.round(item.yieldKgPerHa).toLocaleString('id-ID')} Kg/Ha
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#047857' }}>{formatRupiah(item.totalPendapatan)}</td>
                  <td style={{ color: '#dc2626', fontWeight: 600 }}>{formatRupiah(item.totalPerawatan)}</td>
                  <td>{item.kontribusiPersen.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Kartu Produktivitas Lengkap Tanpa Perlu Geser Kanan-Kiri */}
        <div className="mobile-only-cards" style={{ padding: '0 0 6px 0' }}>
          {kebunPerformance.map((item) => (
            <div key={item.kebun.id} className="mobile-data-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.96rem' }}>
                    {item.kebun.nama}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                    Luas: {item.kebun.luas_hektar} Ha
                  </div>
                </div>
                <span className="badge badge-info" style={{ fontWeight: 700 }}>
                  {item.kontribusiPersen.toFixed(1)}% Kontribusi
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Panen</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                    {item.totalBerat.toLocaleString('id-ID')} Kg
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Produktivitas</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#059669' }}>
                    {Math.round(item.yieldKgPerHa).toLocaleString('id-ID')} Kg/Ha
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Pendapatan</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#047857' }}>
                    {formatRupiah(item.totalPendapatan)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Biaya Perawatan</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#dc2626' }}>
                    {formatRupiah(item.totalPerawatan)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', paddingTop: 2 }}>
                <span style={{ color: '#64748b' }}>Estimasi Margin Kebun:</span>
                <strong style={{ color: item.totalPendapatan - item.totalPerawatan >= 0 ? '#047857' : '#dc2626', fontWeight: 800 }}>
                  {formatRupiah(item.totalPendapatan - item.totalPerawatan)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
