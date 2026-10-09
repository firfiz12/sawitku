import React from 'react';
import { CalendarDays, X } from 'lucide-react';

interface MonthFilterProps {
  value: string; // YYYY-MM, kosong = semua bulan
  onChange: (yearMonth: string) => void;
  id?: string;
  showConvenience?: boolean; // tampilkan tombol "Bulan Ini" / "Semua"
}

/**
 * Filter bulan yang seragam untuk tabel, laporan, dan analitik.
 * Menggunakan native <input type="month"> + tombol bantuan cepat.
 */
export const MonthFilter: React.FC<MonthFilterProps> = ({
  value,
  onChange,
  id,
  showConvenience = true,
}) => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <CalendarDays size={16} color="#64748b" />
        <input
          id={id}
          type="month"
          className="form-input filter-control"
          style={{ width: 'auto', minWidth: 160 }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          title="Filter Bulan (kosong = semua)"
        />
      </div>

      {showConvenience && (
        value ? (
          <button
            className="btn btn-secondary filter-control"
            style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            onClick={() => onChange('')}
            title="Tampilkan semua bulan"
            type="button"
          >
            <X size={14} />
            <span>Semua</span>
          </button>
        ) : (
          <button
            className="btn btn-secondary filter-control"
            style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            onClick={() => onChange(currentMonth)}
            title="Pilih bulan berjalan"
            type="button"
          >
            <CalendarDays size={14} />
            <span>Bulan Ini</span>
          </button>
        )
      )}
    </div>
  );
};