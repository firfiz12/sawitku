import React, { useId, useState } from 'react';

export interface TrendPoint {
  key: string;
  label: string;
  fullLabel: string;
  pendapatan: number;
  pengeluaran: number;
  laba: number;
  production: number;
  hasProduction: boolean;
}

interface FinancialTrendChartProps {
  data: TrendPoint[];
  formatRupiah: (value: number) => string;
  formatCompact: (value: number) => string;
}

const CHART_WIDTH = 760;
const CHART_HEIGHT = 300;
const PADDING = { top: 20, right: 18, bottom: 38, left: 70 };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const FinancialTrendChart: React.FC<FinancialTrendChartProps> = ({
  data,
  formatRupiah,
  formatCompact,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const values = data.flatMap((item) => [item.pendapatan, item.pengeluaran, item.laba]);
  const maxValue = Math.max(0, ...values, 1);
  const minValue = Math.min(0, ...values);
  const span = maxValue - minValue || 1;

  const scaleY = (value: number) =>
    PADDING.top + ((maxValue - value) / span) * innerHeight;

  const groupWidth = innerWidth / Math.max(data.length, 1);
  const barWidth = Math.max(3, Math.min(18, groupWidth * 0.28));
  const labelStep = Math.max(1, Math.ceil(data.length / 12));
  const zeroY = scaleY(0);

  const profitPoints = data
    .map((item, index) => {
      const x = PADDING.left + groupWidth * (index + 0.5);
      return `${x},${scaleY(item.laba)}`;
    })
    .join(' ');

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  const hoveredX =
    hoverIndex !== null ? PADDING.left + groupWidth * (hoverIndex + 0.5) : 0;

  return (
    <div className="report-chart-wrap">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label="Grafik tren pendapatan, pengeluaran, dan laba bersih"
        className="report-chart-svg"
      >
        {[0, 1, 2, 3, 4].map((tick) => {
          const ratio = tick / 4;
          const value = maxValue - span * ratio;
          const y = PADDING.top + innerHeight * ratio;
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray={tick === 4 ? undefined : '3 5'}
              />
              <text
                x={PADDING.left - 10}
                y={y + 4}
                textAnchor="end"
                className="report-chart-axis-label"
              >
                {formatCompact(value)}
              </text>
            </g>
          );
        })}

        <line
          x1={PADDING.left}
          x2={CHART_WIDTH - PADDING.right}
          y1={zeroY}
          y2={zeroY}
          stroke="#94a3b8"
        />

        {data.map((item, index) => {
          const center = PADDING.left + groupWidth * (index + 0.5);
          const revenueHeight = Math.abs(scaleY(item.pendapatan) - zeroY);
          const expenseHeight = Math.abs(scaleY(item.pengeluaran) - zeroY);
          const revenueY = item.pendapatan >= 0 ? scaleY(item.pendapatan) : zeroY;
          const expenseY = item.pengeluaran >= 0 ? scaleY(item.pengeluaran) : zeroY;

          return (
            <g key={item.key}>
              <rect
                x={center - barWidth - 1.5}
                y={revenueY}
                width={barWidth}
                height={Math.max(revenueHeight, item.pendapatan > 0 ? 2 : 0)}
                rx={3}
                fill="#10b981"
              />
              <rect
                x={center + 1.5}
                y={expenseY}
                width={barWidth}
                height={Math.max(expenseHeight, item.pengeluaran > 0 ? 2 : 0)}
                rx={3}
                fill="#f97316"
              />
            </g>
          );
        })}

        <polyline
          points={profitPoints}
          fill="none"
          stroke="#0f172a"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.map((item, index) => {
          const x = PADDING.left + groupWidth * (index + 0.5);
          return (
            <g key={`dot-${item.key}`}>
              <circle
                cx={x}
                cy={scaleY(item.laba)}
                r={hoverIndex === index ? 5 : 3.5}
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth={2}
              />
              {(index % labelStep === 0 || index === data.length - 1) && (
                <text
                  x={x}
                  y={CHART_HEIGHT - 14}
                  textAnchor="middle"
                  className="report-chart-axis-label"
                >
                  {item.label}
                </text>
              )}
            </g>
          );
        })}

        {data.map((item, index) => {
          const x = PADDING.left + groupWidth * index;
          return (
            <rect
              key={`hit-${item.key}`}
              x={x}
              y={PADDING.top}
              width={groupWidth}
              height={innerHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(index)}
              onBlur={() => setHoverIndex(null)}
              tabIndex={0}
              aria-label={`${item.fullLabel}: pendapatan ${formatRupiah(item.pendapatan)}, pengeluaran ${formatRupiah(item.pengeluaran)}, laba ${formatRupiah(item.laba)}`}
            >
              <title>{`${item.fullLabel}\nPendapatan: ${formatRupiah(item.pendapatan)}\nPengeluaran: ${formatRupiah(item.pengeluaran)}\nLaba: ${formatRupiah(item.laba)}`}</title>
            </rect>
          );
        })}
      </svg>

      {hovered && (
        <div
          className="report-chart-tooltip"
          style={{ left: `${clamp((hoveredX / CHART_WIDTH) * 100, 14, 86)}%` }}
        >
          <strong>{hovered.fullLabel}</strong>
          <span>
            <i style={{ background: '#10b981' }} /> Pendapatan
            <b>{formatRupiah(hovered.pendapatan)}</b>
          </span>
          <span>
            <i style={{ background: '#f97316' }} /> Pengeluaran
            <b>{formatRupiah(hovered.pengeluaran)}</b>
          </span>
          <span>
            <i style={{ background: '#0f172a' }} /> Laba bersih
            <b>{formatRupiah(hovered.laba)}</b>
          </span>
        </div>
      )}
    </div>
  );
};

interface ProductionTrendChartProps {
  data: TrendPoint[];
  formatKg: (value: number) => string;
  formatNumber: (value: number) => string;
}

export const ProductionTrendChart: React.FC<ProductionTrendChartProps> = ({
  data,
  formatKg,
  formatNumber,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradientBase = useId().replace(/:/g, '');
  const gradientId = `report-production-${gradientBase}`;
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const maxValue = Math.max(1, ...data.map((item) => item.production));
  const groupWidth = innerWidth / Math.max(data.length, 1);
  const barWidth = Math.max(5, Math.min(34, groupWidth * 0.55));
  const labelStep = Math.max(1, Math.ceil(data.length / 12));
  const scaleY = (value: number) => PADDING.top + ((maxValue - value) / maxValue) * innerHeight;
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  const hoveredX =
    hoverIndex !== null ? PADDING.left + groupWidth * (hoverIndex + 0.5) : 0;

  return (
    <div className="report-chart-wrap">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label="Grafik tren produksi TBS"
        className="report-chart-svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((tick) => {
          const ratio = tick / 4;
          const value = maxValue - maxValue * ratio;
          const y = PADDING.top + innerHeight * ratio;
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray={tick === 4 ? undefined : '3 5'}
              />
              <text
                x={PADDING.left - 10}
                y={y + 4}
                textAnchor="end"
                className="report-chart-axis-label"
              >
                {formatKg(value)}
              </text>
            </g>
          );
        })}

        {data.map((item, index) => {
          const center = PADDING.left + groupWidth * (index + 0.5);
          const barHeight = Math.abs(scaleY(item.production) - scaleY(0));
          const hasRecords = item.hasProduction;

          return (
            <g key={item.key}>
              <rect
                x={center - barWidth / 2}
                y={scaleY(item.production)}
                width={barWidth}
                height={hasRecords ? Math.max(barHeight, item.production > 0 ? 3 : 2) : 4}
                rx={5}
                fill={hasRecords ? `url(#${gradientId})` : '#e2e8f0'}
                stroke={hasRecords ? 'none' : '#cbd5e1'}
                strokeDasharray={hasRecords ? undefined : '4 4'}
              />
              {(index % labelStep === 0 || index === data.length - 1) && (
                <text
                  x={center}
                  y={CHART_HEIGHT - 14}
                  textAnchor="middle"
                  className="report-chart-axis-label"
                >
                  {item.label}
                </text>
              )}
            </g>
          );
        })}

        {data.map((item, index) => {
          const x = PADDING.left + groupWidth * index;
          return (
            <rect
              key={`hit-${item.key}`}
              x={x}
              y={PADDING.top}
              width={groupWidth}
              height={innerHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(index)}
              onBlur={() => setHoverIndex(null)}
              tabIndex={0}
              aria-label={`${item.fullLabel}: ${item.hasProduction ? `${formatNumber(item.production)} kg` : 'belum ada catatan panen'}`}
            >
              <title>{`${item.fullLabel}\n${item.hasProduction ? `Produksi: ${formatNumber(item.production)} kg` : 'Belum ada catatan panen'}`}</title>
            </rect>
          );
        })}
      </svg>

      {hovered && (
        <div
          className="report-chart-tooltip"
          style={{ left: `${clamp((hoveredX / CHART_WIDTH) * 100, 14, 86)}%` }}
        >
          <strong>{hovered.fullLabel}</strong>
          <span>
            <i style={{ background: '#10b981' }} /> Produksi TBS
            <b>{hovered.hasProduction ? `${formatNumber(hovered.production)} kg` : 'Belum ada data'}</b>
          </span>
          <span>
            <i style={{ background: '#94a3b8' }} /> Catatan panen
            <b>{hovered.hasProduction ? 'Tersedia' : 'Tidak ada'}</b>
          </span>
        </div>
      )}
    </div>
  );
};

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface CostDonutProps {
  slices: DonutSlice[];
  total: number;
  formatRupiah: (value: number) => string;
}

export const CostDonut: React.FC<CostDonutProps> = ({ slices, total, formatRupiah }) => {
  const cx = 90;
  const cy = 90;
  const radius = 72;

  const paths = slices.reduce<
    Array<DonutSlice & { ratio: number; path: string; end: number }>
  >((accumulator, slice) => {
    const ratio = total > 0 ? slice.value / total : 0;
    const start =
      accumulator.length > 0
        ? accumulator[accumulator.length - 1].end
        : -Math.PI / 2;
    const sweep = ratio * Math.PI * 2;
    const end = start + sweep;
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const path =
      ratio >= 0.9999
        ? `M ${cx} ${cy} m 0 ${-radius} a ${radius} ${radius} 0 1 1 -0.001 0 Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return [...accumulator, { ...slice, ratio, path, end }];
  }, []);

  return (
    <div className="report-donut-wrap">
      <svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label="Alokasi biaya">
        {paths.map((slice) => (
          <path
            key={slice.label}
            d={slice.path}
            fill={slice.color}
            stroke="#ffffff"
            strokeWidth={2.5}
          >
            <title>{`${slice.label}: ${formatRupiah(slice.value)} (${(slice.ratio * 100).toFixed(1)}%)`}</title>
          </path>
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="report-donut-label">
          Total Biaya
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="report-donut-value">
          {formatRupiah(total).replace('Rp\u00a0', 'Rp ')}
        </text>
      </svg>
    </div>
  );
};
