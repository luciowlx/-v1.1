import { ArrowLeft, X } from "lucide-react";
import { Button } from "./ui/button";
import { PersonalCenter } from "./PersonalCenter";
import { PersonalizationSettings } from "./PersonalizationSettings";
import { NotificationCenterContent } from "./NotificationCenterContent";
import GlobalAIAssistant from "./GlobalAIAssistant";
import ErrorBoundary from "./ErrorBoundary";

interface FullPageViewProps {
  type: 'personal-center' | 'personalization-settings' | 'notification-center' | 'ai-assistant' | null;
  onClose: () => void;
  // 新增：通知中心初始页签（notifications | activity），用于从看板“查看全部”打开活动中心
  notificationCenterInitialTab?: 'notifications' | 'activity';
}

export function FullPageView({ type, onClose, notificationCenterInitialTab = 'notifications' }: FullPageViewProps) {
  if (!type) return null;

  const getPageTitle = () => {
    switch (type) {
      case 'personal-center':
        return '个人中心';
      case 'personalization-settings':
        return '个性化设置';
      case 'notification-center':
        return '通知中心';
      case 'ai-assistant':
        return '智能助手';
      default:
        return '';
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'personal-center':
        return <PersonalCenter />;
      case 'personalization-settings':
        return <PersonalizationSettings onBack={onClose} />;
      case 'notification-center':
        return <NotificationCenterContent initialTab={notificationCenterInitialTab} />;
      case 'ai-assistant':
        // 采用统一的 AI Copilot 组件（前端原型，模拟数据），在全屏容器内部渲染
        // 使用错误边界包裹，确保异常时不会影响整个应用
        return (
          <ErrorBoundary>
            <GlobalAIAssistant onClose={onClose} />
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 页面头部 */}
      <div className="h-16 bg-slate-800 text-white flex items-center justify-between px-6 shadow-lg">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">{getPageTitle()}</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-slate-300 hover:text-white hover:bg-slate-700"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* 页面内容 */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50">
        {renderContent()}
      </div>
    </div>
  );
}
