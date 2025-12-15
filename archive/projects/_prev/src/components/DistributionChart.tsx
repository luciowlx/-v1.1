import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Brush,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import type { HistogramBin, StatsSummary } from '../utils/distribution';
import { gaussianPdf } from '../utils/distribution';

export type DistributionChartProps = {
  histogram: HistogramBin[];
  stats: StatsSummary;
  domain: { min: number; max: number };
  height?: number;
  showBrush?: boolean;
  fixedDomain?: [number, number];
  fixedYMax?: number;
  color?: string;
  title?: string;
  showStats?: boolean;
};

/**
 * Histogram + Normal curve overlay chart with optional brush zoom.
 * Designed for preview thumbnails and full-size comparison panels.
 */
export const DistributionChart: React.FC<DistributionChartProps> = ({
  histogram,
  stats,
  domain,
  height = 180,
  showBrush = false,
  fixedDomain,
  fixedYMax,
  color = 'hsl(210 90% 55%)',
  title,
  showStats = true,
}) => {
  const data = React.useMemo(() => {
    // Enrich histogram with normal curve value at bin centers
    return histogram.map(b => ({
      x: b.x,
      density: b.density,
      curve: gaussianPdf(b.x, stats.mean, stats.std),
    }));
  }, [histogram, stats.mean, stats.std]);

  const yMax = React.useMemo(() => {
    const maxDen = Math.max(0, ...histogram.map(b => b.density));
    const maxCurve = Math.max(0, ...data.map(d => d.curve));
    const m = Math.max(maxDen, maxCurve);
    return fixedYMax && Number.isFinite(fixedYMax) ? fixedYMax : m * 1.15;
  }, [histogram, data, fixedYMax]);

  const xDomain: [number, number] = React.useMemo(() => {
    if (fixedDomain && Number.isFinite(fixedDomain[0]) && Number.isFinite(fixedDomain[1])) return fixedDomain;
    return [domain.min, domain.max];
  }, [domain, fixedDomain]);

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700">{title}</div>
          {showStats && (
            <div className="text-xs text-gray-500">
              μ={stats.mean.toFixed(3)} σ={stats.std.toFixed(3)} n={stats.count}
            </div>
          )}
        </div>
      )}
      {/* 使用内联样式明确高度，避免 Tailwind 动态类在构建时无法识别导致高度为0 */}
      <ChartContainer style={{ height }} config={{ hist: { label: 'Density', color } }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ left: 12, right: 12, top: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" domain={xDomain} tickLine={false} />
            <YAxis domain={[0, yMax]} tickLine={false} />
            <Bar dataKey="density" fill={color} radius={[2, 2, 0, 0]} />
            <Line type="monotone" dataKey="curve" stroke="rgb(220,38,38)" dot={false} strokeWidth={1.5} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <ChartTooltip content={<ChartTooltipContent />} />
            {/* Extra native tooltip when ChartTooltip isn't preferred */}
            <ReTooltip formatter={(value, name) => [Number(value).toFixed(4), name === 'density' ? 'Density' : 'Normal PDF']} />
            {showBrush && (
              <Brush dataKey="x" height={16} travellerWidth={10} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default DistributionChart;
