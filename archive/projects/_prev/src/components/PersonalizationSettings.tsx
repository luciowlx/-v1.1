import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { 
  ArrowLeft, 
  Upload, 
  Palette, 
  Monitor, 
  Navigation, 
  Image as ImageIcon,
  Settings,
  Save,
  RotateCcw,
  Eye,
  Download
} from "lucide-react";

interface PersonalizationSettingsProps {
  onBack: () => void;
}

export function PersonalizationSettings({ onBack }: PersonalizationSettingsProps) {
  // 系统标识配置状态
  const [systemConfig, setSystemConfig] = useState({
    logoUrl: "/logo.png",
    systemName: "Linux",
    systemSubtitle: "大模型机器学习平台"
  });

  // 导航样式配置状态
  const [navigationConfig, setNavigationConfig] = useState({
    layout: "sidebar", // sidebar, topbar, mixed
    sidebarWidth: "240",
    showIcons: true,
    showLabels: true,
    collapsible: true
  });

  // 主题配置状态
  const [themeConfig, setThemeConfig] = useState({
    primaryColor: "#3b82f6", // 蓝色
    accentColor: "#10b981", // 绿色
    backgroundColor: "#f8fafc",
    textColor: "#1e293b",
    darkMode: false
  });

  // 登录页配置状态
  const [loginConfig, setLoginConfig] = useState({
    backgroundImage: "",
    backgroundType: "image", // image, gradient, solid
    gradientStart: "#3b82f6",
    gradientEnd: "#1e40af",
    solidColor: "#f1f5f9"
  });

  // 预设主题色
  const presetColors = [
    { name: "蓝色", primary: "#3b82f6", accent: "#10b981" },
    { name: "绿色", primary: "#10b981", accent: "#3b82f6" },
    { name: "紫色", primary: "#8b5cf6", accent: "#f59e0b" },
    { name: "红色", primary: "#ef4444", accent: "#06b6d4" },
    { name: "橙色", primary: "#f97316", accent: "#8b5cf6" },
    { name: "粉色", primary: "#ec4899", accent: "#10b981" },
    { name: "青色", primary: "#06b6d4", accent: "#f59e0b" },
    { name: "灰色", primary: "#6b7280", accent: "#3b82f6" }
  ];

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSystemConfig(prev => ({
          ...prev,
          logoUrl: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLoginConfig(prev => ({
          ...prev,
          backgroundImage: e.target?.result as string,
          backgroundType: "image"
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const applyTheme = (theme: typeof presetColors[0]) => {
    setThemeConfig(prev => ({
      ...prev,
      primaryColor: theme.primary,
      accentColor: theme.accent
    }));
  };

  const resetToDefault = () => {
    setSystemConfig({
      logoUrl: "/logo.png",
      systemName: "Linux",
      systemSubtitle: "大模型机器学习平台"
    });
    setNavigationConfig({
      layout: "sidebar",
      sidebarWidth: "240",
      showIcons: true,
      showLabels: true,
      collapsible: true
    });
    setThemeConfig({
      primaryColor: "#3b82f6",
      accentColor: "#10b981",
      backgroundColor: "#f8fafc",
      textColor: "#1e293b",
      darkMode: false
    });
    setLoginConfig({
      backgroundImage: "",
      backgroundType: "image",
      gradientStart: "#3b82f6",
      gradientEnd: "#1e40af",
      solidColor: "#f1f5f9"
    });
  };

  const saveSettings = () => {
    // 这里应该调用API保存设置
    console.log("保存设置:", {
      systemConfig,
      navigationConfig,
      themeConfig,
      loginConfig
    });
    alert("设置已保存！");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>返回</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">个性化设置</h1>
              <p className="text-gray-600">自定义系统外观和行为</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={resetToDefault}>
              <RotateCcw className="h-4 w-4 mr-2" />
              重置默认
            </Button>
            <Button onClick={saveSettings}>
              <Save className="h-4 w-4 mr-2" />
              保存设置
            </Button>
          </div>
        </div>

        {/* 配置选项卡 */}
        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>系统标识</span>
            </TabsTrigger>
            <TabsTrigger value="navigation" className="flex items-center space-x-2">
              <Navigation className="h-4 w-4" />
              <span>导航样式</span>
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span>主题配置</span>
            </TabsTrigger>
            <TabsTrigger value="login" className="flex items-center space-x-2">
              <ImageIcon className="h-4 w-4" />
              <span>登录页配置</span>
            </TabsTrigger>
          </TabsList>

          {/* 系统标识配置 */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logo设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {systemConfig.logoUrl ? (
                        <img 
                          src={systemConfig.logoUrl} 
                          alt="Logo" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="logo-upload">上传Logo</Label>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="mt-1"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        支持 PNG、JPG、SVG 格式，建议尺寸 64x64px
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>系统名称</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="system-name">系统名称</Label>
                    <Input
                      id="system-name"
                      value={systemConfig.systemName}
                      onChange={(e) => setSystemConfig(prev => ({
                        ...prev,
                        systemName: e.target.value
                      }))}
                      placeholder="请输入系统名称"
                    />
                  </div>
                  <div>
                    <Label htmlFor="system-subtitle">系统副标题</Label>
                    <Input
                      id="system-subtitle"
                      value={systemConfig.systemSubtitle}
                      onChange={(e) => setSystemConfig(prev => ({
                        ...prev,
                        systemSubtitle: e.target.value
                      }))}
                      placeholder="请输入系统副标题"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>预览效果</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {systemConfig.logoUrl ? (
                          <img 
                            src={systemConfig.logoUrl} 
                            alt="Logo" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          {systemConfig.systemName}
                        </h2>
                        <span className="text-xs text-slate-400">
                          {systemConfig.systemSubtitle}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 导航样式配置 */}
          <TabsContent value="navigation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>布局设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>导航布局</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { value: "sidebar", label: "侧边栏" },
                        { value: "topbar", label: "顶部栏" },
                        { value: "mixed", label: "混合模式" }
                      ].map((layout) => (
                        <Button
                          key={layout.value}
                          variant={navigationConfig.layout === layout.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNavigationConfig(prev => ({
                            ...prev,
                            layout: layout.value as any
                          }))}
                        >
                          {layout.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {navigationConfig.layout === "sidebar" && (
                    <div>
                      <Label htmlFor="sidebar-width">侧边栏宽度 (px)</Label>
                      <Input
                        id="sidebar-width"
                        type="number"
                        value={navigationConfig.sidebarWidth}
                        onChange={(e) => setNavigationConfig(prev => ({
                          ...prev,
                          sidebarWidth: e.target.value
                        }))}
                        min="200"
                        max="400"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>显示选项</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>显示图标</Label>
                    <Button
                      variant={navigationConfig.showIcons ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNavigationConfig(prev => ({
                        ...prev,
                        showIcons: !prev.showIcons
                      }))}
                    >
                      {navigationConfig.showIcons ? "开启" : "关闭"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>显示标签</Label>
                    <Button
                      variant={navigationConfig.showLabels ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNavigationConfig(prev => ({
                        ...prev,
                        showLabels: !prev.showLabels
                      }))}
                    >
                      {navigationConfig.showLabels ? "开启" : "关闭"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>可折叠</Label>
                    <Button
                      variant={navigationConfig.collapsible ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNavigationConfig(prev => ({
                        ...prev,
                        collapsible: !prev.collapsible
                      }))}
                    >
                      {navigationConfig.collapsible ? "开启" : "关闭"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 主题配置 */}
          <TabsContent value="theme" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>预设主题</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {presetColors.map((theme) => (
                      <Button
                        key={theme.name}
                        variant="outline"
                        className="h-auto p-3 flex items-center space-x-3"
                        onClick={() => applyTheme(theme)}
                      >
                        <div className="flex space-x-1">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: theme.accent }}
                          />
                        </div>
                        <span>{theme.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>自定义颜色</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="primary-color">主色调</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="primary-color"
                        type="color"
                        value={themeConfig.primaryColor}
                        onChange={(e) => setThemeConfig(prev => ({
                          ...prev,
                          primaryColor: e.target.value
                        }))}
                        className="w-12 h-10 p-1 border rounded"
                      />
                      <Input
                        value={themeConfig.primaryColor}
                        onChange={(e) => setThemeConfig(prev => ({
                          ...prev,
                          primaryColor: e.target.value
                        }))}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="accent-color">辅助色</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="accent-color"
                        type="color"
                        value={themeConfig.accentColor}
                        onChange={(e) => setThemeConfig(prev => ({
                          ...prev,
                          accentColor: e.target.value
                        }))}
                        className="w-12 h-10 p-1 border rounded"
                      />
                      <Input
                        value={themeConfig.accentColor}
                        onChange={(e) => setThemeConfig(prev => ({
                          ...prev,
                          accentColor: e.target.value
                        }))}
                        placeholder="#10b981"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>深色模式</Label>
                    <Button
                      variant={themeConfig.darkMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setThemeConfig(prev => ({
                        ...prev,
                        darkMode: !prev.darkMode
                      }))}
                    >
                      {themeConfig.darkMode ? "开启" : "关闭"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>主题预览</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="p-6 rounded-lg border-2"
                    style={{ 
                      backgroundColor: themeConfig.backgroundColor,
                      borderColor: themeConfig.primaryColor 
                    }}
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <Button 
                        style={{ backgroundColor: themeConfig.primaryColor }}
                        className="text-white"
                      >
                        主要按钮
                      </Button>
                      <Button 
                        variant="outline"
                        style={{ 
                          borderColor: themeConfig.accentColor,
                          color: themeConfig.accentColor 
                        }}
                      >
                        次要按钮
                      </Button>
                    </div>
                    <p style={{ color: themeConfig.textColor }}>
                      这是主题预览文本，展示当前配色方案的效果。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 登录页配置 */}
          <TabsContent value="login" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>背景设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>背景类型</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { value: "image", label: "图片" },
                        { value: "gradient", label: "渐变" },
                        { value: "solid", label: "纯色" }
                      ].map((type) => (
                        <Button
                          key={type.value}
                          variant={loginConfig.backgroundType === type.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLoginConfig(prev => ({
                            ...prev,
                            backgroundType: type.value as any
                          }))}
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {loginConfig.backgroundType === "image" && (
                    <div>
                      <Label htmlFor="background-upload">上传背景图片</Label>
                      <Input
                        id="background-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundUpload}
                        className="mt-1"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        建议尺寸 1920x1080px，支持 JPG、PNG 格式
                      </p>
                    </div>
                  )}

                  {loginConfig.backgroundType === "gradient" && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="gradient-start">渐变起始色</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input
                            type="color"
                            value={loginConfig.gradientStart}
                            onChange={(e) => setLoginConfig(prev => ({
                              ...prev,
                              gradientStart: e.target.value
                            }))}
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            value={loginConfig.gradientStart}
                            onChange={(e) => setLoginConfig(prev => ({
                              ...prev,
                              gradientStart: e.target.value
                            }))}
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="gradient-end">渐变结束色</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input
                            type="color"
                            value={loginConfig.gradientEnd}
                            onChange={(e) => setLoginConfig(prev => ({
                              ...prev,
                              gradientEnd: e.target.value
                            }))}
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            value={loginConfig.gradientEnd}
                            onChange={(e) => setLoginConfig(prev => ({
                              ...prev,
                              gradientEnd: e.target.value
                            }))}
                            placeholder="#1e40af"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {loginConfig.backgroundType === "solid" && (
                    <div>
                      <Label htmlFor="solid-color">背景颜色</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="color"
                          value={loginConfig.solidColor}
                          onChange={(e) => setLoginConfig(prev => ({
                            ...prev,
                            solidColor: e.target.value
                          }))}
                          className="w-12 h-10 p-1 border rounded"
                        />
                        <Input
                          value={loginConfig.solidColor}
                          onChange={(e) => setLoginConfig(prev => ({
                            ...prev,
                            solidColor: e.target.value
                          }))}
                          placeholder="#f1f5f9"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>登录页预览</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="w-full h-64 rounded-lg flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: loginConfig.backgroundType === "image" && loginConfig.backgroundImage
                        ? `url(${loginConfig.backgroundImage}) center/cover`
                        : loginConfig.backgroundType === "gradient"
                        ? `linear-gradient(135deg, ${loginConfig.gradientStart}, ${loginConfig.gradientEnd})`
                        : loginConfig.solidColor
                    }}
                  >
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">系统登录</h3>
                        <div className="space-y-2">
                          <div className="w-48 h-8 bg-gray-200 rounded"></div>
                          <div className="w-48 h-8 bg-gray-200 rounded"></div>
                          <div className="w-48 h-8 bg-blue-500 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}