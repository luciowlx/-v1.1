import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Settings,
  Clock,
  Globe,
  Server,
  Key,
  FileText
} from "lucide-react";
import { toast } from "sonner";

interface DataSubscriptionProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionSuccess?: (subscriptionId: string) => void;
}

type DataSourceType = 'mysql' | 'postgresql' | 'mongodb' | 'redis' | 'elasticsearch' | 'api' | 'ftp';

interface BaseFormData {
  name: string;
  description: string;
  projectId: string; // 所属项目（必填）
  permission: 'private' | 'team' | 'public'; // 权限设置（默认仅项目成员可见）
  dataSourceType: DataSourceType;
  syncFrequency: 'daily' | 'hourly' | 'every10min';
  cronExpression?: string;
  isAdvancedCron: boolean;
}

interface MySQLFormData extends BaseFormData {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  query: string;
}

interface MongoDBFormData extends BaseFormData {
  uri: string;
  database: string;
  collection: string;
  filter: string;
}

interface RedisFormData extends BaseFormData {
  host: string;
  port: string;
  password: string;
  keyPattern: string;
}

interface ElasticsearchFormData extends BaseFormData {
  host: string;
  port: string;
  index: string;
  authType: 'none' | 'basic' | 'apikey';
  username?: string;
  password?: string;
  apiKey?: string;
  query: string;
}

interface APIFormData extends BaseFormData {
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  headers: string;
  params: string;
  authType: 'none' | 'basic' | 'bearer' | 'apikey';
  authValue?: string;
}

interface FTPFormData extends BaseFormData {
  host: string;
  port: string;
  username: string;
  password: string;
  path: string;
  fileType: 'csv' | 'json' | 'xml' | 'all';
}

type FormData = MySQLFormData | MongoDBFormData | RedisFormData | ElasticsearchFormData | APIFormData | FTPFormData;

export function DataSubscription({ isOpen, onClose, onSubscriptionSuccess }: DataSubscriptionProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    projectId: '',
    permission: 'private',
    dataSourceType: 'mysql',
    syncFrequency: 'daily',
    isAdvancedCron: false,
    host: '',
    port: '3306',
    database: '',
    username: '',
    password: '',
    query: ''
  } as MySQLFormData);

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  // 重置表单
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      projectId: '',
      permission: 'private',
      dataSourceType: 'mysql',
      syncFrequency: 'daily',
      isAdvancedCron: false,
      host: '',
      port: '3306',
      database: '',
      username: '',
      password: '',
      query: ''
    } as MySQLFormData);
    setConnectionStatus('idle');
    setConnectionError('');
  }, []);

  // 更新数据源类型
  const handleDataSourceTypeChange = useCallback((type: DataSourceType) => {
    const baseData = {
      name: formData.name,
      description: formData.description,
      projectId: formData.projectId,
      permission: formData.permission,
      dataSourceType: type,
      syncFrequency: formData.syncFrequency,
      isAdvancedCron: formData.isAdvancedCron,
      cronExpression: formData.cronExpression
    };

    switch (type) {
      case 'mysql':
      case 'postgresql':
        setFormData({
          ...baseData,
          host: '',
          port: type === 'mysql' ? '3306' : '5432',
          database: '',
          username: '',
          password: '',
          query: ''
        } as MySQLFormData);
        break;
      case 'mongodb':
        setFormData({
          ...baseData,
          uri: '',
          database: '',
          collection: '',
          filter: '{}'
        } as MongoDBFormData);
        break;
      case 'redis':
        setFormData({
          ...baseData,
          host: '',
          port: '6379',
          password: '',
          keyPattern: '*'
        } as RedisFormData);
        break;
      case 'elasticsearch':
        setFormData({
          ...baseData,
          host: '',
          port: '9200',
          index: '',
          authType: 'none',
          query: '{"query": {"match_all": {}}}'
        } as ElasticsearchFormData);
        break;
      case 'api':
        setFormData({
          ...baseData,
          url: '',
          method: 'GET',
          headers: '{}',
          params: '{}',
          authType: 'none'
        } as APIFormData);
        break;
      case 'ftp':
        setFormData({
          ...baseData,
          host: '',
          port: '21',
          username: '',
          password: '',
          path: '/',
          fileType: 'csv'
        } as FTPFormData);
        break;
    }
    setConnectionStatus('idle');
    setConnectionError('');
  }, [formData.name, formData.description, formData.projectId, formData.permission, formData.syncFrequency, formData.isAdvancedCron, formData.cronExpression]);

  // 测试连接
  const handleTestConnection = useCallback(async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setConnectionError('');

    try {
      // 模拟连接测试
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟随机成功/失败
      const isSuccess = Math.random() > 0.3;
      
      if (isSuccess) {
        setConnectionStatus('success');
        toast.success('连接测试成功', {
          description: '数据源连接正常，可以创建订阅'
        });
      } else {
        setConnectionStatus('error');
        setConnectionError('连接失败，请检查主机地址和认证信息');
        toast.error('连接测试失败', {
          description: '请检查配置信息后重试'
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError('网络错误，请稍后重试');
    } finally {
      setIsTestingConnection(false);
    }
  }, []);

  // 创建订阅
  const handleCreateSubscription = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error('请输入订阅名称');
      return;
    }

    if (!formData.projectId) {
      toast.error('请选择所属项目');
      return;
    }

    if (connectionStatus !== 'success') {
      toast.error('请先测试连接成功后再创建订阅');
      return;
    }

    setIsCreating(true);

    try {
      // 模拟创建订阅
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const subscriptionId = 'sub-' + Date.now();
      
      const visibilityText = formData.permission === 'public'
        ? '公开（非项目成员可查看）'
        : `项目内（${formData.projectId} 成员可见）`;

      toast.success('订阅创建成功', {
        description: `订阅 "${formData.name}" 已成功创建 · 所属项目：${formData.projectId} · 可见性：${visibilityText}`
      });

      if (onSubscriptionSuccess) {
        onSubscriptionSuccess(subscriptionId);
      }

      onClose();
      resetForm();
    } catch (error) {
      toast.error('创建订阅失败', {
        description: '请稍后重试'
      });
    } finally {
      setIsCreating(false);
    }
  }, [formData.name, connectionStatus, onSubscriptionSuccess, onClose, resetForm]);

  // 模拟项目列表（后续可替换为真实项目数据）
  const mockProjects = [
    { id: 'proj_001', name: '钢铁缺陷预测' },
    { id: 'proj_002', name: '电力能源预测' },
    { id: 'proj_003', name: '工艺时序预测' },
    { id: 'proj_004', name: '设备故障预测' }
  ];
  const getProjectName = (id: string) => mockProjects.find(p => p.id === id)?.name || '未选择项目';

  // 关闭对话框
  const handleClose = useCallback(() => {
    if (isCreating) {
      toast.warning('正在创建订阅，请稍候');
      return;
    }
    onClose();
    resetForm();
  }, [isCreating, onClose, resetForm]);

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

  // 渲染数据源特定字段
  const renderDataSourceFields = () => {
    switch (formData.dataSourceType) {
      case 'mysql':
      case 'postgresql':
        const sqlData = formData as MySQLFormData;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">主机地址 *</Label>
                <Input
                  id="host"
                  placeholder="localhost"
                  value={sqlData.host}
                  onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value } as MySQLFormData))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">端口 *</Label>
                <Input
                  id="port"
                  placeholder={formData.dataSourceType === 'mysql' ? '3306' : '5432'}
                  value={sqlData.port}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value } as MySQLFormData))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="database">数据库名 *</Label>
              <Input
                id="database"
                placeholder="database_name"
                value={sqlData.database}
                onChange={(e) => setFormData(prev => ({ ...prev, database: e.target.value } as MySQLFormData))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名 *</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={sqlData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value } as MySQLFormData))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码 *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="password"
                  value={sqlData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value } as MySQLFormData))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="query">查询语句 *</Label>
              <Textarea
                id="query"
                placeholder="SELECT * FROM table_name WHERE condition"
                value={sqlData.query}
                onChange={(e) => setFormData(prev => ({ ...prev, query: e.target.value } as MySQLFormData))}
                rows={3}
              />
            </div>
          </div>
        );

      case 'mongodb':
        const mongoData = formData as MongoDBFormData;
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uri">连接URI *</Label>
              <Input
                id="uri"
                placeholder="mongodb://username:password@host:port"
                value={mongoData.uri}
                onChange={(e) => setFormData(prev => ({ ...prev, uri: e.target.value } as MongoDBFormData))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="database">数据库 *</Label>
                <Input
                  id="database"
                  placeholder="database_name"
                  value={mongoData.database}
                  onChange={(e) => setFormData(prev => ({ ...prev, database: e.target.value } as MongoDBFormData))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection">集合 *</Label>
                <Input
                  id="collection"
                  placeholder="collection_name"
                  value={mongoData.collection}
                  onChange={(e) => setFormData(prev => ({ ...prev, collection: e.target.value } as MongoDBFormData))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter">过滤条件</Label>
              <Textarea
                id="filter"
                placeholder='{"field": "value"}'
                value={mongoData.filter}
                onChange={(e) => setFormData(prev => ({ ...prev, filter: e.target.value } as MongoDBFormData))}
                rows={3}
              />
            </div>
          </div>
        );

      case 'redis':
        const redisData = formData as RedisFormData;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">主机地址 *</Label>
                <Input
                  id="host"
                  placeholder="localhost"
                  value={redisData.host}
                  onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value } as RedisFormData))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">端口 *</Label>
                <Input
                  id="port"
                  placeholder="6379"
                  value={redisData.port}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value } as RedisFormData))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="password (可选)"
                value={redisData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value } as RedisFormData))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyPattern">Key 模式 *</Label>
              <Input
                id="keyPattern"
                placeholder="user:*"
                value={redisData.keyPattern}
                onChange={(e) => setFormData(prev => ({ ...prev, keyPattern: e.target.value } as RedisFormData))}
              />
            </div>
          </div>
        );

      case 'elasticsearch':
        const esData = formData as ElasticsearchFormData;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">主机地址 *</Label>
                <Input
                  id="host"
                  placeholder="localhost"
                  value={esData.host}
                  onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value } as ElasticsearchFormData))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">端口 *</Label>
                <Input
                  id="port"
                  placeholder="9200"
                  value={esData.port}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value } as ElasticsearchFormData))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="index">索引 *</Label>
              <Input
                id="index"
                placeholder="index_name"
                value={esData.index}
                onChange={(e) => setFormData(prev => ({ ...prev, index: e.target.value } as ElasticsearchFormData))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authType">认证方式</Label>
              <Select
                value={esData.authType}
                onValueChange={(value: 'none' | 'basic' | 'apikey') => 
                  setFormData(prev => ({ ...prev, authType: value } as ElasticsearchFormData))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无认证</SelectItem>
                  <SelectItem value="basic">用户名密码</SelectItem>
                  <SelectItem value="apikey">API Key</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {esData.authType === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名 *</Label>
                  <Input
                    id="username"
                    placeholder="username"
                    value={esData.username || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value } as ElasticsearchFormData))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码 *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="password"
                    value={esData.password || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value } as ElasticsearchFormData))}
                  />
                </div>
              </div>
            )}
            {esData.authType === 'apikey' && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <Input
                  id="apiKey"
                  placeholder="your_api_key"
                  value={esData.apiKey || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value } as ElasticsearchFormData))}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="query">查询条件</Label>
              <Textarea
                id="query"
                placeholder='{"query": {"match_all": {}}}'
                value={esData.query}
                onChange={(e) => setFormData(prev => ({ ...prev, query: e.target.value } as ElasticsearchFormData))}
                rows={3}
              />
            </div>
          </div>
        );

      case 'api':
        const apiData = formData as APIFormData;
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">API URL *</Label>
              <Input
                id="url"
                placeholder="https://api.example.com/data"
                value={apiData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value } as APIFormData))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">请求方法</Label>
              <Select
                value={apiData.method}
                onValueChange={(value: 'GET' | 'POST' | 'PUT') => 
                  setFormData(prev => ({ ...prev, method: value } as APIFormData))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="headers">请求头</Label>
              <Textarea
                id="headers"
                placeholder='{"Content-Type": "application/json"}'
                value={apiData.headers}
                onChange={(e) => setFormData(prev => ({ ...prev, headers: e.target.value } as APIFormData))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="params">请求参数</Label>
              <Textarea
                id="params"
                placeholder='{"param1": "value1"}'
                value={apiData.params}
                onChange={(e) => setFormData(prev => ({ ...prev, params: e.target.value } as APIFormData))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authType">认证方式</Label>
              <Select
                value={apiData.authType}
                onValueChange={(value: 'none' | 'basic' | 'bearer' | 'apikey') => 
                  setFormData(prev => ({ ...prev, authType: value } as APIFormData))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无认证</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="apikey">API Key</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {apiData.authType !== 'none' && (
              <div className="space-y-2">
                <Label htmlFor="authValue">认证值 *</Label>
                <Input
                  id="authValue"
                  placeholder={
                    apiData.authType === 'basic' ? 'username:password' :
                    apiData.authType === 'bearer' ? 'your_token' :
                    'your_api_key'
                  }
                  value={apiData.authValue || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, authValue: e.target.value } as APIFormData))}
                />
              </div>
            )}
          </div>
        );

      case 'ftp':
        const ftpData = formData as FTPFormData;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">服务器地址 *</Label>
                <Input
                  id="host"
                  placeholder="ftp.example.com"
                  value={ftpData.host}
                  onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value } as FTPFormData))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">端口 *</Label>
                <Input
                  id="port"
                  placeholder="21"
                  value={ftpData.port}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value } as FTPFormData))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名 *</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={ftpData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value } as FTPFormData))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码 *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="password"
                  value={ftpData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value } as FTPFormData))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="path">文件路径 *</Label>
              <Input
                id="path"
                placeholder="/data/files/"
                value={ftpData.path}
                onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value } as FTPFormData))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileType">文件类型</Label>
              <Select
                value={ftpData.fileType}
                onValueChange={(value: 'csv' | 'json' | 'xml' | 'all') => 
                  setFormData(prev => ({ ...prev, fileType: value } as FTPFormData))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="all">所有类型</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增数据源</DialogTitle>
          <DialogDescription>
            支持MySQL、PostgreSQL、Oracle、CSV、Excel、JSON、API、MQTT等多种数据源，提供智能配置向导和实时连接测试。
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="connection">连接配置</TabsTrigger>
            <TabsTrigger value="schedule">同步设置</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">数据源名称 *</Label>
                <Input
                  id="name"
                  placeholder="请输入数据源名称"
                  value={formData.name}
                  onChange={(e) => setFormData((prev): FormData => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataSourceType">数据源类型 *</Label>
                <Select
                  value={formData.dataSourceType}
                  onValueChange={handleDataSourceTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择数据源类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mysql">
                      <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4" />
                        <span>MySQL</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="postgresql">
                      <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4" />
                        <span>PostgreSQL</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="mongodb">
                      <div className="flex items-center space-x-2">
                        <Server className="h-4 w-4" />
                        <span>MongoDB</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="redis">
                      <div className="flex items-center space-x-2">
                        <Key className="h-4 w-4" />
                        <span>Redis</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="elasticsearch">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-4 w-4" />
                        <span>Elasticsearch</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="api">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span>API接口</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ftp">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>FTP</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 所属项目与权限设置 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">所属项目 *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value: string) => setFormData((prev): FormData => ({ ...prev, projectId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择所属项目" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProjects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permission">权限设置</Label>
                  <Select
                    value={formData.permission}
                    onValueChange={(value: 'private' | 'team' | 'public') => 
                      setFormData((prev): FormData => ({ ...prev, permission: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">私有</SelectItem>
                      <SelectItem value="team">团队</SelectItem>
                      <SelectItem value="public">公开</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 可见性预览与说明 */}
              <div className="rounded-md border p-3 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  {(formData as any).permission === 'public' ? (
                    <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">公开数据</Badge>
                  ) : (
                    <Badge variant="outline" className="border-purple-300 text-purple-700">项目内数据</Badge>
                  )}
                  <span className="text-sm text-gray-700">
                    {(formData as any).permission === 'public'
                      ? '公开权限将允许非项目成员查看该数据（覆盖项目归属限制）'
                      : `仅项目“${getProjectName((formData as any).projectId)}”成员可见`}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  注意：所属项目为必填项；默认仅对项目成员可见；将权限设置为“公开”后，任何用户均可查看。
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">数据源描述</Label>
                <Textarea
                  id="description"
                  placeholder="请输入数据源的详细描述，包括数据内容、用途等信息"
                  value={formData.description}
                  onChange={(e) => setFormData((prev): FormData => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="connection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getDataSourceIcon(formData.dataSourceType)}
                  <span>{formData.dataSourceType.toUpperCase()} 连接配置</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderDataSourceFields()}
                
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {connectionStatus === 'success' && (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">连接成功</span>
                        </>
                      )}
                      {connectionStatus === 'error' && (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">{connectionError}</span>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTestingConnection}
                    >
                      {isTestingConnection ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          测试中...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          测试连接
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>同步频率配置</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>同步频率</Label>
                  <Select
                    value={formData.syncFrequency}
                    onValueChange={(value: 'daily' | 'hourly' | 'every10min') => 
                      setFormData((prev): FormData => ({ ...prev, syncFrequency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">每日</SelectItem>
                      <SelectItem value="hourly">每小时</SelectItem>
                      <SelectItem value="every10min">每10分钟</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="advancedCron"
                      checked={formData.isAdvancedCron}
                      onChange={(e) => setFormData((prev): FormData => ({ ...prev, isAdvancedCron: e.target.checked }))}
                    />
                    <Label htmlFor="advancedCron">高级模式（Cron表达式）</Label>
                  </div>
                  {formData.isAdvancedCron && (
                    <div className="space-y-2">
                      <Input
                        placeholder="0 0 * * * (每天午夜)"
                        value={formData.cronExpression || ''}
                        onChange={(e) => setFormData((prev): FormData => ({ ...prev, cronExpression: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500">
                        格式：秒 分 时 日 月 周，例如：0 0 12 * * * 表示每天中午12点
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            取消
          </Button>
          <Button onClick={handleCreateSubscription} disabled={isCreating}>
            {isCreating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                创建数据源
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}