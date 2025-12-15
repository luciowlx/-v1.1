import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { 
  Bot, 
  Send
} from "lucide-react";

interface GlobalBotProps {
  onOpenSoloMode?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
}

export function GlobalBot({ onOpenSoloMode, isOpen, onClose }: GlobalBotProps) {
  const [activeFunction, setActiveFunction] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // 智能助手点击处理
  const handleBotClick = () => {
    console.log('智能助手被点击');
    setActiveFunction('chat');
  };

  // 监听外部控制的打开状态
  useEffect(() => {
    if (isOpen) {
      setActiveFunction('chat');
    }
  }, [isOpen]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: '您好！我是您的智能助手，可以帮助您进行数据分析、项目管理和决策支持。有什么我可以帮助您的吗？',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

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
    setChatInput('');
    setIsAnalyzing(true);

    // 模拟AI回复
    setTimeout(() => {
      const botReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `我理解您的问题："${chatInput}"。让我为您分析一下...`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botReply]);
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <>
      {/* 智能助手浮动按钮 */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-[9999]">
        <div className="relative group">
          <Button
            onClick={handleBotClick}
            onMouseEnter={() => setShowTooltip('bot')}
            onMouseLeave={() => setShowTooltip(null)}
            className={`h-14 w-14 rounded-full shadow-xl transition-all duration-300 hover:scale-110 ${
              activeFunction === 'chat'
                ? 'bg-gradient-to-r from-blue-600 to-purple-700'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            }`}
          >
            <Bot className="h-6 w-6 text-white" />
          </Button>

          {/* 工具提示 */}
          {showTooltip === 'bot' && (
            <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap z-[10000]">
              智能助手
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
            </div>
          )}

          {/* 呼吸光环效果 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-30 animate-ping"></div>
        </div>
      </div>

      {/* 聊天对话框 */}
      {activeFunction === 'chat' && (
        <Dialog open={true} onOpenChange={() => {
          setActiveFunction(null);
          onClose?.();
        }}>
          <DialogContent className="max-w-md max-h-[600px] p-0">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-500" />
                智能助手
              </DialogTitle>
              <DialogDescription>
                我可以帮助您解答问题和提供建议
              </DialogDescription>
            </DialogHeader>

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto px-4 max-h-[400px]">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                    </div>
                  </div>
                ))}
                
                {isAnalyzing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                        <span className="text-sm text-gray-600">正在思考...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 输入区域 */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="输入您的问题..."
                  className="flex-1 min-h-[40px] max-h-[100px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isAnalyzing}
                  size="sm"
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}