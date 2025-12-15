import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { 
  MessageSquare, 
  Database, 
  Plus, 
  Search, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Table,
  Download,
  Maximize2,
  Code,
  Lightbulb,
  TrendingUp,
  Brain,
  Sparkles,
  Send,
  Bot,
  User
} from "lucide-react";

interface SoloModeProps {
  projectName: string;
}

interface DataSource {
  id: string;
  name: string;
  type: string;
  status: string;
  tables: number;
  lastUpdated: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  chart?: {
    type: string;
    data: any;
    sql?: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  dataSource: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

export function SoloMode({ projectName }: SoloModeProps) {
  const [activeTab, setActiveTab] = useState<'datasets' | 'chat'>('datasets');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState('');
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 模拟数据源
  const dataSources: DataSource[] = [
    {
      id: '1',
      name: '销售数据库',
      type: 'MySQL',
      status: '已连接',
      tables: 12,
      lastUpdated: '2024-01-15 14:30'
    },
    {
      id: '2', 
      name: '用户行为数据',
      type: 'PostgreSQL',
      status: '已连接',
      tables: 8,
      lastUpdated: '2024-01-15 12:15'
    },
    {
      id: '3',
      name: '财务报表',
      type: 'Excel',
      status: '待同步',
      tables: 5,
      lastUpdated: '2024-01-14 16:45'
    }
  ];

  // 模拟对话历史
  const conversations: Conversation[] = [
    {
      id: '1',
      title: '销售趋势分析',
      dataSource: '销售数据库',
      lastMessage: '近一周各品类的订单量趋势如何？',
      timestamp: '2024-01-15 14:30',
      messageCount: 8
    },
    {
      id: '2',
      title: '用户转化分析',
      dataSource: '用户行为数据',
      lastMessage: '哪个渠道的转化率最高？',
      timestamp: '2024-01-15 11:20',
      messageCount: 5
    }
  ];

  // 模拟聊天消息
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: '您好！我是您的数据分析助手。您可以用自然语言向我提问，我会帮您分析数据并生成可视化图表。',
      timestamp: '2024-01-15 14:30'
    }
  ]);

  // 智能推荐问题
  const recommendedQuestions = [
    "近一周各品类的订单量趋势如何？",
    "哪个渠道的转化率最高？",
    "相比上周增长最快的部门是哪个？",
    "本月销售额排名前5的产品是什么？",
    "用户留存率的变化趋势如何？"
  ];

  const handleNewChat = () => {
    if (!selectedDataSource) {
      alert('请选择数据源');
      return;
    }
    setIsNewChatOpen(false);
    setCurrentConversation('new');
    setActiveTab('chat');
    // 重置聊天消息
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: `已连接到数据源"${dataSources.find(ds => ds.id === selectedDataSource)?.name}"。您可以开始提问了！`,
        timestamp: new Date().toLocaleString()
      }
    ]);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleString()
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAnalyzing(true);

    // 模拟AI分析过程
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '根据您的问题，我为您生成了以下分析结果：',
        timestamp: new Date().toLocaleString(),
        chart: {
          type: 'bar',
          data: {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            datasets: [{
              label: '订单量',
              data: [120, 150, 180, 200, 170, 160, 140],
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1
            }]
          },
          sql: 'SELECT DATE(order_date) as date, COUNT(*) as order_count FROM orders WHERE order_date >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(order_date) ORDER BY date'
        }
      };
      setMessages(prev => [...prev, botMessage]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleQuestionClick = (question: string) => {
    setChatInput(question);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{projectName}</h1>
            <p className="text-sm text-gray-600 mt-1">智能数据分析</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant={activeTab === 'datasets' ? 'default' : 'outline'}
              onClick={() => setActiveTab('datasets')}
              className="flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>数据集管理</span>
            </Button>
            <Button
              variant={activeTab === 'chat' ? 'default' : 'outline'}
              onClick={() => setActiveTab('chat')}
              className="flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>智能对话</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'datasets' && (
          <div className="h-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">数据源管理</h2>
              <Button onClick={() => setIsNewChatOpen(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>新建对话</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dataSources.map((dataSource) => (
                <Card key={dataSource.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{dataSource.name}</CardTitle>
                      <Badge variant={dataSource.status === '已连接' ? 'default' : 'secondary'}>
                        {dataSource.status}
                      </Badge>
                    </div>
                    <CardDescription>{dataSource.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>数据表数量:</span>
                        <span>{dataSource.tables}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>最后更新:</span>
                        <span>{dataSource.lastUpdated}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      variant="outline"
                      onClick={() => {
                        setSelectedDataSource(dataSource.id);
                        setIsNewChatOpen(true);
                      }}
                    >
                      开始分析
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 对话历史 */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">最近对话</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conversations.map((conv) => (
                  <Card key={conv.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setCurrentConversation(conv.id);
                          setActiveTab('chat');
                        }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{conv.title}</CardTitle>
                        <Badge variant="outline">{conv.messageCount} 条消息</Badge>
                      </div>
                      <CardDescription>{conv.dataSource}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{conv.lastMessage}</p>
                      <p className="text-xs text-gray-400">{conv.timestamp}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex">
            {/* 聊天界面 */}
            <div className="flex-[3] flex flex-col">
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'} rounded-lg p-4 shadow-sm`}>
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user' ? 'bg-blue-600' : 'bg-gray-100'}`}>
                          {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          {message.chart && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">数据可视化</h4>
                                <div className="flex items-center space-x-2">
                                  <Button size="sm" variant="outline">
                                    <BarChart3 className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <LineChart className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <PieChart className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Table className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Maximize2 className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Code className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              {/* 这里应该是实际的图表组件 */}
                              <div className="h-64 bg-white rounded border flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                                  <p>图表预览区域</p>
                                  <p className="text-xs">柱状图 - 近7天订单量趋势</p>
                                </div>
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">{message.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isAnalyzing && (
                  <div className="flex justify-start">
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span className="text-sm text-gray-600">正在分析数据...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 输入区域 */}
              <div className="border-t bg-white p-4">
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <Textarea
                      placeholder="请输入您的问题，例如：近一周各品类的订单量趋势如何？"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isAnalyzing}
                    className="flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>发送</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* 侧边栏 - 智能推荐 */}
            <div className="flex-[0.4] min-w-[240px] max-w-[280px] border-l bg-white p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2" />
                智能推荐问题
              </h3>
              <div className="space-y-2">
                {recommendedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full text-left justify-start h-auto p-3 text-sm"
                    onClick={() => handleQuestionClick(question)}
                  >
                    <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-wrap">{question}</span>
                  </Button>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  高级分析
                </h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Brain className="w-4 h-4 mr-2" />
                    趋势分析
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    数据预测
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 新建对话弹窗 */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建对话</DialogTitle>
            <DialogDescription>
              选择数据源开始智能分析
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dataSource">选择数据源</Label>
              <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择数据源" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.filter(ds => ds.status === '已连接').map((dataSource) => (
                    <SelectItem key={dataSource.id} value={dataSource.id}>
                      {dataSource.name} ({dataSource.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsNewChatOpen(false)}>
                取消
              </Button>
              <Button onClick={handleNewChat}>
                开始对话
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}