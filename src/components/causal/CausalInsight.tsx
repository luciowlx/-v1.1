import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, Filter, MoreHorizontal, Clock, Activity, CheckCircle, XCircle,
    AlertCircle, AlertTriangle, ChevronRight, ChevronLeft, ArrowRight, Database, BarChart3,
    Flame, Download, Copy, Trash2, RefreshCcw, Target, FileText, LayoutGrid,
    Settings2, Eye, MoreVertical, History, X, Play, Calendar, List
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '../ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { message, Modal, Popconfirm, Tooltip, Empty, DatePicker, Slider, InputNumber, Checkbox, Space, Select as AntSelect } from 'antd';
import { useLanguage } from "../../i18n/LanguageContext";
import { mockCITasks, CausalInsightTask, getDecisionTaskSchema, getCausalResultData } from '../../mock/causal';
import {
    ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Cell, Line, Scatter
} from 'recharts';

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
        setView('create');
    };

    const handleViewDetail = (taskId: string) => {
        setSelectedTaskId(taskId);
        setView('detail');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedTaskId(null);
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        message.success('任务已删除');
    };

    const handleCopyTask = (taskId: string) => {
        const source = tasks.find(t => t.id === taskId);
        if (source) {
            const newTask: CausalInsightTask = {
                ...source,
                id: `CI-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                name: `${source.name} - 副本`,
                status: 'DRAFT',
                progress: 0,
                createdAt: new Date().toLocaleString(),
                updatedAt: new Date().toLocaleString()
            };
            setTasks([newTask, ...tasks]);
            message.success('任务副本已创建');
        }
    };

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-full w-full max-w-full overflow-hidden">
            {view === 'list' && (
                <CITaskList
                    tasks={filteredTasks}
                    onSearch={setSearchQuery}
                    onCreate={handleCreateTask}
                    onViewDetail={handleViewDetail}
                    onDelete={handleDeleteTask}
                    onCopy={handleCopyTask}
                />
            )}
            {view === 'create' && (
                <CreateCITask
                    onBack={handleBackToList}
                    onSubmit={(newTask: CausalInsightTask) => {
                        setTasks([newTask, ...tasks]);
                        setView('list');
                        message.success('任务已提交运行');
                    }}
                />
            )}
            {view === 'detail' && currentTask && (
                <CITaskDetail
                    task={currentTask}
                    onBack={handleBackToList}
                />
            )}
        </div>
    );
}

/**
 * 任务列表视图
 */
function CITaskList({ tasks, onSearch, onCreate, onViewDetail, onDelete, onCopy }: any) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUCCEEDED': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 font-medium">已完成</Badge>;
            case 'RUNNING': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 font-medium">运行中</Badge>;
            case 'FAILED': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 font-medium">失败</Badge>;
            case 'DRAFT': return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200 font-medium">草稿</Badge>;
            case 'QUEUED': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 font-medium">排队中</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

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

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b py-4">
                    <div className="flex items-center space-x-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="搜索任务名称或ID..."
                                className="pl-10 h-10 border-slate-200 focus:ring-blue-500"
                                onChange={(e) => onSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="h-10 border-slate-200 text-slate-600">
                            <Filter className="w-4 h-4 mr-2" /> 筛选
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-[300px] font-semibold text-slate-700 h-12">任务名称</TableHead>
                                <TableHead className="font-semibold text-slate-700 h-12">来源任务</TableHead>
                                <TableHead className="font-semibold text-slate-700 h-12">Y 字段</TableHead>
                                <TableHead className="font-semibold text-slate-700 h-12">样本命中</TableHead>
                                <TableHead className="font-semibold text-slate-700 h-12">状态</TableHead>
                                <TableHead className="font-semibold text-slate-700 h-12">创建人</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-right h-12 pr-6">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.length > 0 ? tasks.map((task: any) => (
                                <TableRow key={task.id} className="hover:bg-slate-50/50 transition-colors group h-16 border-slate-100">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900 group-hover:text-blue-600 cursor-pointer" onClick={() => onViewDetail(task.id)}>
                                                {task.name}
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono mt-0.5">{task.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">{task.sourceDecisionTaskName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal border-slate-200 bg-slate-50 text-slate-600 px-2 py-0">
                                            {task.ySpec.field}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col w-32">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-bold text-slate-700">{task.sampleHit.toLocaleString()}</span>
                                                <span className="text-[10px] text-slate-400">/ {task.sampleTotal.toLocaleString()}</span>
                                            </div>
                                            <Progress value={(task.sampleHit / task.sampleTotal) * 100} className="h-1.5 bg-slate-100" />
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                                    <TableCell className="text-slate-600 text-sm font-medium">{task.createdBy}</TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <Empty description="暂无因果洞察任务" />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * 创建 CI 任务向导（4 步）
 */
function CreateCITask({ onBack, onSubmit }: any) {
    const [formData, setFormData] = useState({
        name: `未命名洞察任务-${new Date().getTime().toString().slice(-4)}`,
        sourceTaskId: '',
        xFields: [] as string[],
        yField: '',
        yRange: { min: 20, max: 80 } as any,
        filters: [] as any[]
    });

    const [schema, setSchema] = useState<any>(null); // 恢复 schema 状态
    const [currentYSchema, setCurrentYSchema] = useState<any>(null);
    const [xSearch, setXSearch] = useState(''); // 新增：X 因子搜索关键词
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
    const [editingFilter, setEditingFilter] = useState<{ field: string, op: string, value: any }>({ field: '', op: 'BETWEEN', value: null });

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



    // 过滤出的 X 字段列表
    const filteredXFields = useMemo(() => {
        if (!schema) return [];
        return schema.fields
            .filter((f: any) => f.name !== 'Time' && f.name !== formData.yField)
            .filter((f: any) => f.displayName.includes(xSearch) || f.name.includes(xSearch));
    }, [schema, formData.yField, xSearch]);

    // 判断当前过滤列表是否已全选
    const isAllSelected = filteredXFields.length > 0 && filteredXFields.every((f: any) => formData.xFields.includes(f.name));

    // 全选/取消全选逻辑
    const handleSelectAll = () => {
        const visibleNames = filteredXFields.map((f: any) => f.name);

        let newXFields;
        if (isAllSelected) {
            // 取消全选 visible
            newXFields = formData.xFields.filter((name: string) => !visibleNames.includes(name));
        } else {
            // 全选 visible
            const toAdd = visibleNames.filter((name: string) => !formData.xFields.includes(name));
            newXFields = [...formData.xFields, ...toAdd];
        }
        setFormData({ ...formData, xFields: newXFields });
    };

    const handleSubmit = (status: 'DRAFT' | 'QUEUED') => {
        const newTask: CausalInsightTask = {
            id: `CI-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            name: formData.name,
            projectId: 'proj_001',
            sourceDecisionTaskId: formData.sourceTaskId,
            sourceDecisionTaskName: '销售数据预测模型训练',
            datasetSnapshotId: 'SNAP-NEW',
            xSpec: { mode: 'explicit', fields: formData.xFields },
            ySpec: { field: formData.yField, filterType: currentYSchema?.filterType || 'Numeric' },
            filters: formData.filters,
            status: status,
            progress: 0,
            sampleTotal: estimateResult.total,
            sampleHit: estimateResult.hit,
            createdAt: new Date().toLocaleString(),
            createdBy: '当前用户',
            updatedAt: new Date().toLocaleString()
        };
        onSubmit(newTask);
    };

    const addFilter = () => {
        if (editingFilter.field && editingFilter.value) {
            setFormData({
                ...formData,
                filters: [...formData.filters, { ...editingFilter, id: Date.now() }]
            });
            setIsFilterModalOpen(false);
            setEditingFilter({ field: '', op: 'BETWEEN', value: '' });
        }
    };

    const removeFilter = (id: number) => {
        setFormData({
            ...formData,
            filters: formData.filters.filter(f => f.id !== id)
        });
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
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">创建因果洞察任务</h2>
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
                                    onChange={(val) => setFormData({ ...formData, sourceTaskId: val })}
                                    options={[
                                        { label: '任务 A | 销售数据预测 (8760 样本)', value: 'TASK-001' },
                                        { label: '任务 B | 客户流失预测 (5200 样本)', value: 'TASK-004' },
                                        { label: '任务 C | 电价波动预测 (12000 样本)', value: 'TASK-008' }
                                    ]}
                                />
                            </div>

                            {/* X 影响因子 */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center ml-1">
                                    <Label className="text-sm font-bold text-slate-700">X (影响因子)</Label>
                                    <div className="flex items-center space-x-3">
                                        {filteredXFields.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleSelectAll}
                                                className="h-6 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-50 -mr-2 px-2"
                                            >
                                                {isAllSelected ? '取消全选' : '全选'}
                                            </Button>
                                        )}
                                        <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">已选 {formData.xFields.length}</span>
                                    </div>
                                </div>
                                {/* 新增搜索框 (修复 prefix 属性问题) */}
                                {schema && (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <Input
                                            placeholder="搜索字段..."
                                            className="h-9 rounded-xl border-slate-100 bg-slate-50/50 text-xs pl-9"
                                            value={xSearch}
                                            onChange={(e) => setXSearch(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 max-h-[220px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                                    {schema ? (
                                        filteredXFields.map((f: any) => (
                                            <div
                                                key={f.name}
                                                onClick={() => {
                                                    const next = formData.xFields.includes(f.name)
                                                        ? formData.xFields.filter(x => x !== f.name)
                                                        : [...formData.xFields, f.name];
                                                    setFormData({ ...formData, xFields: next });
                                                }}
                                                className={`flex items-center px-4 py-2 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${formData.xFields.includes(f.name)
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                                                    : 'bg-white border-white text-slate-600 hover:border-blue-200'
                                                    }`}
                                            >
                                                <Checkbox checked={formData.xFields.includes(f.name)} className="mr-2 border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-blue-600 hidden" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold leading-tight">{f.displayName}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="w-full py-8 text-center text-slate-300 italic text-xs font-medium">请先选择来源任务</div>
                                    )}
                                </div>
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
                                <Table>
                                    <TableHeader className="bg-slate-50 border-b-none">
                                        <TableRow className="hover:bg-transparent border-slate-100">
                                            <TableHead className="font-black text-slate-400 uppercase tracking-wider h-12 py-0 text-[11px] pl-6 w-[35%]">字段</TableHead>
                                            <TableHead className="font-black text-slate-400 uppercase tracking-wider h-12 py-0 text-[11px] w-[25%]">操作符</TableHead>
                                            <TableHead className="font-black text-slate-400 uppercase tracking-wider h-12 py-0 text-[11px] w-[30%]">值</TableHead>
                                            <TableHead className="font-black text-slate-400 uppercase tracking-wider h-12 py-0 text-[11px] text-right pr-6 w-[10%]">操作</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formData.filters.length > 0 ? (
                                            formData.filters.map((f, idx) => (
                                                <TableRow key={f.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                                                    <TableCell className="font-bold text-slate-700 h-14 pl-6">{f.field}</TableCell>
                                                    <TableCell className="font-mono text-[11px] font-black text-slate-400">{f.op}</TableCell>
                                                    <TableCell className="text-sm font-medium text-slate-600">
                                                        {Array.isArray(f.value) ? f.value.join(' ~ ') : f.value}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeFilter(f.id)}
                                                            className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-64 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-20">
                                                        <div className="p-6 bg-slate-100 rounded-full">
                                                            <Filter className="w-12 h-12 text-slate-400" />
                                                        </div>
                                                        <p className="text-sm font-bold">暂无过滤条件</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableCell colSpan={4} className="p-0">
                                                <Button
                                                    onClick={() => setIsFilterModalOpen(true)}
                                                    variant="ghost"
                                                    className="w-full h-14 text-blue-500 font-black text-xs uppercase tracking-[0.2em] border-t border-slate-50 hover:bg-blue-50/30 rounded-none flex items-center justify-center space-x-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    <span>添加过滤条件</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
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
                            onClick={addFilter}
                            disabled={!editingFilter.field || editingFilter.value === null || editingFilter.value === ''}
                            className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 border-none"
                        >
                            确认添加
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

/**
 * 任务详情视图
 */
function CITaskDetail({ task, onBack }: { task: CausalInsightTask; onBack: () => void }) {
    const [activeTab, setActiveTab] = useState<'visual' | 'config' | 'samples'>('visual');
    const resultData = useMemo(() => getCausalResultData(task.id), [task.id]);

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
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" className="border-slate-200 text-slate-600 h-9 rounded-lg">
                        <Copy className="w-4 h-4 mr-2" /> 复制配置
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 rounded-lg shadow-lg shadow-blue-100 border-none">
                        <Download className="w-4 h-4 mr-2" /> 导出报告
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
                            <div className="space-y-1">
                                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">来源决策任务</Label>
                                <p className="text-sm font-bold text-slate-700 leading-tight">{task.sourceDecisionTaskName}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">目标变量 (Y)</Label>
                                <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="bg-white border-blue-200 text-blue-600 font-bold">{task.ySpec.field}</Badge>
                                </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                <div className="flex justify-between items-center bg-slate-50 transition-all p-3 rounded-xl border border-slate-100/50">
                                    <span className="text-xs font-bold text-slate-500">命中样本</span>
                                    <span className="text-sm font-black text-slate-800">{task.sampleHit.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 transition-all p-3 rounded-xl border border-slate-100/50">
                                    <span className="text-xs font-bold text-slate-500">覆盖率</span>
                                    <span className="text-sm font-black text-blue-600 tracking-tighter">{((task.sampleHit / task.sampleTotal) * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="pt-2 text-center">
                                <span className="text-[10px] text-slate-300 font-medium">创建日期: {task.createdAt}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white p-5">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-slate-800">
                                <List className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-bold">已选特征集 (X)</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                                {task.xSpec.fields.map((f: string) => (
                                    <span key={f} className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-white hover:border-blue-200 transition-all cursor-default">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* 右侧主内容区 */}
                <div className="space-y-6 w-full overflow-hidden" style={{ gridColumn: 'span 3 / span 3' }}>
                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-fit">
                        {[
                            { id: 'visual', label: '视图产物', icon: LayoutGrid },
                            { id: 'config', label: '配置回显', icon: Settings2 },
                            { id: 'samples', label: '命中样本列表', icon: List }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id as any)}
                                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <t.icon className="w-4 h-4" />
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white min-h-[600px] w-full">
                        <CardContent className="p-8">
                            {activeTab === 'visual' && resultData && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* 全量样本因果关系分布 (热力图) */}
                                    <section className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center">
                                                    <Flame className="w-5 h-5 mr-2 text-orange-500 fill-orange-500/20" /> 全样本因果关系分布
                                                </h3>
                                                <p className="text-xs text-slate-400 font-medium">展示当前样本下所有特征 X 之间的相互依赖与因果指向强度</p>
                                            </div>
                                            <div className="flex items-center space-x-4 pr-2">
                                                <div className="flex items-center space-x-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Negative</span>
                                                </div>
                                                <div className="flex items-center space-x-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Neutral</span>
                                                </div>
                                                <div className="flex items-center space-x-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Positive</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-8 overflow-x-auto">
                                            <div className="min-w-[800px]">
                                                {/* X轴 Label (特征) */}
                                                <div className="flex mb-2 ml-36">
                                                    {resultData.heatmap.features.map((feat, idx) => (
                                                        <div key={feat} className="flex-1 text-[10px] font-bold text-slate-400 text-center truncate px-1 transform -rotate-12 origin-bottom-left" style={{ height: '30px' }}>
                                                            {feat}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Heatmap Grid */}
                                                <div className="space-y-[2px]">
                                                    {resultData.heatmap.timeLabels.map((time, rowIdx) => (
                                                        <div key={time} className="flex items-center space-x-[2px]">
                                                            {/* Y轴 Label (时间) */}
                                                            <div className="w-36 text-[10px] font-mono font-bold text-slate-400 truncate pr-3 text-right">
                                                                {time}
                                                            </div>
                                                            {/* 单元格 */}
                                                            {resultData.heatmap.values[rowIdx].map((val, colIdx) => {
                                                                const numericVal = parseFloat(val as string);
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
                                                                    <Tooltip key={`${rowIdx}-${colIdx}`} title={`${time} | ${resultData.heatmap.features[colIdx]} : ${val}`}>
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

                                    {/* 影响因子条形图 (双向) */}
                                    <section className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center">
                                                    <BarChart3 className="w-5 h-5 mr-2 text-blue-500" /> 各影响因子影响分数对比
                                                </h3>
                                                <p className="text-xs text-slate-400 font-medium">针对命中样本计算出不同特征对目标变量 {task.ySpec.field} 的平均影响分数（Red: Positive, Blue: Negative）</p>
                                            </div>
                                        </div>
                                        <div className="h-[500px] w-full p-8 bg-white rounded-3xl border border-slate-100 shadow-inner relative" style={{ minHeight: '500px' }}>
                                            {impactData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                                                    <ComposedChart
                                                        layout="vertical"
                                                        data={impactData}
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
                                                                    const data = payload[0].payload;
                                                                    return (
                                                                        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 text-xs font-bold min-w-[180px]">
                                                                            <p className="mb-2 text-slate-400 uppercase tracking-widest text-[9px]">{data.displayName}</p>
                                                                            <div className="flex items-baseline justify-between">
                                                                                <span className="text-2xl font-black">{data.value > 0 ? '+' : ''}{data.value.toFixed(2)}</span>
                                                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] ${data.value > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                                                    {data.value > 0 ? 'Positive Impact' : 'Negative Impact'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                        <Bar dataKey="value" barSize={32} radius={6}>
                                                            {impactData.map((entry: any, index: number) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={entry.value >= 0 ? '#f43f5e' : '#3b82f6'} // Positive: Rose, Negative: Blue
                                                                    className="transition-all hover:brightness-110"
                                                                />
                                                            ))}
                                                        </Bar>
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-slate-400">暂无影响因子数据</div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'config' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pt-4">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-black text-slate-800 uppercase tracking-widest pl-1">因果变量 (X)</Label>
                                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-wrap gap-2 min-h-[120px]">
                                                {task.xSpec.fields.map((f: string) => (
                                                    <Badge key={f} className="bg-white text-slate-700 border-slate-200 px-4 py-1.5 rounded-xl font-bold shadow-sm">{f}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-black text-slate-800 uppercase tracking-widest pl-1">过滤条件 (Filters)</Label>
                                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3 min-h-[120px]">
                                                {task.filters && (Array.isArray(task.filters.and) ? task.filters.and : []).length > 0 ? (task.filters.and as any[]).map((f: any, idx: number) => (
                                                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-colors">
                                                        <div className="flex items-center space-x-3 text-sm font-bold text-slate-700">
                                                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[11px] font-black">{f.field}</span>
                                                            <span className="text-slate-400 font-mono italic">{f.op}</span>
                                                            <span className="text-slate-900 border-b-2 border-slate-100">{Array.isArray(f.value) ? f.value.join(' ~ ') : f.value}</span>
                                                        </div>
                                                        <CheckCircle className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                )) : <div className="text-center py-6 text-slate-400 font-medium italic">未设置过滤条件（全量样本分析）</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'samples' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex justify-between items-center mb-6 px-1">
                                        <h3 className="text-lg font-black text-slate-800 tracking-tight">命中样本数据抽样</h3>
                                        <Button variant="ghost" className="text-blue-600 font-bold hover:bg-blue-50 px-4 rounded-xl">查看全部样本数据</Button>
                                    </div>
                                    <div className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50 shadow-inner">
                                        <Table>
                                            <TableHeader className="bg-white border-b">
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="font-black text-slate-400 uppercase tracking-wider h-12 w-20 pl-6">ID</TableHead>
                                                    <TableHead className="font-black text-slate-400 uppercase tracking-wider h-12">Time</TableHead>
                                                    <TableHead className="font-black text-slate-400 uppercase tracking-wider h-12">{task.ySpec.field} (GT)</TableHead>
                                                    <TableHead className="font-black text-slate-400 uppercase tracking-wider h-12">Influence Score</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <TableRow key={i} className={`hover:bg-white group transition-colors border-slate-100 ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/40'}`}>
                                                        <TableCell className="font-mono text-xs text-slate-400 pl-6">#{Math.floor(Math.random() * 10000)}</TableCell>
                                                        <TableCell className="text-sm font-bold text-slate-600">2025-08-01 0{Math.floor(Math.random() * 9)}:00:00</TableCell>
                                                        <TableCell className="text-sm font-black text-slate-800">{(Math.random() * 100).toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center space-x-3">
                                                                <Progress value={Math.random() * 100} className="h-1.5 w-24 bg-slate-200" />
                                                                <span className={`text-[11px] font-black ${i % 3 === 0 ? 'text-green-500' : 'text-orange-500'}`}>+{(Math.random() * 5).toFixed(2)}%</span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
