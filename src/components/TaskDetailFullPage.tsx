import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, User, Database, Brain, AlertCircle, CheckCircle, XCircle, Pause, Play, RotateCcw, Archive, Eye, Settings, Download, Share2, Calendar, Tag, FileText, BarChart3, Activity, Zap, Loader2, Filter, Search, TrendingUp, ArrowUpDown, ChevronLeft, ChevronRight, GripVertical, Circle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from './ui/pagination';
import { VirtualTable } from './ui/virtual-table';
// Tabs removed in favor of左侧锚点导航
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from './ui/chart';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  ErrorBar,
} from 'recharts';

import { toast } from 'sonner';
import { getAvailableActions, TaskAction } from '../utils/taskActions';
import { TASK_TYPES } from '../utils/taskTypes';

interface SelectedDatasetEntry {
  id: string;
  name: string;
  version: string;
  files?: string[];
}

interface Task {
  id: string;
  taskName: string;
  taskType: 'classification' | 'regression' | 'clustering' | 'anomaly_detection' | 'forecasting' | 'nlp' | 'computer_vision';
  status: 'not_started' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'archived' | 'paused';
  priority: 'low' | 'medium' | 'high';
  datasetName: string;
  datasetVersion: string;
  datasets?: SelectedDatasetEntry[]; // 新增：支持多数据集
  modelName: string;
  createdAt: string;
  createdBy: string;
  description?: string;
  progress?: number;
  estimatedTime?: string;
  actualTime?: string;
  accuracy?: number;
  loss?: number;
  parameters?: Record<string, any>;
  logs?: Array<{ timestamp: string; level: 'info' | 'warning' | 'error'; message: string; }>;
  metrics?: Record<string, number>;
  artifacts?: Array<{ name: string; type: string; size: string; url: string; }>;
  // 兼容列表页的曾排队标记，用于在未开始状态下显示“重新运行”按钮
  hasQueuedBefore?: boolean;
  // 兼容 TaskManagement 传入的配置信息
  config?: any;
}

interface TaskDetailFullPageProps {
  task: Task;
  onClose: () => void;
  onOpenDataDetail?: (dataset: any) => void;
  /**
   * 当详情页内对任务进行局部状态覆盖（前端模拟）时，向外部上报补丁。
   * 参数：
   *  - taskId: 任务ID
   *  - patch: 需要覆盖的字段（例如 status/progress/hasQueuedBefore 等）
   */
  onTaskPatched?: (taskId: string, patch: Partial<Task>) => void;
}

const TaskDetailFullPage: React.FC<TaskDetailFullPageProps> = ({ task, onClose, onOpenDataDetail, onTaskPatched }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; action: string; taskId: string; taskName: string }>({ isOpen: false, action: '', taskId: '', taskName: '' });
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic-info']);
  const [activeSection, setActiveSection] = useState<string>('meta');
  const contentRef = useRef<HTMLDivElement | null>(null);
  // 导出需要的可视化区域引用
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const causalRef = useRef<HTMLDivElement | null>(null);
  // 产物预览弹窗状态
  const [artifactPreviewOpen, setArtifactPreviewOpen] = useState(false);
  const [artifactPreviewName, setArtifactPreviewName] = useState<string | null>(null);
  const [artifactPreviewType, setArtifactPreviewType] = useState<'yaml' | 'json' | 'text'>('yaml');
  const [artifactPreviewContent, setArtifactPreviewContent] = useState<string>('');
  // 结果区域切换：是否叠加显示训练数据（默认关闭，仅显示测试集）
  // 用途：控制预测结果表和相关可视化在“测试集”基础上是否叠加“训练集”数据
  const [showTrainData, setShowTrainData] = useState<boolean>(false);

  // 本地任务覆盖：用于立即反映详情页触发的状态变化（如取消排队后显示“重新运行”）
  const [localTaskOverrides, setLocalTaskOverrides] = useState<Partial<Task>>({});

  /**
   * 重置本地覆盖，当切换到不同任务时，避免跨任务状态串扰。
   * 参数：无
   * 返回值：无
   */
  useEffect(() => {
    setLocalTaskOverrides({});
  }, [task.id]);

  /**
   * 合并后的任务对象：优先使用本地覆盖字段（如 status、hasQueuedBefore），用于动作渲染与状态展示。
   * 参数：无
   * 返回值：Task 合并对象
   */
  const computedTask: Task = { ...task, ...localTaskOverrides } as Task;

  /**
   * 局部更新任务覆盖状态（仅前端展示用，不影响外层列表数据）。
   * 参数：
   * - patch: Partial<Task> 需要覆盖的字段
   * 返回值：无
   */
  /**
   * 局部更新任务覆盖状态（仅前端展示用），并通过 onTaskPatched 上报给外层列表/父组件。
   * 参数：
   * - patch: Partial<Task> 需要覆盖的字段
   * 返回值：无
   */
  const applyTaskOverrides = (patch: Partial<Task>) => {
    setLocalTaskOverrides(prev => ({ ...prev, ...patch }));
    // 向上汇报补丁，驱动任务列表保持一致（例如状态徽章、进度动画等）
    if (onTaskPatched) {
      try {
        onTaskPatched(task.id, patch);
      } catch (e) {
        // 忽略外层回调异常，避免影响本地交互
        console.warn('onTaskPatched callback error:', e);
      }
    }
  };

  // 示例：model_config.yaml 预览内容（后续可替换为后端真实返回）
  const MODEL_CONFIG_YAML_SAMPLE = `# 1. 任务元信息（追溯与关联）
task_info:
  task_id: "TASK-20240601-1234"  # 任务唯一标识
  task_name: "设备故障预测"       # 任务名称
  task_type: "time_series"       # 任务类型（时序预测/分类/回归）
  project_id: "PROJ-20240501-001" # 所属项目ID
  create_time: "2024-06-01 10:00:00" # 创建时间

# 2. 数据集配置（输入数据约束）
dataset:
  selected_datasets:  # 选中的数据集及版本
    - dataset_id: "DATA-20240520-002"
      version: "v2.0"
      role: "main_variable"  # 角色（主变量/协变量，仅时序预测）
    - dataset_id: "DATA-20240521-003"
      version: "v1.0"
      role: "covariate"
  target_column: "故障等级"  # 目标字段
  sample_count: 10000        # 样本量（冗余存储，便于快速校验）

# 3. 模型配置（推理核心参数）
model:
  selected_models:  # 选中的模型及来源
    - model_name: "Limix"
      model_id: "MODEL-20240401-001"
      version: "v1.2"
      source: "self_developed"  # 自研/微调/第三方
    - model_name: "XGBoost"
      model_id: "MODEL-20240402-002"
      version: "v0.9"
      source: "third_party"
  hyper_parameters:  # 模型超参数（按任务类型区分）
    time_series:  # 时序预测参数
      context_length: 100
      predict_length: 50
      step: 10
      predict_start_time: "2024-06-01 00:00:00"
    # 分类/回归任务参数示例（根据任务类型动态生成）
    # classification:
    #   train_test_split: 0.8
    #   shuffle: false

# 4. 资源配置（运行环境约束）
resource:
  resource_type: "GPU"  # CPU/GPU/NPU/auto
  quota:
    cpu_cores: 8
    memory_gb: 64
    gpu_cards: 2
    max_runtime_hours: 24

# 5. 输出配置（推理结果约束）
output:
  format: "json"  # 结果输出格式
  include_unslected_columns: true  # 是否包含未选字段（PRD中明确的需求）
  visualization:  # 可视化相关配置
    enable_causal: true  # 是否生成因果可视化`;

  // 数据预览：多数据集切换 & 行数选择 + 增强功能（排序 / 筛选 / 分页 / 列控制）
  const [datasetPreviewIndex, setDatasetPreviewIndex] = useState(0);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<string>('');
  // 兼容旧逻辑：保留 previewRowCount，但分页以 itemsPerPage 为准
  const [previewRowCount, setPreviewRowCount] = useState(10);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [missingOnly, setMissingOnly] = useState(false);
  const [uniqueOnly, setUniqueOnly] = useState(false);
  const [uniqueField, setUniqueField] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [columnOrderMode, setColumnOrderMode] = useState<'original' | 'asc' | 'desc'>('original');
  const [columnManualOrder, setColumnManualOrder] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [tableDensity, setTableDensity] = useState<'compact' | 'normal' | 'comfortable'>('normal');
  const headerRefs = useRef<Record<string, HTMLTableCellElement | null>>({});

  // 因果解释交互
  const [selectedCausalNode, setSelectedCausalNode] = useState<string | null>(null);
  const [topNEdges, setTopNEdges] = useState<number>(5);

  // 模型对比图表类型切换
  const [compareChartType, setCompareChartType] = useState<'bar' | 'line'>('bar');

  // 用户配置的时序预测参数解析（兼容字符串/对象两种config）
  const forecastingParams = React.useMemo(() => {
    try {
      const rawCfg: any = (task as any)?.config;
      const cfg = typeof rawCfg === 'string' ? JSON.parse(rawCfg) : rawCfg;
      const fc = cfg?.forecasting || task.parameters?.forecasting || {};

      // 解析协变量文件（兼容字符串/数组/旧键名）
      const covariateFilesParsed = Array.isArray(fc?.covariateFiles)
        ? fc.covariateFiles
        : (typeof fc?.covariateFiles === 'string'
          ? String(fc?.covariateFiles).split(',').map((s: string) => s.trim()).filter(Boolean)
          : (Array.isArray(fc?.covariates) ? fc.covariates : []));

      // 基于当前任务数据集，构造可选的数据文件列表（模拟）
      const baseName = (task.datasetName || 'dataset').replace(/\s+/g, '_');
      const versionTag = task.datasetVersion ? `_${task.datasetVersion}` : '_v1';
      const availableFilesMock = [
        `${baseName}${versionTag}.csv`,
        `${baseName}_cov_weather.csv`,
        `${baseName}_cov_holiday.csv`,
        `${baseName}_cov_events.csv`,
      ];

      // 主变量文件：优先取后端/参数中的值，否则使用模拟列表的第一个
      const mainFile = fc?.mainVariableFile ?? fc?.main_variable_file ?? availableFilesMock[0];
      // 协变量文件：优先取后端/参数中的值；如果为空，自动从可选列表中过滤掉主变量并取其余项
      const covariateFiles = (covariateFilesParsed && covariateFilesParsed.length > 0)
        ? covariateFilesParsed
        : availableFilesMock.filter(f => f !== mainFile);

      // 数值与时间默认值（模拟）：满足“必填项”的展示需求
      const defaultContextLength = 72;   // 窗口长度：72（例如按小时统计为3天历史）
      const defaultForecastLength = 24;  // 预测长度：24（例如预测未来24个时间步）
      const defaultStepLength = 1;       // 预测步长：1（滑动窗口每次前进1步）
      const defaultStartTime = new Date().toISOString(); // ISO字符串，便于解析与展示

      return {
        contextLength: fc?.contextLength ?? fc?.context_length ?? defaultContextLength,
        stepLength: fc?.stepLength ?? fc?.step_length ?? defaultStepLength,
        forecastLength: fc?.forecastLength ?? fc?.prediction_length ?? fc?.forecast_length ?? defaultForecastLength,
        startTime: fc?.startTime ?? fc?.start_time ?? defaultStartTime,
        mainVariableFile: mainFile,
        covariateFiles,
      };
    } catch (e) {
      // 解析失败时也提供模拟默认值，确保页面展示完整
      const baseName = (task.datasetName || 'dataset').replace(/\s+/g, '_');
      const versionTag = task.datasetVersion ? `_${task.datasetVersion}` : '_v1';
      const availableFilesMock = [
        `${baseName}${versionTag}.csv`,
        `${baseName}_cov_weather.csv`,
        `${baseName}_cov_holiday.csv`,
        `${baseName}_cov_events.csv`,
      ];
      return {
        contextLength: 72,
        stepLength: 1,
        forecastLength: 24,
        startTime: new Date().toISOString(),
        mainVariableFile: availableFilesMock[0],
        covariateFiles: availableFilesMock.slice(1),
      };
    }
  }, [task]);

  const sections = [
    { id: 'results', label: '任务结果', icon: BarChart3 },
    { id: 'causal', label: '因果解释', icon: Zap },
    { id: 'meta', label: '概览信息', icon: FileText },
    { id: 'dataset', label: '数据集信息', icon: Database },
    { id: 'model', label: '模型信息', icon: Brain },
    { id: 'params', label: '参数配置', icon: Settings },
    { id: 'logs', label: '执行日志', icon: FileText },
    { id: 'artifacts', label: '任务产物', icon: Download },
  ];

  // Mock data for demonstration
  const mockLogs = [
    { timestamp: '2024/1/15 14:30:25', level: 'info' as const, message: '开始数据预处理...' },
    { timestamp: '2024/1/15 14:32:10', level: 'info' as const, message: '数据清洗完成，处理了1000条记录' },
    { timestamp: '2024/1/15 14:35:45', level: 'warning' as const, message: '检测到5个异常值，已自动处理' },
    { timestamp: '2024/1/15 14:40:12', level: 'info' as const, message: '模型训练开始...' },
    { timestamp: '2024/1/15 15:15:30', level: 'info' as const, message: 'Epoch 1/10 完成，准确率: 85.2%' },
    { timestamp: '2024/1/15 15:45:18', level: 'info' as const, message: 'Epoch 5/10 完成，准确率: 92.1%' },
    { timestamp: '2024/1/15 16:20:05', level: 'error' as const, message: '内存不足，正在优化批处理大小...' },
    { timestamp: '2024/1/15 16:25:33', level: 'info' as const, message: '恢复训练，批处理大小调整为64' },
  ];

  const mockMetrics = {
    accuracy: 0.921,
    precision: 0.895,
    recall: 0.887,
    f1_score: 0.891,
    auc_roc: 0.945,
    loss: 0.234,
    val_accuracy: 0.898,
    val_loss: 0.267,
  };

  // 训练历史示例数据（参考scikit-learn文档的学习曲线样式）
  const trainingHistory = [
    { epoch: 1, train_acc: 0.72, val_acc: 0.68, train_loss: 0.62, val_loss: 0.65 },
    { epoch: 2, train_acc: 0.80, val_acc: 0.74, train_loss: 0.52, val_loss: 0.58 },
    { epoch: 3, train_acc: 0.85, val_acc: 0.79, train_loss: 0.44, val_loss: 0.51 },
    { epoch: 4, train_acc: 0.88, val_acc: 0.83, train_loss: 0.38, val_loss: 0.46 },
    { epoch: 5, train_acc: 0.90, val_acc: 0.86, train_loss: 0.34, val_loss: 0.42 },
    { epoch: 6, train_acc: 0.91, val_acc: 0.87, train_loss: 0.31, val_loss: 0.39 },
    { epoch: 7, train_acc: 0.92, val_acc: 0.88, train_loss: 0.29, val_loss: 0.37 },
    { epoch: 8, train_acc: 0.93, val_acc: 0.89, train_loss: 0.27, val_loss: 0.35 },
  ];

  // ROC与PR曲线示例数据（近似形状）
  const rocCurve = [
    { tpr: 0.0, fpr: 0.0 },
    { tpr: 0.2, fpr: 0.02 },
    { tpr: 0.4, fpr: 0.05 },
    { tpr: 0.6, fpr: 0.09 },
    { tpr: 0.75, fpr: 0.14 },
    { tpr: 0.85, fpr: 0.20 },
    { tpr: 0.92, fpr: 0.28 },
    { tpr: 0.97, fpr: 0.40 },
    { tpr: 1.0, fpr: 1.0 },
  ];

  const prCurve = [
    { recall: 0.0, precision: 1.0 },
    { recall: 0.2, precision: 0.95 },
    { recall: 0.4, precision: 0.90 },
    { recall: 0.6, precision: 0.86 },
    { recall: 0.7, precision: 0.83 },
    { recall: 0.8, precision: 0.80 },
    { recall: 0.9, precision: 0.74 },
    { recall: 1.0, precision: 0.68 },
  ];

  // 分类任务：指标报表（支持 micro/macro/weighted）
  const [avgMethod, setAvgMethod] = useState<'micro' | 'macro' | 'weighted'>('macro');
  const classificationMetrics = {
    accuracy: 0.921,
    precision: { micro: 0.902, macro: 0.895, weighted: 0.900 },
    recall: { micro: 0.898, macro: 0.887, weighted: 0.889 },
    f1: { micro: 0.900, macro: 0.891, weighted: 0.893 },
    roc_auc: { micro: 0.940, macro: 0.945, weighted: 0.943 },
  };
  // 训练集指标（分类）：用于在打开“显示训练数据”时进行数值对比展示
  const trainClassificationMetrics = {
    accuracy: 0.935,
    precision: { micro: 0.910, macro: 0.902, weighted: 0.906 },
    recall: { micro: 0.905, macro: 0.893, weighted: 0.895 },
    f1: { micro: 0.908, macro: 0.897, weighted: 0.899 },
    roc_auc: { micro: 0.952, macro: 0.957, weighted: 0.955 },
  };

  // 多分类ROC曲线数据（示例三类 + macro/micro）
  const classificationRocData = [
    { fpr: 0.0, A: 0.00, B: 0.00, C: 0.00, macro: 0.00, micro: 0.00 },
    { fpr: 0.1, A: 0.45, B: 0.40, C: 0.42, macro: 0.42, micro: 0.44 },
    { fpr: 0.2, A: 0.62, B: 0.57, C: 0.60, macro: 0.60, micro: 0.61 },
    { fpr: 0.3, A: 0.74, B: 0.70, C: 0.72, macro: 0.72, micro: 0.73 },
    { fpr: 0.4, A: 0.82, B: 0.78, C: 0.80, macro: 0.80, micro: 0.81 },
    { fpr: 0.5, A: 0.88, B: 0.84, C: 0.86, macro: 0.86, micro: 0.87 },
    { fpr: 0.6, A: 0.92, B: 0.88, C: 0.90, macro: 0.90, micro: 0.91 },
    { fpr: 1.0, A: 1.00, B: 1.00, C: 1.00, macro: 1.00, micro: 1.00 },
  ];

  // 多分类PR曲线数据（示例三类 + macro/micro）
  const classificationPRData = [
    { recall: 0.0, A: 1.0, B: 1.0, C: 1.0, macro: 1.0, micro: 1.0 },
    { recall: 0.2, A: 0.95, B: 0.92, C: 0.93, macro: 0.93, micro: 0.94 },
    { recall: 0.4, A: 0.90, B: 0.86, C: 0.88, macro: 0.88, micro: 0.89 },
    { recall: 0.6, A: 0.85, B: 0.80, C: 0.83, macro: 0.83, micro: 0.84 },
    { recall: 0.8, A: 0.78, B: 0.73, C: 0.76, macro: 0.76, micro: 0.77 },
    { recall: 1.0, A: 0.70, B: 0.66, C: 0.68, macro: 0.68, micro: 0.69 },
  ];

  // 混淆矩阵（3类示例）
  const confusionMatrix = {
    labels: ['A', 'B', 'C'],
    // 调整示例数据以更贴近上方指标（Accuracy≈92%）：总样本180，正确166
    values: [
      [56, 2, 2], // A 类：60 样本，56 预测正确
      [2, 55, 3], // B 类：60 样本，55 预测正确
      [3, 2, 55], // C 类：60 样本，55 预测正确
    ],
  };

  // 模型对比（分类）
  const [clsCompareMetric, setClsCompareMetric] = useState<'accuracy' | 'f1_macro' | 'roc_auc_macro'>('accuracy');
  const classificationModelComparison = [
    { model: 'Model A', accuracy: 0.91, f1_macro: 0.89, roc_auc_macro: 0.94 },
    { model: 'Model B', accuracy: 0.93, f1_macro: 0.90, roc_auc_macro: 0.95 },
    { model: 'Model C', accuracy: 0.90, f1_macro: 0.88, roc_auc_macro: 0.93 },
  ];

  // 回归任务：指标报表与数据
  const regressionMetrics = { mse: 32.5, rmse: 5.7, mae: 4.1, r2: 0.87 };
  const regressionPredictions = [
    { actual: 50, pred: 47 }, { actual: 55, pred: 52 }, { actual: 60, pred: 63 },
    { actual: 65, pred: 62 }, { actual: 70, pred: 73 }, { actual: 75, pred: 76 },
    { actual: 80, pred: 78 }, { actual: 85, pred: 88 }, { actual: 90, pred: 92 },
    { actual: 95, pred: 97 }, { actual: 100, pred: 98 }, { actual: 105, pred: 110 },
    { actual: 110, pred: 112 }, { actual: 115, pred: 118 }, { actual: 120, pred: 119 },
  ];
  const regressionResiduals = regressionPredictions.map((d) => ({ pred: d.pred, residual: d.pred - d.actual }));
  const errorHistogram = [
    { bin: '-10~-6', count: 2 }, { bin: '-6~-3', count: 4 }, { bin: '-3~0', count: 5 },
    { bin: '0~3', count: 6 }, { bin: '3~6', count: 3 }, { bin: '6~10', count: 2 },
  ];

  // 模型对比（回归）
  const [regCompareMetric, setRegCompareMetric] = useState<'mse' | 'rmse' | 'mae' | 'r2'>('rmse');
  const regressionModelComparison = [
    { model: 'Model A', mse: 35.2, rmse: 5.9, mae: 4.3, r2: 0.86 },
    { model: 'Model B', mse: 30.1, rmse: 5.5, mae: 3.9, r2: 0.88 },
    { model: 'Model C', mse: 33.4, rmse: 5.8, mae: 4.2, r2: 0.87 },
  ];

  // =============================
  // 时序预测（Forecasting）指标与可视化
  // =============================
  type ForecastPoint = { t: number; time: string; actual: number; predicted: number; ciLower: number; ciUpper: number };

  // 从任务中提取或生成预测时序数据
  const forecastSeries: ForecastPoint[] = React.useMemo(() => {
    // 优先从 task.metrics / task.parameters 中提取（若后端已提供），否则生成示例数据
    const len = 80;
    const startMs = (() => {
      const st = forecastingParams?.startTime;
      const d = st ? new Date(st) : new Date(Date.now() - len * 3600 * 1000);
      return isNaN(d.getTime()) ? Date.now() - len * 3600 * 1000 : d.getTime();
    })();
    const stepHours = Number(forecastingParams?.stepLength ?? 1);
    let base = 100;
    const res: ForecastPoint[] = Array.from({ length: len }, (_, i) => {
      // 生成带趋势与噪声的实际值
      base += (Math.random() - 0.5) * 3 + Math.sin(i / 10) * 0.8;
      const actual = Number(base.toFixed(2));
      // 预测值在实际值附近波动
      const predictedRaw = actual * (1 + (Math.random() - 0.5) * 0.08);
      const predicted = Number(predictedRaw.toFixed(2));
      const err = Math.abs(predicted - actual);
      const ci = err * 1.6; // 近似构造区间宽度（示意）
      const ciLower = Number((predicted - ci).toFixed(2));
      const ciUpper = Number((predicted + ci).toFixed(2));
      const t = startMs + i * stepHours * 3600 * 1000;
      const time = new Date(t).toLocaleString('zh-CN', { hour12: false });
      return { t: i, time, actual, predicted, ciLower, ciUpper };
    });
    return res;
  }, [forecastingParams]);

  /**
   * 训练集示例数据（与测试集结构一致）。
   * 说明：为原型演示目的，训练集通过与测试集相同的生成逻辑并在噪声幅度上做轻微差异制造，从而可视化对比。
   * 依赖：forecastingParams（起始时间与步长保持一致，便于对齐X轴）。
   */
  const forecastTrainSeries: ForecastPoint[] = React.useMemo(() => {
    const len = 80;
    const startMs = (() => {
      const st = forecastingParams?.startTime;
      const d = st ? new Date(st) : new Date(Date.now() - len * 3600 * 1000);
      return isNaN(d.getTime()) ? Date.now() - len * 3600 * 1000 : d.getTime();
    })();
    const stepHours = Number(forecastingParams?.stepLength ?? 1);
    let base = 98; // 与测试集略有偏移，模拟训练集分布
    const res: ForecastPoint[] = Array.from({ length: len }, (_, i) => {
      base += (Math.random() - 0.5) * 2.6 + Math.sin(i / 11) * 0.7;
      const actual = Number(base.toFixed(2));
      const predictedRaw = actual * (1 + (Math.random() - 0.5) * 0.06);
      const predicted = Number(predictedRaw.toFixed(2));
      const err = Math.abs(predicted - actual);
      const ci = err * 1.4;
      const ciLower = Number((predicted - ci).toFixed(2));
      const ciUpper = Number((predicted + ci).toFixed(2));
      const t = startMs + i * stepHours * 3600 * 1000;
      const time = new Date(t).toLocaleString('zh-CN', { hour12: false });
      return { t: i, time, actual, predicted, ciLower, ciUpper };
    });
    return res;
  }, [forecastingParams]);

  // 计算基础指标
  const forecastingMetrics = React.useMemo(() => {
    const n = forecastSeries.length;
    const meanActual = forecastSeries.reduce((s, p) => s + p.actual, 0) / (n || 1);
    const sse = forecastSeries.reduce((s, p) => s + (p.predicted - p.actual) ** 2, 0);
    const mae = forecastSeries.reduce((s, p) => s + Math.abs(p.predicted - p.actual), 0) / (n || 1);
    const rmse = Math.sqrt(sse / (n || 1));
    const mse = sse / (n || 1);
    const mape = forecastSeries.reduce((s, p) => s + Math.abs((p.predicted - p.actual) / (p.actual || 1)), 0) / (n || 1);
    const sst = forecastSeries.reduce((s, p) => s + (p.actual - meanActual) ** 2, 0);
    const r2 = sst > 0 ? 1 - sse / sst : 0;
    return { mse, rmse, mae, mape, r2 };
  }, [forecastSeries]);

  // 残差与散点数据
  // 测试集：残差与散点
  const forecastingResiduals = React.useMemo(() => forecastSeries.map((p) => ({ pred: p.predicted, residual: Number((p.predicted - p.actual).toFixed(2)) })), [forecastSeries]);
  const forecastingPredVsActual = React.useMemo(() => forecastSeries.map((p) => ({ actual: p.actual, pred: p.predicted })), [forecastSeries]);
  // 训练集：残差与散点
  const forecastingTrainResiduals = React.useMemo(() => forecastTrainSeries.map((p) => ({ pred: p.predicted, residual: Number((p.predicted - p.actual).toFixed(2)) })), [forecastTrainSeries]);
  const forecastingTrainPredVsActual = React.useMemo(() => forecastTrainSeries.map((p) => ({ actual: p.actual, pred: p.predicted })), [forecastTrainSeries]);

  // 误差分布直方图（绝对误差）
  /**
   * 误差分布直方图（合并训练/测试）。
   * 默认仅返回测试集；当 showTrainData=true 时，返回每个区间的 testCount/trainCount，便于在同一图表中分栏展示。
   */
  const forecastingErrorHistogram = React.useMemo(() => {
    const bins = [0, 2, 4, 6, 8, 10, 15, 20];
    const testErrors = forecastSeries.map((p) => Math.abs(p.predicted - p.actual));
    const trainErrors = forecastTrainSeries.map((p) => Math.abs(p.predicted - p.actual));
    const records: { bin: string; count?: number; testCount?: number; trainCount?: number }[] = [];
    for (let i = 0; i < bins.length - 1; i++) {
      const low = bins[i], high = bins[i + 1];
      const testCnt = testErrors.filter((e) => e >= low && e < high).length;
      const trainCnt = showTrainData ? trainErrors.filter((e) => e >= low && e < high).length : 0;
      records.push(showTrainData ? { bin: `${low}-${high}`, testCount: testCnt, trainCount: trainCnt } : { bin: `${low}-${high}`, count: testCnt });
    }
    const overTest = testErrors.filter((e) => e >= bins[bins.length - 1]).length;
    const overTrain = showTrainData ? trainErrors.filter((e) => e >= bins[bins.length - 1]).length : 0;
    records.push(showTrainData ? { bin: `${bins[bins.length - 1]}+`, testCount: overTest, trainCount: overTrain } : { bin: `${bins[bins.length - 1]}+`, count: overTest });
    return records;
  }, [forecastSeries, forecastTrainSeries, showTrainData]);

  // 指标趋势（示例：RMSE / MAPE 随时间变化）：使用滑动窗口计算
  const metricTrend = React.useMemo(() => {
    const win = Math.max(3, Math.min(12, Number(forecastingParams?.stepLength ?? 6)));
    const arr = forecastSeries.map((_, idx) => {
      const start = Math.max(0, idx - win + 1);
      const slice = forecastSeries.slice(start, idx + 1);
      const n = slice.length;
      const rmse = Math.sqrt(slice.reduce((s, p) => s + (p.predicted - p.actual) ** 2, 0) / (n || 1));
      const mape = slice.reduce((s, p) => s + Math.abs((p.predicted - p.actual) / (p.actual || 1)), 0) / (n || 1);
      return { time: forecastSeries[idx].time, RMSE: Number(rmse.toFixed(2)), MAPE: Number((mape * 100).toFixed(2)) };
    });
    return arr;
  }, [forecastSeries, forecastingParams]);

  /**
   * 训练集指标趋势与合并趋势：与测试集同窗口计算，便于在同一图中对比。
   */
  const trainMetricTrend = React.useMemo(() => {
    const win = Math.max(3, Math.min(12, Number(forecastingParams?.stepLength ?? 6)));
    const arr = forecastTrainSeries.map((_, idx) => {
      const start = Math.max(0, idx - win + 1);
      const slice = forecastTrainSeries.slice(start, idx + 1);
      const n = slice.length;
      const rmse = Math.sqrt(slice.reduce((s, p) => s + (p.predicted - p.actual) ** 2, 0) / (n || 1));
      const mape = slice.reduce((s, p) => s + Math.abs((p.predicted - p.actual) / (p.actual || 1)), 0) / (n || 1);
      return { time: forecastTrainSeries[idx].time, RMSE_train: Number(rmse.toFixed(2)), MAPE_train: Number((mape * 100).toFixed(2)) };
    });
    return arr;
  }, [forecastTrainSeries, forecastingParams]);

  // 将测试与训练趋势按索引对齐，便于单图渲染两个系列
  const combinedMetricTrend = React.useMemo(() => {
    if (!showTrainData) return metricTrend;
    const len = Math.min(metricTrend.length, trainMetricTrend.length);
    return Array.from({ length: len }, (_, i) => ({
      time: metricTrend[i].time,
      RMSE: metricTrend[i].RMSE,
      MAPE: metricTrend[i].MAPE,
      RMSE_train: trainMetricTrend[i].RMSE_train,
      MAPE_train: trainMetricTrend[i].MAPE_train,
    }));
  }, [metricTrend, trainMetricTrend, showTrainData]);

  // 时序曲线：将训练集与测试集合并为同一数据源，便于单图渲染两套系列
  const combinedForecastLineData = React.useMemo(() => {
    if (!showTrainData) return forecastSeries;
    const len = Math.min(forecastSeries.length, forecastTrainSeries.length);
    return Array.from({ length: len }, (_, i) => ({
      time: forecastSeries[i].time,
      actual: forecastSeries[i].actual,
      predicted: forecastSeries[i].predicted,
      ciUpper: forecastSeries[i].ciUpper,
      ciLower: forecastSeries[i].ciLower,
      train_actual: forecastTrainSeries[i].actual,
      train_predicted: forecastTrainSeries[i].predicted,
    }));
  }, [forecastSeries, forecastTrainSeries, showTrainData]);



  // 偏差统计（正负相对/绝对偏差）
  const deviationStats = React.useMemo(() => {
    const relThresholds = [0.10, 0.20]; // 10%, 20%
    const absThresholds = [10, 20]; // 10, 20（单位随数据而定）
    const relErrs = forecastSeries.map((p) => (p.predicted - p.actual) / (p.actual || 1));
    const absErrs = forecastSeries.map((p) => p.predicted - p.actual);
    const computeForRel = (thr: number) => {
      const pos = relErrs.filter((e) => e >= thr).length;
      const neg = relErrs.filter((e) => e <= -thr).length;
      const within = relErrs.filter((e) => Math.abs(e) <= thr).length;
      return { threshold: thr, posRate: pos / relErrs.length, negRate: neg / relErrs.length, withinRate: within / relErrs.length };
    };
    const computeForAbs = (thr: number) => {
      const pos = absErrs.filter((e) => e >= thr).length;
      const neg = absErrs.filter((e) => e <= -thr).length;
      const within = absErrs.filter((e) => Math.abs(e) <= thr).length;
      return { threshold: thr, posRate: pos / absErrs.length, negRate: neg / absErrs.length, withinRate: within / absErrs.length };
    };
    return {
      relative: relThresholds.map(computeForRel),
      absolute: absThresholds.map(computeForAbs),
    };
  }, [forecastSeries]);

  // 模型对比（时序预测）：示例数据。后续可换为后端返回的真实对比结果
  const [fctCompareMetric, setFctCompareMetric] = useState<'rmse' | 'mae' | 'mape' | 'r2'>('rmse');
  const forecastingModelComparison = [
    { model: 'Model A', rmse: Number((forecastingMetrics.rmse * 1.05).toFixed(2)), mae: Number((forecastingMetrics.mae * 1.06).toFixed(2)), mape: Number((forecastingMetrics.mape * 1.02).toFixed(4)), r2: Math.max(0, Math.min(1, Number((forecastingMetrics.r2 * 0.98).toFixed(2)))) },
    { model: 'Model B', rmse: Number((forecastingMetrics.rmse * 0.95).toFixed(2)), mae: Number((forecastingMetrics.mae * 0.92).toFixed(2)), mape: Number((forecastingMetrics.mape * 0.97).toFixed(4)), r2: Math.max(0, Math.min(1, Number((forecastingMetrics.r2 * 1.03).toFixed(2)))) },
    { model: 'Model C', rmse: Number((forecastingMetrics.rmse * 1.02).toFixed(2)), mae: Number((forecastingMetrics.mae * 0.98).toFixed(2)), mape: Number((forecastingMetrics.mape * 1.00).toFixed(4)), r2: Math.max(0, Math.min(1, Number((forecastingMetrics.r2 * 0.99).toFixed(2)))) },
  ];

  // 自定义指标：p-范数误差（p可调），默认 p=1 即MAE
  const [customP, setCustomP] = useState<number>(1);
  const customMetricValue = React.useMemo(() => {
    const p = Math.max(0.1, Math.min(10, customP));
    const n = forecastSeries.length;
    const mean = forecastSeries.reduce((s, pnt) => s + Math.abs(pnt.predicted - pnt.actual) ** p, 0) / (n || 1);
    return Number(mean ** (1 / p));
  }, [forecastSeries, customP]);

  // 因果解释：DeepSeek预测过程与因果图示意
  const [isDeepSeekOpen, setDeepSeekOpen] = useState(false);
  const featureWeights = [
    { feature: 'Pixels_Areas', weight: 0.32 },
    { feature: 'Sum_of_Luminosity', weight: 0.27 },
    { feature: 'Steel_Plate_Thickness', weight: 0.21 },
    { feature: 'Orientation_Index', weight: 0.11 },
    { feature: 'Edge_Roughness', weight: 0.07 },
    { feature: 'Temperature', weight: 0.05 },
    { feature: 'Vibration', weight: 0.03 },
  ];
  const deepSeekSteps = [
    '特征归一化与异常值处理',
    '基于信息增益的特征筛选',
    '规则生成与阈值分段',
    '多分类投票与置信度计算',
  ];
  const decisionRules = [
    '当 Pixels_Areas 小且 Sum_of_Luminosity 低 → 类别 0/1',
    '当 Steel_Plate_Thickness 大 → 类别 5/6',
    '当 Orientation_Index 为负且绝对值较大 → 类别 2',
    '其他情况 → 选择常见类别（缺陷）',
  ];
  const causalGraph = {
    nodes: [
      { id: 'Z1', x: 60, y: 60 },
      { id: 'Z2', x: 240, y: 60 },
      { id: 'Z3', x: 420, y: 60 },
      { id: 'X', x: 240, y: 160 },
      { id: 'Y', x: 240, y: 260 },
    ],
    edges: [
      { from: 'Z1', to: 'X', strength: 0.4 },
      { from: 'Z2', to: 'X', strength: 0.6 },
      { from: 'Z3', to: 'X', strength: 0.5 },
      { from: 'X', to: 'Y', strength: 0.7 },
      { from: 'Z1', to: 'Y', strength: 0.3 },
      { from: 'Z2', to: 'Y', strength: 0.2 },
      { from: 'Z3', to: 'Y', strength: 0.35 },
    ],
  };

  // 模型评估原型数据（水平误差棒，95%置信区间）
  const modelEvalComparison = [
    { model: 'LimiX', accuracy: 86, ci: [81, 90] },
    { model: 'Autogluon', accuracy: 78, ci: [70, 83] },
    { model: 'DeepSeek', accuracy: 45, ci: [40, 51] },
  ];

  const mockArtifacts = [
    // 移除 training_history.json（根据需求隐藏）
    { name: 'model_config.yaml', type: 'Configuration', size: '2.1 KB', url: '#' },
    { name: 'task_params.json', type: 'Parameters', size: '3.1 KB', url: '#' },
  ];
  const mockDatasetRows = [
    { PassengerId: 1, Survived: 0, Pclass: 3, Name: 'Braund, Mr. Owen Harris', Sex: 'male', Age: 22, SibSp: 1, Parch: 0, Ticket: 'A/5 21171', Fare: 7.25, Cabin: 'N/A', Embarked: 'S' },
    { PassengerId: 2, Survived: 1, Pclass: 1, Name: 'Cumings, Mrs. John Bradley', Sex: 'female', Age: 38, SibSp: 1, Parch: 0, Ticket: 'PC 17599', Fare: 71.2833, Cabin: 'C85', Embarked: 'C' },
    { PassengerId: 3, Survived: 1, Pclass: 3, Name: 'Heikkinen, Miss. Laina', Sex: 'female', Age: 26, SibSp: 0, Parch: 0, Ticket: 'STON/O2. 3101282', Fare: 7.925, Cabin: 'N/A', Embarked: 'S' }
  ];
  const mockDatasetFields = [
    { name: 'PassengerId', type: 'Integer', missing: '0%' },
    { name: 'Survived', type: 'Integer', missing: '0%' },
    { name: 'Pclass', type: 'Integer', missing: '0%' },
    { name: 'Name', type: 'String', missing: '<1%' },
    { name: 'Sex', type: 'Enum', missing: '0%' },
    { name: 'Age', type: 'Float', missing: '19%' },
    { name: 'Fare', type: 'Float', missing: '0%' }
  ];

  // 多数据集聚合：数据集统计注册表（示例）
  // 注意：这里的注册表仅用于演示聚合统计的渲染，真实项目应由后端接口提供对应ID+版本的统计信息
  type DatasetStats = {
    id: string;
    name: string;
    version: string;
    source?: string; // 数据来源渠道或系统
    size: string; // 例如 "2.5MB"
    fieldCount: number;
    sampleCount: number;
    fields?: string[]; // 字段名列表，用于计算并集
  };

  const datasetStatsRegistry: Record<string, DatasetStats> = {
    // 生产质量数据集
    'DATA-2025-001@v3.0': {
      id: 'DATA-2025-001',
      name: '生产质量数据集',
      version: 'v3.0',
      source: '上传',
      size: '2.5MB',
      fieldCount: 15,
      sampleCount: 10000,
      fields: ['id', 'temperature', 'pressure', 'defect_rate', 'quality_score']
    },
    'DATA-2025-001@v2.0': {
      id: 'DATA-2025-001',
      name: '生产质量数据集',
      version: 'v2.0',
      source: '上传',
      size: '2.3MB',
      fieldCount: 14,
      sampleCount: 9800,
      fields: ['id', 'temperature', 'pressure', 'defect_rate', 'quality_score']
    },
    'DATA-2025-001@v1.0': {
      id: 'DATA-2025-001',
      name: '生产质量数据集',
      version: 'v1.0',
      source: '上传',
      size: '2.1MB',
      fieldCount: 12,
      sampleCount: 9500,
      fields: ['id', 'temperature', 'pressure', 'defect_rate', 'quality_score']
    },
    // 客户行为数据集
    'DATA-2025-002@v2.0': {
      id: 'DATA-2025-002',
      name: '客户行为数据集',
      version: 'v2.0',
      source: '订阅',
      size: '5.2MB',
      fieldCount: 20,
      sampleCount: 25000,
      fields: ['user_id', 'age', 'purchase_amount', 'category', 'satisfaction']
    },
    'DATA-2025-002@v1.0': {
      id: 'DATA-2025-002',
      name: '客户行为数据集',
      version: 'v1.0',
      source: '订阅',
      size: '4.8MB',
      fieldCount: 18,
      sampleCount: 23000,
      fields: ['user_id', 'age', 'purchase_amount', 'category', 'satisfaction']
    },
  };

  const parseSizeMB = (size?: string) => {
    if (!size) return 0;
    const m = size.match(/([\d.]+)\s*MB/i);
    return m ? parseFloat(m[1]) : 0;
  };

  const formatSizeMB = (value: number) => {
    if (value >= 1024) {
      return `${(value / 1024).toFixed(1)} GB`;
    }
    return `${value.toFixed(1)} MB`;
  };

  const getDatasetStats = (id?: string, version?: string): DatasetStats | undefined => {
    if (!id || !version) return undefined;
    return datasetStatsRegistry[`${id}@${version}`];
  };

  const aggregatedStats = React.useMemo(() => {
    const entries = task.datasets || [];
    if (!entries || entries.length === 0) return null;
    const statsList = entries
      .map((e) => getDatasetStats(e.id, e.version))
      .filter(Boolean) as DatasetStats[];
    if (statsList.length === 0) return null;

    const datasetCount = statsList.length;
    const totalSamples = statsList.reduce((sum, s) => sum + (s.sampleCount || 0), 0);
    const totalSizeMB = statsList.reduce((sum, s) => sum + parseSizeMB(s.size), 0);
    const union = new Set<string>();
    statsList.forEach((s) => (s.fields || []).forEach((f) => union.add(f)));
    const unionFields = Array.from(union);
    const unionFieldCount = unionFields.length > 0 ? unionFields.length : Math.max(...statsList.map((s) => s.fieldCount));
    const sources = new Set(statsList.map((s) => s.source || '未设置'));
    const sourceLabel = sources.size === 0 ? '未设置' : sources.size === 1 ? Array.from(sources)[0] : '多源融合';

    return {
      datasetCount,
      totalSamples,
      totalSizeMB,
      unionFieldCount,
      sourceLabel,
      unionFields,
      statsList,
    };
  }, [task.datasets]);

  // 测试集真实字段名（最多取5列）：优先使用聚合到的 unionFields，若不足则使用特征权重的字段名补齐
  const testFeatureFieldNames = React.useMemo(() => {
    const uf = (aggregatedStats?.unionFields || []).filter((f) => !/^(?:id|time|date|timestamp)$/i.test(f));
    const base = uf.slice(0, 5);
    if (base.length >= 5) return base;
    const fallback = featureWeights.map((fw) => fw.feature);
    const merged = Array.from(new Set([...base, ...fallback])).slice(0, 5);
    return merged;
  }, [aggregatedStats, featureWeights]);

  // 预测结果表：构造测试集数据（使用真实字段名）与预测结果最后一列
  const forecastingTestSetRows = React.useMemo(() => {
    return forecastSeries.map((p, idx) => {
      // 基于实际值构造示意的特征数值（字段名替换为真实字段名）
      const syntheticVals = [
        p.actual * (1 + (Math.random() - 0.5) * 0.02),
        p.actual * 0.8 + Math.sin(idx / 8) * 2 + (Math.random() - 0.5) * 1.5,
        p.actual * 1.2 + Math.cos(idx / 6) * 1.5 + (Math.random() - 0.5) * 1.5,
        p.actual + (Math.random() - 0.5) * 3,
        p.actual * 0.9 + (Math.random() - 0.5) * 2.5,
      ];
      const featureObj: Record<string, number> = {};
      testFeatureFieldNames.forEach((name, i) => {
        featureObj[name] = Number((syntheticVals[i % syntheticVals.length]).toFixed(2));
      });
      return { time: p.time, actual: p.actual, predicted: p.predicted, dataset: '测试', ...featureObj } as Record<string, any>;
    });
  }, [forecastSeries, testFeatureFieldNames]);

  /**
   * 训练集行（预测结果表用）：结构与测试集相同，新增 dataset 标识为“训练”。
   */
  const forecastingTrainSetRows = React.useMemo(() => {
    return forecastTrainSeries.map((p, idx) => {
      const syntheticVals = [
        p.actual * (1 + (Math.random() - 0.5) * 0.02),
        p.actual * 0.8 + Math.sin(idx / 8) * 2 + (Math.random() - 0.5) * 1.5,
        p.actual * 1.2 + Math.cos(idx / 6) * 1.5 + (Math.random() - 0.5) * 1.5,
        p.actual + (Math.random() - 0.5) * 3,
        p.actual * 0.9 + (Math.random() - 0.5) * 2.5,
      ];
      const featureObj: Record<string, number> = {};
      testFeatureFieldNames.forEach((name, i) => {
        featureObj[name] = Number((syntheticVals[i % syntheticVals.length]).toFixed(2));
      });
      return { time: p.time, actual: p.actual, predicted: p.predicted, dataset: '训练', ...featureObj } as Record<string, any>;
    });
  }, [forecastTrainSeries, testFeatureFieldNames]);

  // 预测结果表分页：默认每页10行
  const [resultPage, setResultPage] = useState<number>(1);
  const pageSize = 10;
  // 合并列表：开关开启时追加训练集数据；否则仅测试集
  const combinedForecastRows = React.useMemo(() => (
    showTrainData ? [...forecastingTestSetRows, ...forecastingTrainSetRows] : forecastingTestSetRows
  ), [showTrainData, forecastingTestSetRows, forecastingTrainSetRows]);
  const totalRows = combinedForecastRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  useEffect(() => {
    // 数据变化时重置到首页
    setResultPage(1);
  }, [totalRows]);
  const startIndex = (resultPage - 1) * pageSize;
  const currentRows = combinedForecastRows.slice(startIndex, startIndex + pageSize);
  // 导出：预测结果表 CSV（utf-8-sig）
  /**
   * 导出预测结果CSV：当显示训练数据时，导出合并后的数据，并增加 dataset 列。
   */
  const handleDownloadForecastCSV = React.useCallback(() => {
    try {
      // 列顺序与表格一致：时间、数据集、测试集真实字段、真实值、预测结果
      const columns: string[] = ['time', 'dataset', ...testFeatureFieldNames, 'actual', 'predicted'];
      const header = columns.join(',');

      // 构造 CSV 行，进行基础的转义处理
      const esc = (v: any) => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        // 如果包含逗号、双引号或换行，则用双引号包裹，并转义其中的双引号
        if (/[,"\n]/.test(s)) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };

      const lines = combinedForecastRows.map((row) => {
        return columns.map((col) => esc(row[col])).join(',');
      });

      const csvContent = [header, ...lines].join('\n');
      // 关键：在内容前添加 BOM，以实现 utf-8-sig
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

      // 生成文件名：taskName 优先，其次使用 id
      const safeName = (task.taskName || task.id || 'forecast_results')
        .replace(/[^a-zA-Z0-9_\-]+/g, '_')
        .slice(0, 60);
      const filename = `forecast_results_${safeName}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出 CSV 失败:', err);
      toast.error('导出 CSV 失败');
    }
  }, [combinedForecastRows, testFeatureFieldNames, task.taskName, task.id]);
  const pageNumbers: Array<number | 'ellipsis'> = React.useMemo(() => {
    const arr: Array<number | 'ellipsis'> = [];
    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i++) arr.push(i);
      return arr;
    }
    arr.push(1, 2);
    if (resultPage > 4) arr.push('ellipsis');
    const start = Math.max(3, resultPage - 1);
    const end = Math.min(pageCount - 2, resultPage + 1);
    for (let i = start; i <= end; i++) arr.push(i);
    if (resultPage < pageCount - 3) arr.push('ellipsis');
    arr.push(pageCount - 1, pageCount);
    return arr;
  }, [pageCount, resultPage]);

  // 多数据集：不同数据集的示例预览数据与字段元信息（模拟）
  const versionFilesRegistry: Record<string, string[]> = {
    'DATA-2025-001@v3.0': ['生产线_主变量.csv', '生产线_协变量_设备功率.csv', '生产线_协变量_环境温度.csv'],
    'DATA-2025-001@v2.0': ['生产线_主变量.csv', '生产线_协变量_设备功率.csv'],
    'DATA-2025-001@v1.0': ['生产线_主变量.csv'],
    'DATA-2025-002@v2.0': ['客户_主变量.csv', '客户_协变量_画像.csv', '客户_交易明细.csv'],
    'DATA-2025-002@v1.0': ['客户_主变量.csv', '客户_交易明细.csv'],
  };
  const mockDatasetSamples: Record<string, Array<Record<string, any>>> = {
    'DATA-2025-001': [
      { id: 1001, temperature: 73.2, pressure: 1.02, defect_rate: 0.015, quality_score: 91 },
      { id: 1002, temperature: 75.1, pressure: 1.01, defect_rate: 0.012, quality_score: 93 },
      { id: 1003, temperature: 71.7, pressure: 1.03, defect_rate: 0.018, quality_score: 88 },
      { id: 1004, temperature: 74.3, pressure: 1.02, defect_rate: 0.017, quality_score: 90 },
      { id: 1005, temperature: 76.0, pressure: 1.00, defect_rate: 0.011, quality_score: 95 },
      { id: 1006, temperature: 72.6, pressure: 1.05, defect_rate: 0.020, quality_score: 86 },
      { id: 1007, temperature: 73.9, pressure: 1.04, defect_rate: 0.013, quality_score: 92 },
      { id: 1008, temperature: 75.5, pressure: 1.02, defect_rate: 0.010, quality_score: 96 },
      { id: 1009, temperature: 71.9, pressure: 1.03, defect_rate: 0.019, quality_score: 87 },
      { id: 1010, temperature: 74.0, pressure: 1.01, defect_rate: 0.016, quality_score: 90 },
    ],
    'DATA-2025-002': [
      { user_id: 'U-001', age: 28, purchase_amount: 219.5, category: '电子', satisfaction: 4 },
      { user_id: 'U-002', age: 35, purchase_amount: 58.2, category: '服饰', satisfaction: 3 },
      { user_id: 'U-003', age: 41, purchase_amount: 430.0, category: '家居', satisfaction: 5 },
      { user_id: 'U-004', age: 23, purchase_amount: 17.9, category: '食品', satisfaction: 2 },
      { user_id: 'U-005', age: 30, purchase_amount: 159.0, category: '电子', satisfaction: 4 },
      { user_id: 'U-006', age: 27, purchase_amount: 98.7, category: '服饰', satisfaction: 3 },
      { user_id: 'U-007', age: 52, purchase_amount: 800.3, category: '家居', satisfaction: 5 },
      { user_id: 'U-008', age: 19, purchase_amount: 12.5, category: '食品', satisfaction: 2 },
      { user_id: 'U-009', age: 33, purchase_amount: 299.9, category: '电子', satisfaction: 4 },
      { user_id: 'U-010', age: 45, purchase_amount: 76.4, category: '服饰', satisfaction: 3 },
    ],
    default: [
      { PassengerId: 1, Survived: 0, Pclass: 3, Name: 'Braund, Mr. Owen Harris', Sex: 'male', Age: 22, SibSp: 1, Parch: 0, Ticket: 'A/5 21171', Fare: 7.25, Cabin: 'N/A', Embarked: 'S' },
      { PassengerId: 2, Survived: 1, Pclass: 1, Name: 'Cumings, Mrs. John Bradley', Sex: 'female', Age: 38, SibSp: 1, Parch: 0, Ticket: 'PC 17599', Fare: 71.2833, Cabin: 'C85', Embarked: 'C' },
      { PassengerId: 3, Survived: 1, Pclass: 3, Name: 'Heikkinen, Miss. Laina', Sex: 'female', Age: 26, SibSp: 0, Parch: 0, Ticket: 'STON/O2. 3101282', Fare: 7.925, Cabin: 'N/A', Embarked: 'S' },
    ],
  };

  const mockFieldMetaById: Record<string, Array<{ name: string; type: string; missing: string }>> = {
    'DATA-2025-001': [
      { name: 'id', type: 'Integer', missing: '0%' },
      { name: 'temperature', type: 'Float', missing: '3%' },
      { name: 'pressure', type: 'Float', missing: '1%' },
      { name: 'defect_rate', type: 'Float', missing: '<1%' },
      { name: 'quality_score', type: 'Integer', missing: '0%' },
    ],
    'DATA-2025-002': [
      { name: 'user_id', type: 'String', missing: '0%' },
      { name: 'age', type: 'Integer', missing: '2%' },
      { name: 'purchase_amount', type: 'Float', missing: '0%' },
      { name: 'category', type: 'Enum', missing: '<1%' },
      { name: 'satisfaction', type: 'Integer', missing: '5%' },
    ],
    default: [
      { name: 'PassengerId', type: 'Integer', missing: '0%' },
      { name: 'Survived', type: 'Integer', missing: '0%' },
      { name: 'Pclass', type: 'Integer', missing: '0%' },
      { name: 'Name', type: 'String', missing: '<1%' },
      { name: 'Sex', type: 'Enum', missing: '0%' },
      { name: 'Age', type: 'Float', missing: '19%' },
      { name: 'Fare', type: 'Float', missing: '0%' },
    ],
  };

  const getSampleRowsForDataset = (id?: string) => {
    if (!id) return mockDatasetSamples.default;
    return mockDatasetSamples[id] || mockDatasetSamples.default;
  };

  const getFieldMetaForDataset = (id?: string) => {
    if (!id) return mockFieldMetaById.default;
    return mockFieldMetaById[id] || mockFieldMetaById.default;
  };

  // 预览表 — 通用工具函数与派生数据
  const isMissingValue = (val: any) => {
    if (val === null || val === undefined) return true;
    if (typeof val === 'number') return Number.isNaN(val);
    if (typeof val === 'string') {
      const s = val.trim();
      return s === '' || s.toLowerCase() === 'n/a';
    }
    return false;
  };

  const rowHasMissing = (row: Record<string, any>) => Object.values(row).some(isMissingValue);

  const getProcessedPreviewRows = () => {
    const curDs = task.datasets?.[datasetPreviewIndex];
    const rows = getSampleRowsForDataset(curDs?.id) || [];
    let data = [...rows];

    // 缺失/唯一筛选
    if (missingOnly) {
      data = data.filter((row) => rowHasMissing(row));
    }
    if (uniqueOnly && uniqueField) {
      const counts = new Map<string, number>();
      rows.forEach((row) => {
        const raw = row[uniqueField];
        const val = raw === null || raw === undefined ? '' : typeof raw === 'string' ? raw.trim() : String(raw);
        if (val !== '' && !(typeof raw === 'number' && Number.isNaN(raw))) {
          counts.set(val, (counts.get(val) || 0) + 1);
        }
      });
      data = data.filter((row) => {
        const raw = row[uniqueField];
        const val = raw === null || raw === undefined ? '' : typeof raw === 'string' ? raw.trim() : String(raw);
        if (val === '' || (typeof raw === 'number' && Number.isNaN(raw))) return false;
        return (counts.get(val) || 0) === 1;
      });
    }

    // 文本搜索（全列）
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      data = data.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(term))
      );
    }

    // 排序
    if (sortColumn) {
      data.sort((a, b) => {
        const av = a[sortColumn as string];
        const bv = b[sortColumn as string];
        const toNum = (x: any) => {
          if (typeof x === 'number') return x;
          const n = Number(x);
          return Number.isNaN(n) ? null : n;
        };
        const an = toNum(av);
        const bn = toNum(bv);
        let cmp = 0;
        if (an !== null && bn !== null) {
          cmp = an - bn;
        } else {
          cmp = String(av).localeCompare(String(bv));
        }
        return sortOrder === 'asc' ? cmp : -cmp;
      });
    }

    return data;
  };

  const getColumnOrder = () => {
    const curDs = task.datasets?.[datasetPreviewIndex];
    const rows = getSampleRowsForDataset(curDs?.id) || [];
    const cols = rows[0] ? Object.keys(rows[0]) : [];
    // 优先使用手动拖拽顺序
    if (columnManualOrder && columnManualOrder.length > 0) {
      const baseSet = new Set(cols);
      const manual = columnManualOrder.filter((c) => baseSet.has(c));
      const rest = cols.filter((c) => !manual.includes(c));
      return [...manual, ...rest];
    }
    if (columnOrderMode === 'asc') return [...cols].sort((a, b) => a.localeCompare(b));
    if (columnOrderMode === 'desc') return [...cols].sort((a, b) => b.localeCompare(a));
    return cols;
  };

  // 当切换数据集或版本时，预填当前版本的第一个文件为预览文件
  useEffect(() => {
    const curDs = task.datasets?.[datasetPreviewIndex];
    if (!curDs) { setSelectedPreviewFile(''); return; }
    const key = `${curDs.id}@${curDs.version}`;
    const files = versionFilesRegistry[key] || curDs.files || [];
    setSelectedPreviewFile(files[0] || '');
  }, [datasetPreviewIndex, task.datasets]);

  // 列宽拖拽与列顺序拖拽
  const startResize = (col: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = (e as any).clientX as number;
    const startWidth = columnWidths[col] ?? headerRefs.current[col]?.getBoundingClientRect().width ?? 100;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const newW = Math.max(60, Math.round((startWidth as number) + delta));
      setColumnWidths((prev) => ({ ...prev, [col]: newW }));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onHeaderDragStart = (col: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/col', col);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onHeaderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onHeaderDrop = (targetCol: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const sourceCol = e.dataTransfer.getData('text/col');
    if (!sourceCol || sourceCol === targetCol) return;
    const current = getColumnOrder();
    const next = current.filter((c) => c !== sourceCol);
    const idx = next.indexOf(targetCol);
    next.splice(idx >= 0 ? idx : next.length, 0, sourceCol);
    setColumnManualOrder(next);
    setColumnOrderMode('original');
  };

  /**
   * 返回详情页状态的显示配置（颜色、图标与中文标签）。
   * 参数：status - 任务状态枚举。
   * 返回值：包含 label、color、icon 的配置对象。
   */
  const getStatusConfig = (status: Task['status']) => {
    const configs = {
      not_started: { label: '未开始', color: 'bg-gray-100 text-gray-800', icon: Circle },
      pending: { label: '排队中', color: 'bg-gray-100 text-gray-800', icon: Clock },
      running: { label: '运行中', color: 'bg-blue-100 text-blue-800', icon: Play },
      completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { label: '失败', color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800', icon: XCircle },
      archived: { label: '已归档', color: 'bg-gray-100 text-gray-600', icon: Archive },
      paused: { label: '已暂停', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
    } as const;
    return (configs as any)[status];
  };

  const getPriorityConfig = (priority: Task['priority']) => {
    const configs = {
      low: { label: '低', color: 'bg-gray-100 text-gray-800' },
      medium: { label: '中', color: 'bg-blue-100 text-blue-800' },
      high: { label: '高', color: 'bg-orange-100 text-orange-800' },
    } as const;
    return configs[priority];
  };

  const getTaskTypeLabel = (type: Task['taskType']) => {
    const labels = {
      classification: '分类',
      regression: '回归',
      clustering: '聚类',
      anomaly_detection: '异常检测',
      forecasting: '时序预测',
      nlp: '自然语言处理',
      computer_vision: '计算机视觉',
    };
    return labels[type];
  };

  useEffect(() => {
    const root = contentRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.getAttribute('id');
          if (id) setActiveSection(id);
        }
      },
      { root, threshold: 0.3, rootMargin: '-64px 0px -40% 0px' }
    );
    if (root) {
      sections.forEach(s => {
        const el = root.querySelector(`#${s.id}`);
        if (el) observer.observe(el);
      });
    }
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const root = contentRef.current;
    if (!root) return;
    const el = root.querySelector(`#${id}`);
    if (el) {
      (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // 参数 JSON 预览内容：按需求展示指定结构
  const parameterJSON = React.useMemo(() => {
    const json = {
      task_info: {
        task_id: 'TASK-20240601-1234',
        task_name: '设备故障预测',
        task_type: 'time_series',
        project_id: 'PROJ-20240501-001',
        create_time: '2024-06-01 10:00:00',
      },
      dataset_config: {
        selected_datasets: [
          { dataset_id: 'DATA-20240520-002', version: 'v2.0', role: 'main_variable' },
          { dataset_id: 'DATA-20240521-003', version: 'v1.0', role: 'covariate' },
        ],
        target_column: '故障等级',
      },
      model_config: {
        selected_models: [
          { model_name: 'Limix', model_id: 'MODEL-20240401-001', source: 'self_developed' },
          { model_name: 'XGBoost', model_id: 'MODEL-20240402-002', source: 'third_party' },
        ],
        hyper_parameters: {
          context_length: 100,
          predict_length: 50,
          step: 10,
          predict_start_time: '2024-06-01 00:00:00',
        },
      },
      resource_config: {
        resource_type: 'GPU',
        quota: { cpu_cores: 8, memory_gb: 64, gpu_cards: 2, max_runtime_hours: 24 },
      },
    };
    return JSON.stringify(json, null, 2);
  }, []);

  const handleExportParamsJson = () => {
    const blob = new Blob([parameterJSON], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task_${task.id}_params.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportModelYaml = () => {
    const blob = new Blob([MODEL_CONFIG_YAML_SAMPLE], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model_config.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导出HTML/PDF（包含指标与因果区）
  const handleExportHTML = () => {
    const resultsHTML = resultsRef.current?.innerHTML || '';
    const causalHTML = causalRef.current?.innerHTML || '';
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>任务${task.id} 报告</title><style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji";padding:24px;}
      h1{font-size:20px;margin-bottom:8px} h2{font-size:16px;margin:20px 0 8px}
      .section{margin-bottom:24px;border-top:1px solid #eee;padding-top:12px}
      svg{max-width:100%}
    </style></head><body>
      <h1>任务报告 - ${task.taskName}</h1>
      <div class="section"><h2>指标与可视化</h2>${resultsHTML}</div>
      <div class="section"><h2>因果解释</h2>${causalHTML}</div>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task_${task.id}_report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const resultsHTML = resultsRef.current?.innerHTML || '';
    const causalHTML = causalRef.current?.innerHTML || '';
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>任务${task.id} 报告</title><style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; padding:24px;}
      h1{font-size:20px;margin-bottom:8px} h2{font-size:16px;margin:20px 0 8px}
      .section{margin-bottom:24px;border-top:1px solid #eee;padding-top:12px}
      svg{max-width:100%}
      @page { size: A4; margin: 16mm; }
    </style></head><body>
      <h1>任务报告 - ${task.taskName}</h1>
      <div class="section"><h2>指标与可视化</h2>${resultsHTML}</div>
      <div class="section"><h2>因果解释</h2>${causalHTML}</div>
    </body></html>`;
    const printWin = window.open('', 'printWindow');
    if (!printWin) return;
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    // 等待渲染后打印
    setTimeout(() => {
      printWin.print();
    }, 300);
  };

  const handleExportCausalCSV = () => {
    const factorLabels = ['温度_均值', '压力_方差', '设备功率', '环境湿度', '质量评分', '历史缺陷率', '维护间隔', '设备老化指数', '能耗比', '设备震动', '生产节拍', '人员工时'];
    const rows = 20;
    const val = (r: number, c: number) => Math.sin(r * 0.25) + Math.cos(c * 0.45);
    const scores = factorLabels.map((_, c) => {
      let s = 0;
      for (let r = 0; r < rows; r++) s += Math.abs(val(r, c));
      return s;
    });
    const max = Math.max(...scores) || 1;
    const normalized = scores.map((s) => (s / max));
    const header = factorLabels.join(',');
    const row = normalized.map((x) => x.toFixed(6)).join(',');
    const csv = `${header}\n${row}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feature_attention_score_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 与任务列表统一的操作执行与确认逻辑
  const performNetworkAction = async (action: string, taskId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const failRate = 0.15;
    if (Math.random() < failRate) {
      throw new Error('网络请求失败，请稍后重试');
    }
  };

  /**
   * 详情页执行任务操作（前端模拟，仅提示与导出）。
   * 参数：
   *  - action: 操作键（start/stop/retry/rerun/cancel_queue/archive/delete/export/...）。
   *  - taskId: 目标任务ID。
   * 返回值：无（toast 反馈与弹窗关闭）。
   */
  const executeTaskAction = async (action: string, taskId: string) => {
    setLoadingAction(`${taskId}:${action}`);
    try {
      await performNetworkAction(action, taskId);
      if (action === 'start') {
        // 本地立即反映为运行中
        applyTaskOverrides({ status: 'running', progress: typeof task.progress === 'number' ? task.progress : 5 });
        toast.success('任务已开始');
      } else if (action === 'stop') {
        // 本地立即反映为已取消
        applyTaskOverrides({ status: 'cancelled' });
        toast.success('任务已停止');
      } else if (action === 'retry') {
        // 本地立即反映为排队中
        applyTaskOverrides({ status: 'pending', progress: undefined });
        toast.success('任务已进入排队');
      } else if (action === 'rerun') {
        // 本地立即反映为排队中
        applyTaskOverrides({ status: 'pending', progress: undefined });
        toast.success('任务已进入排队');
      } else if (action === 'cancel_queue') {
        // 取消排队后：标记 hasQueuedBefore=true，使“未开始”状态显示“重新运行”
        applyTaskOverrides({ status: 'not_started', progress: undefined, hasQueuedBefore: true });
        toast.success('已取消排队，任务回到未开始状态');
      } else if (action === 'archive') {
        // 本地立即反映为已归档
        applyTaskOverrides({ status: 'archived' });
        toast.success('任务已归档');
      } else if (action === 'delete') {
        toast.success('任务已删除');
      } else if (action === 'copy') {
        toast.success('已创建任务副本');
      } else if (action === 'export') {
        // 细化到“导出参数 JSON”，保持与列表页的导出示例一致
        handleExportParamsJson();
        toast.success('已导出任务详情');
      } else {
        toast.success('操作完成');
      }
    } catch (err: any) {
      const msg = err?.message || '操作失败';
      toast.error(msg);
    } finally {
      setLoadingAction(null);
      setConfirmDialog({ isOpen: false, action: '', taskId: '', taskName: '' });
    }
  };

  const handleCancelConfirm = () => {
    setConfirmDialog({ isOpen: false, action: '', taskId: '', taskName: '' });
  };

  /**
   * 详情页操作触发：需要确认的操作先弹确认框，其它直接执行。
   * 参数：action - 操作键；taskId - 任务ID。
   * 返回值：无。
   */
  const handleTaskAction = (action: string, taskId: string) => {
    if (['start', 'stop', 'archive', 'retry', 'rerun', 'cancel_queue', 'delete'].includes(action.trim())) {
      setConfirmDialog({ isOpen: true, action: action.trim(), taskId, taskName: task.taskName });
    } else {
      executeTaskAction(action.trim(), taskId);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Accordion type="multiple" value={expandedSections} onValueChange={setExpandedSections}>
        <AccordionItem value="basic-info">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              基本信息
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  任务概要
                </CardTitle>
                <CardDescription>紧凑展示核心信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">任务名称</p>
                    <p className="font-medium">{task.taskName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">任务ID</p>
                    <p className="font-mono font-medium">{task.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">任务类型</p>
                    <Badge variant="outline" className="mt-1">{getTaskTypeLabel(task.taskType)}</Badge>
                  </div>
                  <div>
                    <p className="text-gray-600">状态</p>
                    <div className="flex items-center gap-2 mt-1">
                      {React.createElement(getStatusConfig(computedTask.status).icon, { className: "h-4 w-4" })}
                      <Badge className={getStatusConfig(computedTask.status).color}>{getStatusConfig(computedTask.status).label}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">优先级</p>
                    <Badge className={`${getPriorityConfig(task.priority).color} mt-1`}>{getPriorityConfig(task.priority).label}</Badge>
                  </div>
                  <div>
                    <p className="text-gray-600">创建者</p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{task.createdBy}</span>
                    </div>
                  </div>
                  {task.datasets && task.datasets.length > 0 ? (
                    <div className="col-span-2">
                      <p className="text-gray-600">已关联数据集（多选）</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {task.datasets.map((ds) => (
                          <Badge key={ds.id} variant="secondary" className="flex items-center space-x-2">
                            <span>{ds.name}</span>
                            <span className="text-xs text-gray-500">{ds.version}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-gray-600">数据集名称</p>
                        <p className="font-medium">{task.datasetName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">数据集ID + 版本号</p>
                        <p className="font-mono font-medium">{task.datasetVersion}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-gray-600">来源</p>
                    <p className="font-medium">上传</p>
                  </div>
                  <div>
                    <p className="text-gray-600">资源</p>
                    <p className="font-medium">GPU</p>
                  </div>
                  <div>
                    <p className="text-gray-600">配额</p>
                    <p className="font-medium">2 vGPU / 16GB</p>
                  </div>
                </div>
                {task.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">任务描述</p>
                    <p className="text-gray-900 leading-relaxed mt-1">{task.description}</p>
                  </div>
                )}
                {/* 状态轨迹：排队 → 运行中 → 完成/失败 */}
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-2">状态轨迹</p>
                  <div className="flex items-center">
                    {/* 排队 */}
                    <div className="flex flex-col items-center w-32">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${task.status === 'pending' ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200'}`}>
                        <Clock className={`h-4 w-4 ${task.status === 'pending' ? 'text-gray-700' : 'text-gray-500'}`} />
                      </div>
                      <span className="mt-1 text-xs text-gray-700">排队</span>
                      <span className="mt-1 text-[11px] text-gray-500 font-mono">{task.createdAt}</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                    {/* 运行中 */}
                    <div className="flex flex-col items-center w-32">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${task.status === 'running' ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
                        <Play className={`h-4 w-4 ${task.status === 'running' ? 'text-blue-700' : 'text-gray-500'}`} />
                      </div>
                      <span className={`mt-1 text-xs ${task.status === 'running' ? 'text-blue-700' : 'text-gray-700'}`}>运行中</span>
                      <span className="mt-1 text-[11px] text-gray-500 font-mono">{task.estimatedTime || '预计耗时未知'}</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                    {/* 完成/失败 */}
                    <div className="flex flex-col items-center w-32">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${task.status === 'completed' ? 'bg-green-100 border-green-300' : task.status === 'failed' ? 'bg-red-100 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
                        {task.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-700" />
                        ) : task.status === 'failed' ? (
                          <XCircle className="h-4 w-4 text-red-700" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <span className="mt-1 text-xs text-gray-700">{task.status === 'failed' ? '失败' : '完成'}</span>
                      <span className="mt-1 text-[11px] text-gray-500 font-mono">{task.actualTime || '-'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* 数据集和模型信息（已移除） */}

        {/* 执行进度（已移除） */}
      </Accordion>
    </div>
  );

  const renderMetricsTab = () => (
    <div className="space-y-6">
      {task.taskType === TASK_TYPES.classification ? (
        <>
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>分类任务指标报表</CardTitle>
                <CardDescription>支持 micro / macro / weighted 平均</CardDescription>
              </div>
              <div className="w-48">
                <Select value={avgMethod} onValueChange={(v: 'micro' | 'macro' | 'weighted') => setAvgMethod(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择平均方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="micro">micro</SelectItem>
                    <SelectItem value="macro">macro</SelectItem>
                    <SelectItem value="weighted">weighted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { key: 'Accuracy', test: classificationMetrics.accuracy, train: trainClassificationMetrics.accuracy },
                  { key: 'Precision', test: classificationMetrics.precision[avgMethod], train: trainClassificationMetrics.precision[avgMethod] },
                  { key: 'Recall', test: classificationMetrics.recall[avgMethod], train: trainClassificationMetrics.recall[avgMethod] },
                  { key: 'F1-score', test: classificationMetrics.f1[avgMethod], train: trainClassificationMetrics.f1[avgMethod] },
                  { key: 'ROC-AUC', test: classificationMetrics.roc_auc[avgMethod], train: trainClassificationMetrics.roc_auc[avgMethod] },
                ].map((item) => (
                  <Card key={item.key} className="border-gray-200">
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-600">{item.key}</p>
                      <p className="text-xl font-bold text-gray-900">{(item.test * 100).toFixed(1)}% <span className="text-sm font-medium text-gray-500">(测试)</span></p>
                      {showTrainData && (
                        <p className="text-base font-semibold text-purple-700 mt-1">{(item.train * 100).toFixed(1)}% <span className="text-xs font-medium text-purple-600">(训练)</span></p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>ROC 曲线</CardTitle>
              <CardDescription>多分类每一类 + micro/macro 平均</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-64"
                config={{
                  A: { label: 'Class A', color: 'hsl(210 90% 55%)' },
                  B: { label: 'Class B', color: 'hsl(280 80% 55%)' },
                  C: { label: 'Class C', color: 'hsl(20 80% 55%)' },
                  macro: { label: 'Macro Avg', color: 'hsl(150 70% 45%)' },
                  micro: { label: 'Micro Avg', color: 'hsl(45 85% 45%)' },
                }}
              >
                <LineChart data={classificationRocData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fpr" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Line type="monotone" dataKey="A" stroke="var(--color-A)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="B" stroke="var(--color-B)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="C" stroke="var(--color-C)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="macro" stroke="var(--color-macro)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="micro" stroke="var(--color-micro)" dot={false} strokeWidth={2} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>Precision-Recall 曲线</CardTitle>
              <CardDescription>不同阈值下模型表现</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-64"
                config={{
                  A: { label: 'Class A', color: 'hsl(210 90% 55%)' },
                  B: { label: 'Class B', color: 'hsl(280 80% 55%)' },
                  C: { label: 'Class C', color: 'hsl(20 80% 55%)' },
                  macro: { label: 'Macro Avg', color: 'hsl(150 70% 45%)' },
                  micro: { label: 'Micro Avg', color: 'hsl(45 85% 45%)' },
                }}
              >
                <LineChart data={classificationPRData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="recall" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Line type="monotone" dataKey="A" stroke="var(--color-A)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="B" stroke="var(--color-B)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="C" stroke="var(--color-C)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="macro" stroke="var(--color-macro)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="micro" stroke="var(--color-micro)" dot={false} strokeWidth={2} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>混淆矩阵</CardTitle>
              <CardDescription>真实标签 vs 预测结果</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const maxVal = Math.max(...confusionMatrix.values.flat());
                return (
                  <div className="overflow-auto">
                    <div className="inline-grid" style={{ gridTemplateColumns: `120px repeat(${confusionMatrix.labels.length}, 80px)` }}>
                      <div className="font-medium text-gray-700 flex items-center">真实/预测</div>
                      {confusionMatrix.labels.map((l) => (
                        <div key={l} className="text-center text-sm text-gray-600">{l}</div>
                      ))}
                      {confusionMatrix.labels.map((rowLabel, i) => (
                        <React.Fragment key={rowLabel}>
                          <div className="text-sm font-medium text-gray-600 flex items-center">{rowLabel}</div>
                          {confusionMatrix.values[i].map((v, j) => {
                            const ratio = v / maxVal;
                            const bg = `rgba(59, 130, 246, ${0.15 + ratio * 0.7})`;
                            return (
                              <div key={`${i}-${j}`} className="flex items-center justify-center border border-gray-200" style={{ background: bg }}>
                                <span className="text-sm font-medium">{v}</span>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>模型对比</CardTitle>
                <CardDescription>按指标查看不同模型的表现</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-48">
                  <Select value={clsCompareMetric} onValueChange={(v: 'accuracy' | 'f1_macro' | 'roc_auc_macro') => setClsCompareMetric(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择指标" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accuracy">Accuracy</SelectItem>
                      <SelectItem value="f1_macro">F1 Macro</SelectItem>
                      <SelectItem value="roc_auc_macro">ROC-AUC Macro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={compareChartType === 'bar' ? 'default' : 'outline'} onClick={() => setCompareChartType('bar')}>柱状</Button>
                  <Button size="sm" variant={compareChartType === 'line' ? 'default' : 'outline'} onClick={() => setCompareChartType('line')}>折线</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ metric: { label: 'Metric', color: 'hsl(210 90% 55%)' } }}>
                {compareChartType === 'bar' ? (
                  <BarChart data={classificationModelComparison} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" tickLine={false} />
                    <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Bar dataKey={clsCompareMetric} fill="var(--color-metric)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                ) : (
                  <LineChart data={classificationModelComparison} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" tickLine={false} />
                    <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Line type="monotone" dataKey={clsCompareMetric} stroke="var(--color-metric)" dot />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </LineChart>
                )}
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
              <CardHeader>
                <CardTitle>学习曲线（Accuracy）</CardTitle>
                <CardDescription>训练与验证准确率随Epoch变化</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-64" config={{
                  train_acc: { label: 'Train Accuracy', color: 'hsl(210 90% 55%)' },
                  val_acc: { label: 'Validation Accuracy', color: 'hsl(150 70% 45%)' },
                }}>
                  <LineChart data={trainingHistory} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" tickLine={false} />
                    <YAxis domain={[0.5, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Line type="monotone" dataKey="train_acc" stroke="var(--color-train_acc)" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="val_acc" stroke="var(--color-val_acc)" dot={false} strokeWidth={2} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
              <CardHeader>
                <CardTitle>损失曲线（Loss）</CardTitle>
                <CardDescription>训练与验证损失随Epoch变化</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-64" config={{
                  train_loss: { label: 'Train Loss', color: 'hsl(8 80% 55%)' },
                  val_loss: { label: 'Validation Loss', color: 'hsl(45 85% 45%)' },
                }}>
                  <AreaChart data={trainingHistory} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" tickLine={false} />
                    <YAxis domain={[0, 1]} />
                    <Area type="monotone" dataKey="train_loss" stroke="var(--color-train_loss)" fill="var(--color-train_loss)" fillOpacity={0.15} dot={false} strokeWidth={2} />
                    <Area type="monotone" dataKey="val_loss" stroke="var(--color-val_loss)" fill="var(--color-val_loss)" fillOpacity={0.15} dot={false} strokeWidth={2} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : task.taskType === TASK_TYPES.forecasting ? (
        <>
          {/* 指标报表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { key: 'MSE（均方误差）', val: forecastingMetrics.mse },
              { key: 'RMSE（均方根误差）', val: forecastingMetrics.rmse },
              { key: 'MAE（平均绝对误差）', val: forecastingMetrics.mae },
              { key: 'MAPE（平均绝对百分比误差）', val: forecastingMetrics.mape * 100 },
              { key: 'R²（决定系数）', val: forecastingMetrics.r2 * 100 },
            ].map((item) => (
              <Card key={item.key} className="transition-all duration-200 hover:shadow-md border-gray-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600">{item.key}</p>
                  <p className="text-2xl font-bold">{item.key.includes('R²') || item.key.includes('MAPE') ? `${item.val.toFixed(2)}%` : Number(item.val).toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 指标趋势折线图：RMSE & MAPE (%) */}
          {/* 预测结果表：展示测试集数据与预测结果（最后一列） */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle>预测结果表</CardTitle>
                  <CardDescription>最后一列为预测结果，前面的列为测试集的实际字段（默认每页 10 行，可分页查看更多）</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">显示训练数据</span>
                    <Switch checked={showTrainData} onCheckedChange={(checked) => setShowTrainData(Boolean(checked))} />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDownloadForecastCSV} className="shrink-0">
                    <Download className="mr-2 h-4 w-4" />
                    导出 CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-auto" style={{ contentVisibility: 'auto' }}>
                <Table className="min-w-[1040px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 bg-white z-10 whitespace-nowrap">时间</TableHead>
                      <TableHead className="sticky top-0 bg-white z-10 whitespace-nowrap">数据集</TableHead>
                      {testFeatureFieldNames.map((name) => (
                        <TableHead key={name} className="sticky top-0 bg-white z-10 whitespace-nowrap">{name}</TableHead>
                      ))}
                      {/* 固定右侧的两列：真实值、预测结果 */}
                      <TableHead
                        className="sticky top-0 bg-slate-50 z-20 whitespace-nowrap text-right border-l border-gray-200 w-32"
                        style={{ right: '8rem' }}
                      >
                        真实值
                      </TableHead>
                      <TableHead
                        className="sticky top-0 bg-slate-100 z-30 whitespace-nowrap text-right w-32"
                        style={{ right: 0 }}
                      >
                        预测结果
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRows.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-gray-700 whitespace-nowrap">{row.time}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={row.dataset === '训练' ? 'secondary' : 'default'} className={row.dataset === '训练' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}>
                            {row.dataset ?? '测试'}
                          </Badge>
                        </TableCell>
                        {testFeatureFieldNames.map((name) => (
                          <TableCell key={name} className="text-right">{Number(row[name]).toFixed(2)}</TableCell>
                        ))}
                        {/* 固定右侧的两列：真实值、预测结果 */}
                        <TableCell
                          className="sticky bg-slate-50 text-right border-l border-gray-200 w-32"
                          style={{ right: '8rem' }}
                        >
                          {row.actual.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className="sticky bg-slate-100 text-right font-medium w-32"
                          style={{ right: 0 }}
                        >
                          {row.predicted.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* 分页器 */}
              <div className="mt-3">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        size="default"
                        onClick={(e) => { e.preventDefault(); setResultPage(Math.max(1, resultPage - 1)); }}
                      />
                    </PaginationItem>
                    {pageNumbers.map((p, i) => (
                      p === 'ellipsis' ? (
                        <PaginationItem key={`el-${i}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href="#"
                            isActive={p === resultPage}
                            size="default"
                            onClick={(e) => { e.preventDefault(); setResultPage(p as number); }}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        size="default"
                        onClick={(e) => { e.preventDefault(); setResultPage(Math.min(pageCount, resultPage + 1)); }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>

          {/* 指标趋势折线图：RMSE & MAPE (%) */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>指标趋势</CardTitle>
              <CardDescription>RMSE 与 MAPE 随时间变化（示意）</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={showTrainData ? {
                RMSE: { label: 'RMSE(测试)', color: 'hsl(210 90% 55%)' },
                MAPE: { label: 'MAPE(测试) (%)', color: 'hsl(120 70% 45%)' },
                RMSE_train: { label: 'RMSE(训练)', color: 'hsl(210 60% 65%)' },
                MAPE_train: { label: 'MAPE(训练) (%)', color: 'hsl(120 50% 60%)' },
              } : {
                RMSE: { label: 'RMSE', color: 'hsl(210 90% 55%)' },
                MAPE: { label: 'MAPE (%)', color: 'hsl(120 70% 45%)' },
              }}>
                <LineChart data={combinedMetricTrend} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tickLine={false} />
                  <YAxis />
                  <Line type="monotone" dataKey="RMSE" stroke="var(--color-RMSE)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="MAPE" stroke="var(--color-MAPE)" dot={false} strokeWidth={2} />
                  {/* 训练集：使用虚线区分 */}
                  <Line type="monotone" dataKey="RMSE_train" stroke="var(--color-RMSE_train)" dot={false} strokeDasharray="5 3" />
                  <Line type="monotone" dataKey="MAPE_train" stroke="var(--color-MAPE_train)" dot={false} strokeDasharray="5 3" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 时序预测折线图：真实值 / 预测值 / CI 上下界 */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>时序预测曲线</CardTitle>
              <CardDescription>展示真实值、预测值与区间上下界</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={showTrainData ? {
                actual: { label: '真实值(测试)', color: 'hsl(210 90% 55%)' },
                predicted: { label: '预测值(测试)', color: 'hsl(120 70% 45%)' },
                ciUpper: { label: 'CI上界', color: 'hsl(20 80% 55%)' },
                ciLower: { label: 'CI下界', color: 'hsl(8 80% 55%)' },
                train_actual: { label: '真实值(训练)', color: 'hsl(210 60% 65%)' },
                train_predicted: { label: '预测值(训练)', color: 'hsl(120 50% 60%)' },
              } : {
                actual: { label: '真实值', color: 'hsl(210 90% 55%)' },
                predicted: { label: '预测值', color: 'hsl(120 70% 45%)' },
                ciUpper: { label: 'CI上界', color: 'hsl(20 80% 55%)' },
                ciLower: { label: 'CI下界', color: 'hsl(8 80% 55%)' },
              }}>
                <LineChart data={combinedForecastLineData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tickLine={false} />
                  <YAxis />
                  <Line type="monotone" dataKey="actual" stroke="var(--color-actual)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="predicted" stroke="var(--color-predicted)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="ciUpper" stroke="var(--color-ciUpper)" dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="ciLower" stroke="var(--color-ciLower)" dot={false} strokeDasharray="4 4" />
                  {/* 训练集：使用虚线区分 */}
                  <Line type="monotone" dataKey="train_actual" stroke="var(--color-train_actual)" dot={false} strokeDasharray="5 3" />
                  <Line type="monotone" dataKey="train_predicted" stroke="var(--color-train_predicted)" dot={false} strokeDasharray="5 3" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 预测值 vs 真实值散点图 */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>预测值 vs 真实值散点图</CardTitle>
              <CardDescription>用于直观比较预测与实际情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ scatter: { label: '测试集', color: 'hsl(210 90% 55%)' } }}>
                <ScatterChart margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="actual" name="Actual" />
                  <YAxis type="number" dataKey="pred" name="Predicted" />
                  <ZAxis type="number" range={[60, 60]} />
                  <Scatter data={forecastingPredVsActual} fill="var(--color-scatter)" />
                  {/* 训练集散点：颜色更浅并使用不同图例标签 */}
                  {showTrainData && (
                    <Scatter data={forecastingTrainPredVsActual} fill="hsl(210 60% 70%)" />
                  )}
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 200, y: 200 }]} stroke="#8884d8" strokeDasharray="4 4" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 残差图 */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>残差图（Residual Plot）</CardTitle>
              <CardDescription>横坐标为预测值，纵坐标为残差</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ residual: { label: '测试集', color: 'hsl(8 80% 55%)' } }}>
                <ScatterChart margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="pred" name="Predicted" />
                  <YAxis type="number" dataKey="residual" name="Residual" />
                  <Scatter data={forecastingResiduals} fill="var(--color-residual)" />
                  {showTrainData && (
                    <Scatter data={forecastingTrainResiduals} fill="hsl(8 60% 70%)" />
                  )}
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 误差分布直方图 */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>误差分布直方图</CardTitle>
              <CardDescription>展示预测误差的分布情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={showTrainData ? {
                testCount: { label: '测试集', color: 'hsl(210 90% 55%)' },
                trainCount: { label: '训练集', color: 'hsl(270 70% 55%)' },
              } : { count: { label: 'Error Count', color: 'hsl(210 90% 55%)' } }}>
                <BarChart data={forecastingErrorHistogram} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bin" tickLine={false} />
                  <YAxis />
                  {/* 当显示训练数据时，分栏对比展示 */}
                  {showTrainData ? (
                    <>
                      <Bar dataKey="testCount" fill="var(--color-testCount)" />
                      <Bar dataKey="trainCount" fill="var(--color-trainCount)" />
                    </>
                  ) : (
                    <Bar dataKey="count" fill="var(--color-count)" />
                  )}
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 偏差统计（正负相对偏差 / 正负绝对偏差） */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>偏差统计</CardTitle>
              <CardDescription>正负相对偏差（±10%、±20%）与正负绝对偏差（±10、±20）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">相对偏差</p>
                  <div className="grid grid-cols-3 gap-3">
                    {deviationStats.relative.map((d) => (
                      <Card key={`rel-${d.threshold}`} className="border-gray-200">
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-500">±{(d.threshold * 100).toFixed(0)}%</p>
                          <div className="text-sm text-gray-700 mt-1">在范围内：{(d.withinRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">正向超阈：{(d.posRate * 100).toFixed(1)}% | 负向超阈：{(d.negRate * 100).toFixed(1)}%</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">绝对偏差</p>
                  <div className="grid grid-cols-3 gap-3">
                    {deviationStats.absolute.map((d) => (
                      <Card key={`abs-${d.threshold}`} className="border-gray-200">
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-500">±{d.threshold}</p>
                          <div className="text-sm text-gray-700 mt-1">在范围内：{(d.withinRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">正向超阈：{(d.posRate * 100).toFixed(1)}% | 负向超阈：{(d.negRate * 100).toFixed(1)}%</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 模型对比 */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>模型对比</CardTitle>
                <CardDescription>多模型并行时对比不同指标</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-48">
                  <Select value={fctCompareMetric} onValueChange={(v: 'rmse' | 'mae' | 'mape' | 'r2') => setFctCompareMetric(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择指标" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rmse">RMSE</SelectItem>
                      <SelectItem value="mae">MAE</SelectItem>
                      <SelectItem value="mape">MAPE</SelectItem>
                      <SelectItem value="r2">R²</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={compareChartType === 'bar' ? 'default' : 'outline'} onClick={() => setCompareChartType('bar')}>柱状</Button>
                  <Button size="sm" variant={compareChartType === 'line' ? 'default' : 'outline'} onClick={() => setCompareChartType('line')}>折线</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ metric: { label: 'Metric', color: 'hsl(210 90% 55%)' } }}>
                {compareChartType === 'bar' ? (
                  <BarChart data={forecastingModelComparison} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" tickLine={false} />
                    <YAxis tickFormatter={(v) => fctCompareMetric === 'r2' ? `${(v * 100).toFixed(0)}%` : fctCompareMetric === 'mape' ? `${(v * 100).toFixed(0)}%` : `${v}`} />
                    <Bar dataKey={fctCompareMetric} fill="var(--color-metric)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                ) : (
                  <LineChart data={forecastingModelComparison} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" tickLine={false} />
                    <YAxis tickFormatter={(v) => fctCompareMetric === 'r2' ? `${(v * 100).toFixed(0)}%` : fctCompareMetric === 'mape' ? `${(v * 100).toFixed(0)}%` : `${v}`} />
                    <Line type="monotone" dataKey={fctCompareMetric} stroke="var(--color-metric)" dot />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </LineChart>
                )}
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 自定义指标（p-范数） */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>自定义指标</CardTitle>
                <CardDescription>p-范数误差（p=1 为 MAE，p=2 为 RMSE）</CardDescription>
              </div>
              <div className="w-40">
                <Input type="number" step="0.1" min={0.1} max={10} value={customP} onChange={(e) => setCustomP(Number(e.target.value))} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700">当前 p = {customP}，值：<span className="font-semibold">{customMetricValue.toFixed(3)}</span></div>
            </CardContent>
          </Card>
        </>
      ) : task.taskType === TASK_TYPES.regression ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'MSE', val: regressionMetrics.mse },
              { key: 'RMSE', val: regressionMetrics.rmse },
              { key: 'MAE', val: regressionMetrics.mae },
              { key: 'R²', val: regressionMetrics.r2 },
            ].map((item) => (
              <Card key={item.key} className="transition-all duration-200 hover:shadow-md border-gray-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600">{item.key}</p>
                  <p className="text-2xl font-bold">{item.key === 'R²' ? (item.val * 100).toFixed(1) + '%' : Number(item.val).toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>预测值 vs 真实值</CardTitle>
              <CardDescription>直观比较模型预测与实际情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ scatter: { label: 'Points', color: 'hsl(210 90% 55%)' } }}>
                <ScatterChart margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="actual" name="Actual" />
                  <YAxis type="number" dataKey="pred" name="Predicted" />
                  <ZAxis type="number" range={[60, 60]} />
                  <Scatter data={regressionPredictions} fill="var(--color-scatter)" />
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 130, y: 130 }]} stroke="#8884d8" strokeDasharray="4 4" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>残差图</CardTitle>
              <CardDescription>横坐标为预测值，纵坐标为残差</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ residual: { label: 'Residual', color: 'hsl(8 80% 55%)' } }}>
                <ScatterChart margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="pred" name="Predicted" />
                  <YAxis type="number" dataKey="residual" name="Residual" />
                  <Scatter data={regressionResiduals} fill="var(--color-residual)" />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>误差分布直方图</CardTitle>
              <CardDescription>展示预测误差的分布情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ hist: { label: 'Error Count', color: 'hsl(210 90% 55%)' } }}>
                <BarChart data={errorHistogram} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bin" tickLine={false} />
                  <YAxis />
                  <Bar dataKey="count" fill="var(--color-hist)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>模型对比</CardTitle>
                <CardDescription>不同模型在所选指标下的表现</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-48">
                  <Select value={regCompareMetric} onValueChange={(v: 'mse' | 'rmse' | 'mae' | 'r2') => setRegCompareMetric(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择指标" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mse">MSE</SelectItem>
                      <SelectItem value="rmse">RMSE</SelectItem>
                      <SelectItem value="mae">MAE</SelectItem>
                      <SelectItem value="r2">R²</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={compareChartType === 'bar' ? 'default' : 'outline'} onClick={() => setCompareChartType('bar')}>柱状</Button>
                  <Button size="sm" variant={compareChartType === 'line' ? 'default' : 'outline'} onClick={() => setCompareChartType('line')}>折线</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ metric: { label: 'Metric', color: 'hsl(210 90% 55%)' } }}>
                {compareChartType === 'bar' ? (
                  <BarChart data={regressionModelComparison} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" tickLine={false} />
                    <YAxis tickFormatter={(v) => regCompareMetric === 'r2' ? `${(v * 100).toFixed(0)}%` : `${v}`} />
                    <Bar dataKey={regCompareMetric} fill="var(--color-metric)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                ) : (
                  <LineChart data={regressionModelComparison} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" tickLine={false} />
                    <YAxis tickFormatter={(v) => regCompareMetric === 'r2' ? `${(v * 100).toFixed(0)}%` : `${v}`} />
                    <Line type="monotone" dataKey={regCompareMetric} stroke="var(--color-metric)" dot />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </LineChart>
                )}
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
          <CardHeader>
            <CardTitle>任务类型暂不支持详细结果展示</CardTitle>
            <CardDescription>当前仅针对 分类 / 回归 / 时序预测 任务提供结果展示</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">请创建分类或回归任务以体验完整的结果可视化。</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // 下载执行日志为本地文本文件
  const handleDownloadLogs = () => {
    const content = mockLogs
      .map((log) => `[${log.timestamp}] ${log.level.toUpperCase()} - ${log.message}`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task_${task.id}_logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderLogsTab = () => (
    <div className="space-y-6">
      <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              执行日志
            </CardTitle>
            <CardDescription>任务执行过程中的详细日志记录</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={handleDownloadLogs}
          >
            <Download className="h-4 w-4 mr-2" />
            下载日志
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {mockLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${log.level === 'error' ? 'bg-red-500' :
                  log.level === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 font-mono">{log.timestamp}</span>
                    <Badge variant="outline" className={`text-xs ${log.level === 'error' ? 'border-red-200 text-red-700' :
                      log.level === 'warning' ? 'border-yellow-200 text-yellow-700' :
                        'border-green-200 text-green-700'
                      }`}>
                      {log.level.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-900">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* 参数 JSON 预览卡片已移至“任务产物”区 */}
    </div>
  );

  const renderArtifactsTab = () => (
    <div className="space-y-6">
      <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            任务产物
          </CardTitle>
          <CardDescription>任务执行生成的文件和资源</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>文件名</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockArtifacts.map((artifact, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{artifact.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{artifact.type}</Badge>
                  </TableCell>
                  <TableCell>{artifact.size}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="transition-all duration-200 hover:bg-blue-50 hover:border-blue-200"
                        disabled={loadingAction === `download-${index}`}
                        onClick={() => {
                          if (artifact.name === 'task_params.json') {
                            // 直接导出参数 JSON
                            handleExportParamsJson();
                            return;
                          }
                          if (artifact.name === 'model_config.yaml') {
                            // 导出模型配置 YAML
                            handleExportModelYaml();
                            return;
                          }
                          setLoadingAction(`download-${index}`);
                          setTimeout(() => setLoadingAction(null), 1500);
                        }}
                      >
                        {loadingAction === `download-${index}` ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        下载
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="transition-all duration-200 hover:bg-green-50 hover:border-green-200"
                        disabled={loadingAction === `preview-${index}`}
                        onClick={() => {
                          setLoadingAction(`preview-${index}`);
                          if (artifact.name === 'task_params.json') {
                            // 打开参数 JSON 的预览弹窗
                            setArtifactPreviewName(artifact.name);
                            setArtifactPreviewType('json');
                            setArtifactPreviewContent(parameterJSON);
                            setArtifactPreviewOpen(true);
                          } else if (artifact.name === 'model_config.yaml') {
                            // 打开 YAML 预览弹窗
                            setArtifactPreviewName(artifact.name);
                            setArtifactPreviewType('yaml');
                            setArtifactPreviewContent(MODEL_CONFIG_YAML_SAMPLE);
                            setArtifactPreviewOpen(true);
                          }
                          setTimeout(() => setLoadingAction(null), 1000);
                        }}
                      >
                        {loadingAction === `preview-${index}` ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4 mr-1" />
                        )}
                        预览
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* 参数 JSON 回显卡片按需求移除 */}

      {/* 产物预览弹窗 */}
      <Dialog open={artifactPreviewOpen} onOpenChange={setArtifactPreviewOpen}>
        <DialogContent className="sm:max-w-4xl w-[92vw] max-h-[72vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>预览：{artifactPreviewName}</DialogTitle>
          </DialogHeader>
          <pre className="bg-gray-50 rounded-md p-4 text-xs w-full max-h-[60vh] overflow-auto whitespace-pre break-words">
            {artifactPreviewContent}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-xl font-semibold">任务详情分析</h1>
            <p className="text-sm text-gray-600">{task.taskName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 使用共享映射动态呈现操作按钮（过滤掉“详情”） */}
          {getAvailableActions(computedTask).filter((a: TaskAction) => a.key !== 'view' && a.key !== 'edit').map((action: TaskAction) => {
            const isLoading = loadingAction === `${task.id}:${action.key}`;
            const classMap: Record<string, string> = {
              start: 'text-green-600 border-green-200 hover:bg-green-50',
              stop: 'text-orange-600 border-orange-200 hover:bg-orange-50',
              retry: 'text-blue-600 border-blue-200 hover:bg-blue-50',
              export: 'text-blue-600 border-blue-200 hover:bg-blue-50',
              copy: 'text-purple-600 border-purple-200 hover:bg-purple-50',
              archive: 'text-gray-600 border-gray-200 hover:bg-gray-50',
              delete: 'text-red-600 border-red-200 hover:bg-red-50',
              edit: 'text-gray-600 border-gray-200 hover:bg-gray-50',
            };
            if (action.key === 'export') {
              return (
                <DropdownMenu key="export">
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={classMap['export']}>
                      {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      导出
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportPDF}>导出 PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportHTML}>导出 HTML</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportParamsJson}>导出参数 JSON</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            const Icon = action.icon;
            const labelOverride = action.key === 'copy' ? '基于此重新训练' : action.label;
            return (
              <Button
                key={action.key}
                variant="outline"
                size="sm"
                className={`${classMap[action.key] ?? 'text-gray-600 border-gray-200 hover:bg-gray-50'} transition-all duration-200`}
                disabled={isLoading}
                onClick={() => handleTaskAction(action.key as any, task.id)}
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Icon className="h-4 w-4 mr-2" />}
                {labelOverride}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content: 左侧锚点导航 + 纵向分区 */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* 左侧锚点导航 */}
          <div className="w-56 border-r bg-white">
            <div className="sticky top-16 p-4 space-y-2">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 ${activeSection === s.id ? 'bg-green-50 text-green-700 border border-green-200' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  {React.createElement(s.icon, { className: 'h-4 w-4' })}
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 右侧内容区 */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-6 space-y-10">
            {/* 任务结果 */}
            <section id="results" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">任务结果</h2>
              {renderMetricsTab()}
            </section>

            {/* 因果解释 */}
            <section id="causal" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">因果解释</h2>

              {/* 注：按用户要求移除顶部模型评估卡片（蓝色横幅与误差棒图） */}
              <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>因果解释图</CardTitle>
                    <CardDescription>展示影响强度热图与因子贡献对比</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExportCausalCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      导出解释数据
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setDeepSeekOpen(true)}>
                      <Brain className="h-4 w-4 mr-2" />
                      大模型预测过程
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white border rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">影响强度热图</div>
                      {(() => {
                        const factorLabels = ['温度_均值', '压力_方差', '设备功率', '环境湿度', '质量评分', '历史缺陷率', '维护间隔', '设备老化指数', '能耗比', '设备震动', '生产节拍', '人员工时'];
                        const times: string[] = Array.from({ length: 20 }).map((_, i) => {
                          const d = new Date(Date.UTC(2025, 0, 16, i, 0, 0));
                          const hh = String(d.getUTCHours()).padStart(2, '0');
                          return `${hh}:00`;
                        });
                        const rows = times.length;
                        const cols = factorLabels.length;
                        const cellW = 24;
                        const cellH = 14;
                        const val = (r: number, c: number) => Math.sin(r * 0.25) + Math.cos(c * 0.45);
                        const toColor = (x: number) => {
                          const t = Math.max(-2, Math.min(2, x));
                          const ratio = (t + 2) / 4;
                          const rr = Math.round(255 * ratio);
                          const bb = Math.round(255 * (1 - ratio));
                          return `rgb(${rr},80,${bb})`;
                        };
                        const ml = 64;
                        const mb = 100;
                        const width = ml + cols * cellW;
                        const height = mb + rows * cellH;
                        const xLabel = '影响因子';
                        const yLabel = '时间窗口';
                        return (
                          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
                            <line x1={ml - 6} y1={0} x2={ml - 6} y2={rows * cellH} stroke="#9ca3af" strokeWidth={1} />
                            <line x1={ml} y1={rows * cellH + 1} x2={ml + cols * cellW} y2={rows * cellH + 1} stroke="#9ca3af" strokeWidth={1} />
                            {Array.from({ length: rows }).map((_, r) => (
                              Array.from({ length: cols }).map((__, c) => (
                                <rect key={`${r}-${c}`} x={ml + c * cellW} y={r * cellH} width={cellW} height={cellH} fill={toColor(val(r, c))} />
                              ))
                            ))}
                            {factorLabels.map((name, i) => {
                              const x = ml + i * cellW + cellW / 2;
                              const y = rows * cellH + 40;
                              return (
                                <text key={`x-${i}`} x={x} y={y} fontSize={10} fill="#6b7280" textAnchor="end" transform={`rotate(-90 ${x} ${y})`} className="select-none">{name}</text>
                              );
                            })}
                            {times.map((t, r) => (
                              <g key={`y-${r}`}>
                                <line x1={ml - 10} y1={r * cellH + cellH / 2} x2={ml - 6} y2={r * cellH + cellH / 2} stroke="#9ca3af" strokeWidth={1} />
                                <text x={ml - 12} y={r * cellH + cellH / 2 + 3} fontSize={10} fill="#6b7280" textAnchor="end" className="select-none">{t}</text>
                              </g>
                            ))}
                            <text x={ml + (cols * cellW) / 2} y={rows * cellH + mb - 2} fontSize={12} fill="#374151" textAnchor="middle" className="select-none">{xLabel}</text>
                            <text x={18} y={(rows * cellH) / 2} fontSize={12} fill="#374151" textAnchor="middle" transform={`rotate(-90 18 ${(rows * cellH) / 2})`} className="select-none">{yLabel}</text>
                          </svg>
                        );
                      })()}
                    </div>
                    <div className="bg-white border rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">影响因子贡献对比</div>
                      {(() => {
                        const data = [
                          { name: '温度_均值', score: -74.4 },
                          { name: '压力_方差', score: 85.1 },
                          { name: '设备功率', score: 42.6 },
                          { name: '环境湿度', score: -12.8 },
                          { name: '质量评分', score: 61.7 },
                          { name: '历史缺陷率', score: -51.7 },
                          { name: '维护间隔', score: 27.9 },
                        ];
                        const maxAbs = Math.max(...data.map(d => Math.abs(d.score))) || 1;
                        const w = 520;
                        const h = 260;
                        const x0 = w / 2;
                        const rowH = 30;
                        return (
                          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-64">
                            <line x1={x0} y1={10} x2={x0} y2={h - 10} stroke="#9ca3af" strokeWidth={1} />
                            {data.map((d, i) => {
                              const len = Math.round((Math.abs(d.score) / maxAbs) * (w / 2 - 40));
                              const y = 20 + i * rowH;
                              const color = d.score >= 0 ? '#22c55e' : '#ef4444';
                              const x = d.score >= 0 ? x0 : x0 - len;
                              return (
                                <g key={d.name}>
                                  <text x={10} y={y + 12} fontSize={12} fill="#374151">{d.name}</text>
                                  <rect x={x} y={y} width={len} height={18} fill={color} rx={3} />
                                  <text x={d.score >= 0 ? x + len + 6 : x - 34} y={y + 12} fontSize={12} fill="#374151">{d.score.toFixed(1)}</text>
                                </g>
                              );
                            })}
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* 大模型预测过程弹窗 */}
              <Dialog open={isDeepSeekOpen} onOpenChange={setDeepSeekOpen}>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>大模型预测过程</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-700">模型推理的关键节点</div>
                      <ul className="list-disc pl-5 text-sm text-blue-900 mt-2">
                        {deepSeekSteps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    {/* 特征权重分析已移除 */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">决策路径可视化</div>
                      <div className="flex flex-wrap items-center gap-2 bg-gray-50 rounded-lg p-3">
                        {decisionRules.map((r, idx) => (
                          <React.Fragment key={idx}>
                            <div className="px-3 py-1 bg-white border rounded-md text-sm">{r}</div>
                            {idx < decisionRules.length - 1 && <span className="text-gray-400">→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">按规则链路依次判断并形成最终分类决策</div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </section>

            {/* 概览信息 */}
            <section id="meta" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">概览信息</h2>
              {renderOverviewTab()}
            </section>

            {/* 数据集信息 */}
            <section id="dataset" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">数据集信息</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="transition-all duration-200 hover:shadow-md border-gray-200 lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      基本信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {task.datasets && task.datasets.length > 0 ? (
                      <div>
                        <p className="text-sm text-gray-600">已关联数据集（多选）</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {task.datasets.map((ds) => (
                            <Badge key={ds.id} variant="secondary" className="flex items-center gap-2">
                              <span>{ds.name}</span>
                              <span className="text-xs text-gray-500">{ds.id}{ds.version ? ` · ${ds.version}` : ''}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600">已关联数据集</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="flex items-center gap-2">
                            <span>{task.datasetName || '未设置'}</span>
                            <span className="text-xs text-gray-500">{(task as any).datasetId || '未设置'}{task.datasetVersion ? ` · ${task.datasetVersion}` : ''}</span>
                          </Badge>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">来源</div>
                          <div className="text-base font-medium">{aggregatedStats?.sourceLabel ?? '未设置'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">样本总数</div>
                          <div className="text-base font-medium">{aggregatedStats ? aggregatedStats.totalSamples.toLocaleString() : '未设置'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">字段并集数量</div>
                          <div className="text-base font-medium">{aggregatedStats ? aggregatedStats.unionFieldCount.toLocaleString() : '未设置'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">合集大小</div>
                          <div className="text-base font-medium">{aggregatedStats ? formatSizeMB(aggregatedStats.totalSizeMB) : '未设置'}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="transition-all duration-200 hover:shadow-md border-gray-200 lg:col-span-2">
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>数据预览</CardTitle>
                      <CardDescription>参考数据管理-数据详情样式，支持排序/筛选/分页/列控制</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-52">
                        <Select value={String(datasetPreviewIndex)} onValueChange={(v: string) => { setDatasetPreviewIndex(Number(v)); setCurrentPage(1); }}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择数据集" />
                          </SelectTrigger>
                          <SelectContent>
                            {(task.datasets && task.datasets.length > 0 ? task.datasets : [{ id: 'default', name: task.datasetName, version: task.datasetVersion }]).map((ds, idx) => (
                              <SelectItem key={`${ds.id}@${ds.version}`} value={String(idx)}>
                                {ds.name} <span className="text-xs text-gray-500">{ds.version}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 数据文件选择（基于当前数据集版本） */}
                      <div className="w-56">
                        {(() => {
                          const curDs = task.datasets?.[datasetPreviewIndex];
                          const key = curDs ? `${curDs.id}@${curDs.version}` : '';
                          const files = key ? (versionFilesRegistry[key] || curDs?.files || []) : [];
                          return (
                            <Select value={selectedPreviewFile} onValueChange={(v: string) => setSelectedPreviewFile(v)} disabled={files.length === 0}>
                              <SelectTrigger>
                                <SelectValue placeholder="选择数据文件" />
                              </SelectTrigger>
                              <SelectContent>
                                {files.map((f) => (
                                  <SelectItem key={f} value={f}>{f}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        })()}
                      </div>

                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-2 top-2 text-gray-400" />
                        <Input className="pl-8 w-40" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="搜索行内容" />
                      </div>

                      <Button variant="outline" size="sm" onClick={() => setMissingOnly((prev) => !prev)} className={missingOnly ? "bg-red-50 border-red-500 text-red-600" : ""}>
                        <Filter className="h-4 w-4 mr-1" />缺失值
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setUniqueOnly((prev) => !prev)} className={uniqueOnly ? "bg-orange-50 border-orange-500 text-orange-600" : ""}>
                        <TrendingUp className="h-4 w-4 mr-1" />唯一值
                      </Button>
                      <Select value={uniqueField || ''} onValueChange={(v: string) => { setUniqueField(v || null); setCurrentPage(1); }}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="选择字段" />
                        </SelectTrigger>
                        <SelectContent>
                          {getColumnOrder().map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                        </SelectContent>
                      </Select>

                      {/* 每页分页已移除，使用虚拟滚动 */}

                      <div className="w-36">
                        <Select value={columnOrderMode} onValueChange={(v: any) => setColumnOrderMode(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="列排序" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="original">原顺序</SelectItem>
                            <SelectItem value="asc">A-Z</SelectItem>
                            <SelectItem value="desc">Z-A</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-36">
                        <Select value={tableDensity} onValueChange={(v: any) => setTableDensity(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="密度" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">紧凑</SelectItem>
                            <SelectItem value="normal">适中</SelectItem>
                            <SelectItem value="comfortable">宽松</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 数据详情按钮已移除 */}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const processed = getProcessedPreviewRows();
                      const cols = getColumnOrder();
                      const columnsDef = cols.map((c) => ({
                        key: c,
                        label: c,
                        width: columnWidths[c],
                        sortable: true,
                        render: (value: any) => (typeof value === 'number' && Number.isNaN(value) ? 'NaN' : String(value)),
                      }));
                      const tableHeight = tableDensity === 'compact' ? 300 : tableDensity === 'comfortable' ? 460 : 380;
                      return (
                        <div>
                          <VirtualTable
                            data={processed as any[]}
                            columns={columnsDef as any}
                            height={tableHeight}
                            density={tableDensity}
                            defaultColumnOrder={(columnManualOrder && columnManualOrder.length) ? columnManualOrder : cols}
                            defaultColumnWidths={columnWidths}
                            onColumnOrderChange={(order) => { setColumnManualOrder(order); setColumnOrderMode('original'); }}
                            onColumnWidthsChange={(w) => setColumnWidths(w)}
                            sortState={{ column: sortColumn || undefined, order: sortOrder }}
                            onSortChange={(column, order) => { setSortColumn(column); setSortOrder(order); }}
                            onReset={() => { setColumnManualOrder([]); setColumnWidths({}); setColumnOrderMode('original'); }}
                          />
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
              {/* 已合并至上方数据预览右侧摘要区，原聚合统计卡片移除 */}

            </section>

            {/* 模型信息 */}
            <section id="model" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">模型信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />主模型</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><span className="text-sm text-gray-600">模型名称</span><p className="font-medium">{task.modelName}</p></div>
                    <div><span className="text-sm text-gray-600">模型类型</span><p className="font-medium">自研</p></div>
                    <div><span className="text-sm text-gray-600">版本号</span><p className="font-medium">v1.0</p></div>
                    <div><span className="text-sm text-gray-600">模型描述</span><p className="text-gray-900">用于{getTaskTypeLabel(task.taskType)}任务的模型。</p></div>
                  </CardContent>
                </Card>
                {[1, 2].map(i => (
                  <Card key={i} className="transition-all duration-200 hover:shadow-md border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />并行模型 {i}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><span className="text-sm text-gray-600">模型名称</span><p className="font-medium">Model-{i}</p></div>
                      <div><span className="text-sm text-gray-600">模型类型</span><p className="font-medium">微调</p></div>
                      <div><span className="text-sm text-gray-600">版本号</span><p className="font-medium">v{i}.2</p></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* 参数配置 */}
            <section id="params" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">参数配置</h2>
              {/* 用户配置的参数字段展示（替换X/Y字段选择） */}
              <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
                <CardHeader>
                  <CardTitle>用户配置的参数字段</CardTitle>
                  <CardDescription>展示任务创建时填写的时序预测相关参数</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">上下文长度</span>
                      <p className="font-medium">{forecastingParams?.contextLength ?? '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">预测步长</span>
                      <p className="font-medium">{forecastingParams?.stepLength ?? '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">预测长度</span>
                      <p className="font-medium">{forecastingParams?.forecastLength ?? '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">预测开始时间</span>
                      <p className="font-medium">{forecastingParams?.startTime ?? '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">主变量文件</span>
                      <p className="font-medium">{forecastingParams?.mainVariableFile || '未指定'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">协变量文件</span>
                      <p className="font-medium">{(forecastingParams?.covariateFiles && forecastingParams.covariateFiles.length > 0) ? forecastingParams.covariateFiles.join(', ') : '无'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* 参数 JSON 回显已移动到"任务产物"区展示 */}
            </section>

            {/* 执行日志 */}
            <section id="logs" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">执行日志</h2>
              {renderLogsTab()}
            </section>

            {/* 任务产物 */}
            <section id="artifacts" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">任务产物</h2>
              {renderArtifactsTab()}
            </section>

            {/* 操作确认弹窗 */}
            <Dialog open={confirmDialog.isOpen} onOpenChange={() => handleCancelConfirm()}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>确认操作</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    {confirmDialog.action === 'start' && '是否开始任务？'}
                    {confirmDialog.action === 'stop' && '是否停止任务？'}
                    {confirmDialog.action === 'retry' && '是否重试该任务？'}
                    {confirmDialog.action === 'rerun' && '是否重新运行该任务？该任务将按当前配置重新排队。'}
                    {confirmDialog.action === 'cancel_queue' && '是否取消该任务的排队？取消后回到“未开始”状态。'}
                    {confirmDialog.action === 'archive' && '是否归档该任务？归档后不可编辑，仅可查看。'}
                    {confirmDialog.action === 'delete' && '是否删除该任务？删除后不可恢复。'}
                  </div>
                  <p className="font-medium">{confirmDialog.taskName}</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCancelConfirm}>取消</Button>
                    <Button
                      onClick={() => executeTaskAction(confirmDialog.action, confirmDialog.taskId)}
                      disabled={loadingAction === `${confirmDialog.taskId}:${confirmDialog.action}`}
                      className={`${confirmDialog.action === 'start' ? 'bg-green-600 hover:bg-green-700' : confirmDialog.action === 'stop' || confirmDialog.action === 'delete' || confirmDialog.action === 'cancel_queue' ? 'bg-red-600 hover:bg-red-700' : confirmDialog.action === 'retry' || confirmDialog.action === 'rerun' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                    >
                      {loadingAction === `${confirmDialog.taskId}:${confirmDialog.action}` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      {confirmDialog.action === 'start' ? '开始任务' :
                        confirmDialog.action === 'stop' ? '停止任务' :
                          confirmDialog.action === 'retry' ? '重试任务' :
                            confirmDialog.action === 'rerun' ? '重新运行' :
                              confirmDialog.action === 'cancel_queue' ? '取消排队' :
                                confirmDialog.action === 'archive' ? '归档任务' :
                                  confirmDialog.action === 'delete' ? '删除任务' : '确认'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailFullPage;