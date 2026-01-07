import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Archive,
  ChevronDown,
  Database,
  Target,
  Cpu,
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
  Circle,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import TaskCompare from './TaskCompare';
import type { TaskCompareItem } from './TaskCompare';
import { getAvailableActions, getCommonActionKeys } from '../utils/taskActions';
import {
  Task,
  TaskType,
  TaskStatus,
  TaskPriority,
  DatasetInfo,
} from '../types/task';
import { TASK_TYPES, ALLOWED_TASK_TYPES } from '../utils/taskTypes';
import { useLanguage } from "../i18n/LanguageContext";

// 模拟项目列表（后续可替换为真实项目数据）
const mockProjects = [
  { id: 'proj_001', name: '钢铁缺陷预测' },
  { id: 'proj_002', name: '电力能源预测' },
  { id: 'proj_003', name: '工艺时序预测' },
  { id: 'proj_004', name: '设备故障预测' },
];
const getProjectName = (id: string) => mockProjects.find(p => p.id === id)?.name || '未选择项目';

type ViewMode = 'table' | 'grid';
type SortField = 'createdAt' | 'completedAt' | 'status' | 'priority' | 'taskName';
type SortOrder = 'asc' | 'desc';

// 统一允许的模型常量，供筛选与 UI 复用
const ALLOWED_MODELS = new Set<string>(['Limix', 'XGBoost']);



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

interface TaskManagementProps {
  onOpenCreateTaskPage?: () => void;
  onEditTask?: (task: Task) => void;
  onOpenTaskDetailFullPage?: (task: Task) => void;
  autoOpenDetailAfterCreate?: boolean;
  externalTaskPatch?: { id: string; patch: Partial<Task> } | null;
}


const TaskManagement: React.FC<TaskManagementProps> = ({
  onOpenCreateTaskPage,
  onEditTask,
  onOpenTaskDetailFullPage,
  autoOpenDetailAfterCreate = false,
  externalTaskPatch = null,
}) => {
  const { t } = useLanguage();
  // 对话框与侧边栏控制
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const [isCompDialogOpen, setIsCompDialogOpen] = useState(false);
  const [compareData, setCompareData] = useState<TaskCompareItem[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionLogs, setActionLogs] = useState<{ ts: number; taskId: string; action: string; success: boolean; message: string }[]>([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: '', taskId: '', taskName: '' });
  const [isCompareDemoOpen, setIsCompareDemoOpen] = useState(false);
  const [compareDemoType, setCompareDemoType] = useState<TaskType>(TASK_TYPES.classification);

  // 复制任务对话框状态
  const [copyDialog, setCopyDialog] = useState<{
    isOpen: boolean;
    sourceTask: Task | null;
    newName: string;
    newDescription: string;
  }>({ isOpen: false, sourceTask: null, newName: '', newDescription: '' });


  // 筛选与排序
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

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    order: 'desc'
  });

  const [statusAnimTaskId, setStatusAnimTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (statusAnimTaskId) {
      const timer = setTimeout(() => setStatusAnimTaskId(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [statusAnimTaskId]);

  // 多选下拉搜索词
  const [datasetFilterQuery, setDatasetFilterQuery] = useState('');
  const [modelFilterQuery, setModelFilterQuery] = useState('');

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
          sampleCount: 10000,
          files: ['生产线_主变量.csv', '生产线_协变量_设备功率.csv', '生产线_协变量_环境温度.csv']
        },
        {
          version: 'v2.0',
          createdAt: '2025-01-10 10:20',
          description: '数据清洗优化，移除异常值',
          size: '2.3MB',
          fieldCount: 14,
          sampleCount: 9800,
          files: ['生产线_主变量.csv', '生产线_协变量_设备功率.csv']
        },
        {
          version: 'v1.0',
          createdAt: '2025-01-05 16:45',
          description: '初始版本',
          size: '2.1MB',
          fieldCount: 12,
          sampleCount: 9500,
          files: ['生产线_主变量.csv']
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
          sampleCount: 25000,
          files: ['客户_主变量.csv', '客户_协变量_画像.csv', '客户_交易明细.csv']
        },
        {
          version: 'v1.0',
          createdAt: '2025-01-08 11:30',
          description: '基础行为数据',
          size: '4.8MB',
          fieldCount: 18,
          sampleCount: 23000,
          files: ['客户_主变量.csv', '客户_交易明细.csv']
        }
      ],
      previewData: [
        { user_id: 'U001', age: 28, purchase_amount: 299.99, category: 'electronics', satisfaction: 4.5 },
        { user_id: 'U002', age: 35, purchase_amount: 159.50, category: 'clothing', satisfaction: 4.2 },
        { user_id: 'U003', age: 42, purchase_amount: 89.99, category: 'books', satisfaction: 4.8 }
      ]
    }
  ]);

  // 移除表单联动 Effects 和 Memos

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

  // 对话框状态同步已移除

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
  }, [highlightTaskId, viewMode]);

  // 处理单选
  const handleTaskSelection = (taskId: string, checked: boolean | 'indeterminate') => {
    if (checked === 'indeterminate') return;
    setSelectedTaskIds(prev =>
      checked
        ? [...prev, taskId]
        : prev.filter(id => id !== taskId)
    );
  };


  // 全选
  const handleSelectAll = (checked: boolean) => {
    const filteredTasks = getFilteredAndSortedTasks();
    setSelectedTaskIds(checked ? filteredTasks.map(task => task.id) : []);
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

    // 处理编辑任务操作
    if (action.trim() === 'edit') {
      if (onEditTask) {
        onEditTask(task);
      } else {
        toast.error('未配置编辑任务回调');
      }
      return;
    }


    // 处理复制任务操作
    if (action.trim() === 'copy') {
      setCopyDialog({
        isOpen: true,
        sourceTask: task,
        newName: `${task.taskName}_副本`,
        newDescription: task.description || ''
      });
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
      setActionLogs(prev => [...prev, { ts: Date.now(), taskId, action, success: true, message: '' }]);
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

  /**
   * 确认复制任务：创建一个新任务副本
   * 使用用户输入的名称和描述，状态设为 '未开始'
   */
  const handleConfirmCopy = () => {
    if (!copyDialog.sourceTask) return;
    const source = copyDialog.sourceTask;
    const newTask: Task = {
      ...source,
      id: `TASK-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      taskName: copyDialog.newName || `${source.taskName}_副本`,
      description: copyDialog.newDescription,
      status: 'not_started' as const,
      progress: 0,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      completedAt: undefined,
    };
    setTasks(prev => [newTask, ...prev]);
    setCopyDialog({ isOpen: false, sourceTask: null, newName: '', newDescription: '' });
    toast.success(`任务 "${copyDialog.newName}" 已创建`);
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
        {/* 左侧：顶栏快速筛选（搜索 / 任务类型 / 日期范围） */}
        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
          {/* 搜索 */}
          <Input
            placeholder="搜索任务名称、ID等"
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className="w-[240px] md:w-[280px]"
          />

          {/* 任务类型（移至顶栏） */}
          <Select value={filters.taskType} onValueChange={(value: string) => handleFilterChange('taskType', value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="任务类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {Array.from(ALLOWED_TASK_TYPES).map((tt) => (
                <SelectItem key={tt} value={tt}>{getTaskTypeLabel(tt as TaskType)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 日期范围 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[260px] md:w-[320px] justify-between">
                <span className="truncate text-left">
                  {filters.dateRange.start && filters.dateRange.end
                    ? `${filters.dateRange.start} - ${filters.dateRange.end}`
                    : '开始日期 - 结束日期'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500" />
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

          <Button
            className="flex items-center space-x-2"
            onClick={onOpenCreateTaskPage}
          >
            <Plus className="h-4 w-4" />
            <span>创建任务</span>
          </Button>

        </div>
      </div>

      <div className="space-y-6">
        {/* 第1步已移除 */}

        {/* 第2步：数据与目标 */}
        {/* 第2步已移除 */}

        {/* 任务创建表单已移除 */}
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
      {
        selectedTaskIds.length > 0 && (
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
        )
      }

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
                    {/* 列头：任务类型（筛选已移至顶栏）*/}
                    <TableHead>任务类型</TableHead>

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
                    {/* 列头筛选：数据集（多选）*/}
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <span>数据集</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 h-6 w-6 ${filters.datasetNames && filters.datasetNames.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}
                              aria-label="数据集筛选"
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                            >
                              <Filter className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-[300px] p-0">
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
                      </div>
                    </TableHead>
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
                            {(['running', 'pending', 'completed'].includes(task.status)) && (
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
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <CalendarIcon className="h-3 w-3 mr-1 text-gray-400" />
                          <span>{new Date(task.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {(['running', 'pending', 'completed'].includes(task.status)) && (
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
      {
        selectedTaskForDetails && (
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

                {(['running', 'pending', 'completed'].includes(selectedTaskForDetails.status)) && (
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
        )
      }

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

      {/* 复制任务对话框 */}
      <Dialog open={copyDialog.isOpen} onOpenChange={(open) => !open && setCopyDialog({ isOpen: false, sourceTask: null, newName: '', newDescription: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-blue-600" />
              复制任务
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">原任务名称</p>
              <p className="font-medium text-gray-900">{copyDialog.sourceTask?.taskName}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">新任务名称</Label>
              <Input
                value={copyDialog.newName}
                onChange={(e) => setCopyDialog({ ...copyDialog, newName: e.target.value })}
                placeholder="请输入新任务名称"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">任务描述</Label>
              <Textarea
                value={copyDialog.newDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCopyDialog({ ...copyDialog, newDescription: e.target.value })}
                placeholder="请输入任务描述（可选）"
                className="min-h-[80px] resize-none"
              />
            </div>

            <p className="text-sm text-gray-500">
              复制后的新任务状态将设为"未开始"，您可以在任务列表中查看并启动。
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setCopyDialog({ isOpen: false, sourceTask: null, newName: '', newDescription: '' })}
            >
              取消
            </Button>
            <Button
              variant="default"
              onClick={handleConfirmCopy}
              disabled={!copyDialog.newName.trim()}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white"
            >
              确认复制
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export { TaskManagement };
