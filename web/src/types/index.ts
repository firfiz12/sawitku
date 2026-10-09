export interface Kebun {
  id: string;
  user_id?: string;
  nama: string;
  luas_hektar: number;
  lokasi: string;
  tahun_tanam: number;
  jumlah_pohon: number;
  varietas: string;
  rotasi_panen_hari: number;
  // Lokasi cuaca (adm4 = kode wilayah BMKG, mis. 14.04.01.2001)
  adm4_code?: string;
  nama_desa?: string;
  nama_kecamatan?: string;
  nama_kabupaten?: string;
  nama_provinsi?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Panen {
  id: string;
  user_id?: string;
  kebun_id: string;
  tanggal: string; // YYYY-MM-DD
  berat_kg: number;
  jumlah_janjang: number;
  harga_per_kg: number;
  total_pendapatan: number;
  pembeli: string;
  catatan: string;
  created_at?: string;
  updated_at?: string;
}

export interface Perawatan {
  id: string;
  user_id?: string;
  kebun_id: string;
  tanggal: string; // YYYY-MM-DD
  jenis_perawatan: string;
  nama_bahan: string;
  dosis: string;
  biaya_tenaga_kerja: number;
  biaya_bahan: number;
  total_biaya: number;
  catatan: string;
  created_at?: string;
  updated_at?: string;
}

export interface PengeluaranLain {
  id: string;
  user_id?: string;
  kebun_id?: string | null;
  kategori: string;
  tanggal: string; // YYYY-MM-DD
  jumlah: number;
  keterangan: string;
  created_at?: string;
  updated_at?: string;
}

export interface PengingatPanenInfo {
  kebunId: string;
  namaKebun: string;
  rotasiHari: number;
  terakhirPanen: string | null;
  panenBerikutnya: string;
  hariTersisa: number; // negatif = lewat jadwal
  status: 'LEWAT_JADWAL' | 'HARI_INI' | 'SEGERA' | 'AMAN';
}

export interface DashboardStats {
  totalKebun: number;
  totalLuasHa: number;
  totalProduksiBulanIniKg: number;
  totalPendapatanBulanIni: number;
  totalPengeluaranBulanIni: number;
  labaBersihBulanIni: number;
}
