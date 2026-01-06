import { Bell, User, Settings, LogOut, Palette, Info, Languages } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenPersonalCenter?: () => void;
  onOpenPersonalizationSettings?: () => void;
  onOpenNotificationCenter?: () => void;
  onLogout?: () => void;
}

export function Header({ activeTab, onTabChange, onOpenPersonalCenter, onOpenPersonalizationSettings, onOpenNotificationCenter, onLogout }: HeaderProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { lang, t, setLang, toggleLang } = useLanguage();

  const navItems = [
    { id: "dashboard", zh: "系统总览", label: t("nav.dashboard") },
    { id: "project", zh: "项目管理", label: t("nav.project") },
    { id: "data", zh: "数据资产", label: t("nav.data") },
    { id: "task", zh: "决策推理", label: t("nav.task") },
    { id: "causal", zh: "因果洞察", label: t("nav.causalInsight") },
    { id: "notebook", zh: "开发空间", label: t("nav.notebook") },
    { id: "model", zh: "模型管理", label: t("nav.model") },
    { id: "system", zh: "系统管理", label: t("nav.system") },
  ];

  // 模拟获取未读通知数量
  useEffect(() => {
    // 这里应该从API获取未读通知数量
    // 现在使用模拟数据
    const mockUnreadCount = 3;
    setUnreadCount(mockUnreadCount);
  }, []);

  return (
    <header className="h-16 bg-slate-800 text-white flex items-center justify-between px-6 shadow-lg">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          <img src="/logo-icon.png" alt="LimiX Logo" className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight">LimiX | 通用数据分析平台</span>
        </div>

        <nav className="flex items-center space-x-6">
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => {
                console.log("点击导航项:", item.label); // 添加调试日志
                // 内部仍然使用中文标签作为 activeTab 值，以兼容现有 App.tsx 逻辑
                onTabChange(item.zh);
              }}
              className={`px-3 py-2 rounded-md transition-colors ${activeTab === item.zh
                ? "bg-slate-700 text-white"
                : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        {/* 语言切换 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white flex items-center gap-1"
            >
              <Languages className="h-4 w-4" />
              <span>{lang === "zh" ? "中文" : "EN"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-28 bg-white border border-gray-200 shadow-lg z-50">
            <DropdownMenuItem onClick={() => setLang("zh")}>中文</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLang("en")}>English</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-300 hover:text-white relative"
          onClick={() => onOpenNotificationCenter?.()}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 hover:bg-slate-700"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-slate-600 text-white">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-slate-300">lixin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg z-50">
            <DropdownMenuItem
              onClick={() => {
                console.log("个人中心被点击");
                onTabChange("系统管理");
                onOpenPersonalCenter?.();
              }}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <User className="h-4 w-4" />
              <span>{t("header.personalCenter")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                console.log("个性化设置被点击");
                onOpenPersonalizationSettings?.();
              }}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Palette className="h-4 w-4" />
              <span>{t("header.personalization")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center space-x-2 cursor-default"
            >
              <Info className="h-4 w-4" />
              <span>v1.0</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                console.log("退出登录被点击");
                onLogout?.();
              }}
              className="flex items-center space-x-2 cursor-pointer text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("header.logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
