import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
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
  Settings,
  User,
  Calendar,
  ArrowRight,
  X
} from "lucide-react";

// 通知类型枚举
export enum NotificationType {
  PROJECT = "project",
  DATA = "data", 
  TASK = "task",
  MODEL = "model",
  SYSTEM = "system"
}

// 通知优先级枚举
export enum NotificationPriority {
  LOW = "low",
  MEDIUM = "medium", 
  HIGH = "high",
  URGENT = "urgent"
}

// 通知状态枚举
export enum NotificationStatus {
  UNREAD = "unread",
  READ = "read",
  ARCHIVED = "archived"
}

// 用户角色枚举
export enum UserRole {
  ADMIN = "admin",
  PROJECT_MANAGER = "project_manager",
  DATA_ANALYST = "data_analyst", 
  DEVELOPER = "developer",
  VIEWER = "viewer"
}

// 通知接口
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
  sender: string;
  targetRoles: UserRole[]; // 目标用户角色
  relatedEntityId?: string; // 关联实体ID（项目ID、任务ID等）
  relatedEntityName?: string; // 关联实体名称
  actionUrl?: string; // 操作链接
  metadata?: Record<string, any>; // 额外元数据
}

// 通知统计接口
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// 当前用户角色（模拟）
const CURRENT_USER_ROLE = UserRole.PROJECT_MANAGER;

// 模拟通知数据
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
  },
  {
    id: "6",
    type: NotificationType.PROJECT,
    title: "新项目创建",
    content: "智能推荐系统项目已创建，项目编号：PROJ-2024-002，请相关团队成员查看项目详情。",
    priority: NotificationPriority.LOW,
    status: NotificationStatus.READ,
    createdAt: "2024-01-19T11:20:00Z",
    updatedAt: "2024-01-19T11:20:00Z",
    sender: "项目管理系统",
    targetRoles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER],
    relatedEntityId: "proj_002",
    relatedEntityName: "智能推荐系统",
    actionUrl: "/projects/proj_002",
    metadata: {
      projectCode: "PROJ-2024-002",
      teamSize: 5,
      estimatedDuration: "3个月"
    }
  },
  {
    id: "7",
    type: NotificationType.DATA,
    title: "数据质量检查异常",
    content: "用户行为数据集检测到15%的异常数据，建议进行数据清洗后再使用。",
    priority: NotificationPriority.HIGH,
    status: NotificationStatus.UNREAD,
    createdAt: "2024-01-20T07:30:00Z",
    updatedAt: "2024-01-20T07:30:00Z",
    sender: "数据质量监控",
    targetRoles: [UserRole.ADMIN, UserRole.DATA_ANALYST],
    relatedEntityId: "data_002",
    relatedEntityName: "用户行为数据集",
    actionUrl: "/data/data_002/quality",
    metadata: {
      totalRecords: 1000000,
      anomalyRate: 15,
      anomalyTypes: ["缺失值", "异常值", "重复数据"]
    }
  },
  {
    id: "8",
    type: NotificationType.TASK,
    title: "任务分配通知",
    content: "您被分配了新任务：数据预处理优化，预计工作量3天，请及时确认接收。",
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.UNREAD,
    createdAt: "2024-01-20T06:00:00Z",
    updatedAt: "2024-01-20T06:00:00Z",
    sender: "李四",
    targetRoles: [UserRole.DATA_ANALYST],
    relatedEntityId: "task_002",
    relatedEntityName: "数据预处理优化",
    actionUrl: "/tasks/task_002",
    metadata: {
      assignedBy: "李四",
      estimatedHours: 24,
      dueDate: "2024-01-23T18:00:00Z"
    }
  }
];

// 通知类型配置
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

// 优先级配置
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

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<NotificationType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<NotificationStatus | "all">("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
  const stats = useMemo(() => {
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

  const markAsRead = (notificationId: string) => {
    console.log("标记为已读:", notificationId);
  };

  const deleteNotification = (notificationId: string) => {
    console.log("删除通知:", notificationId);
  };

  const viewDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailOpen(true);
    if (notification.status === NotificationStatus.UNREAD) {
      markAsRead(notification.id);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "刚刚";
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
  };

  // 如果抽屉未打开，不渲染任何内容
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* 右侧抽屉 */}
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col translate-x-0">
        {/* 抽屉头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">通知中心</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              全部已读
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-500">总通知</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
              <div className="text-sm text-gray-500">未读</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.byPriority[NotificationPriority.URGENT] || 0}</div>
              <div className="text-sm text-gray-500">紧急</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.byType[NotificationType.PROJECT] || 0}</div>
              <div className="text-sm text-gray-500">项目</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.byType[NotificationType.MODEL] || 0}</div>
              <div className="text-sm text-gray-500">模型</div>
            </div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索通知..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex space-x-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as NotificationType | "all")}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有类型</option>
              <option value={NotificationType.PROJECT}>项目通知</option>
              <option value={NotificationType.DATA}>数据通知</option>
              <option value={NotificationType.TASK}>任务通知</option>
              <option value={NotificationType.MODEL}>模型通知</option>
              <option value={NotificationType.SYSTEM}>系统通知</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as NotificationStatus | "all")}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有状态</option>
              <option value={NotificationStatus.UNREAD}>未读</option>
              <option value={NotificationStatus.READ}>已读</option>
            </select>
          </div>
        </div>

        {/* 通知列表 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无通知</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const typeConfig = notificationTypeConfig[notification.type];
                const priorityConfig_ = priorityConfig[notification.priority];
                const IconComponent = typeConfig.icon;

                return (
                  <Card 
                    key={notification.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${
                      notification.status === NotificationStatus.UNREAD 
                        ? 'bg-blue-50 border-l-blue-500' 
                        : 'bg-white border-l-gray-200'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${typeConfig.bgColor} flex-shrink-0`}>
                          <IconComponent className={`h-4 w-4 ${typeConfig.textColor}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </h3>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <div className={`w-2 h-2 rounded-full ${priorityConfig_.dotColor}`}></div>
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {notification.content}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className={`text-xs ${typeConfig.textColor}`}>
                                {typeConfig.label}
                              </Badge>
                              <Badge className={`text-xs ${priorityConfig_.color}`}>
                                {priorityConfig_.label}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              {notification.status === NotificationStatus.UNREAD && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewDetails(notification);
                                }}
                                className="h-6 w-6 p-0 text-gray-600 hover:text-gray-700"
                              >
                                <Info className="h-3 w-3" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 通知详情对话框 */}
      {selectedNotification && (
        <NotificationDetailDialog
          notification={selectedNotification}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedNotification(null);
          }}
        />
      )}
    </>
  );
}

// 通知详情对话框组件
interface NotificationDetailDialogProps {
  notification: Notification;
  isOpen: boolean;
  onClose: () => void;
}

function NotificationDetailDialog({ notification, isOpen, onClose }: NotificationDetailDialogProps) {
  const typeConfig = notificationTypeConfig[notification.type];
  const priorityConfig_ = priorityConfig[notification.priority];
  const IconComponent = typeConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
              <IconComponent className={`h-5 w-5 ${typeConfig.textColor}`} />
            </div>
            <span>{notification.title}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-500">发送者</label>
              <p className="text-sm text-gray-900">{notification.sender}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">发送时间</label>
              <p className="text-sm text-gray-900">
                {new Date(notification.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">优先级</label>
              <Badge className={`text-xs ${priorityConfig_.color}`}>
                {priorityConfig_.label}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">类型</label>
              <Badge variant="outline" className={`text-xs ${typeConfig.textColor}`}>
                {typeConfig.label}
              </Badge>
            </div>
          </div>

          {/* 通知内容 */}
          <div>
            <label className="text-sm font-medium text-gray-500 mb-2 block">通知内容</label>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700 leading-relaxed">
                {notification.content}
              </p>
            </div>
          </div>

          {/* 关联项目/任务 */}
          {notification.relatedEntityName && (
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">关联项目/任务</label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  {notification.relatedEntityName}
                </p>
              </div>
            </div>
          )}

          {/* 详细信息 */}
          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">详细信息</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <dl className="space-y-1">
                  {Object.entries(notification.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <dt className="text-gray-500">{key}:</dt>
                      <dd className="text-gray-700">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          {notification.actionUrl && (
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  window.open(notification.actionUrl, '_blank');
                  onClose();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                查看详情
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}