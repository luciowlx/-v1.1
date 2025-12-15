import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  Clock, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Archive, 
  ChevronUp, 
  ChevronDown,
  Settings,
  Database,
  Target,
  Cpu,
  Eye,
  RotateCcw,
  Square,
  Play,
  Download,
  Copy,
  Trash2,
  List,
  Grid,
  ArrowUp,
  ArrowDown,
  User,
  GitCompare,
  Maximize2,
  Minimize2,
  X,
  BarChart3,
  Circle,
} from 'lucide-react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from './ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from './ui/command';
import { Calendar as DateRangeCalendar } from './ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { VirtualTable } from './ui/virtual-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import TaskCompare from './TaskCompare';
import type { TaskCompareItem } from './TaskCompare';
import { getAvailableActions, getCommonActionKeys } from '../utils/taskActions';
import { TASK_TYPES, ALLOWED_TASK_TYPES, TaskType } from '../utils/taskTypes';
import { useLanguage } from "../i18n/LanguageContext";

// 模拟项目列表（后续可替换为真实项目数据）
const mockProjects = [
  { id: 'proj_001', name: '钢铁缺陷预测' },
  { id: 'proj_002', name: '电力能源预测' },
  { id: 'proj_003', name: '工艺时序预测' },
  { id: 'proj_004', name: '设备故障预测' },
];
const getProjectName = (id: string) => mockProjects.find(p => p.id === id)?.name || '未选择项目';

// 任务类型常量与类型统一（从 utils 统一导入）
// 已改为从 ../utils/taskTypes 导入 TASK_TYPES、ALLOWED_TASK_TYPES、TaskType

type TaskStatus = 'not_started' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'archived';
type TaskPriority = 'low' | 'medium' | 'high';
type ViewMode = 'table' | 'grid';
type SortField = 'createdAt' | 'completedAt' | 'status' | 'priority' | 'taskName';
type SortOrder = 'asc' | 'desc';

// 统一允许的模型常量，供筛选与 UI 复用
const ALLOWED_MODELS = new Set<string>(['Limix', 'XGBoost']);

// 支持多数据集选择的条目类型（新增）
interface SelectedDatasetEntry {
  id: string;
  name: string;
  version: string;
}

// 任务接口定义
interface Task {
  id: string;
  taskName: string;
  taskType: TaskType;
  // 新增：所属项目信息
  projectId?: string;
  projectName?: string;
  datasetName: string;
  datasetVersion: string;
  // 新增：支持多数据集（保持向后兼容）
  datasets?: SelectedDatasetEntry[];
  modelName: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress?: number;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  description?: string;
  config?: any;
  results?: any;
  estimatedTime?: number;
  actualTime?: number;
  // 新增：曾经排队过的标记，用于在未开始状态下显示“重新运行”而非“开始”
  hasQueuedBefore?: boolean;
}

// 筛选条件接口
interface FilterOptions {
  taskType: TaskType | 'all';
  status: TaskStatus | 'all';
  // 新增：按项目筛选（使用项目ID，'all' 表示全部项目）
  projectId?: string | 'all';
  // 修改：数据集和模型筛选支持多选
  datasetNames: string[];
  modelNames: string[];
  priority: TaskPriority | 'all';
  dateRange: {
    start: string;
    end: string;
  };
  searchQuery: string;
}

// 排序配置接口
interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// 添加数据集详细信息接口
interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  size: string;
  fieldCount: number;
  sampleCount: number;
  source: 'upload' | 'subscription';
  status: 'success' | 'processing' | 'failed';
  versions: DatasetVersion[];
  // 新增：数据集包含的文件名称列表（用于主/协变量选择）
  files?: string[];
  previewData?: any[];
}

interface DatasetVersion {
  version: string;
  createdAt: string;
  description: string;
  size: string;
  fieldCount: number;
  sampleCount: number;
}

// 输出配置：分类任务平均方式
// 按要求：将选项 none 调整为 acc（兼容旧配置在预填时自动映射）
type AverageMethod = 'micro' | 'macro' | 'samples' | 'weighted' | 'binary' | 'acc';

// 输出配置接口
interface OutputConfig {
  forecasting: {
    metrics: {
      mse: boolean;
      rmse: boolean;
      mae: boolean;
      mape: boolean;
      r2: boolean;
      relDeviationPercents: number[]; // 正负相对偏差百分比，如 10, 20 表示 ±10%、±20%
      absDeviationValues: number[];   // 正负绝对偏差，如 10, 20 表示 ±10、±20
      customMetrics: string[];        // 自定义指标名称
    };
    visualizations: {
      lineChart: boolean;             // 折线图
      residualPlot: boolean;          // 残差图
      predVsTrueScatter: boolean;     // 预测值 vs 真实值散点图
      errorHistogram: boolean;        // 误差分布直方图
    };
  };
  classification: {
    metrics: {
      precision: { enabled: boolean; average: AverageMethod };
      recall: { enabled: boolean; average: AverageMethod };
      f1: { enabled: boolean; average: AverageMethod };
      accuracy: { enabled: boolean; average: AverageMethod };
      rocAuc: { enabled: boolean; average: AverageMethod };
      customMetricCode: string;
    };
    visualizations: {
      rocCurve: boolean;              // ROC 曲线（支持 macro/micro）
      prCurve: boolean;               // Precision-Recall 曲线
      confusionMatrix: boolean;       // 混淆矩阵
    };
  };
  regression: {
    metrics: {
      mse: boolean;
      rmse: boolean;
      mae: boolean;
      mape: boolean;
      r2: boolean;
      relDeviationPercents: number[];
      absDeviationValues: number[];
      customMetrics: string[];
    };
    visualizations: {
      lineChart: boolean;
      residualPlot: boolean;
      predVsTrueScatter: boolean;
      errorHistogram: boolean;
    };
  };
}

interface TaskManagementProps {
  isCreateTaskDialogOpen?: boolean;
  onCreateTaskDialogChange?: (open: boolean) => void;
  onOpenTaskDetailFullPage?: (task: Task) => void;
  // 新增：控制创建成功后是否自动打开详情页，默认保持在列表
  autoOpenDetailAfterCreate?: boolean;
  // 新增：接收来自外部（例如任务详情全屏页）的任务局部补丁，用于同步列表状态
  externalTaskPatch?: { id: string; patch: Partial<Task> } | null;
}

// 更新FormData接口，添加数据集相关字段
interface FormData {
  taskName: string;
  taskType: TaskType;
  projectId: string; // 所属项目（必填）
  datasetName: string;
  datasetVersion: string;
  selectedDataset: DatasetInfo | null; // 新增：选中的数据集详细信息
  // 新增：多数据集（含版本）已选列表
  selectedDatasets: SelectedDatasetEntry[];
  modelName: string;
  models: string[]; // 支持多模型选择
  modelSelectionMode: 'single' | 'multiple'; // 新增：模型选择模式
  targetFields: string[]; // 特征字段（支持多选）
  availableFields: string[]; // 数据集中可用的字段列表
  priority: TaskPriority;
  description: string;
  // 参数配置统一采用页面配置对象模式（移除 JSON 模式）
  // 页面配置：按任务类型分别保存
  forecastingConfig: {
    // 新增：时间序列任务的时间列（来自公共字段）
    timeColumn: string; // 时间列（必选）
    /**
     * 预测目标列（必选）。
     * 来自公共字段，用于指定要预测的目标变量列，通常为数值型时间序列。
     */
    targetColumn: string;
    contextLength: number; // 上下文长度
    forecastLength: number; // 预测长度
    stepLength: number; // 预测步长
    startTime: string; // 预测开始时间（日期+时间）
    mainVariableFiles: string[]; // 主变量文件（多选）
    covariateFiles: string[]; // 协变量文件列表（可选）
  };
  classificationConfig: {
    trainRatio: number; // 训练集比例(%)
    testRatio: number; // 测试集比例(%)
    shuffle: boolean; // 是否洗牌
  };
  regressionConfig: {
    trainRatio: number; // 训练集比例(%)
    testRatio: number; // 测试集比例(%)
    shuffle: boolean; // 是否洗牌
  };
  // 新增：输出配置（按任务类型）
  outputConfig: OutputConfig;
  // 运行资源类型
  resourceType: 'cpu' | 'gpu' | 'npu';
  resourceConfig: {
    cores: number;
    memory: number; // GB
    acceleratorCards?: number; // 加速卡数量（GPU/NPU 时启用）
    maxRunTime: number; // 最大运行时长（分钟）
  };
}

  const TaskManagement: React.FC<TaskManagementProps> = ({
    isCreateTaskDialogOpen = false,
    onCreateTaskDialogChange,
    onOpenTaskDetailFullPage,
    autoOpenDetailAfterCreate = false,
    externalTaskPatch = null,
  }) => {
    const { t } = useLanguage();
    // 创建任务弹窗分步导航（4步）
    const [currentStep, setCurrentStep] = useState<number>(1);
    const steps = [
      { number: 1, label: '基础信息配置' },
      { number: 2, label: '数据与目标' },
      { number: 3, label: '模型选择' },
      { number: 4, label: '参数配置' },
    ];
  // 状态管理
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCompareDemoOpen, setIsCompareDemoOpen] = useState(false);
  // 全屏模式状态（创建任务弹窗）
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  // 任务对比预览：示例类型选择（分类/回归/时序预测）
  const [compareDemoType, setCompareDemoType] = useState<TaskType>(TASK_TYPES.classification);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  // 新增：创建成功后用于高亮并滚动定位的任务ID
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'createdAt', order: 'desc' });
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  // 编辑模式状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: string;
    taskId: string;
    taskName: string;
  }>({
    isOpen: false,
    action: '',
    taskId: '',
    taskName: ''
  });
  
  // 新增：任务操作加载态、操作日志与状态动画
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionLogs, setActionLogs] = useState<Array<{ ts: number; taskId: string; action: string; success: boolean; message?: string }>>([]);
  const [statusAnimTaskId, setStatusAnimTaskId] = useState<string | null>(null);
  useEffect(() => {
    if (statusAnimTaskId) {
      const timer = setTimeout(() => setStatusAnimTaskId(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [statusAnimTaskId]);
  
  // 筛选状态
  const [filters, setFilters] = useState<FilterOptions>({
    taskType: 'all',
    status: 'all',
    projectId: 'all',
    datasetNames: [],
    modelNames: [],
    priority: 'all',
    dateRange: { start: '', end: '' },
    searchQuery: ''
  });

  // 多选下拉搜索词
  const [datasetFilterQuery, setDatasetFilterQuery] = useState('');
  const [modelFilterQuery, setModelFilterQuery] = useState('');

  // 任务创建表单状态
  const [formData, setFormData] = useState<FormData>({
    taskName: '',
    taskType: TASK_TYPES.forecasting,
    projectId: '',
    datasetName: '',
  datasetVersion: '',
  selectedDataset: null,
  selectedDatasets: [],
  modelName: '',
  models: [],
  modelSelectionMode: 'multiple',
  targetFields: [],
  availableFields: [],
    priority: 'medium',
    description: '',
    forecastingConfig: {
      timeColumn: '',
      targetColumn: '',
      contextLength: 24,
      forecastLength: 12,
      stepLength: 1,
      startTime: '',
      mainVariableFiles: [],
      covariateFiles: []
    },
    classificationConfig: {
      trainRatio: 80,
      testRatio: 20,
      shuffle: false
    },
    regressionConfig: {
      trainRatio: 80,
      testRatio: 20,
      shuffle: false
    },
    // 新增：输出配置默认值（默认全选）
    outputConfig: {
      forecasting: {
        metrics: {
          mse: true,
          rmse: true,
          mae: true,
          mape: true,
          r2: true,
          relDeviationPercents: [10],
          absDeviationValues: [10],
          customMetrics: []
        },
        visualizations: {
          lineChart: true,
          residualPlot: true,
          predVsTrueScatter: true,
          errorHistogram: true
        }
      },
      classification: {
        metrics: {
          precision: { enabled: true, average: 'binary' },
          recall: { enabled: true, average: 'binary' },
          f1: { enabled: true, average: 'macro' },
          accuracy: { enabled: true, average: 'acc' },
          rocAuc: { enabled: true, average: 'macro' },
          customMetricCode: ''
        },
        visualizations: {
          rocCurve: true,
          prCurve: true,
          confusionMatrix: true
        }
      },
      regression: {
        metrics: {
          mse: true,
          rmse: true,
          mae: true,
          mape: true,
          r2: true,
          relDeviationPercents: [10],
          absDeviationValues: [10],
          customMetrics: []
        },
        visualizations: {
          lineChart: true,
          residualPlot: true,
          predVsTrueScatter: true,
          errorHistogram: true
        }
      }
    },
    resourceType: 'cpu',
    resourceConfig: {
      cores: 4,
      memory: 32,
      acceleratorCards: 1,
      maxRunTime: 120
    }
  });

  // JSON 配置导入错误提示
  // 已移除：JSON 配置模式相关状态与方法（统一采用页面配置对象模式）

  // 添加表单验证状态
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatasetPreview, setShowDatasetPreview] = useState(false);

  // 资源配置历史（本地存储加载）
  interface ResourceConfigHistoryEntry {
    resourceType: 'cpu' | 'gpu' | 'npu';
    resourceConfig: { cores: number; memory: number; maxRunTime: number; acceleratorCards?: number };
    ts: number;
  }
  const [resourceConfigHistory, setResourceConfigHistory] = useState<ResourceConfigHistoryEntry[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('resource_config_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setResourceConfigHistory(parsed as ResourceConfigHistoryEntry[]);
      }
    } catch (e) {
      console.warn('加载资源配置历史失败:', e);
    }
  }, []);

  // 资源类型联动：CPU 默认内存至少 32GB；GPU/NPU 默认加速卡为 1
  useEffect(() => {
    setFormData(prev => {
      const next = { ...prev };
      if (prev.resourceType === 'cpu') {
        const mem = prev.resourceConfig.memory;
        const needUpdate = (mem ?? 0) < 32 || typeof prev.resourceConfig.acceleratorCards !== 'undefined';
        if (needUpdate) {
          next.resourceConfig = { ...prev.resourceConfig, memory: mem >= 32 ? mem : 32, acceleratorCards: undefined };
          return next;
        }
      } else {
        if (typeof prev.resourceConfig.acceleratorCards === 'undefined') {
          next.resourceConfig = { ...prev.resourceConfig, acceleratorCards: 1 };
          return next;
        }
      }
      return prev;
    });
  }, [formData.resourceType]);

  // 第4步：主/协变量文件多选弹窗状态与搜索词
  const [mainFilesOpen, setMainFilesOpen] = useState(false);
  const [covFilesOpen, setCovFilesOpen] = useState(false);
  const [mainFilesQuery, setMainFilesQuery] = useState('');
  const [covFilesQuery, setCovFilesQuery] = useState('');

  // 模拟数据集详细信息
  const [availableDatasets] = useState<DatasetInfo[]>([
    {
      id: 'DATA-2025-001',
      name: '生产质量数据集',
      description: '包含生产线质量检测相关数据，用于缺陷预测和质量评估',
      size: '2.5MB',
      fieldCount: 15,
      sampleCount: 10000,
      source: 'upload',
      status: 'success',
      files: [
        '生产线_主变量.csv',
        '生产线_协变量_设备功率.csv',
        '生产线_协变量_环境温度.csv',
        '生产线_日志.csv'
      ],
      versions: [
        {
          version: 'v3.0',
          createdAt: '2025-01-15 14:30',
          description: '修复数据质量问题，增加新特征',
          size: '2.5MB',
          fieldCount: 15,
          sampleCount: 10000
        },
        {
          version: 'v2.0',
          createdAt: '2025-01-10 10:20',
          description: '数据清洗优化，移除异常值',
          size: '2.3MB',
          fieldCount: 14,
          sampleCount: 9800
        },
        {
          version: 'v1.0',
          createdAt: '2025-01-05 16:45',
          description: '初始版本',
          size: '2.1MB',
          fieldCount: 12,
          sampleCount: 9500
        }
      ],
      previewData: [
        { id: 1, temperature: 85.2, pressure: 1.2, defect_rate: 0.02, quality_score: 98.5 },
        { id: 2, temperature: 87.1, pressure: 1.3, defect_rate: 0.03, quality_score: 97.8 },
        { id: 3, temperature: 84.8, pressure: 1.1, defect_rate: 0.01, quality_score: 99.2 }
      ]
    },
    {
      id: 'DATA-2025-002',
      name: '客户行为数据集',
      description: '电商平台客户购买行为分析数据',
      size: '5.2MB',
      fieldCount: 20,
      sampleCount: 25000,
      source: 'subscription',
      status: 'success',
      files: [
        '客户_主变量.csv',
        '客户_协变量_画像.csv',
        '客户_交易明细.csv'
      ],
      versions: [
        {
          version: 'v2.0',
          createdAt: '2025-01-12 09:15',
          description: '增加用户画像特征',
          size: '5.2MB',
          fieldCount: 20,
          sampleCount: 25000
        },
        {
          version: 'v1.0',
          createdAt: '2025-01-08 11:30',
          description: '基础行为数据',
          size: '4.8MB',
          fieldCount: 18,
          sampleCount: 23000
        }
      ],
      previewData: [
        { user_id: 'U001', age: 28, purchase_amount: 299.99, category: 'electronics', satisfaction: 4.5 },
        { user_id: 'U002', age: 35, purchase_amount: 159.50, category: 'clothing', satisfaction: 4.2 },
        { user_id: 'U003', age: 42, purchase_amount: 89.99, category: 'books', satisfaction: 4.8 }
  ]
    }
  ]);

  // 多数据集：根据已选的数据集列表自动更新可用字段（公共字段交集）
  useEffect(() => {
    let intersection: Set<string> | null = null;
    formData.selectedDatasets.forEach((sd) => {
      const ds = availableDatasets.find((d) => d.id === sd.id);
      const fields = ds?.previewData && ds.previewData.length > 0
        ? Object.keys(ds.previewData[0])
        : [];
      if (intersection === null) {
        intersection = new Set(fields);
      } else {
        const next = new Set<string>();
        fields.forEach((f) => { if (intersection && intersection.has(f)) next.add(f); });
        intersection = next;
      }
    });
    // 保证交集数组类型稳定为 string[]，避免在 TS 推断中出现 never[]
    const intersectionArr: string[] = intersection ? Array.from(intersection) : [];
    setFormData((prev) => {
      const same = prev.availableFields.length === intersectionArr.length && prev.availableFields.every((f) => intersectionArr.includes(f));
      if (same) return prev;
      return { ...prev, availableFields: intersectionArr };
    });
  }, [formData.selectedDatasets, availableDatasets]);

  // 当公共字段（availableFields）变化时，校正或自动预填时间列
  useEffect(() => {
    if (formData.taskType !== TASK_TYPES.forecasting) return;
    const fields = formData.availableFields || [];
    const current = formData.forecastingConfig?.timeColumn || '';
    // 如果当前时间列不在公共字段中，则清空
    if (current && !fields.includes(current)) {
      setFormData(prev => ({
        ...prev,
        forecastingConfig: { ...prev.forecastingConfig, timeColumn: '' }
      }));
      return;
    }
    // 若为空且存在常见时间字段名，自动预填
    if (!current && fields.length > 0) {
      const candidates = ['timestamp', 'time', 'date', 'datetime', 'event_time', 'ts'];
      const found = candidates.find(c => fields.includes(c));
      if (found) {
        setFormData(prev => ({
          ...prev,
          forecastingConfig: { ...prev.forecastingConfig, timeColumn: found }
        }));
      }
    }
  }, [formData.availableFields, formData.taskType]);

  /**
   * 当公共字段或时间列变化时，校正/预填预测目标列。
   * 规则：
   * - 若当前 targetColumn 不在公共字段中，则清空。
   * - 若为空，则自动选择第一个非时间列的字段作为候选（仅作为便捷预填，可在UI中更改）。
   */
  useEffect(() => {
    if (formData.taskType !== TASK_TYPES.forecasting) return;
    const fields = formData.availableFields || [];
    const currentTarget = formData.forecastingConfig?.targetColumn || '';
    const currentTime = formData.forecastingConfig?.timeColumn || '';
    // 若当前目标列不在公共字段中，清空
    if (currentTarget && !fields.includes(currentTarget)) {
      setFormData(prev => ({
        ...prev,
        forecastingConfig: { ...prev.forecastingConfig, targetColumn: '' }
      }));
      return;
    }
    // 若为空则尝试预填：第一个非时间列的字段
    if (!currentTarget && fields.length > 0) {
      const candidate = fields.find(f => f !== currentTime);
      if (candidate) {
        setFormData(prev => ({
          ...prev,
          forecastingConfig: { ...prev.forecastingConfig, targetColumn: candidate }
        }));
      }
    }
  }, [formData.availableFields, formData.forecastingConfig.timeColumn, formData.taskType]);

  // 聚合可选文件名：来自已选数据集(selectedDatasets)与当前选择(selectedDataset)
  const aggregatedFileOptions = useMemo(() => {
    const set = new Set<string>();
    // 来自多数据集选择
    formData.selectedDatasets.forEach(sd => {
      const ds = availableDatasets.find(d => d.id === sd.id);
      ds?.files?.forEach(f => set.add(f));
    });
    // 来自当前选中的数据集（如果未在 selectedDatasets 中）
    if (formData.selectedDataset) {
      const inList = formData.selectedDatasets.some(sd => sd.id === formData.selectedDataset?.id);
      if (!inList) {
        const ds = availableDatasets.find(d => d.id === formData.selectedDataset?.id) || formData.selectedDataset;
        ds?.files?.forEach(f => set.add(f));
      }
    }
    return Array.from(set);
  }, [formData.selectedDatasets, formData.selectedDataset, availableDatasets]);

  // 互斥后的主/协变量候选项 + 搜索过滤
  const filteredMainOptions = useMemo(() => {
    const exclude = new Set(formData.forecastingConfig.covariateFiles || []);
    return aggregatedFileOptions
      .filter(f => !exclude.has(f))
      .filter(f => (mainFilesQuery ? f.toLowerCase().includes(mainFilesQuery.toLowerCase()) : true));
  }, [aggregatedFileOptions, formData.forecastingConfig.covariateFiles, mainFilesQuery]);

  const filteredCovOptions = useMemo(() => {
    const exclude = new Set(formData.forecastingConfig.mainVariableFiles || []);
    return aggregatedFileOptions
      .filter(f => !exclude.has(f))
      .filter(f => (covFilesQuery ? f.toLowerCase().includes(covFilesQuery.toLowerCase()) : true));
  }, [aggregatedFileOptions, formData.forecastingConfig.mainVariableFiles, covFilesQuery]);

  // 选择/取消选择主变量文件（并从协变量中移除，保持互斥）
  const toggleMainFile = (file: string) => {
    const selected = formData.forecastingConfig.mainVariableFiles || [];
    const isChecked = selected.includes(file);
    const nextMain = isChecked ? selected.filter(f => f !== file) : [...selected, file];
    const nextCov = (formData.forecastingConfig.covariateFiles || []).filter(f => !nextMain.includes(f));
    handleInputChange('forecastingConfig', {
      ...formData.forecastingConfig,
      mainVariableFiles: nextMain,
      covariateFiles: nextCov,
    });
  };

  // 选择/取消选择协变量文件（并从主变量中移除，保持互斥）
  const toggleCovFile = (file: string) => {
    const selected = formData.forecastingConfig.covariateFiles || [];
    const isChecked = selected.includes(file);
    const nextCov = isChecked ? selected.filter(f => f !== file) : [...selected, file];
    const nextMain = (formData.forecastingConfig.mainVariableFiles || []).filter(f => !nextCov.includes(f));
    handleInputChange('forecastingConfig', {
      ...formData.forecastingConfig,
      mainVariableFiles: nextMain,
      covariateFiles: nextCov,
    });
  };

  const [availableModels] = useState([
    { 
      id: 'MODEL-006',
      name: 'Limix',
      type: '大模型',
      status: 'available',
      description: 'limix自研结构化数据大模型，支持多种任务',
      accuracy: '95.2%',
      size: '78.9MB',
      supportedTasks: [TASK_TYPES.classification, TASK_TYPES.regression, TASK_TYPES.forecasting],
      trainingTime: '自动调参',
      features: ['模型集成', '无需专业知识']
    },
    { 
      id: 'MODEL-001', 
      name: 'XGBoost', 
      type: '梯度提升', 
      status: 'available',
      description: '基于梯度提升的高性能算法，适用于结构化数据',
      accuracy: '92.5%',
      size: '15.2MB',
      supportedTasks: [TASK_TYPES.classification, TASK_TYPES.forecasting],
      trainingTime: '~30分钟',
      features: ['高准确率', '快速训练', '特征重要性分析']
    }
  ]);

  // 模拟任务数据
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'TASK-001',
      taskName: '销售数据预测模型训练',
      taskType: TASK_TYPES.forecasting,
      projectId: 'proj_003',
      datasetName: '销售数据集',
      datasetVersion: 'v2.1',
      modelName: 'Limix',
      priority: 'high',
      status: 'completed',
      progress: 100,
      createdAt: '2024-01-15T10:30:00Z',
      completedAt: '2024-01-15T12:45:00Z',
      createdBy: '张三',
      description: '基于历史销售数据训练预测模型',
      estimatedTime: 120,
      actualTime: 135
    },
    {
      id: 'TASK-002',
      taskName: '用户行为分析',
      taskType: TASK_TYPES.classification,
      projectId: 'proj_004',
      datasetName: '用户行为数据',
      datasetVersion: 'v1.3',
      modelName: 'XGBoost',
      priority: 'medium',
      status: 'running',
      progress: 65,
      createdAt: '2024-01-16T09:15:00Z',
      createdBy: '李四',
      description: '分析用户行为模式和偏好',
      estimatedTime: 90
    },
    {
      id: 'TASK-003',
      taskName: '产品推荐算法优化',
      taskType: TASK_TYPES.classification,
      projectId: 'proj_001',
      datasetName: '产品数据集',
      datasetVersion: 'v3.0',
      modelName: 'XGBoost',
      priority: 'high',
      status: 'pending',
      progress: 0,
      createdAt: '2024-01-16T14:20:00Z',
      createdBy: '王五',
      description: '对比多种推荐算法效果',
      estimatedTime: 180
    },
    {
      id: 'TASK-004',
      taskName: '客户流失预测',
      taskType: TASK_TYPES.regression,
      projectId: 'proj_004',
      datasetName: '客户数据集',
      datasetVersion: 'v1.8',
      modelName: 'Limix',
      priority: 'high',
      status: 'failed',
      progress: 45,
      createdAt: '2024-01-14T16:00:00Z',
      completedAt: '2024-01-14T17:30:00Z',
      createdBy: '赵六',
      description: '预测客户流失风险',
      estimatedTime: 100,
      actualTime: 90
    },
    {
      id: 'TASK-005',
      taskName: '库存优化模型',
      taskType: TASK_TYPES.forecasting,
      projectName: '电力能源预测',
      datasetName: '库存数据',
      datasetVersion: 'v2.5',
      modelName: 'Limix',
      priority: 'low',
      status: 'archived',
      progress: 100,
      createdAt: '2024-01-10T11:00:00Z',
      completedAt: '2024-01-12T15:30:00Z',
      createdBy: '孙七',
      description: '优化库存管理策略',
      estimatedTime: 200,
      actualTime: 185
    },
    // 新增：演示多数据集联合训练的任务，便于预览多数据集聚合统计
    {
      id: 'TASK-006',
      taskName: '多数据集联合预测实验',
      taskType: TASK_TYPES.forecasting,
      projectId: 'proj_002',
      datasetName: '生产质量数据集',
      datasetVersion: 'v3.0',
      datasets: [
        { id: 'DATA-2025-001', name: '生产质量数据集', version: 'v3.0' },
        { id: 'DATA-2025-002', name: '客户行为数据集', version: 'v2.0' }
      ],
      modelName: 'Limix',
      priority: 'high',
      status: 'running',
      progress: 30,
      createdAt: '2025-01-16T09:50:00Z',
      createdBy: '测试用户',
      description: '跨数据源联合训练以提升预测准确率',
      estimatedTime: 180
    }
  ]);

  // 计算筛选选项：数据集与模型
  const datasetOptions = useMemo(() => {
    const names = new Set<string>();
    availableDatasets.forEach(d => { if (d.name) names.add(d.name); });
    tasks.forEach(t => {
      if (t.datasetName) names.add(t.datasetName);
      t.datasets?.forEach(sd => { if (sd.name) names.add(sd.name); });
    });
    return Array.from(names);
  }, [availableDatasets, tasks]);

  const modelOptions = useMemo(() => {
    const names = new Set<string>();
    availableModels.forEach(m => {
      if (m.status !== 'unavailable' && m.name && ALLOWED_MODELS.has(m.name)) names.add(m.name);
    });
    tasks.forEach(t => {
      if (t.modelName && ALLOWED_MODELS.has(t.modelName)) names.add(t.modelName);
    });
    return Array.from(names);
  }, [availableModels, tasks]);

  // 同步外部对话框状态
  useEffect(() => {
    setIsCreateTaskOpen(isCreateTaskDialogOpen);
  }, [isCreateTaskDialogOpen]);

  /**
   * 同步外部任务补丁到列表（来自 TaskDetailFullPage 的 onTaskPatched）。
   * 参数：externalTaskPatch - { id, patch }
   * 返回值：无
   */
  useEffect(() => {
    if (!externalTaskPatch || !externalTaskPatch.id) return;
    const { id, patch } = externalTaskPatch;
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  }, [externalTaskPatch]);


  /**
   * 返回任务状态的显示配置（徽标颜色、图标与中文标签）。
   * 参数：status - 任务状态枚举值。
   * 返回值：包含 color（Tailwind 类）、icon（图标组件）、label（中文标签）的配置对象。
   */
  const getStatusConfig = (status: TaskStatus) => {
    const configs = {
      not_started: { color: 'bg-gray-100 text-gray-800', icon: Circle, label: '未开始' },
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: '排队中' },
      running: { color: 'bg-blue-100 text-blue-800', icon: Activity, label: '运行中' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: '已完成' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: '失败' },
      cancelled: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: '已取消' },
      archived: { color: 'bg-gray-100 text-gray-600', icon: Archive, label: '已归档' }
    };
    return configs[status];
  };

  /**
   * 返回任务优先级的显示配置（徽标颜色与中文标签）。
   * 参数：priority - 任务优先级枚举值。
   * 返回值：包含 color（Tailwind 类）、label（中文标签）的配置对象。
   */
  const getPriorityConfig = (priority: TaskPriority) => {
    const configs = {
      low: { color: 'bg-gray-100 text-gray-800', label: '低' },
      medium: { color: 'bg-blue-100 text-blue-800', label: '中' },
      high: { color: 'bg-orange-100 text-orange-800', label: '高' }
    } as const;
    return configs[priority];
  };

  // 任务类型映射（中文标签）
  const getTaskTypeLabel = (type: TaskType) => {
    const labels: Record<TaskType, string> = {
      [TASK_TYPES.forecasting]: '时序预测',
      [TASK_TYPES.classification]: '分类',
      [TASK_TYPES.regression]: '回归',
    };
    return labels[type];
  };

  // 筛选和排序逻辑
  const getFilteredAndSortedTasks = () => {
    let filteredTasks = tasks.filter(task => {
      // 搜索查询筛选
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!task.taskName.toLowerCase().includes(query) &&
            !task.id.toLowerCase().includes(query) &&
            !task.datasetName.toLowerCase().includes(query) &&
            !task.modelName.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 任务类型筛选
      if (filters.taskType !== 'all' && task.taskType !== filters.taskType) {
        return false;
      }

      // 状态筛选
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // 数据集名称筛选（多选）
      if (filters.datasetNames && filters.datasetNames.length > 0) {
        const selected = new Set(filters.datasetNames.map(n => n.toLowerCase()));
        const taskDatasets = [
          task.datasetName,
          ...(task.datasets?.map(ds => ds.name) || [])
        ]
          .filter(Boolean)
          .map(n => n.toLowerCase());
        const match = taskDatasets.some(n => selected.has(n));
        if (!match) return false;
      }

      // 模型名称筛选（多选）
      if (filters.modelNames && filters.modelNames.length > 0) {
        const selected = new Set(filters.modelNames.map(n => n.toLowerCase()));
        const model = task.modelName?.toLowerCase();
        if (!model || !selected.has(model)) return false;
      }

      // 所属项目筛选（优先按ID匹配，兼容仅有名称的旧数据）
      if (filters.projectId && filters.projectId !== 'all') {
        const projectIdMatches = task.projectId && task.projectId === filters.projectId;
        const projectNameMatches = task.projectName && (task.projectName === getProjectName(String(filters.projectId)));
        if (!projectIdMatches && !projectNameMatches) {
          return false;
        }
      }

      // 优先级筛选
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // 日期范围筛选
      if (filters.dateRange.start) {
        const taskDate = new Date(task.createdAt);
        const startDate = new Date(filters.dateRange.start);
        if (taskDate < startDate) return false;
      }

      if (filters.dateRange.end) {
        const taskDate = new Date(task.createdAt);
        const endDate = new Date(filters.dateRange.end);
        // 使结束日期为当天的 23:59:59.999，保证筛选为“包含结束当天”
        endDate.setHours(23, 59, 59, 999);
        if (taskDate > endDate) return false;
      }

      return true;
    });

    // 排序
    filteredTasks.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortConfig.field) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'completedAt':
          aValue = a.completedAt ? new Date(a.completedAt) : new Date(0);
          bValue = b.completedAt ? new Date(b.completedAt) : new Date(0);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'taskName':
          aValue = a.taskName;
          bValue = b.taskName;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });

    return filteredTasks;
  };

  // 处理排序
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 表单验证函数
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 任务名称验证
    if (!formData.taskName.trim()) {
      errors.taskName = '任务名称不能为空';
    } else if (formData.taskName.length < 3 || formData.taskName.length > 64) {
      errors.taskName = '任务名称长度应在3-64个字符之间';
    } else if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(formData.taskName)) {
      errors.taskName = '任务名称只能包含字母、数字、中文、下划线和连字符';
    }

    // 任务类型验证
    if (!formData.taskType) {
      errors.taskType = '请选择任务类型';
    }

    // 项目选择验证
    if (!formData.projectId || formData.projectId.trim() === '') {
      errors.projectId = '请选择所属项目';
    }

    // 数据集验证（支持多选）
    if (!formData.selectedDatasets || formData.selectedDatasets.length === 0) {
      // 使用 datasetName 错误键以兼容现有UI提示位置
      errors.datasetName = '请至少选择一个数据集';
    } else {
      // 检查每个数据集是否选择了版本
      const hasMissingVersion = formData.selectedDatasets.some((d) => !d.version);
      if (hasMissingVersion) {
        errors.datasetVersion = '请为每个已选择的数据集选择对应的版本';
      }
    }

    // 特征字段验证（可选）
    if (formData.targetFields.length > 10) {
      errors.targetFields = '最多只能选择10个特征字段';
    }

    // 模型选择验证（默认多选）
    if (formData.models.length === 0) {
      errors.models = '请至少选择一个模型';
    } else if (formData.models.length > 5) {
      errors.models = '最多只能选择5个模型进行并行训练';
    }

    // 超参数/任务配置验证（统一为页面配置对象模式）
    // 根据任务类型校验对应的页面配置
    if (formData.taskType === TASK_TYPES.forecasting) {
      const fc = formData.forecastingConfig;
      // 时间列必选且必须来自公共字段
      if (!fc || !String(fc.timeColumn || '').trim()) {
        errors.forecastingTimeColumn = '请选择时间列（来自公共字段）';
      } else if (!formData.availableFields.includes(fc.timeColumn)) {
        errors.forecastingTimeColumn = '时间列必须来自已选数据集的公共字段';
      }
      // 预测目标列必选且必须来自公共字段，且不能与时间列相同
      if (!fc || !String(fc.targetColumn || '').trim()) {
        errors.forecastingTargetColumn = '请选择预测目标列（来自公共字段）';
      } else if (!formData.availableFields.includes(fc.targetColumn)) {
        errors.forecastingTargetColumn = '预测目标列必须来自已选数据集的公共字段';
      } else if (fc.targetColumn === fc.timeColumn) {
        errors.forecastingTargetColumn = '预测目标列不能与时间列相同';
      }
      if (!fc || fc.contextLength < 1 || fc.contextLength > 10000) {
        errors.forecastingContextLength = '上下文长度应在1-10000之间';
      }
      if (!fc || fc.forecastLength < 1 || fc.forecastLength > 10000) {
        errors.forecastingForecastLength = '预测长度应在1-10000之间';
      }
      if (!fc || fc.stepLength < 1 || fc.stepLength > 10000) {
        errors.forecastingStepLength = '步长应在1-10000之间';
      }
      // 预测开始时间改为非必填：如果为空不报错
      // 若后续需要格式校验，可在此判断非空后再校验格式
    } else if (formData.taskType === TASK_TYPES.classification) {
      const cc = formData.classificationConfig;
      if (!cc) {
        errors.classificationSplit = '请完善分类任务的训练/测试集配置';
      } else {
        const sum = cc.trainRatio + cc.testRatio;
        if (cc.trainRatio <= 0 || cc.testRatio <= 0 || sum !== 100) {
          errors.classificationSplit = '训练/测试比例必须为正且相加等于100%';
        }
      }
    } else if (formData.taskType === TASK_TYPES.regression) {
      const rc = formData.regressionConfig;
      if (!rc) {
        errors.regressionSplit = '请完善回归任务的训练/测试集配置';
      } else {
        const sum = rc.trainRatio + rc.testRatio;
        if (rc.trainRatio <= 0 || rc.testRatio <= 0 || sum !== 100) {
          errors.regressionSplit = '训练/测试比例必须为正且相加等于100%';
        }
      }
    }

    // 资源配置验证
    if (formData.resourceType === 'cpu') {
      if (formData.resourceConfig.cores < 1 || formData.resourceConfig.cores > 32) {
        errors.resourceCores = 'CPU核心数应在1-32之间';
      }
      if (formData.resourceConfig.memory < 1 || formData.resourceConfig.memory > 128) {
        errors.resourceMemory = '内存大小应在1-128GB之间';
      }
    }
    if (formData.resourceConfig.maxRunTime < 5 || formData.resourceConfig.maxRunTime > 2880) {
      errors.resourceMaxRunTime = '最大运行时长应在5-2880分钟之间';
    }
    // GPU/NPU 时加速卡数量校验
    if ((formData.resourceType === 'gpu' || formData.resourceType === 'npu')) {
      const acc = formData.resourceConfig.acceleratorCards ?? 0;
      if (acc < 1 || acc > 8) {
        errors.resourceAcceleratorCards = '加速卡数量应在1-8之间';
      }
    }

    // 描述验证（可选）
    if (formData.description && formData.description.length > 500) {
      errors.description = '任务描述不能超过500个字符';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * 创建任务（提交表单）
   * 功能：校验当前表单数据，构建 Task 对象并追加到任务列表，统一以页面配置对象模式生成 config。
   * 参数：无（使用组件内部的 formData、tasks 等状态）。
   * 返回：Promise<void> — 异步执行，创建成功后更新列表与高亮状态。
   */
  const handleCreateTask = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 构造提交payload：包含多数据集，保持向后兼容的字段
      const firstDs = formData.selectedDatasets[0];
      const payload = {
        ...formData,
        datasets: formData.selectedDatasets,
        datasetName: firstDs ? firstDs.name : (formData.selectedDataset?.name || formData.datasetName),
        datasetVersion: firstDs ? firstDs.version : formData.datasetVersion,
      };

      // 生成下一个任务ID（基于现有ID的最大序号 + 1）
      const nextIdNumber = (() => {
        const nums = tasks
          .map(t => {
            const m = t.id.match(/^TASK-(\d{3,})$/);
            return m ? parseInt(m[1], 10) : 0;
          })
          .filter(n => !isNaN(n));
        const max = nums.length > 0 ? Math.max(...nums) : 0;
        return max + 1;
      })();
      const nextId = `TASK-${String(nextIdNumber).padStart(3, '0')}`;

      // 将表单数据映射为 Task 类型，并追加到任务列表
      const nowIso = new Date().toISOString();
      // 将所选模型ID映射为名称，用于摘要展示
      const selectedModelNames = formData.models.map(id => {
        const m = availableModels.find(mm => mm.id === id);
        return m?.name || id;
      });

      const newTask: Task = {
        id: nextId,
        taskName: formData.taskName,
        taskType: formData.taskType,
        projectId: formData.projectId,
        projectName: getProjectName(formData.projectId),
        datasetName: payload.datasetName || '',
        datasetVersion: payload.datasetVersion || '',
        datasets: formData.selectedDatasets.length > 0 ? formData.selectedDatasets : undefined,
        modelName: (selectedModelNames.length > 0
          ? `${selectedModelNames[0]} 等 ${selectedModelNames.length} 个模型`
          : '未选择模型'),
        priority: formData.priority,
        status: 'pending',
        progress: 0,
        createdAt: nowIso,
        createdBy: '当前用户',
        description: formData.description,
        estimatedTime: formData.resourceConfig?.maxRunTime || undefined,
        hasQueuedBefore: false,
        config: (() => {
          const base: any = { mode: 'page', taskType: formData.taskType };
          if (formData.taskType === TASK_TYPES.forecasting) {
            // 兼容后端旧字段：mainVariableFile 取 mainVariableFiles[0]
            base.forecasting = {
              ...formData.forecastingConfig,
              mainVariableFile: formData.forecastingConfig?.mainVariableFiles?.[0] || undefined,
            };
            base.output = { ...formData.outputConfig.forecasting };
          } else if (formData.taskType === TASK_TYPES.classification) {
            base.classification = { ...formData.classificationConfig };
            base.output = { ...formData.outputConfig.classification };
          } else if (formData.taskType === TASK_TYPES.regression) {
            base.regression = { ...formData.regressionConfig };
            base.output = { ...formData.outputConfig.regression };
          }
          return base;
        })(),
      };

      setTasks(prev => [newTask, ...prev]);
      console.log('创建任务:', newTask);
      // 创建成功后：切换到表格视图，并高亮新任务（选中复选框）
      setViewMode('table');
      setSelectedTaskIds([newTask.id]);
      setHighlightTaskId(newTask.id);
      // 创建成功后：按需求保持在任务列表，不自动打开详情
      // 如果需要恢复为自动打开详情，可将 autoOpenDetailAfterCreate 置为 true
      if (autoOpenDetailAfterCreate) {
        if (onOpenTaskDetailFullPage) {
          onOpenTaskDetailFullPage(newTask);
        } else {
          setSelectedTaskForDetails(newTask);
        }
      }
      
      // 成功后关闭对话框
      setIsCreateTaskOpen(false);
      
      // 这里可以添加成功提示
      // toast.success('任务创建成功');
      
    } catch (error) {
      console.error('创建任务失败:', error);
      // 这里可以添加错误提示
      // toast.error('创建任务失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 保存任务编辑
   * 功能：校验表单后，将编辑中的任务以页面配置对象模式更新其 config 和相关字段。
   * 参数：无（依赖 editingTask 与 formData 等组件状态）。
   * 返回：Promise<void> — 异步执行，保存成功后关闭弹窗并高亮该任务。
   */
  const handleSaveEditTask = async (): Promise<void> => {
    if (!editingTask) return;
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));

      const firstDs = formData.selectedDatasets[0];
      const payload = {
        ...formData,
        datasets: formData.selectedDatasets,
        datasetName: firstDs ? firstDs.name : (formData.selectedDataset?.name || formData.datasetName),
        datasetVersion: firstDs ? firstDs.version : formData.datasetVersion,
      };

      setTasks(prev => prev.map(t => {
        if (t.id !== editingTask.id) return t;
        return {
          ...t,
          taskName: formData.taskName,
          taskType: formData.taskType,
          projectId: formData.projectId,
          projectName: getProjectName(formData.projectId),
          datasetName: payload.datasetName || t.datasetName,
          datasetVersion: payload.datasetVersion || t.datasetVersion,
          datasets: formData.selectedDatasets.length > 0 ? formData.selectedDatasets : undefined,
          modelName: formData.modelSelectionMode === 'single'
            ? formData.modelName
            : (formData.models.length > 0
                ? `${formData.models[0]} 等 ${formData.models.length} 个模型`
                : t.modelName),
          priority: formData.priority,
          description: formData.description,
          // 保持状态、进度不变，仅更新配置（统一为页面配置对象模式）
          config: (() => {
            const base: any = { mode: 'page', taskType: formData.taskType };
            if (formData.taskType === TASK_TYPES.forecasting) {
              base.forecasting = {
                ...formData.forecastingConfig,
                // 兼容后端旧字段：mainVariableFile 取 mainVariableFiles[0]
                mainVariableFile: formData.forecastingConfig?.mainVariableFiles?.[0] || undefined,
              };
              base.output = { ...formData.outputConfig.forecasting };
            } else if (formData.taskType === TASK_TYPES.classification) {
              base.classification = { ...formData.classificationConfig };
              base.output = { ...formData.outputConfig.classification };
            } else if (formData.taskType === TASK_TYPES.regression) {
              base.regression = { ...formData.regressionConfig };
              base.output = { ...formData.outputConfig.regression };
            }
            return base;
          })(),
        };
      }));

      // 关闭弹窗与编辑模式
      setIsCreateTaskOpen(false);
      setIsEditMode(false);
      setEditingTask(null);
      // 高亮修改的任务
      setViewMode('table');
      setSelectedTaskIds([editingTask.id]);
      setHighlightTaskId(editingTask.id);
    } catch (error) {
      console.error('保存编辑失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 当需要高亮某个任务时，滚动至该任务所在行，并在几秒后自动移除高亮效果
  useEffect(() => {
    if (!highlightTaskId) return;
    // 仅当当前是表格视图时，滚动定位到高亮任务
    if (viewMode === 'table') {
      const el = document.getElementById(`task-row-${highlightTaskId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    // 高亮保持，直到用户手动修改选择或再次创建任务
    return () => {};
  }, [highlightTaskId, viewMode]);

  // 处理任务选择
  const handleTaskSelection = (taskId: string, checked: boolean) => {
    setSelectedTaskIds(prev => 
      checked 
        ? [...prev, taskId]
        : prev.filter(id => id !== taskId)
    );
  };

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    const filteredTasks = getFilteredAndSortedTasks();
    setSelectedTaskIds(checked ? filteredTasks.map(task => task.id) : []);
  };

  // 处理表单输入
  const handleInputChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 将当前选中的数据集 + 版本加入到 selectedDatasets 列表（若已存在则更新版本）
  const addSelectedDataset = () => {
    const current = formData.selectedDataset;
    if (!current) {
      setFormErrors(prev => ({ ...prev, datasetName: '请选择数据集' }));
      return;
    }
    if (!formData.datasetVersion) {
      setFormErrors(prev => ({ ...prev, datasetVersion: '请选择数据版本' }));
      return;
    }

    setFormData(prev => {
      const existsIdx = prev.selectedDatasets.findIndex(d => d.id === current.id);
      let nextList = [...prev.selectedDatasets];
      const newEntry: SelectedDatasetEntry = {
        id: current.id,
        name: current.name,
        version: formData.datasetVersion
      };
      if (existsIdx >= 0) {
        nextList[existsIdx] = newEntry; // 更新版本
      } else {
        nextList.push(newEntry);
      }
      return {
        ...prev,
        selectedDatasets: nextList
      };
    });
    // 清理相关错误
    setFormErrors(prev => {
      const { datasetName, datasetVersion, ...rest } = prev;
      return rest;
    });
  };

  // 从 selectedDatasets 列表移除指定数据集
  const removeSelectedDataset = (datasetId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedDatasets: prev.selectedDatasets.filter(d => d.id !== datasetId)
    }));
  };

  // 直接在“已选数据集列表”中更新某条目的版本
  const updateSelectedDatasetVersion = (datasetId: string, newVersion: string) => {
    setFormData(prev => {
      const nextList = prev.selectedDatasets.map(d => 
        d.id === datasetId ? { ...d, version: newVersion } : d
      );
      const next: typeof prev = { ...prev, selectedDatasets: nextList };
      // 如果当前上方选择器正好是这个数据集，则同步更新其版本选择
      if (prev.selectedDataset?.id === datasetId) {
        next.datasetVersion = newVersion;
      }
      return next;
    });
  };

  // 点击某个已选条目后回填到当前选择器，以便修改再更新回列表
  const backfillSelectedDataset = (datasetId: string) => {
    const ds = availableDatasets.find(d => d.id === datasetId);
    const sd = formData.selectedDatasets.find(d => d.id === datasetId);
    if (!ds) return;
    setFormData(prev => ({
      ...prev,
      datasetName: ds.id, // 注意：选择器使用的是数据集ID
      selectedDataset: ds,
      datasetVersion: sd?.version || (ds.versions?.[0]?.version ?? '')
    }));
  };

  // 处理筛选条件变化
  const handleFilterChange = (field: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      taskType: 'all',
      status: 'all',
      projectId: 'all',
      datasetNames: [],
      modelNames: [],
      priority: 'all',
      dateRange: { start: '', end: '' },
      searchQuery: ''
    });
  };

  /**
   * handleApplyQuery
   * 功能：显式触发“查询”动作。
   * 说明：列表过滤已基于 filters 响应式生效；此函数用于用户点击“查询”按钮时进行一次轻量刷新（浅拷贝触发渲染），不更改任何筛选状态。
   * 返回：void
   */
  const handleApplyQuery = (): void => {
    setFilters(prev => ({ ...prev }));
  };

  // 显示确认对话框
  const handleTaskAction = (action: string, taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // 处理查看详情操作
    if (action.trim() === 'view') {
      if (onOpenTaskDetailFullPage) {
        onOpenTaskDetailFullPage(task);
      } else {
        // 如果没有全页面回调，使用原有的模态框
        setSelectedTaskForDetails(task);
      }
      return;
    }

    // 处理编辑任务操作（支持失败任务等状态）
    if (action.trim() === 'edit') {
      // 预填创建表单为编辑模式
      const matchedProjectId = task.projectId || (mockProjects.find(p => p.name === task.projectName)?.id ?? '');
      // 通过数据集名称匹配ID
      const matchedDataset = availableDatasets.find(d => d.name === task.datasetName);
      const availableFields = matchedDataset?.previewData && matchedDataset.previewData.length > 0
        ? Object.keys(matchedDataset.previewData[0])
        : [];
      // 从任务的模型摘要中尽可能解析出已选择的模型名称（兼容“Limix 等 N 个模型”或逗号/顿号分隔的形式）
      const parsedModels = (() => {
        const name = task.modelName || '';
        if (!name || /未选择模型/.test(name)) return [];
        // 处理“xxx 等 N 个模型”
        if (name.includes('等') && name.includes('模型')) {
          const first = name.split('等')[0].trim();
          return first ? [first] : [];
        }
        // 处理逗号/顿号/分号分隔
        return name
          .split(/[，,、;]+/)
          .map(s => s.trim())
          .filter(Boolean);
      })();
      // 将解析出的模型名称转换为可识别的模型ID
      const nameToId = new Map<string, string>(availableModels.map(m => [m.name, m.id]));
      const editModels = parsedModels
        .map(n => nameToId.get(n))
        .filter((id): id is string => Boolean(id));
      setFormData(prev => {
        const parsedCfg = (() => {
          try {
            if (typeof task.config === 'string') return JSON.parse(task.config);
            if (typeof task.config === 'object' && task.config !== null) return task.config;
            return null;
          } catch (_) { return null; }
        })();
        const parsedOutput: any = parsedCfg?.output;
        return {
          ...prev,
          taskName: task.taskName,
          taskType: task.taskType,
          projectId: matchedProjectId,
          datasetName: matchedDataset?.id || '',
          datasetVersion: task.datasetVersion || '',
          selectedDataset: matchedDataset || null,
          selectedDatasets: task.datasets ?? [],
          modelSelectionMode: 'multiple',
          modelName: task.modelName,
          models: editModels,
          targetFields: [],
          availableFields,
          priority: task.priority,
          description: task.description || '',
          forecastingConfig: (typeof parsedCfg === 'object' && parsedCfg?.forecasting)
            ? {
                timeColumn: parsedCfg.forecasting.timeColumn ?? '',
                targetColumn: parsedCfg.forecasting.targetColumn ?? '',
                contextLength: parsedCfg.forecasting.contextLength ?? 24,
                forecastLength: parsedCfg.forecasting.forecastLength ?? 12,
                stepLength: parsedCfg.forecasting.stepLength ?? 1,
                startTime: parsedCfg.forecasting.startTime ?? '',
                // 兼容旧数据：如果只存在 mainVariableFile，则转为数组
                mainVariableFiles: (parsedCfg.forecasting.mainVariableFiles
                  ? parsedCfg.forecasting.mainVariableFiles
                  : (parsedCfg.forecasting.mainVariableFile ? [parsedCfg.forecasting.mainVariableFile] : [])),
                covariateFiles: parsedCfg.forecasting.covariateFiles ?? []
              }
            : {
                timeColumn: '',
                targetColumn: '',
                contextLength: 24,
                forecastLength: 12,
                stepLength: 1,
                startTime: '',
                mainVariableFiles: [],
                covariateFiles: []
              },
          classificationConfig: (typeof parsedCfg === 'object' && parsedCfg?.classification)
            ? {
                trainRatio: parsedCfg.classification.trainRatio ?? 80,
                testRatio: parsedCfg.classification.testRatio ?? 20,
                shuffle: parsedCfg.classification.shuffle ?? false
              }
            : {
                trainRatio: 80,
                testRatio: 20,
                shuffle: false
              },
          regressionConfig: (typeof parsedCfg === 'object' && parsedCfg?.regression)
            ? {
                trainRatio: parsedCfg.regression.trainRatio ?? 80,
                testRatio: parsedCfg.regression.testRatio ?? 20,
                shuffle: parsedCfg.regression.shuffle ?? false
              }
            : {
                trainRatio: 80,
                testRatio: 20,
                shuffle: false
              },
          outputConfig: (() => {
            const current = prev.outputConfig;
            if (parsedOutput && typeof parsedOutput === 'object' && !Array.isArray(parsedOutput)) {
              if (task.taskType === TASK_TYPES.forecasting) {
                return {
                  ...current,
                  forecasting: {
                    metrics: {
                      mse: Boolean(parsedOutput.metrics?.mse ?? current.forecasting.metrics.mse),
                      rmse: Boolean(parsedOutput.metrics?.rmse ?? current.forecasting.metrics.rmse),
                      mae: Boolean(parsedOutput.metrics?.mae ?? current.forecasting.metrics.mae),
                      mape: Boolean(parsedOutput.metrics?.mape ?? current.forecasting.metrics.mape),
                      r2: Boolean(parsedOutput.metrics?.r2 ?? current.forecasting.metrics.r2),
                      relDeviationPercents: Array.isArray(parsedOutput.metrics?.relDeviationPercents)
                        ? parsedOutput.metrics.relDeviationPercents
                        : current.forecasting.metrics.relDeviationPercents,
                      absDeviationValues: Array.isArray(parsedOutput.metrics?.absDeviationValues)
                        ? parsedOutput.metrics.absDeviationValues
                        : current.forecasting.metrics.absDeviationValues,
                      customMetrics: Array.isArray(parsedOutput.metrics?.customMetrics)
                        ? parsedOutput.metrics.customMetrics
                        : current.forecasting.metrics.customMetrics,
                    },
                    visualizations: {
                      lineChart: Boolean(parsedOutput.visualizations?.lineChart ?? current.forecasting.visualizations.lineChart),
                      residualPlot: Boolean(parsedOutput.visualizations?.residualPlot ?? current.forecasting.visualizations.residualPlot),
                      predVsTrueScatter: Boolean(parsedOutput.visualizations?.predVsTrueScatter ?? current.forecasting.visualizations.predVsTrueScatter),
                      errorHistogram: Boolean(parsedOutput.visualizations?.errorHistogram ?? current.forecasting.visualizations.errorHistogram),
                    },
                  },
                };
              } else if (task.taskType === TASK_TYPES.classification) {
                const def = current.classification.metrics;
                return {
                  ...current,
                  classification: {
                    metrics: {
                      precision: { enabled: Boolean(parsedOutput.metrics?.precision?.enabled ?? def.precision.enabled), average: (((parsedOutput.metrics?.precision?.average === 'none') ? 'acc' : parsedOutput.metrics?.precision?.average) as AverageMethod) || def.precision.average },
                      recall: { enabled: Boolean(parsedOutput.metrics?.recall?.enabled ?? def.recall.enabled), average: (((parsedOutput.metrics?.recall?.average === 'none') ? 'acc' : parsedOutput.metrics?.recall?.average) as AverageMethod) || def.recall.average },
                      f1: { enabled: Boolean(parsedOutput.metrics?.f1?.enabled ?? def.f1.enabled), average: (((parsedOutput.metrics?.f1?.average === 'none') ? 'acc' : parsedOutput.metrics?.f1?.average) as AverageMethod) || def.f1.average },
                      accuracy: { enabled: Boolean(parsedOutput.metrics?.accuracy?.enabled ?? def.accuracy.enabled), average: (((parsedOutput.metrics?.accuracy?.average === 'none') ? 'acc' : parsedOutput.metrics?.accuracy?.average) as AverageMethod) || def.accuracy.average },
                      rocAuc: { enabled: Boolean(parsedOutput.metrics?.rocAuc?.enabled ?? def.rocAuc.enabled), average: (((parsedOutput.metrics?.rocAuc?.average === 'none') ? 'acc' : parsedOutput.metrics?.rocAuc?.average) as AverageMethod) || def.rocAuc.average },
                      customMetricCode: typeof parsedOutput.metrics?.customMetricCode === 'string' ? parsedOutput.metrics.customMetricCode : def.customMetricCode
                    },
                    visualizations: {
                      rocCurve: Boolean(parsedOutput.visualizations?.rocCurve ?? current.classification.visualizations.rocCurve),
                      prCurve: Boolean(parsedOutput.visualizations?.prCurve ?? current.classification.visualizations.prCurve),
                      confusionMatrix: Boolean(parsedOutput.visualizations?.confusionMatrix ?? current.classification.visualizations.confusionMatrix),
                    },
                  },
                };
              } else if (task.taskType === TASK_TYPES.regression) {
                return {
                  ...current,
                  regression: {
                    metrics: {
                      mse: Boolean(parsedOutput.metrics?.mse ?? current.regression.metrics.mse),
                      rmse: Boolean(parsedOutput.metrics?.rmse ?? current.regression.metrics.rmse),
                      mae: Boolean(parsedOutput.metrics?.mae ?? current.regression.metrics.mae),
                      mape: Boolean(parsedOutput.metrics?.mape ?? current.regression.metrics.mape),
                      r2: Boolean(parsedOutput.metrics?.r2 ?? current.regression.metrics.r2),
                      relDeviationPercents: Array.isArray(parsedOutput.metrics?.relDeviationPercents)
                        ? parsedOutput.metrics.relDeviationPercents
                        : current.regression.metrics.relDeviationPercents,
                      absDeviationValues: Array.isArray(parsedOutput.metrics?.absDeviationValues)
                        ? parsedOutput.metrics.absDeviationValues
                        : current.regression.metrics.absDeviationValues,
                      customMetrics: Array.isArray(parsedOutput.metrics?.customMetrics)
                        ? parsedOutput.metrics.customMetrics
                        : current.regression.metrics.customMetrics,
                    },
                    visualizations: {
                      lineChart: Boolean(parsedOutput.visualizations?.lineChart ?? current.regression.visualizations.lineChart),
                      residualPlot: Boolean(parsedOutput.visualizations?.residualPlot ?? current.regression.visualizations.residualPlot),
                      predVsTrueScatter: Boolean(parsedOutput.visualizations?.predVsTrueScatter ?? current.regression.visualizations.predVsTrueScatter),
                      errorHistogram: Boolean(parsedOutput.visualizations?.errorHistogram ?? current.regression.visualizations.errorHistogram),
                    },
                  },
                };
              }
            }
            return current;
          })(),
          resourceType: 'cpu',
          resourceConfig: { cores: 4, memory: 32, maxRunTime: 120, acceleratorCards: 1 },
        };
      });
      setIsEditMode(true);
      setEditingTask(task);
      setIsCreateTaskOpen(true);
      return;
    }
    
    // 对于需要确认的操作，显示确认对话框
    if (['start', 'stop', 'archive', 'retry', 'rerun', 'cancel_queue', 'delete'].includes(action.trim())) {
      setConfirmDialog({
        isOpen: true,
        action: action.trim(),
        taskId,
        taskName: task.taskName
      });
    } else {
      // 对于其他操作，直接执行
      executeTaskAction(action.trim(), taskId);
    }
  };

  // 执行实际的任务操作
  const performNetworkAction = async (action: string, taskId: string) => {
    // 模拟网络请求耗时与失败
    await new Promise(resolve => setTimeout(resolve, 600));
    const failRate = 0.15; // 15% 失败率模拟
    if (Math.random() < failRate) {
      throw new Error('网络请求失败，请稍后重试');
    }
  };

  const exportTask = (task: Task) => {
    try {
      const payload = {
        id: task.id,
        taskName: task.taskName,
        status: task.status,
        projectId: task.projectId,
        datasetName: task.datasetName,
        datasetVersion: task.datasetVersion,
        modelName: task.modelName,
        createdAt: task.createdAt,
        completedAt: task.completedAt ?? null,
        description: task.description ?? '',
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task_${task.id}_details.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error('导出失败');
    }
  };

  /**
   * 执行任务操作（前端模拟）。
   * 参数：
   *  - action: 操作键（start/stop/retry/rerun/cancel_queue/archive/delete/...）。
   *  - taskId: 目标任务ID。
   * 返回值：无（通过状态更新与 toast 反馈交互结果）。
   */
  const executeTaskAction = async (action: string, taskId: string) => {
    setLoadingAction(`${taskId}:${action}`);
    try {
      await performNetworkAction(action, taskId);
      if (action === 'start') {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'running', progress: t.progress !== undefined ? t.progress : 5 } : t));
        setStatusAnimTaskId(taskId);
        toast.success('任务已开始');
      } else if (action === 'stop') {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'cancelled' } : t));
        setStatusAnimTaskId(taskId);
        toast.success('任务已停止');
      } else if (action === 'cancel') {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'cancelled' } : t));
        setStatusAnimTaskId(taskId);
        toast.success('任务已取消');
      } else if (action === 'retry') {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending', progress: undefined } : t));
        setStatusAnimTaskId(taskId);
        toast.success('任务已进入排队');
      } else if (action === 'rerun') {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending', progress: undefined } : t));
        setStatusAnimTaskId(taskId);
        toast.success('任务已进入排队');
      } else if (action === 'cancel_queue') {
        // 取消排队后：标记 hasQueuedBefore 为 true，使未开始状态显示“重新运行”按钮
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'not_started', progress: undefined, hasQueuedBefore: true } : t));
        setStatusAnimTaskId(taskId);
        toast.success('已取消排队，任务回到未开始状态');
      } else if (action === 'archive') {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'archived' } : t));
        setStatusAnimTaskId(taskId);
        toast.success('任务已归档');
      } else if (action === 'delete') {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast.success('任务已删除');
      } else if (action === 'copy') {
        const source = tasks.find(t => t.id === taskId);
        if (source) {
          const newId = `${source.id}-COPY-${Math.floor(Math.random() * 1000)}`;
          const newTask: Task = {
            ...source,
            id: newId,
            taskName: `${source.taskName}（副本）`,
            status: 'pending',
            progress: undefined,
            createdAt: new Date().toISOString(),
            completedAt: undefined,
            hasQueuedBefore: false,
          };
          setTasks(prev => [newTask, ...prev]);
          setHighlightTaskId(newId);
          toast.success('已创建任务副本');
        }
      } else if (action === 'export') {
        const task = tasks.find(t => t.id === taskId);
        if (task) exportTask(task);
        toast.success('已导出任务详情');
      }
      setActionLogs(prev => [...prev, { ts: Date.now(), taskId, action, success: true }]);
    } catch (err: any) {
      const msg = err?.message || '操作失败';
      toast.error(msg);
      setActionLogs(prev => [...prev, { ts: Date.now(), taskId, action, success: false, message: msg }]);
    } finally {
      setLoadingAction(null);
      setConfirmDialog({ isOpen: false, action: '', taskId: '', taskName: '' });
    }
  };

  // 取消确认操作
  const handleCancelConfirm = () => {
    setConfirmDialog({
      isOpen: false,
      action: '',
      taskId: '',
      taskName: ''
    });
  };

  // 批量操作函数
  const handleBatchAction = (action: string) => {
    console.log(`批量操作: ${action}, 选中任务: ${selectedTaskIds}`);
    // 这里可以添加具体的批量操作逻辑
  };

  // 获取可用操作按钮 & 常用操作键已迁移到共享工具（src/utils/taskActions.ts）
  // 详情与列表页统一调用 getAvailableActions / getCommonActionKeys。

  const filteredTasks = getFilteredAndSortedTasks();

  // 示例对比数据（分类任务）
  const taskCompareDemoA: TaskCompareItem = {
    info: { id: 'TC-A', name: '分类任务 A', dataset: 'CreditRisk v1.0', model: 'AutoGluon (v0.8)' },
    type: TASK_TYPES.classification,
    metrics: {
      accuracy: 0.86,
      precision: 0.83,
      recall: 0.81,
      f1: 0.82,
      rocAuc: 0.88,
      rocCurve: Array.from({ length: 11 }, (_, i) => ({ fpr: i / 10, tpr: Math.min(1, (i / 10) ** 0.7) })),
      confusionMatrix: [
        [420, 80],
        [70, 430]
      ],
      ci95: { accuracy: [0.84, 0.88] as [number, number] }
    },
    causalGraph: {
      nodes: [
        { id: 'n1', label: '年龄', x: 40, y: 60 },
        { id: 'n2', label: '收入', x: 160, y: 60 },
        { id: 'n3', label: '违约', x: 100, y: 160 }
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.6 },
        { source: 'n2', target: 'n3', influenceStrength: 0.8 }
      ]
    },
    phases: [
      { name: '数据加载', durationSec: 35 },
      { name: '训练', durationSec: 180 },
      { name: '评估', durationSec: 40 }
    ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 30 + Math.sin(i / 3) * 20, gpu: 0 })),
    totalTimeSec: 255,
    trainTimeSec: 180,
    inferTimeMs: 40,
    quota: { gpuMemGB: 8, cpuCores: 8, ramGB: 16, timeLimitMin: 60 },
    actual: { gpuMemGB: 0, cpuCores: 6, ramGB: 12 },
    warnings: ['评估阶段出现少量类别不平衡']
  };

  const taskCompareDemoB: TaskCompareItem = {
    info: { id: 'TC-B', name: '分类任务 B', dataset: 'CreditRisk v1.0', model: 'LimX (v1.2)' },
    type: TASK_TYPES.classification,
    metrics: {
      accuracy: 0.90,
      precision: 0.89,
      recall: 0.86,
      f1: 0.87,
      rocAuc: 0.92,
      rocCurve: Array.from({ length: 11 }, (_, i) => ({ fpr: i / 10, tpr: Math.min(1, (i / 10) ** 0.6) })),
      confusionMatrix: [
        [450, 50],
        [55, 445]
      ],
      ci95: { accuracy: [0.88, 0.92] as [number, number] }
    },
    causalGraph: {
      nodes: [
        { id: 'n1', label: '年龄', x: 40, y: 60 },
        { id: 'n2', label: '收入', x: 160, y: 60 },
        { id: 'n3', label: '违约', x: 100, y: 160 }
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.4 },
        { source: 'n2', target: 'n3', influenceStrength: 0.9 }
      ]
    },
    phases: [
      { name: '数据加载', durationSec: 28 },
      { name: '训练', durationSec: 150 },
      { name: '评估', durationSec: 35 }
    ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 35 + Math.cos(i / 3) * 20, gpu: 0 })),
    totalTimeSec: 213,
    trainTimeSec: 150,
    inferTimeMs: 35,
    quota: { gpuMemGB: 8, cpuCores: 8, ramGB: 16, timeLimitMin: 60 },
    actual: { gpuMemGB: 0, cpuCores: 6, ramGB: 12 },
    warnings: ['训练阶段进行了早停']
  };

  // 示例对比数据（回归任务）
  const taskCompareRegA: TaskCompareItem = {
    info: { id: 'TR-A', name: '回归任务 A', dataset: 'HousePrice v2.0', model: 'XGBoostRegressor (v1.0)' },
    type: TASK_TYPES.regression,
    metrics: {
      mse: 0.024,
      rmse: 0.155,
      mae: 0.112,
      r2: 0.89,
      residuals: Array.from({ length: 60 }, (_, i) => ({ x: i, y: (Math.sin(i / 5) * 0.05) - 0.02 + (Math.random() - 0.5) * 0.02 }))
    },
    causalGraph: {
      nodes: [
        { id: 'n1', label: '面积', x: 60, y: 60 },
        { id: 'n2', label: '房龄', x: 180, y: 60 },
        { id: 'n3', label: '价格', x: 120, y: 160 }
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.85 },
        { source: 'n2', target: 'n3', influenceStrength: -0.35 }
      ]
    },
    phases: [
      { name: '数据加载', durationSec: 25 },
      { name: '训练', durationSec: 120 },
      { name: '评估', durationSec: 30 }
    ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 40 + Math.sin(i / 3) * 15, gpu: 0 })),
    totalTimeSec: 175,
    trainTimeSec: 120,
    inferTimeMs: 25,
    quota: { gpuMemGB: 0, cpuCores: 8, ramGB: 16, timeLimitMin: 45 },
    actual: { gpuMemGB: 0, cpuCores: 6, ramGB: 12 },
    warnings: ['数据标准化后效果更稳定']
  };

  const taskCompareRegB: TaskCompareItem = {
    info: { id: 'TR-B', name: '回归任务 B', dataset: 'HousePrice v2.0', model: 'LightGBMRegressor (v3.2)' },
    type: TASK_TYPES.regression,
    metrics: {
      mse: 0.020,
      rmse: 0.141,
      mae: 0.105,
      r2: 0.91,
      residuals: Array.from({ length: 60 }, (_, i) => ({ x: i, y: (Math.cos(i / 4) * 0.04) - 0.01 + (Math.random() - 0.5) * 0.02 }))
    },
    causalGraph: {
      nodes: [
        { id: 'n1', label: '面积', x: 60, y: 60 },
        { id: 'n2', label: '房龄', x: 180, y: 60 },
        { id: 'n3', label: '价格', x: 120, y: 160 }
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.80 },
        { source: 'n2', target: 'n3', influenceStrength: -0.28 }
      ]
    },
    phases: [
      { name: '数据加载', durationSec: 22 },
      { name: '训练', durationSec: 100 },
      { name: '评估', durationSec: 28 }
    ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 35 + Math.cos(i / 3) * 15, gpu: 0 })),
    totalTimeSec: 150,
    trainTimeSec: 100,
    inferTimeMs: 22,
    quota: { gpuMemGB: 0, cpuCores: 8, ramGB: 16, timeLimitMin: 45 },
    actual: { gpuMemGB: 0, cpuCores: 6, ramGB: 12 },
    warnings: ['模型对异常值较为敏感，建议加强鲁棒性']
  };

  // 示例对比数据（时序预测任务）
  const forecastSeriesBase = Array.from({ length: 50 }, (_, i) => {
    const actual = 50 + i * 0.8 + Math.sin(i / 4) * 5 + (Math.random() - 0.5) * 2;
    return actual;
  });
  const taskCompareFctA: TaskCompareItem = {
    info: { id: 'TF-A', name: '时序预测任务 A', dataset: 'EnergyLoad v1.0', model: 'Prophet (v1.1)' },
    type: TASK_TYPES.forecasting,
    metrics: (() => {
      const series = forecastSeriesBase.map((a, t) => ({ t, actual: a, predicted: a * (1 + ((Math.random() - 0.5) * 0.06)) }));
      const errors = series.map(p => Math.abs(p.predicted - p.actual));
      const mae = errors.reduce((s, e) => s + e, 0) / errors.length;
      const rmse = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);
      const mape = series.reduce((s, p) => s + Math.abs((p.predicted - p.actual) / p.actual), 0) / series.length;
      const residuals = series.map((p, i) => ({ x: i, y: p.predicted - p.actual }));
      return { mae, rmse, mape, smape: mape, r2: 0.72, series, residuals };
    })(),
    causalGraph: {
      nodes: [
        { id: 'n1', label: '温度', x: 60, y: 60 },
        { id: 'n2', label: '工作日', x: 180, y: 60 },
        { id: 'n3', label: '负载', x: 120, y: 160 }
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.55 },
        { source: 'n2', target: 'n3', influenceStrength: 0.35 }
      ]
    },
    phases: [
      { name: '数据加载', durationSec: 30 },
      { name: '训练', durationSec: 160 },
      { name: '评估', durationSec: 35 }
    ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 38 + Math.sin(i / 3) * 18, gpu: 0 })),
    totalTimeSec: 225,
    trainTimeSec: 160,
    inferTimeMs: 30,
    quota: { gpuMemGB: 8, cpuCores: 8, ramGB: 16, timeLimitMin: 60 },
    actual: { gpuMemGB: 0, cpuCores: 6, ramGB: 12 },
    warnings: ['节假日影响导致误差波动']
  };

  const taskCompareFctB: TaskCompareItem = {
    info: { id: 'TF-B', name: '时序预测任务 B', dataset: 'EnergyLoad v1.0', model: 'AutoTS (v0.6)' },
    type: TASK_TYPES.forecasting,
    metrics: (() => {
      const series = forecastSeriesBase.map((a, t) => ({ t, actual: a, predicted: a * (1 + ((Math.random() - 0.5) * 0.04)) }));
      const errors = series.map(p => Math.abs(p.predicted - p.actual));
      const mae = errors.reduce((s, e) => s + e, 0) / errors.length;
      const rmse = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);
      const mape = series.reduce((s, p) => s + Math.abs((p.predicted - p.actual) / p.actual), 0) / series.length;
      const residuals = series.map((p, i) => ({ x: i, y: p.predicted - p.actual }));
      return { mae, rmse, mape, smape: mape, r2: 0.78, series, residuals };
    })(),
    causalGraph: {
      nodes: [
        { id: 'n1', label: '温度', x: 60, y: 60 },
        { id: 'n2', label: '工作日', x: 180, y: 60 },
        { id: 'n3', label: '负载', x: 120, y: 160 }
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.50 },
        { source: 'n2', target: 'n3', influenceStrength: 0.40 }
      ]
    },
    phases: [
      { name: '数据加载', durationSec: 28 },
      { name: '训练', durationSec: 140 },
      { name: '评估', durationSec: 32 }
    ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 36 + Math.cos(i / 3) * 18, gpu: 0 })),
    totalTimeSec: 200,
    trainTimeSec: 140,
    inferTimeMs: 26,
    quota: { gpuMemGB: 8, cpuCores: 8, ramGB: 16, timeLimitMin: 60 },
    actual: { gpuMemGB: 0, cpuCores: 6, ramGB: 12 },
    warnings: ['模型对温度的影响权重略低']
  };

  return (
    <div className="p-6 space-y-6">
      {/* 操作栏 */}
      <div className="flex justify-between items-center gap-4 flex-wrap md:flex-nowrap">
        {/* 左侧：顶栏快速筛选（搜索 / 数据集名称 / 日期范围） */}
        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
          {/* 搜索 */}
          <Input
            placeholder="搜索任务名称、ID等"
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className="w-[240px] md:w-[280px]"
          />

          {/* 数据集名称（多选） */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] md:w-[260px] justify-start">
                {filters.datasetNames.length === 0
                  ? '筛选数据集'
                  : `${filters.datasetNames.slice(0, 2).join(', ')}${filters.datasetNames.length > 2 ? ` +${filters.datasetNames.length - 2}` : ''}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput
                  placeholder="搜索数据集..."
                  value={datasetFilterQuery}
                  onValueChange={setDatasetFilterQuery}
                />
                <CommandList>
                  <CommandEmpty>未找到数据集</CommandEmpty>
                  <CommandGroup>
                    {datasetOptions
                      .filter((name) => !datasetFilterQuery || name.toLowerCase().includes(datasetFilterQuery.toLowerCase()))
                      .map((name) => (
                        <CommandItem
                          key={name}
                          onSelect={() => {
                            const cur = filters.datasetNames || [];
                            const next = cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name];
                            handleFilterChange('datasetNames', next);
                          }}
                        >
                          <Checkbox
                            checked={filters.datasetNames.includes(name)}
                            onCheckedChange={() => {
                              const cur = filters.datasetNames || [];
                              const next = cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name];
                              handleFilterChange('datasetNames', next);
                            }}
                            className="mr-2"
                          />
                          <span>{name}</span>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* 日期范围 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[260px] md:w-[320px] justify-between">
                <span className="truncate text-left">
                  {filters.dateRange.start && filters.dateRange.end
                    ? `${filters.dateRange.start} - ${filters.dateRange.end}`
                    : '开始日期 - 结束日期'}
                </span>
                <Calendar className="h-4 w-4 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[640px] p-4">
              <div className="space-y-3">
                {/* 顶部输入回显区域 */}
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    placeholder="开始日期"
                    value={filters.dateRange.start || ''}
                    className="w-48"
                  />
                  <span className="text-gray-500">-</span>
                  <Input
                    readOnly
                    placeholder="结束日期"
                    value={filters.dateRange.end || ''}
                    className="w-48"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('dateRange', { start: '', end: '' })}
                  >
                    {t('common.clear')}
                  </Button>
                </div>

                {/* 双月日历选择 */}
                <DateRangeCalendar
                  mode="range"
                  numberOfMonths={2}
                  initialFocus
                  defaultMonth={filters.dateRange.start ? new Date(filters.dateRange.start) : new Date()}
                  selected={{
                    from: filters.dateRange.start ? new Date(filters.dateRange.start) : undefined,
                    to: filters.dateRange.end ? new Date(filters.dateRange.end) : undefined,
                  }}
                  onSelect={(range: any) => {
                    const start = range?.from ? new Date(range.from) : undefined;
                    const end = range?.to ? new Date(range.to) : undefined;
                    const fmt = (d: Date | undefined) => (d ? d.toISOString().slice(0, 10) : '');
                    handleFilterChange('dateRange', { start: fmt(start), end: fmt(end) });
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* 右侧：查询 / 重置 / 视图切换 / 创建任务 */}
        <div className="flex items-center space-x-3">
          <Button
            variant="default"
            size="sm"
            onClick={handleApplyQuery}
            className="flex items-center space-x-2"
          >
            <span>查询</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="flex items-center space-x-2"
          >
            <span>重置</span>
          </Button>
          
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={isCreateTaskOpen} onOpenChange={(open) => {
            setIsCreateTaskOpen(open);
            onCreateTaskDialogChange?.(open);
            if (!open) {
              // 重置到第1步
              setCurrentStep(1);
              // 重置表单
              setFormData({
                taskName: '',
                taskType: TASK_TYPES.forecasting,
                projectId: '',
                datasetName: '',
                datasetVersion: '',
                selectedDataset: null,
                selectedDatasets: [],
                modelName: '',
                models: [],
                modelSelectionMode: 'multiple',
                targetFields: [],
                availableFields: [],
                priority: 'medium',
                description: '',
              
              forecastingConfig: {
                timeColumn: '',
                targetColumn: '',
                contextLength: 24,
                forecastLength: 12,
                stepLength: 1,
                startTime: '',
                mainVariableFiles: [],
                covariateFiles: []
              },
                classificationConfig: {
                  trainRatio: 80,
                  testRatio: 20,
                  shuffle: false
                },
                regressionConfig: {
                  trainRatio: 80,
                  testRatio: 20,
                  shuffle: false
                },
                // 输出配置默认值（关闭弹窗时重置）
                outputConfig: {
                  forecasting: {
                    metrics: {
                      mse: true,
                      rmse: true,
                      mae: true,
                      mape: true,
                      r2: true,
                      relDeviationPercents: [10],
                      absDeviationValues: [10],
                      customMetrics: []
                    },
                    visualizations: {
                      lineChart: true,
                      residualPlot: true,
                      predVsTrueScatter: true,
                      errorHistogram: true
                    }
                  },
                  classification: {
                    metrics: {
                      precision: { enabled: true, average: 'binary' },
                      recall: { enabled: true, average: 'binary' },
                      f1: { enabled: true, average: 'macro' },
                      accuracy: { enabled: true, average: 'acc' },
                      rocAuc: { enabled: true, average: 'macro' },
                      customMetricCode: ''
                    },
                    visualizations: {
                      rocCurve: true,
                      prCurve: true,
                      confusionMatrix: true
                    }
                  },
                  regression: {
                    metrics: {
                      mse: true,
                      rmse: true,
                      mae: true,
                      mape: true,
                      r2: true,
                      relDeviationPercents: [10],
                      absDeviationValues: [10],
                      customMetrics: []
                    },
                    visualizations: {
                      lineChart: true,
                      residualPlot: true,
                      predVsTrueScatter: true,
                      errorHistogram: true
                    }
                }
              },
              resourceType: 'cpu',
              resourceConfig: {
                cores: 4,
                memory: 32,
                maxRunTime: 120,
                acceleratorCards: 1
              }
            });
              setFormErrors({});
              setIsEditMode(false);
              setEditingTask(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>创建任务</span>
              </Button>
            </DialogTrigger>
            <DialogContent className={`${isFullScreen ? 'sm:max-w-[100vw] max-w-[100vw] w-[100vw] h-[96vh]' : 'sm:max-w-[1920px] max-w-[1920px] w-[98vw] max-h-[90vh]'} overflow-y-auto overflow-x-hidden`}>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>{isEditMode ? '编辑任务' : '创建新任务'}</span>
                </DialogTitle>
              </DialogHeader>
              {/* 步骤导航条 */}
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b mb-4">
                <div className="flex items-center justify-between px-1 py-2">
                  <div className="flex items-center gap-2">
                    {steps.map((s, idx) => {
                      const isActive = currentStep === s.number;
                      const isCompleted = currentStep > s.number;
                      return (
                        <button
                          key={s.number}
                          type="button"
                          onClick={() => setCurrentStep(s.number)}
                          className={`${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} rounded-full px-3 py-1 text-sm font-medium flex items-center gap-2 transition-colors`}
                          title={`第${s.number}步：${s.label}`}
                        >
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${isActive ? 'bg-white text-blue-600' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-800'}`}>{s.number}</span>
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFullScreen(prev => !prev)}
                      className="ml-1"
                      title={isFullScreen ? '退出全屏' : '全屏'}
                    >
                      {isFullScreen ? (
                        <span className="inline-flex items-center gap-1"><Minimize2 className="h-4 w-4" /> 退出全屏</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Maximize2 className="h-4 w-4" /> 全屏</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* 第1步：基础信息配置 */}
                {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>基础信息配置</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="taskName" className="flex items-center space-x-1">
                          <span>任务名称</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="taskName"
                          value={formData.taskName}
                          onChange={(e) => handleInputChange('taskName', e.target.value)}
                          placeholder="输入任务名称（3-64个字符）"
                          className={formErrors.taskName ? 'border-red-500' : ''}
                        />
                        {formErrors.taskName && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.taskName}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="taskType" className="flex items-center space-x-1">
                          <span>任务类型</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.taskType} onValueChange={(value: TaskType) => handleInputChange('taskType', value)}>
                          <SelectTrigger className={formErrors.taskType ? 'border-red-500' : ''}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(ALLOWED_TASK_TYPES).map((tt) => (
                              <SelectItem key={tt} value={tt}>{getTaskTypeLabel(tt as TaskType)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.taskType && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.taskType}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="projectId" className="flex items-center space-x-1">
                          <span>所属项目</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.projectId} onValueChange={(value: string) => handleInputChange('projectId', value)}>
                          <SelectTrigger className={formErrors.projectId ? 'border-red-500' : ''}>
                            <SelectValue placeholder="选择所属项目" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockProjects.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.projectId && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.projectId}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">任务描述</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="描述任务目标和要求"
                        rows={3}
                      />
                    </div>

                    {/* 运行配置（整合至基础信息配置） */}
                    <div className="space-y-4 pt-2 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Cpu className="h-4 w-4" />
                        <span className="font-medium text-gray-900">运行配置</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="flex items-center space-x-1">
                            <span>资源类型</span>
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select value={formData.resourceType} onValueChange={(value: 'cpu' | 'gpu' | 'npu') => handleInputChange('resourceType', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cpu">CPU</SelectItem>
                              <SelectItem value="gpu">GPU</SelectItem>
                              <SelectItem value="npu">NPU</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="priority" className="flex items-center space-x-1">
                            <span>任务优先级</span>
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => handleInputChange('priority', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>低 - 空闲时执行</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="medium">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  <span>中 - 按时间顺序执行</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="high">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <span>高 - 插队执行</span>
                                </div>
                              </SelectItem>

                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium">资源配额设置</h4>
                          <div className="grid grid-cols-3 gap-4">
                            {formData.resourceType === 'cpu' && (
                              <>
                                <div>
                                  <Label htmlFor="cores">CPU核心数</Label>
                                  <Input
                                    id="cores"
                                    type="number"
                                    value={formData.resourceConfig.cores}
                                    onChange={(e) => handleInputChange('resourceConfig', {
                                      ...formData.resourceConfig,
                                      cores: parseInt(e.target.value) || 4
                                    })}
                                    min="1"
                                    max="32"
                                    className={formErrors.resourceCores ? 'border-red-500' : ''}
                                  />
                                  {formErrors.resourceCores && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.resourceCores}</p>
                                  )}
                                </div>
                                <div>
                                  <Label htmlFor="memory">内存 (GB)</Label>
                                  <Input
                                    id="memory"
                                    type="number"
                                    value={formData.resourceConfig.memory}
                                    onChange={(e) => handleInputChange('resourceConfig', {
                                      ...formData.resourceConfig,
                                      memory: parseInt(e.target.value) || 32
                                    })}
                                    min="1"
                                    max="128"
                                    className={formErrors.resourceMemory ? 'border-red-500' : ''}
                                  />
                                  {formErrors.resourceMemory && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.resourceMemory}</p>
                                  )}
                                </div>
                              </>
                            )}
                            {formData.resourceType !== 'cpu' && (
                              <div>
                                <Label htmlFor="acceleratorCards">加速卡数量</Label>
                                <Input
                                  id="acceleratorCards"
                                  type="number"
                                  value={formData.resourceConfig.acceleratorCards ?? 1}
                                  onChange={(e) => handleInputChange('resourceConfig', {
                                    ...formData.resourceConfig,
                                    acceleratorCards: parseInt(e.target.value) || 1
                                  })}
                                  min="1"
                                  max="8"
                                  className={formErrors.resourceAcceleratorCards ? 'border-red-500' : ''}
                                />
                                {formErrors.resourceAcceleratorCards && (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.resourceAcceleratorCards}</p>
                               )}
                              </div>
                            )}
                            <div>
                              <Label htmlFor="maxRunTime">最大运行时长 (分钟)</Label>
                              <Input
                                id="maxRunTime"
                                type="number"
                                value={formData.resourceConfig.maxRunTime}
                                onChange={(e) => handleInputChange('resourceConfig', {
                                  ...formData.resourceConfig,
                                  maxRunTime: parseInt(e.target.value) || 120
                                })}
                                min="1"
                                max="2880"
                                className={formErrors.resourceMaxRunTime ? 'border-red-500' : ''}
                              />
                              {formErrors.resourceMaxRunTime && (
                                <p className="text-xs text-red-500 mt-1">{formErrors.resourceMaxRunTime}</p>
                              )}
                            </div>
                          </div>
                        </div>
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* 第2步：数据与目标 */}
                {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Database className="h-4 w-4" />
                      <span>数据与目标</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 数据集选择 */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="datasetName" className="flex items-center space-x-1">
                          <span>数据集选择</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={formData.datasetName} 
                          onValueChange={(value: string) => {
                            const selectedDataset = availableDatasets.find(d => d.id === value);
                            // 提取数据集字段
                            const availableFields = selectedDataset?.previewData && selectedDataset.previewData.length > 0 
                              ? Object.keys(selectedDataset.previewData[0]) 
                              : [];
                            
                            handleInputChange('datasetName', value);
                            handleInputChange('selectedDataset', selectedDataset || null);
                            handleInputChange('datasetVersion', ''); // 重置版本选择
                            handleInputChange('availableFields', availableFields); // 设置可用字段
                            handleInputChange('targetFields', []); // 重置特征字段选择
                            // 重置预测配置中的时间列、目标列与文件选择，避免跨数据集残留
                            handleInputChange('forecastingConfig', {
                              ...formData.forecastingConfig,
                              timeColumn: '',
                              targetColumn: '',
                              mainVariableFiles: [],
                              covariateFiles: []
                            });
                          }}
                        >
                          <SelectTrigger className={formErrors.datasetName ? 'border-red-500' : ''}>
                            <SelectValue placeholder="选择数据集" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDatasets
                              .filter(dataset => dataset.status === 'success')
                              .map(dataset => (
                                <SelectItem key={dataset.id} value={dataset.id}>
                                  <div className="flex flex-col items-start w-full">
                                    <div className="flex items-center justify-between w-full">
                                      <span className="font-medium">{dataset.name}</span>
                                      <Badge variant="outline" className="ml-2">
                                        {dataset.source === 'upload' ? '上传' : '订阅'}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {dataset.sampleCount.toLocaleString()} 条记录 • {dataset.fieldCount} 个字段 • {dataset.size}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {formErrors.datasetName && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.datasetName}</p>
                        )}
                      </div>

                      {/* 版本选择 */}
                      <div>
                        <Label htmlFor="datasetVersion" className="flex items-center space-x-1">
                          <span>数据版本</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={formData.datasetVersion} 
                          onValueChange={(value: string) => handleInputChange('datasetVersion', value)}
                          disabled={!formData.datasetName}
                        >
                          <SelectTrigger className={formErrors.datasetVersion ? 'border-red-500' : ''}>
                            <SelectValue placeholder="选择数据版本" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.selectedDataset?.versions.map(version => (
                              <SelectItem key={version.version} value={version.version}>
                                <div className="flex flex-col items-start w-full">
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-medium">{version.version}</span>
                                    <span className="text-xs text-gray-500 ml-2">{version.createdAt}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {version.sampleCount.toLocaleString()} 条记录 • {version.fieldCount} 个字段 • {version.size}
                                  </div>
                                  {version.description && (
                                    <div className="text-xs text-gray-400 mt-1">{version.description}</div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.datasetVersion && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.datasetVersion}</p>
                        )}
                        {/* 添加到已选数据集列表 */}
                        <div className="mt-3">
                          <Button type="button" variant="outline" size="sm" onClick={addSelectedDataset} disabled={!formData.datasetName || !formData.datasetVersion}>
                            添加/更新至列表
                          </Button>
                          <p className="text-xs text-gray-500 mt-1">可添加多个数据集进行联合训练。</p>
                        </div>
                      </div>

                      {/* 数据集详情预览（需已选择版本） */}
                      {formData.selectedDataset && formData.datasetVersion && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">数据集详情</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowDatasetPreview(!showDatasetPreview)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {showDatasetPreview ? '隐藏预览' : '预览数据'}
                            </Button>
                          </div>
                          
                          {/* 显示所选版本的统计信息 */}
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">记录数：</span>
                              <span className="font-medium">{(
                                formData.selectedDataset.versions.find(v => v.version === formData.datasetVersion)?.sampleCount ?? 0
                              ).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">字段数：</span>
                              <span className="font-medium">{
                                formData.selectedDataset.versions.find(v => v.version === formData.datasetVersion)?.fieldCount ?? 0
                              }</span>
                            </div>
                            <div>
                              <span className="text-gray-500">大小：</span>
                              <span className="font-medium">{
                                formData.selectedDataset.versions.find(v => v.version === formData.datasetVersion)?.size ?? '-'
                              }</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">当前版本：{formData.datasetVersion}（{formData.selectedDataset.versions.find(v => v.version === formData.datasetVersion)?.createdAt}）</div>
                          
                          <p className="text-sm text-gray-600">{formData.selectedDataset.description}</p>
                          
                          {/* 数据预览表格 */}
                          {showDatasetPreview && formData.selectedDataset.previewData && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">数据预览（前5行）</h5>
                              <div className="border rounded-md overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {Object.keys(formData.selectedDataset.previewData[0] || {}).map(key => (
                                        <TableHead key={key} className="text-xs">{key}</TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {formData.selectedDataset.previewData.slice(0, 5).map((row, index) => (
                                      <TableRow key={index}>
                                        {Object.values(row).map((value, cellIndex) => (
                                          <TableCell key={cellIndex} className="text-xs">
                                            {String(value)}
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 已选择的数据集列表（多选） */}
                    {formData.selectedDatasets.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">已选择的数据集</div>
                        <div className="flex flex-wrap gap-2">
                          {formData.selectedDatasets.map((ds) => {
                            const versions = availableDatasets.find(d => d.id === ds.id)?.versions ?? [];
                            return (
                              <div key={ds.id} className="flex items-center gap-2 bg-gray-100 rounded-md px-2 py-1">
                                <button
                                  type="button"
                                  className="text-sm font-medium hover:text-blue-600"
                                  title="点击回填到上方选择器以修改版本"
                                  onClick={() => backfillSelectedDataset(ds.id)}
                                >
                                  {ds.name}
                                </button>
                                <Select
                                  value={ds.version}
                                  onValueChange={(value: string) => updateSelectedDatasetVersion(ds.id, value) }
                                >
                                  <SelectTrigger className="h-7 text-xs w-28 bg-transparent border-none shadow-none px-1 focus:ring-0">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {versions.map(v => (
                                      <SelectItem key={v.version} value={v.version}>
                                        <div className="flex flex-col items-start w-full">
                                          <div className="flex items-center justify-between w-full">
                                            <span className="font-medium">{v.version}</span>
                                            <span className="text-xs text-gray-500 ml-2">{v.createdAt}</span>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            {v.sampleCount.toLocaleString()} 条记录 • {v.fieldCount} 个字段 • {v.size}
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs px-2"
                                  onClick={() => removeSelectedDataset(ds.id)}
                                >
                                  移除
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-500">提示：点击数据集名称可回填到上方选择器；右侧下拉可直接修改版本。</p>
                      </div>
                    )}

                    {/* 特征字段配置 */}
                    <div>
                      <Label className="flex items-center space-x-1">
                        <Target className="h-4 w-4" />
                        <span>特征字段</span>
                        <span className="text-gray-500 text-sm">(可选)</span>
                      </Label>
                      
                      {formData.availableFields.length > 0 ? (
                        <div className="space-y-3">
                          {/* 字段选择区域 */}
                          <div className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-sm font-medium text-gray-700">
                                可用字段 ({formData.availableFields.length}个)
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    handleInputChange('targetFields', [...formData.availableFields]);
                                  }}
                                  className="text-xs h-7"
                                >
                                  全选
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    handleInputChange('targetFields', []);
                                  }}
                                  className="text-xs h-7"
                                >
                                  清空
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                              {formData.availableFields.map((field) => {
                                // 简单的字段类型推断
                                const sampleValue = formData.selectedDataset?.previewData?.[0]?.[field];
                                const fieldType = typeof sampleValue === 'number' ? 'number' : 
                                                typeof sampleValue === 'boolean' ? 'boolean' : 'text';
                                const typeColor = fieldType === 'number' ? 'text-blue-600' : 
                                                fieldType === 'boolean' ? 'text-green-600' : 'text-gray-600';
                                
                                return (
                                  <div key={field} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`field-${field}`}
                                      checked={formData.targetFields.includes(field)}
                                      onCheckedChange={(checked: boolean) => {
                                        const newTargetFields = checked
                                          ? [...formData.targetFields, field]
                                          : formData.targetFields.filter(f => f !== field);
                                        handleInputChange('targetFields', newTargetFields);
                                      }}
                                    />
                                    <Label 
                                      htmlFor={`field-${field}`} 
                                      className="text-sm cursor-pointer hover:text-blue-600 flex-1"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span>{field}</span>
                                        <span className={`text-xs ${typeColor}`}>
                                          {fieldType}
                                        </span>
                                      </div>
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* 已选择字段显示 */}
                          {formData.targetFields.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-gray-700">
                                已选择字段 ({formData.targetFields.length}个)
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {formData.targetFields.map((field) => (
                                  <Badge 
                                    key={field} 
                                    variant="secondary" 
                                    className="flex items-center space-x-1"
                                  >
                                    <span>{field}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newTargetFields = formData.targetFields.filter(f => f !== field);
                                        handleInputChange('targetFields', newTargetFields);
                                      }}
                                      className="ml-1 hover:text-red-500"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border rounded-lg p-4 bg-gray-50 text-center text-gray-500">
                          <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">请先添加至少一个数据集以查看可用字段</p>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-500 mt-2">
                        选择数据集中用于预测的特征字段，支持多选。如不选择，将使用所有数值型字段进行预测。
                      </p>
                      {formErrors.targetFields && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.targetFields}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* 第3步：模型选择 */}
                {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span>模型选择</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 模型选择模式：移除单/多切换，默认多选 */}

                    {/* 模型选择 */}
                    <div>
                      <Label className="flex items-center space-x-1">
                        <span>模型选择</span>
                        <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-sm text-gray-500 mb-3">选择多个模型进行并行运行和对比</p>
                      
                      {/* 多选模式（默认） */}
                      <div className="space-y-2">
                        {availableModels
                           .filter(model => model.status === 'available' && ALLOWED_MODELS.has(model.name))
                           .map(model => (
                            <div 
                              key={model.id} 
                              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                formData.models.includes(model.id) 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                const newModels = formData.models.includes(model.id)
                                  ? formData.models.filter(id => id !== model.id)
                                  : [...formData.models, model.id];
                                handleInputChange('models', newModels);
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium">{model.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {model.type}
                                    </Badge>
                                    {model.accuracy && (
                                      <Badge variant="outline" className="text-xs">
                                        准确率: {model.accuracy}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>大小: {model.size}</span>
                                    <span>支持任务: {model.supportedTasks?.join(', ')}</span>
                                  </div>
                                  {model.features && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {model.features.map((feature, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {feature}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <Checkbox
                                    checked={formData.models.includes(model.id)}
                                    onCheckedChange={() => {}}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                      
                      {/* 已选择模型的摘要 */}
                      {(formData.models.length > 0) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium mb-2">已选择的模型:</p>
                          <div className="flex flex-wrap gap-2">
                            {formData.models.map(modelId => (
                              <Badge key={modelId} variant="default">
                                {availableModels.find(m => m.id === modelId)?.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {formErrors.models && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.models}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* 第4步：参数配置 */}
                {currentStep === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>参数配置</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 text-blue-700">
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">输入配置</span>
                        </div>

                        {formData.taskType === TASK_TYPES.forecasting && (
                          <div className="space-y-4">
                            {/* 时间列：来源于第2步选择的数据集公共字段 */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="timeColumn" className="flex items-center space-x-1">
                                  <span>时间列</span>
                                  <span className="text-red-500">*</span>
                                </Label>
                                {formData.availableFields.length > 0 ? (
                                  <Select
                                    value={formData.forecastingConfig.timeColumn || ''}
                                    onValueChange={(value: string) =>
                                      handleInputChange('forecastingConfig', {
                                        ...formData.forecastingConfig,
                                        timeColumn: value,
                                      })
                                    }
                                  >
                                    <SelectTrigger className={formErrors.forecastingTimeColumn ? 'border-red-500' : ''}>
                                      <SelectValue placeholder="选择来源于公共字段的时间列" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {formData.availableFields.map((field) => (
                                        <SelectItem key={field} value={field}>{field}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input id="timeColumn" disabled placeholder="请先在第2步选择数据集以获取公共字段" />
                                )}
                                {formErrors.forecastingTimeColumn && (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.forecastingTimeColumn}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">提示：时间列来源于第2步所选数据集的公共字段，确保数据一致性。</p>
                              </div>
                              <div>
                                <Label htmlFor="targetColumn" className="flex items-center space-x-1">
                                  <span>预测目标列</span>
                                  <span className="text-red-500">*</span>
                                </Label>
                                {formData.availableFields.length > 0 ? (
                                  <Select
                                    value={formData.forecastingConfig.targetColumn || ''}
                                    onValueChange={(value: string) =>
                                      handleInputChange('forecastingConfig', {
                                        ...formData.forecastingConfig,
                                        targetColumn: value,
                                      })
                                    }
                                  >
                                    <SelectTrigger className={formErrors.forecastingTargetColumn ? 'border-red-500' : ''}>
                                      <SelectValue placeholder="选择要预测的目标列" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {formData.availableFields
                                        .filter((field) => field !== formData.forecastingConfig.timeColumn)
                                        .map((field) => (
                                          <SelectItem key={field} value={field}>{field}</SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input id="targetColumn" disabled placeholder="请先在第2步选择数据集以获取公共字段" />
                                )}
                                {formErrors.forecastingTargetColumn && (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.forecastingTargetColumn}</p>
                                )}
                                {/* 提示文案根据用户反馈移除 */}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="contextLength" className="flex items-center space-x-1">
                                  <span>上下文长度</span>
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="contextLength"
                                  type="number"
                                  value={formData.forecastingConfig.contextLength}
                                  onChange={(e) => handleInputChange('forecastingConfig', {
                                    ...formData.forecastingConfig,
                                    contextLength: parseInt(e.target.value) || 0
                                  })}
                                  min="1"
                                  max="10000"
                                />
                                {formErrors.forecastingContextLength && (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.forecastingContextLength}</p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="forecastLength" className="flex items-center space-x-1">
                                  <span>预测长度</span>
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="forecastLength"
                                  type="number"
                                  value={formData.forecastingConfig.forecastLength}
                                  onChange={(e) => handleInputChange('forecastingConfig', {
                                    ...formData.forecastingConfig,
                                    forecastLength: parseInt(e.target.value) || 0
                                  })}
                                  min="1"
                                  max="10000"
                                />
                                {formErrors.forecastingForecastLength && (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.forecastingForecastLength}</p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="stepLength" className="flex items-center space-x-1">
                                  <span>预测步长</span>
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="stepLength"
                                  type="number"
                                  value={formData.forecastingConfig.stepLength}
                                  onChange={(e) => handleInputChange('forecastingConfig', {
                                    ...formData.forecastingConfig,
                                    stepLength: parseInt(e.target.value) || 0
                                  })}
                                  min="1"
                                  max="10000"
                                />
                                {formErrors.forecastingStepLength && (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.forecastingStepLength}</p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="startTime" className="flex items-center space-x-1">
                                  <span>预测开始时间</span>
                                  {/* 改为非必填，去掉红色星号 */}
                                </Label>
                                <Input
                                  id="startTime"
                                  type="text"
                                  placeholder="可选，示例：2025-10-29 08:00 或留空"
                                  value={formData.forecastingConfig.startTime}
                                  onChange={(e) => handleInputChange('forecastingConfig', {
                                    ...formData.forecastingConfig,
                                    startTime: e.target.value
                                  })}
                                />
                                {/* 非必填，不再显示必填错误 */}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              {/* 主变量文件（多选） */}
                              <div>
                                <Label className="flex items-center gap-1">主变量文件<small className="text-gray-500">(可选，互斥)</small></Label>
                                <Popover open={mainFilesOpen} onOpenChange={setMainFilesOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" aria-expanded={mainFilesOpen} className="w-full justify-between">
                                      {formData.forecastingConfig.mainVariableFiles.length > 0
                                        ? `已选择 ${formData.forecastingConfig.mainVariableFiles.length} 个文件`
                                        : '选择主变量文件'}
                                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[420px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                      <CommandInput placeholder="搜索文件..." value={mainFilesQuery} onValueChange={setMainFilesQuery} />
                                      <CommandList>
                                        <CommandEmpty>没有匹配的文件</CommandEmpty>
                                        <CommandGroup heading="可选文件">
                                          {filteredMainOptions.map((file) => {
                                            const checked = formData.forecastingConfig.mainVariableFiles.includes(file);
                                            return (
                                              <CommandItem key={file} onSelect={() => toggleMainFile(file)}>
                                                <Checkbox
                                                  checked={checked}
                                                  onCheckedChange={() => toggleMainFile(file)}
                                                  className="mr-2"
                                                />
                                                <span className="truncate">{file}</span>
                                              </CommandItem>
                                            );
                                          })}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {formData.forecastingConfig.mainVariableFiles.map((file) => (
                                    <Badge key={file} variant="secondary" className="flex items-center gap-1">
                                      <span className="truncate max-w-[200px]">{file}</span>
                                      <button
                                        type="button"
                                        className="inline-flex items-center justify-center p-0.5 rounded hover:bg-muted"
                                        onClick={() => toggleMainFile(file)}
                                        aria-label={`移除 ${file}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                  {formData.forecastingConfig.mainVariableFiles.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={() => handleInputChange('forecastingConfig', { ...formData.forecastingConfig, mainVariableFiles: [] })}>清空</Button>
                                  )}
                                </div>
                              </div>
                              {/* 协变量文件（多选） */}
                              <div>
                                <Label className="flex items-center gap-1">协变量文件<small className="text-gray-500">(多选，互斥)</small></Label>
                                <Popover open={covFilesOpen} onOpenChange={setCovFilesOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" aria-expanded={covFilesOpen} className="w-full justify-between">
                                      {formData.forecastingConfig.covariateFiles.length > 0
                                        ? `已选择 ${formData.forecastingConfig.covariateFiles.length} 个文件`
                                        : '选择协变量文件'}
                                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[420px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                      <CommandInput placeholder="搜索文件..." value={covFilesQuery} onValueChange={setCovFilesQuery} />
                                      <CommandList>
                                        <CommandEmpty>没有匹配的文件</CommandEmpty>
                                        <CommandGroup heading="可选文件">
                                          {filteredCovOptions.map((file) => {
                                            const checked = formData.forecastingConfig.covariateFiles.includes(file);
                                            return (
                                              <CommandItem key={file} onSelect={() => toggleCovFile(file)}>
                                                <Checkbox
                                                  checked={checked}
                                                  onCheckedChange={() => toggleCovFile(file)}
                                                  className="mr-2"
                                                />
                                                <span className="truncate">{file}</span>
                                              </CommandItem>
                                            );
                                          })}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {formData.forecastingConfig.covariateFiles.map((file) => (
                                    <Badge key={file} variant="secondary" className="flex items-center gap-1">
                                      <span className="truncate max-w-[200px]">{file}</span>
                                      <button
                                        type="button"
                                        className="inline-flex items-center justify-center p-0.5 rounded hover:bg-muted"
                                        onClick={() => toggleCovFile(file)}
                                        aria-label={`移除 ${file}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                  {formData.forecastingConfig.covariateFiles.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={() => handleInputChange('forecastingConfig', { ...formData.forecastingConfig, covariateFiles: [] })}>清空</Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {formData.taskType === TASK_TYPES.classification && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="class-train">训练集比例(%)</Label>
                                <Input
                                  id="class-train"
                                  type="number"
                                  value={formData.classificationConfig.trainRatio}
                                  onChange={(e) => {
                                    const train = parseInt(e.target.value) || 0;
                                    const test = 100 - train;
                                    handleInputChange('classificationConfig', {
                                      ...formData.classificationConfig,
                                      trainRatio: train,
                                      testRatio: test < 0 ? 0 : test
                                    });
                                  }}
                                  min="1"
                                  max="99"
                                />
                              </div>
                              <div>
                                <Label htmlFor="class-test">测试集比例(%)</Label>
                                <Input
                                  id="class-test"
                                  type="number"
                                  value={formData.classificationConfig.testRatio}
                                  onChange={(e) => {
                                    const test = parseInt(e.target.value) || 0;
                                    const train = 100 - test;
                                    handleInputChange('classificationConfig', {
                                      ...formData.classificationConfig,
                                      testRatio: test,
                                      trainRatio: train < 0 ? 0 : train
                                    });
                                  }}
                                  min="1"
                                  max="99"
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="class-shuffle"
                                checked={formData.classificationConfig.shuffle}
                                onCheckedChange={(checked: boolean) => handleInputChange('classificationConfig', {
                                  ...formData.classificationConfig,
                                  shuffle: Boolean(checked)
                                })}
                              />
                              <Label htmlFor="class-shuffle">洗牌(Shuffle)</Label>
                            </div>
                            {formErrors.classificationSplit && (
                              <p className="text-xs text-red-500 mt-1">{formErrors.classificationSplit}</p>
                            )}
                          </div>
                        )}

                        {formData.taskType === TASK_TYPES.regression && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="reg-train">训练集比例(%)</Label>
                                <Input
                                  id="reg-train"
                                  type="number"
                                  value={formData.regressionConfig.trainRatio}
                                  onChange={(e) => {
                                    const train = parseInt(e.target.value) || 0;
                                    const test = 100 - train;
                                    handleInputChange('regressionConfig', {
                                      ...formData.regressionConfig,
                                      trainRatio: train,
                                      testRatio: test < 0 ? 0 : test
                                    });
                                  }}
                                  min="1"
                                  max="99"
                                />
                              </div>
                              <div>
                                <Label htmlFor="reg-test">测试集比例(%)</Label>
                                <Input
                                  id="reg-test"
                                  type="number"
                                  value={formData.regressionConfig.testRatio}
                                  onChange={(e) => {
                                    const test = parseInt(e.target.value) || 0;
                                    const train = 100 - test;
                                    handleInputChange('regressionConfig', {
                                      ...formData.regressionConfig,
                                      testRatio: test,
                                      trainRatio: train < 0 ? 0 : train
                                    });
                                  }}
                                  min="1"
                                  max="99"
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="reg-shuffle"
                                checked={formData.regressionConfig.shuffle}
                                onCheckedChange={(checked: boolean) => handleInputChange('regressionConfig', {
                                  ...formData.regressionConfig,
                                  shuffle: Boolean(checked)
                                })}
                              />
                              <Label htmlFor="reg-shuffle">洗牌(Shuffle)</Label>
                            </div>
                            {formErrors.regressionSplit && (
                              <p className="text-xs text-red-500 mt-1">{formErrors.regressionSplit}</p>
                            )}
                          </div>
                        )}

                        {/* 输出配置 */}
                        <div className="space-y-4 mt-2">
                          <div className="flex items-center space-x-2 text-blue-700">
                            <BarChart3 className="h-4 w-4" />
                            <span className="font-medium">输出配置</span>
                          </div>

                          {/* 时序预测输出配置 */}
                          {formData.taskType === TASK_TYPES.forecasting && (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm font-medium">评估指标</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="fct-mse"
                                      checked={formData.outputConfig.forecasting.metrics.mse}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        forecasting: {
                                          ...formData.outputConfig.forecasting,
                                          metrics: { ...formData.outputConfig.forecasting.metrics, mse: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="fct-mse" className="text-sm">MSE</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="fct-rmse"
                                      checked={formData.outputConfig.forecasting.metrics.rmse}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        forecasting: {
                                          ...formData.outputConfig.forecasting,
                                          metrics: { ...formData.outputConfig.forecasting.metrics, rmse: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="fct-rmse" className="text-sm">RMSE</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="fct-mae"
                                      checked={formData.outputConfig.forecasting.metrics.mae}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        forecasting: {
                                          ...formData.outputConfig.forecasting,
                                          metrics: { ...formData.outputConfig.forecasting.metrics, mae: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="fct-mae" className="text-sm">MAE</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="fct-mape"
                                      checked={formData.outputConfig.forecasting.metrics.mape}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        forecasting: {
                                          ...formData.outputConfig.forecasting,
                                          metrics: { ...formData.outputConfig.forecasting.metrics, mape: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="fct-mape" className="text-sm">MAPE</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="fct-r2"
                                      checked={formData.outputConfig.forecasting.metrics.r2}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        forecasting: {
                                          ...formData.outputConfig.forecasting,
                                          metrics: { ...formData.outputConfig.forecasting.metrics, r2: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="fct-r2" className="text-sm">R²</Label>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                  <div>
                                    <Label htmlFor="fct-rel-dev" className="text-sm">相对偏差阈值(±%)</Label>
                                    <Input
                                      id="fct-rel-dev"
                                      type="number"
                                      min={0}
                                      step="0.1"
                                      value={formData.outputConfig.forecasting.metrics.relDeviationPercents[0] ?? 10}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const val = parseFloat(e.target.value);
                                        const nums = Number.isNaN(val) ? [] : [val];
                                        handleInputChange('outputConfig', {
                                          ...formData.outputConfig,
                                          forecasting: {
                                            ...formData.outputConfig.forecasting,
                                            metrics: { ...formData.outputConfig.forecasting.metrics, relDeviationPercents: nums }
                                          }
                                        });
                                      }}
                                      placeholder="默认: 10"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="fct-abs-dev" className="text-sm">绝对偏差阈值(±)</Label>
                                    <Input
                                      id="fct-abs-dev"
                                      type="number"
                                      step="0.1"
                                      value={formData.outputConfig.forecasting.metrics.absDeviationValues[0] ?? 10}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const val = parseFloat(e.target.value);
                                        const nums = Number.isNaN(val) ? [] : [val];
                                        handleInputChange('outputConfig', {
                                          ...formData.outputConfig,
                                          forecasting: {
                                            ...formData.outputConfig.forecasting,
                                            metrics: { ...formData.outputConfig.forecasting.metrics, absDeviationValues: nums }
                                          }
                                        });
                                      }}
                                      placeholder="默认: 10"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-medium">可视化</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="fct-line"
                                      checked={formData.outputConfig.forecasting.visualizations.lineChart}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        forecasting: {
                                          ...formData.outputConfig.forecasting,
                                          visualizations: { ...formData.outputConfig.forecasting.visualizations, lineChart: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="fct-line" className="text-sm">折线图</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="fct-residual"
                                      checked={formData.outputConfig.forecasting.visualizations.residualPlot}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        forecasting: {
                                          ...formData.outputConfig.forecasting,
                                          visualizations: { ...formData.outputConfig.forecasting.visualizations, residualPlot: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="fct-residual" className="text-sm">残差图</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="fct-scatter"
                                      checked={formData.outputConfig.forecasting.visualizations.predVsTrueScatter}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        forecasting: {
                                          ...formData.outputConfig.forecasting,
                                          visualizations: { ...formData.outputConfig.forecasting.visualizations, predVsTrueScatter: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="fct-scatter" className="text-sm">预测vs真实散点</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="fct-hist"
                                      checked={formData.outputConfig.forecasting.visualizations.errorHistogram}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        forecasting: {
                                          ...formData.outputConfig.forecasting,
                                          visualizations: { ...formData.outputConfig.forecasting.visualizations, errorHistogram: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="fct-hist" className="text-sm">误差直方图</Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 分类输出配置 */}
                          {formData.taskType === TASK_TYPES.classification && (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm font-medium">评估指标与平均方式</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                  {/* Accuracy（置顶，仅复选，无下拉）*/}
                                  <div className="flex items-center gap-2 md:col-span-2">
                                    <Checkbox
                                      id="cls-accuracy"
                                      checked={formData.outputConfig.classification.metrics.accuracy.enabled}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        classification: {
                                          ...formData.outputConfig.classification,
                                          metrics: {
                                            ...formData.outputConfig.classification.metrics,
                                            accuracy: { ...formData.outputConfig.classification.metrics.accuracy, enabled: Boolean(checked) }
                                          }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="cls-accuracy" className="text-sm w-20">Accuracy</Label>
                                  </div>

                                  {/* 共享平均方式（对 Precision / Recall / F1 / ROC-AUC 同时生效）*/}
                                  <div className="flex items-center gap-2 md:col-span-2">
                                    <Label htmlFor="cls-shared-average" className="text-sm w-48">平均方式（Precision/Recall/F1/ROC-AUC）</Label>
                                    <Select
                                      value={formData.outputConfig.classification.metrics.precision.average}
                                      onValueChange={(value: AverageMethod) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        classification: {
                                          ...formData.outputConfig.classification,
                                          metrics: {
                                            ...formData.outputConfig.classification.metrics,
                                            precision: { ...formData.outputConfig.classification.metrics.precision, average: value },
                                            recall: { ...formData.outputConfig.classification.metrics.recall, average: value },
                                            f1: { ...formData.outputConfig.classification.metrics.f1, average: value },
                                            rocAuc: { ...formData.outputConfig.classification.metrics.rocAuc, average: value }
                                          }
                                        }
                                      })}
                                    >
                                      <SelectTrigger id="cls-shared-average" className="h-8 w-36"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="micro">micro</SelectItem>
                                        <SelectItem value="macro">macro</SelectItem>
                                        <SelectItem value="samples">samples</SelectItem>
                                        <SelectItem value="weighted">weighted</SelectItem>
                                        <SelectItem value="binary">binary</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Precision（仅复选）*/}
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="cls-precision"
                                      checked={formData.outputConfig.classification.metrics.precision.enabled}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        classification: {
                                          ...formData.outputConfig.classification,
                                          metrics: {
                                            ...formData.outputConfig.classification.metrics,
                                            precision: { ...formData.outputConfig.classification.metrics.precision, enabled: Boolean(checked) }
                                          }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="cls-precision" className="text-sm w-20">Precision</Label>
                                  </div>

                                  {/* Recall（仅复选）*/}
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="cls-recall"
                                      checked={formData.outputConfig.classification.metrics.recall.enabled}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        classification: {
                                          ...formData.outputConfig.classification,
                                          metrics: {
                                            ...formData.outputConfig.classification.metrics,
                                            recall: { ...formData.outputConfig.classification.metrics.recall, enabled: Boolean(checked) }
                                          }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="cls-recall" className="text-sm w-20">Recall</Label>
                                  </div>

                                  {/* F1（仅复选）*/}
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="cls-f1"
                                      checked={formData.outputConfig.classification.metrics.f1.enabled}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        classification: {
                                          ...formData.outputConfig.classification,
                                          metrics: {
                                            ...formData.outputConfig.classification.metrics,
                                            f1: { ...formData.outputConfig.classification.metrics.f1, enabled: Boolean(checked) }
                                          }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="cls-f1" className="text-sm w-20">F1</Label>
                                  </div>

                                  {/* ROC-AUC（仅复选）*/}
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="cls-rocauc"
                                      checked={formData.outputConfig.classification.metrics.rocAuc.enabled}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        classification: {
                                          ...formData.outputConfig.classification,
                                          metrics: {
                                            ...formData.outputConfig.classification.metrics,
                                            rocAuc: { ...formData.outputConfig.classification.metrics.rocAuc, enabled: Boolean(checked) }
                                          }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="cls-rocauc" className="text-sm w-20">ROC-AUC</Label>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="cls-custom-metric-code" className="text-sm font-medium">自定义指标</Label>
                                <Textarea
                                  id="cls-custom-metric-code"
                                  placeholder="请输入有效的 Python 函数代码，用于自定义评估指标计算"
                                  value={formData.outputConfig.classification.metrics.customMetricCode}
                                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('outputConfig', {
                                    ...formData.outputConfig,
                                    classification: {
                                      ...formData.outputConfig.classification,
                                      metrics: { ...formData.outputConfig.classification.metrics, customMetricCode: e.target.value }
                                    }
                                  })}
                                  rows={6}
                                  className="mt-2 w-full"
                                />
                                <Label className="text-sm font-medium">可视化</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="cls-roc"
                                      checked={formData.outputConfig.classification.visualizations.rocCurve}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        classification: {
                                          ...formData.outputConfig.classification,
                                          visualizations: { ...formData.outputConfig.classification.visualizations, rocCurve: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="cls-roc" className="text-sm">ROC 曲线</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="cls-pr"
                                      checked={formData.outputConfig.classification.visualizations.prCurve}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        classification: {
                                          ...formData.outputConfig.classification,
                                          visualizations: { ...formData.outputConfig.classification.visualizations, prCurve: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="cls-pr" className="text-sm">PR 曲线</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="cls-conf"
                                      checked={formData.outputConfig.classification.visualizations.confusionMatrix}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        classification: {
                                          ...formData.outputConfig.classification,
                                          visualizations: { ...formData.outputConfig.classification.visualizations, confusionMatrix: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="cls-conf" className="text-sm">混淆矩阵</Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 回归输出配置 */}
                          {formData.taskType === TASK_TYPES.regression && (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm font-medium">评估指标</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="reg-mse"
                                      checked={formData.outputConfig.regression.metrics.mse}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        regression: {
                                          ...formData.outputConfig.regression,
                                          metrics: { ...formData.outputConfig.regression.metrics, mse: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="reg-mse" className="text-sm">MSE</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="reg-rmse"
                                      checked={formData.outputConfig.regression.metrics.rmse}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        regression: {
                                          ...formData.outputConfig.regression,
                                          metrics: { ...formData.outputConfig.regression.metrics, rmse: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="reg-rmse" className="text-sm">RMSE</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="reg-mae"
                                      checked={formData.outputConfig.regression.metrics.mae}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        regression: {
                                          ...formData.outputConfig.regression,
                                          metrics: { ...formData.outputConfig.regression.metrics, mae: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="reg-mae" className="text-sm">MAE</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="reg-mape"
                                      checked={formData.outputConfig.regression.metrics.mape}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        regression: {
                                          ...formData.outputConfig.regression,
                                          metrics: { ...formData.outputConfig.regression.metrics, mape: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="reg-mape" className="text-sm">MAPE</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="reg-r2"
                                      checked={formData.outputConfig.regression.metrics.r2}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        regression: {
                                          ...formData.outputConfig.regression,
                                          metrics: { ...formData.outputConfig.regression.metrics, r2: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="reg-r2" className="text-sm">R²</Label>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                  <div>
                                    <Label htmlFor="reg-rel-dev" className="text-sm">相对偏差阈值(±%)</Label>
                                    <Input
                                      id="reg-rel-dev"
                                      type="number"
                                      min={0}
                                      step="0.1"
                                      value={formData.outputConfig.regression.metrics.relDeviationPercents[0] ?? 10}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const val = parseFloat(e.target.value);
                                        const nums = Number.isNaN(val) ? [] : [val];
                                        handleInputChange('outputConfig', {
                                          ...formData.outputConfig,
                                          regression: {
                                            ...formData.outputConfig.regression,
                                            metrics: { ...formData.outputConfig.regression.metrics, relDeviationPercents: nums }
                                          }
                                        });
                                      }}
                                      placeholder="默认: 10"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="reg-abs-dev" className="text-sm">绝对偏差阈值(±)</Label>
                                    <Input
                                      id="reg-abs-dev"
                                      type="number"
                                      step="0.1"
                                      value={formData.outputConfig.regression.metrics.absDeviationValues[0] ?? 10}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const val = parseFloat(e.target.value);
                                        const nums = Number.isNaN(val) ? [] : [val];
                                        handleInputChange('outputConfig', {
                                          ...formData.outputConfig,
                                          regression: {
                                            ...formData.outputConfig.regression,
                                            metrics: { ...formData.outputConfig.regression.metrics, absDeviationValues: nums }
                                          }
                                        });
                                      }}
                                      placeholder="默认: 10"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-medium">可视化</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="reg-line"
                                      checked={formData.outputConfig.regression.visualizations.lineChart}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        regression: {
                                          ...formData.outputConfig.regression,
                                          visualizations: { ...formData.outputConfig.regression.visualizations, lineChart: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="reg-line" className="text-sm">折线图</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="reg-residual"
                                      checked={formData.outputConfig.regression.visualizations.residualPlot}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        regression: {
                                          ...formData.outputConfig.regression,
                                          visualizations: { ...formData.outputConfig.regression.visualizations, residualPlot: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="reg-residual" className="text-sm">残差图</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="reg-scatter"
                                      checked={formData.outputConfig.regression.visualizations.predVsTrueScatter}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        regression: {
                                          ...formData.outputConfig.regression,
                                          visualizations: { ...formData.outputConfig.regression.visualizations, predVsTrueScatter: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="reg-scatter" className="text-sm">预测vs真实散点</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="reg-hist"
                                      checked={formData.outputConfig.regression.visualizations.errorHistogram}
                                      onCheckedChange={(checked: boolean) => handleInputChange('outputConfig', {
                                        ...formData.outputConfig,
                                        regression: {
                                          ...formData.outputConfig.regression,
                                          visualizations: { ...formData.outputConfig.regression.visualizations, errorHistogram: Boolean(checked) }
                                        }
                                      })}
                                    />
                                    <Label htmlFor="reg-hist" className="text-sm">误差直方图</Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-blue-100 p-3 rounded border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>输入配置说明:</strong> 针对不同任务类型提供常用参数项。若需更复杂的配置，请在后续版本中使用高级选项或模板。
                          </p>
                        </div>
                      </div>
                    
                  </CardContent>
                </Card>
                )}

                {/* 删除：第4步运行资源配置（已合并到第1步） */}

                {/* 底部操作按钮（按步骤显示） */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateTaskOpen(false)}
                      disabled={isSubmitting}
                    >
                      取消
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentStep > 1 && (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        disabled={isSubmitting}
                      >
                        上一步
                      </Button>
                    )}
                    {currentStep < 4 ? (
                      <Button 
                        onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                        disabled={isSubmitting}
                      >
                        下一步
                      </Button>
                    ) : (
                      <Button 
                        onClick={isEditMode ? handleSaveEditTask : handleCreateTask}
                        disabled={isSubmitting}
                        className="flex items-center space-x-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{isEditMode ? '保存中...' : '创建中...'}</span>
                          </>
                        ) : (
                          <>
                            {isEditMode ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            <span>{isEditMode ? '保存修改' : '创建任务'}</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 任务对比预览弹窗 */}
      <Dialog open={isCompareDemoOpen} onOpenChange={setIsCompareDemoOpen}>
        <DialogContent className="sm:max-w-[1600px] max-w-[1600px] w-[98vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" /> 任务对比预览
            </DialogTitle>
          </DialogHeader>
          <TaskCompare
            task1={compareDemoType === TASK_TYPES.classification ? taskCompareDemoA : (compareDemoType === TASK_TYPES.regression ? taskCompareRegA : taskCompareFctA)}
            task2={compareDemoType === TASK_TYPES.classification ? taskCompareDemoB : (compareDemoType === TASK_TYPES.regression ? taskCompareRegB : taskCompareFctB)}
            onBack={() => setIsCompareDemoOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 筛选面板已移除：列头筛选提供所有必要的过滤入口 */}

      {/* 批量操作栏 */}
      {selectedTaskIds.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                已选择 {selectedTaskIds.length} 个任务
              </span>
              <div className="flex items-center space-x-2">
                {selectedTaskIds.length >= 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCompareDemoOpen(true)}
                    className="flex items-center space-x-1"
                  >
                    <GitCompare className="h-4 w-4" />
                    <span>任务对比预览</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction('archive')}
                  className="flex items-center space-x-1"
                >
                  <Archive className="h-4 w-4" />
                  <span>批量归档</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction('export')}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>批量导出</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction('retry')}
                  className="flex items-center space-x-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>批量重试</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 任务统计卡片 */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="w-[160px]">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">总任务数</p>
                <p className="text-xl font-bold">{tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-[160px]">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">运行中</p>
                <p className="text-xl font-bold">{tasks.filter(t => t.status === 'running').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-[160px]">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">已完成</p>
                <p className="text-xl font-bold">{tasks.filter(t => t.status === 'completed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-[160px]">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">失败</p>
                <p className="text-xl font-bold">{tasks.filter(t => t.status === 'failed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-[160px]">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Target className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">排队中</p>
                <p className="text-xl font-bold">{tasks.filter(t => t.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>任务列表</CardTitle>
            <div className="text-sm text-gray-600">
              显示 {filteredTasks.length} / {tasks.length} 个任务
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('taskName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>任务名称</span>
                        {sortConfig.field === 'taskName' && (
                          sortConfig.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>任务ID</TableHead>
                    {/* 列头筛选：任务类型 */}
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <span>任务类型</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 h-6 w-6 ${filters.taskType !== 'all' ? 'text-blue-600' : 'text-gray-400'}`}
                              aria-label="任务类型筛选"
                            >
                              <Filter className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-44">
                            <div className="space-y-2">
                              <Label className="text-xs">任务类型</Label>
                              <Select value={filters.taskType} onValueChange={(value: string) => handleFilterChange('taskType', value)}>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="全部类型" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">全部类型</SelectItem>
                                  {Array.from(ALLOWED_TASK_TYPES).map((tt) => (
                                    <SelectItem key={tt} value={tt}>{getTaskTypeLabel(tt as TaskType)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex justify-end">
                                <Button variant="outline" size="sm" className="h-8" onClick={() => handleFilterChange('taskType', 'all')}>清空</Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableHead>

                    {/* 列头筛选：所属项目 */}
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <span>所属项目</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 h-6 w-6 ${(filters.projectId && filters.projectId !== 'all') ? 'text-blue-600' : 'text-gray-400'}`}
                              aria-label="所属项目筛选"
                            >
                              <Filter className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-44">
                            <div className="space-y-2">
                              <Label className="text-xs">所属项目</Label>
                              <Select value={filters.projectId ?? 'all'} onValueChange={(value: string) => handleFilterChange('projectId', value)}>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="全部项目" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">全部项目</SelectItem>
                                  {mockProjects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex justify-end">
                                <Button variant="outline" size="sm" className="h-8" onClick={() => handleFilterChange('projectId', 'all')}>清空</Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableHead>
                    <TableHead>数据集</TableHead>
                    {/* 列头筛选：模型（多选，复用原筛选面板的 Command 列表）*/}
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <span>模型</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 h-6 w-6 ${filters.modelNames && filters.modelNames.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}
                              aria-label="模型筛选"
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                            >
                              <Filter className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-[300px] p-0" onOpenAutoFocus={(e: Event) => e.preventDefault()}>
                            <Command>
                              <CommandInput
                                placeholder="搜索模型..."
                                value={modelFilterQuery}
                                onValueChange={setModelFilterQuery}
                              />
                              <CommandList>
                                <CommandEmpty>未找到模型</CommandEmpty>
                                <CommandGroup>
                                  {modelOptions
                                    .filter((name) => !modelFilterQuery || name.toLowerCase().includes(modelFilterQuery.toLowerCase()))
                                    .map((name) => (
                                      <CommandItem
                                        key={name}
                                        onSelect={() => {
                                          const cur = filters.modelNames || [];
                                          const next = cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name];
                                          handleFilterChange('modelNames', next);
                                        }}
                                      >
                                        <Checkbox
                                          checked={filters.modelNames.includes(name)}
                                          onCheckedChange={() => {
                                            const cur = filters.modelNames || [];
                                            const next = cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name];
                                            handleFilterChange('modelNames', next);
                                          }}
                                          className="mr-2"
                                        />
                                        <span>{name}</span>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableHead>
                    {/* 列头筛选：优先级（保留点击排序）*/}
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('priority')}
                    >
                      <div className="flex items-center gap-1">
                        <span>优先级</span>
                        {sortConfig.field === 'priority' && (
                          sortConfig.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 h-6 w-6 ${filters.priority !== 'all' ? 'text-blue-600' : 'text-gray-400'}`}
                              aria-label="优先级筛选"
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                            >
                              <Filter className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-40" onOpenAutoFocus={(e: Event) => e.preventDefault()}>
                            <div className="space-y-2">
                              <Label className="text-xs">优先级</Label>
                              <Select value={filters.priority} onValueChange={(value: string) => handleFilterChange('priority', value)}>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="全部优先级" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">全部优先级</SelectItem>
                                  <SelectItem value="low">低</SelectItem>
                                  <SelectItem value="medium">中</SelectItem>
                                  <SelectItem value="high">高</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex justify-end">
                                <Button variant="outline" size="sm" className="h-8" onClick={() => handleFilterChange('priority', 'all')}>清空</Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableHead>
                    {/* 列头筛选：状态（保留点击排序）*/}
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        <span>状态</span>
                        {sortConfig.field === 'status' && (
                          sortConfig.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 h-6 w-6 ${filters.status !== 'all' ? 'text-blue-600' : 'text-gray-400'}`}
                              aria-label="状态筛选"
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                            >
                              <Filter className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-44" onOpenAutoFocus={(e: Event) => e.preventDefault()}>
                            <div className="space-y-2">
                              <Label className="text-xs">状态</Label>
                              <Select value={filters.status} onValueChange={(value: string) => handleFilterChange('status', value)}>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="全部状态" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">全部状态</SelectItem>
                                  <SelectItem value="not_started">未开始</SelectItem>
                                  <SelectItem value="pending">排队中</SelectItem>
                                  <SelectItem value="running">运行中</SelectItem>
                                  <SelectItem value="completed">已完成</SelectItem>
                                  <SelectItem value="failed">失败</SelectItem>
                                  <SelectItem value="cancelled">已取消</SelectItem>
                                  <SelectItem value="archived">已归档</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex justify-end">
                                <Button variant="outline" size="sm" className="h-8" onClick={() => handleFilterChange('status', 'all')}>清空</Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>创建时间</span>
                        {sortConfig.field === 'createdAt' && (
                          sortConfig.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('completedAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>完成时间</span>
                        {sortConfig.field === 'completedAt' && (
                          sortConfig.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>创建者</TableHead>
                    <TableHead className="sticky right-0 bg-white z-30 border-l w-[220px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const statusConfig = getStatusConfig(task.status);
                    const priorityConfig = getPriorityConfig(task.priority);
                    const StatusIcon = statusConfig.icon;
                    const isHighlighted = task.id === highlightTaskId;
                    const isStatusAnim = task.id === statusAnimTaskId;
                    
                    return (
                      <TableRow
                        key={task.id}
                        id={`task-row-${task.id}`}
                        className={`hover:bg-gray-50 ${isHighlighted ? 'bg-amber-50 ring-2 ring-amber-200' : ''} ${isStatusAnim ? 'ring-2 ring-lime-300 bg-lime-50 animate-pulse' : ''}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedTaskIds.includes(task.id)}
                            onCheckedChange={(checked: boolean) => handleTaskSelection(task.id, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.taskName}</div>
                            {task.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {task.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {task.id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTaskTypeLabel(task.taskType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.projectId || task.projectName ? (
                            <Badge variant="secondary" className="bg-purple-50">
                              {task.projectName ?? (task.projectId ? getProjectName(task.projectId) : '未选择项目')}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">未选择项目</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.datasets && task.datasets.length > 0 ? (
                            <div>
                              <div className="font-medium flex flex-wrap gap-2">
                                {task.datasets.slice(0, 3).map((ds) => (
                                  <Badge key={ds.id} variant="secondary">
                                    {ds.name}
                                  </Badge>
                                ))}
                                {task.datasets.length > 3 && (
                                  <span className="text-xs text-gray-500">+{task.datasets.length - 3} 更多</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {task.datasets.slice(0, 1).map((ds) => (
                                  <span key={ds.id}>{ds.version}</span>
                                ))}
                                {task.datasets.length > 1 && (
                                  <span className="ml-1">等 {task.datasets.length} 个数据集</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">{task.datasetName}</div>
                              <div className="text-sm text-gray-500">{task.datasetVersion}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50">
                            {task.modelName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityConfig.color}>
                            {priorityConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            {(['running','pending','completed'].includes(task.status)) && (
                              <div className="w-20">
                                <Progress value={task.status === 'completed' ? 100 : task.status === 'pending' ? 0 : (task.progress ?? 0)} className="h-2" />
                                <div className="text-xs text-gray-500 mt-1">
                                  {task.status === 'completed' ? '100%' : `${task.status === 'pending' ? 0 : (task.progress ?? 0)}%`}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(task.createdAt).toLocaleString('zh-CN')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {task.completedAt 
                              ? new Date(task.completedAt).toLocaleString('zh-CN')
                              : '-'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{task.createdBy}</span>
                          </div>
                        </TableCell>
                        <TableCell className="sticky right-0 bg-white z-20 border-l">
                          {/* 常用操作直接展示 */}
                          {(() => {
                            const actions = getAvailableActions(task);
                            const commonKeys = getCommonActionKeys(task);
                            const commonActions = actions.filter(a => commonKeys.includes(a.key));
                            const moreActions = actions.filter(a => !commonKeys.includes(a.key));
                            return (
                              <div className="flex items-center gap-2 justify-end w-[220px]">
                                {commonActions.map((a) => {
                                  const ActionIcon = a.icon;
                                  const key = `${task.id}:${a.key}`;
                                  const isLoading = loadingAction === key;
                                  const variant = (a.key === 'stop' || a.key === 'delete' || a.key === 'cancel_queue')
                                    ? 'destructive'
                                    : (a.key === 'start' || a.key === 'retry' || a.key === 'rerun')
                                    ? 'default'
                                    : 'outline';
                                  return (
                                    <Button
                                      key={a.key}
                                      variant={variant as any}
                                      size="sm"
                                      disabled={isLoading}
                                      onClick={() => handleTaskAction(a.key, task.id)}
                                      className={`px-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      <ActionIcon className="h-4 w-4 mr-1" /> {a.label}
                                    </Button>
                                  );
                                })}
                                {/* 更多 */}
                                {moreActions.length > 0 && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="px-2">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {moreActions.map((action) => {
                                        const ActionIcon = action.icon;
                                        const key = `${task.id}:${action.key}`;
                                        const isLoading = loadingAction === key;
                                        return (
                                          <DropdownMenuItem
                                            key={action.key}
                                            disabled={isLoading}
                                            onClick={() => handleTaskAction(action.key, task.id)}
                                            className={isLoading ? 'opacity-50 pointer-events-none' : ''}
                                          >
                                            <ActionIcon className="h-4 w-4 mr-2" />
                                            {action.label}
                                          </DropdownMenuItem>
                                        );
                                      })}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            // 网格视图
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => {
                const statusConfig = getStatusConfig(task.status);
                const priorityConfig = getPriorityConfig(task.priority);
                const StatusIcon = statusConfig.icon;
                const isHighlighted = task.id === highlightTaskId;
                const isStatusAnim = task.id === statusAnimTaskId;
                
                return (
                  <Card
                    key={task.id}
                    id={`task-grid-${task.id}`}
                    className={`hover:shadow-md transition-shadow ${isHighlighted ? 'ring-2 ring-amber-200 bg-amber-50' : ''} ${isStatusAnim ? 'ring-2 ring-lime-300 bg-lime-50 animate-pulse' : ''}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              checked={selectedTaskIds.includes(task.id)}
                              onCheckedChange={(checked: boolean) => handleTaskSelection(task.id, checked)}
                            />
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {task.id}
                            </code>
                          </div>
                          <CardTitle className="text-lg">{task.taskName}</CardTitle>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {getAvailableActions(task).map((action) => {
                              const ActionIcon = action.icon;
                              return (
                                <DropdownMenuItem
                                  key={action.key}
                                  onClick={() => handleTaskAction(action.key, task.id)}
                                >
                                  <ActionIcon className="h-4 w-4 mr-2" />
                                  {action.label}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {getTaskTypeLabel(task.taskType)}
                        </Badge>
                        <Badge className={priorityConfig.color}>
                          {priorityConfig.label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Database className="h-4 w-4 text-gray-400" />
                          {task.datasets && task.datasets.length > 0 ? (
                            <span>
                              {task.datasets[0].name} ({task.datasets[0].version})
                              {task.datasets.length > 1 && ` 等 ${task.datasets.length} 个数据集`}
                            </span>
                          ) : (
                            <span>{task.datasetName} ({task.datasetVersion})</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Cpu className="h-4 w-4 text-gray-400" />
                          <span>{task.modelName}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Target className="h-4 w-4 text-gray-400" />
                          {task.projectId || task.projectName ? (
                            <Badge variant="secondary" className="bg-purple-50">
                              {task.projectName ?? (task.projectId ? getProjectName(task.projectId) : '未选择项目')}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">未选择项目</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{task.createdBy}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(task.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {(['running','pending','completed'].includes(task.status)) && (
                          <div className="flex items-center space-x-2">
                            <Progress value={task.status === 'completed' ? 100 : task.status === 'pending' ? 0 : (task.progress ?? 0)} className="w-16 h-2" />
                            <span className="text-xs text-gray-500">{task.status === 'completed' ? '100%' : `${task.status === 'pending' ? 0 : (task.progress ?? 0)}%`}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到匹配的任务</h3>
              <p className="text-gray-600">尝试调整筛选条件或创建新任务</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 任务详情对话框 */}
      {selectedTaskForDetails && (
        <Dialog open={!!selectedTaskForDetails} onOpenChange={() => setSelectedTaskForDetails(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>任务详情 - {selectedTaskForDetails.taskName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* 任务详情内容 */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">任务ID</Label>
                    <p className="mt-1">{selectedTaskForDetails.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">任务类型</Label>
                    <p className="mt-1">{getTaskTypeLabel(selectedTaskForDetails.taskType)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">数据集</Label>
                    <p className="mt-1">{selectedTaskForDetails.datasetName} ({selectedTaskForDetails.datasetVersion})</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">模型</Label>
                    <p className="mt-1">{selectedTaskForDetails.modelName}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">状态</Label>
                    <div className="mt-1">
                      <Badge className={getStatusConfig(selectedTaskForDetails.status).color}>
                        {getStatusConfig(selectedTaskForDetails.status).label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">优先级</Label>
                    <div className="mt-1">
                      <Badge className={getPriorityConfig(selectedTaskForDetails.priority).color}>
                        {getPriorityConfig(selectedTaskForDetails.priority).label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">创建时间</Label>
                    <p className="mt-1">{new Date(selectedTaskForDetails.createdAt).toLocaleString('zh-CN')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">创建者</Label>
                    <p className="mt-1">{selectedTaskForDetails.createdBy}</p>
                  </div>
                </div>
              </div>
              
              {selectedTaskForDetails.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">任务描述</Label>
                  <p className="mt-1 text-gray-900">{selectedTaskForDetails.description}</p>
                </div>
              )}

              {(['running','pending','completed'].includes(selectedTaskForDetails.status)) && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">执行进度</Label>
                  <div className="mt-2">
                    <Progress value={selectedTaskForDetails.status === 'completed' ? 100 : selectedTaskForDetails.status === 'pending' ? 0 : (selectedTaskForDetails.progress ?? 0)} className="h-3" />
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTaskForDetails.status === 'completed' ? '100% 完成' : `${selectedTaskForDetails.status === 'pending' ? 0 : (selectedTaskForDetails.progress ?? 0)}% 完成`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 确认操作对话框 */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={handleCancelConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.action === 'start' && (
                <>
                  <Play className="h-5 w-5 text-green-600" />
                  确认开始任务
                </>
              )}
              {confirmDialog.action === 'stop' && (
                <>
                  <Square className="h-5 w-5 text-red-600" />
                  确认停止任务
                </>
              )}
              {confirmDialog.action === 'retry' && (
                <>
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                  确认重试任务
                </>
              )}
              {confirmDialog.action === 'rerun' && (
                <>
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                  确认重新运行任务
                </>
              )}
              {confirmDialog.action === 'cancel_queue' && (
                <>
                  <Clock className="h-5 w-5 text-red-600" />
                  确认取消排队
                </>
              )}
              {confirmDialog.action === 'archive' && (
                <>
                  <Archive className="h-5 w-5 text-gray-600" />
                  确认归档任务
                </>
              )}
              {confirmDialog.action === 'delete' && (
                <>
                  <Trash2 className="h-5 w-5 text-red-600" />
                  确认删除任务
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">任务名称</p>
              <p className="font-medium">{confirmDialog.taskName}</p>
            </div>
            
            <div className="text-sm text-gray-600">
              {confirmDialog.action === 'start' && (
                <p>确认要开始执行此任务吗？任务开始后将消耗计算资源，请确保配置正确。</p>
              )}
              {confirmDialog.action === 'stop' && (
                <p>确认要停止正在执行的任务吗？停止后任务将立即中断，已完成的部分会被保留。</p>
              )}
              {confirmDialog.action === 'retry' && (
                <p>确认要重试此任务吗？重试将按当前配置重新执行失败或已取消的任务。</p>
              )}
              {confirmDialog.action === 'rerun' && (
                <p>确认要重新运行此任务吗？该任务将按当前配置重新排队等待执行。</p>
              )}
              {confirmDialog.action === 'cancel_queue' && (
                <p>确认要取消该任务的排队吗？取消后任务状态将回到“未开始”，不会占用队列资源。</p>
              )}
              {confirmDialog.action === 'archive' && (
                <p>确认要归档此任务吗？归档后任务将移至历史记录，不会影响任务结果。</p>
              )}
              {confirmDialog.action === 'delete' && (
                <p>确认要删除此任务吗？此操作不可撤销，任务将从列表中移除。</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleCancelConfirm}
            >
              取消
            </Button>
            <Button
              variant="default"
              type="button"
              onClick={() => executeTaskAction(confirmDialog.action, confirmDialog.taskId)}
              className={
                confirmDialog.action === 'start' 
                  ? '!bg-green-600 hover:!bg-green-700 !text-white' 
                : confirmDialog.action === 'stop' || confirmDialog.action === 'delete'
                  ? '!bg-red-600 hover:!bg-red-700 !text-white'
                : confirmDialog.action === 'retry'
                  ? '!bg-blue-600 hover:!bg-blue-700 !text-white'
                : confirmDialog.action === 'rerun'
                  ? '!bg-blue-600 hover:!bg-blue-700 !text-white'
                : confirmDialog.action === 'cancel_queue'
                  ? '!bg-red-600 hover:!bg-red-700 !text-white'
                : '!bg-gray-700 hover:!bg-gray-800 !text-white'
              }
            >
              {confirmDialog.action === 'start' ? '开始任务' : 
               confirmDialog.action === 'stop' ? '停止任务' : 
               confirmDialog.action === 'retry' ? '重试任务' : 
               confirmDialog.action === 'rerun' ? '重新运行' : 
               confirmDialog.action === 'cancel_queue' ? '取消排队' : 
               confirmDialog.action === 'archive' ? '归档任务' : 
               confirmDialog.action === 'delete' ? '删除任务' : '确认'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { TaskManagement };