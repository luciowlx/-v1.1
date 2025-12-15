import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  X, 
  Database, 
  Calendar, 
  User, 
  FileText, 
  BarChart3, 
  Settings, 
  Activity,
  Thermometer,
  Gauge,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  History,
  Trash2
} from 'lucide-react';

interface DataDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: {
    id: string;
    name: string;
    type: string;
    source: string;
    size: string;
    version: string;
    updateTime: string;
    status: 'success' | 'processing' | 'failed';
    description?: string;
    fieldCount: number;
    sampleCount: number;
    completeness: number;
  };
}

interface SensorData {
  timestamp: string;
  temperature: number;
  pressure: number;
  humidity: number;
  status: 'normal' | 'warning' | 'error';
}

interface QualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
}

interface VersionInfo {
  versionNumber: string;
  source: '上传' | '订阅' | '清洗';
  createTime: string;
  creator: string;
  size: string;
  status: '成功' | '失败';
  fieldCount: number;
  sampleCount: number;
  missingRate: number;
  anomalyRate: number;
}

export function DataDetailDialog({ isOpen, onClose, dataset }: DataDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // 模拟传感器数据
  const sensorData: SensorData[] = [
    { timestamp: '2024-01-15 14:30:00', temperature: 42.1, pressure: 6.2, humidity: 2.1, status: 'normal' },
    { timestamp: '2024-01-15 14:31:00', temperature: 43.1, pressure: 6.4, humidity: 2.3, status: 'normal' },
    { timestamp: '2024-01-15 14:32:00', temperature: 41.8, pressure: 6.1, humidity: 1.9, status: 'normal' },
    { timestamp: '2024-01-15 14:27:00', temperature: 44.2, pressure: 6.8, humidity: 2.8, status: 'warning' },
    { timestamp: '2024-01-15 14:28:00', temperature: 40.5, pressure: 5.9, humidity: 1.7, status: 'normal' },
    { timestamp: '2024-01-15 14:29:00', temperature: 42.9, pressure: 6.3, humidity: 2.2, status: 'normal' },
    { timestamp: '2024-01-15 14:25:00', temperature: 41.1, pressure: 7.2, humidity: 3.1, status: 'warning' },
    { timestamp: '2024-01-15 14:23:00', temperature: 41.2, pressure: 6.0, humidity: 1.8, status: 'normal' },
  ];

  // 模拟数据质量指标
  const qualityMetrics: QualityMetrics = {
    completeness: 95,
    accuracy: 99,
    consistency: 96,
    timeliness: 93
  };

  // 模拟版本信息
  const versionInfo: VersionInfo = {
    versionNumber: 'v1.3',
    source: '清洗',
    createTime: '2024-01-18 16:45:00',
    creator: '赵六',
    size: '0MB',
    status: '失败',
    fieldCount: 0,
    sampleCount: 0,
    missingRate: 0,
    anomalyRate: 0
  };

  const getStatusBadge = (status: string) => {
    // 统一展示为：成功/失败/导入中；兼容历史“处理中”
    const normalized = (status || '').toLowerCase();
    const isProcessing = normalized.includes('processing') || normalized.includes('处理中') || normalized.includes('导入中');
    const isSuccess = normalized.includes('success') || status === '成功';
    const isFailed = normalized.includes('failed') || status === '失败';

    const variant = isSuccess ? 'default' : isProcessing ? 'secondary' : isFailed ? 'destructive' : 'outline';
    const label = isSuccess ? '成功' : isProcessing ? '导入中' : isFailed ? '失败' : status;

    return (
      <Badge variant={variant as any}>
        {label}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const variants = {
      '上传': 'secondary',
      '订阅': 'outline',
      '清洗': 'default'
    } as const;
    
    return (
      <Badge variant={variants[source as keyof typeof variants]}>
        {source}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">数据详情</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">数据概览</TabsTrigger>
            <TabsTrigger value="quality">数据质量</TabsTrigger>
            <TabsTrigger value="version">版本详情</TabsTrigger>
          </TabsList>

          {/* 数据概览 */}
          <TabsContent value="overview" className="space-y-6">
            {/* 基本信息卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  {dataset.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{dataset.sampleCount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">数据条数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{qualityMetrics.completeness}%</div>
                    <div className="text-sm text-gray-500">记录率</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{dataset.fieldCount}</div>
                    <div className="text-sm text-gray-500">数据元数量</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{dataset.fieldCount}</div>
                    <div className="text-sm text-gray-500">平均处理量</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 数据源信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  <span className="text-blue-600">Linux系统和数据库连接</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    本数据集来自Linux系统的数据库连接，可通过Linux系统平台进行管理。数据数据库的分析作业已启动，或用
                    Linux数据平台合规自动分析作业
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 数据来源配置分析 */}
            <Card>
              <CardHeader>
                <CardTitle>数据来源配置分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">数据来源分析检验</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">数据输出分析</span>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">
                    管理数据来源全分析，同意管理数据系统数据规模2465
                    条数据，高级管理者，期间比例约30%。
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 多项详情 */}
            <Card>
              <CardHeader>
                <CardTitle>多项详情</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">时间周期</label>
                    <p className="text-sm">发布时间</p>
                    <p className="font-medium">范围：55.8-94.0</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">温度 (°C)</label>
                    <p className="text-sm">范围：55.8-75.8</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">应用：原动、液压2</label>
                    <p className="text-sm">平均：9月2</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">压力(MPa)</label>
                    <p className="text-sm">脉冲频率(mmHg)</p>
                    <p className="font-medium">平均：2.1</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 数据法规验证 */}
            <Card>
              <CardHeader>
                <CardTitle>数据法规验证</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">验证：normal, warning, error</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 数据操作日志 */}
            <Card>
              <CardHeader>
                <CardTitle>数据操作日志（最近操作记录）</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间周期</TableHead>
                      <TableHead>温度(°C)</TableHead>
                      <TableHead>压力(MPa)</TableHead>
                      <TableHead>脉冲频率(mmHg)</TableHead>
                      <TableHead>诊断状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sensorData.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell>{data.timestamp}</TableCell>
                        <TableCell>{data.temperature}</TableCell>
                        <TableCell>{data.pressure}</TableCell>
                        <TableCell>{data.humidity}</TableCell>
                        <TableCell>{getStatusBadge(data.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 数据质量 */}
          <TabsContent value="quality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>数据质量评估</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{qualityMetrics.completeness}%</div>
                    <div className="text-sm text-gray-500 mt-1">完整性</div>
                    <Progress value={qualityMetrics.completeness} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{qualityMetrics.accuracy}%</div>
                    <div className="text-sm text-gray-500 mt-1">准确性</div>
                    <Progress value={qualityMetrics.accuracy} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{qualityMetrics.consistency}%</div>
                    <div className="text-sm text-gray-500 mt-1">一致性</div>
                    <Progress value={qualityMetrics.consistency} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{qualityMetrics.timeliness}%</div>
                    <div className="text-sm text-gray-500 mt-1">时效性</div>
                    <Progress value={qualityMetrics.timeliness} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 质量问题分析 */}
            <Card>
              <CardHeader>
                <CardTitle>质量问题分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">发现 3 个潜在质量问题</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-800">温度数据异常</div>
                    <div className="text-sm text-yellow-700">检测到 2 个温度读数超出正常范围</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-800">压力数据波动</div>
                    <div className="text-sm text-yellow-700">压力数据在某些时间段存在异常波动</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-800">时间戳不连续</div>
                    <div className="text-sm text-yellow-700">部分时间戳存在间隔不规律的情况</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 版本详情 */}
          <TabsContent value="version" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">版本详情</h2>
                <p className="text-gray-600">{dataset.name} - {versionInfo.versionNumber}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  实际
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  清洗
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    基本信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">版本号</label>
                      <p className="text-lg font-semibold">{versionInfo.versionNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">来源方式</label>
                      <div className="mt-1">{getSourceBadge(versionInfo.source)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">创建时间</label>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        <span>{versionInfo.createTime}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">创建人</label>
                      <div className="flex items-center mt-1">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        <span>{versionInfo.creator}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">数据大小</label>
                      <div className="flex items-center mt-1">
                        <Database className="h-4 w-4 mr-1 text-gray-400" />
                        <span>{versionInfo.size}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">状态</label>
                      <div className="mt-1">{getStatusBadge(versionInfo.status)}</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">描述</label>
                    <p className="mt-1 text-gray-700">清洗失败</p>
                  </div>
                </CardContent>
              </Card>

              {/* 统计信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    统计信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{versionInfo.fieldCount}</div>
                      <div className="text-sm text-blue-600">字段数</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{versionInfo.sampleCount}</div>
                      <div className="text-sm text-green-600">样本数</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">{versionInfo.missingRate}%</div>
                      <div className="text-sm text-yellow-600">缺失比例</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">{versionInfo.anomalyRate}%</div>
                      <div className="text-sm text-red-600">异常比例</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}