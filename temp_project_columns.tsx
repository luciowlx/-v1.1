// 项目列表列定义 (Ant Design Table)
const projectColumns: any[] = [
    {
        title: '项目ID',
        dataIndex: 'id',
        key: 'id',
        width: 100,
        fixed: 'left',
    },
    {
        title: '项目名称',
        dataIndex: 'title',
        key: 'title',
        width: 200,
        render: (text: string, record: any) => (
            <div className="flex flex-col">
                <span className="font-medium text-gray-900">{text}</span>
                <span className="text-xs text-gray-500 truncate max-w-[180px]" title={record.description}>{record.description}</span>
            </div>
        ),
    },
    {
        title: '项目模式',
        dataIndex: 'mode',
        key: 'mode',
        width: 120,
    },
    {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => {
            let color = 'default';
            if (status === '进行中') color = 'processing';
            else if (status === '已归档') color = 'default';
            else if (status === '已延期') color = 'warning';
            return <Tag color={color}>{status}</Tag>;
        }
    },
    {
        title: '数据集',
        dataIndex: ['stats', 'datasets'],
        key: 'stats_datasets',
        width: 100,
    },
    {
        title: '模型',
        dataIndex: ['stats', 'models'],
        key: 'stats_models',
        width: 100,
    },
    {
        title: '任务',
        dataIndex: ['stats', 'tasks'],
        key: 'stats_tasks',
        width: 100,
    },
    {
        title: '负责人',
        dataIndex: 'owner',
        key: 'owner',
        width: 120,
        render: (text: string) => (
            <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600">
                    {text.charAt(0)}
                </div>
                <span>{text}</span>
            </div>
        )
    },
    {
        title: '项目周期',
        dataIndex: 'projectCycle',
        key: 'projectCycle',
        width: 200,
        render: (text: string) => <div className="text-xs text-gray-500">{text}</div>
    },
    {
        title: '创建时间',
        dataIndex: 'createdTime',
        key: 'createdTime',
        width: 150,
        sorter: (a: any, b: any) => a.createdTime.localeCompare(b.createdTime),
        render: (text: string) => <div className="text-xs text-gray-500">{text}</div>
    },
    {
        title: '更新时间',
        dataIndex: 'updatedTime',
        key: 'updatedTime',
        width: 150,
        sorter: (a: any, b: any) => a.updatedTime.localeCompare(b.updatedTime),
        render: (text: string) => <div className="text-xs text-gray-500">{text}</div>
    },
    {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 120,
        render: (_: any, record: any) => (
            <div className="flex items-center gap-2">
                <Tooltip title="查看详情">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleViewProjectDetails(record)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                </Tooltip>
                <Tooltip title="管理项目">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleManageProject(record)}>
                        <Settings className="h-4 w-4" />
                    </Button>
                </Tooltip>
            </div>
        ),
    },
];
