// Utility functions for computing statistics, histograms, normal curve and value transforms
// Designed to be fast enough for ~1e6 values with sampling for thumbnails.

export interface StatsSummary {
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
}

export interface HistogramBin {
  x: number; // bin center
  start: number;
  end: number;
  count: number;
  density: number; // normalized by bin width and count
}

// Basic stats in one pass (Welford for numerical stability)
export function computeStats(values: number[]): StatsSummary {
  let n = 0;
  let mean = 0;
  let M2 = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    n++;
    const delta = v - mean;
    mean += delta / n;
    const delta2 = v - mean;
    M2 += delta * delta2;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const variance = n > 1 ? M2 / n : 0; // population variance
  return { count: n, mean, std: Math.sqrt(variance), min, max };
}

// Freedman–Diaconis rule bin count helper (fallback to default)
export function suggestBinCount(values: number[], defaultBins = 30): number {
  if (values.length < 2) return Math.max(5, Math.min(10, defaultBins));
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(0.25 * (sorted.length - 1))];
  const q3 = sorted[Math.floor(0.75 * (sorted.length - 1))];
  const iqr = q3 - q1;
  const n = sorted.length;
  const binWidth = (2 * iqr) / Math.cbrt(n);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (!Number.isFinite(binWidth) || binWidth <= 0) return defaultBins;
  const bins = Math.max(5, Math.min(200, Math.ceil((max - min) / binWidth)));
  return bins;
}

export function computeHistogram(values: number[], binCount = 30): HistogramBin[] {
  if (values.length === 0) return [];
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    const v = Number.isFinite(min) ? min : 0;
    return [{ x: v, start: v, end: v, count: values.length, density: 1 }];
  }
  const width = (max - min) / binCount;
  const counts = new Array(binCount).fill(0);
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    let idx = Math.floor((v - min) / width);
    if (idx < 0) idx = 0;
    if (idx >= binCount) idx = binCount - 1;
    counts[idx]++;
  }
  const n = values.length;
  const bins: HistogramBin[] = [];
  for (let i = 0; i < binCount; i++) {
    const start = min + i * width;
    const end = start + width;
    const x = start + width / 2;
    const count = counts[i];
    const density = n > 0 ? count / (n * width) : 0;
    bins.push({ x, start, end, count, density });
  }
  return bins;
}

// Normal PDF values for a set of x points
export function gaussianPdf(x: number, mean: number, std: number): number {
  if (std <= 0) return 0;
  const a = 1 / (std * Math.sqrt(2 * Math.PI));
  const z = (x - mean) / std;
  return a * Math.exp(-0.5 * z * z);
}

export function buildNormalCurve(domainMin: number, domainMax: number, mean: number, std: number, points = 200): { x: number; y: number }[] {
  const step = (domainMax - domainMin) / points;
  const arr: { x: number; y: number }[] = [];
  for (let i = 0; i <= points; i++) {
    const x = domainMin + i * step;
    arr.push({ x, y: gaussianPdf(x, mean, std) });
  }
  return arr;
}

// Reservoir sampling for large arrays (returns up to k items uniformly)
export function reservoirSample(values: number[], k: number): number[] {
  const n = values.length;
  if (n <= k) return values.slice();
  const sample = values.slice(0, k);
  for (let i = k; i < n; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    if (j < k) sample[j] = values[i];
  }
  return sample;
}

// Transformations
export function transformLog(values: number[], base: 'e' | '10' | '2' = 'e', offset = 0): number[] {
  const logBase = base === '10' ? Math.log10 : base === '2' ? (n: number) => Math.log(n) / Math.log(2) : Math.log;
  const out: number[] = [];
  for (const v of values) {
    const vv = v + offset;
    if (vv > 0 && Number.isFinite(vv)) out.push(logBase(vv));
  }
  return out;
}

export function transformSqrt(values: number[], offset = 0): number[] {
  const out: number[] = [];
  for (const v of values) {
    const vv = v + offset;
    if (vv >= 0 && Number.isFinite(vv)) out.push(Math.sqrt(vv));
  }
  return out;
}

// Box-Cox: requires positive values; if lambda undefined or 'auto', we fallback to lambda=0 (log) for visualization
export function transformBoxCox(values: number[], lambda?: number | 'auto'): number[] {
  const lam = typeof lambda === 'number' ? lambda : 0; // visualization-friendly default
  const out: number[] = [];
  for (const v of values) {
    if (v <= 0 || !Number.isFinite(v)) continue;
    if (Math.abs(lam) < 1e-12) {
      out.push(Math.log(v));
    } else {
      out.push((Math.pow(v, lam) - 1) / lam);
    }
  }
  return out;
}

// Yeo-Johnson transform (supports negatives)
export function transformYeoJohnson(values: number[], lambda?: number | 'auto'): number[] {
  const lam = typeof lambda === 'number' ? lambda : 1; // simple default
  const out: number[] = [];
  for (const y of values) {
    if (!Number.isFinite(y)) continue;
    if (y >= 0) {
      if (Math.abs(lam) < 1e-12) {
        out.push(Math.log(y + 1));
      } else {
        out.push((Math.pow(y + 1, lam) - 1) / lam);
      }
    } else {
      const oneMinusY = 1 - y;
      const denom = 2 - lam;
      if (Math.abs(denom) < 1e-12) {
        out.push(-Math.log(oneMinusY));
      } else {
        out.push(-((Math.pow(oneMinusY, denom) - 1) / denom));
      }
    }
  }
  return out;
}

// Normal inverse CDF approximation (Acklam's approximation)
export function normInv(p: number): number {
  if (p <= 0 || p >= 1 || !Number.isFinite(p)) return NaN;
  const a = [
    -3.969683028665376e+01,
    2.209460984245205e+02,
    -2.759285104469687e+02,
    1.383577518672690e+02,
    -3.066479806614716e+01,
    2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01,
    1.615858368580409e+02,
    -1.556989798598866e+02,
    6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
    4.374664141464968e+00,
    2.938163982698783e+00
  ];
  const d = [
    7.784695709041462e-03,
    3.224671290700398e-01,
    2.445134137142996e+00,
    3.754408661907416e+00
  ];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q, r;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (phigh < p) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  q = p - 0.5;
  r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// Quantile transform to uniform [0,1] using ranks (approximate with sampling if needed)
export function transformQuantileUniform(values: number[], sampleForRanks = 200000): number[] {
  if (values.length === 0) return [];
  const sample = values.length > sampleForRanks ? reservoirSample(values, sampleForRanks) : values.slice();
  const sorted = sample.slice().sort((a, b) => a - b);
  const out: number[] = [];
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    // binary search to find rank in sorted sample
    let lo = 0, hi = sorted.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const mv = sorted[mid];
      if (mv <= v) lo = mid + 1; else hi = mid - 1;
    }
    const rank = lo; // count of items <= v
    const p = rank / sorted.length;
    out.push(p);
  }
  return out;
}

export function transformQuantileNormal(values: number[], sampleForRanks = 200000): number[] {
  const uniform = transformQuantileUniform(values, sampleForRanks);
  const out: number[] = [];
  for (const u of uniform) {
    const z = normInv(Math.min(1 - 1e-12, Math.max(1e-12, u)));
    if (Number.isFinite(z)) out.push(z);
  }
  return out;
}

export type TransformMethod = 'log' | 'sqrt' | 'box_cox' | 'yeo_johnson' | 'quantile_uniform' | 'quantile_normal';

export function applyTransform(values: number[], method: TransformMethod, params: any = {}): number[] {
  switch (method) {
    case 'log':
      return transformLog(values, params.base || 'e', params.offset || 0);
    case 'sqrt':
      return transformSqrt(values, params.offset || 0);
    case 'box_cox':
      return transformBoxCox(values, params.lambda);
    case 'yeo_johnson':
      return transformYeoJohnson(values, params.lambda);
    case 'quantile_uniform':
      return transformQuantileUniform(values);
    case 'quantile_normal':
      return transformQuantileNormal(values);
    default:
      return values.slice();
  }
}

export interface DistributionData {
  histogram: HistogramBin[];
  normalCurve: { x: number; y: number }[];
  stats: StatsSummary;
  domain: { min: number; max: number };
}

export function buildDistribution(values: number[], requestedBins?: number): DistributionData {
  const stats = computeStats(values);
  const bins = requestedBins && Number.isFinite(requestedBins) ? requestedBins : suggestBinCount(values, 30);
  const histogram = computeHistogram(values, bins);
  const domainMin = histogram.length > 0 ? histogram[0].start : stats.min;
  const domainMax = histogram.length > 0 ? histogram[histogram.length - 1].end : stats.max;
  const normalCurve = buildNormalCurve(domainMin, domainMax, stats.mean, stats.std, 200);
  return { histogram, normalCurve, stats, domain: { min: domainMin, max: domainMax } };
}