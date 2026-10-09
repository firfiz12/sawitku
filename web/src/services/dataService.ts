import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Kebun,
  Panen,
  Perawatan,
  PengeluaranLain,
  PengingatPanenInfo,
  DashboardStats,
} from '../types';

// ===================== SEED DATA (Preview / Mode Tamu saja) =====================
// Catatan: seed ini HANYA untuk mode tamu (belum login). Akun yang sudah masuk
// memulai dari data kosong miliknya sendiri, jadi tiap akun tidak saling berbagi data.
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
    harga_per_kg: 2650,
    total_pendapatan: 3250 * 2650,
    pembeli: 'PKS PT Sawit Makmur',
    catatan: 'Kualitas buah matang sempurna (BM)',
  },
  {
    id: 'p2-panen-2',
    kebun_id: 'k2-kebun-rawa',
    tanggal: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    berat_kg: 1820,
    jumlah_janjang: 130,
    harga_per_kg: 2650,
    total_pendapatan: 1820 * 2650,
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

// ===================== ARSITEKTUR OFFLINE-FIRST =====================
// Prinsip:
//  1. Local storage adalah SOURCE OF TRUTH (per akun → kunci terpisah per user id).
//  2. Setiap tulis selalu tersimpan lokal dulu, lalu disinkronkan ke Supabase.
//  3. Gagal sinkron (offline/gangguan) → masuk ke antrian "pending sync" dan
//     di-retry otomatis saat koneksi online kembali.
//  4. Saat membaca, data yang masih tertunda disinkron di-merge sehingga tidak
//     tertimpa versi server yang lebih lama.

type LocalTable = 'kebun' | 'panen' | 'perawatan' | 'pengeluaran_lain';

interface PendingOp {
  table: LocalTable;
  kind: 'upsert' | 'delete';
  id: string;
  payload?: Record<string, unknown>;
  at: number;
}

let currentUserId: string | null = null;

/** Panggil saat sesi login/logout berubah supaya storage per-akun terisolasi. */
export function setCurrentUser(userId: string | null): void {
  currentUserId = userId;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

function localKey(table: LocalTable): string {
  return currentUserId ? `sawitku_local_${table}_u_${currentUserId}` : `sawitku_local_${table}`;
}

function pendingKey(): string {
  return currentUserId ? `sawitku_pending_sync_u_${currentUserId}` : 'sawitku_pending_sync';
}

/** Data default: guest memakai seed demo, akun login mulai kosong. */
function defaultData<T>(table: LocalTable): T[] {
  if (currentUserId) return [] as T[];
  switch (table) {
    case 'kebun':
      return DEFAULT_KEBUN as T[];
    case 'panen':
      return DEFAULT_PANEN as T[];
    case 'perawatan':
      return DEFAULT_PERAWATAN as T[];
    case 'pengeluaran_lain':
      return DEFAULT_PENGELUARAN_LAIN as T[];
    default:
      return [] as T[];
  }
}

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

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

// ===================== ANTRIAN SINKRONISASI (Pending Sync) =====================
function readPending(): PendingOp[] {
  try {
    const raw = localStorage.getItem(pendingKey());
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as PendingOp[]) : [];
  } catch {
    return [];
  }
}

function writePending(ops: PendingOp[]): void {
  try {
    localStorage.setItem(pendingKey(), JSON.stringify(ops));
  } catch (err) {
    console.error('Failed to save pending sync queue:', err);
  }
}

/** Operasi terbaru untuk (table, id) menang — operasi sebelumnya diganti. */
function addPending(op: PendingOp): void {
  const ops = readPending().filter((o) => !(o.table === op.table && o.id === op.id));
  ops.push(op);
  writePending(ops);
}

function removePending(table: LocalTable, id: string): void {
  writePending(readPending().filter((o) => !(o.table === table && o.id === id)));
}

function pendingIds(table: LocalTable, kind: PendingOp['kind']): Set<string> {
  return new Set(
    readPending()
      .filter((o) => o.table === table && o.kind === kind)
      .map((o) => o.id)
  );
}

/** Ambil user dari sesi, tetap aman saat offline (memakai id sesi yang tersimpan). */
async function authedUser(): Promise<{ id: string } | null> {
  if (isOffline()) {
    return currentUserId ? { id: currentUserId } : null;
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) currentUserId = user.id;
    return user;
  } catch {
    return currentUserId ? { id: currentUserId } : null;
  }
}

/**
 * Gabungkan data remote dengan data lokal agar perubahan offline tidak hilang:
 *  - item yang masih menunggu edit (pending upsert) memakai versi LOKAL;
 *  - item yang menunggu hapus (pending delete) dibuang dari hasil;
 *  - item lokal yang belum ada di server tetap dipertahankan.
 */
function mergeLocal<T extends { id: string }>(remote: T[], key: string, table: LocalTable): T[] {
  const local = getLocalData<T>(key, [] as T[]);
  const pendingDel = pendingIds(table, 'delete');
  const pendingUp = pendingIds(table, 'upsert');

  const merged: T[] = [];
  const seen = new Set<string>();
  const push = (item: T | undefined | null) => {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  };

  // Versi remote dulu (sumber paling baru), kecuali yang sedang diedit lokal
  remote.forEach((r) => {
    if (!pendingUp.has(r.id)) push(r);
  });
  // Lalu tempel data lokal yang belum tersinkron / sedang diedit
  local
    .filter((l) => !pendingDel.has(l.id))
    .forEach(push);

  return merged;
}

/** Kirim seluruh antrian yang tertunda ke Supabase. Ops yang gagal tetap diantre. */
async function syncPending(): Promise<number> {
  const ops = readPending();
  const remaining: PendingOp[] = [];

  for (const op of ops) {
    try {
      if (op.kind === 'upsert' && op.payload) {
        await supabase.from(op.table).upsert(op.payload);
      } else if (op.kind === 'delete') {
        await supabase
          .from(op.table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', op.id);
      }
    } catch (err) {
      remaining.push(op);
      console.warn(`Pending sync gagal (${op.table}/${op.kind}/${op.id}):`, err);
    }
  }

  writePending(remaining);
  return remaining.length;
}

export interface DatabaseStatus {
  isConfigured: boolean;
  isConnected: boolean;
  userEmail: string | null;
  userId: string | null;
  tables: {
    kebun: boolean;
    panen: boolean;
    perawatan: boolean;
    pengeluaran_lain: boolean;
  };
  latencyMs: number;
  message: string;
}

export const dataService = {
  // ===================== DIAGNOSIS / STATUS CHECK =====================
  async checkDatabaseStatus(): Promise<DatabaseStatus> {
    if (!isSupabaseConfigured) {
      return {
        isConfigured: false,
        isConnected: false,
        userEmail: null,
        userId: null,
        tables: { kebun: false, panen: false, perawatan: false, pengeluaran_lain: false },
        latencyMs: 0,
        message: 'Kredensial Supabase belum dikonfigurasi (Mode Offline Lokal aktif).',
      };
    }

    const start = performance.now();
    try {
      // 1. Cek User Session
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || null;
      const userId = session?.user?.id || null;

      // 2. Cek Akses Tabel
      const [rKebun, rPanen, rPerawatan, rPengeluaran] = await Promise.allSettled([
        supabase.from('kebun').select('id').limit(1),
        supabase.from('panen').select('id').limit(1),
        supabase.from('perawatan').select('id').limit(1),
        supabase.from('pengeluaran_lain').select('id').limit(1),
      ]);

      const end = performance.now();
      const latencyMs = Math.round(end - start);

      const tables = {
        kebun: rKebun.status === 'fulfilled' && !rKebun.value.error,
        panen: rPanen.status === 'fulfilled' && !rPanen.value.error,
        perawatan: rPerawatan.status === 'fulfilled' && !rPerawatan.value.error,
        pengeluaran_lain: rPengeluaran.status === 'fulfilled' && !rPengeluaran.value.error,
      };

      const isConnected = tables.kebun || tables.panen;

      return {
        isConfigured: true,
        isConnected,
        userEmail,
        userId,
        tables,
        latencyMs,
        message: isConnected
          ? `Terhubung ke Supabase Cloud (${latencyMs}ms)${userEmail ? ` sebagai ${userEmail}` : ' • Mode Tamu (Belum Login)'}`
          : 'Gagal menghubungi tabel Supabase. Cek koneksi internet.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        isConfigured: true,
        isConnected: false,
        userEmail: null,
        userId: null,
        tables: { kebun: false, panen: false, perawatan: false, pengeluaran_lain: false },
        latencyMs: 0,
        message: `Koneksi gagal: ${msg}`,
      };
    }
  },

  /**
   * Flush antrian sinkronisasi yang tertunda ke Supabase.
   * Dipanggil otomatis saat aplikasi dimuat dan saat koneksi kembali online.
   */
  async flushPendingSync(): Promise<void> {
    if (!isSupabaseConfigured || !currentUserId) return;
    if (isOffline()) return;
    await syncPending();
  },

  // ===================== KEBUN =====================
  async getKebun(): Promise<Kebun[]> {
    if (isSupabaseConfigured) {
      const user = await authedUser();
      if (user) {
        try {
          const { data, error } = await supabase
            .from('kebun')
            .select('*')
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data)) {
            const mapped: Kebun[] = data.map((row) => {
              let meta: Record<string, unknown> = {};
              try {
                meta = JSON.parse(row.keterangan || '{}');
              } catch {
                meta = {};
              }

              return {
                id: row.id,
                user_id: row.user_id,
                nama: row.nama,
                luas_hektar: Number(row.luas_ha || 0),
                lokasi: (meta.lokasi as string) || (typeof row.keterangan === 'string' && !row.keterangan.startsWith('{') ? row.keterangan : 'Lokasi Kebun'),
                tahun_tanam: Number(meta.tahun_tanam) || 2020,
                jumlah_pohon: Number(row.jumlah_pohon || 0),
                varietas: (meta.varietas as string) || 'Tenera DxP',
                rotasi_panen_hari: Number(row.rotasi_panen_hari || 14),
                adm4_code: (meta.adm4_code as string) || undefined,
                nama_desa: (meta.nama_desa as string) || undefined,
                nama_kecamatan: (meta.nama_kecamatan as string) || undefined,
                nama_kabupaten: (meta.nama_kabupaten as string) || undefined,
                nama_provinsi: (meta.nama_provinsi as string) || undefined,
                created_at: row.created_at,
                updated_at: row.updated_at,
              };
            });
            const merged = mergeLocal<Kebun>(mapped, localKey('kebun'), 'kebun');
            setLocalData(localKey('kebun'), merged);
            return merged;
          }
        } catch (e) {
          console.warn('Supabase fetch kebun fallback to local:', e);
        }
      }
    }
    return getLocalData<Kebun>(localKey('kebun'), defaultData<Kebun>('kebun'));
  },

  async saveKebun(kebun: Omit<Kebun, 'id'> & { id?: string }): Promise<Kebun> {
    const id = kebun.id || crypto.randomUUID();
    const item: Kebun = { ...kebun, id, updated_at: new Date().toISOString() };

    // 1. Simpan lokal dulu (source of truth)
    const current = getLocalData<Kebun>(localKey('kebun'), defaultData<Kebun>('kebun'));
    const index = current.findIndex((k) => k.id === id);
    if (index >= 0) {
      current[index] = item;
    } else {
      current.unshift(item);
    }
    setLocalData(localKey('kebun'), current);

    // 2. Sinkron ke Supabase (atau antre jika offline)
    if (isSupabaseConfigured) {
      const user = await authedUser();
      if (user) {
        const dbRow = {
          id: item.id,
          user_id: user.id,
          nama: item.nama,
          luas_ha: item.luas_hektar,
          jumlah_pohon: item.jumlah_pohon,
          rotasi_panen_hari: item.rotasi_panen_hari,
          keterangan: JSON.stringify({
            lokasi: item.lokasi,
            varietas: item.varietas,
            tahun_tanam: item.tahun_tanam,
            adm4_code: item.adm4_code,
            nama_desa: item.nama_desa,
            nama_kecamatan: item.nama_kecamatan,
            nama_kabupaten: item.nama_kabupaten,
            nama_provinsi: item.nama_provinsi,
          }),
          is_deleted: false,
          updated_at: new Date().toISOString(),
        };
        if (isOffline()) {
          addPending({ table: 'kebun', kind: 'upsert', id, payload: dbRow, at: Date.now() });
          return item;
        }
        try {
          await supabase.from('kebun').upsert(dbRow);
          removePending('kebun', id);
        } catch (err) {
          console.warn('Supabase upsert kebun error (masuk antrian):', err);
          addPending({ table: 'kebun', kind: 'upsert', id, payload: dbRow, at: Date.now() });
        }
      }
    }
    return item;
  },

  async deleteKebun(id: string): Promise<void> {
    const current = getLocalData<Kebun>(localKey('kebun'), defaultData<Kebun>('kebun')).filter((k) => k.id !== id);
    setLocalData(localKey('kebun'), current);

    if (isSupabaseConfigured) {
      const user = await authedUser();
      if (user) {
        if (isOffline()) {
          addPending({ table: 'kebun', kind: 'delete', id, at: Date.now() });
          return;
        }
        try {
          await supabase
            .from('kebun')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', id);
          removePending('kebun', id);
        } catch (err) {
          console.warn('Supabase delete kebun error (masuk antrian):', err);
          addPending({ table: 'kebun', kind: 'delete', id, at: Date.now() });
        }
      }
    }
  },

  // ===================== PANEN =====================
  async getPanen(): Promise<Panen[]> {
    if (isSupabaseConfigured) {
      const user = await authedUser();
      if (user) {
        try {
          const { data, error } = await supabase
            .from('panen')
            .select('*')
            .eq('is_deleted', false)
            .order('tanggal', { ascending: false });

          if (!error && Array.isArray(data)) {
            const mapped: Panen[] = data.map((row) => {
              let meta: Record<string, unknown> = {};
              try {
                meta = JSON.parse(row.keterangan || '{}');
              } catch {
                meta = {};
              }

              return {
                id: row.id,
                user_id: row.user_id,
                kebun_id: row.kebun_id,
                tanggal: typeof row.tanggal === 'string' ? row.tanggal.split('T')[0] : row.tanggal,
                berat_kg: Number(row.berat_kg || 0),
                harga_per_kg: Number(row.harga_per_kg || 0),
                total_pendapatan: Number(row.pendapatan || 0),
                jumlah_janjang: Number(meta.jumlah_janjang || 0),
                pembeli: (meta.pembeli as string) || 'PKS Terdekat',
                catatan: (meta.catatan as string) || (typeof row.keterangan === 'string' && !row.keterangan.startsWith('{') ? row.keterangan : ''),
                created_at: row.created_at,
                updated_at: row.updated_at,
              };
            });
            const merged = mergeLocal<Panen>(mapped, localKey('panen'), 'panen');
            setLocalData(localKey('panen'), merged);
            return merged;
          }
        } catch (e) {
          console.warn('Supabase panen fetch fallback:', e);
        }
      }
    }
    return getLocalData<Panen>(localKey('panen'), defaultData<Panen>('panen'));
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

    const current = getLocalData<Panen>(localKey('panen'), defaultData<Panen>('panen'));
    const index = current.findIndex((p) => p.id === id);
    if (index >= 0) {
      current[index] = item;
    } else {
      current.unshift(item);
    }
    setLocalData(localKey('panen'), current);

    if (isSupabaseConfigured) {
      const user = await authedUser();
      if (user) {
        const dbRow = {
          id: item.id,
          user_id: user.id,
          kebun_id: item.kebun_id,
          tanggal: new Date(item.tanggal).toISOString(),
          berat_kg: item.berat_kg,
          harga_per_kg: item.harga_per_kg,
          pendapatan: item.total_pendapatan,
          keterangan: JSON.stringify({
            jumlah_janjang: item.jumlah_janjang,
            pembeli: item.pembeli,
            catatan: item.catatan,
          }),
          is_deleted: false,
          updated_at: new Date().toISOString(),
        };
        if (isOffline()) {
          addPending({ table: 'panen', kind: 'upsert', id, payload: dbRow, at: Date.now() });
          return item;
        }
        try {
          await supabase.from('panen').upsert(dbRow);
          removePending('panen', id);
        } catch (err) {
          console.warn('Supabase upsert panen error (masuk antrian):', err);
          addPending({ table: 'panen', kind: 'upsert', id, payload: dbRow, at: Date.now() });
        }
      }
    }
    return item;
  },

  async deletePanen(id: string): Promise<void> {
    const current = getLocalData<Panen>(localKey('panen'), defaultData<Panen>('panen')).filter((p) => p.id !== id);
    setLocalData(localKey('panen'), current);

    if (isSupabaseConfigured) {
      const user = await authedUser();
      if (user) {
        if (isOffline()) {
          addPending({ table: 'panen', kind: 'delete', id, at: Date.now() });
          return;
        }
        try {
          await supabase
            .from('panen')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', id);
          removePending('panen', id);
        } catch (err) {
          console.warn('Supabase delete panen error (masuk antrian):', err);
          addPending({ table: 'panen', kind: 'delete', id, at: Date.now() });
        }
      }
    }
  },

  // ===================== PERAWATAN =====================
  async getPerawatan(): Promise<Perawatan[]> {
    if (isSupabaseConfigured) {
      const user = await authedUser();
      if (user) {
        try {
          const { data, error } = await supabase
            .from('perawatan')
            .select('*')
            .eq('is_deleted', false)
            .order('tanggal', { ascending: false });

          if (!error && Array.isArray(data)) {
            const mapped: Perawatan[] = data.map((row) => {
              let meta: Record<string, unknown> = {};
              try {
                meta = JSON.parse(row.deskripsi || '{}');
              } catch {
                meta = {};
              }

              return {
                id: row.id,
                user_id: row.user_id,
                kebun_id: row.kebun_id,
                tanggal: typeof row.tanggal === 'string' ? row.tanggal.split('T')[0] : row.tanggal,
                jenis_perawatan: row.jenis || 'Perawatan',
                nama_bahan: (meta.nama_bahan as string) || row.jenis_pupuk || row.jenis_racun || '',
                dosis: (meta.dosis as string) || '',
                biaya_tenaga_kerja: Number(meta.biaya_tenaga_kerja || 0),
                biaya_bahan: Number(meta.biaya_bahan || 0),
                total_biaya: Number(row.biaya || 0),
                catatan: (meta.catatan as string) || (typeof row.deskripsi === 'string' && !row.deskripsi.startsWith('{') ? row.deskripsi : ''),
                created_at: row.created_at,
                updated_at: row.updated_at,
              };
            });
            const merged = mergeLocal<Perawatan>(mapped, localKey('perawatan'), 'perawatan');
            setLocalData(localKey('perawatan'), merged);
            return merged;
          }
        } catch (e) {
          console.warn('Supabase perawatan fallback:', e);
        }
      }
    }
    return getLocalData<Perawatan>(localKey('perawatan'), defaultData<Perawatan>('perawatan'));
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

    const current = getLocalData<Perawatan>(localKey('perawatan'), defaultData<Perawatan>('perawatan'));
    const index = current.findIndex((p) => p.id === id);
    if (index >= 0) {
      current[index] = item;
    } else {
      current.unshift(item);
    }
    setLocalData(localKey('perawatan'), current);

    if (isSupabaseConfigured) {
      const user = await authedUser();
      if (user) {
        const dbRow = {
          id: item.id,
          user_id: user.id,
          kebun_id: item.kebun_id,
          tanggal: new Date(item.tanggal).toISOString(),
          jenis: item.jenis_perawatan,
          biaya: item.total_biaya,
          deskripsi: JSON.stringify({
            nama_bahan: item.nama_bahan,
            dosis: item.dosis,
            catatan: item.catatan,
            biaya_tenaga_kerja: item.biaya_tenaga_kerja,
            biaya_bahan: item.biaya_bahan,
          }),
          is_deleted: false,
          updated_at: new Date().toISOString(),
        };
        if (isOffline()) {
          addPending({ table: 'perawatan', kind: 'upsert', id, payload: dbRow, at: Date.now() });
          return item;
        }
        try {
          await supabase.from('perawatan').upsert(dbRow);
          removePending('perawatan', id);
        } catch (err) {
          console.warn('Supabase upsert perawatan error (masuk antrian):', err);
          addPending({ table: 'perawatan', kind: 'upsert', id, payload: dbRow, at: Date.now() });
        }
      }
    }
    return item;
  },

  async deletePerawatan(id: string): Promise<void> {
    const current = getLocalData<Perawatan>(localKey('perawatan'), defaultData<Perawatan>('perawatan')).filter((p) => p.id !== id);
    setLocalData(localKey('perawatan'), current);

    if (isSupabaseConfigured) {
      const user = await authedUser();
      if (user) {
        if (isOffline()) {
          addPending({ table: 'perawatan', kind: 'delete', id, at: Date.now() });
          return;
        }
        try {
          await supabase
            .from('perawatan')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', id);
          removePending('perawatan', id);
        } catch (err) {
          console.warn('Supabase delete perawatan error (masuk antrian):', err);
          addPending({ table: 'perawatan', kind: 'delete', id, at: Date.now() });
        }
      }
    }
  },

  // ===================== PENGELUARAN LAIN =====================
  async getPengeluaranLain(): Promise<PengeluaranLain[]> {
    if (isSupabaseConfigured) {
      const user = await authedUser();
      if (user) {
        try {
          const { data, error } = await supabase
            .from('pengeluaran_lain')
            .select('*')
            .eq('is_deleted', false)
            .order('tanggal', { ascending: false });

          if (!error && Array.isArray(data)) {
            const mapped: PengeluaranLain[] = data.map((row) => ({
              id: row.id,
              user_id: row.user_id,
              kebun_id: row.kebun_id,
              tanggal: typeof row.tanggal === 'string' ? row.tanggal.split('T')[0] : row.tanggal,
              kategori: row.kategori || 'Operasional',
              jumlah: Number(row.jumlah || 0),
              keterangan: row.deskripsi || '',
              created_at: row.created_at,
              updated_at: row.updated_at,
            }));
            const merged = mergeLocal<PengeluaranLain>(mapped, localKey('pengeluaran_lain'), 'pengeluaran_lain');
            setLocalData(localKey('pengeluaran_lain'), merged);
            return merged;
          }
        } catch (e) {
          console.warn('Supabase pengeluaran_lain fallback:', e);
        }
      }
    }
    return getLocalData<PengeluaranLain>(localKey('pengeluaran_lain'), defaultData<PengeluaranLain>('pengeluaran_lain'));
  },

  async savePengeluaranLain(item: Omit<PengeluaranLain, 'id'> & { id?: string }): Promise<PengeluaranLain> {
    const id = item.id || crypto.randomUUID();
    const entry: PengeluaranLain = {
      ...item,
      id,
      updated_at: new Date().toISOString(),
    };

    const current = getLocalData<PengeluaranLain>(localKey('pengeluaran_lain'), defaultData<PengeluaranLain>('pengeluaran_lain'));
    const index = current.findIndex((b) => b.id === id);
    if (index >= 0) {
      current[index] = entry;
    } else {
      current.unshift(entry);
    }
    setLocalData(localKey('pengeluaran_lain'), current);

    if (isSupabaseConfigured) {
      const user = await authedUser();
      if (user) {
        const dbRow = {
          id: entry.id,
          user_id: user.id,
          kebun_id: entry.kebun_id || null,
          tanggal: new Date(entry.tanggal).toISOString(),
          kategori: entry.kategori,
          jumlah: entry.jumlah,
          deskripsi: entry.keterangan || '',
          is_deleted: false,
          updated_at: new Date().toISOString(),
        };
        if (isOffline()) {
          addPending({ table: 'pengeluaran_lain', kind: 'upsert', id, payload: dbRow, at: Date.now() });
          return entry;
        }
        try {
          await supabase.from('pengeluaran_lain').upsert(dbRow);
          removePending('pengeluaran_lain', id);
        } catch (err) {
          console.warn('Supabase upsert pengeluaran_lain error (masuk antrian):', err);
          addPending({ table: 'pengeluaran_lain', kind: 'upsert', id, payload: dbRow, at: Date.now() });
        }
      }
    }
    return entry;
  },

  async deletePengeluaranLain(id: string): Promise<void> {
    const current = getLocalData<PengeluaranLain>(localKey('pengeluaran_lain'), defaultData<PengeluaranLain>('pengeluaran_lain')).filter((b) => b.id !== id);
    setLocalData(localKey('pengeluaran_lain'), current);

    if (isSupabaseConfigured) {
      const user = await authedUser();
      if (user) {
        if (isOffline()) {
          addPending({ table: 'pengeluaran_lain', kind: 'delete', id, at: Date.now() });
          return;
        }
        try {
          await supabase
            .from('pengeluaran_lain')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', id);
          removePending('pengeluaran_lain', id);
        } catch (err) {
          console.warn('Supabase delete pengeluaran_lain error (masuk antrian):', err);
          addPending({ table: 'pengeluaran_lain', kind: 'delete', id, at: Date.now() });
        }
      }
    }
  },

  // ===================== PENGINGAT ROTASI PANEN =====================
  calculatePengingatPanen(kebunList: Kebun[], panenList: Panen[]): PengingatPanenInfo[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return kebunList.map((kebun) => {
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
    pengeluaranLainList: PengeluaranLain[],
    yearMonth?: string // YYYY-MM; kosong = bulan berjalan
  ): DashboardStats {
    const isSelectedMonth = (dateStr: string) => {
      if (!dateStr) return false;
      // Filter bulan eksplisit (dipilih di dashboard) menang;
      // kalau kosong, hitung bulan berjalan seperti dulu.
      if (yearMonth) return dateStr.startsWith(yearMonth);
      const d = new Date(dateStr);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    const totalKebun = kebunList.length;
    const totalLuasHa = kebunList.reduce((acc, k) => acc + (Number(k.luas_hektar) || 0), 0);

    const panenBulanIni = panenList.filter((p) => isSelectedMonth(p.tanggal));
    const totalProduksiBulanIniKg = panenBulanIni.reduce((acc, p) => acc + (Number(p.berat_kg) || 0), 0);
    const totalPendapatanBulanIni = panenBulanIni.reduce((acc, p) => acc + (Number(p.total_pendapatan) || 0), 0);

    const perawatanBulanIni = perawatanList.filter((p) => isSelectedMonth(p.tanggal));
    const biayaPerawatanBulanIni = perawatanBulanIni.reduce((acc, p) => acc + (Number(p.total_biaya) || 0), 0);

    const pengeluaranLainBulanIni = pengeluaranLainList.filter((p) => isSelectedMonth(p.tanggal));
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