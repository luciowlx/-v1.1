import React, { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { VirtualTable } from "./ui/virtual-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";
import { Search, RefreshCw, X, ChevronDown, Play, Square, AlertCircle, CheckCircle, GitCompare, Star, Download, Edit, Trash2, BarChart3, TrendingUp, Award, Grid3X3, List, Columns, Settings, Eye, Wrench, RotateCcw, Loader } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

interface Model {
  id: string;
  name: string;
  version: string;
  type: string;
  accuracy: string;
  status: string;
  deployStatus: "未部署" | "部署中" | "已部署" | "部署失败";
  size: string;
  createTime: string;
}

interface ModelManagementProps {
  onOpenModelTuning?: () => void;
}

// 新增：排序类型定义
type SortField = 'name' | 'version' | 'type' | 'accuracy' | 'status' | 'deployStatus' | 'size' | 'createTime';
type SortOrder = 'asc' | 'desc';



export function ModelManagement({ onOpenModelTuning }: ModelManagementProps = {}) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModelDetailOpen, setIsModelDetailOpen] = useState(false);
  const [isModelCompareOpen, setIsModelCompareOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedModelsForCompare, setSelectedModelsForCompare] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("概览");

  
  // 视图模式和列设置状态
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [columnSettings, setColumnSettings] = useState({
    name: { visible: true, order: 1 },
    version: { visible: true, order: 2 },
    type: { visible: true, order: 3 },
    accuracy: { visible: true, order: 4 },
    status: { visible: true, order: 5 },
    deployStatus: { visible: true, order: 6 },
    size: { visible: true, order: 7 },
    createTime: { visible: true, order: 8 },
    actions: { visible: true, order: 9 }
  });
  
  const [models, setModels] = useState<Model[]>([
    {
      id: "model-001",
      name: "异常检测模型",
      version: "v1.0",
      type: "分类",
      accuracy: "92.1%",
      status: "已完成",
      deployStatus: "已部署",
      size: "12 MB",
      createTime: "2024/1/8"
    },
    {
      id: "model-002",
      name: "预测分析模型",
      version: "v2.1",
      type: "回归",
      accuracy: "88.5%",
      status: "已完成",
      deployStatus: "未部署",
      size: "8 MB",
      createTime: "2024/1/5"
    },
    {
      id: "model-003",
      name: "图像识别模型",
      version: "v1.5",
      type: "深度学习",
      accuracy: "95.3%",
      status: "训练中",
      deployStatus: "未部署",
      size: "45 MB",
      createTime: "2024/1/3"
    },
    {
      id: "model-004",
      name: "文本分类模型",
      version: "v1.2",
      type: "NLP",
      accuracy: "89.7%",
      status: "已完成",
      deployStatus: "部署失败",
      size: "15 MB",
      createTime: "2024/1/1"
    }
  ]);

  // 过滤模型
  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || model.type === categoryFilter;
    const matchesStatus = statusFilter === "all" || model.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // 新增：排序状态与排序后的数据
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({ field: 'createTime', order: 'desc' });

  const sortedModels = useMemo(() => {
    const arr = [...filteredModels];
    const dir = sortConfig.order === 'asc' ? 1 : -1;
    const getAccuracy = (s: string) => {
      const n = parseFloat((s || '').replace('%',''));
      return isNaN(n) ? 0 : n;
    };
    const getSizeMB = (s: string) => {
      const m = /([\d.]+)\s*(KB|MB|GB)?/i.exec(s || '');
      let val = parseFloat(m?.[1] || '0');
      const unit = (m?.[2] || 'MB').toUpperCase();
      if (unit === 'GB') val *= 1024;
      if (unit === 'KB') val /= 1024;
      return isNaN(val) ? 0 : val;
    };
    const getVersionNum = (s: string) => {
      const v = parseFloat((s || '').replace(/^v/i, ''));
      return isNaN(v) ? 0 : v;
    };
    const statusRank = (s: string) => {
      const map: Record<string, number> = { '已完成': 3, '训练中': 2, '待训练': 1 };
      return map[s] ?? 0;
    };
    const deployRank = (s: string) => {
      const map: Record<string, number> = { '已部署': 3, '部署中': 2, '部署失败': 1, '未部署': 0 };
      return map[s] ?? 0;
    };

    arr.sort((a, b) => {
      switch (sortConfig.field) {
        case 'name':
          return dir * a.name.localeCompare(b.name, 'zh-Hans');
        case 'version':
          return dir * (getVersionNum(a.version) - getVersionNum(b.version));
        case 'type':
          return dir * a.type.localeCompare(b.type, 'zh-Hans');
        case 'accuracy':
          return dir * (getAccuracy(a.accuracy) - getAccuracy(b.accuracy));
        case 'status':
          return dir * (statusRank(a.status) - statusRank(b.status));
        case 'deployStatus':
          return dir * (deployRank(a.deployStatus) - deployRank(b.deployStatus));
        case 'size':
          return dir * (getSizeMB(a.size) - getSizeMB(b.size));
        case 'createTime':
        default:
          return dir * ((new Date(a.createTime).getTime()) - (new Date(b.createTime).getTime()));
      }
    });
    return arr;
  }, [filteredModels, sortConfig]);

  // 新增：行选择与批量操作状态/方法
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const allVisibleIds = useMemo(() => sortedModels.map(m => m.id), [sortedModels]);
  const isAllSelected = useMemo(() => allVisibleIds.length > 0 && allVisibleIds.every(id => selectedModelIds.includes(id)), [allVisibleIds, selectedModelIds]);

  const handleToggleSelect = (id: string, checked: boolean) => {
    setSelectedModelIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id));
  };
  const handleSelectAllVisible = (checked: boolean) => {
    setSelectedModelIds(prev => checked ? Array.from(new Set([...prev, ...allVisibleIds])) : prev.filter(id => !allVisibleIds.includes(id)));
  };
  const clearSelection = () => setSelectedModelIds([]);

  const handleBatchDeploy = () => {
    const targets = models.filter(m => selectedModelIds.includes(m.id) && m.status === '已完成');
    targets.forEach(m => handleDeployModel(m));
  };
  const handleBatchUndeploy = () => {
    const targets = models.filter(m => selectedModelIds.includes(m.id));
    targets.forEach(m => handleUndeployModel(m));
  };
  const handleBatchRetry = () => {
    const targets = models.filter(m => selectedModelIds.includes(m.id) && m.deployStatus === '部署失败');
    targets.forEach(m => handleDeployModel(m));
  };
  const handleBatchDelete = () => {
    setModels(prev => prev.filter(m => !selectedModelIds.includes(m.id)));
    clearSelection();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleModelDetail = (model: Model) => {
    setSelectedModel(model);
    setIsModelDetailOpen(true);
  };

  const handleDeployModel = (model: Model) => {
    setModels(prev => prev.map(m => 
      m.id === model.id 
        ? { ...m, deployStatus: "部署中" as const }
        : m
    ));
    
    setTimeout(() => {
      setModels(prev => prev.map(m => 
        m.id === model.id 
          ? { ...m, deployStatus: "已部署" as const }
          : m
      ));
    }, 2000);
  };

  const handleUndeployModel = (model: Model) => {
    setModels(prev => prev.map(m => 
      m.id === model.id 
        ? { ...m, deployStatus: "未部署" as const }
        : m
    ));
  };



  return (
    <div className="space-y-4">
      {/* 页面标题和操作按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t("model.title")}</h2>
          <p className="text-gray-600 mt-1">{t("model.description")}</p>
        </div>
        <div className="flex items-center space-x-2">
          {/* 模型对比按钮 */}
          <Button
            variant="outline"
            onClick={() => setIsModelCompareOpen(true)}
            className="flex items-center gap-2"
          >
            <GitCompare className="h-4 w-4" />
            {t("model.compare")}
          </Button>
          
          {/* 刷新按钮 */}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t("model.refresh")}
          </Button>
          
          {/* 视图切换按钮 */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">{t("model.view.grid")}</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">{t("model.view.list")}</span>
            </Button>
          </div>
          
          {/* 列设置按钮 - 只在列表模式下显示 */}
          {viewMode === 'list' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsColumnSettingsOpen(true)}
              className="flex items-center gap-2"
            >
              <Columns className="h-4 w-4" />
              {t("model.columnsSettings")}
            </Button>
          )}
        </div>
      </div>

      {/* 模型微调按钮和搜索筛选区域 */}
      <div className="flex items-center justify-between space-x-4">
        {/* 模型微调按钮 */}
        <Button
          onClick={onOpenModelTuning}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Star className="h-4 w-4" />
          {t("model.tuning")}
        </Button>

        {/* 搜索和筛选 */}
        <div className="flex items-center space-x-3 flex-1 justify-end">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t("model.search.placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("model.filter.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("model.filter.category.all")}</SelectItem>
            <SelectItem value="分类">{t("model.filter.category.classification")}</SelectItem>
            <SelectItem value="回归">{t("model.filter.category.regression")}</SelectItem>
            <SelectItem value="深度学习">{t("model.filter.category.dl")}</SelectItem>
            <SelectItem value="NLP">NLP</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("model.filter.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("model.filter.status.all")}</SelectItem>
            <SelectItem value="已完成">{t("model.filter.status.completed")}</SelectItem>
            <SelectItem value="训练中">{t("model.filter.status.training")}</SelectItem>
            <SelectItem value="待训练">{t("model.filter.status.pending")}</SelectItem>
          </SelectContent>
        </Select>
        </div>
      </div>



      {/* 模型列表 */}
      {viewMode === 'grid' ? (
        // 网格视图
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <Card key={model.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{model.name}</h3>
                    <p className="text-sm text-gray-600">{model.version}</p>
                  </div>
                  <Badge variant={model.status === "已完成" ? "default" : "secondary"}>
                    {model.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">类型:</span>
                    <span>{model.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">准确率:</span>
                    <span className="font-medium text-green-600">{model.accuracy}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">大小:</span>
                    <span>{model.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">创建时间:</span>
                    <span>{model.createTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">部署状态:</span>
                    <Badge 
                      variant={
                        model.deployStatus === "已部署" ? "default" :
                        model.deployStatus === "部署中" ? "secondary" :
                        model.deployStatus === "部署失败" ? "destructive" : "outline"
                      }
                    >
                      {model.deployStatus}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleModelDetail(model)}
                    className="flex-1"
                  >
                    查看详情
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600">
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {/* 根据部署状态显示不同的按钮 */}
                  {model.status === "已完成" && (
                    <>
                      {model.deployStatus === "未部署" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600"
                          onClick={() => handleDeployModel(model)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {model.deployStatus === "已部署" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-orange-600"
                          onClick={() => handleUndeployModel(model)}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      )}
                      {model.deployStatus === "部署中" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600"
                          disabled
                        >
                          <div className="animate-spin h-4 w-4 border border-blue-600 border-t-transparent rounded-full"></div>
                        </Button>
                      )}
                      {model.deployStatus === "部署失败" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => handleDeployModel(model)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // 列表视图
        <div className="p-2">
          <VirtualTable
            data={sortedModels}
            height={520}
            rowHeight={44}
            density="normal"
            enableColumnResize
            enableColumnDrag
            sortState={{ column: sortConfig.field, order: sortConfig.order }}
            onSortChange={(column, order) => {
              setSortConfig({ field: column as SortField, order });
            }}
            headerRight={
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked: boolean) => handleSelectAllVisible(Boolean(checked))}
                />
                <span className="text-xs text-gray-600">全选当前结果</span>
                {selectedModelIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">已选 {selectedModelIds.length} 项</span>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={handleBatchDeploy}>
                      <Play className="h-3 w-3" /> 部署
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={handleBatchUndeploy}>
                      <Square className="h-3 w-3" /> 停止
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={handleBatchRetry}>
                      <RefreshCw className="h-3 w-3" /> 重试
                    </Button>
                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={handleBatchDelete}>
                      <Trash2 className="h-3 w-3" /> 删除
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearSelection}>清空选择</Button>
                  </div>
                )}
              </div>
            }
            freezeLeftCount={1}
            columns={[
              {
                key: 'select',
                label: '',
                width: 48,
                render: (_: any, row: any) => (
                  <Checkbox
                    checked={selectedModelIds.includes(row.id)}
                    onCheckedChange={(checked: boolean) => handleToggleSelect(row.id, Boolean(checked))}
                    aria-label="选择行"
                  />
                ),
              },
              columnSettings.name.visible && {
                key: 'name',
                label: '模型名称',
                width: 180,
                sortable: true,
                render: (value: any) => <span className="font-medium">{value}</span>,
              },
              columnSettings.version.visible && {
                key: 'version',
                label: '版本',
                width: 100,
                sortable: true,
              },
              columnSettings.type.visible && {
                key: 'type',
                label: '类型',
                width: 120,
                sortable: true,
              },
              columnSettings.accuracy.visible && {
                key: 'accuracy',
                label: '准确率',
                width: 120,
                sortable: true,
                render: (value: any) => {
                  const v = typeof value === 'string' && value.endsWith('%') ? parseFloat(value) : Number(value);
                  return (
                    <div className="flex items-center gap-2">
                      <span>{Number.isFinite(v) ? `${v.toFixed(1)}%` : value}</span>
                      {Number.isFinite(v) && (
                        <div className="w-20">
                          <Progress value={v} />
                        </div>
                      )}
                    </div>
                  );
                },
              },
              columnSettings.status.visible && {
                key: 'status',
                label: '训练状态',
                width: 120,
                sortable: true,
                render: (value: any) => (
                  <div className="flex items-center gap-2">
                    {value === '训练中' && <Loader className="h-3 w-3 animate-spin text-blue-600" />}
                    {value === '已训练' && <CheckCircle className="h-3 w-3 text-green-600" />}
                    {value === '失败' && <AlertCircle className="h-3 w-3 text-red-600" />}
                    <span>{value}</span>
                  </div>
                ),
              },
              columnSettings.deployStatus.visible && {
                key: 'deployStatus',
                label: '部署状态',
                width: 120,
                sortable: true,
                render: (value: any, row: any) => (
                  <div className="flex items-center gap-2">
                    {value === '未部署' && (
                      <Button variant="outline" size="sm" className="h-7" onClick={() => handleDeployModel(row)}>
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                    {value === '部署中' && (
                      <div className="animate-spin h-4 w-4 border border-blue-600 border-t-transparent rounded-full"></div>
                    )}
                    {value === '已部署' && (
                      <Button variant="outline" size="sm" className="h-7" onClick={() => handleUndeployModel(row)}>
                        <Square className="h-3 w-3" />
                      </Button>
                    )}
                    {value === '部署失败' && (
                      <Button variant="destructive" size="sm" className="h-7" onClick={() => handleDeployModel(row)}>
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                    <span>{value}</span>
                  </div>
                ),
              },
              columnSettings.size.visible && {
                key: 'size',
                label: '大小',
                width: 100,
                sortable: true,
              },
              columnSettings.createTime.visible && {
                key: 'createTime',
                label: '创建时间',
                width: 160,
                sortable: true,
              },
              {
                key: 'actions',
                label: '操作',
                width: 200,
                render: (_: any, row: any) => (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleModelDetail(row)}>详情</Button>
                    <Button variant="outline" size="sm" onClick={() => onOpenModelTuning?.()}>微调</Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setModels(prev => prev.filter(m => m.id !== row.id))}>删除</Button>
                  </div>
                ),
              },
            ].filter(Boolean) as any}
          />
        </div>
      )}

      {/* 空状态 */}
      {filteredModels.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
          </div>
          <p className="text-gray-500">暂无数据</p>
        </div>
      )}

      {/* 模型详情对话框 */}
      <Dialog open={isModelDetailOpen} onOpenChange={setIsModelDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>模型详情</DialogTitle>
            <DialogDescription>
              查看模型的详细信息和性能指标
            </DialogDescription>
          </DialogHeader>
          
          {selectedModel && (
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="概览">概览</TabsTrigger>
                  <TabsTrigger value="性能">性能</TabsTrigger>
                  <TabsTrigger value="配置">配置</TabsTrigger>
                  <TabsTrigger value="日志">日志</TabsTrigger>
                </TabsList>
                
                <TabsContent value="概览" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">模型名称</Label>
                      <p className="text-sm text-gray-600">{selectedModel.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">版本</Label>
                      <p className="text-sm text-gray-600">{selectedModel.version}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">类型</Label>
                      <p className="text-sm text-gray-600">{selectedModel.type}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">准确率</Label>
                      <p className="text-sm text-green-600 font-medium">{selectedModel.accuracy}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">状态</Label>
                      <Badge variant={selectedModel.status === "已完成" ? "default" : "secondary"}>
                        {selectedModel.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">部署状态</Label>
                      <Badge variant={selectedModel.deployStatus === "已部署" ? "default" : "secondary"}>
                        {selectedModel.deployStatus}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="性能" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">准确率</span>
                          <span className="text-sm text-green-600">{selectedModel.accuracy}</span>
                        </div>
                        <Progress value={parseFloat(selectedModel.accuracy)} className="h-2" />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">召回率</span>
                          <span className="text-sm text-blue-600">87.3%</span>
                        </div>
                        <Progress value={87.3} className="h-2" />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="配置" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">模型大小:</span>
                      <span className="text-sm text-gray-600">{selectedModel.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">创建时间:</span>
                      <span className="text-sm text-gray-600">{selectedModel.createTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">框架:</span>
                      <span className="text-sm text-gray-600">TensorFlow 2.8</span>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="日志" className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">暂无日志信息</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 模型对比对话框 */}
      <Dialog open={isModelCompareOpen} onOpenChange={setIsModelCompareOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>模型对比</DialogTitle>
            <DialogDescription>
              选择要对比的模型并查看详细对比结果
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 模型选择 */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">选择要对比的模型 (最多选择3个)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {models.map((model) => (
                  <Card key={model.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              checked={selectedModelsForCompare.includes(model.id)}
                              onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                  if (selectedModelsForCompare.length < 3) {
                                    setSelectedModelsForCompare([...selectedModelsForCompare, model.id]);
                                  }
                                } else {
                                  setSelectedModelsForCompare(selectedModelsForCompare.filter(id => id !== model.id));
                                }
                              }}
                              disabled={!selectedModelsForCompare.includes(model.id) && selectedModelsForCompare.length >= 3}
                            />
                            <h4 className="font-medium text-sm">{model.name}</h4>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{model.version}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{model.type}</span>
                            <span className="text-green-600 font-medium">{model.accuracy}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* 对比结果 */}
            {selectedModelsForCompare.length >= 2 && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">对比结果</Label>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>指标</TableHead>
                        {selectedModelsForCompare.map(modelId => {
                          const model = models.find(m => m.id === modelId);
                          return (
                            <TableHead key={modelId}>{model?.name}</TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">准确率</TableCell>
                        {selectedModelsForCompare.map(modelId => {
                          const model = models.find(m => m.id === modelId);
                          return (
                            <TableCell key={modelId} className="text-green-600 font-medium">
                              {model?.accuracy}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">模型大小</TableCell>
                        {selectedModelsForCompare.map(modelId => {
                          const model = models.find(m => m.id === modelId);
                          return (
                            <TableCell key={modelId}>{model?.size}</TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">类型</TableCell>
                        {selectedModelsForCompare.map(modelId => {
                          const model = models.find(m => m.id === modelId);
                          return (
                            <TableCell key={modelId}>{model?.type}</TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">状态</TableCell>
                        {selectedModelsForCompare.map(modelId => {
                          const model = models.find(m => m.id === modelId);
                          return (
                            <TableCell key={modelId}>
                              <Badge variant={model?.status === "已完成" ? "default" : "secondary"}>
                                {model?.status}
                              </Badge>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 列设置对话框 */}
      <Dialog open={isColumnSettingsOpen} onOpenChange={setIsColumnSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>列设置</DialogTitle>
            <DialogDescription>
              选择要显示的列
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {(Object.entries(columnSettings) as [keyof typeof columnSettings, { visible: boolean; order: number }][]).map(([key, setting]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  checked={setting.visible}
                  onCheckedChange={(checked: boolean) => {
                    setColumnSettings(prev => ({
                      ...prev,
                      [key]: { ...prev[key], visible: !!checked }
                    }));
                  }}
                />
                <Label className="text-sm">
                  {key === 'name' && '名称'}
                  {key === 'version' && '版本'}
                  {key === 'type' && '类型'}
                  {key === 'accuracy' && '准确率'}
                  {key === 'status' && '状态'}
                  {key === 'deployStatus' && '部署状态'}
                  {key === 'size' && '大小'}
                  {key === 'createTime' && '创建时间'}
                  {key === 'actions' && '操作'}
                </Label>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}