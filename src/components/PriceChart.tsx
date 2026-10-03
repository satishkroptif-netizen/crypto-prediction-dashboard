'use client';

import { Kline } from '@/lib/types';

interface PriceChartProps {
  klines: Kline[];
  width?: number;
  height?: number;
}

export default function PriceChart({ klines, width = 600, height = 200 }: PriceChartProps) {
  if (!klines || klines.length < 2) {
    return <div className="chart-placeholder">Loading chart...</div>;
  }

  const padding = 10;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const closes = klines.map((k) => k.close);
  const minPrice = Math.min(...closes);
  const maxPrice = Math.max(...closes);
  const priceRange = maxPrice - minPrice || 1;

  const points = klines.map((k, i) => {
    const x = padding + (i / (klines.length - 1)) * chartWidth;
    const y = padding + (1 - (k.close - minPrice) / priceRange) * chartHeight;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${padding + chartWidth},${padding + chartHeight} L ${padding},${padding + chartHeight} Z`;

  const isUp = closes[closes.length - 1] >= closes[0];
  const strokeColor = isUp ? '#22c55e' : '#ef4444';
  const fillColor = isUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';

  // Volume bars
  const volumes = klines.map((k) => k.volume);
  const maxVol = Math.max(...volumes) || 1;

  return (
    <div className="price-chart">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={pct}
            x1={padding}
            y1={padding + chartHeight * pct}
            x2={padding + chartWidth}
            y2={padding + chartHeight * pct}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="4,4"
          />
        ))}

        {/* Volume bars */}
        {klines.map((k, i) => {
          const barHeight = (k.volume / maxVol) * (chartHeight * 0.2);
          const x = padding + (i / (klines.length - 1)) * chartWidth;
          return (
            <rect
              key={i}
              x={x - 1}
              y={padding + chartHeight - barHeight}
              width={2}
              height={barHeight}
              fill={isUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}
            />
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill={fillColor} />

        {/* Price line */}
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" />
      </svg>
    </div>
  );
}
