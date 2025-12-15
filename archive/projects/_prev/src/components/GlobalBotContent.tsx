import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { 
  Bot, 
  Send, 
  Plus, 
  Search, 
  Database, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Clock,
  MessageSquare,
  Filter,
  X
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  hasChart?: boolean;
  chartType?: 'bar' | 'line' | 'pie';
}

interface HistoryConversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

interface SmartQuestion {
  id: string;
  question: string;
  category: string;
}

interface DataItem {
  id: string;
  name: string;
  type: string;
  description: string;
}

export function GlobalBotContent() {
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState('1');
  const [showDataSelector, setShowDataSelector] = useState(false);
  const [selectedData, setSelectedData] = useState<DataItem[]>([]);
  const [searchHistory, setSearchHistory] = useState('');
  const [searchData, setSearchData] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 当前对话消息
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: '您好！我是您的智能助手，可以帮助您进行数据分析、项目管理和决策支持。有什么我可以帮助您的吗？',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // 历史对话列表
  const [conversations, setConversations] = useState<HistoryConversation[]>([
    {
      id: '1',
      title: '当前对话',
      lastMessage: '您好！我是您的智能助手...',
      timestamp: new Date().toLocaleTimeString(),
      messageCount: 1
    }
  ]);

  // 智能推荐问题
  const smartQuestions: SmartQuestion[] = [
    { id: '1', question: '帮我分析各区域的销售数据趋势', category: '数据分析' },
    { id: '2', question: '生成本月项目进度报告', category: '项目管理' },
    { id: '3', question: '对比不同产品线的收益情况', category: '财务分析' },
    { id: '4', question: '预测下季度的市场表现', category: '预测分析' },
    { id: '5', question: '分析用户行为数据模式', category: '用户分析' },
    { id: '6', question: '优化资源配置建议', category: '运营优化' }
  ];

  // 模拟数据项
  const dataItems: DataItem[] = [
    { id: '1', name: '销售数据', type: '表格', description: '各区域月度销售统计' },
    { id: '2', name: '用户行为', type: '日志', description: '用户访问和操作记录' },
    { id: '3', name: '财务报表', type: '报表', description: '收入支出财务数据' },
    { id: '4', name: '项目进度', type: '任务', description: '各项目完成情况' },
    { id: '5', name: '库存数据', type: '实时', description: '产品库存实时数据' },
    { id: '6', name: '客户反馈', type: '文本', description: '客户满意度调研' }
  ];

  // 自动滚动到底部的函数
  const scrollToBottom = () => {
    // 使用 setTimeout 确保 DOM 更新完成后再滚动
    setTimeout(() => {
      if (scrollContainerRef.current) {
        // 滚动容器到底部
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
      // 备用方案：使用 messagesEndRef
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  };

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnalyzing]);

  // 在组件挂载时也滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, []);

  // 发送消息
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, newMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsAnalyzing(true);
    
    // 立即滚动到底部显示用户消息
    scrollToBottom();

    // 模拟AI回复
    setTimeout(() => {
      const hasChart = Math.random() > 0.5; // 50%概率生成图表
      const chartTypes: ('bar' | 'line' | 'pie')[] = ['bar', 'line', 'pie'];
      const randomChartType = chartTypes[Math.floor(Math.random() * chartTypes.length)];
      
      const botReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `我理解您的问题："${currentInput}"。${hasChart ? '让我为您生成相关的数据图表进行分析...' : '让我为您分析一下...'}`,
        timestamp: new Date().toLocaleTimeString(),
        hasChart,
        chartType: hasChart ? randomChartType : undefined
      };
      setMessages(prev => [...prev, botReply]);
      setIsAnalyzing(false);
      
      // 滚动到底部显示机器人回复
      scrollToBottom();
      
      // 更新历史对话
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? { ...conv, lastMessage: botReply.content, timestamp: botReply.timestamp, messageCount: conv.messageCount + 2 }
          : conv
      ));
    }, 1500);
  };

  // 点击智能推荐问题
  const handleQuestionClick = (question: string) => {
    setChatInput(question);
  };

  // 新建对话
  const handleNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation: HistoryConversation = {
      id: newId,
      title: `对话 ${conversations.length + 1}`,
      lastMessage: '新建对话',
      timestamp: new Date().toLocaleTimeString(),
      messageCount: 0
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newId);
    setMessages([{
      id: '1',
      type: 'bot',
      content: '您好！我是您的智能助手，可以帮助您进行数据分析、项目管理和决策支持。有什么我可以帮助您的吗？',
      timestamp: new Date().toLocaleTimeString()
    }]);
    
    // 滚动到底部显示欢迎消息
    setTimeout(() => scrollToBottom(), 100);
  };

  // 切换对话
  const handleConversationSwitch = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // 这里应该加载对应对话的消息历史，暂时使用当前消息
  };

  // 数据选择
  const handleDataSelect = (dataItem: DataItem) => {
    setSelectedData(prev => {
      const exists = prev.find(item => item.id === dataItem.id);
      if (exists) {
        return prev.filter(item => item.id !== dataItem.id);
      } else {
        return [...prev, dataItem];
      }
    });
  };

  // 过滤历史对话
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchHistory.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchHistory.toLowerCase())
  );

  // 过滤数据项
  const filteredDataItems = dataItems.filter(item =>
    item.name.toLowerCase().includes(searchData.toLowerCase()) ||
    item.description.toLowerCase().includes(searchData.toLowerCase())
  );

  // 渲染图表
  const renderChart = (type: 'bar' | 'line' | 'pie') => {
    const chartData = [
      { name: '华北', value: 2400, color: '#3B82F6' },
      { name: '华东', value: 1800, color: '#10B981' },
      { name: '华南', value: 1600, color: '#F59E0B' },
      { name: '华中', value: 1200, color: '#EF4444' },
      { name: '西南', value: 800, color: '#8B5CF6' },
      { name: '东北', value: 600, color: '#06B6D4' }
    ];

    const maxValue = Math.max(...chartData.map(d => d.value));

    return (
      <div className="mt-4 p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {type === 'bar' && <BarChart3 className="h-5 w-5 text-blue-500" />}
            {type === 'line' && <TrendingUp className="h-5 w-5 text-green-500" />}
            {type === 'pie' && <PieChart className="h-5 w-5 text-purple-500" />}
            <span className="text-base font-semibold text-gray-800">数据可视化图表</span>
          </div>
          <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
            {type === 'bar' && '柱状图'}
            {type === 'line' && '折线图'}
            {type === 'pie' && '饼图'}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          {type === 'bar' && (
            <div className="space-y-3">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-12 text-xs text-gray-600 font-medium">{item.name}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                      style={{ 
                        width: `${(item.value / maxValue) * 100}%`,
                        backgroundColor: item.color,
                        background: `linear-gradient(90deg, ${item.color}dd, ${item.color})`
                      }}
                    >
                      <span className="text-xs text-white font-semibold">{item.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {type === 'line' && (
            <div className="h-40 flex items-end justify-between px-2 border-b border-l border-gray-200 relative">
              {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-500"
                    style={{ 
                      backgroundColor: item.color,
                      marginBottom: `${(item.value / maxValue) * 120}px`
                    }}
                  ></div>
                  <div className="text-xs text-gray-600 font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.value}</div>
                </div>
              ))}
            </div>
          )}
          
          {type === 'pie' && (
            <div className="flex items-center justify-center h-40">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                    <PieChart className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <div className="absolute -right-20 top-0 space-y-1">
                  {chartData.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-gray-600">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-3 text-xs text-gray-500 text-center">
          基于选择的数据源生成 • 实时更新
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-white">
      {/* 左侧历史对话边栏 */}
      <div className="w-80 border-r bg-gray-50 flex flex-col">
        {/* 新建对话按钮 */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <Button 
            onClick={handleNewConversation}
            className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-3" />
            <span className="text-base">新建对话</span>
          </Button>
        </div>

        {/* 搜索框 */}
        <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 bg-blue-100 rounded-full">
              <Search className="h-3 w-3 text-blue-500" />
            </div>
            <input
              type="text"
              placeholder="搜索历史对话..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
            />
            {searchHistory && (
              <button
                onClick={() => setSearchHistory('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* 历史对话列表 */}
        <div className="flex-1 overflow-y-auto px-2">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationSwitch(conversation.id)}
              className={`p-4 mb-2 rounded-xl cursor-pointer transition-all duration-300 group ${
                currentConversationId === conversation.id 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-md' 
                  : 'hover:bg-white hover:shadow-lg border border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  currentConversationId === conversation.id 
                    ? 'bg-gradient-to-r from-blue-400 to-purple-500' 
                    : 'bg-gray-100 group-hover:bg-blue-100'
                }`}>
                  <MessageSquare className={`h-4 w-4 transition-colors ${
                    currentConversationId === conversation.id 
                      ? 'text-white' 
                      : 'text-gray-400 group-hover:text-blue-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold truncate transition-colors ${
                    currentConversationId === conversation.id 
                      ? 'text-blue-700' 
                      : 'text-gray-900 group-hover:text-blue-600'
                  }`}>
                    {conversation.title}
                  </h4>
                  <p className="text-xs text-gray-500 truncate mt-1 leading-relaxed">
                    {conversation.lastMessage}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{conversation.timestamp}</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">{conversation.messageCount}</span>
                      <span className="text-xs text-gray-400">条消息</span>
                    </div>
                    {currentConversationId === conversation.id && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 中间主要内容区 */}
      <div className="flex-1 flex flex-col relative">
        {/* 页面头部 */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">智能助手</h1>
                <p className="text-sm text-gray-600">我可以帮助您解答问题和提供建议</p>
              </div>
            </div>
            
            {/* 数据选择按钮 */}
            <Button
              onClick={() => setShowDataSelector(true)}
              className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 px-6 py-3 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Database className="h-5 w-5" />
              <span className="font-medium">选择数据源</span>
              {selectedData.length > 0 && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full font-semibold border border-white/30">
                  {selectedData.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* 可滚动的内容区域 */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-[200px]">
          {/* 智能问题推荐 */}
          <div className="p-6 border-b bg-gradient-to-r from-green-50 via-blue-50 to-purple-50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">💡</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900">智能问题推荐</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {smartQuestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleQuestionClick(item.question)}
                  className="text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:shadow-lg transition-all duration-300 group transform hover:scale-105"
                >
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors leading-relaxed">
                    {item.question}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {item.category}
                    </span>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      点击询问
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 消息列表 */}
          <div className="p-6">
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div key={message.id}>
                  <div
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type === 'bot' && (
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-2xl px-5 py-4 shadow-sm ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-blue-200'
                          : 'bg-white border border-gray-200 text-gray-900 shadow-gray-100'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-3 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {message.timestamp}
                      </p>
                    </div>
                    {message.type === 'user' && (
                      <div className="flex-shrink-0 ml-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white text-sm font-medium">我</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 图表展示 */}
                  {message.hasChart && message.chartType && message.type === 'bot' && (
                    <div className="flex justify-start mt-2">
                      <div className="max-w-[70%]">
                        {renderChart(message.chartType)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isAnalyzing && (
                <div className="flex justify-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">正在思考...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* 固定在底部的输入区域 */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-gray-50 shadow-lg">
          <div className="max-w-4xl mx-auto">
            {/* 已选择的数据显示 */}
            {selectedData.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">已选择数据源：</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedData.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {item.name}
                      <button
                        onClick={() => handleDataSelect(item)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="输入您的问题..."
                  className="w-full min-h-[60px] max-h-[120px] resize-none bg-white border-2 border-gray-200 focus:border-blue-500 rounded-lg px-4 py-3 pr-16 text-sm transition-all duration-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={() => setShowDataSelector(true)}
                  size="sm"
                  className="absolute right-2 top-2 h-8 w-8 p-0 bg-black hover:bg-gray-800 text-white"
                  title="选择数据源"
                >
                  <Database className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isAnalyzing}
                className="self-end h-[60px] px-6 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:shadow-none"
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">发送中</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    <span className="text-sm font-medium">发送</span>
                  </div>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">按 Enter 发送，Shift + Enter 换行</p>
          </div>
        </div>
      </div>

      {/* 数据选择弹窗 */}
      {showDataSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-[600px] max-h-[90vh] flex flex-col mx-auto">
            {/* 弹窗头部 */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">选择数据源</h2>
                <Button
                  onClick={() => setShowDataSelector(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* 搜索框 */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索数据源..."
                  value={searchData}
                  onChange={(e) => setSearchData(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 数据列表 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {filteredDataItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleDataSelect(item)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedData.find(selected => selected.id === item.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded ${
                        selectedData.find(selected => selected.id === item.id)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Database className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="p-6 border-t bg-gradient-to-r from-gray-50 to-blue-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">
                    已选择 {selectedData.length} 个数据源
                  </span>
                </div>
                <Button
                  onClick={() => setShowDataSelector(false)}
                  disabled={selectedData.length === 0}
                  className="bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                >
                  <span className="flex items-center gap-2">
                    确认选择
                    {selectedData.length > 0 && (
                      <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                        {selectedData.length}
                      </span>
                    )}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}