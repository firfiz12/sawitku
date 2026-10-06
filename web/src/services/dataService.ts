import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Kebun,
  Panen,
  Perawatan,
  PengeluaranLain,
  PengingatPanenInfo,
  DashboardStats,
} from '../types';

const STORAGE_KEYS = {
  KEBUN: 'sawitku_local_kebun',
  PANEN: 'sawitku_local_panen',
  PERAWATAN: 'sawitku_local_perawatan',
  PENGELUARAN_LAIN: 'sawitku_local_pengeluaran_lain',
};

// Seed data awal untuk preview interaktif jika belum ada data di database
const DEFAULT_KEBUN: Kebun[] = [
  {
    id: 'k1-kebun-utama',
    nama: 'Kebun Blok A - Bukit Sawit',
    luas_hektar: 4.5,
    lokasi: 'Riau, Kampar',
    tahun_tanam: 2018,
    jumlah_pohon: 630,
    varietas: 'Marihat DxP',
    rotasi_panen_hari: 14,
  },
  {
    id: 'k2-kebun-rawa',
    nama: 'Kebun Blok B - Lembah Hijau',
    luas_hektar: 2.8,
    lokasi: 'Riau, Siak',
    tahun_tanam: 2020,
    jumlah_pohon: 390,
    varietas: 'Dami Mas',
    rotasi_panen_hari: 12,
  },
];

const DEFAULT_PANEN: Panen[] = [
  {
    id: 'p1-panen-1',
    kebun_id: 'k1-kebun-utama',
    tanggal: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    berat_kg: 3250,
    jumlah_janjang: 215,
    harga_per_kg: 2450,
    total_pendapatan: 3250 * 2450,
    pembeli: 'PKS PT Sawit Makmur',
    catatan: 'Kualitas buah matang sempurna (BM)',
  },
  {
    id: 'p2-panen-2',
    kebun_id: 'k2-kebun-rawa',
    tanggal: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    berat_kg: 1820,
    jumlah_janjang: 130,
    harga_per_kg: 2450,
    total_pendapatan: 1820 * 2450,
    pembeli: 'UD Tani Sejahtera',
    catatan: 'Panen rotasi ke-8',
  },
];

const DEFAULT_PERAWATAN: Perawatan[] = [
  {
    id: 'pw1-perawatan-1',
    kebun_id: 'k1-kebun-utama',
    tanggal: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
    jenis_perawatan: 'Pemupukan',
    nama_bahan: 'NPK 13-6-27',
    dosis: '2 kg / pohon',
    biaya_tenaga_kerja: 650000,
    biaya_bahan: 1450000,
    total_biaya: 2100000,
    catatan: 'Aplikasi piringan bersih',
  },
  {
    id: 'pw2-perawatan-2',
    kebun_id: 'k2-kebun-rawa',
    tanggal: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    jenis_perawatan: 'Semprot Gulma',
    nama_bahan: 'Glifosat 480 SL',
    dosis: '1.5 liter / ha',
    biaya_tenaga_kerja: 350000,
    biaya_bahan: 280000,
    total_biaya: 630000,
    catatan: 'Fokus gulma berkayu dan lalang',
  },
];

const DEFAULT_PENGELUARAN_LAIN: PengeluaranLain[] = [
  {
    id: 'pl1-pengeluaran-1',
    kategori: 'Alat & Mesin',
    tanggal: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
    jumlah: 350000,
    keterangan: 'Beli egrek baja super dan batu asah',
  },
  {
    id: 'pl2-pengeluaran-2',
    kategori: 'Transportasi & BBM',
    tanggal: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    jumlah: 220000,
    keterangan: 'BBM solar lansir TBS ke jalan poros',
  },
];

function getLocalData<T>(key: string, defaultData: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function setLocalData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export const dataService = {
  // ===================== KEBUN =====================
  async getKebun(): Promise<Kebun[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('kebun').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setLocalData(STORAGE_KEYS.KEBUN, data);
          return data;
        }
      } catch (e) {
        console.warn('Supabase fetch failed, falling back to local:', e);
      }
    }
    return getLocalData<Kebun>(STORAGE_KEYS.KEBUN, DEFAULT_KEBUN);
  },

  async saveKebun(kebun: Omit<Kebun, 'id'> & { id?: string }): Promise<Kebun> {
    const id = kebun.id || crypto.randomUUID();
    const item: Kebun = { ...kebun, id, updated_at: new Date().toISOString() };

    // Update local cache
    const current = getLocalData<Kebun>(STORAGE_KEYS.KEBUN, DEFAULT_KEBUN);
    const index = current.findIndex((k) => k.id === id);
    if (index >= 0) {
      current[index] = item;
    } else {
      current.unshift(item);
    }
    setLocalData(STORAGE_KEYS.KEBUN, current);

    // Sync to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('kebun').upsert(item);
      } catch (err) {
        console.error('Supabase upsert kebun error:', err);
      }
    }
    return item;
  },

  async deleteKebun(id: string): Promise<void> {
    const current = getLocalData<Kebun>(STORAGE_KEYS.KEBUN, DEFAULT_KEBUN).filter((k) => k.id !== id);
    setLocalData(STORAGE_KEYS.KEBUN, current);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('kebun').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete kebun error:', err);
      }
    }
  },

  // ===================== PANEN =====================
  async getPanen(): Promise<Panen[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('panen').select('*').order('tanggal', { ascending: false });
        if (!error && data) {
          setLocalData(STORAGE_KEYS.PANEN, data);
          return data;
        }
      } catch (e) {
        console.warn('Supabase panen fetch failed:', e);
      }
    }
    return getLocalData<Panen>(STORAGE_KEYS.PANEN, DEFAULT_PANEN);
  },

  async savePanen(panen: Omit<Panen, 'id'> & { id?: string }): Promise<Panen> {
    const id = panen.id || crypto.randomUUID();
    const total_pendapatan = Number(panen.berat_kg) * Number(panen.harga_per_kg);
    const item: Panen = {
      ...panen,
      id,
      total_pendapatan,
      updated_at: new Date().toISOString(),
    };

    const current = getLocalData<Panen>(STORAGE_KEYS.PANEN, DEFAULT_PANEN);
    const index = current.findIndex((p) => p.id === id);
    if (index >= 0) {
      current[index] = item;
    } else {
      current.unshift(item);
    }
    setLocalData(STORAGE_KEYS.PANEN, current);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('panen').upsert(item);
      } catch (err) {
        console.error('Supabase upsert panen error:', err);
      }
    }
    return item;
  },

  async deletePanen(id: string): Promise<void> {
    const current = getLocalData<Panen>(STORAGE_KEYS.PANEN, DEFAULT_PANEN).filter((p) => p.id !== id);
    setLocalData(STORAGE_KEYS.PANEN, current);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('panen').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete panen error:', err);
      }
    }
  },

  // ===================== PERAWATAN =====================
  async getPerawatan(): Promise<Perawatan[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('perawatan').select('*').order('tanggal', { ascending: false });
        if (!error && data) {
          setLocalData(STORAGE_KEYS.PERAWATAN, data);
          return data;
        }
      } catch (e) {
        console.warn('Supabase perawatan fetch failed:', e);
      }
    }
    return getLocalData<Perawatan>(STORAGE_KEYS.PERAWATAN, DEFAULT_PERAWATAN);
  },

  async savePerawatan(perawatan: Omit<Perawatan, 'id'> & { id?: string }): Promise<Perawatan> {
    const id = perawatan.id || crypto.randomUUID();
    const total_biaya = Number(perawatan.biaya_tenaga_kerja || 0) + Number(perawatan.biaya_bahan || 0);
    const item: Perawatan = {
      ...perawatan,
      id,
      total_biaya,
      updated_at: new Date().toISOString(),
    };

    const current = getLocalData<Perawatan>(STORAGE_KEYS.PERAWATAN, DEFAULT_PERAWATAN);
    const index = current.findIndex((p) => p.id === id);
    if (index >= 0) {
      current[index] = item;
    } else {
      current.unshift(item);
    }
    setLocalData(STORAGE_KEYS.PERAWATAN, current);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('perawatan').upsert(item);
      } catch (err) {
        console.error('Supabase upsert perawatan error:', err);
      }
    }
    return item;
  },

  async deletePerawatan(id: string): Promise<void> {
    const current = getLocalData<Perawatan>(STORAGE_KEYS.PERAWATAN, DEFAULT_PERAWATAN).filter((p) => p.id !== id);
    setLocalData(STORAGE_KEYS.PERAWATAN, current);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('perawatan').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete perawatan error:', err);
      }
    }
  },

  // ===================== PENGELUARAN LAIN (Tabel biaya) =====================
  async getPengeluaranLain(): Promise<PengeluaranLain[]> {
    if (isSupabaseConfigured) {
      try {
        // Coba baca dari tabel 'pengeluaran_lain', jika tabel belum di-rename coba 'biaya'
        const { data, error } = await supabase.from('pengeluaran_lain').select('*').order('tanggal', { ascending: false });
        if (!error && data) {
          setLocalData(STORAGE_KEYS.PENGELUARAN_LAIN, data);
          return data;
        } else if (error) {
          // Fallback coba tabel 'biaya' jika schema belum di-migrate
          const fallback = await supabase.from('biaya').select('*').order('tanggal', { ascending: false });
          if (!fallback.error && fallback.data) {
            setLocalData(STORAGE_KEYS.PENGELUARAN_LAIN, fallback.data);
            return fallback.data;
          }
        }
      } catch (e) {
        console.warn('Supabase pengeluaran_lain fetch failed:', e);
      }
    }
    return getLocalData<PengeluaranLain>(STORAGE_KEYS.PENGELUARAN_LAIN, DEFAULT_PENGELUARAN_LAIN);
  },

  async savePengeluaranLain(item: Omit<PengeluaranLain, 'id'> & { id?: string }): Promise<PengeluaranLain> {
    const id = item.id || crypto.randomUUID();
    const entry: PengeluaranLain = {
      ...item,
      id,
      updated_at: new Date().toISOString(),
    };

    const current = getLocalData<PengeluaranLain>(STORAGE_KEYS.PENGELUARAN_LAIN, DEFAULT_PENGELUARAN_LAIN);
    const index = current.findIndex((b) => b.id === id);
    if (index >= 0) {
      current[index] = entry;
    } else {
      current.unshift(entry);
    }
    setLocalData(STORAGE_KEYS.PENGELUARAN_LAIN, current);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('pengeluaran_lain').upsert(entry);
        if (error) {
          await supabase.from('biaya').upsert(entry);
        }
      } catch (err) {
        console.error('Supabase upsert pengeluaran_lain error:', err);
      }
    }
    return entry;
  },

  async deletePengeluaranLain(id: string): Promise<void> {
    const current = getLocalData<PengeluaranLain>(STORAGE_KEYS.PENGELUARAN_LAIN, DEFAULT_PENGELUARAN_LAIN).filter((b) => b.id !== id);
    setLocalData(STORAGE_KEYS.PENGELUARAN_LAIN, current);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('pengeluaran_lain').delete().eq('id', id);
        if (error) {
          await supabase.from('biaya').delete().eq('id', id);
        }
      } catch (err) {
        console.error('Supabase delete pengeluaran_lain error:', err);
      }
    }
  },

  // ===================== PENGINGAT ROTASI PANEN =====================
  calculatePengingatPanen(kebunList: Kebun[], panenList: Panen[]): PengingatPanenInfo[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return kebunList.map((kebun) => {
      // Ambil panen terakhir untuk kebun ini
      const kebunPanen = panenList
        .filter((p) => p.kebun_id === kebun.id)
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

      const lastHarvestDateStr = kebunPanen.length > 0 ? kebunPanen[0].tanggal : null;
      let nextHarvestDate: Date;

      if (lastHarvestDateStr) {
        const lastDate = new Date(lastHarvestDateStr);
        nextHarvestDate = new Date(lastDate);
        nextHarvestDate.setDate(lastDate.getDate() + (kebun.rotasi_panen_hari || 14));
      } else {
        // Belum pernah panen, jadwalkan hari ini
        nextHarvestDate = new Date(today);
      }

      const diffTime = nextHarvestDate.getTime() - today.getTime();
      const hariTersisa = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status: 'LEWAT_JADWAL' | 'HARI_INI' | 'SEGERA' | 'AMAN';
      if (hariTersisa < 0) {
        status = 'LEWAT_JADWAL';
      } else if (hariTersisa === 0) {
        status = 'HARI_INI';
      } else if (hariTersisa <= 2) {
        status = 'SEGERA';
      } else {
        status = 'AMAN';
      }

      return {
        kebunId: kebun.id,
        namaKebun: kebun.nama,
        rotasiHari: kebun.rotasi_panen_hari || 14,
        terakhirPanen: lastHarvestDateStr,
        panenBerikutnya: nextHarvestDate.toISOString().split('T')[0],
        hariTersisa,
        status,
      };
    });
  },

  // ===================== STATISTIK DASHBOARD =====================
  calculateStats(
    kebunList: Kebun[],
    panenList: Panen[],
    perawatanList: Perawatan[],
    pengeluaranLainList: PengeluaranLain[]
  ): DashboardStats {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isThisMonth = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    const totalKebun = kebunList.length;
    const totalLuasHa = kebunList.reduce((acc, k) => acc + (Number(k.luas_hektar) || 0), 0);

    const panenBulanIni = panenList.filter((p) => isThisMonth(p.tanggal));
    const totalProduksiBulanIniKg = panenBulanIni.reduce((acc, p) => acc + (Number(p.berat_kg) || 0), 0);
    const totalPendapatanBulanIni = panenBulanIni.reduce((acc, p) => acc + (Number(p.total_pendapatan) || 0), 0);

    const perawatanBulanIni = perawatanList.filter((p) => isThisMonth(p.tanggal));
    const biayaPerawatanBulanIni = perawatanBulanIni.reduce((acc, p) => acc + (Number(p.total_biaya) || 0), 0);

    const pengeluaranLainBulanIni = pengeluaranLainList.filter((p) => isThisMonth(p.tanggal));
    const biayaLainBulanIni = pengeluaranLainBulanIni.reduce((acc, p) => acc + (Number(p.jumlah) || 0), 0);

    const totalPengeluaranBulanIni = biayaPerawatanBulanIni + biayaLainBulanIni;
    const labaBersihBulanIni = totalPendapatanBulanIni - totalPengeluaranBulanIni;

    return {
      totalKebun,
      totalLuasHa,
      totalProduksiBulanIniKg,
      totalPendapatanBulanIni,
      totalPengeluaranBulanIni,
      labaBersihBulanIni,
    };
  },
};
