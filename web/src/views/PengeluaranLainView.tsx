import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Filter,
  DollarSign,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import type { PengeluaranLain } from '../types';

interface PengeluaranLainViewProps {
  pengeluaranList: PengeluaranLain[];
  onSavePengeluaranLain: (item: Omit<PengeluaranLain, 'id'> & { id?: string }) => Promise<void>;
  onDeletePengeluaranLain: (id: string) => Promise<void>;
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
}

export const PengeluaranLainView: React.FC<PengeluaranLainViewProps> = ({
  pengeluaranList,
  onSavePengeluaranLain,
  onDeletePengeluaranLain,
  isModalOpen,
  onOpenModal,
  onCloseModal,
}) => {
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [editingItem, setEditingItem] = useState<PengeluaranLain | null>(null);

  // Form State
  const [kategori, setKategori] = useState('Alat & Mesin');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jumlah, setJumlah] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const KATEGORI_OPTIONS = [
    'Alat & Mesin',
    'Transportasi & BBM',
    'Upah Lansir / Tambahan',
    'Pemeliharaan Jalan & Parit',
    'Pajak / PBB / Izin',
    'Konsumsi Pekerja',
    'Lain-lain',
  ];

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredList = pengeluaranList.filter((item) => {
    if (filterKategori !== 'all' && item.kategori !== filterKategori) return false;
    if (filterMonth && !item.tanggal.startsWith(filterMonth)) return false;
    return true;
  });

  const totalFiltered = filteredList.reduce((acc, item) => acc + (Number(item.jumlah) || 0), 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setKategori('Alat & Mesin');
    setTanggal(new Date().toISOString().split('T')[0]);
    setJumlah('');
    setKeterangan('');
    onOpenModal();
  };

  const handleOpenEdit = (item: PengeluaranLain) => {
    setEditingItem(item);
    setKategori(item.kategori);
    setTanggal(item.tanggal);
    setJumlah(item.jumlah.toString());
    setKeterangan(item.keterangan || '');
    onOpenModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumlah) return;

    await onSavePengeluaranLain({
      id: editingItem ? editingItem.id : undefined,
      kategori,
      tanggal,
      jumlah: parseFloat(jumlah) || 0,
      keterangan,
    });
    onCloseModal();
  };

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt size={22} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Transaksi Pengeluaran Lain</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
              {filteredList.length} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Item</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={22} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Nominal Pengeluaran</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171' }}>
              {formatRupiah(totalFiltered)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.88rem' }}>
            <Filter size={16} />
            <span>Filter:</span>
          </div>

          <select
            id="filter-kategori-pengeluaran"
            className="form-select"
            style={{ width: 'auto', minWidth: 200 }}
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
          >
            <option value="all">Semua Kategori</option>
            {KATEGORI_OPTIONS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          <input
            id="filter-month-pengeluaran"
            type="month"
            className="form-input"
            style={{ width: 'auto' }}
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            title="Filter Bulan"
          />

          {(filterKategori !== 'all' || filterMonth !== '') && (
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                setFilterKategori('all');
                setFilterMonth('');
              }}
            >
              Reset
            </button>
          )}
        </div>

        <button id="btn-add-pengeluaran-lain" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>+ Catat Pengeluaran Lain</span>
        </button>
      </div>

      {/* Table Data Pengeluaran Lain */}
      <div className="card" style={{ padding: 0 }}>
        {filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <Receipt size={48} color="#274e36" style={{ margin: '0 auto 16px' }} />
            <h3>Belum ada pengeluaran lain</h3>
            <p style={{ marginTop: 6, fontSize: '0.9rem' }}>
              Catat pembelian alat (egrek, dodos, angkong), bbm solar, jalan kebun, atau upah lansir.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Keterangan / Keperluan</th>
                  <th>Nominal</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.tanggal}</td>
                    <td>
                      <span className="badge badge-warning">{item.kategori}</span>
                    </td>
                    <td style={{ color: '#e2e8f0' }}>{item.keterangan || '-'}</td>
                    <td style={{ fontWeight: 700, color: '#f87171' }}>
                      {formatRupiah(item.jumlah)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          style={{ width: 30, height: 30 }}
                          title="Edit"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          style={{ width: 30, height: 30 }}
                          title="Hapus"
                          onClick={() => {
                            if (window.confirm('Hapus catatan pengeluaran ini?')) {
                              onDeletePengeluaranLain(item.id);
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

      {/* Modal Tambah/Edit Pengeluaran Lain */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={onCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingItem ? 'Edit Pengeluaran Lain' : 'Catat Pengeluaran Lain'}</h2>
              <button className="modal-close-btn" onClick={onCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="form-kategori-pengeluaran">Kategori Pengeluaran *</label>
                  <select
                    id="form-kategori-pengeluaran"
                    className="form-select"
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                  >
                    {KATEGORI_OPTIONS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="form-tanggal-pengeluaran">Tanggal Pengeluaran *</label>
                  <input
                    id="form-tanggal-pengeluaran"
                    type="date"
                    className="form-input"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="form-jumlah-pengeluaran">Nominal Jumlah (Rp) *</label>
                <input
                  id="form-jumlah-pengeluaran"
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="Contoh: 350000"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="form-keterangan-pengeluaran">Keterangan / Rincian Pengeluaran</label>
                <textarea
                  id="form-keterangan-pengeluaran"
                  className="form-textarea"
                  rows={3}
                  placeholder="Contoh: Pembelian egrek baja dan perbaikan angkong sorong"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={onCloseModal}>
                  Batal
                </button>
                <button id="btn-submit-pengeluaran-lain" type="submit" className="btn btn-primary">
                  {editingItem ? 'Simpan Perubahan' : 'Catat Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
