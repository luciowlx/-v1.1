import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, CheckCircle, FileText, LineChart as LineChartIcon, Loader2, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface ReportViewProps {
  onClose: () => void;
}

interface PredictionPoint {
  timestamp: string;
  actual?: number;
  prediction: number;
  [key: string]: string | number | undefined;
}

type ProcessingEventType = 'missing' | 'abnormal' | 'type';
interface ProcessingEvent {
  type: ProcessingEventType;
  row: number;
  column: string;
  original: any;
  processed: any;
}

function safeParseNumber(v: string | number | undefined): number | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'number') return v;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : undefined;
}

function simpleCSVParse(text: string): PredictionPoint[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map(h => h.trim());
  const tsIdx = header.findIndex(h => /time|date|timestamp|时间/i.test(h));
  const predIdx = header.findIndex(h => /pred|预测|prediction/i.test(h));
  const actualIdx = header.findIndex(h => /actual|真实|target|值/i.test(h));

  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const obj: PredictionPoint = {
      timestamp: tsIdx >= 0 ? cols[tsIdx] : String(new Date().toISOString()),
      prediction: safeParseNumber(predIdx >= 0 ? cols[predIdx] : cols[1]) ?? 0,
      actual: safeParseNumber(actualIdx >= 0 ? cols[actualIdx] : undefined)
    };
    // attach other numeric features for causal approximation
    header.forEach((h, i) => {
      if (i !== tsIdx && i !== predIdx && i !== actualIdx) {
        const num = safeParseNumber(cols[i]);
        if (num !== undefined) obj[h] = num;
      } else {
        obj[h] = cols[i];
      }
    });
    return obj;
  });
}

function generateSampleData(): PredictionPoint[] {
  const data: PredictionPoint[] = [];
  const start = Date.now() - 1000 * 60 * 60 * 24 * 30; // 30 days
  for (let i = 0; i < 100; i++) {
    const ts = new Date(start + i * 1000 * 60 * 60 * 6); // every 6 hours
    const base = 100 + 20 * Math.sin(i / 6);
    const noise = Math.random() * 8 - 4;
    const actual = base + noise;
    const prediction = base + (Math.random() * 6 - 3);
    data.push({ timestamp: ts.toISOString(), actual, prediction, featureA: actual * 0.3 + Math.random() * 10, featureB: i, featureC: Math.sin(i / 3) * 50 });
  }
  return data;
}

function computeCorrelation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n <= 1) return 0;
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const xv = xs[i] - xMean;
    const yv = ys[i] - yMean;
    num += xv * yv;
    dx += xv * xv;
    dy += yv * yv;
  }
  const denom = Math.sqrt(dx * dy) || 1;
  return num / denom;
}

export function ReportView({ onClose }: ReportViewProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<'idle' | 'cleaning' | 'analyzing' | 'report'>('idle');
  const [data, setData] = useState<PredictionPoint[]>([]);
  const [sourceInfo, setSourceInfo] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [processingEvents, setProcessingEvents] = useState<Record<string, ProcessingEvent>>({});
  const [processingSummary, setProcessingSummary] = useState<{ abnormal: number; missing: number; typeConverted: number }>({ abnormal: 0, missing: 0, typeConverted: 0 });

  const [selectedX, setSelectedX] = useState<string[]>([]);
  const [selectedY, setSelectedY] = useState<string[]>([]);

  // attempt to load demo CSV from Downloads; if not accessible, use sample
  useEffect(() => {
    async function runPipeline() {
      setStep('cleaning');
      setError('');
      setSourceInfo('正在尝试加载 /Users/wlx/Downloads/predictions.csv');
      try {
        // Browsers cannot fetch file:// URLs; try common dev served path first
        const resp = await fetch('/predictions.csv');
        if (resp.ok) {
          const text = await resp.text();
          const parsed = simpleCSVParse(text);
          setSourceInfo('已从项目根目录的 public/predictions.csv 加载');
          const { processed, events, summary } = processData(parsed.length ? parsed : generateSampleData());
          setData(processed);
          setProcessingEvents(events);
          setProcessingSummary(summary);
        } else {
          // fall back to sample data
          setSourceInfo('未能直接访问本地Downloads，使用内置示例数据');
          const { processed, events, summary } = processData(generateSampleData());
          setData(processed);
          setProcessingEvents(events);
          setProcessingSummary(summary);
        }
      } catch (e) {
        setSourceInfo('读取失败，使用内置示例数据');
        const { processed, events, summary } = processData(generateSampleData());
        setData(processed);
        setProcessingEvents(events);
        setProcessingSummary(summary);
      }

      // simple cleaning: remove NaN, sort by timestamp
      setStep('analyzing');
      setData(d => {
        const cleaned = d.filter(p => Number.isFinite(p.prediction) && (!p.actual || Number.isFinite(p.actual))).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return cleaned;
      });

      // proceed to report
      setTimeout(() => setStep('report'), 500);
    }
    runPipeline();
  }, []);

  function processData(raw: PredictionPoint[]) {
    // build stats per numeric column
    const keys = Array.from(new Set(raw.flatMap(r => Object.keys(r)))).filter(k => k !== 'timestamp');
    const numericKeys = keys.filter(k => raw.some(r => safeParseNumber(r[k]) !== undefined));
    const stats: Record<string, { mean: number; std: number }> = {};
    numericKeys.forEach(k => {
      const vals = raw.map(r => safeParseNumber(r[k])).filter((v): v is number => v !== undefined && Number.isFinite(v));
      const n = vals.length || 1;
      const mean = vals.reduce((a, b) => a + b, 0) / n;
      const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n) || 0;
      stats[k] = { mean, std };
    });

    const events: Record<string, ProcessingEvent> = {};
    let abnormal = 0, missing = 0, typeConverted = 0;

    const processed = raw.map((r, row) => {
      const obj: PredictionPoint = { ...r };
      numericKeys.forEach(k => {
        const orig = r[k];
        const num = safeParseNumber(orig);
        const st = stats[k];
        if (orig === undefined || orig === null || (typeof orig === 'string' && String(orig).trim() === '') || (typeof num === 'number' && !Number.isFinite(num))) {
          // missing value fill -> mean
          const filled = Number.isFinite(st?.mean) ? st.mean : 0;
          obj[k] = filled as any;
          events[`${row}-${k}`] = { type: 'missing', row, column: k, original: orig, processed: filled };
          missing++;
        } else if (typeof orig === 'string' && num !== undefined && typeof num === 'number') {
          // type conversion
          obj[k] = num as any;
          events[`${row}-${k}`] = { type: 'type', row, column: k, original: orig, processed: num };
          typeConverted++;
        } else if (typeof num === 'number' && Number.isFinite(num) && st && st.std > 0) {
          const z = Math.abs((num - st.mean) / st.std);
          if (z > 3) {
            const capped = st.mean + Math.sign(num - st.mean) * 3 * st.std;
            obj[k] = capped as any;
            events[`${row}-${k}`] = { type: 'abnormal', row, column: k, original: num, processed: capped };
            abnormal++;
          }
        }
      });
      return obj;
    });

    return { processed, events, summary: { abnormal, missing, typeConverted } };
  }

  const summary = useMemo(() => {
    if (!data.length) return null;
    const preds = data.map(d => d.prediction);
    const actuals = data.map(d => d.actual ?? d.prediction);
    const meanPred = preds.reduce((a, b) => a + b, 0) / preds.length;
    const meanAct = actuals.reduce((a, b) => a + b, 0) / actuals.length;
    const corr = computeCorrelation(preds, actuals);
    return { meanPred, meanAct, corr };
  }, [data]);

  const causalBars = useMemo(() => {
    if (!data.length) return [] as { name: string; weight: number }[];
    let keys = Object.keys(data[0]).filter(k => !['timestamp', 'prediction', 'actual'].includes(k));
    if (selectedX.length) keys = keys.filter(k => selectedX.includes(k));
    const preds = data.map(d => d.prediction);
    return keys.map(name => {
      const vals = data.map(d => safeParseNumber(d[name]) ?? 0);
      const w = Math.abs(computeCorrelation(vals, preds));
      return { name, weight: Number.isFinite(w) ? w : 0 };
    }).sort((a, b) => b.weight - a.weight).slice(0, 8);
  }, [data, selectedX]);

  const FALLBACK_X = ['PassengerId','Survived','Pclass','Name','Sex','Age','SibSp','Parch','Ticket','Fare','Cabin','Embarked'];
  const FALLBACK_Y = ['prediction','actual'];
  const allColumns = useMemo(() => {
    // 无数据时直接使用模拟字段；有数据但 X 或 Y 为空时，也使用对应的模拟字段填充
    if (!data.length) return { x: FALLBACK_X, y: FALLBACK_Y };
    const keys = Object.keys(data[0]).filter(k => k !== 'timestamp');
    let x = keys.filter(k => !['actual', 'prediction'].includes(k));
    let y = keys.filter(k => ['actual', 'prediction'].includes(k));
    if (x.length === 0) x = FALLBACK_X;
    if (y.length === 0) y = FALLBACK_Y;
    return { x, y };
  }, [data]);

  useEffect(() => {
    // 默认全选，无论是否已有真实数据（为空时使用模拟字段）
    setSelectedX(allColumns.x);
    setSelectedY(allColumns.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allColumns.x, allColumns.y]);

  return (
    <div className="fixed inset-0 h-screen bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="h-16 bg-slate-800 text-white flex items-center justify-between px-6 shadow-lg">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">{t('report.title')}</h1>
        </div>
        <Badge variant="secondary" className="bg-slate-700 text-white">{t('report.badge.autoClean')}</Badge>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 p-6 space-y-6">
        {/* 顶部进度与数据来源区域已根据需求移除，仅保留核心报表内容 */}

        {/* Summary */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{t('report.stats.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded border">
                  <div className="text-sm text-gray-600">{t('report.stats.predictionMean')}</div>
                  <div className="text-2xl font-semibold">{summary.meanPred.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-white rounded border">
                  <div className="text-sm text-gray-600">{t('report.stats.actualMean')}</div>
                  <div className="text-2xl font-semibold">{summary.meanAct.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-white rounded border">
                  <div className="text-sm text-gray-600">{t('report.stats.correlation')}</div>
                  <div className="text-2xl font-semibold">{summary.corr.toFixed(3)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 交互维度选择（原型图样式：左右两栏、全选/清空、可视化标签） */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{t('report.interactive.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* X 特征字段 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-base font-medium">{t('report.interactive.xFields.title')}</div>
                    <div className="text-xs text-gray-500">{t('report.interactive.xFields.defaultAllHint').replace('{count}', String(allColumns.x.length))}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedX(allColumns.x)}>{t('common.selectAll')}</Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedX([])}>{t('common.clear')}</Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {allColumns.x.map(opt => {
                    const selected = selectedX.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => setSelectedX(prev => prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt])}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition ${selected ? 'bg-slate-900 text-white border-slate-900' : 'bg-gray-50 text-black border-gray-300 hover:bg-gray-100'}`}
                      >
                        <span className={`flex items-center justify-center w-4 h-4 rounded ${selected ? 'bg-white text-slate-900' : 'bg-gray-200 text-black'}`}>
                          {selected && <Check className="w-3 h-3" />}
                        </span>
                        <span className="text-sm">{opt}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-500 mt-2">{t('report.interactive.xFields.selectedCount')} {selectedX.length}/{allColumns.x.length}</div>
              </div>

              {/* Y 目标字段 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-base font-medium">{t('report.interactive.yFields.title')}</div>
                    <div className="text-xs text-gray-500">{t('report.interactive.yFields.multiSelectHint')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedY(allColumns.y)}>{t('common.selectAll')}</Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedY([])}>{t('common.clear')}</Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {allColumns.y.map(opt => {
                    const selected = selectedY.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => setSelectedY(prev => prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt])}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition ${selected ? 'bg-slate-900 text-white border-slate-900' : 'bg-gray-50 text-black border-gray-300 hover:bg-gray-100'}`}
                      >
                        <span className={`flex items-center justify-center w-4 h-4 rounded ${selected ? 'bg-white text-slate-900' : 'bg-gray-200 text-black'}`}>
                          {selected && <Check className="w-3 h-3" />}
                        </span>
                        <span className="text-sm">{opt}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-500 mt-2">{t('report.interactive.xFields.selectedCount')} {selectedY.length}/{allColumns.y.length}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-4">{t('report.interactive.tableHint')}</div>
          </CardContent>
        </Card>

        {/* Time series chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LineChartIcon className="h-5 w-5" />{t('report.timeseries.title')}</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="actual" name={t('report.timeseries.series.actual')} stroke="#60a5fa" dot={false} />
                <Line type="monotone" dataKey="prediction" name={t('report.timeseries.series.prediction')} stroke="#f59e0b" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Causal visualization approximation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{t('report.causal.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 mb-3">{t('report.causal.desc')}</div>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={causalBars} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-15} interval={0} height={60} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 1]} />
                  <RechartsTooltip />
                  <Bar dataKey="weight" name={t('report.causal.weightLabel')} fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Raw data preview with SOLO自动清洗标识与统计摘要 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{t('report.table.preview.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center flex-wrap gap-3 mb-4">
              <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200">{t('report.badge.autoClean')}</Badge>
              <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200">{t('report.badge.missingFill')}：{processingSummary.missing}</Badge>
              <Badge className="bg-red-50 text-red-700 border border-red-200">{t('report.badge.abnormalProcess')}：{processingSummary.abnormal}</Badge>
              <Badge className="bg-blue-50 text-blue-700 border border-blue-200">{t('report.badge.typeConversion')}：{processingSummary.typeConverted}</Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('report.table.timeHeader')}</TableHead>
                    {[...selectedX, ...selectedY].map(col => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 20).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs">{row.timestamp}</TableCell>
                      {[...selectedX, ...selectedY].map(col => {
                        const ev = processingEvents[`${idx}-${col}`];
                        const val = row[col] as any;
                        const colorCls = ev?.type === 'missing' ? 'bg-yellow-50 text-yellow-700' : ev?.type === 'abnormal' ? 'bg-red-50 text-red-700' : ev?.type === 'type' ? 'bg-blue-50 text-blue-700' : '';
                        const borderCls = ev ? 'border border-dashed' : '';
                        return (
                          <TableCell key={col} className={`${colorCls} ${borderCls}`}>
                            {ev ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>{Number.isFinite(Number(val)) ? Number(val).toFixed(2) : String(val)}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <div className="font-medium">{t('report.events.title')}：{ev.type === 'missing' ? t('report.events.missingFill') : ev.type === 'abnormal' ? t('report.events.abnormalProcess') : t('report.events.typeConversion')}</div>
                                    <div>{t('report.events.originalLabel')}：{String(ev.original)}</div>
                                    <div>{t('report.events.processedLabel')}：{String(ev.processed)}</div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span>{Number.isFinite(Number(val)) ? Number(val).toFixed(2) : String(val)}</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>{t('common.back')}</Button>
          <Button onClick={() => window.print()}>{t('common.export')}</Button>
        </div>
      </div>
    </div>
  );
}