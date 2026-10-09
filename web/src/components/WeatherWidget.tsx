import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  Sun,
  CloudSun,
  Cloud,
  Cloudy,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  CloudFog,
  Droplets,
  Wind,
  MapPin,
} from 'lucide-react';
import type { Kebun } from '../types';
import { getKebunWeather, lokasiLabel, type CuacaHarian, type CuacaIcon, type CuacaKebun } from '../services/weatherService';

// ===================== IKON =====================
const ICON_SIZE = 18;

function IconFor({ icon }: { icon: CuacaIcon }) {
  switch (icon) {
    case 'cerah':
      return <Sun size={ICON_SIZE} color="#f59e0b" />;
    case 'cerah-berawan':
      return <CloudSun size={ICON_SIZE} color="#f59e0b" />;
    case 'berawan':
      return <Cloud size={ICON_SIZE} color="#64748b" />;
    case 'berawan-tebal':
      return <Cloudy size={ICON_SIZE} color="#64748b" />;
    case 'kabut':
      return <CloudFog size={ICON_SIZE} color="#94a3b8" />;
    case 'hujan-ringan':
      return <CloudDrizzle size={ICON_SIZE} color="#0ea5e9" />;
    case 'hujan':
      return <CloudRain size={ICON_SIZE} color="#0284c7" />;
    case 'hujan-lebat':
      return <CloudRain size={ICON_SIZE} color="#0369a1" />;
    case 'badai':
      return <CloudLightning size={ICON_SIZE} color="#7c3aed" />;
    default:
      return <CloudSun size={ICON_SIZE} color="#f59e0b" />;
  }
}

function formatJam(ms: number): string {
  return new Date(ms).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// ===================== KOMPONEN =====================
interface WeatherWidgetProps {
  kebun: Kebun;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ kebun }) => {
  const adm4 = kebun.adm4_code || '';
  const [cuaca, setCuaca] = useState<CuacaKebun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadKey, setLoadKey] = useState(0);

  useEffect(() => {
    if (!adm4) return;
    let alive = true;
    setLoading(true);
    setError('');
    getKebunWeather(kebun)
      .then((d) => {
        if (!alive) return;
        setCuaca(d);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adm4, loadKey]);

  if (!adm4) return null;

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '12px',
        background: '#f8fafc',
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Cloud size={15} color="#059669" />
        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>Prakiraan Cuaca</span>
        <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <MapPin size={12} color="#94a3b8" />
          {lokasiLabel(kebun)}
        </span>
        <button
          className="btn btn-secondary btn-icon"
          title="Muat ulang cuaca"
          style={{ marginLeft: 'auto', width: 28, height: 28 }}
          onClick={() => setLoadKey((k) => k + 1)}
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {loading && (
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Memuat prakiraan cuaca BMKG...</p>
      )}

      {error && (
        <div>
          <p style={{ fontSize: '0.8rem', color: '#dc2626', margin: 0 }}>Cuaca tidak tersedia: {error}</p>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '4px 10px', marginTop: 8 }}
            onClick={() => setLoadKey((k) => k + 1)}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {!loading && !error && cuaca && (
        <>
          {/* Terkini */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              {cuaca.terkini.suhu}°
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>{cuaca.terkini.deskripsi}</div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>pukul {cuaca.terkini.jam} WIB</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <IconFor icon={cuaca.terkini.icon} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10, fontSize: '0.75rem', color: '#475569' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Droplets size={13} color="#0ea5e9" /> Kelembapan {cuaca.terkini.kelembapan}%
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Wind size={13} color="#64748b" /> {cuaca.terkini.anginMps} m/s{cuaca.terkini.arahAngin ? ` (${cuaca.terkini.arahAngin})` : ''}
            </span>
            {cuaca.terkini.hujan > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CloudRain size={13} color="#0284c7" /> Prob. hujan {cuaca.terkini.hujan}%
              </span>
            )}
          </div>

          {/* Harian */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {cuaca.harian.map((hari: CuacaHarian) => (
              <div
                key={hari.tanggal}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '8px 6px',
                  textAlign: 'center',
                  background: '#ffffff',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>{hari.label}</div>
                <div style={{ margin: '4px 0', display: 'flex', justifyContent: 'center' }}>
                  <IconFor icon={hari.icon} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                  {hari.suhuMin}° / {hari.suhuMax}°
                </div>
                {hari.hujanMax > 0 && (
                  <div style={{ fontSize: '0.68rem', color: '#0284c7' }}>Hujan {hari.hujanMax}%</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.68rem', color: '#94a3b8' }}>
            <span>Sumber data: BMKG</span>
            <span>Diperbarui {formatJam(cuaca.diambilPada)}</span>
          </div>
        </>
      )}
    </div>
  );
};