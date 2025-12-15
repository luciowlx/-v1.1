import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { useLanguage } from "../i18n/LanguageContext";
import { 
  Bell, 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Clock,
  FolderOpen,
  Database,
  CheckSquare,
  Brain,
  Zap,
  Activity,
  Settings,
  User,
  Calendar,
  ArrowRight,
  X
} from "lucide-react";

// 导入类型和数据
import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  UserRole,
  Notification,
  NotificationStats
} from "./NotificationCenter";

// 使用相同的模拟数据和配置
const CURRENT_USER_ROLE = UserRole.PROJECT_MANAGER;

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: NotificationType.PROJECT,
    title: "项目状态变更",
    content: "AI智能客服系统项目已从开发阶段转入测试阶段，请相关人员及时跟进测试工作。",
    priority: NotificationPriority.HIGH,
    status: NotificationStatus.UNREAD,
    createdAt: "2024-01-20T10:30:00Z",
    updatedAt: "2024-01-20T10:30:00Z",
    sender: "系统管理员",
    targetRoles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.DEVELOPER],
    relatedEntityId: "proj_001",
    relatedEntityName: "AI智能客服系统",
    actionUrl: "/projects/proj_001",
    metadata: {
      previousStatus: "开发中",
      currentStatus: "测试中",
      changeReason: "开发阶段完成"
    }
  },
  {
    id: "2", 
    type: NotificationType.DATA,
    title: "数据集上传完成",
    content: "客户对话数据集（50万条记录）已成功上传并完成预处理，可用于模型训练。",
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.UNREAD,
    createdAt: "2024-01-20T09:15:00Z",
    updatedAt: "2024-01-20T09:15:00Z",
    sender: "数据管理系统",
    targetRoles: [UserRole.ADMIN, UserRole.DATA_ANALYST, UserRole.PROJECT_MANAGER],
    relatedEntityId: "data_001",
    relatedEntityName: "客户对话数据集",
    actionUrl: "/data/data_001",
    metadata: {
      recordCount: 500000,
      fileSize: "2.3GB",
      processingTime: "45分钟"
    }
  },
  {
    id: "3",
    type: NotificationType.TASK,
    title: "任务即将到期",
    content: "模型性能优化任务将在2天后到期，当前进度75%，请及时完成剩余工作。",
    priority: NotificationPriority.URGENT,
    status: NotificationStatus.UNREAD,
    createdAt: "2024-01-20T08:00:00Z",
    updatedAt: "2024-01-20T08:00:00Z",
    sender: "任务管理系统",
    targetRoles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.DATA_ANALYST],
    relatedEntityId: "task_001",
    relatedEntityName: "模型性能优化",
    actionUrl: "/tasks/task_001",
    metadata: {
      dueDate: "2024-01-22T23:59:59Z",
      progress: 75,
      assignee: "张三"
    }
  },
  {
    id: "4",
    type: NotificationType.MODEL,
    title: "模型训练完成",
    content: "BERT-Large模型训练已完成，准确率达到94.2%，已自动部署到测试环境。",
    priority: NotificationPriority.HIGH,
    status: NotificationStatus.READ,
    createdAt: "2024-01-19T16:45:00Z",
    updatedAt: "2024-01-20T09:00:00Z",
    sender: "模型训练系统",
    targetRoles: [UserRole.ADMIN, UserRole.DATA_ANALYST, UserRole.PROJECT_MANAGER],
    relatedEntityId: "model_001",
    relatedEntityName: "BERT-Large情感分析模型",
    actionUrl: "/models/model_001",
    metadata: {
      accuracy: 94.2,
      trainingTime: "8小时30分钟",
      deploymentStatus: "已部署"
    }
  },
  {
    id: "5",
    type: NotificationType.SYSTEM,
    title: "系统维护通知",
    content: "系统将于今晚23:00-01:00进行例行维护，期间可能影响部分功能使用。",
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.READ,
    createdAt: "2024-01-19T14:00:00Z",
    updatedAt: "2024-01-19T15:30:00Z",
    sender: "运维团队",
    targetRoles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.DATA_ANALYST, UserRole.DEVELOPER, UserRole.VIEWER],
    actionUrl: "/system/maintenance",
    metadata: {
      maintenanceStart: "2024-01-20T23:00:00Z",
      maintenanceEnd: "2024-01-21T01:00:00Z",
      affectedServices: ["模型训练", "数据上传"]
    }
  }
];

const notificationTypeConfig = {
  [NotificationType.PROJECT]: {
    label: "项目通知",
    icon: FolderOpen,
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700"
  },
  [NotificationType.DATA]: {
    label: "数据通知", 
    icon: Database,
    color: "bg-green-500",
    bgColor: "bg-green-50",
    textColor: "text-green-700"
  },
  [NotificationType.TASK]: {
    label: "任务通知",
    icon: CheckSquare,
    color: "bg-orange-500", 
    bgColor: "bg-orange-50",
    textColor: "text-orange-700"
  },
  [NotificationType.MODEL]: {
    label: "模型通知",
    icon: Brain,
    color: "bg-purple-500",
    bgColor: "bg-purple-50", 
    textColor: "text-purple-700"
  },
  [NotificationType.SYSTEM]: {
    label: "系统通知",
    icon: Settings,
    color: "bg-gray-500",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700"
  }
};

const priorityConfig = {
  [NotificationPriority.LOW]: {
    label: "低",
    color: "bg-gray-100 text-gray-600",
    dotColor: "bg-gray-400"
  },
  [NotificationPriority.MEDIUM]: {
    label: "中",
    color: "bg-blue-100 text-blue-600", 
    dotColor: "bg-blue-400"
  },
  [NotificationPriority.HIGH]: {
    label: "高",
    color: "bg-orange-100 text-orange-600",
    dotColor: "bg-orange-400"
  },
  [NotificationPriority.URGENT]: {
    label: "紧急",
    color: "bg-red-100 text-red-600",
    dotColor: "bg-red-400"
  }
};
// 活动中心类型与数据定义
type ActivityType = "模型" | "数据集" | "任务" | "部署" | "项目" | "系统";
type ActivityStatus = "成功" | "进行中" | "失败" | "提醒";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string; // 活动标题
  description?: string; // 详细内容
  related?: string; // 关联实体名称
  status: ActivityStatus;
  createdAt: string; // ISO时间
  actionUrl?: string; // 跳转映射
}

const activityTypeConfig: Record<ActivityType, { label: string; icon: any; bgColor: string; textColor: string }> = {
  模型: { label: "模型", icon: Brain, bgColor: "bg-purple-50", textColor: "text-purple-700" },
  数据集: { label: "数据集", icon: Database, bgColor: "bg-blue-50", textColor: "text-blue-700" },
  任务: { label: "任务", icon: CheckSquare, bgColor: "bg-orange-50", textColor: "text-orange-700" },
  部署: { label: "部署", icon: Zap, bgColor: "bg-orange-50", textColor: "text-orange-700" },
  项目: { label: "项目", icon: FolderOpen, bgColor: "bg-blue-50", textColor: "text-blue-700" },
  系统: { label: "系统", icon: Settings, bgColor: "bg-gray-50", textColor: "text-gray-700" },
};

// 模拟活动数据（聚合模型/数据集/任务/部署等事件流）
const mockActivities: ActivityItem[] = [
  {
    id: "a1",
    type: "模型",
    title: "模型 \"客户流失预测\" 训练完成",
    description: "训练完成，准确率92.1%",
    related: "客户流失预测-v3.0",
    status: "成功",
    createdAt: "2024-01-20T10:30:00Z",
    actionUrl: "/models/model_001",
  },
  {
    id: "a2",
    type: "数据集",
    title: "数据集 \"用户行为数据\" 上传成功",
    description: "上传完成",
    related: "用户行为数据",
    status: "成功",
    createdAt: "2024-01-20T09:15:00Z",
    actionUrl: "/data/data_001",
  },
  {
    id: "a3",
    type: "任务",
    title: "任务 \"模型性能优化\" 即将到期",
    description: "当前进度75%，请及时完成剩余工作",
    related: "模型性能优化",
    status: "提醒",
    createdAt: "2024-01-20T08:00:00Z",
    actionUrl: "/tasks/task_001",
  },
  {
    id: "a4",
    type: "部署",
    title: "模型 \"价格预测模型\" 部署成功",
    description: "已部署到测试环境",
    related: "价格预测模型",
    status: "成功",
    createdAt: "2024-01-19T16:45:00Z",
    actionUrl: "/models/model_002/deployments/last",
  },
  {
    id: "a5",
    type: "系统",
    title: "系统维护通知",
    description: "今晚23:00-01:00进行例行维护",
    related: "运维团队",
    status: "提醒",
    createdAt: "2024-01-19T14:00:00Z",
    actionUrl: "/system/maintenance",
  },
  {
    id: "a6",
    type: "项目",
    title: "项目 \"AI智能客服系统\" 状态更新",
    description: "从开发阶段转入测试阶段",
    related: "AI智能客服系统",
    status: "进行中",
    createdAt: "2024-01-20T10:30:00Z",
    actionUrl: "/projects/proj_001",
  },
];

/**
 * 通知中心内容组件，提供通知与活动的筛选、统计与详情查看（前端原型，基于本地模拟数据）。
 * @param initialTab 初始选中的标签页（notifications | activity）
 * @returns JSX.Element 通知中心界面
 */
export function NotificationCenterContent({ initialTab = 'notifications' }: { initialTab?: 'notifications' | 'activity' }) {
  const { t } = useLanguage();
  const [tabValue, setTabValue] = useState<'notifications' | 'activity'>(initialTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<NotificationType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<NotificationStatus | "all">("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  // 活动过滤状态
  const [activitySelectedType, setActivitySelectedType] = useState<ActivityType | "all">("all");
  const [activitySelectedStatus, setActivitySelectedStatus] = useState<ActivityStatus | "all">("all");

  // 过滤通知
  const filteredNotifications = useMemo(() => {
    return mockNotifications.filter(notification => {
      // 角色过滤
      if (!notification.targetRoles.includes(CURRENT_USER_ROLE)) {
        return false;
      }
      
      // 搜索过滤
      if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !notification.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // 类型过滤
      if (selectedType !== "all" && notification.type !== selectedType) {
        return false;
      }
      
      // 状态过滤
      if (selectedStatus !== "all" && notification.status !== selectedStatus) {
        return false;
      }
      
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [searchTerm, selectedType, selectedStatus]);

  // 统计信息
  /**
   * 计算通知统计信息。
   * @returns 通知数量、未读数量、按类型与优先级汇总的记录
   */
  const stats = useMemo((): NotificationStats & { byType: Record<NotificationType, number>; byPriority: Record<NotificationPriority, number> } => {
    const total = mockNotifications.filter(n => n.targetRoles.includes(CURRENT_USER_ROLE)).length;
    const unread = mockNotifications.filter(n => n.targetRoles.includes(CURRENT_USER_ROLE) && n.status === NotificationStatus.UNREAD).length;
    
    const byType = {} as Record<NotificationType, number>;
    const byPriority = {} as Record<NotificationPriority, number>;
    
    mockNotifications.filter(n => n.targetRoles.includes(CURRENT_USER_ROLE)).forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
      byPriority[notification.priority] = (byPriority[notification.priority] || 0) + 1;
    });
    
    return {
      total,
      unread,
      byType,
      byPriority
    };
  }, []);

  // 过滤活动
  /**
   * 过滤活动列表（按搜索、类型、状态）。
   * @returns 过滤后的活动数组
   */
  const filteredActivities = useMemo((): ActivityItem[] => {
    return mockActivities
      .filter((act) => {
        // 搜索过滤
        if (
          searchTerm &&
          !(
            act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (act.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (act.related || "").toLowerCase().includes(searchTerm.toLowerCase())
          )
        ) {
          return false;
        }

        // 类型过滤
        if (activitySelectedType !== "all" && act.type !== activitySelectedType) {
          return false;
        }

        // 状态过滤
        if (activitySelectedStatus !== "all" && act.status !== activitySelectedStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [searchTerm, activitySelectedType, activitySelectedStatus]);

  // 活动统计信息
  /**
   * 活动统计信息。
   * @returns 活动总数、进行中、失败、今日新增及按类型分布
   */
  const activityStats = useMemo((): { total: number; inProgress: number; failed: number; todayCount: number; byType: Record<ActivityType, number> } => {
    const total = mockActivities.length;
    const inProgress = mockActivities.filter((a) => a.status === "进行中").length;
    const failed = mockActivities.filter((a) => a.status === "失败").length;
    const todayCount = mockActivities.filter((a) => {
      const d = new Date(a.createdAt);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }).length;
    const byType: Record<ActivityType, number> = {
      模型: 0,
      数据集: 0,
      任务: 0,
      部署: 0,
      项目: 0,
      系统: 0,
    };
    mockActivities.forEach((a) => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });
    return { total, inProgress, failed, todayCount, byType };
  }, []);

  /**
   * 标记通知为已读（原型演示：仅打印到控制台）。
   * @param notificationId 通知ID
   */
  const markAsRead = (notificationId: string): void => {
    console.log("标记为已读:", notificationId);
  };

  /**
   * 删除通知（原型演示：仅打印到控制台）。
   * @param notificationId 通知ID
   */
  const deleteNotification = (notificationId: string): void => {
    console.log("删除通知:", notificationId);
  };

  /**
   * 查看通知详情并打开对话框，同时将未读通知标记为已读（原型演示）。
   * @param notification 选中的通知对象
   */
  const viewDetails = (notification: Notification): void => {
    setSelectedNotification(notification);
    setIsDetailOpen(true);
    if (notification.status === NotificationStatus.UNREAD) {
      markAsRead(notification.id);
    }
  };

  /**
   * 格式化时间差，显示“刚刚/xx小时前/xx天前”。
   * @param dateString ISO 时间字符串
   * @returns 本地化的人类可读时间差文本
   */
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return t('notifications.center.time.justNow');
    } else if (diffInHours < 24) {
      return `${diffInHours}${t('notifications.center.time.hoursAgo')}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}${t('notifications.center.time.daysAgo')}`;
    }
  };

  return (
    <div className="h-full bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 顶部选项卡：通知 / 活动 */}
        <Tabs value={tabValue} onValueChange={(v: string) => setTabValue(v as 'notifications' | 'activity')}>
          <TabsList>
            <TabsTrigger value="notifications">{t('notifications.center.tabs.notifications')}</TabsTrigger>
            <TabsTrigger value="activity">{t('notifications.center.tabs.activity')}</TabsTrigger>
          </TabsList>

          {/* 通知统计卡片 */}
          <TabsContent value="notifications">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('notifications.center.stats.total')}</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <Bell className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('notifications.center.stats.unread')}</p>
                      <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('notifications.center.stats.today')}</p>
                      <p className="text-2xl font-bold text-green-600">3</p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('notifications.center.stats.urgent')}</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.byPriority[NotificationPriority.URGENT] || 0}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 搜索和过滤（通知） */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder={t('notifications.center.search.placeholder.notifications')}
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedType}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value as NotificationType | "all")}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">{t('notifications.center.filter.type.all')}</option>
                      {Object.entries(notificationTypeConfig).map(([type, config]) => (
                        <option key={type} value={type}>{config.label}</option>
                      ))}
                    </select>
                    <select
                      value={selectedStatus}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value as NotificationStatus | "all")}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">{t('notifications.center.filter.status.all')}</option>
                      <option value={NotificationStatus.UNREAD}>{t('notifications.center.filter.status.unread')}</option>
                      <option value={NotificationStatus.READ}>{t('notifications.center.filter.status.read')}</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 通知列表 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('notifications.center.list.title')}</span>
                  <Badge variant="secondary">{filteredNotifications.length} {t('notifications.center.list.count.suffix')}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredNotifications.map((notification) => {
                    const typeConfig = notificationTypeConfig[notification.type];
                    const priorityConfig_ = priorityConfig[notification.priority];
                    const IconComponent = typeConfig.icon;
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          notification.status === NotificationStatus.UNREAD ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => viewDetails(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                            <IconComponent className={`h-5 w-5 ${typeConfig.textColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className={`text-sm font-medium ${
                                notification.status === NotificationStatus.UNREAD ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <Badge className={`text-xs ${priorityConfig_.color}`}>
                                  {notification.priority === NotificationPriority.LOW && t('notifications.center.priority.low')}
                                  {notification.priority === NotificationPriority.MEDIUM && t('notifications.center.priority.medium')}
                                  {notification.priority === NotificationPriority.HIGH && t('notifications.center.priority.high')}
                                  {notification.priority === NotificationPriority.URGENT && t('notifications.center.priority.urgent')}
                                </Badge>
                                <span className="text-xs text-gray-500">{formatTime(notification.createdAt)}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{notification.content}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">{typeConfig.label}</Badge>
                                <span className="text-xs text-gray-500">{t('notifications.center.detail.sender')}: {notification.sender}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {notification.status === NotificationStatus.UNREAD && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredNotifications.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>{t('notifications.center.empty')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 通知详情对话框 */}
            {selectedNotification && (
              <Dialog open={isDetailOpen} onOpenChange={(open: boolean) => setIsDetailOpen(open)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${notificationTypeConfig[selectedNotification.type].bgColor}`}>
                        {React.createElement(notificationTypeConfig[selectedNotification.type].icon, {
                          className: `h-5 w-5 ${notificationTypeConfig[selectedNotification.type].textColor}`
                        })}
                      </div>
                      <span>{selectedNotification.title}</span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={priorityConfig[selectedNotification.priority].color}>
                        {(selectedNotification.priority === NotificationPriority.LOW && t('notifications.center.priority.low'))
                          || (selectedNotification.priority === NotificationPriority.MEDIUM && t('notifications.center.priority.medium'))
                          || (selectedNotification.priority === NotificationPriority.HIGH && t('notifications.center.priority.high'))
                          || (selectedNotification.priority === NotificationPriority.URGENT && t('notifications.center.priority.urgent'))}{t('notifications.center.detail.priorityLabelSuffix')}
                      </Badge>
                      <span className="text-sm text-gray-500">{formatTime(selectedNotification.createdAt)}</span>
                    </div>
                    <div className="prose max-w-none">
                      <p className="text-gray-700">{selectedNotification.content}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">{t('notifications.center.detail.sender')}:</span>
                        <span className="ml-2">{selectedNotification.sender}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">{t('notifications.center.detail.type')}:</span>
                        <span className="ml-2">{notificationTypeConfig[selectedNotification.type].label}</span>
                      </div>
                      {selectedNotification.relatedEntityName && (
                        <div>
                        <span className="font-medium text-gray-600">{t('notifications.center.detail.relatedEntity')}:</span>
                          <span className="ml-2">{selectedNotification.relatedEntityName}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      {selectedNotification.status === NotificationStatus.UNREAD && (
                        <Button variant="outline" onClick={() => markAsRead(selectedNotification.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />{t('notifications.center.actions.markRead')}
                        </Button>
                      )}
                      <Button variant="destructive" onClick={() => deleteNotification(selectedNotification.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />{t('notifications.center.actions.delete')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* 活动统计卡片 */}
          <TabsContent value="activity">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('notifications.center.activities.stats.total')}</p>
                      <p className="text-2xl font-bold">{activityStats.total}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('notifications.center.activities.stats.inProgress')}</p>
                      <p className="text-2xl font-bold text-blue-600">{activityStats.inProgress}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('notifications.center.activities.stats.today')}</p>
                      <p className="text-2xl font-bold text-green-600">{activityStats.todayCount}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('notifications.center.activities.stats.failed')}</p>
                      <p className="text-2xl font-bold text-red-600">{activityStats.failed}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 搜索和过滤（活动） */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder={t('notifications.center.search.placeholder.activities')}
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={activitySelectedType}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setActivitySelectedType(e.target.value as ActivityType | 'all')}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">{t('notifications.center.activities.filter.type.all')}</option>
                      {Object.entries(activityTypeConfig).map(([type, config]) => (
                        <option key={type} value={type}>{config.label}</option>
                      ))}
                    </select>
                    <select
                      value={activitySelectedStatus}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setActivitySelectedStatus(e.target.value as ActivityStatus | 'all')}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">{t('notifications.center.activities.filter.status.all')}</option>
                      <option value="成功">{t('notifications.center.activities.status.success')}</option>
                      <option value="进行中">{t('notifications.center.activities.status.inProgress')}</option>
                      <option value="失败">{t('notifications.center.activities.status.failed')}</option>
                      <option value="提醒">{t('notifications.center.activities.status.remind')}</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 活动列表 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('notifications.center.activities.list.title')}</span>
                  <Badge variant="secondary">{filteredActivities.length} {t('notifications.center.activities.list.count.suffix')}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredActivities.map((act) => {
                    const cfg = activityTypeConfig[act.type];
                    const IconComp = cfg.icon;
                    // 活动状态样式
                    const statusClass =
                      act.status === '成功'
                        ? 'bg-green-100 text-green-700'
                        : act.status === '进行中'
                        ? 'bg-yellow-100 text-yellow-700'
                        : act.status === '失败'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700';
                    return (
                      <div key={act.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${cfg.bgColor}`}>
                            <IconComp className={`h-5 w-5 ${cfg.textColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-sm font-medium text-gray-900">{act.title}</h3>
                              <span className="text-xs text-gray-500">{formatTime(act.createdAt)}</span>
                            </div>
                            {act.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{act.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                                {act.related && (
                                  <span className="text-xs text-gray-500">{t('notifications.center.activities.related.prefix')} {act.related}</span>
                                )}
                                <Badge variant="secondary" className={`text-xs ${statusClass}`}>{act.status}</Badge>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    // 预留：根据 actionUrl 执行跳转映射（集成到路由或全屏视图）
                                    console.log('跳转到:', act.actionUrl);
                                  }}
                                >
                                  <ArrowRight className="h-3 w-3 text-gray-400" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredActivities.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>{t('notifications.center.activities.empty')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}