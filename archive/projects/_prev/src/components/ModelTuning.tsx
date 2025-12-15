import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Database, Settings, Play, Brain, Zap, Target, BarChart } from "lucide-react";

interface ModelTuningProps {
  onBack: () => void;
}

interface BaseModel {
  id: string;
  name: string;
  description: string;
  accuracy: string;
  type: string;
  size: string;
  params: string;
  features: string[];
}

interface Dataset {
  id: string;
  name: string;
  size: string;
  format: string;
  taskType: string;
  records: number;
  status: "已处理" | "处理中" | "待处理";
  description: string;
}

interface TrainingConfig {
  learningRate: number;
  batchSize: number;
  epochs: number;
  optimizer: string;
  lossFunction: string;
  validationSplit: number;
  earlyStopping: boolean;
  description: string;
}

export function ModelTuning({ onBack }: ModelTuningProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBaseModel, setSelectedBaseModel] = useState<string>("");
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    learningRate: 0.001,
    batchSize: 32,
    epochs: 100,
    optimizer: "Adam",
    lossFunction: "CrossEntropy",
    validationSplit: 0.2,
    earlyStopping: true,
    description: ""
  });
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);

  // 基础模型数据
  const baseModels: BaseModel[] = [
    {
      id: "tabnet-based",
      name: "TabNet-Based模型",
      description: "专为结构化数据设计的深度学习模型，具有可解释性",
      accuracy: "88.5%",
      type: "深度学习",
      size: "45MB",
      params: "2.1M",
      features: ["可解释性强", "适合表格数据", "特征选择"]
    },
    {
      id: "xgboost-enhanced",
      name: "XGBoost-Enhanced模型",
      description: "增强型XGBoost模型，适合复杂数据分类",
      accuracy: "92.3%",
      type: "集成学习",
      size: "28MB",
      params: "1.5M",
      features: ["高精度", "快速训练", "鲁棒性强"]
    },
    {
      id: "automl-classifier",
      name: "AutoML-Classifier自动学习",
      description: "自动化机器学习分类器，无需手动调参",
      accuracy: "89.6%",
      type: "自动机器学习",
      size: "35MB",
      params: "1.8M",
      features: ["自动调参", "适合初学者", "快速部署"]
    },
    {
      id: "deepfm-neural",
      name: "DeepFM深度学习",
      description: "结合FM和深度学习的混合模型",
      accuracy: "90.4%",
      type: "深度学习",
      size: "52MB",
      params: "3.2M",
      features: ["特征交互", "推荐系统", "高效训练"]
    }
  ];

  // 数据集数据（来自数据管理）
  const datasets: Dataset[] = [
    {
      id: "customer-data",
      name: "客户流失数据集",
      size: "12.5MB",
      format: "CSV",
      taskType: "分类",
      records: 50000,
      status: "已处理",
      description: "包含客户基本信息、消费行为和流失标签"
    },
    {
      id: "sales-forecast",
      name: "销售预测数据",
      size: "8.3MB", 
      format: "Excel",
      taskType: "回归",
      records: 30000,
      status: "已处理",
      description: "历史销售数据，用于预测未来销售趋势"
    },
    {
      id: "quality-inspect",
      name: "质量检测样本",
      size: "25.6MB",
      format: "CSV",
      taskType: "分类",
      records: 80000,
      status: "已处理",
      description: "产品质量检测数据，包含多项质量指标"
    },
    {
      id: "market-analysis",
      name: "市场分析数据",
      size: "15.2MB",
      format: "JSON",
      taskType: "时序预测",
      records: 25000,
      status: "处理中",
      description: "市场调研和消费者行为分析数据"
    }
  ];

  const steps = [
    { number: 1, title: "选择基础模型", subtitle: "选择适合您业务需求的基础模型" },
    { number: 2, title: "选择训练数据", subtitle: "选择已处理完成的数据集" },
    { number: 3, title: "配置参数", subtitle: "设置训练参数和模型配置" },
    { number: 4, title: "开始训练", subtitle: "启动模型训练并监控进度" }
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingLogs([
      "初始化训练环境...",
      "加载数据集...",
      "配置模型参数..."
    ]);

    // 模拟训练进度
    const progressInterval = setInterval(() => {
      setTrainingProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTrainingLogs(prev => [...prev, 
            "训练完成！",
            "模型验证中...",
            "保存模型文件...",
            "训练任务已完成！"
          ]);
          return 100;
        }
        
        // 添加训练日志
        if (Math.random() > 0.7) {
          const epoch = Math.floor(newProgress / 10) + 1;
          setTrainingLogs(prev => [...prev, 
            `Epoch ${epoch}/10 - Loss: ${(Math.random() * 0.5 + 0.1).toFixed(4)} - Accuracy: ${(0.7 + Math.random() * 0.2).toFixed(3)}`
          ]);
        }
        
        return newProgress;
      });
    }, 800);
  };

  const canProceedStep1 = selectedBaseModel !== "";
  const canProceedStep2 = selectedDataset !== "";
  const canProceedStep3 = trainingConfig.learningRate > 0 && trainingConfig.batchSize > 0 && trainingConfig.epochs > 0;

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            currentStep >= step.number 
              ? "bg-blue-500 border-blue-500 text-white" 
              : "border-gray-300 text-gray-500"
          }`}>
            {currentStep > step.number ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <span>{step.number}</span>
            )}
          </div>
          <div className="ml-3">
            <div className={`text-sm font-medium ${currentStep >= step.number ? "text-blue-600" : "text-gray-500"}`}>
              {step.title}
            </div>
            <div className="text-xs text-gray-400">{step.subtitle}</div>
          </div>
          {index < steps.length - 1 && (
            <div className={`mx-6 w-12 h-0.5 ${
              currentStep > step.number ? "bg-blue-500" : "bg-gray-300"
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">选择基础模型</h3>
        <p className="text-gray-600">从以下预训练模型中选择最适合您任务的基础模型，不同模型有不同的特点和适用场景。</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {baseModels.map((model) => (
          <Card 
            key={model.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedBaseModel === model.id ? "border-blue-500 bg-blue-50" : ""
            }`}
            onClick={() => setSelectedBaseModel(model.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <Badge className="bg-green-100 text-green-700 mt-1">
                      准确率 {model.accuracy}
                    </Badge>
                  </div>
                </div>
                {selectedBaseModel === model.id && (
                  <CheckCircle className="w-6 h-6 text-blue-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">{model.description}</p>
              
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <span className="text-gray-500">模型类型:</span>
                  <span className="ml-2">{model.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">文件大小:</span>
                  <span className="ml-2">{model.size}</span>
                </div>
                <div>
                  <span className="text-gray-500">参数量:</span>
                  <span className="ml-2">{model.params}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-600">特性:</div>
                <div className="flex flex-wrap gap-2">
                  {model.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">选择训练数据</h3>
        <p className="text-gray-600">从数据管理中已处理完成的数据集选择训练数据，确保数据质量和格式符合要求。</p>
      </div>

      <div className="space-y-4">
        {datasets.map((dataset) => (
          <Card 
            key={dataset.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedDataset === dataset.id ? "border-blue-500 bg-blue-50" : ""
            } ${dataset.status !== "已处理" ? "opacity-60" : ""}`}
            onClick={() => dataset.status === "已处理" && setSelectedDataset(dataset.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Database className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-medium">{dataset.name}</h4>
                      <Badge className={`${
                        dataset.status === "已处理" ? "bg-green-100 text-green-700" :
                        dataset.status === "处理中" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {dataset.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{dataset.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">格式:</span>
                        <span className="ml-2 font-medium">{dataset.format}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">大小:</span>
                        <span className="ml-2 font-medium">{dataset.size}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">任务类型:</span>
                        <span className="ml-2 font-medium">{dataset.taskType}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">样本数:</span>
                        <span className="ml-2 font-medium">{dataset.records.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {selectedDataset === dataset.id && (
                    <CheckCircle className="w-6 h-6 text-blue-500 mr-2" />
                  )}
                  {dataset.status !== "已处理" && (
                    <Clock className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">配置参数</h3>
        <p className="text-gray-600">配置模型训练的参数，合理的参数设置对模型性能至关重要。</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-blue-600" />
              <CardTitle>训练参数配置</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基本参数 */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                基本参数
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="learning-rate">学习率</Label>
                  <Input
                    id="learning-rate"
                    type="number"
                    step="0.001"
                    min="0.0001"
                    max="1"
                    value={trainingConfig.learningRate}
                    onChange={(e) => setTrainingConfig({
                      ...trainingConfig, 
                      learningRate: parseFloat(e.target.value) || 0.001
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-size">批量大小</Label>
                  <Select 
                    value={trainingConfig.batchSize.toString()} 
                    onValueChange={(value: string) => setTrainingConfig({
                      ...trainingConfig, 
                      batchSize: parseInt(value)
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16">16</SelectItem>
                      <SelectItem value="32">32</SelectItem>
                      <SelectItem value="64">64</SelectItem>
                      <SelectItem value="128">128</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="epochs">迭代次数</Label>
                  <Input
                    id="epochs"
                    type="number"
                    min="1"
                    max="1000"
                    value={trainingConfig.epochs}
                    onChange={(e) => setTrainingConfig({
                      ...trainingConfig, 
                      epochs: parseInt(e.target.value) || 100
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validation-split">验证集比例</Label>
                  <Input
                    id="validation-split"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="0.5"
                    value={trainingConfig.validationSplit}
                    onChange={(e) => setTrainingConfig({
                      ...trainingConfig, 
                      validationSplit: parseFloat(e.target.value) || 0.2
                    })}
                  />
                </div>
              </div>
            </div>

            {/* 优化器配置 */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                优化器配置
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>优化器</Label>
                  <Select 
                    value={trainingConfig.optimizer} 
                    onValueChange={(value: string) => setTrainingConfig({
                      ...trainingConfig, 
                      optimizer: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Adam">Adam</SelectItem>
                      <SelectItem value="SGD">SGD</SelectItem>
                      <SelectItem value="RMSprop">RMSprop</SelectItem>
                      <SelectItem value="AdamW">AdamW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>损失函数</Label>
                  <Select 
                    value={trainingConfig.lossFunction} 
                    onValueChange={(value: string) => setTrainingConfig({
                      ...trainingConfig, 
                      lossFunction: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CrossEntropy">CrossEntropy</SelectItem>
                      <SelectItem value="MSE">MSE</SelectItem>
                      <SelectItem value="MAE">MAE</SelectItem>
                      <SelectItem value="BinaryCrossEntropy">BinaryCrossEntropy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 高级选项 */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <BarChart className="w-4 h-4" />
                高级选项
              </h4>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="early-stopping"
                  checked={trainingConfig.earlyStopping}
                  onCheckedChange={(checked: boolean) => setTrainingConfig({
                    ...trainingConfig, 
                    earlyStopping: checked
                  })}
                />
                <Label htmlFor="early-stopping" className="text-sm">
                  启用早停机制
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">训练描述</Label>
                <Textarea
                  id="description"
                  placeholder="请输入训练任务的描述信息（可选）"
                  value={trainingConfig.description}
                  onChange={(e) => setTrainingConfig({
                    ...trainingConfig, 
                    description: e.target.value
                  })}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">开始训练</h3>
        <p className="text-gray-600">确认配置信息并启动模型训练，系统将实时显示训练进度和日志。</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* 配置摘要 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>训练配置摘要</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-3">基础模型</h4>
                <div className="text-sm space-y-1">
                  <div>{baseModels.find(m => m.id === selectedBaseModel)?.name}</div>
                  <div className="text-gray-500">{baseModels.find(m => m.id === selectedBaseModel)?.type}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">训练数据</h4>
                <div className="text-sm space-y-1">
                  <div>{datasets.find(d => d.id === selectedDataset)?.name}</div>
                  <div className="text-gray-500">{datasets.find(d => d.id === selectedDataset)?.records.toLocaleString()} 条记录</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">训练参数</h4>
                <div className="text-sm space-y-1">
                  <div>学习率: {trainingConfig.learningRate}</div>
                  <div>批量大小: {trainingConfig.batchSize}</div>
                  <div>迭代次数: {trainingConfig.epochs}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 训练控制和进度 */}
        {!isTraining ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">准备开始训练</h3>
              <p className="text-gray-600 mb-6">点击下方按钮开始模型训练，训练过程可能需要几分钟到几小时不等</p>
              <Button 
                onClick={handleStartTraining}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                开始训练
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 训练进度 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  训练进度
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">整体进度</span>
                    <span className="text-sm font-medium">{Math.round(trainingProgress)}%</span>
                  </div>
                  <Progress value={trainingProgress} className="h-3" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-600">
                        {Math.floor(trainingProgress / 10)}/10
                      </div>
                      <div className="text-sm text-gray-500">当前轮次</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600">
                        {(0.7 + Math.random() * 0.2).toFixed(3)}
                      </div>
                      <div className="text-sm text-gray-500">当前准确率</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg font-semibold text-orange-600">
                        {(Math.random() * 0.5 + 0.1).toFixed(4)}
                      </div>
                      <div className="text-sm text-gray-500">当前损失</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 训练日志 */}
            <Card>
              <CardHeader>
                <CardTitle>训练日志</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-1">
                    {trainingLogs.map((log, index) => (
                      <div key={index} className="text-green-400 text-sm font-mono">
                        [{new Date().toLocaleTimeString()}] {log}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回模型管理
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-xl font-semibold">模型微调</h1>
              <p className="text-sm text-gray-600">基于预训练模型进行精细调优</p>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto p-6">
        {renderStepIndicator()}
        {renderCurrentStep()}

        {/* 底部导航按钮 */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            上一步
          </Button>
          
          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !canProceedStep1) ||
                (currentStep === 2 && !canProceedStep2) ||
                (currentStep === 3 && !canProceedStep3)
              }
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            >
              下一步
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isTraining && trainingProgress < 100}
            >
              {trainingProgress === 100 ? "完成" : "训练中..."}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}