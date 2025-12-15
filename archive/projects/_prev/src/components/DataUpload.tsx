import React, { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { 
  Upload, 
  X, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Download,
  Mic,
  Square,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../i18n/LanguageContext";

interface DataUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (datasetId: string) => void;
  isReupload?: boolean;
  previousUploadItems?: Array<{ name: string; size: string; status: 'success' | 'failed'; error?: string }>;
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'paused' | 'parsing' | 'success' | 'error';
  error?: string;
  parsedData?: {
    fields: Array<{
      name: string;
      type: string;
      sampleValues: string[];
      nullCount: number;
      uniqueCount: number;
    }>;
    rowCount: number;
    preview: Array<Record<string, any>>;
  };
}

interface FormData {
  name: string;
  description: string;
  projectId: string; // 所属项目（必填）
  permission: 'team' | 'public';
  mode: 'traditional' | 'auto';
  tags: Array<{ name: string; color: string }>;
}

export function DataUpload({ isOpen, onClose, onUploadSuccess, isReupload = false, previousUploadItems }: DataUploadProps) {
  const { t } = useLanguage();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previousItems, setPreviousItems] = useState<Array<{ name: string; size: string; status: 'success' | 'failed'; error?: string }>>(previousUploadItems || []);
  // 上传限制常量
  const MAX_SINGLE_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_BATCH_SIZE = 1024 * 1024 * 1024; // 1GB
  const MAX_CONCURRENT = 10; // 并行上限
  // 速度限制（bytes/second），null 表示不限制
  const [speedLimitBps, setSpeedLimitBps] = useState<number | null>(null);
  // 暂停/恢复控制器（每个文件一个）
  const controllersRef = useRef<Map<string, { paused: boolean }>>(new Map());
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    projectId: '',
    permission: 'team',
    mode: 'traditional',
    tags: []
  });
  const [isUploading, setIsUploading] = useState(false);
  // 语义指令（仅 自动模式）
  const [semanticInstruction, setSemanticInstruction] = useState('');
  const [llmProcessing, setLlmProcessing] = useState(false);
  const [llmResult, setLlmResult] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviousItems(previousUploadItems || []);
  }, [previousUploadItems, isReupload]);

  const removePreviousItem = useCallback((name: string) => {
    setPreviousItems(prev => prev.filter(i => i.name !== name));
    toast.success(t('common.deleted'));
  }, [t]);

  // 语音指令输入相关状态与引用（自动模式）
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  // 模拟项目列表（后续可替换为真实项目数据）
  const mockProjects = [
    { id: 'proj_001', name: '钢铁缺陷预测' },
    { id: 'proj_002', name: '电力能源预测' },
    { id: 'proj_003', name: '工艺时序预测' },
    { id: 'proj_004', name: '设备故障预测' }
  ];

  /**
   * 获取项目名称（用于权限可见性提示中的上下文显示）。
   * 参数：id - 项目ID字符串
   * 返回：若能在 mockProjects 中找到匹配项，则返回对应项目名称；否则返回国际化的“未选择项目”。
   */
  const getProjectName = (id: string) =>
    mockProjects.find(p => p.id === id)?.name || t('data.projects.noneSelected');

  // 重置状态
  const resetState = useCallback(() => {
    setFiles([]);
    setFormData({
      name: '',
      description: '',
      projectId: '',
      permission: 'team',
      mode: 'traditional',
      tags: []
    });
    setIsUploading(false);
    setIsDragOver(false);
    // 重置语音模块
    try {
      setSpeechText('');
      setSpeechStatus('idle');
      if (isListening) {
        stopVoiceInput();
      }
    } catch {}
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending'
    }));

    // 验证文件类型和大小
    const validFiles = [] as UploadFile[];
    // 现有总大小
    const existingTotal = files.reduce((sum, f) => sum + f.file.size, 0);
    let currentTotal = existingTotal;

    for (const fileItem of newFiles) {
      const { file } = fileItem;
      const validTypes = ['.csv', '.xlsx', '.xls', '.json'];
      const lower = file.name.toLowerCase();
      const isValidType = validTypes.some(type => lower.endsWith(type));
      const isValidSize = file.size <= MAX_SINGLE_SIZE; // 单文件≤100MB

      if (!isValidType) {
        toast.error(`${t('data.upload.toast.unsupportedFormat')}: ${file.name}`, {
          description: t('data.upload.toast.supportedFormatsDesc')
        });
        continue;
      }

      if (!isValidSize) {
        toast.error(`${t('data.upload.toast.sizeExceeded')}: ${file.name}`, {
          description: t('data.upload.toast.sizeLimitDesc')
        });
        continue;
      }

      // 批量总大小限制：不超过 1GB
      if (currentTotal + file.size > MAX_BATCH_SIZE) {
        toast.error(`${t('data.upload.toast.sizeExceeded')}: ${file.name}`, {
          description: t('data.upload.toast.batchLimitDesc')
        });
        continue;
      }

      validFiles.push(fileItem);
      currentTotal += file.size;
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // 移除文件
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  /**
   * 模拟分块上传（含速度限制与暂停/继续）并在完成后进行解析。
   * 参数：fileItem - 上传队列中的文件项
   * 返回：Promise<void> - 当该文件的上传与解析流程结束时 resolve
   */
  const uploadFile = useCallback(async (fileItem: UploadFile): Promise<void> => {
    const { id, file } = fileItem;
    // 初始化控制器
    if (!controllersRef.current.has(id)) {
      controllersRef.current.set(id, { paused: false });
    }

    // 更新状态为上传中
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, status: 'uploading' as const } : f
    ));

    const total = file.size || 1;
    const chunkSize = 5 * 1024 * 1024; // 5MB
    let uploaded = 0;

    // 以 200ms 为粒度推进进度
    while (uploaded < total) {
      const controller = controllersRef.current.get(id);
      if (controller?.paused) {
        // 暂停时等待，200ms 轮询
        await new Promise(r => setTimeout(r, 200));
        continue;
      }

      const intervalMs = 200;
      const limitPerTick = speedLimitBps ? Math.max(1, Math.floor(speedLimitBps * (intervalMs / 1000))) : chunkSize;
      const step = Math.min(chunkSize, limitPerTick, total - uploaded);
      uploaded += step;
      const progress = Math.max(0, Math.min(100, Math.round((uploaded / total) * 100)));
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      setFiles(prev => prev.map(f =>
        f.id === id ? { ...f, progress } : f
      ));
    }

    // 更新状态为解析中
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, status: 'parsing' as const } : f
    ));

    // 模拟文件解析
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟解析结果
    const mockParsedData = {
      fields: [
        {
          name: 'id',
          type: 'integer',
          sampleValues: ['1', '2', '3'],
          nullCount: 0,
          uniqueCount: 1000
        },
        {
          name: 'name',
          type: 'string',
          sampleValues: ['张三', '李四', '王五'],
          nullCount: 5,
          uniqueCount: 995
        },
        {
          name: 'age',
          type: 'integer',
          sampleValues: ['25', '30', '35'],
          nullCount: 2,
          uniqueCount: 50
        },
        {
          name: 'email',
          type: 'string',
          sampleValues: ['zhang@example.com', 'li@example.com', 'wang@example.com'],
          nullCount: 10,
          uniqueCount: 990
        }
      ],
      rowCount: 1000,
      preview: [
        { id: 1, name: '张三', age: 25, email: 'zhang@example.com' },
        { id: 2, name: '李四', age: 30, email: 'li@example.com' },
        { id: 3, name: '王五', age: 35, email: 'wang@example.com' }
      ]
    };

    // 更新状态为成功
    setFiles(prev => prev.map(f =>
      f.id === id ? {
        ...f,
        status: 'success' as const,
        parsedData: mockParsedData
      } : f
    ));
  }, [speedLimitBps]);

  // 重试上传
  const retryUpload = useCallback((fileId: string) => {
    const fileItem = files.find(f => f.id === fileId);
    if (fileItem) {
      uploadFile(fileItem);
    }
  }, [files, uploadFile]);

  /**
   * 暂停指定文件的上传。
   * 参数：fileId - 文件唯一标识
   * 返回：void
   */
  const pauseUpload = useCallback((fileId: string) => {
    const ctrl = controllersRef.current.get(fileId);
    if (ctrl) ctrl.paused = true;
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'paused' } : f));
  }, []);

  /**
   * 继续指定文件的上传。
   * 参数：fileId - 文件唯一标识
   * 返回：void
   */
  const resumeUpload = useCallback((fileId: string) => {
    const ctrl = controllersRef.current.get(fileId);
    if (ctrl) ctrl.paused = false;
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'uploading' } : f));
  }, []);

  // 标签管理
  const [newTagName, setNewTagName] = useState('');
  
  // 预定义的标签颜色
  const tagColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];

  // 添加标签
  const addTag = useCallback(() => {
    if (!newTagName.trim()) return;
    
    // 检查是否已存在相同名称的标签
    if (formData.tags.some(tag => tag.name === newTagName.trim())) {
      toast.error(t('data.upload.toast.tagExists'));
      return;
    }

    const newTag = {
      name: newTagName.trim(),
      color: tagColors[formData.tags.length % tagColors.length]
    };

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, newTag]
    }));
    
    setNewTagName('');
  }, [newTagName, formData.tags, tagColors]);

  // 删除标签
  const removeTag = useCallback((tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.name !== tagName)
    }));
  }, []);

  // 调用大模型：根据语义指令生成自动化处理方案（示例，支持 OpenAI 兼容接口或本地模拟）
  const callLLMForProcessing = useCallback(async (instruction: string) => {
    const firstParsed = files.find(f => f.parsedData);
    const schemaSummary = firstParsed?.parsedData
      ? `字段(${firstParsed.parsedData.fields.length}): ` +
        firstParsed.parsedData.fields.map(f => `${f.name}:${f.type}`).join(', ') +
        `；记录数: ${firstParsed.parsedData.rowCount}`
      : '尚未解析到结构信息（将以通用策略处理）。';

    setLlmProcessing(true);
    setLlmResult('');
    let prompt = instruction?.trim() ? instruction.trim() : '对上传的数据进行质量分析：去重、处理缺失值、检测异常值，并生成质量报告与汇总统计。';
    try {
      const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;
      const baseUrl = (import.meta as any).env?.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const model = (import.meta as any).env?.VITE_OPENAI_MODEL || 'gpt-4o-mini';

      if (!apiKey) {
        // 无密钥时做本地模拟
        await new Promise(r => setTimeout(r, 1200));
        setLlmResult(
          `已根据指令自动生成处理方案（模拟）：\n` +
          `1) 去重并处理缺失值（均值/众数/前向填充）；\n` +
          `2) 异常值检测（IQR/Z-Score），标记并输出报告；\n` +
          `3) 依据业务字段进行聚合统计与报表导出。\n` +
          `指令: ${prompt}\n上下文: ${schemaSummary}`
        );
        toast.info(t('data.upload.toast.localSimulate'));
      } else {
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: '你是数据工程与分析助手，请根据指令生成可执行的数据处理计划，用清晰的步骤说明，并简要解释每一步目的。' },
              { role: 'user', content: `指令: ${prompt}\n数据上下文: ${schemaSummary}\n请输出可执行的处理步骤与预期输出（以分点列表呈现）。` }
            ],
            temperature: 0.2
          })
        });
        if (!resp.ok) throw new Error(`LLM 请求失败: ${resp.status}`);
        const data = await resp.json();
        const content = data?.choices?.[0]?.message?.content || t('common.noContent');
        setLlmResult(content);
        toast.success(t('data.upload.toast.planGenerated'));
      }
    } catch (err: any) {
      console.error(err);
      setLlmResult(`处理失败：${err?.message || '未知错误'}`);
      toast.error(t('data.upload.toast.semanticFailed'));
    } finally {
      setLlmProcessing(false);
    }
  }, [files]);

  // 开始上传
  /**
   * 开始上传：
   * - 验证必填信息
   * - 按并行上限（MAX_CONCURRENT）执行队列
   * - 结束后提示结果并回调
   */
  const handleStartUpload = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error(t('data.upload.toast.nameRequired'));
      return;
    }

    if (!formData.projectId) {
      toast.error(t('data.upload.toast.projectRequired'));
      return;
    }

    if (files.length === 0) {
      toast.error(t('data.upload.toast.selectFiles'));
      return;
    }

    setIsUploading(true);

    try {
      // 并发上传，限制同时进行的文件数不超过 MAX_CONCURRENT
      const queue = [...files];
      const executing: Promise<void>[] = [];

      const dequeue = () => {
        const next = queue.shift();
        if (!next) return;
        const p = uploadFile(next).finally(() => {
          const idx = executing.indexOf(p);
          if (idx >= 0) executing.splice(idx, 1);
          dequeue();
        });
        executing.push(p);
      };

      const startCount = Math.min(MAX_CONCURRENT, queue.length);
      for (let i = 0; i < startCount; i++) {
        dequeue();
      }

      await Promise.all(executing);

      toast.success(t('data.upload.toast.uploadSuccess'), {
        description: `${t('data.upload.toast.uploadSuccessDescPrefix')} ${files.length} ${t('data.upload.toast.uploadSuccessDescSuffix')}`
      });

      if (onUploadSuccess) {
        onUploadSuccess('dataset-' + Date.now());
      }

      setTimeout(() => {
        onClose();
        resetState();
      }, 1500);

    } catch (error) {
      toast.error(t('data.upload.toast.uploadFailed'), {
        description: t('data.upload.toast.checkNetwork')
      });
    } finally {
      setIsUploading(false);
    }
  }, [formData, files, uploadFile, onUploadSuccess, onClose, resetState, callLLMForProcessing, semanticInstruction]);

  // 关闭对话框
  const handleClose = useCallback(() => {
    if (isUploading) {
      toast.warning(t('data.upload.toast.uploadingWait'));
      return;
    }
    // 关闭对话框时停止语音采集与识别
    try {
      if (isListening) {
        stopVoiceInput();
      }
    } catch (e) {
      // 忽略关闭时的清理异常
    }
    onClose();
    resetState();
  }, [isUploading, onClose, resetState, isListening]);

  // 获取文件状态图标
  const getFileStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
      case 'parsing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'paused':
        return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  // 获取文件状态文本
  const getFileStatusText = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
        return t('data.upload.status.uploading');
      case 'parsing':
        return t('data.upload.status.parsing');
      case 'success':
        return t('data.upload.status.success');
      case 'error':
        return t('data.upload.status.error');
      case 'paused':
        return t('common.pause') || '暂停';
      default:
        return t('data.upload.status.pending');
    }
  };

  // 初始化语音识别（Web Speech API）
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(t('voice.errors.browserNotSupported'), { description: t('voice.errors.recommendChromeEdge') });
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
        // 只保留最近的 1000 字符，避免无限增长
        const combined = (prev + ' ' + transcript).trim();
        return combined.length > 1000 ? combined.slice(combined.length - 1000) : combined;
      });
    };

    recognition.onstart = () => setSpeechStatus('listening');
    recognition.onend = () => {
      // 如果仍在监听，自动重启
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
        const v = dataArray[i] / 128.0; // 0-255 -> around 1
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
      // 麦克风采集
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      source.connect(analyser);

      // 初始化识别并开始
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
      toast.error(t('voice.errors.cannotStart'), { description: t('voice.errors.checkMicPermission') });
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('data.upload.title')}</DialogTitle>
          {/* 根据需求，去掉顶部的说明文字 */}
        </DialogHeader>

        <div className="space-y-6">
          {isReupload && previousItems && previousItems.length > 0 && (
            <div className="space-y-3">
              <Label>上次上传结果</Label>
              <div className="space-y-2">
                {previousItems.map((item, idx) => (
                  <div key={`${item.name}-${idx}`} className="flex items-center justify-between px-3 py-2 rounded-md border">
                    <div className="flex items-center gap-3">
                      <FileText className={`h-4 w-4 ${item.status === 'failed' ? 'text-red-500' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-sm ${item.status === 'failed' ? 'text-red-600' : 'text-gray-900'}`}>{item.name}</p>
                        <p className="text-xs text-gray-500">{item.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'failed' ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <Button variant="ghost" size="icon" onClick={() => removePreviousItem(item.name)}>
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* 基本信息表单 */}
          {!isReupload && (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('data.form.name')} *</Label>
              <Input
                id="name"
                placeholder={t('data.upload.form.name.placeholder')}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">{t('data.form.project')} *</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('data.upload.form.project.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {mockProjects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission">{t('data.form.permission')}</Label>
              <Select
                value={formData.permission}
                onValueChange={(value: 'team' | 'public') => 
                  setFormData(prev => ({ ...prev, permission: value }))
                }
                >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">{t('permission.team')}</SelectItem>
                  <SelectItem value="public">{t('permission.public')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          )}

          {/* 可见性预览与说明（移除“注意”说明文案，仅保留标签与提示行） */}
          {!isReupload && (
          <div className="rounded-md border p-3 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              {formData.permission === 'public' ? (
                <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">{t('data.visibility.publicData')}</Badge>
              ) : (
                <Badge variant="outline" className="border-purple-300 text-purple-700">{t('data.visibility.projectData')}</Badge>
              )}
              <span className="text-sm text-gray-700">
                {formData.permission === 'public'
                  ? t('data.visibility.publicHintLine')
                  : `${t('data.visibility.teamHintLine')}（${getProjectName(formData.projectId)}）`}
              </span>
            </div>
            {/* 根据需求去掉“注意”说明文案行 */}
          </div>
          )}

          {!isReupload && (
          <div className="space-y-2">
            <Label htmlFor="description">{t('data.form.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('data.upload.form.description.placeholder')}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          )}

          {/* 数据标签 */}
          {!isReupload && (
          <div className="space-y-2">
            <Label>{t('data.form.tags')}</Label>
            <div className="space-y-3">
              {/* 标签输入 */}
              <div className="flex gap-2">
                <Input
                  placeholder={t('data.form.inputTagName')}
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={addTag}
                  disabled={!newTagName.trim()}
                  size="sm"
                >
                  {t('common.add')}
                </Button>
              </div>
              
              {/* 已添加的标签 */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                      style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }}
                    >
                      {tag.name}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => removeTag(tag.name)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}


          {/* 自动模式：原型图示例 + 语音指令输入模块 */}
          {!isReupload && formData.mode === 'auto' && (
            <div className="space-y-4">
              {/* 原型图示例区块 */}
              <Card>
                  <CardHeader>
                    <CardTitle>{t('data.upload.prototype.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-md border bg-white">
                        <div className="text-sm font-medium">{t('data.upload.prototype.step.analysis.name')}</div>
                        <p className="text-xs text-gray-600 mt-1">{t('data.upload.prototype.step.analysis.desc')}</p>
                      </div>
                      <div className="p-3 rounded-md border bg-white">
                        <div className="text-sm font-medium">{t('data.upload.prototype.step.strategy.name')}</div>
                        <p className="text-xs text-gray-600 mt-1">{t('data.upload.prototype.step.strategy.desc')}</p>
                      </div>
                      <div className="p-3 rounded-md border bg-white">
                        <div className="text-sm font-medium">{t('data.upload.prototype.step.clean.name')}</div>
                        <p className="text-xs text-gray-600 mt-1">{t('data.upload.prototype.step.clean.desc')}</p>
                      </div>
                      <div className="p-3 rounded-md border bg-white">
                        <div className="text-sm font-medium">{t('data.upload.prototype.step.review.name')}</div>
                        <p className="text-xs text-gray-600 mt-1">{t('data.upload.prototype.step.review.desc')}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">{t('data.upload.prototype.autoModeHint')}</p>
                  </CardContent>
                </Card>

              {/* 语音指令输入模块 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t('voice.input.title')}</CardTitle>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={
                      speechStatus === 'listening' ? 'text-green-600' :
                      speechStatus === 'processing' ? 'text-blue-600' :
                      speechStatus === 'error' ? 'text-red-600' : 'text-gray-600'
                    }>
                      {speechStatus === 'idle' && t('voice.status.idle')}
                      {speechStatus === 'listening' && t('voice.status.listening')}
                      {speechStatus === 'processing' && t('voice.status.processing')}
                      {speechStatus === 'error' && t('voice.status.error')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={startVoiceInput}
                      disabled={isListening}
                      className="flex items-center gap-2"
                    >
                      <Mic className="h-4 w-4" /> {t('voice.actions.startRecording')}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={stopVoiceInput}
                      disabled={!isListening}
                      className="flex items-center gap-2"
                    >
                      <Square className="h-4 w-4" /> {t('voice.actions.stop')}
                    </Button>
                    <span className="text-xs text-gray-500">{t('voice.input.helper')}</span>
                  </div>

                  {/* 波形可视化 */}
                  <div className="rounded-md border bg-white p-2">
                    <canvas ref={waveformCanvasRef} className="w-full h-24" />
                  </div>

                  {/* 实时识别文本 */}
                  <div className="space-y-2">
                    <Label>{t('voice.input.transcriptLabel')}</Label>
                    <Textarea
                      value={speechText}
                      readOnly
                      placeholder={t('voice.input.transcriptPlaceholder')}
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 文件上传区域 */}
          <div className="space-y-4">
            <Label>{t('data.upload.files.label')}</Label>
            {/* 根据需求去掉队列状态、剩余容量与上传速度限制选择器的展示 */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  {t('data.upload.dragDrop.prompt')}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('data.upload.dragDrop.select')}
                  </Button>
                </p>
                {/* 根据需求，去掉拖拽区域下方的说明文字 */}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,.xlsx,.xls,.json"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>
          </div>

          {/* 文件列表 */}
          {files.length > 0 && (
            <div className="space-y-4">
              <Label>{t('data.upload.fileList.label')}</Label>
              <div className="space-y-3">
                {files.map((fileItem) => (
                  <Card key={fileItem.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getFileStatusIcon(fileItem.status)}
                          <div>
                            <p className="font-medium">{fileItem.file.name}</p>
                            <p className="text-sm text-gray-500">
                              {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB • {getFileStatusText(fileItem.status)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {fileItem.status === 'error' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryUpload(fileItem.id)}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              {t('task.actions.retry')}
                            </Button>
                          )}
                          {fileItem.status === 'uploading' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => pauseUpload(fileItem.id)}
                            >
                              {t('data.upload.actions.pause')}
                            </Button>
                          )}
                          {fileItem.status === 'paused' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resumeUpload(fileItem.id)}
                            >
                              {t('data.upload.actions.resume')}
                            </Button>
                          )}
                          {fileItem.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(fileItem.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* 进度条 */}
                      {(fileItem.status === 'uploading' || fileItem.status === 'parsing') && (
                        <div className="space-y-2">
                          <Progress value={fileItem.progress} className="h-2" />
                          <p className="text-xs text-gray-500">
                            {fileItem.status === 'uploading' 
                              ? `${t('data.upload.progress')}: ${fileItem.progress}%` 
                              : t('data.upload.parsingStructure')}
                          </p>
                        </div>
                      )}

                      {/* 错误信息 */}
                      {fileItem.status === 'error' && fileItem.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                          {fileItem.error}
                        </div>
                      )}

                      {/* 解析结果 */}
                      {fileItem.status === 'success' && fileItem.parsedData && (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{t('data.upload.parsedResult')}</h4>
                            <Badge variant="secondary">
                              {fileItem.parsedData.rowCount} {t('data.upload.rows')} • {fileItem.parsedData.fields.length} {t('data.upload.columns')}
                            </Badge>
                          </div>
                          
                          {/* 字段信息 */}
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t('data.upload.table.fieldName')}</TableHead>
                                  <TableHead>{t('data.upload.table.type')}</TableHead>
                                  <TableHead>{t('data.upload.table.missingValues')}</TableHead>
                                  <TableHead>{t('data.upload.table.uniqueValues')}</TableHead>
                                  <TableHead>{t('data.upload.table.example')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {fileItem.parsedData.fields.map((field, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{field.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{field.type}</Badge>
                                    </TableCell>
                                    <TableCell>{field.nullCount}</TableCell>
                                    <TableCell>{field.uniqueCount}</TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                      {field.sampleValues.join(', ')}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* 数据预览 */}
                          <div className="space-y-2">
                            <h5 className="font-medium">{t('data.upload.preview')}</h5>
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {fileItem.parsedData.fields.map((field) => (
                                      <TableHead key={field.name}>{field.name}</TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {fileItem.parsedData.preview.map((row, index) => (
                                    <TableRow key={index}>
                                      {fileItem.parsedData!.fields.map((field) => (
                                        <TableCell key={field.name}>
                                          {row[field.name]?.toString() || '-'}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 已按需求移除 Solo 模式下的语义指令处理结果展示 */}

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleStartUpload} disabled={isUploading || files.length === 0}>
              {isUploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('data.upload.actions.uploading')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('data.upload.actions.start')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}