export interface WilayahItem {
  k: string;
  n: string;
}

interface WilayahData {
  v: number;
  generated: string;
  count: number;
  summary: { provinsi: number; kabupaten: number; kecamatan: number; desa: number };
  p: WilayahItem[]; // provinsi
  kab: Record<string, WilayahItem[]>; // kunci: kode provinsi
  kec: Record<string, WilayahItem[]>; // kunci: kode kabupaten
  desa: Record<string, WilayahItem[]>; // kunci: kode kecamatan
}

let cached: WilayahData | null = null;
let loading: Promise<WilayahData> | null = null;
let lastError: string | null = null;

export function getWilayah(): Promise<WilayahData> {
  if (cached) return Promise.resolve(cached);
  if (!loading) {
    loading = fetch('/data/wilayah.json', { cache: 'force-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Gagal memuat data wilayah (HTTP ${res.status})`);
        return res.json();
      })
      .then((data) => {
        cached = data as WilayahData;
        return cached;
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

export function getWilayahError(): string | null {
  return lastError;
}

export async function getProvinsi(): Promise<WilayahItem[]> {
  try {
    const d = await getWilayah();
    lastError = null;
    return d.p || [];
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
    return [];
  }
}

export async function getKabupaten(provCode: string): Promise<WilayahItem[]> {
  try {
    const d = await getWilayah();
    lastError = null;
    return d.kab?.[provCode] || [];
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
    return [];
  }
}

export async function getKecamatan(kabCode: string): Promise<WilayahItem[]> {
  try {
    const d = await getWilayah();
    lastError = null;
    return d.kec?.[kabCode] || [];
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
    return [];
  }
}

export async function getDesa(kecCode: string): Promise<WilayahItem[]> {
  try {
    const d = await getWilayah();
    lastError = null;
    return d.desa?.[kecCode] || [];
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
    return [];
  }
}