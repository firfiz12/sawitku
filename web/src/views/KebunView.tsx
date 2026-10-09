import React, { useState, useEffect, useRef } from 'react';
import {
  Trees,
  Plus,
  Search,
  MapPin,
  Edit2,
  Trash2,
  Sprout,
  X,
  Cloud,
} from 'lucide-react';
import type { Kebun } from '../types';
import { WeatherWidget } from '../components/WeatherWidget';
import {
  getProvinsi,
  getKabupaten,
  getKecamatan,
  getDesa,
  getWilayahError,
  type WilayahItem,
} from '../services/wilayahService';

interface KebunViewProps {
  kebunList: Kebun[];
  onSaveKebun: (kebun: Omit<Kebun, 'id'> & { id?: string }) => Promise<void>;
  onDeleteKebun: (id: string) => Promise<void>;
  onPanenKebun: (kebunId: string) => void;
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
}

export const KebunView: React.FC<KebunViewProps> = ({
  kebunList,
  onSaveKebun,
  onDeleteKebun,
  onPanenKebun,
  isModalOpen,
  onOpenModal,
  onCloseModal,
}) => {
  const [search, setSearch] = useState('');
  const [editingKebun, setEditingKebun] = useState<Kebun | null>(null);

  // Form State
  const [nama, setNama] = useState('');
  const [luasHektar, setLuasHektar] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [tahunTanam, setTahunTanam] = useState(new Date().getFullYear().toString());
  const [jumlahPohon, setJumlahPohon] = useState('');
  const [varietas, setVarietas] = useState('Tenera');
  const [rotasiPanenHari, setRotasiPanenHari] = useState('14');

  // Lokasi cuaca (tree wilayah BMKG)
  const [provCode, setProvCode] = useState('');
  const [kabCode, setKabCode] = useState('');
  const [kecCode, setKecCode] = useState('');
  const [desaCode, setDesaCode] = useState('');
  const [provinceList, setProvinceList] = useState<WilayahItem[]>([]);
  const [regencyList, setRegencyList] = useState<WilayahItem[]>([]);
  const [districtList, setDistrictList] = useState<WilayahItem[]>([]);
  const [villageList, setVillageList] = useState<WilayahItem[]>([]);
  const [wilayahLoading, setWilayahLoading] = useState(false);
  const [wilayahError, setWilayahError] = useState('');
  const loadStamp = useRef(0);

  const resetLocationState = () => {
    loadStamp.current++;
    setProvCode('');
    setKabCode('');
    setKecCode('');
    setDesaCode('');
    setRegencyList([]);
    setDistrictList([]);
    setVillageList([]);
    setWilayahError('');
  };

  // Muat daftar provinsi saat modal dibuka
  useEffect(() => {
    if (!isModalOpen) {
      resetLocationState();
      return;
    }
    let alive = true;
    setWilayahLoading(true);
    getProvinsi().then((list) => {
      if (!alive) return;
      setProvinceList(list);
      setWilayahLoading(false);
      setWilayahError(getWilayahError() || '');
    });
    return () => {
      alive = false;
    };
  }, [isModalOpen]);

  const handleProvChange = (code: string) => {
    const stamp = ++loadStamp.current;
    setProvCode(code);
    setKabCode('');
    setKecCode('');
    setDesaCode('');
    setRegencyList([]);
    setDistrictList([]);
    setVillageList([]);
    if (!code) return;
    getKabupaten(code).then((list) => {
      if (stamp === loadStamp.current) setRegencyList(list);
    });
  };

  const handleKabChange = (code: string) => {
    const stamp = ++loadStamp.current;
    setKabCode(code);
    setKecCode('');
    setDesaCode('');
    setDistrictList([]);
    setVillageList([]);
    if (!code) return;
    getKecamatan(code).then((list) => {
      if (stamp === loadStamp.current) setDistrictList(list);
    });
  };

  const handleKecChange = (code: string) => {
    const stamp = ++loadStamp.current;
    setKecCode(code);
    setDesaCode('');
    setVillageList([]);
    if (!code) return;
    getDesa(code).then((list) => {
      if (stamp === loadStamp.current) setVillageList(list);
    });
  };

  const setupLocationFromKebun = (kebun: Kebun) => {
    const parts = (kebun.adm4_code || '').split('.');
    const prov = parts[0] || '';
    const kab = parts.slice(0, 2).join('.');
    const kec = parts.slice(0, 3).join('.');
    const desa = parts.join('.');
    const stamp = ++loadStamp.current;
    setProvCode(prov);
    setKabCode(kab);
    setKecCode(kec);
    setDesaCode(desa);
    setRegencyList([]);
    setDistrictList([]);
    setVillageList([]);
    if (!prov) return;
    Promise.all([
      getKabupaten(prov),
      kab ? getKecamatan(kab) : Promise.resolve([]),
      kec ? getDesa(kec) : Promise.resolve([]),
    ]).then(([kabs, kecs, desas]) => {
      if (stamp !== loadStamp.current) return;
      setRegencyList(kabs);
      setDistrictList(kecs);
      setVillageList(desas);
    });
  };

  // Saat modal dibuka dari luar (mis. aksi cepat di Dashboard/TopBar),
  // reset form ke keadaan default untuk mode tambah.
  useEffect(() => {
    if (!isModalOpen || editingKebun !== null) return;
    setNama('');
    setLuasHektar('');
    setLokasi('');
    setTahunTanam(new Date().getFullYear().toString());
    setJumlahPohon('');
    setVarietas('Tenera');
    setRotasiPanenHari('14');
  }, [isModalOpen, editingKebun]);

  const closeModal = () => {
    setEditingKebun(null);
    onCloseModal();
  };

  const filteredKebun = kebunList.filter(
    (k) =>
      k.nama.toLowerCase().includes(search.toLowerCase()) ||
      k.lokasi.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingKebun(null);
    setNama('');
    setLuasHektar('');
    setLokasi('');
    setTahunTanam(new Date().getFullYear().toString());
    setJumlahPohon('');
    setVarietas('Tenera');
    setRotasiPanenHari('14');
    resetLocationState();
    onOpenModal();
  };

  const handleOpenEdit = (kebun: Kebun) => {
    setEditingKebun(kebun);
    setNama(kebun.nama);
    setLuasHektar(kebun.luas_hektar.toString());
    setLokasi(kebun.lokasi);
    setTahunTanam(kebun.tahun_tanam.toString());
    setJumlahPohon(kebun.jumlah_pohon.toString());
    setVarietas(kebun.varietas);
    setRotasiPanenHari((kebun.rotasi_panen_hari || 14).toString());
    setupLocationFromKebun(kebun);
    onOpenModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !luasHektar) return;

    await onSaveKebun({
      id: editingKebun ? editingKebun.id : undefined,
      nama,
      luas_hektar: parseFloat(luasHektar) || 0,
      lokasi,
      tahun_tanam: parseInt(tahunTanam, 10) || new Date().getFullYear(),
      jumlah_pohon: parseInt(jumlahPohon, 10) || 0,
      varietas,
      rotasi_panen_hari: parseInt(rotasiPanenHari, 10) || 14,
      adm4_code: desaCode || undefined,
      nama_provinsi: provinceList.find((x) => x.k === provCode)?.n,
      nama_kabupaten: regencyList.find((x) => x.k === kabCode)?.n,
      nama_kecamatan: districtList.find((x) => x.k === kecCode)?.n,
      nama_desa: villageList.find((x) => x.k === desaCode)?.n,
    });
    closeModal();
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', minWidth: 280, flex: 1 }}>
          <Search
            size={18}
            color="#94a3b8"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            id="input-search-kebun"
            type="text"
            className="form-input"
            style={{ paddingLeft: 40 }}
            placeholder="Cari nama atau lokasi kebun..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button id="btn-add-kebun" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Tambah Kebun Baru</span>
        </button>
      </div>

      {/* Grid Kebun */}
      {filteredKebun.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <Trees size={48} color="#059669" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#0f172a' }}>Tidak ada kebun yang ditemukan</h3>
          <p style={{ marginTop: 6, fontSize: '0.9rem' }}>
            {search ? 'Coba ubah kata kunci pencarian Anda.' : 'Mulai dengan menambahkan blok kebun sawit Anda.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 20 }}>
          {filteredKebun.map((kebun) => (
            <div key={kebun.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 className="h-kebun-name">{kebun.nama}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>
                    <MapPin size={14} color="#059669" />
                    <span>{kebun.lokasi || 'Lokasi belum ditentukan'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn btn-secondary btn-icon"
                    title="Edit Kebun"
                    onClick={() => handleOpenEdit(kebun)}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className="btn btn-danger btn-icon"
                    title="Hapus Kebun"
                    onClick={() => {
                      if (window.confirm(`Hapus kebun "${kebun.nama}"? Data riwayat terkait mungkin terpengaruh.`)) {
                        onDeleteKebun(kebun.id);
                      }
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Kebun Info Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  padding: '14px',
                  borderRadius: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: 16,
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Luas Lahan</span>
                  <span className="num-kebun-info" style={{ color: '#0f172a' }}>{kebun.luas_hektar} Ha</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Populasi Pohon</span>
                  <span className="num-kebun-info" style={{ color: '#0f172a' }}>
                    {kebun.jumlah_pohon > 0 ? `${kebun.jumlah_pohon} Pokok` : '-'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Tahun Tanam</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{kebun.tahun_tanam}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Rotasi Panen</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>Setiap {kebun.rotasi_panen_hari || 14} Hari</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Varietas Benih</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{kebun.varietas || 'Tidak spesifik'}</span>
                </div>
              </div>

              {kebun.adm4_code && <WeatherWidget kebun={kebun} />}

              {/* Action Footer */}
              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '0.88rem' }}
                  onClick={() => onPanenKebun(kebun.id)}
                >
                  <Sprout size={16} />
                  <span>Catat Panen Kebun Ini</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah/Edit Kebun */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingKebun ? 'Edit Kebun Sawit' : 'Tambah Kebun Sawit'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="form-nama-kebun">Nama / Kode Blok Kebun *</label>
                <input
                  id="form-nama-kebun"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Kebun Blok B - Sungai Pagar"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="form-luas-kebun">Luas (Hektar) *</label>
                  <input
                    id="form-luas-kebun"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="Contoh: 3.5"
                    value={luasHektar}
                    onChange={(e) => setLuasHektar(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form-rotasi-kebun">Rotasi Panen (Hari)</label>
                  <input
                    id="form-rotasi-kebun"
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="Standar: 14 hari"
                    value={rotasiPanenHari}
                    onChange={(e) => setRotasiPanenHari(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="form-lokasi-kebun">Lokasi / Wilayah</label>
                <input
                  id="form-lokasi-kebun"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Desa Suka Maju, Kampar"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                />
              </div>

              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '14px',
                  background: '#f8fafc',
                  marginTop: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Cloud size={16} color="#059669" />
                  <label className="form-label" style={{ marginBottom: 0 }}>Lokasi Prakiraan Cuaca (BMKG)</label>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 12px' }}>
                  Pilih provinsi sampai desa/kelurahan agar kartu kebun menampilkan prakiraan cuaca. Opsional.
                </p>
                {wilayahLoading ? (
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '8px 0' }}>Memuat data wilayah...</p>
                ) : wilayahError ? (
                  <p style={{ fontSize: '0.82rem', color: '#dc2626', margin: '8px 0' }}>
                    {wilayahError}. Pastikan terhubung ke internet saat pertama kali, lalu muat ulang.
                  </p>
                ) : (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="form-prov-kebun">Provinsi</label>
                      <select
                        id="form-prov-kebun"
                        className="form-input"
                        value={provCode}
                        onChange={(e) => handleProvChange(e.target.value)}
                      >
                        <option value="">— Pilih Provinsi —</option>
                        {provinceList.map((p) => (
                          <option key={p.k} value={p.k}>{p.n}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="form-kab-kebun">Kabupaten/Kota</label>
                      <select
                        id="form-kab-kebun"
                        className="form-input"
                        value={kabCode}
                        onChange={(e) => handleKabChange(e.target.value)}
                        disabled={!provCode || regencyList.length === 0}
                      >
                        <option value="">— Pilih Kab/Kota —</option>
                        {regencyList.map((p) => (
                          <option key={p.k} value={p.k}>{p.n}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="form-kec-kebun">Kecamatan</label>
                      <select
                        id="form-kec-kebun"
                        className="form-input"
                        value={kecCode}
                        onChange={(e) => handleKecChange(e.target.value)}
                        disabled={!kabCode || districtList.length === 0}
                      >
                        <option value="">— Pilih Kecamatan —</option>
                        {districtList.map((p) => (
                          <option key={p.k} value={p.k}>{p.n}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="form-desa-kebun">Desa/Kelurahan</label>
                      <select
                        id="form-desa-kebun"
                        className="form-input"
                        value={desaCode}
                        onChange={(e) => setDesaCode(e.target.value)}
                        disabled={!kecCode || villageList.length === 0}
                      >
                        <option value="">— Pilih Desa —</option>
                        {villageList.map((p) => (
                          <option key={p.k} value={p.k}>{p.n}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="form-tahun-kebun">Tahun Tanam</label>
                  <input
                    id="form-tahun-kebun"
                    type="number"
                    min="1980"
                    max="2035"
                    className="form-input"
                    value={tahunTanam}
                    onChange={(e) => setTahunTanam(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form-pohon-kebun">Jumlah Pohon (Pokok)</label>
                  <input
                    id="form-pohon-kebun"
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="Contoh: 450"
                    value={jumlahPohon}
                    onChange={(e) => setJumlahPohon(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="form-varietas-kebun">Varietas Bibit</label>
                <input
                  id="form-varietas-kebun"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Marihat DxP, Dami Mas, Topaz, dll."
                  value={varietas}
                  onChange={(e) => setVarietas(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Batal
                </button>
                <button id="btn-submit-kebun" type="submit" className="btn btn-primary">
                  {editingKebun ? 'Simpan Perubahan' : 'Tambahkan Kebun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
