import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
    TrendingUp,
    Database,
    Target,
    Cpu,
    Plus,
    ArrowRight,
    Activity,
    Clock,
    CheckCircle,
    AlertCircle,
    Folder,
    BarChart3,
    Zap,
    GitBranch
} from 'lucide-react';

/**
 * Dashboard 组件 Props 接口
 * 用于定义从系统总览页跳转到其他模块的回调函数
 */
interface DashboardProps {
    /** 跳转到项目管理并打开创建项目对话框 */
    onNavigateToProjectManagement?: () => void;
    /** 跳转到数据资产并打开上传对话框 */
    onNavigateToDataManagement?: () => void;
    /** 跳转到决策推理并打开创建任务对话框 */
    onNavigateToTaskManagement?: () => void;
    /** 跳转到模型管理并打开模型微调 */
    onNavigateToModelManagement?: () => void;
    /** 跳转到因果洞察 */
    onNavigateToCausalInsight?: () => void;
    /** 打开活动中心 */
    onOpenActivityCenter?: () => void;
    /** 跳转到项目管理总览 */
    onNavigateToProjectOverview?: () => void;
}

/**
 * Dashboard 系统总览组件
 * 功能：展示系统概览信息，包括统计数据、快捷操作入口和最近活动
 */
export const Dashboard: React.FC<DashboardProps> = ({
    onNavigateToProjectManagement,
    onNavigateToDataManagement,
    onNavigateToTaskManagement,
    onNavigateToModelManagement,
    onNavigateToCausalInsight,
    onOpenActivityCenter,
    onNavigateToProjectOverview
}) => {
    // 模拟统计数据
    const stats = [
        { label: '项目总数', value: '12', icon: Folder, color: 'bg-blue-100 text-blue-600', trend: '+2 本周' },
        { label: '数据资产', value: '48', icon: Database, color: 'bg-green-100 text-green-600', trend: '+8 本周' },
        { label: '决策推理', value: '5', icon: Activity, color: 'bg-orange-100 text-orange-600', trend: '3 排队中' },
        { label: '因果洞察', value: '23', icon: GitBranch, color: 'bg-purple-100 text-purple-600', trend: '+5 本周' },
    ];

    // 快捷操作入口
    const quickActions = [
        { label: '创建项目', icon: Plus, description: '新建机器学习项目', onClick: onNavigateToProjectManagement },
        { label: '上传数据', icon: Database, description: '上传或导入数据集', onClick: onNavigateToDataManagement },
        { label: '决策推理', icon: Target, description: '创建新的决策推理任务', onClick: onNavigateToTaskManagement },
        { label: '因果洞察', icon: GitBranch, description: '探索数据因果关系', onClick: onNavigateToCausalInsight },
    ];

    // 最近项目
    const recentProjects = [
        { name: '钢铁缺陷预测', status: '进行中', progress: 75, updatedAt: '2小时前' },
        { name: '电力能源预测', status: '已完成', progress: 100, updatedAt: '1天前' },
        { name: '工艺时序预测', status: '进行中', progress: 45, updatedAt: '3天前' },
    ];

    // 最近活动
    const recentActivities = [
        { action: '任务完成', target: '销售预测模型训练', time: '10分钟前', status: 'success' },
        { action: '数据上传', target: '2024年Q4销售数据.csv', time: '1小时前', status: 'success' },
        { action: '任务失败', target: '客户流失预测', time: '2小时前', status: 'error' },
        { action: '模型部署', target: 'XGBoost-v2.1', time: '5小时前', status: 'success' },
    ];

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">系统总览</h1>
                <p className="text-gray-600">欢迎回来！这是您的数据分析平台概览</p>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                    <p className="text-xs text-gray-400 mt-1">{stat.trend}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 快捷操作 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        快捷操作
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group text-left"
                            >
                                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                    <action.icon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{action.label}</p>
                                    <p className="text-sm text-gray-500">{action.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 两栏布局：最近项目 + 最近活动 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 最近项目 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Folder className="h-5 w-5 text-blue-500" />
                            最近项目
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={onNavigateToProjectOverview} className="text-blue-600 hover:text-blue-700">
                            查看全部 <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentProjects.map((project, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${project.status === '已完成' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                        <div>
                                            <p className="font-medium text-gray-900">{project.name}</p>
                                            <p className="text-sm text-gray-500">{project.updatedAt}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${project.status === '已完成' ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600">{project.progress}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 最近活动 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-green-500" />
                            最近活动
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={onOpenActivityCenter} className="text-blue-600 hover:text-blue-700">
                            查看全部 <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivities.map((activity, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                                    <div className={`p-1.5 rounded-full ${activity.status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                                        {activity.status === 'success' ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-red-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">
                                            <span className="font-medium">{activity.action}</span>
                                            <span className="text-gray-500"> - </span>
                                            {activity.target}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {activity.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 因果洞察入口卡片 */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 rounded-lg">
                                <GitBranch className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">因果洞察</h3>
                                <p className="text-sm text-gray-600">探索数据之间的因果关系，发现隐藏的业务洞察</p>
                            </div>
                        </div>
                        <Button onClick={onNavigateToCausalInsight} className="bg-indigo-600 hover:bg-indigo-700">
                            开始探索 <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
