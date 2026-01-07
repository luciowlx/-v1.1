import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, Filter, MoreHorizontal, Clock, Activity, CheckCircle, XCircle,
    AlertCircle, AlertTriangle, ChevronRight, ChevronLeft, ArrowRight, Database, BarChart3,
    Flame, Download, Copy, Trash2, RefreshCcw, Target, FileText, LayoutGrid,
    Settings2, Eye, MoreVertical, History, X, Play, Calendar, List, Pencil,
    Table as TableIcon, Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import dayjs from 'dayjs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '../ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../ui/select';
import { message, Modal, Popconfirm, Tooltip, Empty, DatePicker, Slider, InputNumber, Checkbox, Space, Select as AntSelect, Table, Badge as AntBadge, Tag, Card as AntCard } from 'antd';
import { useLanguage } from "../../i18n/LanguageContext";
import { mockCITasks, CausalInsightTask, getDecisionTaskSchema, getCausalResultData } from '../../mock/causal';
import {
    ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Cell, Line, Scatter
} from 'recharts';

const Card = ShadcnCard;
const AntdCard = AntCard;


/**
 * 因果洞察主组件
 * 管理列表、创建、详情三个视图的状态切换
 */
export default function CausalInsight() {
    const { t } = useLanguage();
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    const [tasks, setTasks] = useState<CausalInsightTask[]>(mockCITasks);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // 复制任务弹窗状态
    const [copyModalVisible, setCopyModalVisible] = useState(false);
    const [taskToCopy, setTaskToCopy] = useState<CausalInsightTask | null>(null);
    const [copyNewName, setCopyNewName] = useState('');

    // 详情页任务数据
    const currentTask = useMemo(() =>
        tasks.find(t => t.id === selectedTaskId),
        [tasks, selectedTaskId]
    );

    const filteredTasks = tasks.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateTask = () => {
        setEditingTask(null); // 新建模式
        setView('create');
    };

    const handleViewDetail = (taskId: string) => {
        setSelectedTaskId(taskId);
        setView('detail');
    };

    // 新增：编辑任务状态
    const [editingTask, setEditingTask] = useState<CausalInsightTask | null>(null);

    // 编辑草稿任务
    const handleEditTask = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            setEditingTask(task);
            setView('create');
        }
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedTaskId(null);
        setEditingTask(null);
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        message.success('任务已删除');
    };

    const handleCopyTask = (taskId: string) => {
        const source = tasks.find(t => t.id === taskId);
        if (source) {
            setTaskToCopy(source);
            setCopyNewName(`${source.name} - 副本`);
            setCopyModalVisible(true);
        }
    };

    const handleConfirmCopy = () => {
        if (!taskToCopy) return;

        const newTask: CausalInsightTask = {
            ...taskToCopy,
            id: `CI-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            name: copyNewName || `${taskToCopy.name} - 副本`,
            status: 'DRAFT',
            progress: 0,
            createdAt: new Date().toLocaleString(),
            updatedAt: new Date().toLocaleString()
        };
        setTasks([newTask, ...tasks]);
        setCopyModalVisible(false);
        setTaskToCopy(null);
        message.success('任务副本已创建');
    };

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-full w-full max-w-full overflow-hidden">
            {view === 'list' && (
                <CITaskList
                    tasks={filteredTasks}
                    onSearch={setSearchQuery}
                    onCreate={handleCreateTask}
                    onViewDetail={handleViewDetail}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onCopy={handleCopyTask}
                />
            )}
            {view === 'create' && (
                <CreateCITask
                    onBack={handleBackToList}
                    existingTasks={tasks}
                    editingTask={editingTask}
                    onSubmit={(newTask: CausalInsightTask) => {
                        if (editingTask) {
                            // 编辑模式：更新现有任务
                            setTasks(prev => prev.map(t => t.id === newTask.id ? newTask : t));
                            message.success('任务已更新');
                        } else {
                            // 新建模式：添加新任务
                            setTasks([newTask, ...tasks]);
                            message.success('任务已提交运行');
                        }
                        setView('list');
                        setEditingTask(null);
                    }}
                />
            )}
            {view === 'detail' && currentTask && (
                <CITaskDetail
                    task={currentTask}
                    onBack={handleBackToList}
                />
            )}

            {/* 复制任务重命名弹窗 */}
            <Modal
                title="复制配置"
                open={copyModalVisible}
                onOk={handleConfirmCopy}
                onCancel={() => setCopyModalVisible(false)}
                okText="确认复制"
                cancelText="取消"
                destroyOnClose
            >
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-500">原任务名称</Label>
                        <div className="px-3 py-2 bg-slate-50 rounded-md text-slate-600 border border-slate-100 italic">
                            {taskToCopy?.name}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">新任务名称</Label>
                        <Input
                            value={copyNewName}
                            onChange={(e) => setCopyNewName(e.target.value)}
                            placeholder="请输入新任务名称"
                        />
                    </div>
                    <p className="text-xs text-slate-400">
                        提示：复制后的任务初始状态将设为“草稿”。
                    </p>
                </div>
            </Modal>
        </div>
    );
}

/**
 * 任务列表视图
 */
function CITaskList({ tasks, onSearch, onCreate, onViewDetail, onEdit, onDelete, onCopy }: any) {
    // 筛选状态
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // 获取来源任务列表（去重）
    const sourceOptions = useMemo(() => {
        const sources = [...new Set(tasks.map((t: any) => t.sourceDecisionTaskName))] as string[];
        return sources.filter(Boolean);
    }, [tasks]);

    // 状态选项
    const statusOptions = [
        { value: 'all', label: '全部状态' },
        { value: 'DRAFT', label: '草稿' },
        { value: 'QUEUED', label: '排队中' },
        { value: 'RUNNING', label: '运行中' },
        { value: 'SUCCEEDED', label: '已完成' },
        { value: 'FAILED', label: '失败' },
    ];

    // 过滤后的任务列表
    const filteredTasks = useMemo(() => {
        return tasks.filter((t: any) => {
            const matchSource = sourceFilter === 'all' || t.sourceDecisionTaskName === sourceFilter;
            const matchStatus = statusFilter === 'all' || t.status === statusFilter;
            return matchSource && matchStatus;
        });
    }, [tasks, sourceFilter, statusFilter]);

    const columns: any[] = [
        {
            title: '任务名称',
            dataIndex: 'name',
            key: 'name',
            width: 260,
            render: (text: string, record: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors" onClick={() => onViewDetail(record.id)}>
                        {text}
                    </span>
                    <span className="text-xs text-slate-400 font-mono mt-0.5">{record.id}</span>
                </div>
            )
        },
        {
            title: '来源任务',
            dataIndex: 'sourceDecisionTaskName',
            key: 'source',
            width: 180,
            render: (text: string) => <span className="text-slate-600 text-sm">{text}</span>
        },
        {
            title: 'Y 字段',
            dataIndex: ['ySpec', 'field'],
            key: 'yField',
            width: 120,
            render: (text: string) => (
                <Tag>{text}</Tag>
            )
        },
        {
            title: '样本命中',
            key: 'sample',
            width: 200,
            render: (_: any, record: any) => (
                <div className="flex flex-col w-full max-w-[180px]">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-slate-700">{record.sampleHit.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">/ {record.sampleTotal.toLocaleString()}</span>
                    </div>
                    <Progress value={(record.sampleHit / record.sampleTotal) * 100} className="h-1.5 bg-slate-100" />
                </div>
            )
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            filters: statusOptions.filter(o => o.value !== 'all').map(o => ({ text: o.label, value: o.value })),
            onFilter: (value: any, record: any) => record.status === value,
            render: (status: string) => {
                let color = 'default';
                let label = status;
                if (status === 'RUNNING') { color = 'processing'; label = '运行中'; }
                else if (status === 'SUCCEEDED') { color = 'success'; label = '已完成'; }
                else if (status === 'FAILED') { color = 'error'; label = '失败'; }
                else if (status === 'DRAFT') { color = 'default'; label = '草稿'; }
                else if (status === 'QUEUED') { color = 'warning'; label = '排队中'; }
                return <AntBadge status={color as any} text={label} />;
            }
        },
        {
            title: '创建人',
            dataIndex: 'createdBy',
            key: 'creator',
            width: 120,
            render: (text: string) => <span className="text-slate-600 text-sm font-medium">{text}</span>
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            render: (text: string) => <span className="text-slate-500 text-sm">{text}</span>
        },
        {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 180,
            render: (_: any, task: any) => (
                <Space size="small">
                    {['DRAFT', 'FAILED'].includes(task.status) && (
                        <Tooltip title="编辑">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(task.id)} className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                                <Pencil className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                    )}
                    <Tooltip title="查看详情">
                        <Button variant="ghost" size="icon" onClick={() => onViewDetail(task.id)} className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                            <Eye className="w-4 h-4" />
                        </Button>
                    </Tooltip>
                    <Tooltip title="复制配置">
                        <Button variant="ghost" size="icon" onClick={() => onCopy(task.id)} className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                            <Copy className="w-4 h-4" />
                        </Button>
                    </Tooltip>
                    <Popconfirm title="确定要删除该任务吗？" onConfirm={() => onDelete(task.id)} okText="确认" cancelText="取消">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">因果洞察</h1>
                    <p className="text-slate-500 mt-1">基于任务切片深度分析特征对目标变量的因果影响</p>
                </div>
                <Button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md border-none h-10 px-4">
                    <Plus className="w-4 h-4 mr-2" /> 新建因果洞察任务
                </Button>
            </div>

            <ShadcnCard className="border-none shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="搜索任务名称或ID..."
                                className="pl-10 h-10 border-slate-200 focus:ring-blue-500 w-64"
                                onChange={(e) => onSearch(e.target.value)}
                            />
                        </div>
                        <AntSelect
                            placeholder="任务来源"
                            style={{ width: 160 }}
                            value={sourceFilter}
                            onChange={setSourceFilter}
                            options={[
                                { value: 'all', label: '全部来源' },
                                ...sourceOptions.map((s: string) => ({ value: s, label: s }))
                            ]}
                        />
                        <AntSelect
                            placeholder="任务状态"
                            style={{ width: 140 }}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={statusOptions}
                        />
                    </div>
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredTasks}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1300 }}
                    className="rounded-b-lg"
                    rowClassName="hover:bg-slate-50 cursor-default"
                />
            </ShadcnCard>
        </div>
    );
}

/**
 * 创建 CI 任务向导（4 步）
 */
function CreateCITask({ onBack, onSubmit, existingTasks = [], editingTask = null }: {
    onBack: () => void;
    onSubmit: (task: CausalInsightTask) => void;
    existingTasks?: CausalInsightTask[];
    editingTask?: CausalInsightTask | null;
}) {
    /**
     * 生成唯一任务名称（检测冲突并添加序号）
     * @param baseName 基础名称，如 "因果洞察_销售数据预测"
     * @returns 唯一名称，如 "因果洞察_销售数据预测" 或 "因果洞察_销售数据预测 (2)"
     */
    const generateUniqueName = (baseName: string): string => {
        const existingNames = existingTasks.map(t => t.name);
        if (!existingNames.includes(baseName)) {
            return baseName;
        }
        // 查找已有的同名任务数量
        let counter = 2;
        while (existingNames.includes(`${baseName} (${counter})`)) {
            counter++;
        }
        return `${baseName} (${counter})`;
    };

    // 编辑模式时，使用 editingTask 的数据初始化表单
    const [formData, setFormData] = useState({
        name: editingTask?.name || '',
        sourceTaskId: editingTask?.sourceDecisionTaskId || '',
        xFields: editingTask?.xSpec?.fields || [] as string[],
        yField: editingTask?.ySpec?.field || '',
        yRange: { min: 20, max: 80 } as any,
        filters: editingTask?.filters?.and || [] as any[]
    });

    const [schema, setSchema] = useState<any>(null); // 恢复 schema 状态
    const [currentYSchema, setCurrentYSchema] = useState<any>(null);
    // 监听 Y 字段变化，更新 currentYSchema
    useEffect(() => {
        if (schema && formData.yField) {
            setCurrentYSchema(schema.fields.find((f: any) => f.name === formData.yField));
        } else {
            setCurrentYSchema(null);
        }
    }, [schema, formData.yField]);

    const [estimating, setEstimating] = useState(false);
    const [estimateResult, setEstimateResult] = useState({ total: 10000, hit: 312 });
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [editingFilter, setEditingFilter] = useState<{ id?: number, field: string, op: string, value: any }>({ field: '', op: 'BETWEEN', value: null });

    // 模拟字段元数据
    useEffect(() => {
        if (formData.sourceTaskId) {
            const s = getDecisionTaskSchema(formData.sourceTaskId);
            setSchema(s);
        }
    }, [formData.sourceTaskId]);

    // 模拟估算命中样本数 (防抖处理)
    useEffect(() => {
        if (formData.sourceTaskId && formData.yField) {
            setEstimating(true);
            const timer = setTimeout(() => {
                setEstimateResult({ total: 10000, hit: Math.floor(Math.random() * 5000) + 500 });
                setEstimating(false);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [formData.filters, formData.xFields, formData.yField, formData.yRange, formData.sourceTaskId]);

    const openEditModal = (filter: any) => {
        setEditingFilter({ ...filter });
        setIsFilterModalOpen(true);
    };

    const handleSaveFilter = () => {
        if (editingFilter.field && editingFilter.value) {
            if (editingFilter.id) {
                // 编辑模式：更新
                setFormData({
                    ...formData,
                    filters: formData.filters.map((f: any) => f.id === editingFilter.id ? editingFilter : f)
                });
            } else {
                // 新增模式：添加
                setFormData({
                    ...formData,
                    filters: [...formData.filters, { ...editingFilter, id: Date.now() }]
                });
            }
            setIsFilterModalOpen(false);
            setEditingFilter({ field: '', op: 'BETWEEN', value: '' });
        }
    };

    const removeFilter = (id: number) => {
        setFormData({
            ...formData,
            filters: formData.filters.filter((f: any) => f.id !== id)
        });
    };

    const handleSubmit = (status: 'DRAFT' | 'QUEUED') => {
        const newTask: CausalInsightTask = {
            // 编辑模式保留原 ID，新建模式生成新 ID
            id: editingTask?.id || `CI-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            name: formData.name || '新建因果洞察任务',
            description: editingTask?.description || 'Created via Wizard',
            projectId: editingTask?.projectId || 'proj_default',
            sourceDecisionTaskId: formData.sourceTaskId,
            sourceDecisionTaskName: schema?.taskId || editingTask?.sourceDecisionTaskName || 'Source Task',
            datasetSnapshotId: editingTask?.datasetSnapshotId || 'snap_default',
            xSpec: {
                mode: 'explicit',
                fields: formData.xFields
            },
            ySpec: {
                field: formData.yField,
                filterType: currentYSchema?.filterType || 'Numeric'
            },
            filters: { and: formData.filters },
            status: status,
            progress: editingTask?.progress || 0,
            sampleTotal: estimateResult.total,
            sampleHit: estimateResult.hit,
            createdAt: editingTask?.createdAt || new Date().toLocaleString(),
            createdBy: editingTask?.createdBy || 'Current User',
            updatedAt: new Date().toLocaleString()
        };
        onSubmit(newTask);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            {/* 顶部标题栏 */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                    <Button variant="ghost" onClick={onBack} className="text-slate-500 hover:text-slate-900 group">
                        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> 返回列表
                    </Button>
                    <div className="h-4 w-px bg-slate-200 mx-2" />
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        {editingTask ? '编辑因果洞察任务' : '创建因果洞察任务'}
                    </h2>
                </div>
            </div>

            {/* 主内容双栏布局 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '2rem', alignItems: 'start' }}>

                {/* 左栏：基础配置 (占比 2/5) */}
                <div style={{ gridColumn: 'span 2 / span 2' }} className="space-y-6">
                    <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                                <Database className="w-4 h-4 mr-2 text-blue-500" /> 基础配置
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 p-6">
                            {/* 来源任务 */}
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-700 ml-1">决策推理任务</Label>
                                <AntSelect
                                    showSearch
                                    optionFilterProp="label"
                                    className="w-full"
                                    style={{ width: '100%', height: '48px' }}
                                    placeholder="请选择已完成的决策推理任务"
                                    value={formData.sourceTaskId || undefined}
                                    onChange={(val, option: any) => {
                                        // 自动填充任务名称：因果洞察_[任务名] (带冲突检测)
                                        const taskLabel = option?.label?.split('|')[1]?.trim()?.split('(')[0]?.trim() || '';
                                        const baseName = taskLabel ? `因果洞察_${taskLabel}` : '';
                                        const autoName = baseName ? generateUniqueName(baseName) : formData.name;
                                        setFormData({ ...formData, sourceTaskId: val, name: autoName });
                                    }}
                                    options={[
                                        { label: '任务 A | 销售数据预测 (8760 样本)', value: 'TASK-001' },
                                        { label: '任务 B | 客户流失预测 (5200 样本)', value: 'TASK-004' },
                                        { label: '任务 C | 电价波动预测 (12000 样本)', value: 'TASK-008' }
                                    ]}
                                />
                            </div>

                            {/* 任务名称 */}
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-700 ml-1">任务名称</Label>
                                <Input
                                    placeholder="请输入任务名称"
                                    className="h-12 border-slate-200"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Y 分析目标 */}
                            <div className="space-y-6 pt-2 border-t border-slate-50">
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-700 ml-1">Y (分析目标)</Label>
                                    <AntSelect
                                        showSearch
                                        optionFilterProp="label"
                                        className="w-full"
                                        style={{ width: '100%', height: '48px' }}
                                        placeholder="选择预警/分析字段"
                                        value={formData.yField || undefined}
                                        onChange={(val) => setFormData({ ...formData, yField: val })}
                                        options={schema?.fields.map((f: any) => ({
                                            label: `${f.displayName} (${f.dtype})`,
                                            value: f.name
                                        }))}
                                    />
                                </div>

                                {formData.yField && currentYSchema && (
                                    <div className="p-5 bg-blue-50/30 rounded-2xl border border-blue-100/50 space-y-5 animate-in slide-in-from-top-2">
                                        <div className="flex items-center space-x-2 text-blue-600">
                                            <Target className="w-4 h-4" />
                                            <span className="text-xs font-black uppercase tracking-widest">Y 范围 ({currentYSchema.displayName})</span>
                                        </div>

                                        {/* 数值类型：Slider + InputNumber */}
                                        {currentYSchema.filterType === 'Numeric' && (
                                            <div className="space-y-6">
                                                <div className="px-2">
                                                    <Slider
                                                        range
                                                        defaultValue={[20, 80]}
                                                        value={[formData.yRange.min || 0, formData.yRange.max || 100]}
                                                        onChange={(val) => setFormData({ ...formData, yRange: { min: val[0], max: val[1] } })}
                                                        className="causal-slider"
                                                    />
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex-1 space-y-2">
                                                        <InputNumber
                                                            className="w-full h-10 rounded-xl border-white shadow-sm font-bold"
                                                            value={formData.yRange.min}
                                                            onChange={val => setFormData({ ...formData, yRange: { ...formData.yRange, min: val } })}
                                                        />
                                                    </div>
                                                    <div className="w-4 h-1 bg-blue-200 rounded-full" />
                                                    <div className="flex-1 space-y-2">
                                                        <InputNumber
                                                            className="w-full h-10 rounded-xl border-white shadow-sm font-bold"
                                                            value={formData.yRange.max}
                                                            onChange={val => setFormData({ ...formData, yRange: { ...formData.yRange, max: val } })}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">{currentYSchema.dtype === 'FLOAT64' ? 'Value' : 'Count'}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* 时间类型：DatePicker.RangePicker */}
                                        {currentYSchema.filterType === 'Temporal' && (
                                            <div className="space-y-3">
                                                <DatePicker.RangePicker
                                                    className="w-full h-12 rounded-xl border-white shadow-sm font-medium"
                                                    onChange={(dates, dateStrings) => {
                                                        setFormData({ ...formData, yRange: { start: dateStrings[0], end: dateStrings[1] } });
                                                    }}
                                                />
                                                <p className="text-[10px] text-slate-400 italic">选择分析的时间范围区间</p>
                                            </div>
                                        )}

                                        {/* 分类类型：Checkbox Group */}
                                        {currentYSchema.filterType === 'Categorical' && (
                                            <div className="bg-white/50 p-4 rounded-xl border border-white/40 max-h-[160px] overflow-y-auto custom-scrollbar">
                                                <Checkbox.Group
                                                    className="flex flex-col space-y-2"
                                                    options={currentYSchema.statistics?.options?.map((opt: string) => ({ label: opt, value: opt })) || [
                                                        { label: '类别 A', value: 'A' },
                                                        { label: '类别 B', value: 'B' }
                                                    ]}
                                                    onChange={(checkedValues) => {
                                                        setFormData({ ...formData, yRange: { categories: checkedValues } });
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* 数据范围提示 - 显式展示 Mock 中的统计信息 */}
                                        {currentYSchema.statistics && (
                                            <div className="flex items-start space-x-2 pt-2 px-1 text-[10px] text-blue-500/80">
                                                <Database className="w-3 h-3 mt-0.5 shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="font-bold">测试集数据范围:</span>
                                                    <span className="font-mono mt-0.5">
                                                        {currentYSchema.filterType === 'Numeric' && (
                                                            <>
                                                                Min: {currentYSchema.statistics.min} ~ Max: {currentYSchema.statistics.max}
                                                                {currentYSchema.statistics.avg && <span className="ml-2 opacity-70">(Avg: {currentYSchema.statistics.avg})</span>}
                                                            </>
                                                        )}
                                                        {currentYSchema.filterType === 'Temporal' && (
                                                            <>{currentYSchema.statistics.start} ~ {currentYSchema.statistics.end}</>
                                                        )}
                                                        {currentYSchema.filterType === 'Categorical' && (
                                                            <>共 {currentYSchema.statistics.options?.length || 0} 个类别</>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 右栏：样本过滤 (占比 3/5) */}
                <div style={{ gridColumn: 'span 3 / span 3' }} className="space-y-6">
                    <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden min-h-[600px]">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                                <Filter className="w-4 h-4 mr-2 text-blue-500" /> X / 样本条件过滤
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="border border-slate-50 rounded-2xl overflow-hidden shadow-sm">
                                <Table
                                    columns={[
                                        {
                                            title: '字段',
                                            dataIndex: 'field',
                                            key: 'field',
                                            width: '35%',
                                            render: (t: any, r: any) => <span className="font-bold text-slate-700 pl-2">{schema?.fields.find((f: any) => f.name === r.field)?.displayName || r.field}</span>
                                        },
                                        {
                                            title: '操作符',
                                            dataIndex: 'op',
                                            key: 'op',
                                            width: '25%',
                                            render: (t: string) => <span className="font-mono text-[11px] font-black text-slate-400">{t}</span>
                                        },
                                        {
                                            title: '值',
                                            dataIndex: 'value',
                                            key: 'value',
                                            width: '30%',
                                            render: (v: any) => <span className="text-sm font-medium text-slate-600">{Array.isArray(v) ? v.join(' ~ ') : v}</span>
                                        },
                                        {
                                            title: '操作',
                                            key: 'action',
                                            width: '10%',
                                            align: 'right',
                                            render: (_: any, r: any) => (
                                                <div className="flex justify-end space-x-1 pr-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditModal(r)} className="h-8 w-8 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => removeFilter(r.id)} className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            )
                                        }
                                    ]}
                                    dataSource={formData.filters}
                                    rowKey="id"
                                    pagination={false}
                                    size="middle"
                                    locale={{ emptyText: <Empty description="暂无过滤条件" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                                />
                                <Button
                                    onClick={() => setIsFilterModalOpen(true)}
                                    variant="ghost"
                                    className="w-full h-14 text-blue-500 font-black text-xs uppercase tracking-[0.2em] border-t border-slate-50 hover:bg-blue-50/30 rounded-none flex items-center justify-center space-x-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>添加过滤条件</span>
                                </Button>
                            </div>

                            {/* 估算统计与提交操作区域 */}
                            <div className="pt-8 space-y-6">
                                <section className="p-6 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden group min-h-[120px]">

                                    <div className="relative z-10 flex items-center justify-between h-full px-2">
                                        {/* 左侧：覆盖分析 */}
                                        <div className="flex flex-col justify-between h-16">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-slate-900 text-base font-bold tracking-tight">样本覆盖分析</span>
                                            </div>
                                            {estimating ? (
                                                <div className="flex items-center space-x-2">
                                                    <RefreshCcw className="w-5 h-5 animate-spin text-blue-500" />
                                                    <span className="text-base font-bold text-slate-400 italic tracking-widest">Est...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-baseline space-x-2">
                                                    <span className="text-3xl font-medium text-slate-900 tracking-tight tabular-nums">{estimateResult.hit.toLocaleString()}</span>
                                                    <span className="text-slate-400 text-lg font-medium tracking-tight">/ {estimateResult.total.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* 右侧：匹配比例 */}
                                        <div className="flex flex-col items-end justify-between h-16">
                                            <div className="text-sm font-medium text-slate-500 tracking-tight">匹配样本比例</div>
                                            <div className="flex items-baseline">
                                                <span className="text-3xl font-medium text-blue-600 tabular-nums">
                                                    {((estimateResult.hit / estimateResult.total) * 100).toFixed(1)}
                                                </span>
                                                <span className="text-lg text-blue-600 ml-0.5">%</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="flex items-center justify-start space-x-4 pt-4">
                                    <Button
                                        onClick={() => handleSubmit('DRAFT')}
                                        variant="outline"
                                        className="h-12 px-8 rounded-2xl border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50"
                                    >
                                        保存草稿
                                    </Button>
                                    <Button
                                        onClick={() => handleSubmit('QUEUED')}
                                        disabled={!formData.sourceTaskId || !formData.yField || formData.xFields.length === 0}
                                        className={`h-12 px-10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border-none transition-all group ${(!formData.sourceTaskId || !formData.yField || formData.xFields.length === 0)
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:scale-105 active:scale-95'
                                            }`}
                                    >
                                        保存并运行 <Play className="w-4 h-4 ml-2 fill-current group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 添加过滤器弹窗 */}
            <Modal
                title={<div className="font-bold text-lg pb-2 border-b">配置筛选条件</div>}
                open={isFilterModalOpen}
                onCancel={() => setIsFilterModalOpen(false)}
                footer={null}
                centered
                width={520}
                className="causal-modal"
                styles={{ content: { borderRadius: '24px', padding: '24px' } }}
            >
                <div className="py-2 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">分析字段</Label>
                        <AntSelect
                            showSearch
                            optionFilterProp="label"
                            placeholder="选择筛选字段"
                            className="w-full h-12"
                            style={{ width: '100%', height: '48px' }}
                            popupClassName="rounded-xl font-medium"
                            value={editingFilter.field || undefined}
                            onChange={(val: string) => {
                                const fieldSchema = schema?.fields.find((f: any) => f.name === val);
                                let defaultOp = '=';
                                if (fieldSchema?.filterType === 'Numeric') defaultOp = 'BETWEEN';
                                if (fieldSchema?.filterType === 'Categorical') defaultOp = 'IN'; // 默认多选

                                // 自动填充默认值 (基于统计信息)
                                let defaultValue = null;
                                if (fieldSchema?.filterType === 'Numeric' && fieldSchema.statistics && defaultOp === 'BETWEEN') {
                                    // defaultValue = [fieldSchema.statistics.min, fieldSchema.statistics.max]; // 可选：是否自动填充全范围？用户体验上可能留空更好，或者填中间值。这里暂不自动填，仅显示提示。
                                }

                                setEditingFilter({
                                    ...editingFilter,
                                    field: val,
                                    op: defaultOp,
                                    value: defaultValue
                                });
                            }}
                            options={schema?.fields.map((f: any) => ({ label: f.displayName, value: f.name }))}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 space-y-2">
                            <Label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">操作符</Label>
                            <AntSelect
                                className="w-full h-12"
                                style={{ width: '100%', height: '48px' }}
                                value={editingFilter.op}
                                onChange={(val: string) => setEditingFilter({ ...editingFilter, op: val })}
                                options={[
                                    { label: 'BETWEEN (区间)', value: 'BETWEEN' },
                                    { label: '等于 (=)', value: '=' },
                                    { label: '包含 (IN)', value: 'IN' },
                                    { label: '大于 (>)', value: '>' },
                                    { label: '小于 (<)', value: '<' },
                                ]}
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">筛选值</Label>
                            {(() => {
                                const currentField = schema?.fields.find((f: any) => f.name === editingFilter.field);

                                // 情况 1: 时间类型
                                if (currentField?.filterType === 'Temporal') {
                                    return (
                                        <DatePicker
                                            className="w-full h-12 rounded-xl border-slate-200"
                                            style={{ height: '48px' }}
                                            showTime
                                            onChange={(_, dateString) => setEditingFilter({ ...editingFilter, value: dateString })}
                                        />
                                    );
                                }

                                // 情况 2: 数值类型
                                if (currentField?.filterType === 'Numeric') {
                                    if (editingFilter.op === 'BETWEEN') {
                                        return (
                                            <div className="flex items-center space-x-2">
                                                <InputNumber
                                                    className="w-full h-12 rounded-xl border-slate-200 pt-2"
                                                    placeholder="Min"
                                                    onChange={(val) => {
                                                        const current = Array.isArray(editingFilter.value) ? editingFilter.value : [null, null];
                                                        setEditingFilter({ ...editingFilter, value: [val, current[1]] });
                                                    }}
                                                />
                                                <span className="text-slate-400">~</span>
                                                <InputNumber
                                                    className="w-full h-12 rounded-xl border-slate-200 pt-2"
                                                    placeholder="Max"
                                                    onChange={(val) => {
                                                        const current = Array.isArray(editingFilter.value) ? editingFilter.value : [null, null];
                                                        setEditingFilter({ ...editingFilter, value: [current[0], val] });
                                                    }}
                                                />
                                            </div>
                                        );
                                    }
                                    return (
                                        <InputNumber
                                            className="w-full h-12 rounded-xl border-slate-200 pt-2"
                                            style={{ width: '100%' }}
                                            placeholder="输入数值"
                                            onChange={(val) => setEditingFilter({ ...editingFilter, value: val })}
                                        />
                                    );
                                }

                                // 情况 3: 分类类型 (利用统计信息)
                                if (currentField?.filterType === 'Categorical') {
                                    // 获取 Mock 中的选项，如果没有则使用默认兜底
                                    const options = currentField.statistics?.options?.map((opt: string) => ({ label: opt, value: opt })) || [
                                        { label: 'Category A', value: 'A' }, { label: 'Category B', value: 'B' }
                                    ];

                                    return (
                                        <AntSelect
                                            mode={editingFilter.op === 'IN' ? 'multiple' : undefined}
                                            className="w-full h-12"
                                            style={{ width: '100%', minHeight: '48px' }}
                                            placeholder="选择分类值"
                                            options={options}
                                            onChange={(val: any) => setEditingFilter({ ...editingFilter, value: val })}
                                        />
                                    );
                                }

                                // 默认文本输入
                                return (
                                    <div className="h-12 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                                        请先选择分析字段
                                    </div>
                                );
                            })()}
                            {/* 数据预览提示 */}
                            {editingFilter.field && (() => {
                                const f = schema?.fields.find((field: any) => field.name === editingFilter.field);
                                if (!f?.statistics) return null;

                                return (
                                    <div className="text-[10px] text-slate-400 px-1 flex items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <Database className="w-3 h-3 mr-1.5 text-blue-400" />
                                        <span>测试集数据预览: </span>
                                        <span className="ml-1 font-mono font-medium text-slate-600">
                                            {f.filterType === 'Numeric' && `${f.statistics.min} ~ ${f.statistics.max}`}
                                            {f.filterType === 'Temporal' && `${f.statistics.start} ~ ${f.statistics.end}`}
                                            {f.filterType === 'Categorical' && `可选值: ${f.statistics.options?.join(', ')}`}
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button variant="ghost" onClick={() => setIsFilterModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold text-slate-500">放弃</Button>
                        <Button
                            onClick={handleSaveFilter}
                            disabled={!editingFilter.field || editingFilter.value === null || editingFilter.value === ''}
                            className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 border-none"
                        >
                            {editingFilter.id ? '确认修改' : '确认添加'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

/**
 * 影响因子条形图组件
 */
function CausalImpactChart({ data, title, description, yField }: { data: any[], title: React.ReactNode, description: string, yField: string }) {
    if (!data || data.length === 0) return null;

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center">
                        {title}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{description}</p>
                </div>
            </div>
            <div className="h-[500px] w-full p-8 bg-white rounded-3xl border border-slate-100 shadow-inner relative" style={{ minHeight: '500px' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                    <ComposedChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 20, right: 40, left: 100, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f1f5f9" />
                        <XAxis
                            type="number"
                            domain={['auto', 'auto']}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                        />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }}
                            width={140}
                        />
                        <RechartsTooltip
                            cursor={{ fill: '#f8fafc' }}
                            content={({ active, payload }: any) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 text-xs font-bold min-w-[180px]">
                                            <p className="mb-2 text-slate-400 uppercase tracking-widest text-[9px]">{d.displayName}</p>
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-2xl font-black">{d.value > 0 ? '+' : ''}{d.value.toFixed(2)}</span>
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] ${d.value > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {d.value > 0 ? 'Positive Impact' : 'Negative Impact'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="value" barSize={32} radius={[4, 4, 4, 4]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#f43f5e' : '#3b82f6'} />
                            ))}
                        </Bar>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}

/**
 * 因果关系热力图组件
 */
function CausalHeatmap({ data, title, description }: { data: any, title: React.ReactNode, description: string }) {
    if (!data) return null;

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center">
                        {title}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{description}</p>
                </div>
                <div className="flex items-center space-x-4 pr-2">
                    <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </div>
                    <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    </div>
                    <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    </div>
                </div>
            </div>

            <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-8 overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* X轴 Label (特征) */}
                    <div className="flex mb-2 ml-36">
                        {data.features.map((feat: string, idx: number) => (
                            <div key={feat} className="flex-1 text-[10px] font-bold text-slate-400 text-center truncate px-1 transform -rotate-12 origin-bottom-left" style={{ height: '30px' }}>
                                {feat}
                            </div>
                        ))}
                    </div>

                    {/* Heatmap Grid */}
                    <div className="space-y-[2px]">
                        {data.timeLabels.map((time: string, rowIdx: number) => (
                            <div key={time} className="flex items-center space-x-[2px]">
                                {/* Y轴 Label (时间) */}
                                <div className="w-36 text-[10px] font-mono font-bold text-slate-400 truncate pr-3 text-right">
                                    {time}
                                </div>
                                {/* 单元格 */}
                                {data.values[rowIdx].map((val: string, colIdx: number) => {
                                    const numericVal = parseFloat(val);
                                    // 计算颜色：正值为红，负值为蓝
                                    let bgColor = '#f1f5f9'; // neutral
                                    let opacity = 0.1;
                                    if (numericVal > 0) {
                                        bgColor = '#f43f5e'; // rose-500
                                        opacity = Math.min(Math.abs(numericVal) / 2, 1);
                                    } else if (numericVal < 0) {
                                        bgColor = '#3b82f6'; // blue-500
                                        opacity = Math.min(Math.abs(numericVal) / 2, 1);
                                    }

                                    return (
                                        <Tooltip key={`${rowIdx}-${colIdx}`} title={`${time} | ${data.features[colIdx]} : ${val}`}>
                                            <div
                                                className="flex-1 h-3 rounded-[1px] cursor-pointer hover:ring-2 hover:ring-white transition-all"
                                                style={{
                                                    backgroundColor: bgColor,
                                                    opacity: opacity
                                                }}
                                            />
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/**
 * 原始样本数据表格组件
 */
function SampleDataTable({ data, columns, className }: { data: any[], columns?: string[], className?: string }) {
    if (!data || data.length === 0) return <div className="text-center py-10 text-slate-400">暂无数据</div>;

    // 动态获取列名 (排除一些不需要展示的 meta key)
    const displayColumns = columns || Object.keys(data[0]).filter(k => !['id', 'isPositive'].includes(k));

    const tableColumns: any[] = [
        { title: '序号', key: 'index', render: (_: any, __: any, index: number) => index + 1, width: 80, align: 'center' },
        ...(displayColumns.includes('time') ? [{ title: '时间', dataIndex: 'time', key: 'time', width: 160 }] : []),
        ...displayColumns.filter(c => c !== 'time').map(col => ({ title: col, dataIndex: col, key: col, width: 120 }))
    ];

    return (
        <div className={`border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300 ${className}`}>
            <Table
                columns={tableColumns}
                dataSource={data}
                rowKey={(r, i) => i?.toString() || Math.random().toString()}
                pagination={false}
                scroll={{ y: 500, x: 'max-content' }}
                size="small"
                className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-700"
            />
            <div className="bg-slate-50 border-t border-slate-200 p-2 text-center text-xs text-slate-400">
                共 {data.length} 条数据
            </div>
        </div>
    );
}

/**
 * 任务详情视图
 */
function CITaskDetail({ task, onBack }: { task: CausalInsightTask; onBack: () => void }) {
    const [filteredViewMode, setFilteredViewMode] = useState<'chart' | 'table'>('chart');
    const [fullViewMode, setFullViewMode] = useState<'chart' | 'table'>('chart');

    // 全屏预览弹窗状态
    const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
    // 导出状态
    const [isExporting, setIsExporting] = useState(false);

    // 导出报告逻辑
    const handleExportReport = async () => {
        try {
            setIsExporting(true);

            // 1. 强制切换到图表视图以进行截图
            setFilteredViewMode('chart');
            setFullViewMode('chart');

            // 等待渲染完成
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 2. 初始化 ZIP 和 PDF
            const zip = new JSZip();
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();

            // 添加标题
            doc.setFontSize(16);
            doc.text(`Causal Insight Report: ${task.name}`, 10, 15);
            doc.setFontSize(10);
            doc.text(`Generated at: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 10, 22);
            doc.line(10, 25, pageWidth - 10, 25);

            let currentY = 30;

            // 3. 截图函数
            const addSectionToPDF = async (elementId: string, title: string) => {
                const element = document.getElementById(elementId);
                if (element) {
                    const canvas = await html2canvas(element, {
                        scale: 2,
                        logging: false,
                        useCORS: true,
                        backgroundColor: '#ffffff'
                    });
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = pageWidth - 20;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    // 检查是否需要新页
                    if (currentY + imgHeight > 280) {
                        doc.addPage();
                        currentY = 10;
                    }

                    doc.setFontSize(12);
                    doc.text(title, 10, currentY);
                    doc.addImage(imgData, 'PNG', 10, currentY + 5, imgWidth, imgHeight);
                    currentY += imgHeight + 15;
                }
            };

            // 4. 截取图表
            await addSectionToPDF('filtered-analysis-section', '1. Analysis Results (Filtered Scope)');
            await addSectionToPDF('full-analysis-section', '2. Analysis Results (Full Sample)');

            // 添加 PDF 到 ZIP
            const pdfBlob = doc.output('blob');
            zip.file(`${task.name}_Report.pdf`, pdfBlob);

            // 5. 生成 CSV 数据
            const generateCSV = (data: any[], filename: string) => {
                if (!data || data.length === 0) return;

                // 获取表头
                const headers = Object.keys(data[0]);
                const csvContent = [
                    headers.join(','),
                    ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
                ].join('\n');

                zip.file(filename, csvContent);
            };

            generateCSV(filteredSampleData, 'Filtered_Sample_Data.csv');
            generateCSV(fullSampleData, 'Full_Sample_Data.csv');

            // 6. 导出 ZIP - 使用 file-saver 确保文件名正确
            const content = await zip.generateAsync({ type: 'blob' });

            // 处理文件名：去除特殊字符，保留中文、数字、字母、下划线
            const safeName = (task.name || 'report').replace(/[^\u4e00-\u9fa5a-zA-Z0-9_-]/g, '_');
            const timestamp = dayjs().format('YYYYMMDD_HHmm');
            const filename = `${safeName}_${timestamp}.zip`;

            console.log('正在下载文件:', filename);

            // 使用更可靠的下载方式
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);

            // 模拟用户点击
            link.click();

            // 清理
            setTimeout(() => {
                URL.revokeObjectURL(link.href);
                document.body.removeChild(link);
            }, 1000);

            message.success('报告导出成功！');
        } catch (error) {
            console.error('Export failed:', error);
            message.error('导出报告失败，请重试');
        } finally {
            setIsExporting(false);
        }
    };

    // Fetch schema to display friendly names
    const schema = useMemo(() => {
        if (task.sourceDecisionTaskId) {
            return getDecisionTaskSchema(task.sourceDecisionTaskId);
        }
        return null;
    }, [task.sourceDecisionTaskId]);

    const resultData = useMemo(() => getCausalResultData(task.id), [task.id]);

    // 模拟全量样本数据 (100条)，包含所有特征
    const fullSampleData = useMemo(() => {
        // 从结果数据中获取特征列表
        const features = resultData.barChart.map(i => i.feature);

        return Array.from({ length: 100 }).map((_, i) => {
            const row: any = {
                id: `#${Math.floor(Math.random() * 10000)}`,
                time: `2025-08-01 ${String(Math.floor(i / 4) % 24).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}:00`,
                [task.ySpec.field]: (Math.random() * 100).toFixed(2), // Target
            };

            // 为每个特征生成随机数据
            features.forEach(feat => {
                row[feat] = (Math.random() * 50 + 10).toFixed(2);
            });

            return row;
        });
    }, [resultData, task.ySpec.field]);

    // 模拟筛选后的样本数据 (取全量的前30条作为示例)
    const filteredSampleData = useMemo(() => {
        return fullSampleData.slice(0, 30);
    }, [fullSampleData]);

    if (!task) return <div className="p-20 text-center"><RefreshCcw className="w-8 h-8 animate-spin mx-auto text-blue-400" /></div>;

    // 将 mock 数据中的 barChart 映射为 impactData 以适配图表
    const impactData = useMemo(() => {
        return resultData.barChart.map(item => ({
            name: item.feature,
            displayName: item.feature,
            value: item.score, // 保留正负号
            absScore: Math.abs(item.score)
        })).sort((a, b) => b.absScore - a.absScore);
    }, [resultData.barChart]);

    // 【新增】模拟Filtered Data (针对影响因子图)
    const filteredImpactData = useMemo(() => {
        return impactData.map(item => ({
            ...item,
            value: item.value * (0.8 + Math.random() * 0.4), // 模拟 + - 20%的波动
        })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    }, [impactData]);

    // 【新增】模拟Filtered Data (针对热力图)
    const filteredHeatmapData = useMemo(() => {
        const original = resultData.heatmap;
        return {
            ...original,
            values: original.values.map(row =>
                row.map(val => (parseFloat(val as string) * (0.9 + Math.random() * 0.2)).toFixed(2))
            )
        };
    }, [resultData.heatmap]);

    // 分离 X 和 Y 的过滤条件
    const xFilters = useMemo(() => {
        if (!task.filters?.and) return [];
        return (task.filters.and as any[]).filter(f => f.field !== task.ySpec.field);
    }, [task.filters, task.ySpec.field]);

    const yFilters = useMemo(() => {
        if (!task.filters?.and) return [];
        return (task.filters.and as any[]).filter(f => f.field === task.ySpec.field);
    }, [task.filters, task.ySpec.field]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 顶部标题栏 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                    <Button variant="ghost" onClick={onBack} className="text-slate-500 hover:text-slate-900 group">
                        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> 返回列表
                    </Button>
                    <div className="h-4 w-px bg-slate-200" />
                    <h2 className="text-xl font-bold text-slate-800">{task.name}</h2>
                    {task.status === 'SUCCEEDED' && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-2 py-0">已完成分析</Badge>
                    )}
                    {task.status === 'FAILED' && (
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20 px-2 py-0">分析失败</Badge>
                    )}
                    {task.status === 'RUNNING' && (
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-2 py-0">分析中</Badge>
                    )}
                    {task.status === 'QUEUED' && (
                        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-2 py-0">排队中</Badge>
                    )}
                </div>
                <div className="flex items-center space-x-3">

                    <Button
                        onClick={handleExportReport}
                        disabled={isExporting}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-9 rounded-lg shadow-lg shadow-blue-100 border-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 正在导出...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" /> 导出报告
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6 items-start w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                {/* 左侧概览栏 */}
                <div className="space-y-6" style={{ gridColumn: 'span 1 / span 1' }}>
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
                        <div className="h-2 bg-blue-600" />
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                <FileText className="w-4 h-4 mr-2 text-blue-500" /> 任务概览
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* 1. 来源决策任务 */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">来源决策任务</Label>
                                <p className="text-sm font-bold text-slate-700 leading-tight">{task.sourceDecisionTaskName}</p>
                            </div>

                            {/* 2. 创建日期 */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">创建日期</Label>
                                <p className="text-sm font-bold text-slate-700 leading-tight">{task.createdAt}</p>
                            </div>

                            <div className="w-full h-px bg-slate-100" />

                            {/* 3. X (影响因子) */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">X (影响因子)</Label>
                                <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-3">
                                    <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                                        {task.xSpec.fields.map((f: string) => (
                                            <span key={f} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg hover:border-blue-200 transition-all cursor-default shadow-sm">
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-slate-100" />

                            {/* 4. X (样本条件过滤) */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">X (样本条件过滤)</Label>
                                <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-3">
                                    <div className="space-y-2">
                                        {xFilters.length > 0 ? (
                                            xFilters.map((f: any, idx: number) => {
                                                const fieldInfo = schema?.fields.find((field: any) => field.name === f.field);
                                                const displayName = fieldInfo ? fieldInfo.displayName : f.field;
                                                return (
                                                    <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex flex-col gap-1 shadow-sm">
                                                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                                            <span>{displayName}</span>
                                                            <span className="font-mono bg-slate-50 px-1 rounded border border-slate-100">{f.op}</span>
                                                        </div>
                                                        <div className="font-medium text-slate-700 break-all">
                                                            {Array.isArray(f.value) ? f.value.join(' ~ ') : f.value}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-[10px] text-slate-400 italic text-center py-1">无过滤条件</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-slate-100" />

                            {/* 5. Y (分析目标) */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">目标变量 (Y)</Label>
                                <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="px-2.5 py-1 bg-white border border-blue-200 text-blue-600 text-[11px] font-bold rounded-lg shadow-sm">
                                            {task.ySpec.field}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 6. Y (样本条件过滤) */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Y (样本条件过滤)</Label>
                                <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-3">
                                    <div className="space-y-2">
                                        {yFilters.length > 0 ? (
                                            yFilters.map((f: any, idx: number) => (
                                                <div key={idx} className="bg-blue-50/30 p-2.5 rounded-lg border border-blue-100 text-xs flex flex-col gap-1 shadow-sm">
                                                    <div className="flex justify-between items-center text-[10px] font-bold text-blue-500">
                                                        <span>{f.field}</span>
                                                        <span className="font-mono bg-white px-1 rounded border border-blue-100">{f.op}</span>
                                                    </div>
                                                    <div className="font-medium text-slate-700 break-all">
                                                        {Array.isArray(f.value) ? f.value.join(' ~ ') : f.value}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-[10px] text-slate-400 italic text-center py-1">无过滤条件</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 统计信息 */}
                            <div className="space-y-3 pt-4 border-t border-slate-50 mt-4">
                                <div className="flex justify-between items-center bg-slate-50 transition-all p-3 rounded-xl border border-slate-100/50">
                                    <span className="text-xs font-bold text-slate-500">命中样本</span>
                                    <span className="text-sm font-black text-slate-800">{task.sampleHit.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 transition-all p-3 rounded-xl border border-slate-100/50">
                                    <span className="text-xs font-bold text-slate-500">覆盖率</span>
                                    <span className="text-sm font-black text-blue-600 tracking-tighter">{((task.sampleHit / task.sampleTotal) * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 右侧主内容区 */}
                <div className="space-y-6 w-full overflow-hidden" style={{ gridColumn: 'span 3 / span 3' }}>
                    {task.status === 'FAILED' ? (
                        <Card className="border-none shadow-xl shadow-red-200/50 rounded-3xl overflow-hidden bg-white min-h-[400px] w-full">
                            <CardHeader className="border-b border-slate-100 pb-4">
                                <CardTitle className="text-xl font-bold text-red-600 flex items-center">
                                    <AlertTriangle className="w-6 h-6 mr-2" />
                                    任务分析失败
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-500">错误日志</Label>
                                    <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-sm text-red-800 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                                        {task.errorMessage || `Error: System Runtime Exception
Task ID: ${task.id}
Timestamp: ${new Date().toISOString()}

Details:
Analysis engine terminated unexpectedly.
possible causes:
- Connection timeout (Error Code: E-504)
- Insufficient memory allocation during data processing
- Invalid data format in column 'Sales_Volume'

Please verify your dataset schema match the input requirements.`}
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <h4 className="font-bold text-slate-700 mb-2 flex items-center">
                                        <Activity className="w-4 h-4 mr-2 text-blue-500" />
                                        建议操作
                                    </h4>
                                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 ml-1">
                                        <li>检查“来源决策任务”的数据快照是否存在异常值</li>
                                        <li>尝试减少样本命中过滤条件的复杂性</li>
                                        <li>点击右上角“导出报告”下载完整错误日志供技术支持排查</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white min-h-[600px] w-full">
                            <CardContent className="p-8">
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">

                                    {/* 【新增】筛选条件分析结果区域 */}
                                    <div className="space-y-8" id="filtered-analysis-section">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                            <div className="flex items-center space-x-2">
                                                <Filter className="w-5 h-5 text-blue-600" />
                                                <h2 className="text-xl font-black text-slate-800">当前筛选条件下的分析结果</h2>
                                            </div>

                                            {/* 视图切换 Toggle */}
                                            <div className="flex bg-slate-100/80 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setFilteredViewMode('chart')}
                                                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filteredViewMode === 'chart'
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                        }`}
                                                >
                                                    <BarChart3 className="w-3.5 h-3.5" />
                                                    <span>可视化</span>
                                                </button>
                                                <button
                                                    onClick={() => setFilteredViewMode('table')}
                                                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filteredViewMode === 'table'
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                        }`}
                                                >
                                                    <TableIcon className="w-3.5 h-3.5" />
                                                    <span>原始数据</span>
                                                </button>
                                            </div>
                                        </div>

                                        {filteredViewMode === 'chart' ? (
                                            <>
                                                {/* 1. 筛选条件-影响因子条形图 */}
                                                <CausalImpactChart
                                                    data={filteredImpactData}
                                                    title={<><BarChart3 className="w-5 h-5 mr-2 text-blue-500" /> 各影响因子影响分数对比 (筛选后)</>}
                                                    description={`针对当前筛选条件下的样本，计算出的不同特征对目标变量 ${task.ySpec.field} 的平均影响分数`}
                                                    yField={task.ySpec.field}
                                                />

                                                {/* 2. 筛选条件-因果关系热力图 */}
                                                <CausalHeatmap
                                                    data={filteredHeatmapData}
                                                    title={<><Flame className="w-5 h-5 mr-2 text-orange-500 fill-orange-500/20" /> 因果关系分布 (筛选后)</>}
                                                    description="展示当前筛选条件下特征 X 之间的相互依赖与因果指向强度"
                                                />
                                            </>
                                        ) : (
                                            <SampleDataTable data={filteredSampleData} />
                                        )}
                                    </div>

                                    {/* 分隔线 */}
                                    <div className="h-px bg-slate-100 my-8" />

                                    {/* 全量样本分析结果区域 */}
                                    {/* 全量样本分析结果区域 */}
                                    <div className="space-y-8" id="full-analysis-section">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                            <div className="flex items-center space-x-2">
                                                <Database className="w-5 h-5 text-purple-600" />
                                                <h2 className="text-xl font-black text-slate-800">全样本分析结果</h2>
                                            </div>

                                            {/* 视图切换 Toggle */}
                                            <div className="flex bg-slate-100/80 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setFullViewMode('chart')}
                                                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${fullViewMode === 'chart'
                                                        ? 'bg-white text-purple-600 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                        }`}
                                                >
                                                    <BarChart3 className="w-3.5 h-3.5" />
                                                    <span>可视化</span>
                                                </button>
                                                <button
                                                    onClick={() => setFullViewMode('table')}
                                                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${fullViewMode === 'table'
                                                        ? 'bg-white text-purple-600 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                        }`}
                                                >
                                                    <TableIcon className="w-3.5 h-3.5" />
                                                    <span>原始数据</span>
                                                </button>
                                            </div>
                                        </div>

                                        {fullViewMode === 'chart' ? (
                                            <>
                                                {/* 3. 全样-影响因子条形图 */}
                                                <CausalImpactChart
                                                    data={impactData}
                                                    title={<><BarChart3 className="w-5 h-5 mr-2 text-blue-500" /> 各影响因子影响分数对比 (全样本)</>}
                                                    description={`针对所有样本计算出不同特征对目标变量 ${task.ySpec.field} 的平均影响分数`}
                                                    yField={task.ySpec.field}
                                                />

                                                {/* 4. 全样-因果关系热力图 */}
                                                <CausalHeatmap
                                                    data={resultData.heatmap}
                                                    title={<><Flame className="w-5 h-5 mr-2 text-orange-500 fill-orange-500/20" /> 因果关系分布 (全样本)</>}
                                                    description="展示所有样本下特征 X 之间的相互依赖与因果指向强度"
                                                />
                                            </>
                                        ) : (
                                            <SampleDataTable data={fullSampleData} />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* 全屏样本数据预览弹窗 */}
            <Dialog open={isSampleModalOpen} onOpenChange={setIsSampleModalOpen}>
                <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl outline-none border-0">
                    <div className="px-6 py-4 border-b bg-white flex items-center justify-between shrink-0">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <List className="h-5 w-5 text-blue-600" />
                                <DialogTitle className="text-lg font-bold text-slate-800">全部命中样本数据</DialogTitle>
                            </div>
                            <div className="h-4 w-px bg-slate-200" />
                            <div className="flex items-center space-x-4 text-xs font-medium text-slate-500">
                                <span className="bg-slate-100 px-2 py-1 rounded">共 {fullSampleData.length} 条数据</span>
                                <span className="bg-slate-100 px-2 py-1 rounded">按时间降序排列</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                            onClick={() => setIsSampleModalOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-hidden bg-slate-50/50 p-6">
                        <SampleDataTable data={fullSampleData} className="h-full" />
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
