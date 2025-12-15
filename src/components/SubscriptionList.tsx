import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { 
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  Pause,
  Square,
  Settings,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  FileText,
  Calendar,
  Activity,
  AlertTriangle,
  Info,
  Server,
  Globe,
  Key
} from "lucide-react";
import { toast } from "sonner";

interface SubscriptionListProps {
  isOpen: boolean;
  onClose: () => void;
}

type SubscriptionStatus = 'active' | 'paused' | 'error' | 'stopped';
type DataSourceType = 'mysql' | 'postgresql' | 'mongodb' | 'redis' | 'elasticsearch' | 'api' | 'ftp';

interface SyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  recordsProcessed?: number;
  duration?: string;
  errorDetails?: string;
}

interface Subscription {
  id: string;
  name: string;
  description: string;
  dataSourceType: DataSourceType;
  status: SubscriptionStatus;
  lastSync: string;
  nextSync: string;
  syncFrequency: string;
  recordsTotal: number;
  recordsProcessed: number;
  successRate: number;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
  connectionInfo: {
    host?: string;
    database?: string;
    url?: string;
  };
  syncLogs: SyncLog[];
}

export function SubscriptionList({ isOpen, onClose }: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  // 模拟数据
  useEffect(() => {
    if (isOpen) {
      loadSubscriptions();
    }
  }, [isOpen]);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSubscriptions: Subscription[] = [
        {
          id: 'sub-001',
          name: '用户数据库',
          description: '主要用户信息数据同步',
          dataSourceType: 'mysql',
          status: 'active',
          lastSync: '2024-01-15 14:30:00',
          nextSync: '2024-01-15 15:30:00',
          syncFrequency: '每小时',
          recordsTotal: 150000,
          recordsProcessed: 148500,
          successRate: 99.0,
          errorCount: 3,
          createdAt: '2024-01-10 09:00:00',
          updatedAt: '2024-01-15 14:30:00',
          connectionInfo: {
            host: 'db.example.com',
            database: 'users'
          },
          syncLogs: [
            {
              id: 'log-001',
              timestamp: '2024-01-15 14:30:00',
              status: 'success',
              message: '同步完成',
              recordsProcessed: 1250,
              duration: '2.3s'
            },
            {
              id: 'log-002',
              timestamp: '2024-01-15 13:30:00',
              status: 'error',
              message: '连接超时',
              errorDetails: 'Connection timeout after 30 seconds'
            }
          ]
        },
        {
          id: 'sub-002',
          name: '订单API数据',
          description: '电商订单数据实时同步',
          dataSourceType: 'api',
          status: 'error',
          lastSync: '2024-01-15 14:15:00',
          nextSync: '2024-01-15 14:45:00',
          syncFrequency: '每30分钟',
          recordsTotal: 50000,
          recordsProcessed: 45000,
          successRate: 90.0,
          errorCount: 12,
          createdAt: '2024-01-12 10:00:00',
          updatedAt: '2024-01-15 14:15:00',
          connectionInfo: {
            url: 'https://api.shop.com/orders'
          },
          syncLogs: [
            {
              id: 'log-003',
              timestamp: '2024-01-15 14:15:00',
              status: 'error',
              message: 'API认证失败',
              errorDetails: 'Invalid API key or expired token'
            }
          ]
        },
        {
          id: 'sub-003',
          name: '日志数据',
          description: 'Elasticsearch日志数据同步',
          dataSourceType: 'elasticsearch',
          status: 'paused',
          lastSync: '2024-01-15 12:00:00',
          nextSync: '-',
          syncFrequency: '每日',
          recordsTotal: 1000000,
          recordsProcessed: 980000,
          successRate: 98.0,
          errorCount: 5,
          createdAt: '2024-01-08 16:00:00',
          updatedAt: '2024-01-15 12:00:00',
          connectionInfo: {
            host: 'es.example.com',
            database: 'logs-2024'
          },
          syncLogs: []
        }
      ];
      
      setSubscriptions(mockSubscriptions);
    } catch (error) {
      toast.error('加载订阅列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取状态颜色和图标
  const getStatusInfo = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-500', icon: CheckCircle, text: '运行中' };
      case 'paused':
        return { color: 'bg-yellow-500', icon: Pause, text: '已暂停' };
      case 'error':
        return { color: 'bg-red-500', icon: AlertCircle, text: '错误' };
      case 'stopped':
        return { color: 'bg-gray-500', icon: Square, text: '已停止' };
      default:
        return { color: 'bg-gray-500', icon: Clock, text: '未知' };
    }
  };

  // 获取数据源图标
  const getDataSourceIcon = (type: DataSourceType) => {
    switch (type) {
      case 'mysql':
      case 'postgresql':
        return <Database className="h-4 w-4" />;
      case 'mongodb':
        return <Server className="h-4 w-4" />;
      case 'redis':
        return <Key className="h-4 w-4" />;
      case 'elasticsearch':
        return <Settings className="h-4 w-4" />;
      case 'api':
        return <Globe className="h-4 w-4" />;
      case 'ftp':
        return <FileText className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  // 控制订阅状态
  const handleStatusControl = async (subscriptionId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      setRefreshing(subscriptionId);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubscriptions(prev => prev.map(sub => {
        if (sub.id === subscriptionId) {
          let newStatus: SubscriptionStatus;
          switch (action) {
            case 'start':
              newStatus = 'active';
              break;
            case 'pause':
              newStatus = 'paused';
              break;
            case 'stop':
              newStatus = 'stopped';
              break;
            default:
              newStatus = sub.status;
          }
          return { ...sub, status: newStatus, updatedAt: new Date().toLocaleString() };
        }
        return sub;
      }));
      
      toast.success(`订阅已${action === 'start' ? '启动' : action === 'pause' ? '暂停' : '停止'}`);
    } catch (error) {
      toast.error('操作失败，请稍后重试');
    } finally {
      setRefreshing(null);
    }
  };

  // 手动同步
  const handleManualSync = async (subscriptionId: string) => {
    try {
      setRefreshing(subscriptionId);
      
      // 模拟同步过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSubscriptions(prev => prev.map(sub => {
        if (sub.id === subscriptionId) {
          const newLog: SyncLog = {
            id: 'log-' + Date.now(),
            timestamp: new Date().toLocaleString(),
            status: 'success',
            message: '手动同步完成',
            recordsProcessed: Math.floor(Math.random() * 1000) + 100,
            duration: '1.8s'
          };
          
          return {
            ...sub,
            lastSync: new Date().toLocaleString(),
            nextSync: new Date(Date.now() + 3600000).toLocaleString(), // 1小时后
            recordsProcessed: sub.recordsProcessed + (newLog.recordsProcessed || 0),
            syncLogs: [newLog, ...sub.syncLogs.slice(0, 9)] // 保留最近10条
          };
        }
        return sub;
      }));
      
      toast.success('手动同步完成');
    } catch (error) {
      toast.error('同步失败，请稍后重试');
    } finally {
      setRefreshing(null);
    }
  };

  // 删除订阅
  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!confirm('确定要删除这个订阅吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
      toast.success('订阅已删除');
    } catch (error) {
      toast.error('删除失败，请稍后重试');
    }
  };

  // 查看详情
  const handleViewDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsDetailDialogOpen(true);
  };

  // 导出同步日志
  const handleExportLogs = (subscription: Subscription) => {
    const logs = subscription.syncLogs.map(log => ({
      时间: log.timestamp,
      状态: log.status === 'success' ? '成功' : log.status === 'error' ? '错误' : '警告',
      消息: log.message,
      处理记录数: log.recordsProcessed || '-',
      耗时: log.duration || '-',
      错误详情: log.errorDetails || '-'
    }));
    
    const csvContent = [
      Object.keys(logs[0]).join(','),
      ...logs.map(log => Object.values(log).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${subscription.name}_sync_logs.csv`;
    link.click();
    
    toast.success('同步日志已导出');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>数据订阅管理</DialogTitle>
          <DialogDescription>
            管理所有数据源订阅，监控同步状态，查看同步日志和错误信息。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="w-[200px]">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">总订阅数</p>
                    <p className="text-2xl font-bold">{subscriptions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="w-[200px]">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">运行中</p>
                    <p className="text-2xl font-bold">
                      {subscriptions.filter(s => s.status === 'active').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="w-[200px]">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">错误</p>
                    <p className="text-2xl font-bold">
                      {subscriptions.filter(s => s.status === 'error').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="w-[200px]">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">平均成功率</p>
                    <p className="text-2xl font-bold">
                      {subscriptions.length > 0 
                        ? Math.round(subscriptions.reduce((acc, s) => acc + s.successRate, 0) / subscriptions.length)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 操作工具栏 */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button onClick={loadSubscriptions} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </div>

          {/* 订阅列表 */}
          <Card>
            <CardHeader>
              <CardTitle>订阅列表</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>加载中...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>同步频率</TableHead>
                      <TableHead>最后同步</TableHead>
                      <TableHead>成功率</TableHead>
                      <TableHead>进度</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => {
                      const statusInfo = getStatusInfo(subscription.status);
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <TableRow key={subscription.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{subscription.name}</div>
                              <div className="text-sm text-gray-500">{subscription.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getDataSourceIcon(subscription.dataSourceType)}
                              <span className="capitalize">{subscription.dataSourceType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="flex items-center space-x-1 w-fit">
                              <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                              <span>{statusInfo.text}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{subscription.syncFrequency}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{subscription.lastSync}</div>
                              {subscription.nextSync !== '-' && (
                                <div className="text-gray-500">下次: {subscription.nextSync}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm ${
                                subscription.successRate >= 95 ? 'text-green-600' :
                                subscription.successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {subscription.successRate}%
                              </span>
                              {subscription.errorCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {subscription.errorCount} 错误
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress 
                                value={(subscription.recordsProcessed / subscription.recordsTotal) * 100} 
                                className="w-20"
                              />
                              <div className="text-xs text-gray-500">
                                {subscription.recordsProcessed.toLocaleString()} / {subscription.recordsTotal.toLocaleString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {subscription.status === 'active' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusControl(subscription.id, 'pause')}
                                  disabled={refreshing === subscription.id}
                                >
                                  <Pause className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusControl(subscription.id, 'start')}
                                  disabled={refreshing === subscription.id}
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleManualSync(subscription.id)}
                                disabled={refreshing === subscription.id}
                              >
                                <RefreshCw className={`h-3 w-3 ${refreshing === subscription.id ? 'animate-spin' : ''}`} />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(subscription)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteSubscription(subscription.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 订阅详情对话框 */}
        {selectedSubscription && (
          <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedSubscription.name} - 详细信息</DialogTitle>
                <DialogDescription>
                  查看订阅的详细配置、同步状态和历史日志
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">概览</TabsTrigger>
                  <TabsTrigger value="logs">同步日志</TabsTrigger>
                  <TabsTrigger value="config">配置信息</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">基本信息</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">订阅ID:</span>
                          <span className="font-mono">{selectedSubscription.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">数据源类型:</span>
                          <div className="flex items-center space-x-2">
                            {getDataSourceIcon(selectedSubscription.dataSourceType)}
                            <span className="capitalize">{selectedSubscription.dataSourceType}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">创建时间:</span>
                          <span>{selectedSubscription.createdAt}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">更新时间:</span>
                          <span>{selectedSubscription.updatedAt}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">同步统计</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">总记录数:</span>
                          <span>{selectedSubscription.recordsTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">已处理:</span>
                          <span>{selectedSubscription.recordsProcessed.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">成功率:</span>
                          <span className={`font-medium ${
                            selectedSubscription.successRate >= 95 ? 'text-green-600' :
                            selectedSubscription.successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {selectedSubscription.successRate}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">错误次数:</span>
                          <span className={selectedSubscription.errorCount > 0 ? 'text-red-600' : 'text-green-600'}>
                            {selectedSubscription.errorCount}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">同步进度</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>处理进度</span>
                          <span>
                            {selectedSubscription.recordsProcessed.toLocaleString()} / {selectedSubscription.recordsTotal.toLocaleString()}
                          </span>
                        </div>
                        <Progress 
                          value={(selectedSubscription.recordsProcessed / selectedSubscription.recordsTotal) * 100} 
                          className="h-3"
                        />
                        <div className="text-xs text-gray-500 text-center">
                          {Math.round((selectedSubscription.recordsProcessed / selectedSubscription.recordsTotal) * 100)}% 完成
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">同步日志</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportLogs(selectedSubscription)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      导出日志
                    </Button>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>时间</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>消息</TableHead>
                            <TableHead>处理记录</TableHead>
                            <TableHead>耗时</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSubscription.syncLogs.length > 0 ? (
                            selectedSubscription.syncLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="font-mono text-sm">
                                  {log.timestamp}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    log.status === 'success' ? 'default' :
                                    log.status === 'error' ? 'destructive' : 'secondary'
                                  }>
                                    {log.status === 'success' ? '成功' :
                                     log.status === 'error' ? '错误' : '警告'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div>{log.message}</div>
                                    {log.errorDetails && (
                                      <div className="text-xs text-red-600 mt-1">
                                        {log.errorDetails}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {log.recordsProcessed ? log.recordsProcessed.toLocaleString() : '-'}
                                </TableCell>
                                <TableCell>
                                  {log.duration || '-'}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                暂无同步日志
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="config" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">连接配置</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedSubscription.connectionInfo.host && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">主机:</span>
                          <span className="font-mono">{selectedSubscription.connectionInfo.host}</span>
                        </div>
                      )}
                      {selectedSubscription.connectionInfo.database && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">数据库:</span>
                          <span className="font-mono">{selectedSubscription.connectionInfo.database}</span>
                        </div>
                      )}
                      {selectedSubscription.connectionInfo.url && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">URL:</span>
                          <span className="font-mono break-all">{selectedSubscription.connectionInfo.url}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">同步频率:</span>
                        <span>{selectedSubscription.syncFrequency}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">描述信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">
                        {selectedSubscription.description || '暂无描述'}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}