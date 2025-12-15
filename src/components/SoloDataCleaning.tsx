import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { 
  Wand2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  FileText,
  BarChart3,
  Zap,
  Target,
  Layers,
  RefreshCw,
  Download,
  Eye,
  Settings,
  TrendingUp,
  Database,
  Filter,
  X,
  Clock,
  Activity
} from "lucide-react";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

interface SoloDataCleaningProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId?: string;
}

interface AutoCleaningStrategy {
  id: string;
  name: string;
  description: string;
  category: 'quality' | 'format' | 'consistency' | 'completeness';
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  enabled: boolean;
  affectedRows: number;
  affectedColumns: string[];
}

interface CleaningResult {
  strategyId: string;
  strategyName: string;
  status: 'success' | 'failed' | 'warning';
  originalRows: number;
  processedRows: number;
  removedRows: number;
  modifiedCells: number;
  executionTime: string;
  details: {
    field: string;
    action: string;
    count: number;
    examples?: string[];
  }[];
  errors?: string[];
  warnings?: string[];
}

interface DataQualityMetrics {
  completeness: number;
  consistency: number;
  accuracy: number;
  validity: number;
  uniqueness: number;
  overall: number;
}

export function SoloDataCleaning({ isOpen, onClose, datasetId }: SoloDataCleaningProps) {
  // 语音指令输入相关状态与引用
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  // 文本指令与策略联动：关键词映射
  const strategyKeywordMap: { id: string; keywords: string[] }[] = [
    { id: 'remove_duplicates', keywords: ['去重', '重复', '重复记录', '重复值', '重复项'] },
    { id: 'fill_missing_values', keywords: ['缺失', '空值', '缺失值填充', '填充', '补全', '前向填充', '均值', '平均', '众数', 'mode', 'ffill'] },
    { id: 'standardize_formats', keywords: ['格式', '标准化', '日期格式', '时间格式', '格式统一', '格式化'] },
    { id: 'remove_outliers', keywords: ['异常', '离群', '异常值', 'outlier'] },
    { id: 'normalize_text', keywords: ['文本标准化', '大小写', '空白', '去空格', 'trim', 'lowercase', 'uppercase', '清洗文本'] },
  ];

  const computeStrategyScores = useCallback((text: string): Record<string, number> => {
    const t = (text || '').toLowerCase();
    const scores: Record<string, number> = {};
    strategyKeywordMap.forEach(({ id, keywords }) => {
      let score = 0;
      keywords.forEach((k) => {
        if (t.includes(k.toLowerCase())) score += 1;
      });
      scores[id] = score;
    });
    return scores;
  }, []);

  // 初始化语音识别（Web Speech API）
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('当前浏览器不支持语音识别', { description: '建议使用最新的 Chrome/Edge 浏览器' });
      setSpeechStatus('error');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      const results = event.results;
      let transcript = '';
      for (let i = event.resultIndex; i < results.length; i++) {
        transcript += results[i][0].transcript;
      }
      setSpeechText(prev => {
        const combined = (prev + ' ' + transcript).trim();
        return combined.length > 1000 ? combined.slice(combined.length - 1000) : combined;
      });
    };

    recognition.onstart = () => setSpeechStatus('listening');
    recognition.onend = () => {
      if (isListening) {
        try { recognition.start(); } catch {}
      } else {
        setSpeechStatus('idle');
      }
    };
    recognition.onerror = () => setSpeechStatus('error');

    recognitionRef.current = recognition;
  }, [isListening]);

  // 波形绘制
  const drawWaveform = useCallback(() => {
    const canvas = waveformCanvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width = canvas.clientWidth;
    const height = canvas.height = 96;
    analyser.fftSize = 2048;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      animationRef.current = requestAnimationFrame(render);
    };
    render();
  }, []);

  // 开始语音输入
  const startVoiceInput = useCallback(async () => {
    if (isListening) return;
    try {
      setSpeechText('');
      setSpeechStatus('processing');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      source.connect(analyser);

      initSpeechRecognition();
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch {}
      }

      setIsListening(true);
      setSpeechStatus('listening');
      drawWaveform();
    } catch (err) {
      console.error(err);
      setSpeechStatus('error');
      toast.error('无法启动语音输入', { description: '请检查麦克风权限设置' });
    }
  }, [isListening, initSpeechRecognition, drawWaveform]);

  // 停止语音输入
  const stopVoiceInput = useCallback(() => {
    try {
      setIsListening(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (analyserRef.current) analyserRef.current.disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      setSpeechStatus('idle');
    } catch {}
  }, []);

  // 对话框关闭时清理语音资源
  useEffect(() => {
    if (!isOpen && isListening) {
      stopVoiceInput();
    }
  }, [isOpen, isListening, stopVoiceInput]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [cleaningComplete, setCleaningComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState<'analysis' | 'strategy' | 'execution' | 'results'>('analysis');
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');

  // 自动清洗策略
  const [strategies, setStrategies] = useState<AutoCleaningStrategy[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  
  // 清洗结果
  const [cleaningResults, setCleaningResults] = useState<CleaningResult[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<DataQualityMetrics>({
    completeness: 0,
    consistency: 0,
    accuracy: 0,
    validity: 0,
    uniqueness: 0,
    overall: 0
  });

  // 确认弹窗状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'analyze' | 'execute' | null>(null);

  // 数据集信息
  const [datasetInfo, setDatasetInfo] = useState({
    name: '客户行为数据集',
    rows: 125000,
    columns: 15,
    size: '45.2 MB',
    format: 'CSV'
  });

  // 显示确认弹窗
  const showConfirm = (action: 'analyze' | 'execute') => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  // 确认执行操作
  const handleConfirm = () => {
    setShowConfirmDialog(false);
    if (confirmAction === 'analyze') {
      simulateAnalysis();
    } else if (confirmAction === 'execute') {
      executeAutoCleaning();
    }
    setConfirmAction(null);
  };

  // 开始分析
  const handleStartAnalysis = () => {
    showConfirm('analyze');
  };

  // 开始清洗
  const handleStartCleaning = () => {
    showConfirm('execute');
  };

  // 模拟数据分析
  const simulateAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentStep('analysis');
    setProgress(0);

    const steps = [
      '正在扫描数据结构...',
      '检测数据质量问题...',
      '分析缺失值模式...',
      '识别异常值...',
      '检查数据一致性...',
      '生成清洗策略...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentOperation(steps[i]);
      setProgress((i + 1) / steps.length * 100);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // 生成自动策略
    const autoStrategies: AutoCleaningStrategy[] = [
      {
        id: 'remove_duplicates',
        name: '移除重复记录',
        description: '检测到 3,247 条重复记录，建议移除以提高数据质量',
        category: 'quality',
        confidence: 95,
        impact: 'medium',
        enabled: true,
        affectedRows: 3247,
        affectedColumns: ['user_id', 'timestamp', 'action']
      },
      {
        id: 'fill_missing_values',
        name: '填充缺失值',
        description: '使用智能算法填充 age 和 location 字段的缺失值',
        category: 'completeness',
        confidence: 88,
        impact: 'high',
        enabled: true,
        affectedRows: 8934,
        affectedColumns: ['age', 'location']
      },
      {
        id: 'standardize_formats',
        name: '标准化格式',
        description: '统一日期格式和电话号码格式',
        category: 'format',
        confidence: 92,
        impact: 'medium',
        enabled: true,
        affectedRows: 12456,
        affectedColumns: ['created_at', 'phone', 'email']
      },
      {
        id: 'remove_outliers',
        name: '处理异常值',
        description: '检测并处理 purchase_amount 字段中的异常值',
        category: 'quality',
        confidence: 76,
        impact: 'low',
        enabled: false,
        affectedRows: 234,
        affectedColumns: ['purchase_amount']
      },
      {
        id: 'normalize_text',
        name: '文本标准化',
        description: '统一文本字段的大小写和编码格式',
        category: 'consistency',
        confidence: 85,
        impact: 'medium',
        enabled: true,
        affectedRows: 45678,
        affectedColumns: ['name', 'address', 'category']
      }
    ];

    setStrategies(autoStrategies);
    setSelectedStrategies(autoStrategies.filter(s => s.enabled).map(s => s.id));
    setAnalysisComplete(true);
    setIsAnalyzing(false);
    setCurrentStep('strategy');
    
    toast.success('数据分析完成', {
      description: `发现 ${autoStrategies.length} 个优化策略，建议应用 ${autoStrategies.filter(s => s.enabled).length} 个`
    });
  };

  // 执行自动清洗
  const executeAutoCleaning = async () => {
    setIsCleaning(true);
    setCurrentStep('execution');
    setProgress(0);

    const selectedStrategyList = strategies.filter(s => selectedStrategies.includes(s.id));
    const results: CleaningResult[] = [];

    for (let i = 0; i < selectedStrategyList.length; i++) {
      const strategy = selectedStrategyList[i];
      setCurrentOperation(`正在执行: ${strategy.name}`);
      setProgress((i / selectedStrategyList.length) * 100);

      // 模拟执行时间
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 生成模拟结果
      const result: CleaningResult = {
        strategyId: strategy.id,
        strategyName: strategy.name,
        status: Math.random() > 0.1 ? 'success' : 'warning',
        originalRows: datasetInfo.rows,
        processedRows: datasetInfo.rows - (strategy.id === 'remove_duplicates' ? strategy.affectedRows : 0),
        removedRows: strategy.id === 'remove_duplicates' ? strategy.affectedRows : 0,
        modifiedCells: strategy.affectedRows * strategy.affectedColumns.length,
        executionTime: "2秒",
        details: strategy.affectedColumns.map(col => ({
          field: col,
          action: getActionByStrategy(strategy.id),
          count: Math.floor(strategy.affectedRows / strategy.affectedColumns.length),
          examples: getExamplesByStrategy(strategy.id, col)
        })),
        errors: Math.random() > 0.8 ? [`${strategy.affectedColumns[0]} 字段处理时遇到格式问题`] : undefined,
        warnings: Math.random() > 0.6 ? [`建议人工检查 ${strategy.affectedColumns[0]} 字段的处理结果`] : undefined
      };

      results.push(result);
    }

    setProgress(100);
    setCleaningResults(results);
    
    // 更新质量指标
    setQualityMetrics({
      completeness: 94,
      consistency: 91,
      accuracy: 88,
      validity: 96,
      uniqueness: 97,
      overall: 93
    });

    setIsCleaning(false);
    setCleaningComplete(true);
    setCurrentStep('results');
    
    toast.success('自动清洗完成', {
      description: `成功执行 ${results.filter(r => r.status === 'success').length} 个策略`
    });
  };

  const getActionByStrategy = (strategyId: string): string => {
    switch (strategyId) {
      case 'remove_duplicates': return '移除重复';
      case 'fill_missing_values': return '填充缺失值';
      case 'standardize_formats': return '格式标准化';
      case 'remove_outliers': return '移除异常值';
      case 'normalize_text': return '文本标准化';
      default: return '处理';
    }
  };

  const getExamplesByStrategy = (strategyId: string, field: string): string[] => {
    switch (strategyId) {
      case 'fill_missing_values':
        return field === 'age' ? ['null → 28', 'null → 35'] : ['null → "北京"', 'null → "上海"'];
      case 'standardize_formats':
        return field === 'phone' ? ['138-0013-8000 → 13800138000'] : ['2023/12/01 → 2023-12-01'];
      case 'normalize_text':
        return ['JOHN → John', 'beijing → Beijing'];
      default:
        return [];
    }
  };

  const getStrategyIcon = (category: string) => {
    switch (category) {
      case 'quality': return <Target className="h-4 w-4" />;
      case 'format': return <FileText className="h-4 w-4" />;
      case 'consistency': return <Layers className="h-4 w-4" />;
      case 'completeness': return <CheckCircle className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const resetCleaning = () => {
    setIsAnalyzing(false);
    setIsCleaning(false);
    setAnalysisComplete(false);
    setCleaningComplete(false);
    setCurrentStep('analysis');
    setProgress(0);
    setCurrentOperation('');
    setStrategies([]);
    setSelectedStrategies([]);
    setCleaningResults([]);
    setQualityMetrics({
      completeness: 0,
      consistency: 0,
      accuracy: 0,
      validity: 0,
      uniqueness: 0,
      overall: 0
    });
  };

  // 根据文本指令自动勾选与排序策略
  useEffect(() => {
    if (currentStep !== 'strategy') return;
    const text = speechText.trim();
    if (!text) return;

    const scores = computeStrategyScores(text);
    // 排序：匹配分数高的在前
    const sorted = [...strategies].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
    setStrategies(sorted);

    // 勾选：出现关键词的策略自动加入选择
    const autoSelected = Object.keys(scores).filter((id) => (scores[id] || 0) > 0);
    if (autoSelected.length) {
      setSelectedStrategies((prev) => {
        const set = new Set([...prev, ...autoSelected]);
        return Array.from(set);
      });
    }
  }, [speechText, currentStep]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wand2 className="h-5 w-5 text-purple-500" />
            <span>自动数据清洗</span>
          </DialogTitle>
          <DialogDescription>
            AI驱动的智能数据清洗，自动检测问题并应用最佳策略
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 数据集信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>数据集信息</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{datasetInfo.rows.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">记录数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{datasetInfo.columns}</div>
                  <div className="text-sm text-gray-500">字段数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{datasetInfo.size}</div>
                  <div className="text-sm text-gray-500">文件大小</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{datasetInfo.format}</div>
                  <div className="text-sm text-gray-500">格式</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 进度指示器 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-8">
                  <div className={`flex items-center space-x-2 ${currentStep === 'analysis' ? 'text-blue-600' : analysisComplete ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'analysis' ? 'bg-blue-100' : analysisComplete ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {analysisComplete ? <CheckCircle className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                    </div>
                    <span className="font-medium">数据分析</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${currentStep === 'strategy' ? 'text-blue-600' : currentStep === 'execution' || currentStep === 'results' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'strategy' ? 'bg-blue-100' : currentStep === 'execution' || currentStep === 'results' ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {currentStep === 'execution' || currentStep === 'results' ? <CheckCircle className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                    </div>
                    <span className="font-medium">策略选择</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${currentStep === 'execution' ? 'text-blue-600' : cleaningComplete ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'execution' ? 'bg-blue-100' : cleaningComplete ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {cleaningComplete ? <CheckCircle className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    </div>
                    <span className="font-medium">执行清洗</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${currentStep === 'results' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'results' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <span className="font-medium">查看结果</span>
                  </div>
                </div>
              </div>
              
              {(isAnalyzing || isCleaning) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{currentOperation}</span>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 主要内容区域 */}
          {currentStep === 'analysis' && (
            <Card>
              <CardHeader>
                <CardTitle>开始数据分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  系统将自动分析您的数据，识别质量问题并生成最优的清洗策略。
                </p>
                <div className="flex space-x-4">
                  <Button 
                    onClick={handleStartAnalysis} 
                    disabled={isAnalyzing}
                    className="flex items-center space-x-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>分析中...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>开始分析</span>
                      </>
                    )}
                  </Button>
                  {analysisComplete && (
                    <Button variant="outline" onClick={resetCleaning}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      重新分析
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'strategy' && (
            <Card>
              <CardHeader>
                <CardTitle>推荐清洗策略</CardTitle>
                <p className="text-sm text-gray-600">
                  AI已分析您的数据并推荐以下清洗策略，您可以选择需要执行的策略
                </p>
              </CardHeader>
              <CardContent>
                {/* 文本指令输入模块（替换语音输入） */}
                <div className="space-y-3 mb-6">
                  <Label>策略指令（文本输入）</Label>
                  <Textarea
                    value={speechText}
                    onChange={(e) => setSpeechText(e.target.value)}
                    placeholder="请让输入自然语言指令，例如对数据进行去重、缺失值填充（均值/众数/前向填充）"
                    rows={4}
                  />
                  <div className="text-xs text-gray-500">输入的自然语言指令可用于筛选或排序推荐策略</div>
                </div>

                <div className="space-y-4">
                  {strategies.map((strategy) => (
                    <div key={strategy.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedStrategies.includes(strategy.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStrategies([...selectedStrategies, strategy.id]);
                              } else {
                                setSelectedStrategies(selectedStrategies.filter(id => id !== strategy.id));
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getStrategyIcon(strategy.category)}
                              <h4 className="font-medium">{strategy.name}</h4>
                              <Badge className={getImpactColor(strategy.impact)}>
                                {strategy.impact === 'high' ? '高影响' : strategy.impact === 'medium' ? '中影响' : '低影响'}
                              </Badge>
                              <Badge variant="outline">
                                置信度: {strategy.confidence}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{strategy.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {/* 预计时间已移除 */}
                              <span>影响行数: {strategy.affectedRows.toLocaleString()}</span>
                              <span>影响字段: {strategy.affectedColumns.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    已选择 {selectedStrategies.length} 个策略
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setCurrentStep('analysis')}>
                      返回分析
                    </Button>
                    <Button 
                      onClick={handleStartCleaning}
                      disabled={selectedStrategies.length === 0}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      执行清洗
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'execution' && (
            <Card>
              <CardHeader>
                <CardTitle>正在执行清洗</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                  <p className="text-lg font-medium mb-2">AI正在清洗您的数据</p>
                  <p className="text-gray-600">请稍候，这可能需要几分钟时间...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'results' && (
            <div className="space-y-6">
              {/* 质量指标 */}
              <Card>
                <CardHeader>
                  <CardTitle>数据质量提升</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{qualityMetrics.overall}%</div>
                      <div className="text-sm text-gray-500">整体质量</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{qualityMetrics.completeness}%</div>
                      <div className="text-sm text-gray-500">完整性</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{qualityMetrics.consistency}%</div>
                      <div className="text-sm text-gray-500">一致性</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{qualityMetrics.accuracy}%</div>
                      <div className="text-sm text-gray-500">准确性</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{qualityMetrics.validity}%</div>
                      <div className="text-sm text-gray-500">有效性</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{qualityMetrics.uniqueness}%</div>
                      <div className="text-sm text-gray-500">唯一性</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 清洗结果详情 */}
              <Card>
                <CardHeader>
                  <CardTitle>清洗结果详情</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cleaningResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(result.status)}
                            <h4 className="font-medium">{result.strategyName}</h4>
                            <Badge variant={result.status === 'success' ? 'default' : result.status === 'warning' ? 'secondary' : 'destructive'}>
                              {result.status === 'success' ? '成功' : result.status === 'warning' ? '警告' : '失败'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            执行时间: {result.executionTime}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{result.processedRows.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">处理行数</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">{result.removedRows.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">移除行数</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{result.modifiedCells.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">修改单元格</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">{result.details.length}</div>
                            <div className="text-xs text-gray-500">处理字段</div>
                          </div>
                        </div>

                        {result.details.length > 0 && (
                          <div className="border-t pt-3">
                            <h5 className="font-medium mb-2">处理详情:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {result.details.map((detail, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">{detail.field}:</span> {detail.action} ({detail.count} 次)
                                  {detail.examples && detail.examples.length > 0 && (
                                    <div className="text-xs text-gray-500 ml-2">
                                      示例: {detail.examples.join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.warnings && result.warnings.length > 0 && (
                          <div className="border-t pt-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium text-yellow-700">警告</span>
                            </div>
                            <ul className="text-sm text-yellow-700 space-y-1">
                              {result.warnings.map((warning, idx) => (
                                <li key={idx}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.errors && result.errors.length > 0 && (
                          <div className="border-t pt-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="font-medium text-red-700">错误</span>
                            </div>
                            <ul className="text-sm text-red-700 space-y-1">
                              {result.errors.map((error, idx) => (
                                <li key={idx}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 操作按钮 */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={resetCleaning}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重新开始
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    预览数据
                  </Button>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    下载清洗后数据
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* 确认弹窗 */}
      {showConfirmDialog && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'analyze' ? '确认开始分析' : '确认执行清洗'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'analyze' 
                ? '系统将自动分析数据质量并生成清洗策略，此过程可能需要几分钟时间。'
                : `确认执行选中的 ${selectedStrategies.length} 个清洗策略？此操作将对数据进行修改。`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
            >
              取消
            </Button>
            <Button onClick={handleConfirm}>
              {confirmAction === 'analyze' ? '开始分析' : '执行清洗'}
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}