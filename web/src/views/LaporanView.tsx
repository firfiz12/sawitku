import React, { useState } from 'react';
import {
  TrendingUp,
  Download,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { Kebun, Panen, Perawatan, PengeluaranLain } from '../types';
import { MonthFilter } from '../components/MonthFilter';

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
  const [periodFilter, setPeriodFilter] = useState<'thisMonth' | 'last3Months' | 'thisYear' | 'all'>('thisYear');
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(''); // YYYY-MM, lebih spesifik dari pill periode

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const isIncludedInPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    // Bulan eksplisit menang atas pill periode
    if (selectedYearMonth) return dateStr.startsWith(selectedYearMonth);
    const d = new Date(dateStr);
    if (periodFilter === 'all') return true;
    if (periodFilter === 'thisYear') return d.getFullYear() === currentYear;
    if (periodFilter === 'thisMonth') {
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }
    if (periodFilter === 'last3Months') {
      const diffMonths = (currentYear - d.getFullYear()) * 12 + (currentMonth - d.getMonth());
      return diffMonths >= 0 && diffMonths < 3;
    }
    return true;
  };

  const filteredPanen = panenList.filter((p) => isIncludedInPeriod(p.tanggal));
  const filteredPerawatan = perawatanList.filter((p) => isIncludedInPeriod(p.tanggal));
  const filteredPengeluaranLain = pengeluaranLainList.filter((p) => isIncludedInPeriod(p.tanggal));

  // Totals
  const totalBeratTBS = filteredPanen.reduce((acc, p) => acc + (Number(p.berat_kg) || 0), 0);
  const totalPendapatan = filteredPanen.reduce((acc, p) => acc + (Number(p.total_pendapatan) || 0), 0);
  const totalBiayaPerawatan = filteredPerawatan.reduce((acc, p) => acc + (Number(p.total_biaya) || 0), 0);
  const totalPengeluaranLain = filteredPengeluaranLain.reduce((acc, p) => acc + (Number(p.jumlah) || 0), 0);
  const totalPengeluaran = totalBiayaPerawatan + totalPengeluaranLain;
  const labaBersih = totalPendapatan - totalPengeluaran;
  const marginProfit = totalPendapatan > 0 ? (labaBersih / totalPendapatan) * 100 : 0;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Yield Per Kebun
  const kebunPerformance = kebunList.map((k) => {
    const kPanen = filteredPanen.filter((p) => p.kebun_id === k.id);
    const kBerat = kPanen.reduce((acc, p) => acc + (Number(p.berat_kg) || 0), 0);
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

  // Monthly Aggregations for 6 Months Chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyData: { label: string; yearMonth: string; tbsKg: number; pendapatan: number; pengeluaran: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const target = new Date(currentYear, currentMonth - i, 1);
    const ym = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
    const label = `${months[target.getMonth()]} '${String(target.getFullYear()).slice(-2)}`;

    const pBulan = panenList.filter((p) => p.tanggal.startsWith(ym));
    const pwBulan = perawatanList.filter((p) => p.tanggal.startsWith(ym));
    const plBulan = pengeluaranLainList.filter((p) => p.tanggal.startsWith(ym));

    const tbsKg = pBulan.reduce((acc, p) => acc + (Number(p.berat_kg) || 0), 0);
    const pendapatan = pBulan.reduce((acc, p) => acc + (Number(p.total_pendapatan) || 0), 0);
    const pengeluaran =
      pwBulan.reduce((acc, p) => acc + (Number(p.total_biaya) || 0), 0) +
      plBulan.reduce((acc, p) => acc + (Number(p.jumlah) || 0), 0);

    monthlyData.push({ label, yearMonth: ym, tbsKg, pendapatan, pengeluaran });
  }

  const maxTbs = Math.max(...monthlyData.map((m) => m.tbsKg), 1000);

  // CSV Export
  const handleExportCSV = () => {
    let csv = 'Tanggal,Tipe,Kategori/Kebun,Keterangan,Penerimaan_Rp,Pengeluaran_Rp\n';

    filteredPanen.forEach((p) => {
      const k = kebunList.find((item) => item.id === p.kebun_id)?.nama || 'Kebun';
      csv += `"${p.tanggal}","Panen","${k}","TBS ${p.berat_kg} kg @ Rp ${p.harga_per_kg}",${p.total_pendapatan},0\n`;
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
    link.setAttribute('download', `Laporan_SawitKu_${new Date().toISOString().split('T')[0]}.csv`);
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
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 600 }}>Periode Laporan:</span>
          {(
            [
              { id: 'thisMonth', label: 'Bulan Ini' },
              { id: 'last3Months', label: '3 Bulan Terakhir' },
              { id: 'thisYear', label: 'Tahun Ini' },
              { id: 'all', label: 'Semua Riwayat' },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              className={`btn ${periodFilter === btn.id && !selectedYearMonth ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              onClick={() => {
                setPeriodFilter(btn.id);
                // Saat memilih pill, bulan eksplisit dikosongkan supaya pill berlaku
                if (btn.id === 'thisMonth') {
                  setSelectedYearMonth(new Date().toISOString().slice(0, 7));
                } else {
                  setSelectedYearMonth('');
                }
              }}
            >
              {btn.label}
            </button>
          ))}

          <MonthFilter
            id="filter-month-laporan"
            value={selectedYearMonth}
            onChange={setSelectedYearMonth}
            showConvenience={false}
          />
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
          <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.12)' }}>
            <ArrowUpRight size={22} color="#059669" />
          </div>
          <div className="stat-label">Total Pendapatan TBS</div>
          <div className="stat-value" style={{ color: '#047857' }}>
            {formatRupiah(totalPendapatan)}
          </div>
          <div className="stat-subtext">
            <span>{totalBeratTBS.toLocaleString('id-ID')} Kg Total Panen</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(220, 38, 38, 0.12)' }}>
            <ArrowDownRight size={22} color="#dc2626" />
          </div>
          <div className="stat-label">Total Pengeluaran</div>
          <div className="stat-value" style={{ color: '#b91c1c' }}>
            {formatRupiah(totalPengeluaran)}
          </div>
          <div className="stat-subtext">
            <span>Perawatan: {formatRupiah(totalBiayaPerawatan)} • Lain: {formatRupiah(totalPengeluaranLain)}</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: labaBersih >= 0 ? 'rgba(5, 150, 105, 0.12)' : 'rgba(220, 38, 38, 0.12)' }}>
            <TrendingUp size={22} color={labaBersih >= 0 ? '#059669' : '#dc2626'} />
          </div>
          <div className="stat-label">Laba Bersih Operasional</div>
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

        {/* Breakdown Pengeluaran */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="h3-card-title">Rincian Alokasi Biaya</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Proporsi pengeluaran perawatan dan operasional</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 6 }}>
                <span style={{ color: '#1e293b', fontWeight: 600 }}>Perawatan Kebun (Pupuk, Gulma, Upah)</span>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>{formatRupiah(totalBiayaPerawatan)}</span>
              </div>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: '#0284c7',
                    width: `${totalPengeluaran > 0 ? (totalBiayaPerawatan / totalPengeluaran) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 6 }}>
                <span style={{ color: '#1e293b', fontWeight: 600 }}>Pengeluaran Lain (Alat, Solar BBM, Lansir)</span>
                <span style={{ fontWeight: 700, color: '#d97706' }}>{formatRupiah(totalPengeluaranLain)}</span>
              </div>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: '#d97706',
                    width: `${totalPengeluaran > 0 ? (totalPengeluaranLain / totalPengeluaran) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: '16px',
                borderRadius: 12,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                Rata-rata Harga Jual TBS Periode Ini:
              </div>
              <div className="num-xl" style={{ color: '#0f172a', marginTop: 4 }}>
                Rp {totalBeratTBS > 0 ? Math.round(totalPendapatan / totalBeratTBS).toLocaleString('id-ID') : 0}{' '}
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>/ Kg TBS</span>
              </div>
            </div>
          </div>
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

        <div className="table-wrapper">
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
      </div>
    </div>
  );
};
