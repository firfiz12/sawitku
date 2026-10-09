import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Filter,
  DollarSign,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import type { Perawatan, Kebun } from '../types';
import { MonthFilter } from '../components/MonthFilter';

interface PerawatanViewProps {
  perawatanList: Perawatan[];
  kebunList: Kebun[];
  onSavePerawatan: (perawatan: Omit<Perawatan, 'id'> & { id?: string }) => Promise<void>;
  onDeletePerawatan: (id: string) => Promise<void>;
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
}

export const PerawatanView: React.FC<PerawatanViewProps> = ({
  perawatanList,
  kebunList,
  onSavePerawatan,
  onDeletePerawatan,
  isModalOpen,
  onOpenModal,
  onCloseModal,
}) => {
  const [filterKebun, setFilterKebun] = useState<string>('all');
  const [filterJenis, setFilterJenis] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(''); // YYYY-MM
  const [editingPerawatan, setEditingPerawatan] = useState<Perawatan | null>(null);

  // Form State
  const [kebunId, setKebunId] = useState(kebunList[0]?.id || '');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jenisPerawatan, setJenisPerawatan] = useState('Pemupukan');
  const [namaBahan, setNamaBahan] = useState('');
  const [dosis, setDosis] = useState('');
  const [biayaTenaga, setBiayaTenaga] = useState('');
  const [biayaBahan, setBiayaBahan] = useState('');
  const [catatan, setCatatan] = useState('');

  // Saat modal dibuka dari luar (mis. aksi cepat di Dashboard/TopBar),
  // reset form ke keadaan default untuk mode tambah.
  useEffect(() => {
    if (!isModalOpen || editingPerawatan !== null) return;
    setKebunId(kebunList[0]?.id || '');
    setTanggal(new Date().toISOString().split('T')[0]);
    setJenisPerawatan('Pemupukan');
    setNamaBahan('');
    setDosis('');
    setBiayaTenaga('');
    setBiayaBahan('');
    setCatatan('');
  }, [isModalOpen, editingPerawatan]);

  const closeModal = () => {
    setEditingPerawatan(null);
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

  const JENIS_OPTIONS = [
    'Pemupukan',
    'Semprot Gulma',
    'Pruning / Tunas',
    'Kastrasi',
    'Piringan & Pasar Pikul',
    'Pemberantasan Hama (Ulat Api / Kumbang)',
    'Lainnya',
  ];

  const filteredPerawatan = perawatanList.filter((p) => {
    if (filterKebun !== 'all' && p.kebun_id !== filterKebun) return false;
    if (filterJenis !== 'all' && p.jenis_perawatan !== filterJenis) return false;
    if (filterMonth && !p.tanggal.startsWith(filterMonth)) return false;
    return true;
  });

  const totalBiayaFiltered = filteredPerawatan.reduce((acc, p) => acc + (Number(p.total_biaya) || 0), 0);

  const handleOpenAdd = () => {
    setEditingPerawatan(null);
    setKebunId(kebunList[0]?.id || '');
    setTanggal(new Date().toISOString().split('T')[0]);
    setJenisPerawatan('Pemupukan');
    setNamaBahan('');
    setDosis('');
    setBiayaTenaga('');
    setBiayaBahan('');
    setCatatan('');
    onOpenModal();
  };

  const handleOpenEdit = (p: Perawatan) => {
    setEditingPerawatan(p);
    setKebunId(p.kebun_id);
    setTanggal(p.tanggal);
    setJenisPerawatan(p.jenis_perawatan);
    setNamaBahan(p.nama_bahan || '');
    setDosis(p.dosis || '');
    setBiayaTenaga((p.biaya_tenaga_kerja || 0).toString());
    setBiayaBahan((p.biaya_bahan || 0).toString());
    setCatatan(p.catatan || '');
    onOpenModal();
  };

  const calculatedTotal = (parseFloat(biayaTenaga) || 0) + (parseFloat(biayaBahan) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kebunId || !jenisPerawatan) return;

    await onSavePerawatan({
      id: editingPerawatan ? editingPerawatan.id : undefined,
      kebun_id: kebunId,
      tanggal,
      jenis_perawatan: jenisPerawatan,
      nama_bahan: namaBahan,
      dosis,
      biaya_tenaga_kerja: parseFloat(biayaTenaga) || 0,
      biaya_bahan: parseFloat(biayaBahan) || 0,
      total_biaya: calculatedTotal,
      catatan,
    });
    closeModal();
  };

  return (
    <div>
      {/* Summary Filter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={22} color="#06b6d4" />
          </div>
          <div>
            <div className="stat-label" style={{ color: '#94a3b8' }}>Total Aktivitas Perawatan</div>
            <div className="num-stat" style={{ color: '#fff' }}>
              {filteredPerawatan.length} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Aktivitas</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={22} color="#ef4444" />
          </div>
          <div>
            <div className="stat-label" style={{ color: '#94a3b8' }}>Total Biaya Perawatan</div>
            <div className="num-stat" style={{ color: '#f87171' }}>
              {formatRupiah(totalBiayaFiltered)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="card filter-bar" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.88rem' }}>
            <Filter size={16} />
            <span>Filter:</span>
          </div>

          <select
            id="filter-kebun-perawatan"
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

          <select
            id="filter-jenis-perawatan"
            className="form-select filter-control"
            style={{ width: 'auto', minWidth: 180 }}
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
          >
            <option value="all">Semua Jenis Perawatan</option>
            {JENIS_OPTIONS.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>

          <MonthFilter
            id="filter-month-perawatan"
            value={filterMonth}
            onChange={setFilterMonth}
          />

          {(filterKebun !== 'all' || filterJenis !== 'all' || filterMonth !== '') && (
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                setFilterKebun('all');
                setFilterJenis('all');
                setFilterMonth('');
              }}
            >
              Reset
            </button>
          )}
        </div>

        <button id="btn-add-perawatan" className="btn btn-primary filter-add" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>+ Catat Perawatan</span>
        </button>
      </div>

      {/* Table Data Perawatan */}
      <div className="card" style={{ padding: 0 }}>
        {filteredPerawatan.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <Wrench size={48} color="#059669" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#0f172a' }}>Belum ada riwayat perawatan</h3>
            <p style={{ marginTop: 6, fontSize: '0.9rem' }}>
              Klik tombol "+ Catat Perawatan" untuk mencatat pemupukan, semprot rumput, atau pruning.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kebun</th>
                  <th>Jenis Perawatan</th>
                  <th>Bahan & Dosis</th>
                  <th>Biaya Tenaga</th>
                  <th>Biaya Bahan</th>
                  <th>Total Biaya</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPerawatan.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.tanggal}</td>
                    <td>
                      <span className="badge badge-info">{getKebunName(p.kebun_id)}</span>
                    </td>
                    <td>
                      <span className="badge badge-warning">{p.jenis_perawatan}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.nama_bahan || '-'}</div>
                      {p.dosis && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Dosis: {p.dosis}</div>}
                    </td>
                    <td>{formatRupiah(p.biaya_tenaga_kerja || 0)}</td>
                    <td>{formatRupiah(p.biaya_bahan || 0)}</td>
                    <td style={{ fontWeight: 800, color: '#dc2626' }}>
                      {formatRupiah(p.total_biaya)}
                    </td>
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
                            if (window.confirm('Hapus catatan perawatan ini?')) {
                              onDeletePerawatan(p.id);
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

      {/* Modal Catat Perawatan */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingPerawatan ? 'Edit Catatan Perawatan' : 'Catat Aktivitas Perawatan Kebun'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="form-kebun-perawatan">Pilih Blok Kebun *</label>
                <select
                  id="form-kebun-perawatan"
                  className="form-select"
                  value={kebunId}
                  onChange={(e) => setKebunId(e.target.value)}
                  required
                >
                  {kebunList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="form-tanggal-perawatan">Tanggal Aktivitas *</label>
                  <input
                    id="form-tanggal-perawatan"
                    type="date"
                    className="form-input"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form-jenis-perawatan">Jenis Perawatan *</label>
                  <select
                    id="form-jenis-perawatan"
                    className="form-select"
                    value={jenisPerawatan}
                    onChange={(e) => setJenisPerawatan(e.target.value)}
                  >
                    {JENIS_OPTIONS.map((j) => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="form-bahan-perawatan">Nama Bahan / Pupuk / Herbisida</label>
                  <input
                    id="form-bahan-perawatan"
                    type="text"
                    className="form-input"
                    placeholder="Contoh: NPK 13-6-27, Urea, Glifosat"
                    value={namaBahan}
                    onChange={(e) => setNamaBahan(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form-dosis-perawatan">Dosis / Takaran</label>
                  <input
                    id="form-dosis-perawatan"
                    type="text"
                    className="form-input"
                    placeholder="Contoh: 2 kg / pokok, 1.5 L / Ha"
                    value={dosis}
                    onChange={(e) => setDosis(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="form-upah-perawatan">Biaya Upah / Tenaga Kerja (Rp)</label>
                  <input
                    id="form-upah-perawatan"
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="Contoh: 350000"
                    value={biayaTenaga}
                    onChange={(e) => setBiayaTenaga(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form-beli-bahan-perawatan">Biaya Beli Bahan / Pupuk (Rp)</label>
                  <input
                    id="form-beli-bahan-perawatan"
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="Contoh: 600000"
                    value={biayaBahan}
                    onChange={(e) => setBiayaBahan(e.target.value)}
                  />
                </div>
              </div>

              {/* Total Biaya Auto Calc */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Pengeluaran Perawatan:</span>
                <span className="num-modal" style={{ color: '#f87171' }}>
                  {formatRupiah(calculatedTotal)}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="form-catatan-perawatan">Catatan Tambahan</label>
                <textarea
                  id="form-catatan-perawatan"
                  className="form-textarea"
                  rows={2}
                  placeholder="Kondisi gulma, pekerja, atau evaluasi perawatan"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Batal
                </button>
                <button id="btn-submit-perawatan" type="submit" className="btn btn-primary">
                  {editingPerawatan ? 'Simpan Perubahan' : 'Catat Perawatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
