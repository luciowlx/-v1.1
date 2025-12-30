import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { VirtualTable } from "./ui/virtual-table";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Calendar } from "./ui/calendar";
import { useLanguage } from "../i18n/LanguageContext";
import { buildDataDetailUrl } from "../utils/deeplink";
import { mockDatasets as initialMockDatasets } from "../mock/datasets";
import type { DateRange } from "react-day-picker";
import { GrayLabels } from "./data/GrayLabels";
import { DatasetGrid } from "./data/DatasetGrid";
import { DatasetTable } from "./data/DatasetTable";
import { DataHeaderFilters } from "./data/DataHeaderFilters";
import { DataToolbar } from "./data/DataToolbar";
import { ColumnSettingsDialog } from "./data/ColumnSettingsDialog";
import { DeleteConfirmDialog } from "./data/DeleteConfirmDialog";
import { CancelUploadDialog } from "./data/CancelUploadDialog";
import { formatYYYYMMDD, parseDateFlexible, toDateOnly, toEndOfDay, isDateWithinRange } from "../utils/date";

import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Modal,
  Radio,
  Space,
  Typography,
  Tooltip as AntTooltip,
  message as antMessage
} from "antd";
const { Text: AntText } = Typography;
import {
  Upload,
  Database,
  Eye,
  Settings,
  Download,
  FileText,
  Clock,
  TrendingUp,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Zap,
  BarChart3,
  Grid3X3,
  List,
  Columns,
  Trash2,
  Edit,
  Copy,
  Filter,
  Search,
  MoreHorizontal,
  Archive,
  Plus,
  Calendar as CalendarIcon
} from "lucide-react";
import { toast } from "sonner";
import { DataUpload } from "./DataUpload";
import { DataSubscription } from "./DataSubscription";
import { SubscriptionList } from "./SubscriptionList";
import { DataPreprocessing } from "./DataPreprocessing";
import { DataDetailDialog } from "./DataDetailDialog";

interface DataManagementProps {
  onNavigateToPreprocessing?: () => void;
  isUploadDialogOpen?: boolean;
  onUploadDialogClose?: () => void;
  // 扩展：支持传入初始Tab，用于直接跳转至指定详情页标签
  onOpenDataDetailFullPage?: (dataset: any, initialTab?: 'overview' | 'versions' | 'missing') => void;
}

interface ColumnSettings {
  id: boolean;
  name: boolean;
  description: boolean;
  categories: boolean;
  format: boolean;
  size: boolean;
  rows: boolean;
  columns: boolean;
  source: boolean;
  version: boolean;
  updateTime: boolean;
  status: boolean;
  actions: boolean;
}

interface Dataset {
  id: number;
  title: string;
  description: string;
  categories: Array<{ name: string; color: string }>;
  tags: Array<{ name: string; color: string }>;
  formats: string[];
  size: string;
  rows: string;
  columns: string;
  completeness: number;
  source: string;
  version: string;
  // 数据版本数量（用于在列表中展示）
  versionCount?: number;
  // 文件数量（用于在列表中展示与排序）
  fileCount?: number;
  updateTime: string;
  status: 'success' | 'processing' | 'failed';
  color: string;
  // 为DataDetailDialog添加的字段
  type?: string;
  fieldCount?: number;
  sampleCount?: number;
  previousUploadItems?: Array<{ name: string; size: string; status: 'success' | 'failed'; error?: string }>;
}
// 统一来源类型，覆盖上传/订阅/API/数据库/未知，避免后续筛选 includes 比较的联合类型不兼容
type SourceType = 'upload' | 'subscription' | 'api' | 'database' | 'unknown';

export function DataManagement({
  onNavigateToPreprocessing,
  isUploadDialogOpen = false,
  onUploadDialogClose,
  onOpenDataDetailFullPage
}: DataManagementProps = {}) {
  /**
   * 渲染统一灰色样式的标签列表，默认最多展示三个。
   * 超出部分以“+N”徽标展示，悬停时显示剩余标签名称。
   * 参数 items 为包含 name 字段的对象数组，返回用于展示的 JSX 元素。
   * 返回值：React.ReactNode — 包含灰色徽标和可选的悬停提示。
   */

  const { lang, t } = useLanguage();
  // 视图模式：默认优先列表
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // 数据集列表状态：初始化为导入的 mock 数据
  const [datasets, setDatasets] = useState<Dataset[]>(initialMockDatasets as Dataset[]);

  // 监听全局数据集更新事件，实现原型下的跨组件刷新
  useEffect(() => {
    const handleUpdate = () => {
      setDatasets([...initialMockDatasets] as Dataset[]);
    };
    window.addEventListener('datasets-updated', handleUpdate);
    return () => window.removeEventListener('datasets-updated', handleUpdate);
  }, []);
  const [isLocalUploadDialogOpen, setIsLocalUploadDialogOpen] = useState(false);
  const [isAddDataSourceModalOpen, setIsAddDataSourceModalOpen] = useState(false);
  const [isDataSubscriptionOpen, setIsDataSubscriptionOpen] = useState(false);
  const [isSubscriptionListOpen, setIsSubscriptionListOpen] = useState(false);
  const [isDataPreprocessingOpen, setIsDataPreprocessingOpen] = useState(false);
  const [selectedDatasetForPreprocessing, setSelectedDatasetForPreprocessing] = useState<Dataset | null>(null);
  const [preprocessingMode, setPreprocessingMode] = useState<'traditional' | 'auto'>('traditional');
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [copyingDataset, setCopyingDataset] = useState<Dataset | null>(null);

  const [isDataDetailDialogOpen, setIsDataDetailDialogOpen] = useState(false);
  const [selectedDatasetForDetail, setSelectedDatasetForDetail] = useState<Dataset | null>(null);

  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  // 状态筛选已移除（仅保留展示，不参与过滤）
  // 列表排序：移除顶部“名称/大小/行数”选择，但保留列表/表头点击排序能力，默认按更新时间倒序
  type SortField = 'name' | 'size' | 'rows' | 'columns' | 'updateTime';
  const SORTABLE_COLUMNS = ['name', 'size', 'rows', 'columns', 'updateTime'] as const;
  const isSortField = (col: string): col is SortField => (SORTABLE_COLUMNS as readonly string[]).includes(col);
  const isSortOrder = (o: string): o is 'asc' | 'desc' => o === 'asc' || o === 'desc';
  const [sortBy, setSortBy] = useState<SortField>('updateTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 批量操作状态
  const [selectedDatasets, setSelectedDatasets] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // 删除确认状态
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'batch', ids: number[] }>({ type: 'single', ids: [] });
  // 取消上传确认状态
  const [isCancelUploadConfirmOpen, setIsCancelUploadConfirmOpen] = useState(false);
  const [cancelUploadTargetId, setCancelUploadTargetId] = useState<number | null>(null);

  // 列设置状态
  const [columnSettings, setColumnSettings] = useState<ColumnSettings>({
    id: true,
    name: true,
    description: true,
    categories: true,
    format: true,
    size: true,
    rows: true,
    columns: false,
    source: true,
    version: true,
    updateTime: true,
    status: true,
    actions: true
  });

  // 高级筛选状态（将“大小范围(MB)”改为“列数范围”，移除“完整度范围”）
  const [advancedFilters, setAdvancedFilters] = useState({
    columnsRange: [0, 1000] as [number, number],
    rowsRange: [0, 1000000] as [number, number],
    dateRange: null as DateRange | null,
    tagQuery: '' as string,
    formats: [] as string[],
    tags: [] as string[]
  });

  // 已移除高级筛选弹窗开关；保留 advancedFilters 作为顶部控件的即时筛选状态

  // 列筛选（表头 Popover 多选）：状态/标签/格式
  // 状态列头筛选已移除
  const [columnFilterTags, setColumnFilterTags] = useState<string[]>([]);
  const [columnFilterFormat, setColumnFilterFormat] = useState<string[]>([]);
  const [isQueryDialogOpen, setIsQueryDialogOpen] = useState(false);
  const [querySelectedTags, setQuerySelectedTags] = useState<string[]>([]);
  const [querySelectedFormats, setQuerySelectedFormats] = useState<string[]>([]);

  const [isTagsColFilterOpen, setIsTagsColFilterOpen] = useState(false);
  const [isFormatColFilterOpen, setIsFormatColFilterOpen] = useState(false);
  // 预处理任务：状态列头筛选 Popover 开关（将原顶部“全部状态”下拉迁移到列头）
  const [isPreprocessStatusColFilterOpen, setIsPreprocessStatusColFilterOpen] = useState(false);

  const [dataSourceFormData, setDataSourceFormData] = useState({
    name: "",
    type: "",
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    description: ""
  });

  const [taskFormData, setTaskFormData] = useState({
    name: "",
    description: "",
    datasetId: "",
    operations: [] as string[]
  });

  // 二级菜单状态
  const [activeSubmenu, setActiveSubmenu] = useState<'datasets' | 'preprocessing'>('datasets');

  // 预处理任务列表数据与操作
  interface PreprocessingTask {
    id: number;
    name: string;
    dataset: string;
    type: string;
    /**
     * 创建人（任务预处理列表新增字段）
     * 用途：在任务列表中展示任务的创建人，提升责任归属与沟通效率。
     */
    creator: string;
    // 任务状态：新增 not_started 用于“未开始”展示
    status: 'success' | 'running' | 'pending' | 'failed' | 'not_started';
    // 是否曾经排队过：用于在未开始状态下显示“重试”而非“开始执行”
    hasQueuedBefore?: boolean;
    operations: string[];
    startTime?: string | null;
    createdAt?: string;
    completedAt?: string | null;
    progress?: number; // 仅在进行中展示进度
  }

  const [preprocessingTasks, setPreprocessingTasks] = useState<PreprocessingTask[]>([
    {
      id: 1,
      name: '传感器数据预处理',
      dataset: '销售数据集',
      type: '数据清洗',
      creator: '张三',
      status: 'success',
      operations: ['异常值处理', '缺失值处理', '数据标准化'],
      startTime: '2024-01-15T09:00:00.000Z',
      createdAt: '2024-01-14T10:00:00.000Z',
      completedAt: '2024-01-15T10:30:00.000Z'
    },
    {
      id: 2,
      name: '缺陷记录清洗正则',
      dataset: '用户行为数据',
      type: '特征工程',
      creator: '李四',
      status: 'running',
      operations: ['特征选择', '特征转换', '特征组合'],
      startTime: '2024-01-15T14:00:00.000Z',
      createdAt: '2024-01-15T12:00:00.000Z',
      progress: 65
    },
    {
      id: 3,
      name: 'ERP数据质量评估',
      dataset: '产品库存数据',
      type: '质量评估',
      creator: '王五',
      status: 'pending',
      operations: ['完整性检测', '一致性校验', '准确性评估'],
      startTime: null,
      createdAt: '2024-01-16T08:20:00.000Z'
    },
    {
      id: 4,
      name: '设备日志预处理',
      dataset: '销售数据集',
      type: '数据清洗',
      creator: '赵六',
      status: 'failed',
      operations: ['异常值处理', '日志解析'],
      startTime: '2024-01-13T09:30:00.000Z',
      createdAt: '2024-01-13T09:00:00.000Z',
      completedAt: null
    }
  ]);

  // 任务筛选状态与派生数据
  const [taskFilters, setTaskFilters] = useState<{ status: 'all' | 'success' | 'running' | 'pending' | 'failed'; dateRange: DateRange | null; datasetQuery: string }>({
    status: 'all',
    dateRange: null,
    datasetQuery: ''
  });

  const filteredPreprocessingTasks = preprocessingTasks.filter(t => {
    const statusOk = taskFilters.status === 'all' || t.status === taskFilters.status;
    const q = taskFilters.datasetQuery.trim().toLowerCase();
    // 改为按任务ID或数据集搜索
    const queryOk = !q || t.dataset.toLowerCase().includes(q) || String(t.id).toLowerCase().includes(q);
    const dateOk = !taskFilters.dateRange || isDateWithinRange(t.createdAt ?? t.startTime ?? '', taskFilters.dateRange);
    return statusOk && queryOk && dateOk;
  });

  // 重新上传目标ID：用于在上传成功后将对应数据集状态更新为成功
  const [reuploadTargetId, setReuploadTargetId] = useState<number | null>(null);

  const handleStartTask = (id: number) => {
    setPreprocessingTasks(prev => prev.map(t => (
      t.id === id ? { ...t, status: 'running', progress: 0, startTime: new Date().toISOString(), completedAt: null } : t
    )));
    toast.success(t('data.toast.taskStart'));
  };

  const handleStopTask = (id: number) => {
    setPreprocessingTasks(prev => prev.map(t => (
      t.id === id ? { ...t, status: 'failed', progress: undefined, completedAt: new Date().toISOString() } : t
    )));
    toast.success(t('data.toast.taskStop'));
  };

  const handleViewTask = (id: number) => {
    const task = preprocessingTasks.find(t => t.id === id);
    if (task) {
      // 根据任务关联的数据集名称查找数据集ID
      const dataset = datasets.find(d => d.title === task.dataset);
      if (dataset) {
        handleViewDataDetail(dataset.id);
      } else {
        toast.info(t('data.toast.datasetNotFound'), {
          description: `${t('data.toast.datasetNotFound.prefix')} ${task.dataset}`
        });
      }
    }
  };

  const handleRetryTask = (id: number) => {
    setPreprocessingTasks(prev => prev.map(t => (
      t.id === id ? { ...t, status: 'running', progress: 0, startTime: new Date().toISOString(), completedAt: null } : t
    )));
    toast.success(t('data.toast.taskRetry'));
  };

  // 任务操作二次确认（停止/重试/删除）
  const [taskActionConfirm, setTaskActionConfirm] = useState<{ open: boolean; action: 'stop' | 'retry' | 'delete' | null; taskId: number | null }>({ open: false, action: null, taskId: null });
  /** 打开任务操作确认弹窗 */
  const openTaskConfirm = (action: 'stop' | 'retry' | 'delete', id: number) => {
    setTaskActionConfirm({ open: true, action, taskId: id });
  };
  /** 确认执行任务操作 */
  const confirmTaskAction = () => {
    const { action, taskId } = taskActionConfirm;
    if (!action || taskId == null) return;
    if (action === 'stop') {
      handleStopTask(taskId);
    } else if (action === 'retry') {
      handleRetryTask(taskId);
    } else if (action === 'delete') {
      handleDeleteTask(taskId);
    }
    setTaskActionConfirm({ open: false, action: null, taskId: null });
  };

  // i18n 兜底：若 t 返回原始键值，则使用提供的中文文案
  const tt = (key: string, fallback: string): string => {
    const val = t(key);
    return (!val || val === key) ? fallback : val;
  };

  // 取消排队相关：二次确认对话框状态
  const [cancelQueueDialog, setCancelQueueDialog] = useState<{ open: boolean; taskId: number | null }>({ open: false, taskId: null });

  /**
   * 打开取消排队确认弹窗
   * @param id 任务ID
   */
  const openCancelQueueConfirm = (id: number) => {
    setCancelQueueDialog({ open: true, taskId: id });
  };

  /**
   * 确认取消排队：任务状态改为 not_started，标记 hasQueuedBefore=true，使操作按钮显示“重试”
   */
  const confirmCancelQueue = () => {
    if (!cancelQueueDialog.taskId) return;
    const id = cancelQueueDialog.taskId;
    setPreprocessingTasks(prev => prev.map(t => (
      t.id === id ? { ...t, status: 'not_started', progress: undefined, startTime: null, completedAt: null, hasQueuedBefore: true } : t
    )));
    setCancelQueueDialog({ open: false, taskId: null });
    toast.success(t('data.toast.cancelQueueSuccess'));
  };

  const handleEditTask = (id: number) => {
    const task = preprocessingTasks.find(t => t.id === id);
    if (!task) return;
    const ds = datasets.find(d => d.title === task.dataset);
    setSelectedDatasetForPreprocessing(ds ?? null);
    setIsDataPreprocessingOpen(true);
  };

  const handleDeleteTask = (id: number) => {
    setPreprocessingTasks(prev => prev.filter(t => t.id !== id));
    toast.success(t('data.toast.taskDeleteSuccess'));
  };

  const handleDatasetClick = (datasetName: string) => {
    const ds = datasets.find(d => d.title === datasetName);
    if (ds) {
      handleViewDataDetail(ds.id);
    } else {
      toast.info(t('data.toast.datasetNotFound'), {
        description: `${t('data.toast.datasetNotFound.prefix')} ${datasetName}`
      });
    }
  };

  useEffect(() => {
    setIsLocalUploadDialogOpen(isUploadDialogOpen);
  }, [isUploadDialogOpen]);

  // 模拟数据逻辑已迁移至上方 useEffect 之前

  // 获取所有可用的标签和格式选项
  const availableTags = Array.from(new Set(datasets.flatMap(d => d.tags.map(t => t.name))));
  const availableFormats = Array.from(new Set(datasets.flatMap(d => d.formats || [])));

  const stats = [
    {
      label: t("data.stats.totalDatasets"),
      value: "156",
      icon: Database
    },
    {
      label: t("data.stats.uploadsToday"),
      value: "12",
      icon: Upload
    },
    {
      label: t("data.stats.importing"),
      value: "8",
      icon: Clock
    },
    {
      label: t("data.stats.totalStorage"),
      value: "2.4TB",
      icon: FileText
    }
  ];

  // 筛选和排序逻辑
  const filteredAndSortedDatasets = datasets
    .filter(dataset => {
      const matchesSearch = dataset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchTerm.toLowerCase());
      // 已移除状态筛选逻辑：不再根据状态过滤，仅展示

      // 高级筛选
      const rowsCount = parseInt(dataset.rows.replace(/,/g, ''));
      const columnsCount = parseInt(dataset.columns.replace(/,/g, ''));

      // 日期范围筛选（基于 updateTime）：统一为“日期”维度比较，避免解析偏差
      const updateDateRaw = parseDateFlexible(dataset.updateTime);
      const updateDate = updateDateRaw ? toDateOnly(updateDateRaw) : null;
      const start = advancedFilters.dateRange?.from ? toDateOnly(new Date(advancedFilters.dateRange.from)) : null;
      const end = advancedFilters.dateRange?.to ? toEndOfDay(new Date(advancedFilters.dateRange.to)) : null;
      let matchesDateRange = true;
      if ((start || end) && !updateDate) {
        matchesDateRange = false; // 无法解析更新时间，但设置了日期范围，则视为不匹配
      } else {
        if (start && updateDate) {
          matchesDateRange = matchesDateRange && updateDate >= start;
        }
        if (end && updateDate) {
          matchesDateRange = matchesDateRange && updateDate <= end;
        }
      }

      const matchesFormatColumn = columnFilterFormat.length === 0 || (dataset.formats || []).some(f => columnFilterFormat.map(s => s.toLowerCase()).includes((f || '').toLowerCase()));
      // 列头标签筛选：与高级筛选的 tagQuery 可组合
      const matchesTagsColumn = columnFilterTags.length === 0 || dataset.tags.some(t => columnFilterTags.includes(t.name));
      const matchesAdvanced =
        columnsCount >= advancedFilters.columnsRange[0] && columnsCount <= advancedFilters.columnsRange[1] &&
        rowsCount >= advancedFilters.rowsRange[0] && rowsCount <= advancedFilters.rowsRange[1] &&
        (!advancedFilters.tagQuery || dataset.tags.some(t => t.name.toLowerCase().includes(advancedFilters.tagQuery.toLowerCase()))) &&
        (advancedFilters.formats.length === 0 || (dataset.formats || []).some(f => advancedFilters.formats.map(s => s.toLowerCase()).includes((f || '').toLowerCase()))) &&
        (advancedFilters.tags.length === 0 || dataset.tags.some(t => advancedFilters.tags.includes(t.name))) &&
        matchesFormatColumn &&
        matchesDateRange;

      return matchesSearch && matchesAdvanced && matchesTagsColumn;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;
      switch (sortBy) {
        case 'name':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'size':
          // 改为按文件数量排序
          aValue = Number(a.fileCount ?? 0);
          bValue = Number(b.fileCount ?? 0);
          break;
        case 'rows':
          aValue = parseInt(a.rows.replace(/,/g, ''));
          bValue = parseInt(b.rows.replace(/,/g, ''));
          break;
        case 'columns':
          aValue = parseInt(a.columns.replace(/,/g, ''));
          bValue = parseInt(b.columns.replace(/,/g, ''));
          break;
        default:
          aValue = parseDateFlexible(a.updateTime) ?? new Date(0);
          bValue = parseDateFlexible(b.updateTime) ?? new Date(0);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // 分页逻辑
  const totalPages = Math.ceil(filteredAndSortedDatasets.length / itemsPerPage);
  const paginatedDatasets = filteredAndSortedDatasets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 批量选择逻辑
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDatasets([]);
    } else {
      const ids = viewMode === 'list'
        ? filteredAndSortedDatasets.map(d => d.id)
        : paginatedDatasets.map(d => d.id);
      setSelectedDatasets(ids);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectDataset = (id: number) => {
    if (selectedDatasets.includes(id)) {
      setSelectedDatasets(selectedDatasets.filter(datasetId => datasetId !== id));
    } else {
      setSelectedDatasets([...selectedDatasets, id]);
    }
  };

  // 功能处理函数
  const handleSingleDelete = (id: number) => {
    setDeleteTarget({ type: 'single', ids: [id] });
    setIsDeleteConfirmOpen(true);
  };

  const handleBatchDelete = () => {
    setDeleteTarget({ type: 'batch', ids: selectedDatasets });
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    toast.success(t('data.toast.batchDeleteSuccess'), {
      description: lang === 'zh'
        ? `已删除 ${deleteTarget.ids.length} 个数据集`
        : `Deleted ${deleteTarget.ids.length} datasets`
    });
    setSelectedDatasets([]);
    setIsDeleteConfirmOpen(false);
  };

  const handleEdit = (id: number) => {
    const dataset = datasets.find(d => d.id === id);
    if (dataset) {
      setEditingDataset(dataset);
      setIsEditDialogOpen(true);
    }
  };

  // 保存编辑的数据集
  const handleSaveEdit = () => {
    if (!editingDataset) return;

    // 更新数据集列表
    setDatasets(prevDatasets =>
      prevDatasets.map(dataset =>
        dataset.id === editingDataset.id
          ? { ...editingDataset, updateTime: new Date().toISOString() }
          : dataset
      )
    );

    toast.success(t('data.toast.datasetUpdateSuccess'));
    setIsEditDialogOpen(false);
    setEditingDataset(null);
  };

  const handleCopy = (id: number) => {
    const dataset = datasets.find(d => d.id === id);
    if (dataset) {
      setCopyingDataset({
        ...dataset,
        title: `${dataset.title}-副本`
      });
      setIsCopyDialogOpen(true);
    }
  };

  // 保存复制的数据集
  const handleSaveCopy = () => {
    if (!copyingDataset) return;

    // 生成新的ID（取当前最大ID + 1）
    const maxId = Math.max(...datasets.map(d => d.id));
    const newDataset = {
      ...copyingDataset,
      id: maxId + 1,
      updateTime: new Date().toISOString(),
      status: 'success' as const
    };

    // 添加到数据集列表
    setDatasets(prevDatasets => [...prevDatasets, newDataset]);

    antMessage.success(lang === 'zh'
      ? `数据集复制成功`
      : `Dataset copy success`);


    toast.success(t('data.toast.copyDatasetSuccess'), {
      description: lang === 'zh'
        ? `已复制数据集：${newDataset.title}`
        : `Copied dataset: ${newDataset.title}`
    });
    setIsCopyDialogOpen(false);
    setCopyingDataset(null);

  };

  // 编辑弹窗的标签管理
  const [editNewTagName, setEditNewTagName] = useState('');

  // 预定义的标签颜色
  const editTagColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];

  // 编辑弹窗添加标签
  const addEditTag = () => {
    if (!editNewTagName.trim() || !editingDataset) return;

    // 检查是否已存在相同名称的标签
    if (editingDataset.tags.some(tag => tag.name === editNewTagName.trim())) {
      toast.error('标签已存在');
      return;
    }

    const newTag = {
      name: editNewTagName.trim(),
      color: editTagColors[editingDataset.tags.length % editTagColors.length]
    };

    setEditingDataset({
      ...editingDataset,
      tags: [...editingDataset.tags, newTag]
    });

    setEditNewTagName('');
  };

  // 编辑弹窗删除标签
  const removeEditTag = (tagName: string) => {
    if (!editingDataset) return;

    setEditingDataset({
      ...editingDataset,
      tags: editingDataset.tags.filter(tag => tag.name !== tagName)
    });
  };


  /**
   * 点击“查看详情”：在新标签页打开数据详情，初始页签为 overview。
   * @param id 数据集唯一标识
   * @returns void
   */
  const handleViewDataDetail = (id: number) => {
    const url = buildDataDetailUrl(id, 'overview');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = (id: number) => {
    toast.success(t('data.toast.downloadStart'), {
      description: lang === 'zh'
        ? `数据集 ${id}`
        : `Dataset ${id}`
    });
  };

  const handleBatchDownload = () => {
    toast.success(t('data.toast.batchDownloadStart'), {
      description: lang === 'zh'
        ? `共 ${selectedDatasets.length} 个数据集`
        : `Total ${selectedDatasets.length} datasets`
    });
  };

  const handleBatchArchive = () => {
    toast.success(t('data.toast.batchArchiveSuccess'), {
      description: lang === 'zh'
        ? `共 ${selectedDatasets.length} 个数据集`
        : `Total ${selectedDatasets.length} datasets`
    });
    setSelectedDatasets([]);
  };

  const handleRefreshData = () => {
    toast.success(t('data.toast.refreshSuccess'));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSortBy('updateTime');
    setSortOrder('desc');
    setAdvancedFilters({
      columnsRange: [0, 1000],
      rowsRange: [0, 1000000],
      dateRange: null,
      tagQuery: '',
      formats: [],
      tags: []
    });
    toast.success(t('data.toast.filtersReset'));
  };

  /**
   * handleApplyQuery
   * 点击顶栏“查询”按钮的处理函数。
   * 说明：由于筛选条件（标签检索、日期范围、行/列范围、格式等）已是响应式应用，
   * 按钮仅用于显式触发用户的“查询”动作，不弹出任何弹窗，也不更改筛选状态。
   * 为了确保一次渲染触发，这里会对 advancedFilters 进行一次浅拷贝赋值。
   */
  const handleApplyQuery = () => {
    setIsQueryDialogOpen(true);
  };

  // 新增：按状态的操作函数
  const handleCancelUpload = (id: number) => {
    // 打开二次确认弹窗，避免误触
    setCancelUploadTargetId(id);
    setIsCancelUploadConfirmOpen(true);
  };

  const handleConfirmCancelUpload = () => {
    if (cancelUploadTargetId === null) return;
    const dataset = datasets.find(d => d.id === cancelUploadTargetId);
    setDatasets(prev => prev.map(d => d.id === cancelUploadTargetId ? { ...d, status: 'failed', updateTime: new Date().toISOString() } : d));
    toast.success(t('data.toast.cancelUploadSuccess'), {
      description: dataset
        ? (lang === 'zh'
          ? `已取消 ${dataset.title} 的上传（覆盖当前版本，不保留旧版本）`
          : `Cancelled upload for ${dataset.title} (overwrite current version, do not keep old version)`)
        : ''
    });
    setIsCancelUploadConfirmOpen(false);
    setCancelUploadTargetId(null);
  };

  const handleReupload = (id: number) => {
    setReuploadTargetId(id);
    setIsLocalUploadDialogOpen(true);
    toast.info(t('data.toast.prepareReupload'), {
      description: lang === 'zh'
        ? `请选择文件以重新上传数据集 ${id}`
        : `Please select a file to re-upload dataset ${id}`
    });
  };

  const handleQuickPreprocess = (id: number) => {
    const dataset = datasets.find(d => d.id === id);
    if (dataset) {
      setSelectedDatasetForPreprocessing(dataset);
      setIsDataPreprocessingOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和描述 */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('data.title')}</h1>
          <p className="text-gray-600 mt-2">{t('data.description')}</p>
        </div>

        {/* 二级菜单 */}
        <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg w-fit">
          <button
            onClick={() => setActiveSubmenu('datasets')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSubmenu === 'datasets'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Database className="w-4 h-4" />
            <span>{t('data.submenu.datasets')}</span>
          </button>
          <button
            onClick={() => setActiveSubmenu('preprocessing')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSubmenu === 'preprocessing'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t('data.submenu.preprocessing')}</span>
          </button>
        </div>
      </div>

      {/* 根据选中的菜单显示不同内容 */}
      {activeSubmenu === 'datasets' && (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="w-[200px]">
                <CardContent className="flex items-center p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <stat.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DataHeaderFilters
            searchTerm={searchTerm}
            onSearchTermChange={(v) => setSearchTerm(v)}
            tagQuery={advancedFilters.tagQuery}
            onTagQueryChange={(v) => setAdvancedFilters(prev => ({ ...prev, tagQuery: v }))}
            dateRange={advancedFilters.dateRange}
            onDateRangeChange={(range) => setAdvancedFilters(prev => ({ ...prev, dateRange: range }))}
            onApplyQuery={handleApplyQuery}
            onResetFilters={handleResetFilters}
            t={t}
            formatYYYYMMDD={formatYYYYMMDD}
          />
          <Dialog open={isQueryDialogOpen} onOpenChange={setIsQueryDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>查询</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">标签</p>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTags.map((tag) => (
                      <label key={tag} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={querySelectedTags.includes(tag)}
                          onChange={(e) => {
                            setQuerySelectedTags((prev) => e.target.checked ? [...prev, tag] : prev.filter(tg => tg !== tag));
                          }}
                        />
                        <span>{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">格式</p>
                  <div className="grid grid-cols-2 gap-2">
                    {availableFormats.map((fmt) => (
                      <label key={fmt} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={querySelectedFormats.includes(fmt)}
                          onChange={(e) => {
                            setQuerySelectedFormats((prev) => e.target.checked ? [...prev, fmt] : prev.filter(f => f !== fmt));
                          }}
                        />
                        <span>{fmt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setQuerySelectedTags([]); setQuerySelectedFormats([]); }}>重置</Button>
                  <Button onClick={() => { setAdvancedFilters(prev => ({ ...prev, tags: querySelectedTags, formats: querySelectedFormats })); setIsQueryDialogOpen(false); }}>应用</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <DataToolbar
            selectedIds={selectedDatasets.map(String)}
            onOpenUpload={() => setIsLocalUploadDialogOpen(true)}
            onOpenSubscription={() => setIsDataSubscriptionOpen(true)}
            onOpenSubscriptionList={() => setIsSubscriptionListOpen(true)}
            onBatchDownload={handleBatchDownload}
            onBatchArchive={handleBatchArchive}
            onBatchDelete={handleBatchDelete}
            onOpenColumnSettings={() => setIsColumnSettingsOpen(true)}
            viewMode={viewMode as 'list' | 'grid'}
            onSwitchViewMode={(mode) => setViewMode(mode)}
            t={t}
          />

          {/* 数据展示区域 */}
          {viewMode === 'grid' ? (
            <DatasetGrid
              datasets={paginatedDatasets as any[]}
              selectedIds={selectedDatasets.map(String)}
              onToggleSelect={(id) => handleSelectDataset(Number(id))}
              onEdit={(id) => handleEdit(Number(id))}
              onCopy={(id) => handleCopy(Number(id))}
              onDelete={(id) => handleSingleDelete(Number(id))}
              onViewDetail={(id) => handleViewDataDetail(Number(id))}
              onQuickPreprocess={(id) => handleQuickPreprocess(Number(id))}
              onDownload={(id) => handleDownload(Number(id))}
              onCancelUpload={(id) => handleCancelUpload(Number(id))}
              t={t}
            />
          ) : (
            <DatasetTable
              data={filteredAndSortedDatasets as any}
              selectAll={selectAll}
              onSelectAll={handleSelectAll}
              selectedIds={selectedDatasets}
              onToggleSelect={(id) => handleSelectDataset(Number(id))}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(column, order) => {
                const col = String(column);
                const ord = String(order);
                if (isSortField(col)) {
                  setSortBy(col);
                }
                if (isSortOrder(ord)) {
                  setSortOrder(ord);
                }
              }}
              columnSettings={columnSettings}
              t={t}
              formatYYYYMMDD={formatYYYYMMDD}
              isTagsColFilterOpen={isTagsColFilterOpen}
              onTagsFilterOpenChange={setIsTagsColFilterOpen}
              availableTags={availableTags}
              columnFilterTags={columnFilterTags}
              onToggleTagFilter={(tag, checked) => setColumnFilterTags(prev => checked ? [...prev, tag] : prev.filter(tg => tg !== tag))}
              onResetTagFilter={() => setColumnFilterTags([])}
              isFormatColFilterOpen={isFormatColFilterOpen}
              onFormatFilterOpenChange={setIsFormatColFilterOpen}
              availableFormats={availableFormats}
              columnFilterFormat={columnFilterFormat}
              onToggleFormatFilter={(fmt, checked) => setColumnFilterFormat(prev => checked ? [...prev, fmt] : prev.filter(f => f !== fmt))}
              onResetFormatFilter={() => setColumnFilterFormat([])}
              onViewDataDetail={(id) => handleViewDataDetail(Number(id))}
              onQuickPreprocess={(id) => handleQuickPreprocess(Number(id))}
              onDownload={(id) => handleDownload(Number(id))}
              onEdit={(id) => handleEdit(Number(id))}
              onCopy={(id) => handleCopy(Number(id))}
              onDelete={(id) => handleSingleDelete(Number(id))}
              onCancelUpload={(id) => handleCancelUpload(Number(id))}
            />
          )}

          {/* 分页控件：仅在网格视图显示 */}
          {viewMode === 'grid' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  显示 {(currentPage - 1) * itemsPerPage + 1} 到 {Math.min(currentPage * itemsPerPage, filteredAndSortedDatasets.length)} 条，共 {filteredAndSortedDatasets.length} 条
                </span>
                <select
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10条/页</option>
                  <option value={20}>20条/页</option>
                  <option value={50}>50条/页</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  {t('common.prev')}
                </Button>
                <span className="flex items-center px-3 py-1 text-sm">
                  {t('data.pagination.page')} {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 已移除：高级筛选弹窗，改为顶栏“查询”按钮直接使用当前筛选条件 */}

      <ColumnSettingsDialog
        open={isColumnSettingsOpen}
        title={t('data.columnsSettings.title')}
        settings={columnSettings}
        onChange={(key, value) => setColumnSettings(prev => ({ ...prev, [key]: value }))}
        onSelectAll={() => setColumnSettings({
          id: true,
          name: true,
          description: true,
          categories: true,
          format: true,
          size: true,
          rows: true,
          columns: true,
          source: true,
          version: true,
          updateTime: true,
          status: true,
          actions: true
        })}
        onClose={() => setIsColumnSettingsOpen(false)}
        t={t}
      />

      <DeleteConfirmDialog
        open={isDeleteConfirmOpen}
        title={t('data.confirm.delete.title')}
        message={deleteTarget.type === 'single' ? t('data.confirm.delete.message') : t('data.confirm.delete.message')}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        t={t}
      />

      <CancelUploadDialog
        open={isCancelUploadConfirmOpen}
        title={t('data.confirm.cancelUpload.title')}
        message={t('data.confirm.cancelUpload.message')}
        onCancel={() => { setIsCancelUploadConfirmOpen(false); setCancelUploadTargetId(null); }}
        onConfirm={handleConfirmCancelUpload}
        t={t}
      />

      {/* 数据上传对话框 */}
      <DataUpload
        isOpen={isLocalUploadDialogOpen}
        isReupload={reuploadTargetId !== null}
        previousUploadItems={reuploadTargetId !== null ? datasets.find(d => d.id === reuploadTargetId)?.previousUploadItems : undefined}
        onClose={() => {
          setIsLocalUploadDialogOpen(false);
          setReuploadTargetId(null);
          if (onUploadDialogClose) {
            onUploadDialogClose();
          }
        }}
        onUploadSuccess={(datasetId) => {
          if (reuploadTargetId !== null) {
            // 重新上传：更新对应数据集状态为成功
            setDatasets(prev => prev.map(d => d.id === reuploadTargetId ? { ...d, status: 'success', updateTime: new Date().toISOString() } : d));
            toast.success(t('data.toast.reuploadSuccess'), {
              description: `${t('data.toast.reuploadSuccess.prefix')} ${reuploadTargetId} ${t('data.toast.reuploadSuccess.suffix')}`
            });
            setReuploadTargetId(null);
          } else {
            toast.success(t('data.toast.uploadSuccess'), {
              description: `${t('data.toast.uploadSuccess.prefix')} ${datasetId} ${t('data.toast.uploadSuccess.suffix')}`
            });
          }
          // 刷新数据列表
          handleRefreshData();
        }}
      />

      {/* 数据订阅对话框 */}
      <DataSubscription
        isOpen={isDataSubscriptionOpen}
        onClose={() => setIsDataSubscriptionOpen(false)}
        onSubscriptionSuccess={(subscriptionId) => {
          toast.success(t('data.toast.datasourceCreateSuccess'), {
            description: `${t('data.toast.datasourceCreateSuccess.prefix')} ${subscriptionId} ${t('data.toast.datasourceCreateSuccess.suffix')}`
          });
          // 刷新数据列表
          handleRefreshData();
        }}
      />

      {/* 订阅管理对话框 */}
      <SubscriptionList
        isOpen={isSubscriptionListOpen}
        onClose={() => setIsSubscriptionListOpen(false)}
      />

      {/* 数据预处理对话框 */}
      <DataPreprocessing
        isOpen={isDataPreprocessingOpen}
        onClose={() => {
          setIsDataPreprocessingOpen(false);
          setSelectedDatasetForPreprocessing(null);
        }}
        datasetId={selectedDatasetForPreprocessing?.id?.toString()}
        mode={preprocessingMode}
      />

      {/* 数据详情对话框 */}
      {selectedDatasetForDetail && (
        <DataDetailDialog
          isOpen={isDataDetailDialogOpen}
          onClose={() => {
            setIsDataDetailDialogOpen(false);
            setSelectedDatasetForDetail(null);
          }}
          dataset={{
            id: selectedDatasetForDetail.id.toString(),
            name: selectedDatasetForDetail.title,
            type: selectedDatasetForDetail.type || 'IoT传感器',
            source: selectedDatasetForDetail.source,
            size: selectedDatasetForDetail.size,
            version: selectedDatasetForDetail.version,
            updateTime: selectedDatasetForDetail.updateTime,
            status: selectedDatasetForDetail.status,
            description: selectedDatasetForDetail.description,
            fieldCount: selectedDatasetForDetail.fieldCount || parseInt(selectedDatasetForDetail.columns) || 5,
            sampleCount: selectedDatasetForDetail.sampleCount || parseInt(selectedDatasetForDetail.rows.replace(/,/g, '')) || 125000,
            completeness: selectedDatasetForDetail.completeness
          }}
        />
      )}

      {/* 编辑数据集对话框 */}
      {editingDataset && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('data.dialog.edit.title')}</DialogTitle>
              <DialogDescription>
                {t('data.dialog.edit.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">{t('data.form.name')}</Label>
                  <Input
                    id="edit-title"
                    value={editingDataset.title}
                    onChange={(e) => setEditingDataset({
                      ...editingDataset,
                      title: e.target.value
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">{t('data.form.description')}</Label>
                <Textarea
                  id="edit-description"
                  value={editingDataset.description}
                  onChange={(e) => setEditingDataset({
                    ...editingDataset,
                    description: e.target.value
                  })}
                  rows={3}
                />
              </div>

              {/* 数据标签 */}
              <div className="space-y-2">
                <Label>{t('data.form.tags')}</Label>
                <div className="space-y-3">
                  {/* 标签输入 */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('data.form.inputTagName')}
                      value={editNewTagName}
                      onChange={(e) => setEditNewTagName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addEditTag();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addEditTag}
                      disabled={!editNewTagName.trim()}
                      size="sm"
                    >
                      {t('common.add')}
                    </Button>
                  </div>

                  {/* 已添加的标签 */}
                  {editingDataset.tags && editingDataset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {editingDataset.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1 px-2 py-1"
                          style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }}
                        >
                          {tag.name}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-500"
                            onClick={() => removeEditTag(tag.name)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 设计变更：移除“数据格式”和“版本”字段，以简化编辑表单 */}
              {/* 原实现保留于下方注释，若未来需要恢复可参考：
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-format">{t('data.form.format')}</Label>
                  <Select
                    value={editingDataset.format}
                    onValueChange={(value: string) => setEditingDataset({
                      ...editingDataset,
                      format: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSV">CSV</SelectItem>
                      <SelectItem value="JSON">JSON</SelectItem>
                      <SelectItem value="Excel">Excel</SelectItem>
                      <SelectItem value="Parquet">Parquet</SelectItem>
                      <SelectItem value="XML">XML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-version">{t('data.form.version')}</Label>
                  <Input
                    id="edit-version"
                    value={editingDataset.version}
                    onChange={(e) => setEditingDataset({
                      ...editingDataset,
                      version: e.target.value
                    })}
                  />
                </div>
              </div>
              */}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingDataset(null);
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSaveEdit}>
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 复制数据集对话框 */}
      {isCopyDialogOpen && copyingDataset && (
        <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('data.dialog.copy.title')}</DialogTitle>
              <DialogDescription>
                {t('data.dialog.copy.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="copy-title">{t('data.form.name')}</Label>
                <Input
                  id="copy-title"
                  value={copyingDataset.title}
                  onChange={(e) => setCopyingDataset({
                    ...copyingDataset,
                    title: e.target.value
                  })}
                />
              </div>

              <div>
                <Label htmlFor="copy-description">{t('data.form.description')}</Label>
                <Textarea
                  id="copy-description"
                  value={copyingDataset.description}
                  onChange={(e) => setCopyingDataset({
                    ...copyingDataset,
                    description: e.target.value
                  })}
                  rows={2}
                />
              </div>



              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCopyDialogOpen(false);
                    setCopyingDataset(null);

                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSaveCopy}>
                  {t('data.dialog.copy.createCopy')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 数据预处理任务列表（恢复为列表优先展示） */}
      {activeSubmenu === 'preprocessing' && (
        <div className="space-y-6">
          {/* 标题与创建按钮 */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('data.preprocessing.tasks')}</h2>
            <Button onClick={() => {
              setSelectedDatasetForPreprocessing(null);
              setIsDataPreprocessingOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('data.preprocessing.createTask')}
            </Button>
          </div>

          {/* 筛选栏（移除状态下拉，状态筛选迁移至表头 Popover） */}
          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {taskFilters.dateRange ? `${formatYYYYMMDD(taskFilters.dateRange.from)} ~ ${formatYYYYMMDD(taskFilters.dateRange.to)}` : t('task.filters.createdAtRange')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={taskFilters.dateRange ?? undefined}
                  onSelect={(range: DateRange | undefined) => setTaskFilters(prev => ({ ...prev, dateRange: range ?? null }))}
                  initialFocus
                />
                <div className="p-2 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setTaskFilters(prev => ({ ...prev, dateRange: null }))}>{t('common.clear')}</Button>
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={t('task.filters.search.placeholder')}
                value={taskFilters.datasetQuery}
                onChange={(e) => setTaskFilters(prev => ({ ...prev, datasetQuery: e.target.value }))}
              />
            </div>
          </div>

          {/* 任务列表表格（支持粘性表头与右侧操作列） */}
          <Card>
            <div className="relative overflow-auto max-h-[480px]" style={{ scrollBehavior: 'smooth' }}>
              <Table className="min-w-[1000px]">
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead>{t('data.preprocessing.table.taskId')}</TableHead>
                    <TableHead>{t('data.preprocessing.table.dataset')}</TableHead>
                    <TableHead>{t('data.preprocessing.table.type')}</TableHead>
                    {/* 新增：创建人 */}
                    <TableHead>{t('data.preprocessing.table.creator')}</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <span>{t('data.preprocessing.table.status')}</span>
                        <Popover open={isPreprocessStatusColFilterOpen} onOpenChange={setIsPreprocessStatusColFilterOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0 h-auto">
                              <Filter className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-52 p-3">
                            {/* 单选：全部/运行中/排队中/已完成/失败 */}
                            <RadioGroup
                              value={taskFilters.status}
                              onValueChange={(v: 'all' | 'success' | 'running' | 'pending' | 'failed') =>
                                setTaskFilters(prev => ({ ...prev, status: v }))
                              }
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <RadioGroupItem value="all" id="pp-status-all" />
                                  <Label htmlFor="pp-status-all" className="cursor-pointer">
                                    {t('task.filters.status.all')}
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <RadioGroupItem value="running" id="pp-status-running" />
                                  <Label htmlFor="pp-status-running" className="cursor-pointer">
                                    {t('task.filters.status.running')}
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <RadioGroupItem value="pending" id="pp-status-pending" />
                                  <Label htmlFor="pp-status-pending" className="cursor-pointer">
                                    {t('task.filters.status.pending')}
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <RadioGroupItem value="success" id="pp-status-success" />
                                  <Label htmlFor="pp-status-success" className="cursor-pointer">
                                    {t('task.filters.status.completed')}
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <RadioGroupItem value="failed" id="pp-status-failed" />
                                  <Label htmlFor="pp-status-failed" className="cursor-pointer">
                                    {t('task.filters.status.failed')}
                                  </Label>
                                </div>
                              </div>
                            </RadioGroup>
                            <div className="flex justify-end gap-2 mt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTaskFilters(prev => ({ ...prev, status: 'all' }))}
                                className="text-gray-500"
                              >
                                {t('common.reset')}
                              </Button>
                              <Button variant="default" size="sm" onClick={() => setIsPreprocessStatusColFilterOpen(false)}>
                                {t('common.confirm')}
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableHead>
                    <TableHead>{t('data.preprocessing.table.operation')}</TableHead>
                    <TableHead>{t('data.preprocessing.table.startTime')}</TableHead>
                    <TableHead>{t('data.preprocessing.table.endTime')}</TableHead>
                    <TableHead className="sticky right-0 bg-white z-20 border-l w-[220px] text-right">{t('data.preprocessing.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPreprocessingTasks.map(task => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.id}</TableCell>
                      <TableCell>
                        <Button variant="link" className="p-0 h-auto" onClick={() => handleDatasetClick(task.dataset)}>
                          {task.dataset}
                        </Button>
                      </TableCell>
                      <TableCell>{task.type}</TableCell>
                      {/* 新增：创建人 */}
                      <TableCell>{task.creator}</TableCell>
                      <TableCell>
                        {task.status === 'success' && (
                          <Badge variant="default">{t('task.filters.status.completed')}</Badge>
                        )}
                        {task.status === 'failed' && (
                          <Badge variant="destructive">{t('task.filters.status.failed')}</Badge>
                        )}
                        {task.status === 'running' && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{t('task.filters.status.running')}</Badge>
                            {typeof task.progress === 'number' && (
                              <div className="flex items-center gap-2 w-32">
                                <Progress value={task.progress} className="h-2" />
                                <span className="text-xs text-gray-600">{task.progress}%</span>
                              </div>
                            )}
                          </div>
                        )}
                        {task.status === 'pending' && (
                          <Badge variant="outline">{t('task.filters.status.pending')}</Badge>
                        )}
                        {task.status === 'not_started' && (
                          <Badge variant="outline">{t('task.filters.status.not_started')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {task.operations.map((op, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{op}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{formatYYYYMMDD(task.startTime)}</TableCell>
                      <TableCell>{formatYYYYMMDD(task.completedAt)}</TableCell>
                      <TableCell className="sticky right-0 bg-white z-20 border-l w-[220px]">
                        <div className="flex justify-end gap-2">
                          {task.status === 'running' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleViewTask(task.id)}>{t('task.actions.viewDetail')}</Button>
                              <Button variant="destructive" size="sm" onClick={() => openTaskConfirm('stop', task.id)}>{t('task.actions.stop')}</Button>
                            </>
                          )}
                          {task.status === 'pending' && (
                            <>
                              {/* 排队中：仅允许“取消排队”，取消后进入未开始状态再提供重试/编辑/删除 */}
                              <Button size="sm" onClick={() => openCancelQueueConfirm(task.id)}>{t('task.actions.cancelQueue')}</Button>
                            </>
                          )}
                          {task.status === 'not_started' && (
                            <>
                              {/* 未开始：按需求仅提供“重试、编辑、删除” */}
                              <Button size="sm" onClick={() => openTaskConfirm('retry', task.id)}>{t('task.actions.retry')}</Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditTask(task.id)}>{t('task.actions.edit')}</Button>
                              <Button variant="ghost" size="sm" onClick={() => openTaskConfirm('delete', task.id)}>{t('task.actions.delete')}</Button>
                            </>
                          )}
                          {task.status === 'failed' && (
                            <>
                              {/* 失败：提供查看详情、重试、编辑、删除 */}
                              <Button variant="outline" size="sm" onClick={() => handleViewTask(task.id)}>{t('task.actions.viewDetail')}</Button>
                              <Button size="sm" onClick={() => openTaskConfirm('retry', task.id)}>{t('task.actions.retry')}</Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditTask(task.id)}>{t('task.actions.edit')}</Button>
                              <Button variant="ghost" size="sm" onClick={() => openTaskConfirm('delete', task.id)}>{t('task.actions.delete')}</Button>
                            </>
                          )}
                          {task.status === 'success' && (
                            <>
                              {/* 已完成：提供查看详情、删除 */}
                              <Button variant="outline" size="sm" onClick={() => handleViewTask(task.id)}>{t('task.actions.viewDetail')}</Button>
                              <Button variant="ghost" size="sm" onClick={() => openTaskConfirm('delete', task.id)}>{t('task.actions.delete')}</Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}
      {/* 取消排队确认弹窗 */}
      <Dialog open={cancelQueueDialog.open} onOpenChange={(open) => setCancelQueueDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('task.actions.cancelQueue')}</DialogTitle>
            <DialogDescription>
              {tt('task.dialog.cancelQueue.description', '确认取消排队吗？取消后任务将回到未开始状态，可以重试或编辑。')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCancelQueueDialog({ open: false, taskId: null })}>{t('common.cancel')}</Button>
            <Button onClick={confirmCancelQueue}>{t('common.confirm')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 任务操作二次确认弹窗：停止/重试/删除 */}
      <Dialog open={taskActionConfirm.open} onOpenChange={(open) => setTaskActionConfirm(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {taskActionConfirm.action === 'stop' && t('task.actions.stop')}
              {taskActionConfirm.action === 'retry' && t('task.actions.retry')}
              {taskActionConfirm.action === 'delete' && t('task.actions.delete')}
            </DialogTitle>
            <DialogDescription>
              {taskActionConfirm.action === 'stop' && tt('task.confirm.stop', '确认停止该任务吗？停止后任务将立即中断。')}
              {taskActionConfirm.action === 'retry' && tt('task.confirm.retry', '确认重试该任务吗？将按当前配置重新执行。')}
              {taskActionConfirm.action === 'delete' && tt('task.confirm.delete', '确认删除该任务吗？此操作不可撤销。')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setTaskActionConfirm({ open: false, action: null, taskId: null })}>{t('common.cancel')}</Button>
            <Button
              variant={taskActionConfirm.action === 'stop' || taskActionConfirm.action === 'delete' ? 'destructive' : 'default'}
              onClick={confirmTaskAction}
            >
              {t('common.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
