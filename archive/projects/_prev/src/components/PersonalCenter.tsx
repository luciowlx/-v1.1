import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  Save,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Briefcase,
  Shield,
  Bell,
  Palette,
  Globe
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone: string;
  realName: string;
  avatar?: string;
  department: string;
  role: string;
  position: string;
  location: string;
  bio: string;
  joinDate: string;
  lastLogin: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  systemNotifications: boolean;
  projectUpdates: boolean;
  taskReminders: boolean;
}

interface SecurityLog {
  id: string;
  action: string;
  ip: string;
  location: string;
  device: string;
  timestamp: string;
  status: "success" | "failed";
}

/**
 * PersonalCenter component
 * 功能：展示并编辑个人资料、密码安全设置、通知偏好与安全日志。
 * 说明：纯前端原型演示，所有数据为本地状态模拟；支持国际化文案。
 * 返回值：React JSX 元素。
 */
export function PersonalCenter() {
  const { t } = useLanguage();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: "1",
    username: "zhangsan",
    email: "zhangsan@company.com",
    phone: "13800138001",
    realName: "张三",
    department: "技术部",
    role: "项目经理",
    position: "高级项目经理",
    location: "北京市朝阳区",
    bio: "专注于AI项目管理，拥有5年项目管理经验",
    joinDate: "2024-01-15",
    lastLogin: "2024-03-15 10:30:00"
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    systemNotifications: true,
    projectUpdates: true,
    taskReminders: true
  });

  const [securityLogs] = useState<SecurityLog[]>([
    {
      id: "1",
      action: "登录",
      ip: "192.168.1.100",
      location: "北京市",
      device: "Chrome 浏览器",
      timestamp: "2024-03-15 10:30:00",
      status: "success"
    },
    {
      id: "2",
      action: "修改密码",
      ip: "192.168.1.100",
      location: "北京市",
      device: "Chrome 浏览器",
      timestamp: "2024-03-14 16:20:00",
      status: "success"
    },
    {
      id: "3",
      action: "登录失败",
      ip: "192.168.1.105",
      location: "上海市",
      device: "Firefox 浏览器",
      timestamp: "2024-03-13 09:15:00",
      status: "failed"
    }
  ]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(userProfile);

  /**
   * 更新个人资料表单内容到主档。
   * 参数：无
   * 返回：void
   */
  const handleProfileUpdate = (): void => {
    setUserProfile(editForm);
    setIsEditing(false);
  };

  /**
   * 提交修改密码表单，进行基本一致性校验并模拟成功提示。
   * 参数：无
   * 返回：void
   */
  const handlePasswordChange = (): void => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert(t("personal.center.alert.passwordMismatch"));
      return;
    }
    // 这里应该调用API更新密码
    alert(t("personal.center.alert.passwordUpdated"));
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  /**
   * 切换通知偏好开关。
   * 参数：key 通知字段键；value 新的布尔值
   * 返回：void
   */
  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean): void => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  /**
   * 切换密码输入框的明文/密文显示。
   * 参数：field 要切换的字段标识（current/new/confirm）
   * 返回：void
   */
  const togglePasswordVisibility = (field: keyof typeof showPasswords): void => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  /**
   * 将安全日志中的中文动作文案映射为 i18n 文案。
   * 参数：action 原始动作中文字符串
   * 返回：对应的国际化字符串
   */
  const translateLogAction = (action: string): string => {
    if (action === "登录") return t("personal.center.activity.login");
    if (action === "修改密码") return t("personal.center.activity.changePassword");
    if (action === "登录失败") return t("personal.center.activity.loginFailed");
    return action;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">{t("personal.center.title")}</h2>
        <p className="text-gray-600 mt-1">{t("personal.center.description")}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">{t("personal.center.tabs.profile")}</TabsTrigger>
          <TabsTrigger value="security">{t("personal.center.tabs.security")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("personal.center.tabs.notifications")}</TabsTrigger>
          <TabsTrigger value="logs">{t("personal.center.tabs.logs")}</TabsTrigger>
        </TabsList>

        {/* 个人信息 */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {t("personal.center.section.basicInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 头像部分 */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={userProfile.avatar} />
                    <AvatarFallback className="text-lg">{userProfile.realName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-lg font-medium">{userProfile.realName}</h3>
                  <p className="text-gray-600">@{userProfile.username}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <Badge variant="outline">{userProfile.role}</Badge>
                    <Badge variant="secondary">{userProfile.department}</Badge>
                  </div>
                </div>
              </div>

              {/* 信息表单 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="realName">{t("personal.center.form.realName")}</Label>
                  <Input
                    id="realName"
                    value={isEditing ? editForm.realName : userProfile.realName}
                    onChange={(e) => setEditForm({ ...editForm, realName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="username">{t("personal.center.form.username")}</Label>
                  <Input
                    id="username"
                    value={isEditing ? editForm.username : userProfile.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t("personal.center.form.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      value={isEditing ? editForm.email : userProfile.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">{t("personal.center.form.phone")}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="phone"
                      value={isEditing ? editForm.phone : userProfile.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="lastLogin">{t("personal.center.account.lastLogin")}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="lastLogin"
                      value={userProfile.lastLogin}
                      disabled
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="role">{t("personal.center.form.role")}</Label>
                  <Input
                    id="role"
                    value={userProfile.role}
                    disabled
                  />
                </div>
              </div>

              {/* 个人简介块按需求移除 */}

              <div className="flex justify-end space-x-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      {t("personal.center.actions.cancel")}
                    </Button>
                    <Button onClick={handleProfileUpdate}>
                      <Save className="h-4 w-4 mr-2" />
                      {t("personal.center.actions.save")}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    {t("personal.center.actions.edit")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 账户信息块按需求移除；“最后登录时间”已移动到基本信息区域展示 */}
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                {t("personal.center.security.changePassword")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">{t("personal.center.security.currentPassword")}</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder={t("personal.center.security.currentPassword.placeholder")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility("current")}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="newPassword">{t("personal.center.security.newPassword")}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder={t("personal.center.security.newPassword.placeholder")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility("new")}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">{t("personal.center.security.confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder={t("personal.center.security.confirmPassword.placeholder")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility("confirm")}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={handlePasswordChange} className="w-full">
                {t("personal.center.security.submit")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置 */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                {t("personal.center.notifications.preferences")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { key: "emailNotifications", label: t("personal.center.notifications.email"), hint: t("personal.center.notifications.hint.email") },
                { key: "smsNotifications", label: t("personal.center.notifications.sms"), hint: t("personal.center.notifications.hint.sms") },
                { key: "systemNotifications", label: t("personal.center.notifications.system"), hint: t("personal.center.notifications.hint.system") },
                { key: "projectUpdates", label: t("personal.center.notifications.projectUpdates"), hint: t("personal.center.notifications.hint.projectUpdates") },
                { key: "taskReminders", label: t("personal.center.notifications.taskReminders"), hint: t("personal.center.notifications.hint.taskReminders") },
              ] as { key: keyof NotificationSettings; label: string; hint: string }[]).map(({ key, label, hint }) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">{label}</span>
                    <p className="text-sm text-gray-600">{hint}</p>
                  </div>
                  <Button
                    variant={notificationSettings[key] ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleNotificationChange(key, !notificationSettings[key])}
                  >
                    {notificationSettings[key] ? t("personal.center.notifications.status.enabled") : t("personal.center.notifications.status.disabled")}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全日志 */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                {t("personal.center.logs.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-green-500" : "bg-red-500"}`} />
                      <div>
                        <div className="font-medium">{translateLogAction(log.action)}</div>
                        <div className="text-sm text-gray-600">
                          {log.device} • {log.ip} • {log.location}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{log.timestamp}</div>
                      <Badge variant={log.status === "success" ? "default" : "destructive"} className="mt-1">
                        {log.status === "success" ? t("personal.center.logs.status.success") : t("personal.center.logs.status.failed")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}