import React, { useState } from 'react';
import {
    ChevronLeft,
    Play,
    Square,
    MoreHorizontal,
    Copy,
    Edit2,
    Info,
    RefreshCw,
    Search,
    Clock,
    CheckCircle2,
    AlertCircle,
    HardDrive,
    Tag,
    Activity,
    Lock,
    Plus,
    Terminal,
    Code,
    ChevronDown,
    ExternalLink,
    CloudUpload
} from 'lucide-react';
import {
    Button,
    Badge,
    Tabs,
    Table,
    Card,
    Divider,
    Switch,
    Tooltip,
    message,
    Space,
    Typography,
    Descriptions,
    Tag as AntTag,
    Dropdown,
    MenuProps,
    Input,
    Modal
} from 'antd';

const { Text } = Typography;

/**
 * Notebook 详情页组件
 * 功能：
 * - 展示实例详细配置
 * - 管理 SSH 远程连接开关
 * - 查看实例事件日志
 * - 执行启停操作
 */
export function NotebookDetail({
    instance,
    onBack,
    onStart,
    onStop,
    onConnect,
    onUpdateDescription
}: {
    instance: any,
    onBack: () => void,
    onStart: (id: string) => void,
    onStop: (id: string) => void,
    onConnect: (instance: any, type: 'jupyter' | 'vscode' | 'ssh') => void,
    onUpdateDescription: (id: string, description: string) => void
}) {
    const [isSshEnabled, setIsSshEnabled] = useState(instance.sshEnabled || false);
    const [activeTab, setActiveTab] = useState('events');
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [tempDesc, setTempDesc] = useState(instance.description || '');
    const [isAddObsOpen, setIsAddObsOpen] = useState(false);

    // 模拟事件日志数据
    const eventLogs = [
        {
            key: '1',
            name: 'StopNotebook',
            level: 'Important',
            detail: `User "admin" stops the notebook instance.`,
            time: '2025/12/23 17:27:26 GMT+08:00'
        },
        {
            key: '2',
            name: 'NotebookHealthy',
            level: 'Prompt',
            detail: 'The instance is running and healthy.',
            time: '2025/12/23 17:11:28 GMT+08:00'
        },
        {
            key: '3',
            name: 'Scheduled',
            level: 'Prompt',
            detail: 'The resource cluster starts to create a notebook instance.',
            time: '2025/12/23 17:10:58 GMT+08:00'
        }
    ];

    const eventColumns = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <span className="font-medium">{text}</span>
        },
        {
            title: '事件级别',
            dataIndex: 'level',
            key: 'level',
            render: (level: string) => {
                let color = 'blue';
                let label = '提示';
                if (level === 'Important') {
                    color = 'orange';
                    label = '重要';
                }
                return (
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-${color}-500`} />
                        <span>{label}</span>
                    </div>
                );
            }
        },
        {
            title: '事件详情',
            dataIndex: 'detail',
            key: 'detail',
            render: (text: string) => <span className="text-slate-500">{text}</span>
        },
        {
            title: '发生时间',
            dataIndex: 'time',
            key: 'time',
            render: (text: string) => <span className="text-slate-400 text-xs">{text}</span>
        }
    ];

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success('已复制到剪贴板');
    };

    return (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col overflow-hidden">
            {/* 顶部面包屑与标题 */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <span>AI开发平台ModelArts</span>
                    <span>/</span>
                    <span>Notebook</span>
                    <span>/</span>
                    <span className="text-slate-600">{instance.id}</span>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button
                            type="text"
                            icon={<ChevronLeft className="w-4 h-4" />}
                            onClick={onBack}
                            className="hover:bg-slate-100"
                        />
                        <h1 className="text-xl font-bold text-slate-800 m-0">{instance.name}</h1>
                    </div>
                    <Space size="middle">
                        {instance.status === 'Stopped' || instance.status === 'Failed' ? (
                            <Button
                                type="primary"
                                icon={<Play className="w-4 h-4" />}
                                onClick={() => onStart(instance.id)}
                            >
                                启动
                            </Button>
                        ) : instance.status === 'Running' ? (
                            <>
                                <Dropdown
                                    menu={{
                                        items: [
                                            {
                                                key: 'jupyter',
                                                label: 'JupyterLab 直连',
                                                icon: <ExternalLink className="w-4 h-4" />,
                                                onClick: () => onConnect(instance, 'jupyter')
                                            },
                                            {
                                                key: 'vscode',
                                                label: 'VS Code 远程连接',
                                                icon: <Code className="w-4 h-4" />,
                                                onClick: () => onConnect(instance, 'vscode')
                                            },
                                            {
                                                key: 'ssh',
                                                label: 'SSH 终端',
                                                icon: <Terminal className="w-4 h-4" />,
                                                onClick: () => onConnect(instance.id, 'ssh')
                                            }
                                        ]
                                    }}
                                    trigger={['click']}
                                >
                                    <Button type="primary">
                                        连接 <ChevronDown className="w-3 h-3 ml-1" />
                                    </Button>
                                </Dropdown>
                                <Button
                                    danger
                                    icon={<Square className="w-4 h-4" />}
                                    onClick={() => onStop(instance.id)}
                                >
                                    停止
                                </Button>
                            </>
                        ) : (
                            <Button disabled>
                                处理中...
                            </Button>
                        )}
                        <Button icon={<MoreHorizontal className="w-4 h-4" />} />
                        <Button
                            icon={<RefreshCw className="w-4 h-4" />}
                            onClick={() => message.success('已刷新实例状态')}
                        />
                    </Space>
                </div>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-slate-50">
                {/* 基本信息卡片 */}
                <Card className="shadow-sm">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="名称">
                                <div className="flex items-center gap-2">
                                    <span>{instance.name}</span>
                                    <Edit2 className="w-3 h-3 text-slate-400 cursor-pointer hover:text-blue-500" />
                                </div>
                            </Descriptions.Item>
                            <Descriptions.Item label="状态">
                                <Space>
                                    <Badge
                                        status={instance.status === 'Running' ? 'success' : 'default'}
                                        text={instance.status === 'Running' ? '运行中' : '已停止'}
                                    />
                                    {instance.status === 'Stopping' && <span className="text-xs text-slate-400">正在停止...</span>}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="ID">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs">{instance.id}</span>
                                    <Copy
                                        className="w-3 h-3 text-slate-400 cursor-pointer hover:text-blue-500"
                                        onClick={() => handleCopy(instance.id)}
                                    />
                                </div>
                            </Descriptions.Item>
                            <Descriptions.Item label="存储路径">
                                <span className="font-mono text-xs">/home/ma-user/work/</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="存储容量">
                                <span>5 GB (本地硬盘)</span>
                            </Descriptions.Item>
                        </Descriptions>

                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="实例规格">
                                <span className="text-slate-700">{instance.spec}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="镜像">
                                <span className="text-slate-600 truncate max-w-[300px]" title={instance.image}>{instance.image}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="创建时间">
                                <span className="text-slate-500">2025/12/23 17:10:30 GMT+08:00</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="更新时间">
                                <span className="text-slate-500">2025/12/23 17:27:26 GMT+08:00</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="描述">
                                {isEditingDesc ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <Input
                                            size="small"
                                            value={tempDesc}
                                            onChange={(e) => setTempDesc(e.target.value)}
                                            onPressEnter={() => {
                                                onUpdateDescription(instance.id, tempDesc);
                                                setIsEditingDesc(false);
                                            }}
                                            autoFocus
                                            className="max-w-[200px]"
                                        />
                                        <Button
                                            size="small"
                                            type="primary"
                                            onClick={() => {
                                                onUpdateDescription(instance.id, tempDesc);
                                                setIsEditingDesc(false);
                                            }}
                                        >
                                            保存
                                        </Button>
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                setIsEditingDesc(false);
                                                setTempDesc(instance.description || '');
                                            }}
                                        >
                                            取消
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-600">{instance.description || '--'}</span>
                                        <Edit2
                                            className="w-3 h-3 text-slate-400 cursor-pointer hover:text-blue-500"
                                            onClick={() => setIsEditingDesc(true)}
                                        />
                                    </div>
                                )}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                </Card>

                {/* SSH 远程开发设置 */}
                <Card className="shadow-sm" size="small">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700">SSH远程开发</span>
                                <Switch
                                    size="small"
                                    checked={isSshEnabled}
                                    onChange={(checked) => setIsSshEnabled(checked)}
                                />
                            </div>
                            {isSshEnabled && (
                                <>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-slate-500">地址</span>
                                        <Text copyable className="font-mono text-xs">192.168.1.100:30022</Text>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-slate-500">认证</span>
                                        <div className="flex items-center gap-1">
                                            <AntTag icon={<Lock className="w-3 h-3" />} color="blue">KeyPair-e5d9</AntTag>
                                            <Edit2 className="w-3 h-3 text-slate-400 cursor-pointer hover:text-blue-500" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </Card>

                {/* 底部 Tab 页 */}
                <Card className="shadow-sm flex-1 min-h-[400px]">
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={[
                            {
                                key: 'storage',
                                label: (
                                    <span className="flex items-center gap-2">
                                        <HardDrive className="w-4 h-4" />
                                        存储配置
                                    </span>
                                ),
                                children: (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="text-slate-500 text-sm">外部存储挂载</div>
                                            <Button
                                                type="primary"
                                                icon={<CloudUpload className="w-4 h-4" />}
                                                onClick={() => setIsAddObsOpen(true)}
                                            >
                                                添加 OBS
                                            </Button>
                                        </div>
                                        <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-slate-400 text-sm m-0">暂无外部存储挂载信息</p>
                                        </div>

                                        <Modal
                                            title="添加 OBS 存储"
                                            open={isAddObsOpen}
                                            onOk={() => {
                                                message.success('OBS 存储挂载下发成功');
                                                setIsAddObsOpen(false);
                                            }}
                                            onCancel={() => setIsAddObsOpen(false)}
                                            okText="确定"
                                            cancelText="取消"
                                        >
                                            <div className="space-y-4 py-2">
                                                <div>
                                                    <div className="text-xs text-slate-500 mb-1">OBS 路径</div>
                                                    <Input placeholder="例如：obs://bucket/path/" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 mb-1">挂载目录</div>
                                                    <Input placeholder="例如：/home/ma-user/work/obs/" />
                                                </div>
                                            </div>
                                        </Modal>
                                    </div>
                                )
                            },
                            {
                                key: 'events',
                                label: (
                                    <span className="flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        事件记录
                                    </span>
                                ),
                                children: (
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-4">
                                                <Button icon={<Search className="w-4 h-4" />}>过滤</Button>
                                                <div className="text-slate-400 text-xs">
                                                    展示近 24 小时内的关键调度与生命周期事件
                                                </div>
                                            </div>
                                            <Button type="text" icon={<RefreshCw className="w-4 h-4" />}>刷新</Button>
                                        </div>
                                        <Table
                                            columns={eventColumns}
                                            dataSource={eventLogs}
                                            pagination={false}
                                            size="middle"
                                        />
                                    </div>
                                )
                            },
                            {
                                key: 'tags',
                                label: (
                                    <span className="flex items-center gap-2">
                                        <Tag className="w-4 h-4" />
                                        标签
                                    </span>
                                ),
                                children: (
                                    <div className="py-4 flex flex-wrap gap-2">
                                        <AntTag closable onClose={(e) => e.preventDefault()}>Dept: Research</AntTag>
                                        <AntTag closable onClose={(e) => e.preventDefault()}>Env: Development</AntTag>
                                        <Button size="small" type="dashed" icon={<Plus className="w-3 h-3" />}>添加标签</Button>
                                    </div>
                                )
                            }
                        ]}
                    />
                </Card>
            </div>
        </div>
    );
}
