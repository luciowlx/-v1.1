import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Play,
    Square,
    Trash2,
    Link as LinkIcon,
    ExternalLink,
    Terminal,
    Code,
    Monitor,
    Clock,
    Cpu,
    HardDrive,
    Settings2,
    Info,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    ChevronDown,
    Copy,
    ChevronRight,
    Upload,
    RefreshCw,
    FileText
} from 'lucide-react';
import { Table, Button, Badge, Space, Dropdown, MenuProps, Modal, Drawer, Form, Input, Select, InputNumber, Switch, Slider, Tooltip, Progress, Card, Empty, message, Popconfirm, Radio, Alert } from 'antd';
import { useLanguage } from '../i18n/LanguageContext';
import { buildNotebookDetailUrl } from '../utils/deeplink';

/**
 * Notebook 实例类型定义
 */
interface NotebookInstance {
    id: string;
    name: string;
    status: 'Running' | 'Stopped' | 'Starting' | 'Stopping' | 'Failed';
    image: string;
    spec: string;
    runtime: string;
    sshEnabled: boolean;
    autoStopHours: number;
    lastSyncTime: string;
    url: string;
    sshCommand: string;
    createdAt: string;
    creator: string;
}

/**
 * Notebook 列表及管理组件
 */
export function NotebookManagement({ onOpenDetail, onConnect }: { onOpenDetail?: (instance: NotebookInstance) => void, onConnect?: (instance: NotebookInstance, type: 'jupyter' | 'vscode' | 'ssh') => void }) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [instances, setInstances] = useState<NotebookInstance[]>([]);
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [selectedInstance, setSelectedInstance] = useState<NotebookInstance | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSyncPanelOpen, setIsSyncPanelOpen] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const [form] = Form.useForm();

    // 初始化 Mock 数据
    useEffect(() => {
        const mockData: NotebookInstance[] = [
            {
                id: 'NB-202401',
                name: '缺陷检测模型开发',
                status: 'Running',
                image: 'PyTorch 2.1.0-CUDA 11.8',
                spec: 'NVIDIA A100 (40GB) x 1 | 12 vCPU | 64GB',
                runtime: '12h 45m',
                sshEnabled: true,
                autoStopHours: 4,
                lastSyncTime: '2024-01-22 10:30:00',
                url: 'https://jupyter.limix.ai/nb-202401',
                sshCommand: 'ssh -p 30022 root@192.168.1.100 -i ~/.ssh/id_rsa',
                createdAt: '2024-01-22 08:30:00',
                creator: 'admin'
            },
            {
                id: 'NB-202402',
                name: '能源预测离散分析',
                status: 'Stopped',
                image: 'TensorFlow 2.13.0-CUDA 11.2',
                spec: '8 vCPU | 32GB',
                runtime: '-',
                sshEnabled: false,
                autoStopHours: 2,
                lastSyncTime: '2024-01-21 18:20:15',
                url: '',
                sshCommand: '',
                createdAt: '2024-01-21 10:20:15',
                creator: '王小明'
            },
            {
                id: 'NB-202403',
                name: '工艺优化强化学习',
                status: 'Stopped',
                image: 'PyTorch 2.0.1-CUDA 11.7',
                spec: 'NVIDIA T4 x 1 | 8 vCPU | 32GB',
                runtime: '-',
                sshEnabled: true,
                autoStopHours: 8,
                lastSyncTime: '2024-01-20 09:15:00',
                url: '',
                sshCommand: '',
                createdAt: '2024-01-20 09:00:00',
                creator: '李华'
            },
            {
                id: 'NB-202404',
                name: 'Llama-2 微调实验室',
                status: 'Starting',
                image: 'PyTorch 2.1.0-CUDA 12.1',
                spec: 'NVIDIA H100 (80GB) x 2 | 24 vCPU | 128GB',
                runtime: '2m',
                sshEnabled: true,
                autoStopHours: 12,
                lastSyncTime: '-',
                url: '',
                sshCommand: '',
                createdAt: '2024-01-23 14:30:00',
                creator: 'admin'
            },
            {
                id: 'NB-202405',
                name: '数据预处理测试',
                status: 'Running',
                image: 'Python 3.10 - Conda',
                spec: '4 vCPU | 16GB',
                runtime: '45h 12m',
                sshEnabled: false,
                autoStopHours: 0,
                lastSyncTime: '2024-01-22 10:45:30',
                url: 'https://jupyter.limix.ai/nb-202405',
                sshCommand: '',
                createdAt: '2024-01-20 15:45:30',
                creator: '张三'
            }
        ];
        setInstances(mockData);
    }, []);

    /**
     * 启动实例
     */
    const handleStart = (id: string) => {
        message.loading({ content: '正在启动 Notebook 实例...', key: 'status_change' });
        setTimeout(() => {
            setInstances(prev => prev.map(inst =>
                inst.id === id ? { ...inst, status: 'Running', runtime: '1m', url: `https://jupyter.limix.ai/${inst.id.toLowerCase()}` } : inst
            ));
            message.success({ content: '实例启动成功', key: 'status_change' });
        }, 1500);
    };

    /**
     * 停止实例
     */
    const handleStop = (id: string) => {
        Modal.confirm({
            title: '停止Notebook实例',
            icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
            content: (
                <div className="mt-2 text-slate-600">
                    <p>Notebook停止后：</p>
                    <p>/home/ma-user/work目录下的数据会保存，其余目录下内容会被清理。</p>
                </div>
            ),
            okText: '停止',
            cancelText: '取消',
            onOk: () => {
                message.loading({ content: '正在停止实例...', key: 'status_change' });
                setTimeout(() => {
                    setInstances(prev => prev.map(inst =>
                        inst.id === id ? { ...inst, status: 'Stopped', runtime: '-' } : inst
                    ));
                    message.success({ content: '实例已停止', key: 'status_change' });
                }, 1200);
            }
        });
    };

    /**
     * 删除实例
     */
    const handleDelete = (id: string) => {
        setInstances(prev => prev.filter(inst => inst.id !== id));
        message.success('实例已删除');
    };

    /**
     * 创建或编辑实例提交
     */
    const handleCreateSubmit = () => {
        form.validateFields().then(values => {
            if (isEditing && selectedInstance) {
                // 编辑模式
                setInstances(prev => prev.map(inst =>
                    inst.id === selectedInstance.id
                        ? { ...inst, name: values.name, image: values.image, spec: values.spec === 'gpu-large' ? 'NVIDIA A100 x 1 | 12 vCPU' : (values.spec === 'gpu-small' ? 'NVIDIA T4 x 1 | 8 vCPU | 32GB' : '4 vCPU | 16GB'), autoStopHours: values.autoStop }
                        : inst
                ));
                message.success('实例配置更新成功');
            } else {
                // 创建模式
                const newInst: NotebookInstance = {
                    id: `NB-${Date.now().toString().slice(-6)}`,
                    name: values.name,
                    status: 'Starting',
                    image: values.image,
                    spec: values.spec === 'gpu-large' ? 'NVIDIA A100 x 1 | 12 vCPU' : (values.spec === 'gpu-small' ? 'NVIDIA T4 x 1 | 8 vCPU | 32GB' : '4 vCPU | 16GB'),
                    runtime: '0s',
                    sshEnabled: values.enableSsh,
                    autoStopHours: values.autoStop,
                    lastSyncTime: '-',
                    url: '',
                    sshCommand: values.enableSsh ? 'ssh -p 30022 root@192.168.1.100' : '',
                    createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
                    creator: 'admin' // 默认当前用户
                };
                setInstances([newInst, ...instances]);
                message.success('创建任务下发成功');

                // 模拟 3 秒后变为运行中
                setTimeout(() => {
                    setInstances(prev => prev.map(inst =>
                        inst.id === newInst.id ? { ...inst, status: 'Running', url: `https://jupyter.limix.ai/${inst.id.toLowerCase()}` } : inst
                    ));
                }, 3000);
            }

            setIsCreateDrawerOpen(false);
            form.resetFields();
            setIsEditing(false);
        });
    };

    // 表格列定义
    const columns: any[] = [
        {
            title: '实例名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text: string, record: NotebookInstance) => (
                <div className="flex flex-col">
                    <a
                        href={buildNotebookDetailUrl(record.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline hover:text-blue-700 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        {text}
                    </a>
                    <span className="text-xs text-slate-400">ID: {record.id}</span>
                </div>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            filters: [
                { text: '运行中', value: 'Running' },
                { text: '已停止', value: 'Stopped' },
                { text: '启动中', value: 'Starting' },
                { text: '停止中', value: 'Stopping' },
                { text: '失败', value: 'Failed' },
            ],
            onFilter: (value: any, record: NotebookInstance) => record.status === value,
            render: (status: string) => {
                let color = 'default';
                let label = status;
                if (status === 'Running') { color = 'success'; label = '运行中'; }
                else if (status === 'Stopped') { color = 'default'; label = '已停止'; }
                else if (status === 'Starting') { color = 'processing'; label = '启动中'; }
                else if (status === 'Stopping') { color = 'warning'; label = '停止中'; }
                else if (status === 'Failed') { color = 'error'; label = '失败'; }
                return <Badge status={color as any} text={label} />;
            },
        },
        {
            title: '资源规格',
            dataIndex: 'spec',
            key: 'spec',
            width: 200,
            sorter: (a: NotebookInstance, b: NotebookInstance) => a.spec.localeCompare(b.spec),
            render: (text: string) => (
                <div className="flex items-center gap-2">
                    {text.includes('GPU') ? <Badge color="purple" count="GPU" size="small" style={{ fontSize: '10px' }} /> : <Badge color="blue" count="CPU" size="small" style={{ fontSize: '10px' }} />}
                    <span className="text-xs overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]" title={text}>{text}</span>
                </div>
            ),
        },
        {
            title: '基础镜像',
            dataIndex: 'image',
            key: 'image',
            width: 180,
            sorter: (a: NotebookInstance, b: NotebookInstance) => a.image.localeCompare(b.image),
            render: (text: string) => <span className="text-xs text-slate-600">{text}</span>,
        },
        {
            title: '运行时间',
            dataIndex: 'runtime',
            key: 'runtime',
            width: 100,
            render: (text: string) => <div className="flex items-center gap-1 text-xs"><Clock className="w-3 h-3" /> {text}</div>,
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            sorter: (a: NotebookInstance, b: NotebookInstance) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            render: (text: string) => <span className="text-xs text-slate-500">{text}</span>,
        },
        {
            title: '创建人',
            dataIndex: 'creator',
            key: 'creator',
            width: 120,
            filters: [
                { text: 'admin', value: 'admin' },
                { text: '王小明', value: '王小明' },
                { text: '李华', value: '李华' },
                { text: '张三', value: '张三' },
            ],
            onFilter: (value: any, record: NotebookInstance) => record.creator === value,
            render: (text: string) => <span className="text-xs text-slate-500">{text}</span>,
        },
        {
            title: 'SSH 状态',
            dataIndex: 'sshEnabled',
            key: 'sshEnabled',
            width: 100,
            render: (enabled: boolean) => (
                enabled ? <Badge status="success" text="已开启" /> : <Badge status="default" text="未开启" />
            ),
        },
        {
            title: '操作',
            key: 'actions',
            fixed: 'right',
            width: 180,
            render: (_: any, record: NotebookInstance) => (
                <Space size="middle">
                    {record.status === 'Stopped' ? (
                        <Button type="link" size="small" icon={<Play className="w-3 h-3" />} onClick={() => handleStart(record.id)}>启动</Button>
                    ) : record.status === 'Running' ? (
                        <>
                            <Dropdown
                                menu={{
                                    items: [
                                        {
                                            key: 'jupyter',
                                            label: 'JupyterLab 直连',
                                            icon: <ExternalLink className="w-4 h-4" />,
                                            onClick: () => {
                                                onConnect?.(record, 'jupyter');
                                            }
                                        },
                                        {
                                            key: 'vscode',
                                            label: 'VS Code 远程连接',
                                            icon: <Code className="w-4 h-4" />,
                                            onClick: () => {
                                                onConnect?.(record, 'vscode');
                                            }
                                        },
                                        {
                                            key: 'ssh',
                                            label: 'SSH 终端',
                                            icon: <Terminal className="w-4 h-4" />,
                                            onClick: () => {
                                                onConnect?.(record, 'ssh');
                                            }
                                        }
                                    ]
                                }}
                            >
                                <Button type="primary" size="small">连接 <ChevronDown className="w-3 h-3 ml-1" /></Button>
                            </Dropdown>
                            <Button type="link" size="small" danger icon={<Square className="w-3 h-3" />} onClick={() => handleStop(record.id)}>停止</Button>
                        </>
                    ) : (
                        <Button type="link" size="small" disabled>处理中...</Button>
                    )}

                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'edit',
                                    label: '修改配置',
                                    icon: <Settings2 className="w-4 h-4" />,
                                    disabled: record.status !== 'Stopped',
                                    onClick: () => {
                                        setIsEditing(true);
                                        setSelectedInstance(record);
                                        // 转换规格值以适配 Select
                                        let specValue = 'cpu-med';
                                        if (record.spec.includes('A100')) specValue = 'gpu-large';
                                        else if (record.spec.includes('T4')) specValue = 'gpu-small';

                                        form.setFieldsValue({
                                            name: record.name,
                                            image: record.image.includes('PyTorch 2.1') ? 'pt2.1' : (record.image.includes('TensorFlow') ? 'tf2.13' : 'py3.10'),
                                            spec: specValue,
                                            autoStop: record.autoStopHours
                                        });
                                        setIsCreateDrawerOpen(true);
                                    }
                                },
                                {
                                    key: 'sync',
                                    label: '数据同步审计',
                                    icon: <RefreshCw className="w-4 h-4" />,
                                    onClick: () => {
                                        message.loading({ content: '正在扫描实例数据...', key: 'sync_audit' });
                                        setTimeout(() => {
                                            message.success({ content: '已完成数据一致性扫描，同步审计日志已更新。', key: 'sync_audit' });
                                        }, 1500);
                                    }
                                },
                                {
                                    type: 'divider'
                                },
                                {
                                    key: 'delete',
                                    label: '删除',
                                    icon: <Trash2 className="w-4 h-4" />,
                                    danger: true,
                                    onClick: () => {
                                        Modal.confirm({
                                            title: '确认删除 Notebook 实例',
                                            content: `您确定要删除“${record.name}”吗？删除后，系统盘中的所有数据都将丢失，且不可恢复。`,
                                            okText: '确定删除',
                                            cancelText: '取消',
                                            okButtonProps: { danger: true },
                                            onOk: () => handleDelete(record.id)
                                        });
                                    }
                                }
                            ]
                        }}
                    >
                        <Button type="text" size="small" icon={<MoreVertical className="w-4 h-4" />} />
                    </Dropdown>
                </Space >
            ),
        },
    ];

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* 顶部统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card size="small" className="shadow-sm border-none">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs mb-1">实例总数</p>
                            <h3 className="text-2xl font-bold text-slate-800">{instances.length}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Monitor className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                </Card>
                <Card size="small" className="shadow-sm border-none">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs mb-1">运行中</p>
                            <h3 className="text-2xl font-bold text-green-600">
                                {instances.filter(i => i.status === 'Running').length}
                            </h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg">
                            <Play className="w-5 h-5 text-green-500" />
                        </div>
                    </div>
                </Card>
                <Card size="small" className="shadow-sm border-none">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs mb-1">GPU 使用</p>
                            <h3 className="text-2xl font-bold text-purple-600">
                                {instances.filter(i => i.status === 'Running' && i.spec.includes('GPU')).length} / 2
                            </h3>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Cpu className="w-5 h-5 text-purple-500" />
                        </div>
                    </div>
                </Card>
                <Card size="small" className="shadow-sm border-none">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs mb-1">本月运行时长</p>
                            <h3 className="text-2xl font-bold text-slate-800">128.5h</h3>
                        </div>
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <Clock className="w-5 h-5 text-slate-500" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* 主操作区域 */}
            <Card className="shadow-sm border-none" bodyStyle={{ padding: '0px' }}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-lg">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-slate-800 m-0">Notebook 开发实例</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="搜索实例名称/ID..."
                                className="pl-9 w-64"
                                variant="filled"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <Space>
                        {!isSyncPanelOpen && (
                            <Button
                                icon={<RefreshCw className="w-4 h-4 text-blue-500" />}
                                onClick={() => setIsSyncPanelOpen(true)}
                            >
                                显示同步状态
                            </Button>
                        )}
                        <Button
                            type="primary"
                            icon={<Plus className="w-4 h-4" />}
                            onClick={() => {
                                setIsEditing(false);
                                form.resetFields();
                                setIsCreateDrawerOpen(true);
                            }}
                            className="bg-blue-600 flex items-center"
                        >
                            新建 Notebook
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={instances.filter(i => i.name.includes(searchQuery) || i.id.includes(searchQuery))}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1300 }}
                    className="rounded-b-lg"
                    rowClassName="hover:bg-slate-50 cursor-default"
                />
            </Card>

            {/* 底部提示：数据同步说明 */}
            <div className="mt-6 bg-blue-50/50 border border-blue-100/50 p-4 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-800 mb-1">关于数据一致性同步 (特定目录映射)</h4>
                    <p className="text-xs text-blue-600 leading-relaxed m-0">
                        所有 Notebook 实例均已自动挂载项目根目录至容器内 <code>/workspace/projects</code>。
                        在该目录下产生的代码、数据集、训练结果将自动同步到 Web 系统的“项目管理”、“数据管理”和“任务管理”模块。
                        系统每 5 分钟执行一次全量扫描，以确保前端可视化看板数据的一致性。
                    </p>
                </div>
            </div>

            {/* 创建 Notebook 抽屉 */}
            <Drawer
                title={
                    <div className="flex items-center gap-2">
                        {isEditing ? <Settings2 className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-blue-500" />}
                        <span>{isEditing ? '修改 Notebook 配置' : '创建 Notebook 开发环境'}</span>
                    </div>
                }
                width={600}
                onClose={() => {
                    setIsCreateDrawerOpen(false);
                    setIsEditing(false);
                }}
                open={isCreateDrawerOpen}
                extra={
                    <Space>
                        <Button onClick={() => setIsCreateDrawerOpen(false)}>取消</Button>
                        <Button type="primary" onClick={handleCreateSubmit}>{isEditing ? '保存更改' : '下发任务'}</Button>
                    </Space>
                }
            >
                <Form form={form} layout="vertical">
                    <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Monitor className="w-4 h-4" /> 基本信息
                        </h4>
                        <Form.Item name="name" label="实例名称" rules={[{ required: true, message: '请输入实例名称' }]}>
                            <Input placeholder="例如：销售趋势预测模型开发" />
                        </Form.Item>
                        <Form.Item name="desc" label="描述">
                            <Input.TextArea placeholder="可选：描述该环境的开发用途" rows={2} />
                        </Form.Item>
                    </div>

                    <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Cpu className="w-4 h-4" /> 资源配置
                        </h4>
                        <Form.Item name="image" label="基础镜像" initialValue="pt2.1" rules={[{ required: true }]}>
                            <Select>
                                <Select.Option value="pt2.1">PyTorch 2.1.0 (CUDA 11.8)</Select.Option>
                                <Select.Option value="tf2.13">TensorFlow 2.13.0 (CUDA 11.2)</Select.Option>
                                <Select.Option value="py3.10">Python 3.10 (Standard API Library)</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="spec" label="计算规格" initialValue="cpu-med" rules={[{ required: true }]}>
                            <Select>
                                <Select.Option value="cpu-small">4 vCPU | 8GB (通用开发型)</Select.Option>
                                <Select.Option value="cpu-med">8 vCPU | 32GB (大规模数据处理型)</Select.Option>
                                <Select.Option value="gpu-small">NVIDIA T4 x 1 | 8 vCPU | 32GB</Select.Option>
                                <Select.Option value="gpu-large">NVIDIA A100 (40GB) x 1 | 12 vCPU | 64GB</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <HardDrive className="w-4 h-4" /> 存储配置
                        </h4>
                        <div className="flex gap-4">
                            <Form.Item label="内置卷大小" className="flex-1" initialValue={50}>
                                <InputNumber min={20} max={1000} className="w-full" addonAfter="GB" />
                            </Form.Item>
                            <Form.Item label="挂载 S3/MinIO" className="flex-1">
                                <Select placeholder="选择存储桶或路径">
                                    <Select.Option value="bucket-01">obs://ml-training-data/</Select.Option>
                                    <Select.Option value="bucket-02">obs://public-models/</Select.Option>
                                </Select>
                            </Form.Item>
                        </div>
                        <p className="text-xs text-slate-400 m-0">数据挂载说明：外部存储挂载不计入配额，但可能会影响读取速度。</p>
                    </div>

                    <div className="p-4 bg-orange-50/50 rounded-lg border border-orange-100">
                        <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
                            <Settings2 className="w-4 h-4" /> 高级设置
                        </h4>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">开启 SSH 服务</span>
                                <Tooltip title="开启后允许通过 VS Code 或 终端远程连接">
                                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                </Tooltip>
                            </div>
                            <Form.Item name="enableSsh" valuePropName="checked" initialValue={true} noStyle>
                                <Switch size="small" />
                            </Form.Item>
                        </div>

                        <Form.Item label="自动停止设置 (inactivity)" name="autoStop" initialValue={24}>
                            <Radio.Group buttonStyle="solid">
                                <Radio.Button value={24}>1天</Radio.Button>
                                <Radio.Button value={72}>3天</Radio.Button>
                                <Radio.Button value={168}>7天</Radio.Button>
                                <Radio.Button value={0}>长期</Radio.Button>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.autoStop !== currentValues.autoStop}>
                            {({ getFieldValue }) =>
                                getFieldValue('autoStop') === 0 ? (
                                    <div className="mb-4">
                                        <Alert
                                            message="资源占用警告"
                                            description="选择长期模式将使该实例持续占用计算资源（GPU/CPU），可能会导致其他用户无法下发任务。建议仅在大型训练作业中使用。"
                                            type="warning"
                                            showIcon
                                            icon={<AlertCircle className="w-4 h-4" />}
                                        />
                                    </div>
                                ) : null
                            }
                        </Form.Item>

                        <div className="mt-2 p-2 bg-white rounded border border-orange-100 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-orange-700 m-0">注：自动停止功能有助于节约私有算核资源，系统将自动检测 Jupyter 内核是否活跃。</p>
                        </div>
                    </div>
                </Form>
            </Drawer>


            {/* 右侧悬浮面板：文件管理与同步监控 */}
            <Drawer
                title={<span className="text-sm font-bold">文件管理与同步状态</span>}
                placement="right"
                width={320}
                closable={true}
                mask={false}
                onClose={() => setIsSyncPanelOpen(false)}
                open={isSyncPanelOpen}
                style={{ top: '64px', height: 'calc(100vh - 64px)', background: '#F8FAFC', borderLeft: '1px solid #E2E8F0' }}
                className="hidden xl:block shadow-sm"
            >
                <div className="space-y-6">
                    {/* 上传区域 */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">文件上传</h4>
                            <Badge count="2" size="small" />
                        </div>
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 bg-white text-center group cursor-pointer hover:border-blue-400 transition-colors">
                            <Upload className="w-6 h-6 text-slate-300 group-hover:text-blue-500 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 group-hover:text-slate-600 font-medium m-0">点击或拖拽上传训练文件</p>
                        </div>
                    </div>

                    {/* 上传进度 */}
                    <div className="space-y-3">
                        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-700">training_data.csv</span>
                                <span className="text-[10px] text-slate-400">45MB/s</span>
                            </div>
                            <Progress percent={78} size="small" strokeColor="#3b82f6" />
                            <p className="text-[10px] text-slate-400 text-right mt-1">剩余 12s</p>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-700">resnet_weights.pth</span>
                                <span className="text-[10px] text-green-500">已就绪</span>
                            </div>
                            <Progress percent={100} size="small" />
                        </div>
                    </div>

                    {/* 同步状态 */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">数据一致性监控</h4>
                        <div className="bg-blue-600 p-3 rounded-lg text-white shadow-md mb-2">
                            <div className="flex items-center gap-2 mb-1">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span className="text-[11px] font-bold">正在同步到项目管理...</span>
                            </div>
                            <p className="text-[10px] text-blue-100 opacity-80 m-0">正在扫描实例 NB-202401 的模型产出目录</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                <span>代码同步完成: 32 min ago</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                <span>数据集同步完成: 1 hr ago</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                        <Button block icon={<FileText className="w-3.5 h-3.5" />} size="small" className="text-xs">
                            查看审计日志
                        </Button>
                    </div>
                </div>
            </Drawer>
            {/* 仿真界面 Overlay */}
        </div>
    );
}
