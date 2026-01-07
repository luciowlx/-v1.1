/**
 * 因果洞察 Mock 数据
 */

export interface CausalInsightTask {
    id: string;
    name: string;
    description?: string;
    projectId: string;
    sourceDecisionTaskId: string;
    sourceDecisionTaskName: string;
    datasetSnapshotId: string;
    xSpec: {
        mode: 'explicit' | 'rule';
        fields: string[];
    };
    ySpec: {
        field: string;
        filterType: 'Temporal' | 'Numeric' | 'Categorical' | 'Derived';
    };
    filters: any;
    status: 'DRAFT' | 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
    progress: number;
    sampleTotal: number;
    sampleHit: number;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    lastRunAt?: string;
    errorMessage?: string;
}

export const mockCITasks: CausalInsightTask[] = [
    {
        id: 'CI-001',
        name: '销售波动原因深挖-2024Q1',
        description: '针对 2024 年第一季度销售下降的深度因果分析',
        projectId: 'proj_003',
        sourceDecisionTaskId: 'TASK-001',
        sourceDecisionTaskName: '销售数据预测模型训练',
        datasetSnapshotId: 'SNAP-001',
        xSpec: {
            mode: 'explicit',
            fields: ['气温', '促销活动力度', '节假日因子']
        },
        ySpec: {
            field: '销售额',
            filterType: 'Numeric'
        },
        filters: {
            and: [
                { field: 'Time', op: 'BETWEEN', value: ['2024-01-01', '2024-03-31'] }
            ]
        },
        status: 'SUCCEEDED',
        progress: 100,
        sampleTotal: 10000,
        sampleHit: 2450,
        createdAt: '2024-01-16 10:00:00',
        createdBy: '张三',
        updatedAt: '2024-01-16 10:05:00',
        lastRunAt: '2024-01-16 10:05:00'
    },
    {
        id: 'CI-002',
        name: '高流失风险客户场景特征分析',
        description: '分析南方地区高价值流失客户的因果特征',
        projectId: 'proj_004',
        sourceDecisionTaskId: 'TASK-004',
        sourceDecisionTaskName: '客户流失预测',
        datasetSnapshotId: 'SNAP-002',
        xSpec: {
            mode: 'explicit',
            fields: ['服务投诉次数', '到期时间', '竞品活跃度']
        },
        ySpec: {
            field: '流失概率',
            filterType: 'Numeric'
        },
        filters: {
            and: [
                { field: '地区', op: 'EQ', value: '南方' },
                { field: '用户等级', op: 'IN', value: ['V4', 'V5'] }
            ]
        },
        status: 'RUNNING',
        progress: 45,
        sampleTotal: 50000,
        sampleHit: 1200,
        createdAt: '2024-01-17 09:00:00',
        createdBy: '张三',
        updatedAt: '2024-01-17 09:10:00'
    },
    {
        id: 'CI-003',
        name: '华东区电力负荷异常归因',
        description: '探索极端天气与工业用电对负荷异常波动的联合影响',
        projectId: 'proj_005',
        sourceDecisionTaskId: 'TASK-001',
        sourceDecisionTaskName: '销售数据预测模型训练',
        datasetSnapshotId: 'SNAP-003',
        xSpec: {
            mode: 'explicit',
            fields: ['Temperature', 'Holiday_Factor', 'Region', 'Promotion_Intensity']
        },
        ySpec: {
            field: 'Power_Generation',
            filterType: 'Numeric'
        },
        filters: {
            and: [
                { field: 'Region', op: 'EQ', value: '华东' }
            ]
        },
        status: 'FAILED',
        progress: 80,
        sampleTotal: 12000,
        sampleHit: 3500,
        createdAt: '2024-01-18 14:30:00',
        createdBy: '李四',
        updatedAt: '2024-01-18 14:35:00',
        errorMessage: 'Error: Calculation Timeout\nDetail: The causal inference engine exceeded the maximum execution time limit (300s). This usually happens when the feature space is too large or the sample size is huge.\n\nSuggestion: Try reducing the number of X variables or applying stricter filters.'
    },
    {
        id: 'CI-004',
        name: '新品上市销量影响评估 (草稿)',
        description: '待完善配置：需要确认竞品数据的完整性',
        projectId: 'proj_006',
        sourceDecisionTaskId: 'TASK-004',
        sourceDecisionTaskName: '客户流失预测',
        datasetSnapshotId: 'SNAP-004',
        xSpec: {
            mode: 'explicit',
            fields: ['促销力度', '广告投入']
        },
        ySpec: {
            field: '销售额',
            filterType: 'Numeric'
        },
        filters: {
            and: []
        },
        status: 'DRAFT',
        progress: 0,
        sampleTotal: 0,
        sampleHit: 0,
        createdAt: '2024-01-19 10:00:00',
        createdBy: '王五',
        updatedAt: '2024-01-19 10:00:00'
    }
];

// 获取决策任务对应的字段 Schema，增加统计信息
export const getDecisionTaskSchema = (taskId: string) => {
    return {
        taskId,
        fields: [
            {
                name: 'Time', displayName: '时间', dtype: 'Temporal', filterType: 'Temporal',
                statistics: { start: '2024-01-01', end: '2024-12-31' }
            },
            {
                name: 'Power_Generation', displayName: '发电量', dtype: 'FLOAT64', filterType: 'Numeric',
                statistics: { min: 120.5, max: 980.2, avg: 540.3, distribution: [200, 350, 450, 400, 300, 150] }
            },
            {
                name: 'Temperature', displayName: '气温', dtype: 'FLOAT64', filterType: 'Numeric',
                statistics: { min: -15.0, max: 38.5, avg: 12.5, distribution: [50, 120, 300, 280, 150, 60] }
            },
            {
                name: 'Holiday_Factor', displayName: '节假日因子', dtype: 'INT64', filterType: 'Categorical',
                statistics: { options: ['工作日', '周末', '小长假', '黄金周'] }
            },
            {
                name: 'Region', displayName: '地区', dtype: 'STRING', filterType: 'Categorical',
                statistics: { options: ['华北', '华东', '华南', '西南', '西北'] }
            },
            {
                name: 'Promotion_Intensity', displayName: '促销力度', dtype: 'FLOAT64', filterType: 'Numeric',
                statistics: { min: 0, max: 1.0, avg: 0.3 }
            },
            {
                name: 'Churn_Rate', displayName: '流失概率', dtype: 'FLOAT64', filterType: 'Numeric',
                statistics: { min: 0, max: 1.0, avg: 0.15 }
            },
            {
                name: 'Sales_Volume', displayName: '销售额', dtype: 'FLOAT64', filterType: 'Numeric',
                statistics: { min: 1000, max: 50000, avg: 24500 }
            }
        ]
    };
};

// 模拟导出结果数据
export const getCausalResultData = (taskId: string) => {
    const features = ['气温', '促销活动力度', '节假日因子', '地区', '发电量', '销售额', '流失概率', '降雨量', '竞品价格', '品牌知名度'];
    const timeLabels = Array.from({ length: 20 }).map((_, i) => `2024-01-${(i + 1).toString().padStart(2, '0')} 00:00:00`);

    return {
        heatmap: {
            timeLabels,
            features,
            values: timeLabels.map(() => features.map(() => (Math.random() * 4 - 2).toFixed(2)))
        },
        barChart: [
            { feature: '节假日因子', score: 0.85, direction: 'positive' },
            { feature: '气温', score: 0.62, direction: 'positive' },
            { feature: '品牌知名度', score: 0.45, direction: 'positive' },
            { feature: '销售额', score: 0.15, direction: 'positive' },
            { feature: '促销活动力度', score: -0.45, direction: 'negative' },
            { feature: '竞品价格', score: -0.68, direction: 'negative' },
            { feature: '降雨量', score: -0.32, direction: 'negative' },
            { feature: '地区', score: -0.12, direction: 'negative' },
            { feature: '发电量', score: 0.28, direction: 'positive' },
            { feature: '流失概率', score: -0.55, direction: 'negative' }
        ]
    };
};
