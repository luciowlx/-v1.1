import React, { useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Download, FileText, ArrowLeft, AlertTriangle, GitCompare, Cpu, Clock, BarChart3, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ReferenceLine,
  ErrorBar,
} from 'recharts';

import { TaskType, TASK_TYPES } from '../utils/taskTypes';

interface CommonInfo {
  id: string;
  name: string;
  dataset: string;
  model: string;
  params?: Record<string, string | number>;
}

interface CausalNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface CausalEdge {
  source: string;
  target: string;
  influenceStrength?: number; // -1 ~ 1
}

interface CausalGraph {
  nodes: CausalNode[];
  edges: CausalEdge[];
}

interface ClassificationMetrics {
  accuracy: number; // 0..1
  precision: number; // 0..1
  recall: number; // 0..1
  f1: number; // 0..1
  rocAuc: number; // 0..1
  rocCurve: { fpr: number; tpr: number }[];
  confusionMatrix: number[][]; // NxN
  ci95?: { accuracy: [number, number] };
}

interface RegressionMetrics {
  mse: number;
  rmse: number;
  mae: number;
  r2: number; // 0..1
  residuals: { x: number; y: number }[];
}

interface ForecastPoint { t: number; actual: number; predicted: number }
interface ForecastingMetrics {
  mae: number;
  rmse: number;
  mape: number; // 0..1
  smape?: number; // 0..2
  r2?: number; // 0..1，可选
  series: ForecastPoint[]; // 时序：实际 vs 预测
  residuals?: { x: number; y: number }[]; // 可选：残差（t vs error）
}

interface RunPhase { name: string; durationSec: number }
interface ResourceUsagePoint { t: number; cpu: number; gpu: number }

interface Quota { gpuMemGB: number; cpuCores: number; ramGB: number; timeLimitMin: number }
interface Actual { gpuMemGB: number; cpuCores: number; ramGB: number }

interface TaskCompareItem {
  info: CommonInfo;
  type: TaskType;
  metrics: ClassificationMetrics | RegressionMetrics | ForecastingMetrics;
  causalGraph: CausalGraph;
  phases: RunPhase[]; // 数据加载/训练/评估
  usage: ResourceUsagePoint[]; // 时间序列
  totalTimeSec: number; // 任务总耗时
  trainTimeSec: number;
  inferTimeMs: number;
  quota?: Quota;
  actual?: Actual;
  warnings?: string[];
}

interface TaskCompareProps {
  task1: TaskCompareItem;
  task2: TaskCompareItem;
  onBack: () => void;
}

// Export key types for external usage (e.g., TaskManagement preview data)
export type { TaskType, TaskCompareItem };

function DiffBadge({ a, b }: { a: string | number; b: string | number }) {
  if (a === b) {
    return <Badge variant="secondary">一致</Badge>;
  }
  return <Badge variant="destructive">差异</Badge>;
}

function percent(n: number, digits = 2) {
  return `${(n * 100).toFixed(digits)}%`;
}

function ConfusionMatrix({ m, title }: { m: number[][]; title: string }) {
  const max = Math.max(...m.flat());
  return (
    <div>
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${m.length}, minmax(40px, 1fr))`, gap: 4 }}>
        {m.map((row, i) => (
          row.map((val, j) => {
            const intensity = max > 0 ? val / max : 0;
            const bg = `rgba(59,130,246,${0.15 + 0.75 * intensity})`; // blue scale
            return (
              <div key={`${i}-${j}`} className="p-2 text-center rounded" style={{ background: bg }}>
                <div className="text-xs text-gray-800">{val}</div>
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
}

function CausalGraphView({ graph, title }: { graph: CausalGraph; title: string }) {
  return (
    <div>
      <div className="text-sm font-medium mb-2">{title}</div>
      <svg viewBox="0 0 800 240" className="w-full h-60 border rounded bg-white">
        {/* Edges */}
        {graph.edges.map((e, idx) => {
          const s = graph.nodes.find(n => n.id === e.source)!;
          const t = graph.nodes.find(n => n.id === e.target)!;
          const strength = e.influenceStrength ?? 0;
          const color = strength > 0 ? '#10b981' : strength < 0 ? '#ef4444' : '#9ca3af';
          const width = Math.max(1, Math.abs(strength) * 3);
          return (
            <g key={idx}>
              <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={color} strokeWidth={width} />
              <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 6} fontSize="10" fill="#6b7280">{strength.toFixed(2)}</text>
            </g>
          );
        })}
        {/* Nodes */}
        {graph.nodes.map((n, idx) => (
          <g key={idx}>
            <circle cx={n.x} cy={n.y} r={18} fill="#3b82f6" opacity={0.8} />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fill="#fff">{n.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export const TaskCompare: React.FC<TaskCompareProps> = ({ task1, task2, onBack }) => {
  const sameType = task1.type === task2.type;

  const isClassification = sameType && task1.type === TASK_TYPES.classification;
  const isRegression = sameType && task1.type === TASK_TYPES.regression;
  const isForecasting = sameType && task1.type === TASK_TYPES.forecasting;

  const clsMetrics = useMemo(() => {
    if (!isClassification) return null;
    const m1 = task1.metrics as ClassificationMetrics;
    const m2 = task2.metrics as ClassificationMetrics;
    return [
      { name: 'Accuracy', a: m1.accuracy, b: m2.accuracy },
      { name: 'Precision', a: m1.precision, b: m2.precision },
      { name: 'Recall', a: m1.recall, b: m2.recall },
      { name: 'F1', a: m1.f1, b: m2.f1 },
      { name: 'ROC-AUC', a: m1.rocAuc, b: m2.rocAuc },
    ];
  }, [task1, task2, isClassification]);

  const regMetrics = useMemo(() => {
    if (!isRegression) return null;
    const m1 = task1.metrics as RegressionMetrics;
    const m2 = task2.metrics as RegressionMetrics;
    return [
      { name: 'MSE', a: m1.mse, b: m2.mse },
      { name: 'RMSE', a: m1.rmse, b: m2.rmse },
      { name: 'MAE', a: m1.mae, b: m2.mae },
      { name: 'R²', a: m1.r2, b: m2.r2 },
    ];
  }, [task1, task2, isRegression]);

  const fctMetrics = useMemo(() => {
    if (!isForecasting) return null;
    const m1 = task1.metrics as ForecastingMetrics;
    const m2 = task2.metrics as ForecastingMetrics;
    const rows: Array<{ name: string; a: number; b: number; isPercent?: boolean }> = [
      { name: 'MAE', a: m1.mae, b: m2.mae },
      { name: 'RMSE', a: m1.rmse, b: m2.rmse },
      { name: 'MAPE', a: m1.mape, b: m2.mape, isPercent: true },
    ];
    if (typeof m1.smape === 'number' && typeof m2.smape === 'number') {
      rows.push({ name: 'SMAPE', a: m1.smape!, b: m2.smape!, isPercent: true });
    }
    if (typeof m1.r2 === 'number' && typeof m2.r2 === 'number') {
      rows.push({ name: 'R²', a: m1.r2!, b: m2.r2! });
    }
    return rows;
  }, [task1, task2, isForecasting]);

  const exportCSV = () => {
    const lines: string[] = [];
    lines.push('指标,任务A,任务B');
    const add = (name: string, a: string | number, b: string | number) => {
      lines.push(`${name},${a},${b}`);
    };
    if (isClassification && clsMetrics) {
      clsMetrics.forEach(row => add(row.name, row.a, row.b));
    }
    if (isRegression && regMetrics) {
      regMetrics.forEach(row => add(row.name, row.a, row.b));
    }
    if (isForecasting && fctMetrics) {
      fctMetrics.forEach(row => add(row.name, row.a, row.b));
    }
    add('总耗时(秒)', task1.totalTimeSec, task2.totalTimeSec);
    add('训练耗时(秒)', task1.trainTimeSec, task2.trainTimeSec);
    add('推理时延(ms)', task1.inferTimeMs, task2.inferTimeMs);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `任务对比_${task1.info.name}_${task2.info.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    // MVP：使用浏览器打印导出为PDF
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> 返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">任务对比</h1>
            <p className="text-gray-600">选择两个已完成任务，查看详细差异</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={exportCSV}>
            <FileText className="h-4 w-4 mr-2" /> 导出Excel(CSV)
          </Button>
          <Button onClick={exportPDF}>
            <Download className="h-4 w-4 mr-2" /> 导出PDF
          </Button>
        </div>
      </div>

      {/* 基本信息与差异高亮 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>高亮显示不同项（模型/参数/数据集）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 任务A */}
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{task1.info.name}</div>
                  <div className="text-sm text-gray-600">ID: {task1.info.id}</div>
                </div>
                <Badge variant="outline">任务A</Badge>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span>数据集</span><span className={task1.info.dataset !== task2.info.dataset ? 'text-purple-600 font-medium' : ''}>{task1.info.dataset}</span></div>
                <div className="flex justify-between"><span>模型</span><span className={task1.info.model !== task2.info.model ? 'text-purple-600 font-medium' : ''}>{task1.info.model}</span></div>
                {task1.info.params && Object.keys(task1.info.params).slice(0,5).map(k => (
                  <div key={k} className="flex justify-between"><span>{k}</span><span className={(task2.info.params && task2.info.params[k] !== task1.info.params![k]) ? 'text-purple-600 font-medium' : ''}>{String(task1.info.params![k])}</span></div>
                ))}
              </div>
            </div>

            {/* 任务B */}
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{task2.info.name}</div>
                  <div className="text-sm text-gray-600">ID: {task2.info.id}</div>
                </div>
                <Badge variant="outline">任务B</Badge>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span>数据集</span><span className={task1.info.dataset !== task2.info.dataset ? 'text-purple-600 font-medium' : ''}>{task2.info.dataset}</span></div>
                <div className="flex justify-between"><span>模型</span><span className={task1.info.model !== task2.info.model ? 'text-purple-600 font-medium' : ''}>{task2.info.model}</span></div>
                {task2.info.params && Object.keys(task2.info.params).slice(0,5).map(k => (
                  <div key={k} className="flex justify-between"><span>{k}</span><span className={(task1.info.params && task1.info.params[k] !== task2.info.params![k]) ? 'text-purple-600 font-medium' : ''}>{String(task2.info.params![k])}</span></div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 指标对比 */}
      <Card>
        <CardHeader>
          <CardTitle>指标对比</CardTitle>
          <CardDescription>分类/回归/时序预测任务的核心指标差异</CardDescription>
        </CardHeader>
        <CardContent>
          {!sameType && (
            <div className="p-3 bg-yellow-50 text-yellow-700 rounded flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" /> 两个任务类型不同，无法对比指标
            </div>
          )}
          {isClassification && clsMetrics && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>指标</TableHead>
                      <TableHead>任务A</TableHead>
                      <TableHead>任务B</TableHead>
                      <TableHead>差异</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clsMetrics.map(row => (
                      <TableRow key={row.name}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{percent(row.a)}</TableCell>
                        <TableCell>{percent(row.b)}</TableCell>
                        <TableCell className={(row.b - row.a) > 0 ? 'text-green-600' : (row.b - row.a) < 0 ? 'text-red-600' : ''}>{((row.b - row.a) * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  <BarChart width={600} height={260} data={clsMetrics.map(r => ({ name: r.name, A: r.a * 100, B: r.b * 100 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="A" name="任务A" fill="#60a5fa" />
                    <Bar dataKey="B" name="任务B" fill="#a78bfa" />
                  </BarChart>
                </div>
              </div>
              <div>
                {/* ROC 叠加 */}
                <LineChart width={600} height={260} data={(task1.metrics as ClassificationMetrics).rocCurve.map((p, idx) => ({ fpr: p.fpr, A: p.tpr, B: (task2.metrics as ClassificationMetrics).rocCurve[idx]?.tpr ?? p.tpr }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fpr" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Legend />
                  <Tooltip />
                  <Line type="monotone" dataKey="A" name="任务A TPR" stroke="#60a5fa" dot={false} />
                  <Line type="monotone" dataKey="B" name="任务B TPR" stroke="#a78bfa" dot={false} />
                  <ReferenceLine x={0} y={0} stroke="#9ca3af" />
                </LineChart>
              </div>
            </div>
          )}

          {isRegression && regMetrics && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>指标</TableHead>
                      <TableHead>任务A</TableHead>
                      <TableHead>任务B</TableHead>
                      <TableHead>差异</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regMetrics.map(row => (
                      <TableRow key={row.name}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.a.toFixed(4)}</TableCell>
                        <TableCell>{row.b.toFixed(4)}</TableCell>
                        <TableCell className={(row.b - row.a) < 0 ? 'text-green-600' : (row.b - row.a) > 0 ? 'text-red-600' : ''}>{(row.b - row.a).toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  <BarChart width={600} height={260} data={regMetrics.map(r => ({ name: r.name, A: r.a, B: r.b }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="A" name="任务A" fill="#60a5fa" />
                    <Bar dataKey="B" name="任务B" fill="#a78bfa" />
                  </BarChart>
                </div>
              </div>
              <div>
                {/* 残差图 */}
                <ScatterChart width={600} height={260}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" />
                  <YAxis dataKey="y" />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={0} stroke="#9ca3af" />
                  <Scatter name="任务A残差" data={(task1.metrics as RegressionMetrics).residuals} fill="#60a5fa" />
                  <Scatter name="任务B残差" data={(task2.metrics as RegressionMetrics).residuals} fill="#a78bfa" />
                </ScatterChart>
              </div>
            </div>
          )}

          {isForecasting && fctMetrics && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>指标</TableHead>
                      <TableHead>任务A</TableHead>
                      <TableHead>任务B</TableHead>
                      <TableHead>差异</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fctMetrics.map(row => (
                      <TableRow key={row.name}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.isPercent ? percent(row.a) : row.a.toFixed(4)}</TableCell>
                        <TableCell>{row.isPercent ? percent(row.b) : row.b.toFixed(4)}</TableCell>
                        <TableCell className={(() => {
                          const diff = row.b - row.a;
                          // 对误差类指标（MAE/RMSE/MAPE/SMAPE）来说，diff<0 更好
                          const isErrorMetric = ['MAE','RMSE','MAPE','SMAPE'].includes(row.name);
                          const better = isErrorMetric ? diff < 0 : diff > 0;
                          return better ? 'text-green-600' : diff === 0 ? '' : 'text-red-600';
                        })()}>
                          {row.isPercent ? `${((row.b - row.a) * 100).toFixed(2)}%` : (row.b - row.a).toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  {/* 预测 vs 实际 叠加曲线 */}
                  <LineChart width={600} height={260} data={(task1.metrics as ForecastingMetrics).series.map((p, i) => ({
                    t: p.t,
                    actual: p.actual,
                    A_pred: p.predicted,
                    B_pred: (task2.metrics as ForecastingMetrics).series[i]?.predicted ?? null,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="actual" name="实际值" stroke="#22c55e" dot={false} />
                    <Line type="monotone" dataKey="A_pred" name="任务A预测" stroke="#60a5fa" dot={false} />
                    <Line type="monotone" dataKey="B_pred" name="任务B预测" stroke="#a78bfa" dot={false} />
                  </LineChart>
                </div>
              </div>
              <div>
                {/* 可选：残差图 */}
                {((task1.metrics as ForecastingMetrics).residuals || (task2.metrics as ForecastingMetrics).residuals) ? (
                  <ScatterChart width={600} height={260}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" />
                    <YAxis dataKey="y" />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={0} stroke="#9ca3af" />
                    {(task1.metrics as ForecastingMetrics).residuals ? (
                      <Scatter name="任务A残差" data={(task1.metrics as ForecastingMetrics).residuals!} fill="#60a5fa" />
                    ) : null}
                    {(task2.metrics as ForecastingMetrics).residuals ? (
                      <Scatter name="任务B残差" data={(task2.metrics as ForecastingMetrics).residuals!} fill="#a78bfa" />
                    ) : null}
                  </ScatterChart>
                ) : (
                  <div className="text-sm text-gray-600">无残差数据可展示</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 可视化对比：混淆矩阵/误差分布 */}
      {isClassification && (
        <Card>
          <CardHeader>
            <CardTitle>混淆矩阵并排对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <ConfusionMatrix m={(task1.metrics as ClassificationMetrics).confusionMatrix} title="任务A" />
              <ConfusionMatrix m={(task2.metrics as ClassificationMetrics).confusionMatrix} title="任务B" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 因果可视化对比 */}
      <Card>
        <CardHeader>
          <CardTitle>因果链条对比</CardTitle>
          <CardDescription>比较两个任务的因果解释差异</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <CausalGraphView graph={task1.causalGraph} title="任务A" />
            <CausalGraphView graph={task2.causalGraph} title="任务B" />
          </div>
        </CardContent>
      </Card>

      {/* 运行日志与资源使用对比 */}
      <Card>
        <CardHeader>
          <CardTitle>运行日志与资源使用对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-700 mb-2">阶段耗时（秒）</div>
              <BarChart width={600} height={240} data={task1.phases.map((p, i) => ({ name: p.name, A: p.durationSec, B: task2.phases[i]?.durationSec ?? 0 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="A" name="任务A" fill="#60a5fa" />
                <Bar dataKey="B" name="任务B" fill="#a78bfa" />
              </BarChart>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded border">
                  <div className="text-gray-600">总耗时</div>
                  <div className="font-semibold">{task1.totalTimeSec}s vs {task2.totalTimeSec}s</div>
                </div>
                <div className="p-3 rounded border">
                  <div className="text-gray-600">训练耗时</div>
                  <div className="font-semibold">{task1.trainTimeSec}s vs {task2.trainTimeSec}s</div>
                </div>
                <div className="p-3 rounded border">
                  <div className="text-gray-600">推理时延</div>
                  <div className="font-semibold">{task1.inferTimeMs}ms vs {task2.inferTimeMs}ms</div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-700 mb-2">CPU/GPU使用情况</div>
              <AreaChart width={600} height={240} data={task1.usage.map((p, i) => ({ t: p.t, cpuA: p.cpu, gpuA: p.gpu, cpuB: task2.usage[i]?.cpu ?? 0, gpuB: task2.usage[i]?.gpu ?? 0 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="cpuA" name="任务A CPU%" stroke="#60a5fa" fill="#60a5fa" opacity={0.3} />
                <Area type="monotone" dataKey="gpuA" name="任务A GPU%" stroke="#0ea5e9" fill="#0ea5e9" opacity={0.3} />
                <Area type="monotone" dataKey="cpuB" name="任务B CPU%" stroke="#a78bfa" fill="#a78bfa" opacity={0.3} />
                <Area type="monotone" dataKey="gpuB" name="任务B GPU%" stroke="#22c55e" fill="#22c55e" opacity={0.3} />
              </AreaChart>
              {(task1.warnings?.length || task2.warnings?.length) ? (
                <div className="mt-3 p-3 bg-yellow-50 rounded">
                  <div className="flex items-center text-yellow-700"><AlertTriangle className="h-4 w-4 mr-2" /> 警告</div>
                  <ul className="mt-2 list-disc list-inside text-sm text-yellow-700">
                    {task1.warnings?.map((w, i) => <li key={`a-${i}`}>任务A：{w}</li>)}
                    {task2.warnings?.map((w, i) => <li key={`b-${i}`}>任务B：{w}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 资源消耗对比 */}
      {(task1.quota || task2.quota) && (task1.actual || task2.actual) && (
        <Card>
          <CardHeader>
            <CardTitle>资源消耗对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 rounded border">
                <div className="text-sm text-gray-600">配额 vs 实际（任务A）</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded border"><div>GPU显存</div><div className="font-semibold">{task1.quota?.gpuMemGB}GB / {task1.actual?.gpuMemGB}GB</div></div>
                  <div className="p-3 rounded border"><div>CPU核数</div><div className="font-semibold">{task1.quota?.cpuCores} / {task1.actual?.cpuCores}</div></div>
                  <div className="p-3 rounded border"><div>内存</div><div className="font-semibold">{task1.quota?.ramGB}GB / {task1.actual?.ramGB}GB</div></div>
                  <div className="p-3 rounded border"><div>时长限制</div><div className="font-semibold">{task1.quota?.timeLimitMin}min</div></div>
                </div>
              </div>
              <div className="p-4 rounded border">
                <div className="text-sm text-gray-600">配额 vs 实际（任务B）</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded border"><div>GPU显存</div><div className="font-semibold">{task2.quota?.gpuMemGB}GB / {task2.actual?.gpuMemGB}GB</div></div>
                  <div className="p-3 rounded border"><div>CPU核数</div><div className="font-semibold">{task2.quota?.cpuCores} / {task2.actual?.cpuCores}</div></div>
                  <div className="p-3 rounded border"><div>内存</div><div className="font-semibold">{task2.quota?.ramGB}GB / {task2.actual?.ramGB}GB</div></div>
                  <div className="p-3 rounded border"><div>时长限制</div><div className="font-semibold">{task2.quota?.timeLimitMin}min</div></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 页尾说明 */}
      <div className="text-sm text-gray-500">提示：以上为示例格式，实际数据请与后端联动并校验同数据集、同任务类型条件。</div>
    </div>
  );
};

export default TaskCompare;