import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Plus,
  Filter,
  Weight,
  Coins,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import type { Panen, Kebun } from '../types';

interface PanenViewProps {
  panenList: Panen[];
  kebunList: Kebun[];
  onSavePanen: (panen: Omit<Panen, 'id'> & { id?: string }) => Promise<void>;
  onDeletePanen: (id: string) => Promise<void>;
  isModalOpen: boolean;
  onOpenModal: (preselectedKebunId?: string) => void;
  onCloseModal: () => void;
  preselectedKebunId?: string;
}

export const PanenView: React.FC<PanenViewProps> = ({
  panenList,
  kebunList,
  onSavePanen,
  onDeletePanen,
  isModalOpen,
  onOpenModal,
  onCloseModal,
  preselectedKebunId,
}) => {
  const [filterKebun, setFilterKebun] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(''); // YYYY-MM
  const [editingPanen, setEditingPanen] = useState<Panen | null>(null);

  // Form State
  const [kebunId, setKebunId] = useState(preselectedKebunId || (kebunList[0]?.id || ''));
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [beratKg, setBeratKg] = useState('');
  const [jumlahJanjang, setJumlahJanjang] = useState('');
  const [hargaPerKg, setHargaPerKg] = useState('2400');
  const [pembeli, setPembeli] = useState('');
  const [catatan, setCatatan] = useState('');

  // Saat modal dibuka dari luar (mis. aksi cepat di Dashboard/TopBar),
  // reset form ke keadaan default untuk mode tambah.
  useEffect(() => {
    if (!isModalOpen || editingPanen !== null) return;
    setKebunId(preselectedKebunId || kebunList[0]?.id || '');
    setTanggal(new Date().toISOString().split('T')[0]);
    setBeratKg('');
    setJumlahJanjang('');
    setHargaPerKg('2400');
    setPembeli('');
    setCatatan('');
  }, [isModalOpen, editingPanen]);

  const closeModal = () => {
    setEditingPanen(null);
    onCloseModal();
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getKebunName = (id: string) => {
    const k = kebunList.find((item) => item.id === id);
    return k ? k.nama : 'Kebun';
  };

  const filteredPanen = panenList.filter((p) => {
    if (filterKebun !== 'all' && p.kebun_id !== filterKebun) return false;
    if (filterMonth && !p.tanggal.startsWith(filterMonth)) return false;
    return true;
  });

  const totalBeratFiltered = filteredPanen.reduce((acc, p) => acc + (Number(p.berat_kg) || 0), 0);
  const totalPendapatanFiltered = filteredPanen.reduce((acc, p) => acc + (Number(p.total_pendapatan) || 0), 0);

  const handleOpenAdd = () => {
    setEditingPanen(null);
    setKebunId(preselectedKebunId || kebunList[0]?.id || '');
    setTanggal(new Date().toISOString().split('T')[0]);
    setBeratKg('');
    setJumlahJanjang('');
    setHargaPerKg('2400');
    setPembeli('');
    setCatatan('');
    onOpenModal();
  };

  const handleOpenEdit = (panen: Panen) => {
    setEditingPanen(panen);
    setKebunId(panen.kebun_id);
    setTanggal(panen.tanggal);
    setBeratKg(panen.berat_kg.toString());
    setJumlahJanjang((panen.jumlah_janjang || 0).toString());
    setHargaPerKg(panen.harga_per_kg.toString());
    setPembeli(panen.pembeli || '');
    setCatatan(panen.catatan || '');
    onOpenModal();
  };

  const calculatedTotal = (parseFloat(beratKg) || 0) * (parseFloat(hargaPerKg) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kebunId || !beratKg || !hargaPerKg) return;

    await onSavePanen({
      id: editingPanen ? editingPanen.id : undefined,
      kebun_id: kebunId,
      tanggal,
      berat_kg: parseFloat(beratKg) || 0,
      jumlah_janjang: parseInt(jumlahJanjang, 10) || 0,
      harga_per_kg: parseFloat(hargaPerKg) || 0,
      total_pendapatan: calculatedTotal,
      pembeli,
      catatan,
    });
    closeModal();
  };

  return (
    <div>
      {/* Summary Cards Filter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Weight size={22} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Berat Panen</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {totalBeratFiltered.toLocaleString('id-ID')} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Kg</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Coins size={22} color="#d97706" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Nilai Penjualan</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
              {formatRupiah(totalPendapatanFiltered)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="card filter-bar" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.88rem' }}>
            <Filter size={16} />
            <span>Filter:</span>
          </div>

          <select
            id="filter-kebun-panen"
            className="form-select filter-control"
            style={{ width: 'auto', minWidth: 180 }}
            value={filterKebun}
            onChange={(e) => setFilterKebun(e.target.value)}
          >
            <option value="all">Semua Blok Kebun</option>
            {kebunList.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>

          <input
            id="filter-month-panen"
            type="month"
            className="form-input filter-control"
            style={{ width: 'auto' }}
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            title="Filter Bulan"
          />

          {(filterKebun !== 'all' || filterMonth !== '') && (
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                setFilterKebun('all');
                setFilterMonth('');
              }}
            >
              Reset
            </button>
          )}
        </div>

        <button id="btn-add-panen" className="btn btn-primary filter-add" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>+ Catat Panen</span>
        </button>
      </div>

      {/* Table Data Panen */}
      <div className="card" style={{ padding: 0 }}>
        {filteredPanen.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <Sprout size={48} color="#059669" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#0f172a' }}>Belum ada catatan panen</h3>
            <p style={{ marginTop: 6, fontSize: '0.9rem' }}>
              Klik tombol "+ Catat Panen" untuk mencatat hasil panen TBS sawit Anda.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kebun</th>
                  <th>Berat TBS</th>
                  <th>Janjang</th>
                  <th>Harga / Kg</th>
                  <th>Total Nilai</th>
                  <th>Pembeli / PKS</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPanen.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.tanggal}</td>
                    <td>
                      <span className="badge badge-info">{getKebunName(p.kebun_id)}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      {p.berat_kg.toLocaleString('id-ID')} Kg
                    </td>
                    <td>{p.jumlah_janjang > 0 ? `${p.jumlah_janjang} JJG` : '-'}</td>
                    <td>Rp {p.harga_per_kg.toLocaleString('id-ID')}</td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>
                      {formatRupiah(p.total_pendapatan)}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{p.pembeli || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          style={{ width: 30, height: 30 }}
                          title="Edit"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          style={{ width: 30, height: 30 }}
                          title="Hapus"
                          onClick={() => {
                            if (window.confirm('Hapus transaksi panen ini?')) {
                              onDeletePanen(p.id);
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Catat Panen */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingPanen ? 'Edit Catatan Panen' : 'Catat Panen Sawit (TBS)'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="form-kebun-panen">Pilih Blok Kebun *</label>
                <select
                  id="form-kebun-panen"
                  className="form-select"
                  value={kebunId}
                  onChange={(e) => setKebunId(e.target.value)}
                  required
                >
                  {kebunList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama} ({k.luas_hektar} Ha)</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="form-tanggal-panen">Tanggal Panen *</label>
                  <input
                    id="form-tanggal-panen"
                    type="date"
                    className="form-input"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form-berat-panen">Total Berat (Kg) *</label>
                  <input
                    id="form-berat-panen"
                    type="number"
                    step="0.1"
                    min="0"
                    className="form-input"
                    placeholder="Contoh: 2850"
                    value={beratKg}
                    onChange={(e) => setBeratKg(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="form-janjang-panen">Jumlah Janjang (JJG)</label>
                  <input
                    id="form-janjang-panen"
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="Contoh: 180"
                    value={jumlahJanjang}
                    onChange={(e) => setJumlahJanjang(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form-harga-panen">Harga TBS per Kg (Rp) *</label>
                  <input
                    id="form-harga-panen"
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="Contoh: 2450"
                    value={hargaPerKg}
                    onChange={(e) => setHargaPerKg(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Kalkulasi Otomatis Preview */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 12,
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 600 }}>Total Estimasi Pendapatan:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
                  {formatRupiah(calculatedTotal)}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="form-pembeli-panen">Pembeli / PKS / Ram</label>
                <input
                  id="form-pembeli-panen"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: UD Tani Berkah / PT Sawit Riau"
                  value={pembeli}
                  onChange={(e) => setPembeli(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="form-catatan-panen">Catatan Tambahan</label>
                <textarea
                  id="form-catatan-panen"
                  className="form-textarea"
                  rows={2}
                  placeholder="Catatan kualitas buah, potongan fraksi, cuaca, dll."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Batal
                </button>
                <button id="btn-submit-panen" type="submit" className="btn btn-primary">
                  {editingPanen ? 'Simpan Perubahan' : 'Catat Panen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
