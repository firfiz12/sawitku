import type { Kebun } from '../types';

// ===================== TIPE =====================
export type CuacaIcon =
  | 'cerah'
  | 'cerah-berawan'
  | 'berawan'
  | 'berawan-tebal'
  | 'kabut'
  | 'hujan-ringan'
  | 'hujan'
  | 'hujan-lebat'
  | 'badai';

export interface CuacaSlot {
  datetime: string;
  tanggal: string;
  jam: string;
  suhu: number;
  kelembapan: number;
  deskripsi: string;
  anginMps: number;
  arahAngin: string;
  hujan: number; // 0-100 (tekstur hujan / probabilitas)
  icon: CuacaIcon;
}

export interface CuacaHarian {
  tanggal: string;
  label: string;
  suhuMin: number;
  suhuMax: number;
  hujanMax: number;
  icon: CuacaIcon;
}

export interface CuacaKebun {
  adm4: string;
  lokasi: string;
  terkini: CuacaSlot;
  harian: CuacaHarian[];
  diambilPada: number;
}

interface BmkgSlot {
  local_datetime?: string;
  t?: number | string;
  hu?: number | string;
  weather_desc?: string;
  ws?: number | string;
  wd?: string;
  tp?: number | string;
}

interface BmkgLokasi {
  provinsi?: string;
  kotkab?: string;
  kecamatan?: string;
  desa?: string;
}

type BmkgCuacaGrup = BmkgSlot[] | { value?: BmkgSlot[]; Count?: number };

interface BmkgDay {
  lokasi?: BmkgLokasi;
  cuaca?: BmkgCuacaGrup[];
}

interface BmkgResponse {
  success?: boolean;
  data?: BmkgDay[];
}

// BMKG kadang mengembalikan bentuk yang berbeda-beda; tangani semuanya.
function flattenSlots(d: BmkgDay): CuacaSlot[] {
  const groups = Array.isArray(d.cuaca) ? d.cuaca : [];
  const out: CuacaSlot[] = [];
  for (const g of groups) {
    if (Array.isArray(g)) {
      out.push(...g.map(mapSlot));
    } else if (g && Array.isArray(g.value)) {
      out.push(...g.value.map(mapSlot));
    } else if (g && typeof g === 'object') {
      out.push(mapSlot(g as BmkgSlot));
    }
  }
  return out;
}

// ===================== PARSE & LOGIKA =====================
const SEVERITY: Record<CuacaIcon, number> = {
  cerah: 0,
  'cerah-berawan': 1,
  berawan: 2,
  'berawan-tebal': 3,
  kabut: 4,
  'hujan-ringan': 5,
  hujan: 6,
  'hujan-lebat': 7,
  badai: 8,
};

function resolveIcon(desc: string): CuacaIcon {
  const d = desc.toLowerCase();
  if (d.includes('badai') || d.includes('petir') || d.includes('guntur')) return 'badai';
  if (d.includes('kabut')) return 'kabut';
  if (d.includes('hujan lebat') || d.includes('hujan deras')) return 'hujan-lebat';
  if (d.includes('hujan') || d.includes('gerimis')) {
    return d.includes('ringan') || d.includes('gerimis') ? 'hujan-ringan' : 'hujan';
  }
  if (d.includes('berawan tebal')) return 'berawan-tebal';
  if (d.includes('berawan')) return 'berawan';
  if (d.includes('cerah')) return d.includes('berawan') ? 'cerah-berawan' : 'cerah';
  return 'cerah-berawan';
}

function mapSlot(s: BmkgSlot): CuacaSlot {
  const datetimeRaw = (s.local_datetime || '').replace(' ', 'T');
  const tanggal = datetimeRaw.slice(0, 10);
  const jam = datetimeRaw.slice(11, 16);
  const deskripsi = s.weather_desc || 'Cerah Berawan';
  return {
    datetime: datetimeRaw,
    tanggal,
    jam,
    suhu: Math.round(Number(s.t) || 0),
    kelembapan: Math.round(Number(s.hu) || 0),
    deskripsi,
    anginMps: Number(s.ws) || 0,
    arahAngin: arahAnginId(s.wd || ''),
    hujan: Math.round(Number(s.tp) || 0),
    icon: resolveIcon(deskripsi),
  };
}

const ARAH_ANGIN_ID: Record<string, string> = {
  N: 'U', NNE: 'UUT', NE: 'TL', ENE: 'TTL', E: 'T', ESE: 'TTG', SE: 'TG',
  SSE: 'STG', S: 'S', SSW: 'SSB', SW: 'BD', WSW: 'BBD', W: 'B', WNW: 'BBL',
  NW: 'BL', NNW: 'UBL',
};

function arahAnginId(code: string): string {
  return ARAH_ANGIN_ID[code] || code;
}

function dayLabel(tanggal: string): string {
  const d = new Date(`${tanggal}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diff === 0) return 'Hari Ini';
  if (diff === 1) return 'Besok';
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
}

function dayIcon(slots: CuacaSlot[]): CuacaIcon {
  return slots.reduce((worst, s) => (SEVERITY[s.icon] > SEVERITY[worst] ? s.icon : worst), 'cerah' as CuacaIcon);
}

function groupByDay(slots: CuacaSlot[]): CuacaHarian[] {
  const map = new Map<string, CuacaSlot[]>();
  for (const s of slots) {
    const arr = map.get(s.tanggal) || [];
    arr.push(s);
    map.set(s.tanggal, arr);
  }
  return [...map.entries()]
    .slice(0, 3)
    .map(([tanggal, list]) => ({
      tanggal,
      label: dayLabel(tanggal),
      suhuMin: Math.min(...list.map((x) => x.suhu)),
      suhuMax: Math.max(...list.map((x) => x.suhu)),
      hujanMax: Math.max(...list.map((x) => x.hujan)),
      icon: dayIcon(list),
    }));
}

function pickTerkini(slots: CuacaSlot[]): CuacaSlot {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const todaySlots = slots.filter((s) => s.tanggal === todayKey);
  if (todaySlots.length === 0) return slots[0];
  const nowMs = now.getTime();
  return todaySlots.reduce((best, s) => {
    const diff = Math.abs(new Date(s.datetime).getTime() - nowMs);
    const bestDiff = Math.abs(new Date(best.datetime).getTime() - nowMs);
    return diff < bestDiff ? s : best;
  });
}

function lokasiLabel(kebun: Kebun): string {
  const parts = [kebun.nama_desa, kebun.nama_kecamatan, kebun.nama_kabupaten].filter(Boolean);
  return parts.join(', ') || kebun.lokasi || '(lokasi kebun)';
}

// ===================== CACHE & FETCH =====================
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 jam
const inFlight = new Map<string, Promise<CuacaKebun>>();

function cacheKey(adm4: string): string {
  return `sawitku_cuaca_${adm4}`;
}

function readCache(adm4: string): CuacaKebun | null {
  try {
    const raw = localStorage.getItem(cacheKey(adm4));
    if (!raw) return null;
    return JSON.parse(raw) as CuacaKebun;
  } catch {
    return null;
  }
}

function writeCache(adm4: string, data: CuacaKebun): void {
  try {
    localStorage.setItem(cacheKey(adm4), JSON.stringify(data));
  } catch {
    // penyimpanan penuh / diabaikan
  }
}

async function fetchWeather(adm4: string, stale: CuacaKebun | null, kebun: Kebun): Promise<CuacaKebun> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (stale) return stale;
    throw new Error('Offline — belum ada cuaca tersimpan untuk lokasi ini');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const params = new URLSearchParams({ adm4 });
    const res = await fetch(`https://api.bmkg.go.id/publik/prakiraan-cuaca?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('BMKG belum mencakup wilayah ini, coba pilih desa/kelurahan lain');
      }
      throw new Error(`BMKG menolak permintaan (HTTP ${res.status})`);
    }
    const json = (await res.json()) as BmkgResponse;
    const days = Array.isArray(json.data) ? json.data : [];
    const slots = days.flatMap(flattenSlots);
    if (slots.length === 0) throw new Error('BMKG tidak mengembalikan data cuaca untuk wilayah ini');

    const lok = days.find((d) => d.lokasi)?.lokasi;
    const lokasi = lok
      ? [lok.desa, lok.kecamatan, lok.kotkab, lok.provinsi].filter(Boolean).join(', ')
      : lokasiLabel(kebun);

    return {
      adm4,
      lokasi,
      terkini: pickTerkini(slots),
      harian: groupByDay(slots),
      diambilPada: Date.now(),
    };
  } catch (err) {
    if (stale) return stale;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Ambil cuaca untuk kebun. Gunakan cache 3 jam; jika gagal, fallback ke data lama. */
export function getKebunWeather(kebun: Kebun): Promise<CuacaKebun> {
  const adm4 = kebun.adm4_code || '';
  if (!adm4) return Promise.reject(new Error('Kode wilayah belum diatur'));

  const cached = readCache(adm4);
  if (cached && Date.now() - cached.diambilPada < CACHE_TTL_MS) {
    return Promise.resolve(cached);
  }
  if (inFlight.has(adm4)) return inFlight.get(adm4) as Promise<CuacaKebun>;

  const task = fetchWeather(adm4, cached, kebun)
    .then((d) => {
      writeCache(adm4, d);
      return d;
    })
    .finally(() => {
      inFlight.delete(adm4);
    });
  inFlight.set(adm4, task);
  return task;
}

export { lokasiLabel };