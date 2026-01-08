import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Users,
  Calendar,
  Database,
  CheckCircle,
  Brain,
  Upload,
  BarChart3,
  TrendingUp,
  FileText,
  Settings,
  Play,
  Download,
  Mic,
  Square,
  Send,
  MessageSquare,
  Clock,
  Eye,
  GitBranch
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ProjectDetailCardsProps {
  project: any;
  mode: 'traditional' | 'auto';
  onNavigateToData?: () => void;
  onNavigateToTasks?: () => void;
  onNavigateToModels?: () => void;
  onNavigateToCausalInsight?: () => void;
  onQuickPredict?: () => void;
  onViewReports?: () => void;
}

export function ProjectDetailCards({
  project,
  mode,
  onNavigateToData,
  onNavigateToTasks,
  onNavigateToModels,
  onNavigateToCausalInsight,
  onQuickPredict,
  onViewReports
}: ProjectDetailCardsProps) {
  const { t } = useLanguage();
  // 语音指令 & 会话记录（仅在自动模式下使用）
  const [voiceInput, setVoiceInput] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [autoSessions, setAutoSessions] = React.useState<Array<{ id: string; taskName: string; time: string; rawCommand: string; operations: string[] }>>([]);
  const [expandedRecordId, setExpandedRecordId] = React.useState<string | null>(null);

  // 简单的语义理解示例：依据关键词生成简化任务名与预计操作
  const semanticSimplify = (text: string) => {
    const t = text.toLowerCase();
    let taskName = '通用分析';
    const ops: string[] = [];
    if (/预测|forecast|predict/.test(t)) {
      taskName = '快速预测';
      ops.push('载入最新上传数据', '选择默认模型', '执行预测', '生成可视化与简报');
    }
    if (/训练|train|fine[- ]?tune/.test(t)) {
      taskName = '模型训练';
      ops.push('划分训练/验证集', '启动训练流程', '记录训练日志', '输出指标报告');
    }
    if (/因果|causal/.test(t)) {
      taskName = '因果分析';
      ops.push('构建因果图', '估计影响强度', '生成解释报告');
    }
    if (/报表|report|分析/.test(t)) {
      taskName = '生成分析报表';
      ops.push('汇总关键指标', '生成图表', '导出PDF/HTML');
    }
    if (ops.length === 0) {
      ops.push('解析指令', '检索相关数据', '建议下一步操作');
    }
    return { taskName, operations: ops };
  };

  const handleStartStopRecord = () => {
    // 这里仅切换录音状态；真实实现可集成 Web Speech API/媒体录制
    setIsRecording((prev) => !prev);
  };

  const handleExecuteVoice = () => {
    const content = voiceInput.trim();
    if (!content) return;
    const { taskName, operations } = semanticSimplify(content);
    const id = `${Date.now()}`;
    const time = new Date().toLocaleString();
    setAutoSessions((prev) => [{ id, taskName, time, rawCommand: content, operations }, ...prev]);
    setVoiceInput('');
    setExpandedRecordId(id); // 执行后默认展开详情
  };

  if (mode === 'traditional') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 基本信息卡片 */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {t('project.cards.basicInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-16">{t('data.columns.name')}:</span>
                  <span className="text-sm font-medium">{project?.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-16">{t('data.columns.description')}:</span>
                  <span className="text-sm">{project?.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{t('project.cards.cycle')}:</span>
                  <span className="text-sm">{project?.projectCycle}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{t('project.cards.owner')}:</span>
                  <span className="text-sm">{project?.owner}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{t('project.cards.members')}:</span>
                  <span className="text-sm">{project?.members}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{t('project.cards.status')}:</span>
                  <Badge variant={project?.status === "进行中" ? "default" : "secondary"}>
                    {project?.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 项目完成度字段已移除：当前系统无法准确计算该指标，避免误导用户 */}
          </CardContent>
        </Card>

        {/* 数据卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              {t('project.cards.data.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-semibold text-green-600">{project?.stats?.datasets || 0}</div>
              <div className="text-sm text-gray-500">{t('project.cards.datasets')}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">{t('project.cards.mainDatasource')}:</div>
              <div className="text-sm font-medium">{project?.dataSource}</div>
            </div>
            <div className="space-y-2">
              <Button
                onClick={onNavigateToData}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                {t('project.cards.importData')}
              </Button>
              <Button
                onClick={onNavigateToData}
                variant="outline"
                className="w-full border-green-600 text-green-600 hover:bg-green-50"
              >
                <Database className="h-4 w-4 mr-2" />
                {t('project.cards.enterData')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 任务卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              {t('project.cards.task.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">{project?.totalTasks || 0}</div>
                <div className="text-xs text-gray-500">{t('project.cards.totalTasks')}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">{project?.completedTasks || 0}</div>
                <div className="text-xs text-gray-500">{t('project.cards.completed')}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">{t('project.cards.currentTask')}</div>
              <div className="text-sm font-medium">{project?.task}</div>
            </div>
            <Button
              onClick={onNavigateToTasks}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('project.cards.enterTasks')}
            </Button>
          </CardContent>
        </Card>

        {/* 因果洞察卡片 (代替原模型卡片) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" style={{ color: '#7c3aed' }} />
              {t('project.cards.causal.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f5f3ff' }}>
              <div className="text-2xl font-semibold" style={{ color: '#7c3aed' }}>{project?.stats?.causalTasks || 5}</div>
              <div className="text-sm text-gray-500">{t('project.cards.causalTasksCount')}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">{t('project.cards.currentTask')}</div>
              <div className="text-sm font-medium">{project?.causalTask || '销售趋势因果分析'}</div>
            </div>
            <Button
              onClick={onNavigateToCausalInsight}
              className="w-full text-white"
              style={{ backgroundColor: '#7c3aed' }}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              {t('project.cards.enterCausal')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 自动模式（移除“Solo模式”字样）
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 基本信息卡片 */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            {t('project.cards.basicInfo')}
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-600">
              {t('project.cards.autoClean')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-16">名称:</span>
                <span className="text-sm font-medium">{project?.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-16">描述:</span>
                <span className="text-sm">{project?.description}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">状态:</span>
                <Badge variant={project?.status === "进行中" ? "default" : "secondary"}>
                  {project?.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 快速预测卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            快速预测
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <div className="text-sm text-gray-600 mb-2">拖拽或点击上传表格文件</div>
            <div className="text-xs text-gray-500">支持 CSV, Excel 格式</div>
          </div>
          <Button
            onClick={onQuickPredict}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Play className="h-4 w-4 mr-2" />
            开始预测
          </Button>
          <div className="text-xs text-gray-500 text-center">
            AI将自动分析数据并生成预测结果
          </div>
        </CardContent>
      </Card>

      {/* 报表与因果分析卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            报表与因果分析
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="text-sm font-medium">自动生成报表</div>
                <div className="text-xs text-gray-500">基于数据自动生成分析报告</div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-600">
                已生成
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={onViewReports}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              查看报表
            </Button>
          </div>

          {/* 会话记录展示（优化左下角区域：报表/因果分析联动语音任务） */}
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              本次与历史会话记录
            </div>
            {autoSessions.length === 0 ? (
              <div className="text-xs text-gray-500">暂无会话记录。通过右侧“语音指令入口”执行后，这里将展示简化任务、时间与详情入口。</div>
            ) : (
              <div className="space-y-2">
                {autoSessions.map((s) => (
                  <div key={s.id} className="p-3 rounded border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">{s.taskName}</Badge>
                        <div className="flex items-center text-xs text-gray-500"><Clock className="h-3 w-3 mr-1" />{s.time}</div>
                      </div>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setExpandedRecordId(expandedRecordId === s.id ? null : s.id)}>
                        <Eye className="h-3 w-3 mr-1" />查看详情
                      </Button>
                    </div>
                    {expandedRecordId === s.id && (
                      <div className="mt-3 space-y-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">原始语音/文本指令：</span>
                          <span className="whitespace-pre-wrap">{s.rawCommand}</span>
                        </div>
                        <div>
                          <span className="font-medium">预计执行步骤：</span>
                          <ul className="list-disc ml-5 mt-1 space-y-1">
                            {s.operations.map((op, idx) => (<li key={idx}>{op}</li>))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 语音指令入口卡片（底部右侧） */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-red-600" />
            语音指令入口
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-gray-500">底层大模型将基于已上传的数据内容，并结合语义理解技术自动识别并执行相应任务（如预测、训练、因果分析、生成报表等）。</div>
          <div className="border rounded-md">
            <textarea
              className="w-full h-28 p-3 text-sm outline-none resize-none"
              placeholder="语音指令输入（可直接输入文本模拟）：例如：‘对最新缺陷数据进行快速预测并生成报表’"
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isRecording ? 'destructive' : 'default'}
              className={isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'}
              onClick={handleStartStopRecord}
            >
              {isRecording ? <Square className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              {isRecording ? '停止录音' : '开始录音'}
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExecuteVoice}>
              <Send className="h-4 w-4 mr-2" />
              执行
            </Button>
          </div>
          <div className="text-[11px] text-gray-500">提示：录音按钮当前为占位实现，实际语音识别可集成浏览器的 Web Speech API 或后端语音识别服务。</div>
        </CardContent>
      </Card>
    </div>
  );
}