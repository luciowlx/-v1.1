import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { 
  Plus, 
  Upload, 
  Zap, 
  FileText, 
  TrendingUp, 
  Database, 
  Calendar,
  Activity,
  Cpu,
  HardDrive,
  Gauge,
  Search,
  BarChart3,
  Layers,
  CheckCircle,
  ChevronRight,
  Lightbulb
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * DashboardProps
 * 描述：仪表盘组件的导航与交互回调集合。
 * 字段：
 * - onNavigateToProjectManagement?: () => void — 跳转到“项目管理”页。
 * - onNavigateToDataManagement?: () => void — 跳转到“数据管理”页。
 * - onNavigateToTaskManagement?: () => void — 跳转到“任务管理”页。
 * - onNavigateToModelManagement?: () => void — 跳转到“模型管理”页。
 * - onOpenActivityCenter?: () => void — 打开统一活动中心（通知中心的“活动”Tab）。
 * - onNavigateToProjectOverview?: () => void — 跳转到项目管理总览（不弹创建项目弹窗）。
 */
interface DashboardProps {
  onNavigateToProjectManagement?: () => void;
  onNavigateToDataManagement?: () => void;
  onNavigateToTaskManagement?: () => void;
  onNavigateToModelManagement?: () => void;
  // 新增：打开统一活动中心（通知中心的“活动”Tab）
  onOpenActivityCenter?: () => void;
  // 新增：跳转到项目管理总览（不弹创建项目弹窗）
  onNavigateToProjectOverview?: () => void;
}

/**
 * Dashboard 组件
 * 功能：展示平台的近期项目、系统状态、最近活动与快捷操作入口；
 *       在“项目状态”中统一使用“已归档”表示项目完成后的归档状态。
 * 参数：props（见 DashboardProps）— 导航与交互回调。
 * 返回：JSX.Element — 仪表盘页面 JSX 结构。
 */
export function Dashboard({ 
  onNavigateToProjectManagement,
  onNavigateToDataManagement,
  onNavigateToTaskManagement,
  onNavigateToModelManagement,
  onOpenActivityCenter,
  onNavigateToProjectOverview
}: DashboardProps = {}) {
  const { t } = useLanguage();

  /**
   * 功能：将原始状态文案映射为国际化后的展示文本。
   * 参数：
   * - status: string — 原始状态（进行中/失败/已归档/已完成）。
   * 返回：string — 对应的国际化文本，若未匹配则返回原始值。
   */
  const displayStatus = (status: string) => {
    if (status === "已归档") return t("status.archived") || "已归档";
    if (status === "已完成") return t("status.completed");
    if (status === "进行中") return t("status.inProgress");
    if (status === "失败") return t("status.failed");
    return status;
  };
  // 顶部统计卡片已按原型要求移除

  const quickActions = [
    { 
      label: "创建新项目", 
      description: "开始一个新的AI项目", 
      icon: Plus, 
      color: "bg-blue-50 text-blue-600",
      onClick: onNavigateToProjectManagement
    },
    { 
      label: "上传数据", 
      description: "导入训练数据集", 
      icon: Upload, 
      color: "bg-green-50 text-green-600",
      onClick: onNavigateToDataManagement
    },
    { 
      label: "创建任务", 
      description: "创建新的训练任务", 
      icon: FileText, 
      color: "bg-purple-50 text-purple-600",
      onClick: onNavigateToTaskManagement
    },
    { 
      label: "模型微调", 
      description: "优化和调整模型参数", 
      icon: Zap, 
      color: "bg-orange-50 text-orange-600",
      onClick: onNavigateToModelManagement
    }
  ];

  // 最近项目：增加截止时间（deadline）和开始时间（startDate），用于计算项目剩余时间
  const recentProjects = [
    {
      name: "缺陷检测",
      description: "基于深度学习的产品缺陷检测系统",
      status: "进行中",
      members: ["L", "M", "K"],
      color: "blue",
      startDate: "2025-10-01T09:00:00Z",
      deadline: "2025-11-15T18:00:00Z",
    },
    {
      name: "电力预测",
      description: "个性化产品推荐系统优化",
      status: "进行中", 
      members: ["A", "B"],
      color: "green",
      startDate: "2025-10-10T09:00:00Z",
      deadline: "2025-11-05T18:00:00Z",
    },
    {
      name: "价格预测模型",
      description: "基于时间序列的价格预测分析",
      status: "已归档",
      members: ["C", "D", "E", "F", "G"],
      color: "purple",
      startDate: "2025-08-01T09:00:00Z",
      deadline: "2025-10-01T18:00:00Z",
    }
  ];

  /**
   * 功能：计算项目剩余时间的展示文案。
   * 规则：
   * - 已归档：直接返回“已归档”；
   * - 已到期（当前时间≥截止时间）：返回“已到期”；
   * - 其余：返回“X天Y小时”或“Y小时Z分钟”。
   * 参数：
   * - deadline: string — ISO 格式或可被 Date 解析的截止时间。
   * - status: string — 项目状态（用于处理“已归档”特殊文案）。
   * 返回：string — 用于 UI 展示的剩余时间文案。
   */
  const formatRemainingTime = (deadline: string, status: string) => {
    if (status === "已归档") return "已归档";
    const now = new Date();
    const end = new Date(deadline);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return "已到期";
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (diffDays > 0) {
      return `${diffDays}天${diffHours}小时`;
    }
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}小时${diffMinutes}分钟`;
  };

  /**
   * 功能：计算从开始到截止的时间使用百分比（用于进度条）。
   * 规则：
   * - 已归档：固定返回 100；
   * - 其余：在 [0, 100] 区间内按 (now-start)/(end-start) 计算并四舍五入。
   * 参数：
   * - startDate: string — 项目开始时间（ISO 或可被 Date 解析）。
   * - deadline: string — 项目截止时间（ISO 或可被 Date 解析）。
   * - status: string — 项目状态（用于处理“已归档”特殊逻辑）。
   * 返回：number — 进度百分比（0-100 的整数）。
   */
  const calcTimeUsedPercent = (startDate: string, deadline: string, status: string) => {
    if (status === "已归档") return 100;
    const start = new Date(startDate);
    const end = new Date(deadline);
    const now = new Date();
    const totalMs = Math.max(end.getTime() - start.getTime(), 1);
    const usedMs = Math.min(Math.max(now.getTime() - start.getTime(), 0), totalMs);
    return Math.round((usedMs / totalMs) * 100);
  };

  const systemStatus = [
    { label: "CPU 使用率", value: 45, color: "bg-blue-500" },
    { label: "内存使用率", value: 62, color: "bg-green-500" },
    { label: "GPU 使用率", value: 78, color: "bg-orange-500" }
  ];

  // 最近活动（结构化字段：时间、类型、描述、关联对象、结果状态）
  const recentActivities = [
    {
      timeRel: "30分钟前",
      timeAbs: "15:30",
      type: "模型",
      description: "模型 \"客户流失预测\" 训练完成",
      related: "客户流失预测-v3.0",
      status: "成功",
      statusMsg: "训练完成，准确率92.1%"
    },
    {
      timeRel: "1小时前",
      timeAbs: "14:30",
      type: "数据集",
      description: "数据集 \"用户行为数据\" 上传成功",
      related: "用户行为数据",
      status: "成功",
      statusMsg: "上传完成"
    },
    {
      timeRel: "2小时前",
      timeAbs: "13:30",
      type: "任务",
      description: "任务 \"商品推荐模型\" 开始执行",
      related: "商品推荐模型",
      status: "进行中",
      statusMsg: "正在执行"
    },
    {
      timeRel: "3小时前",
      timeAbs: "12:30",
      type: "部署",
      description: "模型 \"价格预测模型\" 部署成功",
      related: "价格预测模型",
      status: "成功",
      statusMsg: "部署成功"
    }
  ];

  // 活动类型样式与图标映射
  const activityTypeStyle: Record<string, { icon: any; color: string }> = {
    模型: { icon: BarChart3, color: "text-purple-600" },
    数据集: { icon: Database, color: "text-blue-600" },
    任务: { icon: Activity, color: "text-green-600" },
    部署: { icon: Zap, color: "text-orange-600" },
  };

  // 活动状态样式映射
  const activityStatusClass: Record<string, string> = {
    成功: "bg-green-100 text-green-700",
    进行中: "bg-yellow-100 text-yellow-700",
    失败: "bg-red-100 text-red-700",
  };

  // 原型图-全局统计看板示例数据
  const overviewCards = [
    {
      title: "项目统计",
      items: [
        { label: "总项目", value: 25 },
        { label: "进行中", value: 12 },
        { label: "已归档", value: 10 },
        { label: "已延期", value: 3 },
      ],
      footer: { label: "项目健康度", value: "85%", delta: "+5%" },
      icon: Layers,
      color: "text-blue-600"
    },
    {
      title: "数据统计",
      items: [
        { label: "数据集", value: 87 },
        { label: "字段数", value: 156 },
        { label: "总大小", value: "456GB" },
        { label: "来源", value: "多源融合" },
      ],
      footer: { label: "数据质量分", value: "+5" },
      icon: Database,
      color: "text-green-600"
    },
    {
      title: "任务统计",
      items: [
        { label: "总任务", value: 234 },
        { label: "运行中", value: 18 },
        { label: "已完成", value: 15 },
        { label: "失败", value: 5 },
      ],
      footer: { label: "近7天完成率", value: "89%" },
      icon: CheckCircle,
      color: "text-purple-600"
    },
    {
      title: "模型统计",
      items: [
        { label: "模型数", value: 18 },
        { label: "在线模型", value: 8 },
        { label: "最佳AUC", value: "0.93" },
        { label: "效果评分", value: "89%" },
      ],
      footer: { label: "近30天表现", value: "↑" },
      icon: BarChart3,
      color: "text-orange-600"
    }
  ];

  // 原型图-系统资源状态与智能助手推荐
  const resourceCards = [
    { label: "GPU使用率", value: 78, icon: Gauge, color: "text-red-600" },
    { label: "存储使用", value: 68, icon: HardDrive, color: "text-gray-700" },
    // 将“任务队列”改为“CPU统计”，展示为百分比并使用进度条
    { label: "CPU统计", value: 45, icon: Cpu, color: "text-green-600" },
  ];

  // 智能助手建议列表（去除说明性句子，避免与标题重复）
  const assistantTips = [
    "将客户流失预测 v3.0 从开发环境升级到实验室环境以试验部署",
    "建议\"设备故障预警\"模型进行因果解释以辅助运维人员一步决策",
    "将GPU使用率调整至最优配比，建议选择轻量级蒸馏优化",
  ];

  return (
    <div className="space-y-6">
      {/* 顶部标题栏（高保真） */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-start">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">LimiX机器学习平台 — 智能数据分析工作台</span>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">{t("common.welcomeBack")}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* 全局统计看板（高保真） — 置于页面上方 */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{t("dashboard.globalStats")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overviewCards.map((card, idx) => {
              const IconComp = card.icon as any;
              return (
                <div key={idx} className="p-4 rounded border bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <IconComp className={`h-5 w-5 ${card.color}`} />
                    <div className="text-sm font-medium">{card.title}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {card.items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-gray-600">{it.label}</span>
                        <span className="font-medium">{it.value}</span>
                      </div>
                    ))}
                  </div>
                  {/* 底部指标已移除：项目健康度、数据质量分、近7天完成率、近30天表现 */}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* 顶部统计卡片（已移除） */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧内容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 快速操作 */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
                      onClick={action.onClick}
                    >
                      <div className={`p-3 rounded-full ${action.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{action.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{action.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        {/* 最近活动（置于左列，大卡） */}
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => onOpenActivityCenter && onOpenActivityCenter()}>{t("common.viewAll")}</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivities.map((activity, index) => {
                const style = activityTypeStyle[activity.type] || { icon: Activity, color: "text-gray-600" };
                const IconComp = style.icon as any;
                return (
                  <div key={index} className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <IconComp className={`h-5 w-5 ${style.color} mt-1`} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <div className="mt-1 text-xs">
                          <button className="text-blue-600 hover:underline">{activity.related}</button>
                          <Badge variant="secondary" className={`ml-2 ${activityStatusClass[activity.status]}`}>{displayStatus(activity.status)}</Badge>
                        </div>
                        {activity.status === '失败' && activity.statusMsg && (
                          <p className="text-xs text-red-600 mt-1">{activity.statusMsg}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500" title={activity.timeAbs}>{activity.timeRel}</span>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">{t("common.viewDetail")}</Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          {/* 系统资源状态看板（移动到左侧红框区域，横向样式） */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" />{t("dashboard.systemResource")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {resourceCards.map((rc, i) => {
                  const IconComp = rc.icon as any;
                  return (
                    <div key={i} className="p-4 rounded border bg-white flex items-center gap-4">
                      <IconComp className={`h-6 w-6 ${rc.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700">{rc.label}</span>
                          <span className="font-medium">{rc.value}%</span>
                        </div>
                        <Progress value={rc.value} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧内容 */}
        <div className="space-y-6">
          {/* 最近项目（移至右列，小卡） */}
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("dashboard.recentProjects")}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => onNavigateToProjectOverview && onNavigateToProjectOverview()}>{t("common.viewAll")}</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProjects.map((project, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 truncate">{project.name}</h4>
                      <p className="text-xs text-gray-500 mt-1 truncate">{project.description}</p>
                    </div>
                    <Badge 
                      variant={project.status === "进行中" ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {displayStatus(project.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{t("dashboard.remainingTime")}</span>
                        <span>{formatRemainingTime(project.deadline, project.status)}</span>
                      </div>
                      <Progress value={calcTimeUsedPercent(project.startDate, project.deadline, project.status)} className="h-2" />
                    </div>
                    <div className="flex items-center space-x-1">
                      {project.members.slice(0, 3).map((member, memberIndex) => (
                        <Avatar key={memberIndex} className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gray-200">
                            {member}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {project.members.length > 3 && (
                        <div className="text-xs text-gray-500 ml-1">+{project.members.length - 3}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      查看详情 <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 智能助手推荐（内容更有条理 + 按钮按原型优化） */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5" />智能助手推荐</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700">基于最近项目的用量，建议如下操作：</p>
              <ol className="list-decimal pl-6 space-y-3 text-sm text-gray-800">
                {assistantTips.map((tip, i) => (
                  <li key={i} className="leading-6">
                    {tip}
                  </li>
                ))}
              </ol>
              {/* 原型按钮：居中大按钮“忽略建议” */}
              <div className="pt-2">
                <Button className="mx-auto block px-6 py-3 rounded-full bg-black text-red-500 hover:bg-gray-900 text-sm">
                  忽略建议
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}