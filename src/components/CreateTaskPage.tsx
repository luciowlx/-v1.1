import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Splitter, Checkbox } from 'antd';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import {
    Settings,
    Database,
    Target,
    Cpu,
    Eye,
    ChevronDown,
    X,
    BarChart3,
    Calendar as CalendarIcon,
    Plus,
    Search,
    Info,
    CheckCircle2,
    Circle,
    HelpCircle,
    Pencil,
    AlertTriangle // Added for potential warning icons if needed, though using badges now
} from 'lucide-react';

interface ColumnStats {
    missingRate: string;
    uniqueCount: number;
}

const calculateColumnStats = (data: any[], columns: string[]): Record<string, ColumnStats> => {
    const stats: Record<string, ColumnStats> = {};
    const totalRows = data.length;

    columns.forEach(col => {
        let missingCount = 0;
        const uniqueValues = new Set();

        data.forEach(row => {
            const val = row[col];
            // Check for missing values (null, undefined, empty string)
            if (val === null || val === undefined || val === '') {
                missingCount++;
            } else {
                uniqueValues.add(val);
            }
        });

        const missingRate = totalRows > 0 ? ((missingCount / totalRows) * 100).toFixed(1) : '0.0';

        stats[col] = {
            missingRate,
            uniqueCount: uniqueValues.size
        };
    });

    return stats;
};

import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
// import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Calendar as UiCalendar } from "./ui/calendar";
import dayjs from "dayjs";
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
} from './ui/popover';
import {
    Command,
    CommandInput,
    CommandList,
    CommandGroup,
    CommandItem,
    CommandEmpty,
} from './ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './ui/tooltip';
import { TASK_TYPES, ALLOWED_TASK_TYPES, TaskType } from '../utils/taskTypes';
import { useLanguage } from "../i18n/LanguageContext";
import {
    Task,
    TaskStatus,
    TaskPriority,
    FormData,
    DatasetInfo,
    DatasetVersion,
    SelectedDatasetEntry,
    AverageMethod,
    SelectedFileRole
} from '../types/task';
import { mockDatasets, getDatasetsByProjectId } from '../mock/datasets';
import datasetPreviewRows from '../mock/datasetPreview';
import { Slider } from './ui/slider';

// 模拟项目列表（后续可替换为真实项目数据或通过 props 传入）
const mockProjects = [
    { id: 'proj_001', name: '钢铁缺陷预测' },
    { id: 'proj_002', name: '电力能源预测' },
    { id: 'proj_003', name: '工艺时序预测' },
    { id: 'proj_004', name: '设备故障预测' },
];

const MOCK_MODELS = [
    { id: 'limix-16m', name: 'LimiX-16M', type: '高性能大模型', description: '高性能、高精度，适用于复杂场景。' },
    { id: 'limix-2m', name: 'LimiX-2M', type: '轻量高效大模型', description: '推理速度快，适用于对实时性有要求的场景。' },
    { id: 'xgboost', name: 'XGBoost', type: '传统机器学习小模型', description: '经典算法，适用于表格数据。' }
];

const ALLOWED_MODELS = new Set<string>(['LimiX-16M', 'LimiX-2M', 'XGBoost', 'Limix', 'XGBoost']);

interface CreateTaskPageProps {
    onClose: () => void;
    onSuccess: (task: Task) => void;
    isEditMode?: boolean;
    editingTask?: Task | null;
    // 以下为模拟数据，实际项目中应从 API 获取或全局状态获取
    availableDatasets: DatasetInfo[];
    availableModels: any[];
}

export const CreateTaskPage: React.FC<CreateTaskPageProps> = ({
    onClose,
    onSuccess,
    isEditMode = false,
    editingTask = null,
    availableDatasets,
    availableModels
}) => {
    const { t } = useLanguage();
    const [currentStep, setCurrentStep] = useState<number>(1);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDatasetPreview, setShowDatasetPreview] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // 配置区域高度状态（用于拖拽分隔条）
    const [configHeight, setConfigHeight] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    const steps = [
        { number: 1, label: t('createTask.step.basicInfo') },
        { number: 2, label: t('createTask.step.dataAndTarget') },
        { number: 3, label: t('createTask.step.paramConfig') },
    ];

    const initialFormData: FormData = {
        taskName: '',
        taskType: TASK_TYPES.forecasting,
        projectId: '',
        datasetName: '',
        datasetVersion: '',
        selectedDataset: null,
        selectedDatasets: [],
        selectedFilesMetadata: [],
        fileRoles: {},
        searchDatasetTerm: '',
        modelName: 'LimiX-16M',
        models: ['limix-16m'],
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
            covariateFiles: [],
            splitMode: 'percent',
            trainRatio: 80,
            testRatio: 20,
        },
        classificationConfig: {
            trainRatio: 80,
            testRatio: 20,
            targetColumn: '',
            shuffle: false,
            trainFiles: []
        },
        regressionConfig: {
            trainRatio: 80,
            testRatio: 20,
            targetColumn: '',
            shuffle: false,
            trainFiles: []
        },
        outputConfig: {
            forecasting: {
                metrics: {
                    mse: true,
                    rmse: true,
                    mae: true,
                    mape: true,
                    r2: true,
                    relDeviationPercent: 10,
                    absDeviationValue: 10,
                    customMetricCode: ''
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
                    accuracy: true,
                    precision: true,
                    recall: true,
                    f1Score: true,
                    rocAuc: true,
                    averageMethod: 'weighted',
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
                    relDeviationPercent: 10,
                    absDeviationValue: 10,
                    customMetricCode: ''
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
    };

    const [formData, setFormData] = useState<FormData>(initialFormData);

    // 编辑模式初始化
    useEffect(() => {
        if (isEditMode && editingTask) {
            // 极其简化的回填逻辑，实际项目中应完整匹配
            const matchedProjectId = editingTask.projectId || (mockProjects.find(p => p.name === editingTask.projectName)?.id ?? '');
            const matchedDataset = availableDatasets.find(d => d.name === editingTask.datasetName);
            const availableFields = matchedDataset?.previewData && matchedDataset.previewData.length > 0
                ? Object.keys(matchedDataset.previewData[0])
                : [];

            const parsedModels = (() => {
                const name = editingTask.modelName || '';
                if (!name || /未选择模型/.test(name)) return [];
                if (name.includes('等') && name.includes('模型')) {
                    const first = name.split('等')[0].trim();
                    return first ? [first] : [];
                }
                return name.split(/[，,、;]+/).map(s => s.trim()).filter(Boolean);
            })();
            const combinedModels = [...MOCK_MODELS, ...availableModels];
            const nameToId = new Map<string, string>(combinedModels.map(m => [m.name, m.id]));
            const editModels = parsedModels.map(n => nameToId.get(n)).filter((id): id is string => Boolean(id));

            const parsedCfg = (() => {
                try {
                    if (typeof editingTask.config === 'string') return JSON.parse(editingTask.config);
                    if (typeof editingTask.config === 'object' && editingTask.config !== null) return editingTask.config;
                    return null;
                } catch (_) { return null; }
            })();

            setFormData({
                ...initialFormData,
                taskName: editingTask.taskName,
                taskType: editingTask.taskType,
                projectId: matchedProjectId,
                datasetName: matchedDataset?.id || '',
                datasetVersion: editingTask.datasetVersion || '',
                selectedDataset: matchedDataset || null,
                selectedDatasets: editingTask.datasets ?? [],
                models: editModels,
                availableFields,
                priority: editingTask.priority,
                description: editingTask.description || '',
                // 这里应有更复杂的 config 展开逻辑，先略
            });
        }
    }, [isEditMode, editingTask, availableDatasets, availableModels]);

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getTaskTypeLabel = (type: TaskType) => {
        const labels: Record<TaskType, string> = {
            [TASK_TYPES.forecasting]: '时序预测',
            [TASK_TYPES.classification]: '分类',
            [TASK_TYPES.regression]: '回归',
        };
        return labels[type];
    };

    // 表单验证
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.taskName.trim()) errors.taskName = '任务名称不能为空';
        if (!formData.projectId) errors.projectId = '请选择所属项目';
        if (!formData.datasetName && formData.selectedDatasets.length === 0) errors.datasetName = '请至少选择一个数据集';
        if (formData.models.length === 0) errors.models = '请至少选择一个模型';

        if (formData.taskType === TASK_TYPES.forecasting) {
            if (!formData.forecastingConfig.timeColumn) errors.forecastingTimeColumn = '请选择时间列';
            if (!formData.forecastingConfig.targetColumn) errors.forecastingTargetColumn = '请选择预测目标列';
        } else if (formData.taskType === TASK_TYPES.classification) {
            if (!formData.classificationConfig.targetColumn) errors.classificationTargetColumn = '请选择预测目标列';
        } else if (formData.taskType === TASK_TYPES.regression) {
            if (!formData.regressionConfig.targetColumn) errors.regressionTargetColumn = '请选择预测目标列';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateTask = async () => {
        if (!validateForm()) {
            toast.error('请完善表单配置');
            return;
        }
        setIsSubmitting(true);
        try {
            // 模拟提交
            await new Promise(resolve => setTimeout(resolve, 1500));
            const newTask: Task = {
                id: `TASK-${Date.now()}`,
                taskName: formData.taskName,
                taskType: formData.taskType,
                projectId: formData.projectId,
                projectName: mockProjects.find(p => p.id === formData.projectId)?.name,
                datasetName: formData.selectedDataset?.name || formData.selectedDatasets[0]?.name || '',
                datasetVersion: formData.datasetVersion || formData.selectedDatasets[0]?.version || '',
                datasets: formData.selectedDatasets,
                modelName: formData.models.map(id => availableModels.find(m => m.id === id)?.name).join(', '),
                priority: formData.priority,
                status: 'pending',
                createdAt: new Date().toISOString(),
                createdBy: '当前用户',
                description: formData.description,
                config: {
                    forecasting: formData.forecastingConfig,
                    classification: formData.classificationConfig,
                    regression: formData.regressionConfig,
                    output: formData.outputConfig,
                    resource: formData.resourceConfig
                }
            };
            onSuccess(newTask);
            toast.success('任务创建成功');
        } catch (e) {
            toast.error('创建任务失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Step 2 特有逻辑 ---
    const currentProjectDatasets = useMemo(() => {
        if (!formData.projectId) return [];
        return mockDatasets.filter(d => d.projectId === formData.projectId);
    }, [formData.projectId]);

    const filteredDatasets = useMemo(() => {
        if (!formData.searchDatasetTerm) return currentProjectDatasets;
        const term = formData.searchDatasetTerm.toLowerCase();
        return currentProjectDatasets.filter(ds =>
            ds.title.toLowerCase().includes(term) ||
            ds.versions?.some(v => v.files.some(f => f.name.toLowerCase().includes(term)))
        );
    }, [currentProjectDatasets, formData.searchDatasetTerm]);

    const [previewFileName, setPreviewFileName] = useState<string | null>(null);

    const previewData = useMemo(() => {
        if (!previewFileName) return [];
        return datasetPreviewRows[previewFileName] || [];
    }, [previewFileName]);

    const columnStats = useMemo(() => {
        if (!previewData || previewData.length === 0) return {};
        const columns = Object.keys(previewData[0]);
        return calculateColumnStats(previewData, columns);
    }, [previewData]);

    // 拖拽分隔条处理函数
    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';

        const startY = e.clientY;
        const startHeight = configHeight ?? (containerRef.current?.querySelector('.config-panel')?.getBoundingClientRect().height || 400);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isDraggingRef.current) return;
            const deltaY = moveEvent.clientY - startY;
            const newHeight = Math.max(100, Math.min(startHeight + deltaY, (containerRef.current?.clientHeight || 800) - 150));
            setConfigHeight(newHeight);
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [configHeight]);

    // 计算公共字段交集
    const featureFieldsIntersection = useMemo(() => {
        if (formData.selectedFilesMetadata.length === 0) return [];
        let intersection = [...formData.selectedFilesMetadata[0].fields];
        for (let i = 1; i < formData.selectedFilesMetadata.length; i++) {
            const currentFields = new Set(formData.selectedFilesMetadata[i].fields);
            intersection = intersection.filter(f => currentFields.has(f));
        }
        return intersection;
    }, [formData.selectedFilesMetadata]);

    // 计算可选的预测目标列字段
    // 单文件场景：直接使用 featureFieldsIntersection，确保与输入特征列完全一致
    // 多文件场景：只从训练集文件中提取字段交集
    const targetFieldsIntersection = useMemo(() => {
        // 单文件场景：直接使用与输入特征列相同的字段列表
        // 确保预测目标列和输入特征列使用完全相同的数据源
        if (formData.selectedFilesMetadata.length <= 1) {
            return [...featureFieldsIntersection];
        }
        // 多文件场景：只从训练集文件中提取字段交集
        const trainFiles = formData.selectedFilesMetadata.filter(f => formData.fileRoles[f.name] === 'train');
        if (trainFiles.length === 0) return [];
        let intersection = [...trainFiles[0].fields];
        for (let i = 1; i < trainFiles.length; i++) {
            const currentFields = new Set(trainFiles[i].fields);
            intersection = intersection.filter(f => currentFields.has(f));
        }
        return intersection;
    }, [formData.selectedFilesMetadata, formData.fileRoles, featureFieldsIntersection]);

    // 计算可用的输入特征列（排除已选中的预测目标列）
    const availableFeatureFields = useMemo(() => {
        const targetColumn = formData.taskType === TASK_TYPES.classification
            ? formData.classificationConfig.targetColumn
            : formData.taskType === TASK_TYPES.regression
                ? formData.regressionConfig.targetColumn
                : formData.forecastingConfig.targetColumn;
        // 排除已选中的预测目标列
        return featureFieldsIntersection.filter(f => f !== targetColumn);
    }, [featureFieldsIntersection, formData.taskType, formData.classificationConfig.targetColumn, formData.regressionConfig.targetColumn, formData.forecastingConfig.targetColumn]);

    // 计算可用的预测目标列（排除已选中的输入特征列）
    const availableTargetFields = useMemo(() => {
        // 排除已选中的输入特征列
        return targetFieldsIntersection.filter(f => !formData.targetFields.includes(f));
    }, [targetFieldsIntersection, formData.targetFields]);

    // 计算分类任务的目标列唯一值（分类标签）
    // 用于展示分类标签回显和判断是否显示 Average Method
    const classificationLabels = useMemo(() => {
        if (formData.taskType !== TASK_TYPES.classification) return [];
        const targetCol = formData.classificationConfig.targetColumn;
        if (!targetCol) return [];

        // 从所有训练集文件的预览数据中提取目标列的唯一值
        const allValues: Set<string> = new Set();
        const trainFiles = formData.selectedFilesMetadata.filter(f =>
            formData.selectedFilesMetadata.length === 1 || formData.fileRoles[f.name] === 'train'
        );

        trainFiles.forEach(file => {
            const rows = datasetPreviewRows[file.name] || [];
            rows.forEach(row => {
                if (row[targetCol] !== undefined && row[targetCol] !== null) {
                    allValues.add(String(row[targetCol]));
                }
            });
        });

        // 如果没有从预览数据中获取到值，模拟生成一些分类标签
        if (allValues.size === 0) {
            // 根据目标列名称模拟合理的分类标签
            const colLower = targetCol.toLowerCase();
            if (colLower.includes('status') || colLower.includes('状态')) {
                return ['正常', '异常', '待检测'];
            } else if (colLower.includes('defect') || colLower.includes('缺陷')) {
                return ['无缺陷', '轻微缺陷', '中度缺陷', '严重缺陷'];
            } else if (colLower.includes('level') || colLower.includes('等级')) {
                return ['A级', 'B级', 'C级', 'D级', 'E级'];
            } else if (colLower.includes('type') || colLower.includes('类型')) {
                return ['类型A', '类型B', '类型C'];
            } else {
                // 默认返回二分类标签
                return ['类别0', '类别1'];
            }
        }

        return Array.from(allValues).sort();
    }, [formData.taskType, formData.classificationConfig.targetColumn, formData.selectedFilesMetadata, formData.fileRoles]);

    // 自动识别并设置时间列（当文件选择变化时）
    useEffect(() => {
        if (formData.taskType !== TASK_TYPES.forecasting) return;
        if (formData.forecastingConfig.timeColumn) return; // 已设置则不覆盖
        if (featureFieldsIntersection.length === 0) return;

        // 优先匹配含 time/date/datatime 关键字的字段
        const timeKeywords = ['time', 'date', 'datetime', 'datatime', 'timestamp', '时间', '日期'];
        const detected = featureFieldsIntersection.find(f =>
            timeKeywords.some(kw => f.toLowerCase().includes(kw))
        );
        if (detected) {
            setFormData(prev => ({
                ...prev,
                forecastingConfig: { ...prev.forecastingConfig, timeColumn: detected }
            }));
        }
    }, [featureFieldsIntersection, formData.taskType]);

    const handleFileSelect = (dataset: any, version: string, file: any) => {
        setFormData(prev => {
            const isSelected = prev.selectedFilesMetadata.find(f => f.name === file.name);
            let nextMetadata = [...prev.selectedFilesMetadata];
            let nextRoles = { ...prev.fileRoles };

            if (isSelected) {
                const roleToRemove = nextRoles[file.name];
                nextMetadata = nextMetadata.filter(f => f.name !== file.name);
                delete nextRoles[file.name];

                // 自愈逻辑：如果删除的是唯一的测试集文件，且还有剩余文件，则指派第一个为测试集
                if (roleToRemove === 'test' && nextMetadata.length > 0) {
                    nextRoles[nextMetadata[0].name] = 'test';
                }
            } else {
                nextMetadata.push({
                    name: file.name,
                    size: file.size,
                    rows: file.rows,
                    columns: file.columns,
                    fields: file.fields,
                    datasetId: dataset.id,
                    datasetTitle: dataset.title,
                    version: version
                });

                const hasTestFile = Object.values(nextRoles).includes('test');
                nextRoles[file.name] = hasTestFile ? 'train' : 'test';
            }

            return {
                ...prev,
                selectedFilesMetadata: nextMetadata,
                fileRoles: nextRoles,
                availableFields: featureFieldsIntersection // 这里会在下个 render 更新，所以后面需要 useEffect 同步
            };
        });
        if (!previewFileName) setPreviewFileName(file.name);
    };

    const handleRoleChange = (fileName: string, role: 'train' | 'test') => {
        // 强制约束：推理任务必须包含测试集
        if (role === 'train') {
            const testFilesCount = Object.values(formData.fileRoles).filter(r => r === 'test').length;
            if (testFilesCount <= 1 && formData.fileRoles[fileName] === 'test') {
                toast.error('推理任务必须包含至少一个测试集文件');
                return;
            }
        }

        setFormData(prev => {
            let nextRoles = { ...prev.fileRoles };
            if (role === 'test') {
                // 如果设为测试集，先将其他所有设为训练集（保持测试集唯一）
                Object.keys(nextRoles).forEach(k => {
                    nextRoles[k] = 'train';
                });
            }
            nextRoles[fileName] = role;
            return { ...prev, fileRoles: nextRoles };
        });
    };
    const handleSaveEditTask = async () => {
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (editingTask) {
                onSuccess({
                    ...editingTask,
                    taskName: formData.taskName,
                    taskType: formData.taskType,
                    projectId: formData.projectId,
                    priority: formData.priority,
                    description: formData.description,
                });
            }
            toast.success('保存成功');
        } catch (e) {
            toast.error('保存失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    // addSelectedDataset 等旧函数已随 Step 2 重构被 handleFileSelect 取代
    // backfillSelectedDataset 已废弃

    // 模拟图表数据与状态
    const forecastingMockData = useMemo(() => {
        return Array.from({ length: 366 }, (_, i) => ({
            date: dayjs('2024-01-01').add(i, 'day').format('YYYY-MM-DD'),
            value: 50 + Math.sin(i / 10) * 20 + Math.random() * 10
        }));
    }, []);

    const forecastingSplitState = useMemo(() => {
        const total = forecastingMockData.length;
        const splitPercentage = formData.forecastingConfig.splitMode === 'percent'
            ? formData.forecastingConfig.trainRatio
            : (formData.forecastingConfig.splitDate
                ? (dayjs(formData.forecastingConfig.splitDate).diff(dayjs('2024-01-01'), 'day') / total) * 100
                : 80);
        const splitIndex = Math.floor((splitPercentage / 100) * total);
        return { splitPercentage, splitIndex };
    }, [formData.forecastingConfig, forecastingMockData]);

    // 文件联动搜索逻辑
    const [mainFilesOpen, setMainFilesOpen] = useState(false);
    const [covFilesOpen, setCovFilesOpen] = useState(false);
    const [mainFilesQuery, setMainFilesQuery] = useState('');
    const [covFilesQuery, setCovFilesQuery] = useState('');

    const currentDatasetFiles = useMemo(() => {
        const ver = formData.selectedDataset?.versions?.find(v => v.version === formData.datasetVersion);
        return (ver?.files && ver.files.length > 0) ? ver.files : (formData.selectedDataset?.files || []);
    }, [formData.selectedDataset, formData.datasetVersion]);

    const filteredMainOptions = useMemo(() =>
        currentDatasetFiles.filter(f => f.toLowerCase().includes(mainFilesQuery.toLowerCase()) && !formData.forecastingConfig.covariateFiles.includes(f)),
        [currentDatasetFiles, mainFilesQuery, formData.forecastingConfig.covariateFiles]);

    const filteredCovOptions = useMemo(() =>
        currentDatasetFiles.filter(f => f.toLowerCase().includes(covFilesQuery.toLowerCase()) && !formData.forecastingConfig.mainVariableFiles.includes(f)),
        [currentDatasetFiles, covFilesQuery, formData.forecastingConfig.mainVariableFiles]);

    const toggleMainFile = (file: string) => {
        const current = formData.forecastingConfig.mainVariableFiles;
        const next = current.includes(file) ? current.filter(f => f !== file) : [...current, file];
        handleInputChange('forecastingConfig', { ...formData.forecastingConfig, mainVariableFiles: next });
    };
    const toggleCovFile = (file: string) => {
        const current = formData.forecastingConfig.covariateFiles;
        const next = current.includes(file) ? current.filter(f => f !== file) : [...current, file];
        handleInputChange('forecastingConfig', { ...formData.forecastingConfig, covariateFiles: next });
    };

    return (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <div className="h-16 bg-slate-800 text-white flex items-center justify-between px-6 shadow-lg shrink-0">
                <div className="flex items-center space-x-3">
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-slate-700">
                        <X className="h-5 w-5" />
                    </Button>
                    <div className="h-6 w-px bg-slate-600 mx-2" />
                    <Target className="h-5 w-5 text-blue-400" />
                    <h2 className="text-lg font-semibold">{isEditMode ? t('createTask.editTask') : t('createTask.createTask')}</h2>
                </div>
                <div className="flex items-center space-x-3">

                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
                <div className="max-w-6xl mx-auto w-full p-6 space-y-6">
                    {/* Step Navigation */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-12 mx-auto">
                                {steps.map((s) => {
                                    const isActive = currentStep === s.number;
                                    const isCompleted = currentStep > s.number;
                                    return (
                                        <div key={s.number} className="flex items-center">
                                            <div
                                                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${isActive ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-md' :
                                                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                                        'bg-white border-gray-300 text-gray-500'
                                                    }`}
                                            >
                                                {isCompleted ? '✓' : s.number}
                                            </div>
                                            <span className={`ml-3 font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                                                {s.label}
                                            </span>
                                            {s.number < 3 && (
                                                <div className={`ml-12 w-16 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="space-y-6 pb-24">
                        {currentStep === 1 && (
                            <>
                                <Card className="shadow-sm">
                                    <CardHeader className="border-b bg-gray-50/50">
                                        <CardTitle className="text-lg flex items-center space-x-2">
                                            <Settings className="h-5 w-5 text-blue-500" />
                                            <span>基础信息配置</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="taskName" className="font-medium text-gray-700">任务名称 <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="taskName"
                                                    placeholder="请输入任务名称"
                                                    value={formData.taskName}
                                                    onChange={(e) => handleInputChange('taskName', e.target.value)}
                                                    className={formErrors.taskName ? 'border-red-500 ring-red-100' : ''}
                                                />
                                                {formErrors.taskName && <p className="text-xs text-red-500 mt-1">{formErrors.taskName}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="taskType" className="font-medium text-gray-700">任务类型 <span className="text-red-500">*</span></Label>
                                                <Select value={formData.taskType} onValueChange={(v: TaskType) => handleInputChange('taskType', v)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from(ALLOWED_TASK_TYPES).map((tt) => (
                                                            <SelectItem key={tt} value={tt}>{getTaskTypeLabel(tt as TaskType)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="projectId" className="font-medium text-gray-700">所属项目 <span className="text-red-500">*</span></Label>
                                                <Select value={formData.projectId} onValueChange={(v: string) => handleInputChange('projectId', v)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="请选择项目" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {mockProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                {formErrors.projectId && <p className="text-xs text-red-500 mt-1">{formErrors.projectId}</p>}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="font-medium text-gray-700">任务描述</Label>
                                            <Textarea
                                                id="description"
                                                placeholder="请输入任务详细描述..."
                                                rows={4}
                                                value={formData.description}
                                                onChange={(e) => handleInputChange('description', e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm">
                                    <CardHeader className="border-b bg-gray-50/50">
                                        <CardTitle className="text-lg flex items-center space-x-2">
                                            <Cpu className="h-5 w-5 text-purple-500" />
                                            <span>资源与优先级</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <Label className="font-medium text-gray-700 mb-4 block">资源配额</Label>
                                                <div className="space-y-4 pr-4">
                                                    <div className="flex items-center">
                                                        <Label className="w-40 text-gray-600 font-normal"><span className="text-red-500 mr-1">*</span>资源类型</Label>
                                                        <Select value={formData.resourceType} onValueChange={(v: any) => handleInputChange('resourceType', v)}>
                                                            <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 h-10"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="cpu">CPU</SelectItem>
                                                                <SelectItem value="gpu">GPU</SelectItem>
                                                                <SelectItem value="npu">NPU</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Label className="w-40 text-gray-600 font-normal"><span className="text-red-500 mr-1">*</span>{formData.resourceType === 'cpu' ? 'CPU核心数' : formData.resourceType === 'gpu' ? 'GPU核心数' : 'NPU核心数'}</Label>
                                                        <Input
                                                            type="number"
                                                            className="w-full bg-gray-50/50 border-gray-200 h-10"
                                                            value={formData.resourceConfig.cores}
                                                            onChange={(e) => handleInputChange('resourceConfig', { ...formData.resourceConfig, cores: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Label className="w-40 text-gray-600 font-normal"><span className="text-red-500 mr-1">*</span>内存 (GB)</Label>
                                                        <Input
                                                            type="number"
                                                            className="w-full bg-gray-50/50 border-gray-200 h-10"
                                                            value={formData.resourceConfig.memory}
                                                            onChange={(e) => handleInputChange('resourceConfig', { ...formData.resourceConfig, memory: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Label className="w-40 text-gray-600 font-normal"><span className="text-red-500 mr-1">*</span>最大运行时长</Label>
                                                        <Input
                                                            type="number"
                                                            className="w-full bg-gray-50/50 border-gray-200 h-10"
                                                            value={formData.resourceConfig.maxRunTime}
                                                            onChange={(e) => handleInputChange('resourceConfig', { ...formData.resourceConfig, maxRunTime: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <Label className="font-medium text-gray-700"><span className="text-red-500 mr-1">*</span>执行优先级</Label>
                                                <RadioGroup value={formData.priority} onValueChange={(v: any) => handleInputChange('priority', v)} className="flex flex-col space-y-3 mt-2">
                                                    {[
                                                        { id: 'high', label: '高优先级任务', desc: '插队执行，抢占低优先级任务' },
                                                        { id: 'medium', label: '中优先级任务', desc: '按提交时间顺序执行' },
                                                        { id: 'low', label: '低优先级任务', desc: '在资源空闲时执行' }
                                                    ].map(p => (
                                                        <div key={p.id} className="flex items-center space-x-3 p-3 rounded-lg border border-transparent hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleInputChange('priority', p.id)}>
                                                            <RadioGroupItem value={p.id} id={`priority-${p.id}`} className="size-5" />
                                                            <Label htmlFor={`priority-${p.id}`} className="flex flex-1 items-center justify-between cursor-pointer">
                                                                <span className="font-semibold text-gray-900 w-32">{p.label}</span>
                                                                <span className="text-sm text-gray-500 flex-1 ml-4">→ {p.desc}</span>
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm">
                                    <CardHeader className="border-b bg-gray-50/50">
                                        <CardTitle className="text-lg flex items-center space-x-2">
                                            <BarChart3 className="h-5 w-5 text-orange-500" />
                                            <span><span className="text-red-500 mr-1">*</span>模型选择</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {MOCK_MODELS.map(model => (
                                                <div
                                                    key={model.id}
                                                    onClick={() => {
                                                        const next = formData.models.includes(model.id) ? formData.models.filter(id => id !== model.id) : [...formData.models, model.id];
                                                        handleInputChange('models', next);
                                                        // 同步更新 modelName 用于展示
                                                        const nextNames = next.map(id => {
                                                            const m = MOCK_MODELS.find(item => item.id === id);
                                                            return m ? m.name : id;
                                                        }).join(', ');
                                                        handleInputChange('modelName', nextNames);
                                                    }}
                                                    className={`flex items-start space-x-4 p-4 rounded-xl border-2 transition-all cursor-pointer h-full ${formData.models.includes(model.id) ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-white'
                                                        }`}
                                                >
                                                    <Checkbox checked={formData.models.includes(model.id)} className="mt-1" onChange={(e) => {
                                                        const isSelected = e.target.checked;
                                                        let next = [...formData.models];
                                                        if (isSelected) {
                                                            if (formData.modelSelectionMode === 'single') {
                                                                next = [model.id];
                                                            } else {
                                                                next.push(model.id);
                                                            }
                                                        } else {
                                                            next = next.filter(id => id !== model.id);
                                                        }
                                                        handleInputChange('models', next);

                                                        const nextNames = next.map(id => {
                                                            const m = MOCK_MODELS.find(item => item.id === id);
                                                            return m ? m.name : id;
                                                        }).join(', ');
                                                        handleInputChange('modelName', nextNames);
                                                    }} />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900">{model.name}</span>
                                                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit mt-1 border border-blue-100">{model.type}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{model.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {formErrors.models && <p className="text-xs text-red-500 mt-2">{formErrors.models}</p>}
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {currentStep === 2 && (
                            <Splitter className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ minHeight: 'calc(100vh - 220px)' }}>
                                {/* 左侧：数据选择 */}
                                <Splitter.Panel defaultSize="25%" min="15%" max="40%" className="flex flex-col bg-gray-50/30">
                                    <div className="p-4 border-b bg-white shrink-0">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                className="pl-9 bg-gray-50 border-gray-200"
                                                placeholder="搜索数据集或文件..."
                                                value={formData.searchDatasetTerm}
                                                onChange={(e) => handleInputChange('searchDatasetTerm', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <ScrollArea className="flex-1 overflow-y-auto">
                                        <div className="p-2 space-y-1">
                                            {filteredDatasets.map(ds => (
                                                <div key={ds.id} className="space-y-1">
                                                    <div className="px-3 py-2 text-sm font-semibold text-gray-900 flex items-center">
                                                        <Database className="h-4 w-4 mr-2 text-blue-500" />
                                                        {ds.title}
                                                    </div>
                                                    <div className="ml-4 space-y-1">
                                                        {ds.versions?.map(v => (
                                                            <div key={v.version} className="space-y-1">
                                                                <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100/50 rounded-md">
                                                                    版本 {v.version}
                                                                </div>
                                                                <div className="ml-2 space-y-1">
                                                                    {v.files.map(f => {
                                                                        const isSelected = formData.selectedFilesMetadata.some(m => m.name === f.name);
                                                                        return (
                                                                            <div
                                                                                key={f.name}
                                                                                onClick={() => handleFileSelect(ds, v.version, f)}
                                                                                className={`px-3 py-2 text-sm rounded-md cursor-pointer flex items-center justify-between transition-colors ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-600'
                                                                                    }`}
                                                                            >
                                                                                <div className="flex items-center space-x-2 truncate">
                                                                                    {isSelected ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> : <Circle className="h-3.5 w-3.5 flex-shrink-0" />}
                                                                                    <span className="truncate" title={f.name}>{f.name}</span>
                                                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-1">{f.rows}行 × {f.columns}列</span>
                                                                                </div>
                                                                                <div className="flex items-center space-x-1">
                                                                                    <Eye
                                                                                        className={`h-3.5 w-3.5 flex-shrink-0 ml-1 cursor-pointer transition-colors ${previewFileName === f.name ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setPreviewFileName(f.name);
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredDatasets.length === 0 && (
                                                <div className="p-8 text-center text-gray-400 text-sm">
                                                    没有找到匹配的数据资产
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </Splitter.Panel>

                                {/* 右侧：配置与预览 - 使用 flex 布局，配置区域自适应高度 */}
                                <Splitter.Panel className="flex flex-col overflow-hidden">
                                    <div ref={containerRef} className="flex flex-col h-full">
                                        {/* 配置部分（上）- 根据内容自适应高度，不滚动 */}
                                        <div
                                            className="config-panel bg-white overflow-auto"
                                            style={configHeight ? { height: configHeight, flexShrink: 0 } : { flexShrink: 0 }}
                                        >
                                            <div className="p-6 space-y-6">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-gray-900 flex items-center">
                                                            <Settings className="h-4 w-4 mr-2 text-blue-500" />
                                                            数据集切分配置
                                                        </h4>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger><HelpCircle className="h-4 w-4 text-gray-400" /></TooltipTrigger>
                                                                <TooltipContent>指定用于模型训练和评估的数据范围</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>

                                                    {formData.selectedFilesMetadata.length === 1 ? (
                                                        formData.taskType === TASK_TYPES.forecasting ? (
                                                            /* 时序预测专用数据划分配置 */
                                                            <div className="space-y-6">
                                                                {/* 时间列选择 */}
                                                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                                    <div className="flex items-center space-x-4">
                                                                        <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                                                            <span className="text-red-500 mr-1">*</span>时间列
                                                                        </Label>
                                                                        <Select
                                                                            value={formData.forecastingConfig.timeColumn}
                                                                            onValueChange={(v: string) => handleInputChange('forecastingConfig', { ...formData.forecastingConfig, timeColumn: v })}
                                                                        >
                                                                            <SelectTrigger className="flex-1 bg-gray-50/50">
                                                                                <SelectValue placeholder="请选择时间列" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {featureFieldsIntersection.map(f => (
                                                                                    <SelectItem key={f} value={f}>{f}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>

                                                                {/* 数据划分配置 */}
                                                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                                                                    <h5 className="text-sm font-semibold text-gray-800">数据划分配置</h5>

                                                                    {/* 划分模式切换 */}
                                                                    <div className="flex items-center space-x-6">
                                                                        <label
                                                                            className={`flex items-center space-x-2 cursor-pointer ${formData.forecastingConfig.splitMode === 'percent' ? 'text-blue-600' : 'text-gray-500'}`}
                                                                            onClick={() => handleInputChange('forecastingConfig', { ...formData.forecastingConfig, splitMode: 'percent' })}
                                                                        >
                                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.forecastingConfig.splitMode === 'percent' ? 'border-blue-600' : 'border-gray-300'}`}>
                                                                                {formData.forecastingConfig.splitMode === 'percent' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                                                            </div>
                                                                            <span className="text-sm font-medium">百分比划分</span>
                                                                        </label>
                                                                        <label
                                                                            className={`flex items-center space-x-2 cursor-pointer ${formData.forecastingConfig.splitMode === 'date' ? 'text-blue-600' : 'text-gray-500'}`}
                                                                            onClick={() => handleInputChange('forecastingConfig', { ...formData.forecastingConfig, splitMode: 'date' })}
                                                                        >
                                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.forecastingConfig.splitMode === 'date' ? 'border-blue-600' : 'border-gray-300'}`}>
                                                                                {formData.forecastingConfig.splitMode === 'date' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                                                            </div>
                                                                            <span className="text-sm font-medium">特定时间划分</span>
                                                                        </label>
                                                                    </div>

                                                                    {/* 百分比划分模式 - 使用滑块效果 */}
                                                                    {formData.forecastingConfig.splitMode === 'percent' && (
                                                                        <div className="space-y-6">
                                                                            {/* 标签区域 */}
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm text-gray-500 mb-1">训练集比例</span>
                                                                                    <span className="text-3xl font-bold text-blue-600">{formData.forecastingConfig.trainRatio}%</span>
                                                                                </div>
                                                                                <div className="flex flex-col items-end">
                                                                                    <span className="text-sm text-gray-500 mb-1">测试集比例</span>
                                                                                    <span className="text-3xl font-bold text-orange-500">{100 - formData.forecastingConfig.trainRatio}%</span>
                                                                                </div>
                                                                            </div>

                                                                            {/* 双色轨道 Slider */}
                                                                            <div className="relative">
                                                                                <div
                                                                                    className="absolute top-2 left-0 right-0 h-2 rounded-full overflow-hidden"
                                                                                    style={{ pointerEvents: 'none' }}
                                                                                >
                                                                                    <div className="flex h-full">
                                                                                        <div
                                                                                            className="bg-blue-500 transition-all duration-200"
                                                                                            style={{ width: `${formData.forecastingConfig.trainRatio}%` }}
                                                                                        />
                                                                                        <div
                                                                                            className="bg-orange-400 transition-all duration-200"
                                                                                            style={{ width: `${100 - formData.forecastingConfig.trainRatio}%` }}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <Slider
                                                                                    value={[formData.forecastingConfig.trainRatio]}
                                                                                    min={10}
                                                                                    max={90}
                                                                                    step={1}
                                                                                    onValueChange={(val: number[]) => {
                                                                                        const ratio = Math.max(10, Math.min(val[0], 90));
                                                                                        handleInputChange('forecastingConfig', {
                                                                                            ...formData.forecastingConfig,
                                                                                            trainRatio: ratio,
                                                                                            testRatio: 100 - ratio
                                                                                        });
                                                                                    }}
                                                                                    className="relative z-10"
                                                                                    style={{
                                                                                        '--slider-track-bg': 'transparent',
                                                                                        '--slider-range-bg': 'transparent',
                                                                                        '--slider-thumb-size': '20px',
                                                                                    } as React.CSSProperties}
                                                                                />
                                                                            </div>

                                                                            {/* 提示文字 */}
                                                                            <p className="text-xs text-center text-gray-400 italic">拖动滑块调整切分比例</p>
                                                                            <p className="text-[10px] text-red-500/80 italic font-medium">提示：训练集和测试集比例均不得低于 10%</p>
                                                                        </div>
                                                                    )}

                                                                    {/* 特定时间划分模式 - 使用滑块效果 */}
                                                                    {formData.forecastingConfig.splitMode === 'date' && (
                                                                        <div className="space-y-6">
                                                                            {/* 标签区域 - 显示时间范围 */}
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm text-gray-500 mb-1">训练集 (Training)</span>
                                                                                    <span className="text-lg font-bold text-blue-600">
                                                                                        {forecastingMockData[0]?.date ? dayjs(forecastingMockData[0].date).format('MM-DD') : '起点'}
                                                                                        {' ~ '}
                                                                                        {formData.forecastingConfig.splitDate
                                                                                            ? dayjs(formData.forecastingConfig.splitDate).format('MM-DD')
                                                                                            : dayjs(forecastingMockData[Math.floor(forecastingMockData.length * 0.8)]?.date).format('MM-DD')
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex flex-col items-center">
                                                                                    <span className="text-sm text-gray-500 mb-1">分割时间</span>
                                                                                    <span className="text-lg font-bold text-gray-700">
                                                                                        {formData.forecastingConfig.splitDate
                                                                                            ? dayjs(formData.forecastingConfig.splitDate).format('YYYY-MM-DD')
                                                                                            : dayjs(forecastingMockData[Math.floor(forecastingMockData.length * 0.8)]?.date).format('YYYY-MM-DD')
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex flex-col items-end">
                                                                                    <span className="text-sm text-gray-500 mb-1">测试集 (Test)</span>
                                                                                    <span className="text-lg font-bold text-orange-500">
                                                                                        {formData.forecastingConfig.splitDate
                                                                                            ? dayjs(formData.forecastingConfig.splitDate).format('MM-DD')
                                                                                            : dayjs(forecastingMockData[Math.floor(forecastingMockData.length * 0.8)]?.date).format('MM-DD')
                                                                                        }
                                                                                        {' ~ '}
                                                                                        {forecastingMockData[forecastingMockData.length - 1]?.date ? dayjs(forecastingMockData[forecastingMockData.length - 1].date).format('MM-DD') : '终点'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            {/* 双色轨道 Slider - 时间范围 */}
                                                                            <div className="relative">
                                                                                <div
                                                                                    className="absolute top-2 left-0 right-0 h-2 rounded-full overflow-hidden"
                                                                                    style={{ pointerEvents: 'none' }}
                                                                                >
                                                                                    <div className="flex h-full">
                                                                                        <div
                                                                                            className="bg-blue-500 transition-all duration-200"
                                                                                            style={{
                                                                                                width: formData.forecastingConfig.splitDate
                                                                                                    ? `${(dayjs(formData.forecastingConfig.splitDate).diff(dayjs(forecastingMockData[0]?.date), 'day') / forecastingMockData.length) * 100}%`
                                                                                                    : '80%'
                                                                                            }}
                                                                                        />
                                                                                        <div
                                                                                            className="bg-orange-400 transition-all duration-200"
                                                                                            style={{
                                                                                                width: formData.forecastingConfig.splitDate
                                                                                                    ? `${100 - (dayjs(formData.forecastingConfig.splitDate).diff(dayjs(forecastingMockData[0]?.date), 'day') / forecastingMockData.length) * 100}%`
                                                                                                    : '20%'
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <Slider
                                                                                    value={[
                                                                                        formData.forecastingConfig.splitDate
                                                                                            ? Math.min(forecastingMockData.length - 1, Math.max(0, dayjs(formData.forecastingConfig.splitDate).diff(dayjs(forecastingMockData[0]?.date), 'day')))
                                                                                            : Math.floor(forecastingMockData.length * 0.8)
                                                                                    ]}
                                                                                    min={Math.floor(forecastingMockData.length * 0.1)}
                                                                                    max={Math.floor(forecastingMockData.length * 0.9)}
                                                                                    step={1}
                                                                                    onValueChange={(val: number[]) => {
                                                                                        const dayIndex = val[0];
                                                                                        const newDate = dayjs(forecastingMockData[0]?.date).add(dayIndex, 'day').toDate();
                                                                                        handleInputChange('forecastingConfig', {
                                                                                            ...formData.forecastingConfig,
                                                                                            splitDate: newDate
                                                                                        });
                                                                                    }}
                                                                                    className="relative z-10"
                                                                                    style={{
                                                                                        '--slider-track-bg': 'transparent',
                                                                                        '--slider-range-bg': 'transparent',
                                                                                        '--slider-thumb-size': '20px',
                                                                                    } as React.CSSProperties}
                                                                                />
                                                                            </div>

                                                                            {/* 时间刻度 */}
                                                                            <div className="flex items-center justify-between text-[10px] text-gray-400">
                                                                                <span>{forecastingMockData[0]?.date ? dayjs(forecastingMockData[0].date).format('YYYY-MM-DD') : ''}</span>
                                                                                <span>{forecastingMockData[forecastingMockData.length - 1]?.date ? dayjs(forecastingMockData[forecastingMockData.length - 1].date).format('YYYY-MM-DD') : ''}</span>
                                                                            </div>

                                                                            {/* 提示文字 */}
                                                                            <p className="text-xs text-center text-gray-400 italic">拖动滑块选择分割时间点</p>
                                                                            <p className="text-[10px] text-red-500/80 italic font-medium">提示：训练集和测试集比例均不得低于 10%</p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                            </div>
                                                        ) : (
                                                            /* 分类/回归任务的百分比划分（原有逻辑） */
                                                            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col space-y-6">
                                                                {/* 标签区域 */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm text-gray-500 mb-1">训练集比例</span>
                                                                        <span className="text-3xl font-bold text-blue-600">{formData.classificationConfig.trainRatio}%</span>
                                                                    </div>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-sm text-gray-500 mb-1">测试集比例</span>
                                                                        <span className="text-3xl font-bold text-orange-500">{100 - formData.classificationConfig.trainRatio}%</span>
                                                                    </div>
                                                                </div>

                                                                {/* 双色轨道 Slider */}
                                                                <div className="relative">
                                                                    <div
                                                                        className="absolute top-2 left-0 right-0 h-2 rounded-full overflow-hidden"
                                                                        style={{ pointerEvents: 'none' }}
                                                                    >
                                                                        <div className="flex h-full">
                                                                            <div
                                                                                className="bg-blue-500 transition-all duration-200"
                                                                                style={{ width: `${formData.classificationConfig.trainRatio}%` }}
                                                                            />
                                                                            <div
                                                                                className="bg-orange-400 transition-all duration-200"
                                                                                style={{ width: `${100 - formData.classificationConfig.trainRatio}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <Slider
                                                                        value={[formData.classificationConfig.trainRatio]}
                                                                        min={10}
                                                                        max={90}
                                                                        step={1}
                                                                        onValueChange={(val: number[]) => {
                                                                            const ratio = Math.max(10, Math.min(val[0], 90));
                                                                            handleInputChange('classificationConfig', {
                                                                                ...formData.classificationConfig,
                                                                                trainRatio: ratio,
                                                                                testRatio: 100 - ratio
                                                                            });
                                                                        }}
                                                                        className="relative z-10"
                                                                        style={{
                                                                            '--slider-track-bg': 'transparent',
                                                                            '--slider-range-bg': 'transparent',
                                                                            '--slider-thumb-size': '20px',
                                                                        } as React.CSSProperties}
                                                                    />
                                                                </div>

                                                                {/* 提示文字 */}
                                                                <p className="text-xs text-center text-gray-400 italic mt-2">拖动滑块调整切分比例</p>
                                                                <p className="text-[10px] text-red-500/80 mt-1 italic font-medium">提示：训练集和测试集比例均不得低于 10%</p>

                                                                {/* 洗牌选项 */}
                                                                <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-100">
                                                                    <Checkbox
                                                                        checked={formData.taskType === TASK_TYPES.classification
                                                                            ? formData.classificationConfig.shuffle
                                                                            : formData.regressionConfig.shuffle}
                                                                        onChange={(e) => {
                                                                            const checked = e.target.checked;
                                                                            if (formData.taskType === TASK_TYPES.classification) {
                                                                                handleInputChange('classificationConfig', { ...formData.classificationConfig, shuffle: checked });
                                                                            } else {
                                                                                handleInputChange('regressionConfig', { ...formData.regressionConfig, shuffle: checked });
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <Label className="text-sm font-medium text-gray-700 cursor-pointer">洗牌 (Shuffle)</Label>
                                                                        <span className="text-xs text-gray-400">在划分数据集前随机打乱样本顺序</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    ) : formData.selectedFilesMetadata.length > 1 ? (
                                                        <>
                                                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                                                <Table>
                                                                    <TableHeader className="bg-gray-50/80">
                                                                        <TableRow>
                                                                            <TableHead className="w-1/2">文件名</TableHead>
                                                                            <TableHead className="w-32">用途分配</TableHead>
                                                                            <TableHead className="text-right">所属数据集</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {formData.selectedFilesMetadata.map(f => (
                                                                            <TableRow key={f.name}>
                                                                                <TableCell className="font-medium text-sm">{f.name}</TableCell>
                                                                                <TableCell>
                                                                                    <Select
                                                                                        value={formData.fileRoles[f.name]}
                                                                                        onValueChange={(val: 'train' | 'test') => handleRoleChange(f.name, val)}
                                                                                    >
                                                                                        <SelectTrigger className="h-8 text-xs w-28">
                                                                                            <SelectValue />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="train">训练集</SelectItem>
                                                                                            <SelectItem value="test">测试集</SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                </TableCell>
                                                                                <TableCell className="text-xs text-gray-500 text-right">
                                                                                    {f.datasetTitle}({f.version})
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>

                                                            {/* 时序预测任务的时间列选择（在文件表格之后显示） */}
                                                            {formData.taskType === TASK_TYPES.forecasting && (
                                                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                                    <div className="flex items-center space-x-4">
                                                                        <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                                                            <span className="text-red-500 mr-1">*</span>时间列
                                                                        </Label>
                                                                        <Select
                                                                            value={formData.forecastingConfig.timeColumn}
                                                                            onValueChange={(v: string) => handleInputChange('forecastingConfig', { ...formData.forecastingConfig, timeColumn: v })}
                                                                        >
                                                                            <SelectTrigger className="flex-1 bg-gray-50/50">
                                                                                <SelectValue placeholder="请选择时间列" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {featureFieldsIntersection.map(f => (
                                                                                    <SelectItem key={f} value={f}>{f}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* 洗牌选项（多文件场景，仅分类/回归任务） */}
                                                            {(formData.taskType === TASK_TYPES.classification || formData.taskType === TASK_TYPES.regression) && (
                                                                <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-100">
                                                                    <Checkbox
                                                                        checked={formData.taskType === TASK_TYPES.classification
                                                                            ? formData.classificationConfig.shuffle
                                                                            : formData.regressionConfig.shuffle}
                                                                        onChange={(e) => {
                                                                            const checked = e.target.checked;
                                                                            if (formData.taskType === TASK_TYPES.classification) {
                                                                                handleInputChange('classificationConfig', { ...formData.classificationConfig, shuffle: checked });
                                                                            } else {
                                                                                handleInputChange('regressionConfig', { ...formData.regressionConfig, shuffle: checked });
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <Label className="text-sm font-medium text-gray-700 cursor-pointer">洗牌 (Shuffle)</Label>
                                                                        <span className="text-xs text-gray-400">在划分数据集前随机打乱样本顺序</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="py-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                                                            <Plus className="h-8 w-8 mb-2 opacity-20" />
                                                            <p className="text-sm">请从左侧资产树中选择数据集文件</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-6 pt-4 border-t mt-auto">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center space-x-2">
                                                            <Label className="font-bold text-gray-900"><span className="text-red-500 mr-1">*</span>输入特征列 (Features)</Label>
                                                            <Badge variant="outline" className="font-normal text-[10px] bg-gray-50">{availableFeatureFields.length} 字段</Badge>
                                                        </div>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" className="w-full justify-between font-normal bg-gray-50/50 h-auto min-h-[40px] py-2">
                                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                                        {formData.targetFields.length > 0 ? (
                                                                            formData.targetFields.map(f => <Badge key={f} className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-[10px] px-1.5 h-5">{f}</Badge>)
                                                                        ) : <span className="text-gray-400 text-xs">点击选择特征列 (共计 {availableFeatureFields.length} 个可用)</span>}
                                                                    </div>
                                                                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80 p-0" align="start">
                                                                <Command>
                                                                    <CommandInput placeholder="搜索字段..." className="h-9" />
                                                                    <CommandEmpty>未找到字段</CommandEmpty>
                                                                    <div className="flex items-center space-x-2 px-2 py-1.5 border-b">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-[10px] h-7 px-2"
                                                                            onClick={() => handleInputChange('targetFields', availableFeatureFields)}
                                                                        >全选</Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-[10px] h-7 px-2"
                                                                            onClick={() => handleInputChange('targetFields', [])}
                                                                        >清空</Button>
                                                                    </div>
                                                                    <CommandList className="max-h-64">
                                                                        <CommandGroup>
                                                                            {availableFeatureFields.map(f => (
                                                                                <CommandItem
                                                                                    key={f}
                                                                                    onSelect={() => {
                                                                                        const next = formData.targetFields.includes(f)
                                                                                            ? formData.targetFields.filter(i => i !== f)
                                                                                            : [...formData.targetFields, f];
                                                                                        handleInputChange('targetFields', next);
                                                                                    }}
                                                                                    className="text-xs"
                                                                                >
                                                                                    <CheckCircle2 className={`mr-2 h-3.5 w-3.5 ${formData.targetFields.includes(f) ? "text-blue-500 opacity-100" : "opacity-0"}`} />
                                                                                    {f}
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center space-x-2">
                                                            <Label className="font-bold text-gray-900"><span className="text-red-500 mr-1">*</span>预测目标列 (Target)</Label>
                                                            <Badge variant="outline" className="font-normal text-[10px] bg-orange-50 text-orange-600 border-orange-100">必选 1 个</Badge>
                                                        </div>
                                                        <Select
                                                            value={(formData.taskType === TASK_TYPES.classification ? formData.classificationConfig.targetColumn : formData.regressionConfig.targetColumn) || ''}
                                                            onValueChange={(val: string) => {
                                                                const key = formData.taskType === TASK_TYPES.classification ? 'classificationConfig' : 'regressionConfig';
                                                                handleInputChange(key as 'classificationConfig' | 'regressionConfig', { ...formData[key as 'classificationConfig' | 'regressionConfig'], targetColumn: val });
                                                            }}
                                                        >
                                                            <SelectTrigger className="bg-gray-50/50 h-10 border border-gray-200">
                                                                <SelectValue placeholder="选择预测目标列" />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-80">
                                                                <Command>
                                                                    <CommandInput placeholder="搜索目标列..." className="h-9" />
                                                                    <CommandList className="max-h-64">
                                                                        <CommandGroup>
                                                                            {availableTargetFields.map(f => (
                                                                                <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 可拖拽分隔条 */}
                                        <div
                                            className="h-2 bg-gray-100 hover:bg-blue-100 cursor-row-resize flex items-center justify-center border-y border-gray-200 transition-colors group"
                                            onMouseDown={handleResizeMouseDown}
                                        >
                                            <div className="w-10 h-1 bg-gray-300 group-hover:bg-blue-400 rounded-full transition-colors" />
                                        </div>

                                        {/* 预览部分（下）- 占用剩余空间 */}
                                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
                                            <div className="px-6 py-3 border-b bg-white flex items-center justify-between shrink-0">
                                                <div className="flex items-center space-x-2 min-w-0">
                                                    <Eye className="h-4 w-4 text-blue-500 shrink-0" />
                                                    <span className="font-semibold text-gray-900">数据详情预览</span>
                                                    {previewFileName && (
                                                        <Badge variant="secondary" className="font-normal bg-blue-50 text-blue-600 border-blue-100 truncate max-w-[150px]">
                                                            {previewFileName}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {previewFileName && (
                                                    <div className="text-xs text-gray-500 flex items-center space-x-4 shrink-0">
                                                        <span>行数：{formData.selectedFilesMetadata.find(f => f.name === previewFileName)?.rows || '-'}</span>
                                                        <span>列数：{formData.selectedFilesMetadata.find(f => f.name === previewFileName)?.columns || '-'}</span>
                                                        <span>大小：{formData.selectedFilesMetadata.find(f => f.name === previewFileName)?.size || '-'}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-hidden bg-gray-50/50">
                                                {previewFileName ? (
                                                    <div className="h-full p-4">
                                                        <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }} className="border rounded-lg bg-white">
                                                            <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                                                                <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f9fafb' }}>
                                                                    <tr className="border-b">
                                                                        {previewData[0] && Object.keys(previewData[0]).map(key => (
                                                                            <th key={key} style={{ position: 'sticky', top: 0, backgroundColor: '#f9fafb' }} className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                                                                <div className="flex flex-col space-y-1.5 min-w-[120px]">
                                                                                    <div className="flex items-center space-x-2">
                                                                                        <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-100 px-1.5 py-0 text-[10px] h-5 font-normal hover:bg-orange-100">
                                                                                            Unique: {columnStats[key]?.uniqueCount ?? '-'}
                                                                                        </Badge>
                                                                                        <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-100 px-1.5 py-0 text-[10px] h-5 font-normal hover:bg-red-100">
                                                                                            Missing: {columnStats[key]?.missingRate ?? '0.0'}%
                                                                                        </Badge>
                                                                                    </div>
                                                                                    <span className="text-gray-900 font-semibold">{key}</span>
                                                                                </div>
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {previewData.map((row, idx) => (
                                                                        <tr key={idx} className="border-b hover:bg-gray-50/50">
                                                                            {Object.values(row).map((val: unknown, vIdx) => (
                                                                                <td key={vIdx} className="px-4 py-2 border-r last:border-r-0 max-w-[200px] truncate">
                                                                                    {String(val)}
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                                                        <Database className="h-12 w-12 text-gray-200" />
                                                        <p>请在大资产树中点击预览图标查看数据</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Splitter.Panel>
                            </Splitter>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6">
                                {formData.taskType === TASK_TYPES.forecasting && (
                                    <Card className="shadow-sm border-gray-200 overflow-hidden">
                                        <CardHeader className="border-b bg-gray-50/30 px-6 py-4">
                                            <CardTitle className="text-base font-semibold flex items-center space-x-2 text-gray-800">
                                                <Settings className="h-5 w-5 text-blue-500" />
                                                <span>核心任务参数</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                                                        上下文长度 (训练集长度) <span className="text-red-500 ml-1">*</span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger><Info className="h-3 w-3 ml-1 text-gray-400" /></TooltipTrigger>
                                                                <TooltipContent>模型每次用于计算的历史样本数量</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        value={formData.forecastingConfig.contextLength}
                                                        onChange={(e) => handleInputChange('forecastingConfig', { ...formData.forecastingConfig, contextLength: parseInt(e.target.value) || 0 })}
                                                        className="h-10 transition-all border-gray-200 focus:border-blue-400"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                                                        预测长度 (测试集长度) <span className="text-red-500 ml-1">*</span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger><Info className="h-3 w-3 ml-1 text-gray-400" /></TooltipTrigger>
                                                                <TooltipContent>模型每次向前预测的步数</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        value={formData.forecastingConfig.forecastLength}
                                                        onChange={(e) => handleInputChange('forecastingConfig', { ...formData.forecastingConfig, forecastLength: parseInt(e.target.value) || 0 })}
                                                        className="h-10 transition-all border-gray-200 focus:border-blue-400"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                                                        预测步长 <span className="text-red-500 ml-1">*</span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger><Info className="h-3 w-3 ml-1 text-gray-400" /></TooltipTrigger>
                                                                <TooltipContent>每次预测后窗口向前移动的间隔</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        value={formData.forecastingConfig.stepLength}
                                                        onChange={(e) => handleInputChange('forecastingConfig', { ...formData.forecastingConfig, stepLength: parseInt(e.target.value) || 1 })}
                                                        className="h-10 transition-all border-gray-200 focus:border-blue-400"
                                                    />
                                                </div>

                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* 输出与报告配置 */}
                                <Card className="shadow-sm border-gray-200 overflow-hidden">
                                    <CardHeader className="border-b bg-gray-50/30 px-6 py-4">
                                        <CardTitle className="text-base font-semibold flex items-center justify-between text-gray-800">
                                            <div className="flex items-center space-x-2">
                                                <BarChart3 className="h-5 w-5 text-indigo-500" />
                                                <span>输出与报告配置</span>
                                            </div>
                                            <div className="text-[10px] font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded">任务类型: {getTaskTypeLabel(formData.taskType)}</div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-gray-100">
                                            {/* 指标报表指标 */}
                                            <div className="p-6 space-y-6">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                                    <h4 className="text-sm font-bold text-gray-900">指标报表 (Metrics Report)</h4>
                                                </div>

                                                {(formData.taskType === TASK_TYPES.forecasting || formData.taskType === TASK_TYPES.regression) && (
                                                    <div className="space-y-8">
                                                        {/* 基本指标复选框 */}
                                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                            {[
                                                                { id: 'mse', label: 'MSE (均方误差)' },
                                                                { id: 'rmse', label: 'RMSE (均方根误差)' },
                                                                { id: 'mae', label: 'MAE (平均绝对误差)' },
                                                                { id: 'mape', label: 'MAPE (平均绝对百分比误差)' },
                                                                { id: 'r2', label: 'R² (决定系数)' }
                                                            ].map(metric => {
                                                                const typeKey = formData.taskType === TASK_TYPES.forecasting ? 'forecasting' : 'regression';
                                                                return (
                                                                    <div key={metric.id} className="flex items-center space-x-2 group cursor-pointer">
                                                                        <Checkbox
                                                                            id={metric.id}
                                                                            checked={!!(formData.outputConfig[typeKey].metrics as any)[metric.id]}
                                                                            onChange={(e) => {
                                                                                const checked = e.target.checked;
                                                                                const newMetrics = { ...formData.outputConfig[typeKey].metrics, [metric.id]: checked };
                                                                                handleInputChange('outputConfig', {
                                                                                    ...formData.outputConfig,
                                                                                    [typeKey]: { ...formData.outputConfig[typeKey], metrics: newMetrics }
                                                                                });
                                                                            }}
                                                                        />
                                                                        <Label htmlFor={metric.id} className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors cursor-pointer">{metric.label}</Label>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* 偏差调节器 */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                                                                        正负相对偏差范围
                                                                        <Badge variant="secondary" className="ml-2 bg-white text-[10px] px-1 shadow-sm font-normal text-gray-400">非必填</Badge>
                                                                    </Label>
                                                                    <span className="text-xs font-mono text-gray-400">默认 ±10%</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        value={formData.outputConfig[formData.taskType === TASK_TYPES.forecasting ? 'forecasting' : 'regression'].metrics.relDeviationPercent}
                                                                        onChange={(e) => {
                                                                            const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                                                            const typeKey = formData.taskType === TASK_TYPES.forecasting ? 'forecasting' : 'regression';
                                                                            handleInputChange('outputConfig', {
                                                                                ...formData.outputConfig,
                                                                                [typeKey]: {
                                                                                    ...formData.outputConfig[typeKey],
                                                                                    metrics: { ...formData.outputConfig[typeKey].metrics, relDeviationPercent: v }
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="h-10 transition-all border-gray-200 focus:border-blue-400 bg-white"
                                                                    />
                                                                    <span className="text-gray-400 text-sm font-medium">%</span>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                                                                        正负绝对偏差范围
                                                                        <Badge variant="secondary" className="ml-2 bg-white text-[10px] px-1 shadow-sm font-normal text-gray-400">非必填</Badge>
                                                                    </Label>
                                                                    <span className="text-xs font-mono text-gray-400">默认 ±10</span>
                                                                </div>
                                                                <Input
                                                                    type="number"
                                                                    value={formData.outputConfig[formData.taskType === TASK_TYPES.forecasting ? 'forecasting' : 'regression'].metrics.absDeviationValue}
                                                                    onChange={(e) => {
                                                                        const v = Math.max(0, parseInt(e.target.value) || 0);
                                                                        const typeKey = formData.taskType === TASK_TYPES.forecasting ? 'forecasting' : 'regression';
                                                                        handleInputChange('outputConfig', {
                                                                            ...formData.outputConfig,
                                                                            [typeKey]: {
                                                                                ...formData.outputConfig[typeKey],
                                                                                metrics: { ...formData.outputConfig[typeKey].metrics, absDeviationValue: v }
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="h-10 transition-all border-gray-200 focus:border-blue-400 bg-white"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* 自定义指标 */}
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-xs font-semibold text-gray-700">自定义评价指标 (Custom Metrics)</Label>
                                                                <Badge className="bg-blue-100 text-blue-700 border-none font-normal text-[10px]">支持 Python 语法</Badge>
                                                            </div>
                                                            <Textarea
                                                                placeholder="示例: def custom_metric(y_true, y_pred): \n    return np.mean(np.abs(y_true - y_pred))"
                                                                className="font-mono text-xs h-24 bg-gray-900 text-green-400 border-gray-800 placeholder:text-gray-600 resize-none focus:ring-1 focus:ring-blue-500"
                                                                value={formData.outputConfig[formData.taskType === TASK_TYPES.forecasting ? 'forecasting' : 'regression'].metrics.customMetricCode}
                                                                onChange={(e) => {
                                                                    const typeKey = formData.taskType === TASK_TYPES.forecasting ? 'forecasting' : 'regression';
                                                                    handleInputChange('outputConfig', {
                                                                        ...formData.outputConfig,
                                                                        [typeKey]: {
                                                                            ...formData.outputConfig[typeKey],
                                                                            metrics: { ...formData.outputConfig[typeKey].metrics, customMetricCode: e.target.value }
                                                                        }
                                                                    });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {formData.taskType === TASK_TYPES.classification && (
                                                    <div className="space-y-6">
                                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                            {[
                                                                { id: 'accuracy', label: 'Accuracy (准确率)' },
                                                                { id: 'precision', label: 'Precision (精确率)' },
                                                                { id: 'recall', label: 'Recall (召回率)' },
                                                                { id: 'f1Score', label: 'F1-score' },
                                                                { id: 'rocAuc', label: 'ROC-AUC' }
                                                            ].map(item => (
                                                                <div key={item.id} className="flex items-center space-x-2 group cursor-pointer">
                                                                    <Checkbox
                                                                        id={item.id}
                                                                        checked={!!(formData.outputConfig.classification.metrics as any)[item.id]}
                                                                        onChange={(e) => {
                                                                            const checked = e.target.checked;
                                                                            const newMetrics = { ...formData.outputConfig.classification.metrics, [item.id]: checked };
                                                                            handleInputChange('outputConfig', {
                                                                                ...formData.outputConfig,
                                                                                classification: { ...formData.outputConfig.classification, metrics: newMetrics }
                                                                            });
                                                                        }}
                                                                    />
                                                                    <Label htmlFor={item.id} className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors cursor-pointer">{item.label}</Label>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* 分类标签回显展示 */}
                                                        {formData.classificationConfig.targetColumn && classificationLabels.length > 0 && (
                                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-xs font-semibold text-gray-700">
                                                                        目标列分类标签 ({classificationLabels.length} 个类别)
                                                                    </span>
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${classificationLabels.length === 2
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-blue-100 text-blue-700'
                                                                        }`}>
                                                                        {classificationLabels.length === 2 ? '二分类' : '多分类'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {classificationLabels.length <= 8 ? (
                                                                        // 标签数量较少时，全部展示
                                                                        classificationLabels.map((label, idx) => (
                                                                            <span
                                                                                key={idx}
                                                                                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-gray-200 text-gray-700 shadow-sm"
                                                                            >
                                                                                <span className={`w-2 h-2 rounded-full mr-1.5 ${idx % 6 === 0 ? 'bg-blue-500' :
                                                                                    idx % 6 === 1 ? 'bg-green-500' :
                                                                                        idx % 6 === 2 ? 'bg-yellow-500' :
                                                                                            idx % 6 === 3 ? 'bg-red-500' :
                                                                                                idx % 6 === 4 ? 'bg-purple-500' : 'bg-pink-500'
                                                                                    }`} />
                                                                                {label}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        // 标签数量较多时，只展示前6个 + 省略提示
                                                                        <>
                                                                            {classificationLabels.slice(0, 6).map((label, idx) => (
                                                                                <span
                                                                                    key={idx}
                                                                                    className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-gray-200 text-gray-700 shadow-sm"
                                                                                >
                                                                                    <span className={`w-2 h-2 rounded-full mr-1.5 ${idx % 6 === 0 ? 'bg-blue-500' :
                                                                                        idx % 6 === 1 ? 'bg-green-500' :
                                                                                            idx % 6 === 2 ? 'bg-yellow-500' :
                                                                                                idx % 6 === 3 ? 'bg-red-500' :
                                                                                                    idx % 6 === 4 ? 'bg-purple-500' : 'bg-pink-500'
                                                                                        }`} />
                                                                                    {label}
                                                                                </span>
                                                                            ))}
                                                                            <span className="inline-flex items-center px-2.5 py-1 text-xs text-gray-500 italic">
                                                                                ... 等 {classificationLabels.length} 个分类
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Average Method - 仅多分类时显示 */}
                                                        {classificationLabels.length > 2 ? (
                                                            <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg border border-gray-100 max-w-md">
                                                                <Label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Average Method:</Label>
                                                                <Select
                                                                    value={formData.outputConfig.classification.metrics.averageMethod}
                                                                    onValueChange={(val: AverageMethod) => {
                                                                        handleInputChange('outputConfig', {
                                                                            ...formData.outputConfig,
                                                                            classification: {
                                                                                ...formData.outputConfig.classification,
                                                                                metrics: { ...formData.outputConfig.classification.metrics, averageMethod: val }
                                                                            }
                                                                        });
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-8 text-xs bg-white">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="micro">micro</SelectItem>
                                                                        <SelectItem value="macro">macro</SelectItem>
                                                                        <SelectItem value="weighted">weighted</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ) : classificationLabels.length === 2 ? (
                                                            <div className="flex items-center space-x-2 bg-green-50 p-3 rounded-lg border border-green-100 max-w-md">
                                                                <span className="text-green-600 text-xs">✓</span>
                                                                <span className="text-xs text-green-700">二分类任务无需配置 Average Method</span>
                                                            </div>
                                                        ) : null}

                                                        <div className="space-y-3">
                                                            <Label className="text-xs font-semibold text-gray-700">自定义评价指标 (Custom Metrics)</Label>
                                                            <Textarea
                                                                placeholder="支持 Python 语法规则实现自定义指标评分逻辑..."
                                                                className="font-mono text-xs h-24 bg-gray-900 text-green-400 border-gray-800 placeholder:text-gray-600 resize-none"
                                                                value={formData.outputConfig.classification.metrics.customMetricCode}
                                                                onChange={(e) => {
                                                                    handleInputChange('outputConfig', {
                                                                        ...formData.outputConfig,
                                                                        classification: {
                                                                            ...formData.outputConfig.classification,
                                                                            metrics: { ...formData.outputConfig.classification.metrics, customMetricCode: e.target.value }
                                                                        }
                                                                    });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 可视化配置 */}
                                            <div className="p-6 space-y-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                                    <h4 className="text-sm font-bold text-gray-900">可视化图形 (Visualizations)</h4>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-1">
                                                    {(formData.taskType === TASK_TYPES.forecasting || formData.taskType === TASK_TYPES.regression) && (
                                                        <>
                                                            {[
                                                                { id: 'lineChart', label: '折线图 (时序/预测曲线)' },
                                                                { id: 'residualPlot', label: '残差图 (Residual Plot)' },
                                                                { id: 'predVsTrueScatter', label: '预测值 vs 真实值散点图' },
                                                                { id: 'errorHistogram', label: '误差分布直方图' }
                                                            ].map(vis => {
                                                                const typeKey = formData.taskType === TASK_TYPES.forecasting ? 'forecasting' : 'regression';
                                                                return (
                                                                    <div key={vis.id} className="flex flex-col space-y-2 p-3 border rounded-lg border-gray-100 hover:border-indigo-200 transition-colors bg-white shadow-sm">
                                                                        <div className="flex items-center justify-between">
                                                                            <Label htmlFor={vis.id} className="text-xs font-medium text-gray-700 cursor-pointer">{vis.label}</Label>
                                                                            <Checkbox
                                                                                id={vis.id}
                                                                                checked={!!(formData.outputConfig[typeKey].visualizations as any)[vis.id]}
                                                                                onChange={(e) => {
                                                                                    const checked = e.target.checked;
                                                                                    const newVis = { ...formData.outputConfig[typeKey].visualizations, [vis.id]: checked };
                                                                                    handleInputChange('outputConfig', {
                                                                                        ...formData.outputConfig,
                                                                                        [typeKey]: { ...formData.outputConfig[typeKey], visualizations: newVis }
                                                                                    });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="h-16 w-full bg-gray-50 rounded flex items-center justify-center">
                                                                            {/* 这里可以放一个小图标或模拟图形 */}
                                                                            <Eye className="h-5 w-5 text-gray-300" />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </>
                                                    )}

                                                    {formData.taskType === TASK_TYPES.classification && (
                                                        <>
                                                            {[
                                                                { id: 'rocCurve', label: 'ROC 曲线' },
                                                                { id: 'prCurve', label: 'Precision-Recall 曲线' },
                                                                { id: 'confusionMatrix', label: '混淆矩阵 (热力图)' }
                                                            ].map(vis => (
                                                                <div key={vis.id} className="flex flex-col space-y-2 p-3 border rounded-lg border-gray-100 hover:border-indigo-200 transition-colors bg-white shadow-sm">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label htmlFor={vis.id} className="text-xs font-medium text-gray-700 cursor-pointer">{vis.label}</Label>
                                                                        <Checkbox
                                                                            id={vis.id}
                                                                            checked={!!(formData.outputConfig.classification.visualizations as any)[vis.id]}
                                                                            onChange={(e) => {
                                                                                const checked = e.target.checked;
                                                                                const newVis = { ...formData.outputConfig.classification.visualizations, [vis.id]: checked };
                                                                                handleInputChange('outputConfig', {
                                                                                    ...formData.outputConfig,
                                                                                    classification: { ...formData.outputConfig.classification, visualizations: newVis }
                                                                                });
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="h-16 w-full bg-gray-50 rounded flex items-center justify-center">
                                                                        <Eye className="h-5 w-5 text-gray-300" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div >

            {/* Footer Actions */}
            < div className="h-20 bg-white border-t flex items-center justify-center px-10 shadow-lg shrink-0" >
                <div className="max-w-5xl w-full flex justify-between">
                    <Button variant="outline" size="lg" onClick={onClose} className="w-48">取消</Button>
                    <div className="flex space-x-4">
                        {currentStep > 1 && (
                            <Button variant="outline" size="lg" onClick={() => setCurrentStep(prev => prev - 1)} className="w-48">上一步</Button>
                        )}
                        {currentStep < 3 ? (
                            <Button size="lg" onClick={() => setCurrentStep(prev => prev + 1)} className="w-48 bg-blue-600 hover:bg-blue-700">下一步</Button>
                        ) : (
                            <Button size="lg" onClick={isEditMode ? handleSaveEditTask : handleCreateTask} disabled={isSubmitting} className="w-48 bg-blue-600 hover:bg-blue-700 text-black">
                                {isSubmitting ? '正在处理...' : isEditMode ? '保存修改' : '确认创建任务'}
                            </Button>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
};
