import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { IndustryCharts } from "./IndustryCharts";
import { useLanguage } from "../i18n/LanguageContext";
import { 
  ArrowLeft,
  Play,
  BarChart3,
  TrendingUp,
  Target,
  Brain,
  Database,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw
} from "lucide-react";

interface TaskDetailProps {
  taskId: string;
  onBack: () => void;
}

interface DataRow {
  [key: string]: string | number;
}

export function TaskDetail({ taskId, onBack }: TaskDetailProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const itemsPerPage = 10;
  const { t } = useLanguage();

  // 模拟工业场景任务数据
  const getTaskData = (taskId: string) => {
    const taskMap: { [key: string]: any } = {
      "Task-20250922-A": {
        id: taskId,
        projectName: "钢铁缺陷预测",
        dataset: "钢材质检数据v2.1",
        mode: "高精准模式",
        accuracy: "96.8%",
        createTime: "2025-09-22 11:00",
        status: "运行中",
        industry: "steel",
        description: "基于机器视觉的钢材表面缺陷智能检测，通过深度学习算法识别钢材表面的划痕、氧化、裂纹等缺陷类型"
      },
      "Task-20250922-B": {
        id: taskId,
        projectName: "电力能源预测",
        dataset: "电网负荷数据v1.1",
        mode: "高召回模式",
        accuracy: "94.1%",
        createTime: "2025-09-22 14:15",
        status: "已完成",
        industry: "power",
        description: "智能电网负荷预测与能源调度优化，基于历史用电数据和天气因素预测未来电力需求"
      },
      "Task-20250921-C": {
        id: taskId,
        projectName: "工艺时序预测",
        dataset: "生产工艺数据v1.0",
        mode: "均衡模式",
        accuracy: "88.7%",
        createTime: "2025-09-21 20:00",
        status: "已完成",
        industry: "manufacturing",
        description: "制造工艺参数优化与质量预测，通过时序分析优化生产工艺参数，提升产品质量"
      },
      "Task-20250921-D": {
        id: taskId,
        projectName: "设备故障预测",
        dataset: "设备监测数据v2.3",
        mode: "高精准模式",
        accuracy: "92.5%",
        createTime: "2025-09-21 16:30",
        status: "已暂停",
        industry: "equipment",
        description: "工业设备健康状态监测与故障预警，基于振动、温度、压力等传感器数据预测设备故障"
      },
      "Task-20250920-E": {
        id: taskId,
        projectName: "化工安全预测",
        dataset: "化工过程数据v1.5",
        mode: "高召回模式",
        accuracy: "95.2%",
        createTime: "2025-09-20 09:45",
        status: "运行中",
        industry: "chemical",
        description: "化工生产过程安全风险评估与预警，监测化工过程中的温度、压力、流量等关键参数"
      },
      "Task-20250920-F": {
        id: taskId,
        projectName: "物流配送优化",
        dataset: "配送路径数据v3.0",
        mode: "均衡模式",
        accuracy: "89.3%",
        createTime: "2025-09-20 08:30",
        status: "已完成",
        industry: "logistics",
        description: "智能物流路径规划与配送效率优化，基于交通状况、配送距离等因素优化配送路线"
      }
    };
    
    return taskMap[taskId] || {
      id: taskId,
      projectName: "未知任务",
      dataset: "v1.0",
      mode: "均衡模式",
      accuracy: "90.0%",
      createTime: "2025-09-22 12:00",
      status: "运行中",
      industry: "general",
      description: "通用机器学习任务"
    };
  };

  const taskData = getTaskData(taskId);

  // 模拟数据集数据
  const datasetColumns = [
    "X用户小区编码", "X用户大区编码", "Y用户大区编码", "客服投诉", "X7天消费", "Y7天消费", "流失标识", "是否流失"
  ];

  // 全量数据集
  const allDatasetRows: DataRow[] = [
    { "X用户小区编码": "1387916", "X用户大区编码": "11490642", "Y用户大区编码": "1190637", "客服投诉": "否", "X7天消费": "12701", "Y7天消费": "1903329", "流失标识": "0.3294", "是否流失": "否" },
    { "X用户小区编码": "1387916", "X用户大区编码": "11490642", "Y用户大区编码": "1190637", "客服投诉": "否", "X7天消费": "12701", "Y7天消费": "1903329", "流失标识": "0.3294", "是否流失": "否" },
    { "X用户小区编码": "1.0414", "X用户大区编码": "32490642", "Y用户大区编码": "2134", "客服投诉": "否", "X7天消费": "1.4543", "Y7天消费": "1132440", "流失标识": "0.1404", "是否流失": "否" },
    { "X用户小区编码": "1.2306", "X用户大区编码": "8940", "Y用户大区编码": "1103642", "客服投诉": "否", "X7天消费": "1.2346", "Y7天消费": "1903329", "流失标识": "0.1404", "是否流失": "否" },
    { "X用户小区编码": "1.67902", "X用户大区编码": "3142", "Y用户大区编码": "6942", "客服投诉": "否", "X7天消费": "1.5668", "Y7天消费": "1903329", "流失标识": "0.2400", "是否流失": "否" },
    { "X用户小区编码": "2387916", "X用户大区编码": "21490642", "Y用户大区编码": "2190637", "客服投诉": "是", "X7天消费": "22701", "Y7天消费": "2903329", "流失标识": "0.8294", "是否流失": "是" },
    { "X用户小区编码": "3387916", "X用户大区编码": "31490642", "Y用户大区编码": "3190637", "客服投诉": "否", "X7天消费": "32701", "Y7天消费": "3903329", "流失标识": "0.1294", "是否流失": "否" }
  ];

  // 根据选中标签过滤数据的函数
  const getFilteredData = () => {
    if (selectedTags.length === 0) {
      return allDatasetRows;
    }
    
    // 根据选中的标签过滤数据
    return allDatasetRows.filter(row => {
      return selectedTags.some(tag => {
        if (tag === "客服投诉" && row["客服投诉"] === "是") return true;
        if (tag === "Y7天消费" && parseInt(row["Y7天消费"] as string) > 2000000) return true;
        if (tag === "高端客户" && parseFloat(row["流失标识"] as string) > 0.5) return true;
        if (tag === "学习类型标签" && row["X用户小区编码"].toString().startsWith("1")) return true;
        return false;
      });
    });
  };

  const datasetRows = getFilteredData();

  // 模拟标签数据
  const labelTags = [
    "X用户大区编码", "Y用户大区编码", "客服投诉", "Y7天消费", "学习类型标签", "客户价值标签", "全网类型标签", "消费类型标签", "高端客户", "高端客户", "高端客户"
  ];

  // 模拟模型评估数据
  const modelEvaluations = [
    {
      name: "LimX",
      accuracy: "91.44%",
      status: "completed",
      color: "bg-blue-500"
    },
    {
      name: "AutoGluon",
      accuracy: "75.38%",
      status: "completed", 
      color: "bg-green-500"
    },
    {
      name: "DeepSeek",
      accuracy: "61.84%",
      status: "completed",
      color: "bg-purple-500"
    }
  ];

  // 模拟预测结果数据
  const allPredictionResults = [
    { id: "1", model: "1st40637", dataset: "1st40637", target: "1st40637", result: "未流失", status: "正常运行", accuracy: "75.38%", type: "DeepSeek", tags: ["学习类型标签"] },
    { id: "2", model: "2nd40637", dataset: "2nd40637", target: "2nd40637", result: "流失", status: "正常运行", accuracy: "85.42%", type: "LimX", tags: ["客服投诉", "高端客户"] },
    { id: "3", model: "3rd40637", dataset: "3rd40637", target: "3rd40637", result: "未流失", status: "正常运行", accuracy: "92.15%", type: "AutoGluon", tags: ["Y7天消费"] },
    { id: "4", model: "4th40637", dataset: "4th40637", target: "4th40637", result: "流失", status: "正常运行", accuracy: "78.63%", type: "DeepSeek", tags: ["高端客户", "客服投诉"] },
    { id: "5", model: "5th40637", dataset: "5th40637", target: "5th40637", result: "未流失", status: "正常运行", accuracy: "88.29%", type: "LimX", tags: ["学习类型标签", "Y7天消费"] },
    { id: "6", model: "6th40637", dataset: "6th40637", target: "6th40637", result: "未流失", status: "正常运行", accuracy: "91.47%", type: "AutoGluon", tags: ["客户价值标签"] },
    { id: "7", model: "7th40637", dataset: "7th40637", target: "7th40637", result: "流失", status: "正常运行", accuracy: "83.56%", type: "DeepSeek", tags: ["全网类型标签", "消费类型标签"] },
    { id: "8", model: "8th40637", dataset: "8th40637", target: "8th40637", result: "未流失", status: "正常运行", accuracy: "89.73%", type: "LimX", tags: ["高端客户"] }
  ];

  // 根据选中标签过滤预测结果
  const getFilteredPredictionResults = () => {
    if (selectedTags.length === 0) {
      return allPredictionResults;
    }
    
    return allPredictionResults.filter(result => {
      return selectedTags.some(tag => result.tags.includes(tag));
    });
  };

  const predictionResults = getFilteredPredictionResults();

  const totalPages = Math.ceil(datasetRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = datasetRows.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 头部导航 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回任务列表</span>
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">任务详情</h1>
            <p className="text-gray-600">任务ID: {taskData.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-green-100 text-green-800 border-green-200">
            {taskData.status}
          </Badge>
          <Button className="bg-blue-500 hover:bg-blue-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 任务基本信息 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>任务概览</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">项目名称</p>
              <p className="font-semibold">{taskData.projectName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">数据集版本</p>
              <p className="font-semibold">{taskData.dataset}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">运行模式</p>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                {taskData.mode}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">创建时间</p>
              <p className="font-semibold">{taskData.createTime}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-1">任务描述</p>
            <p className="text-gray-800">{taskData.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* 工业场景专业图表 */}
      <IndustryCharts industry={taskData.industry} />

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：数据集浏览 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 数据集浏览 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  <span>数据集浏览</span>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  导出数据
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {datasetColumns.map((column, index) => (
                        <th key={index} className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-100 hover:bg-gray-50">
                        {datasetColumns.map((column, colIndex) => (
                          <td key={colIndex} className="py-3 px-4 text-sm text-gray-900">
                            {row[column]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 分页控件 */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className={`w-8 h-8 p-0 ${currentPage === page ? 'bg-blue-500' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  共 {datasetRows.length} 条记录，第 {currentPage} / {totalPages} 页
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 标签自动分析 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <span>标签自动分析</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-3">检测到的标签类型（点击标签进行筛选）</p>
                  <div className="flex flex-wrap gap-2">
                    {labelTags.map((tag, index) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTags(selectedTags.filter(t => t !== tag));
                            } else {
                              setSelectedTags([...selectedTags, tag]);
                            }
                          }}
                        >
                          {tag}
                        </Badge>
                      );
                    })}
                  </div>
                  {selectedTags.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-gray-600">已选择标签：</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.map((tag, index) => (
                          <span key={index} className="text-sm text-blue-600 font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-gray-500 hover:text-gray-700"
                        onClick={() => setSelectedTags([])}
                      >
                        {t("common.clearAll")}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">数值型特征</p>
                    <p className="text-2xl font-bold text-blue-600">6</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">分类型特征</p>
                    <p className="text-2xl font-bold text-green-600">5</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：模型评估 */}
        <div className="space-y-6">
          {/* 多个模型评估 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <span>模型评估</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelEvaluations.map((model, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${model.color}`} />
                        <span className="font-medium">{model.name}</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {model.status === 'completed' ? '已完成' : '运行中'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">准确率</span>
                        <span className="font-semibold">{model.accuracy}</span>
                      </div>
                      <Progress 
                        value={parseFloat(model.accuracy)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4 bg-blue-500 hover:bg-blue-600">
                <Play className="h-4 w-4 mr-2" />
                执行预测
              </Button>
            </CardContent>
          </Card>

          {/* 预测准确率指标 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <span>预测准确率指标</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  LimX: 91.44%, AutoGluon: 75.38%, DeepSeek: 61.84%
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  基于当前数据集的综合评估结果
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">LimX模型</span>
                    <span className="font-semibold text-blue-600">91.44%</span>
                  </div>
                  <Progress value={91.44} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">AutoGluon</span>
                    <span className="font-semibold text-green-600">75.38%</span>
                  </div>
                  <Progress value={75.38} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">DeepSeek</span>
                    <span className="font-semibold text-purple-600">61.84%</span>
                  </div>
                  <Progress value={61.84} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 预测结果表格 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>预测结果</span>
            </div>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Play className="h-4 w-4 mr-2" />
              执行预测
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">模型编号</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">数据集编号</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">目标编号(Target)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">预测结果</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">运行状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">准确率</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">类型</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {predictionResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">{result.model}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{result.dataset}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{result.target}</td>
                    <td className="px-4 py-4">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {result.result}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        {result.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{result.accuracy}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{result.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DeepSeek评估 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>DeepSeek评估</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI模型分析报告</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                基于当前数据集的分析结果，平均准确率达到了<strong>75.38%</strong>，DeepSeek模型在<strong>61.84%</strong>的准确率表现。
              </p>
              <div className="space-y-2">
                <p><strong>1. 数据质量评估：</strong>数据集包含8个主要特征，其中数值型特征6个，分类型特征2个，数据完整性良好。</p>
                <p><strong>2. 模型性能对比：</strong>LimX模型表现最佳(91.44%)，建议优先使用该模型进行预测。</p>
                <p><strong>3. 特征重要性：</strong>X7天消费、Y7天消费等消费相关特征对流失预测贡献最大。</p>
                <p><strong>4. 优化建议：</strong>建议增加更多时间序列特征，如30天、90天的消费数据，以提升模型预测准确性。</p>
              </div>
              <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700 font-medium">💡 DeepSeek建议</p>
                <p className="text-sm text-gray-600 mt-1">
                  当前模型已达到生产环境要求，建议部署LimX模型用于实时预测，同时持续收集新数据以优化模型性能。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}