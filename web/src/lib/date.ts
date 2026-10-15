/** Tanggal hari ini (YYYY-MM-DD) berdasarkan waktu lokal perangkat. */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Tahun berjalan berdasarkan waktu lokal perangkat. */
export function currentYear(): string {
  return String(new Date().getFullYear());
}

/** Bulan berjalan (YYYY-MM) berdasarkan waktu lokal perangkat. */
export function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

