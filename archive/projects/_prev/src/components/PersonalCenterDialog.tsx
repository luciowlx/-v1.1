import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { 
  User, 
  Mail, 
  Lock, 
  Eye,
  EyeOff,
  Save,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

interface PersonalCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfile {
  username: string;
  email: string;
  realName: string;
  department: string;
  role: string;
}

/**
 * 个人中心弹窗组件：包含基本信息展示、邮箱验证与密码修改。
 * 仅前端模拟交互，支持国际化文案。
 * @param open 是否打开弹窗
 * @param onOpenChange 弹窗打开状态变更回调
 * @returns JSX 元素
 */
export function PersonalCenterDialog({ open, onOpenChange }: PersonalCenterDialogProps) {
  const { t } = useLanguage();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: "lixin",
    email: "lixin@company.com",
    realName: "李鑫",
    department: "技术部",
    role: "项目经理"
  });

  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    verificationCode: "",
    isEmailSent: false,
    isEmailVerified: false
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
    showNewPassword: false,
    showConfirmPassword: false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // 邮箱验证相关函数
  /**
   * 校验邮箱格式是否合法
   * @param email 邮箱地址
   * @returns 是否为有效邮箱格式
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * 发送邮箱验证码（前端模拟）
   * - 校验新邮箱是否为空与格式是否正确
   * - 设置已发送状态与错误提示
   */
  const handleSendVerificationCode = () => {
    if (!emailForm.newEmail) {
      setErrors({...errors, email: t("personal.center.email.errors.emailRequired")});
      return;
    }
    
    if (!validateEmail(emailForm.newEmail)) {
      setErrors({...errors, email: t("personal.center.email.errors.emailInvalid")});
      return;
    }

    // 模拟发送验证码
    setEmailForm({...emailForm, isEmailSent: true});
    setErrors({...errors, email: ""});
    console.log("发送验证码到:", emailForm.newEmail);
  };

  /**
   * 验证邮箱验证码（前端模拟）
   * - 验证码为空时提示
   * - 正确验证码为 "123456"
   */
  const handleVerifyEmail = () => {
    if (!emailForm.verificationCode) {
      setErrors({...errors, verificationCode: t("personal.center.email.errors.codeRequired")});
      return;
    }

    // 模拟验证码验证（这里假设验证码是"123456"）
    if (emailForm.verificationCode === "123456") {
      setEmailForm({...emailForm, isEmailVerified: true});
      setErrors({...errors, verificationCode: ""});
      console.log(t("personal.center.email.verification.success"));
    } else {
      setErrors({...errors, verificationCode: t("personal.center.email.errors.codeInvalid")});
    }
  };

  /**
   * 更新用户邮箱（前端模拟）
   * - 需先完成验证码验证
   */
  const handleUpdateEmail = () => {
    if (!emailForm.isEmailVerified) {
      setErrors({...errors, email: t("personal.center.email.errors.verifyFirst")});
      return;
    }

    setUserProfile({...userProfile, email: emailForm.newEmail});
    setEmailForm({
      newEmail: "",
      verificationCode: "",
      isEmailSent: false,
      isEmailVerified: false
    });
    console.log(t("personal.center.email.update"));
  };

  // 密码验证相关函数
  /**
   * 校验新密码是否满足安全要求
   * 要求：至少8位，包含大小写字母、数字与特殊字符(@$!%*?&)
   * @param password 新密码
   * @returns 校验结果与提示信息
   */
  const validatePassword = (password: string): {isValid: boolean, message: string} => {
    if (password.length < 8) {
      return {isValid: false, message: t("personal.center.password.requirements.minLength")};
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      return {isValid: false, message: t("personal.center.password.requirements.lowercase")};
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return {isValid: false, message: t("personal.center.password.requirements.uppercase")};
    }
    
    if (!/(?=.*\d)/.test(password)) {
      return {isValid: false, message: t("personal.center.password.requirements.number")};
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return {isValid: false, message: t("personal.center.password.requirements.special")};
    }
    
    return {isValid: true, message: ""};
  };

  /**
   * 提交密码修改（前端模拟）
   * - 先校验新密码强度与确认密码一致性
   */
  const handlePasswordChange = () => {
    const newErrors: {[key: string]: string} = {};

    // 验证新密码
    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.message;
    }

    // 验证确认密码
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = t("personal.center.alert.passwordMismatch");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors({...errors, ...newErrors});
      return;
    }

    // 密码修改成功
    setPasswordForm({
      newPassword: "",
      confirmPassword: "",
      showNewPassword: false,
      showConfirmPassword: false
    });
    setErrors({});
    console.log(t("personal.center.alert.passwordUpdated"));
  };

  /**
   * 计算密码强度（前端估算）
   * @param password 密码
   * @returns 强度等级、标签文案与颜色样式
   */
  const getPasswordStrength = (password: string): {level: number, text: string, color: string} => {
    if (password.length === 0) return {level: 0, text: "", color: ""};
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[@$!%*?&])/.test(password)) score++;

    if (score <= 2) return {level: 1, text: t("personal.center.password.strength.weak"), color: "text-red-500"};
    if (score <= 3) return {level: 2, text: t("personal.center.password.strength.medium"), color: "text-yellow-500"};
    if (score <= 4) return {level: 3, text: t("personal.center.password.strength.strong"), color: "text-green-500"};
    return {level: 4, text: t("personal.center.password.strength.veryStrong"), color: "text-green-600"};
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{t("personal.center.title")}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">{t("personal.center.dialog.tabs.basic")}</TabsTrigger>
            <TabsTrigger value="email">{t("personal.center.dialog.tabs.email")}</TabsTrigger>
            <TabsTrigger value="password">{t("personal.center.dialog.tabs.password")}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{t("personal.center.section.basicInfo")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-blue-500 text-white text-lg">
                      {userProfile.realName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">{userProfile.realName}</h3>
                    <p className="text-sm text-gray-500">@{userProfile.username}</p>
                    <Badge variant="secondary">{userProfile.role}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("personal.center.form.username")}</Label>
                    <Input value={userProfile.username} disabled />
                  </div>
                  <div>
                    <Label>{t("personal.center.form.realName")}</Label>
                    <Input value={userProfile.realName} disabled />
                  </div>
                  <div>
                    <Label>{t("personal.center.form.department")}</Label>
                    <Input value={userProfile.department} disabled />
                  </div>
                  <div>
                    <Label>{t("personal.center.form.role")}</Label>
                    <Input value={userProfile.role} disabled />
                  </div>
                  <div className="col-span-2">
                    <Label>{t("personal.center.email.current")}</Label>
                    <Input value={userProfile.email} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{t("personal.center.email.verification.title")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t("personal.center.email.current")}</Label>
                  <Input value={userProfile.email} disabled />
                </div>

                <div>
                  <Label>{t("personal.center.email.new")}</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="email"
                      placeholder={t("personal.center.email.new.placeholder")}
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm({...emailForm, newEmail: e.target.value})}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    <Button 
                      onClick={handleSendVerificationCode}
                      disabled={emailForm.isEmailSent}
                      variant="outline"
                    >
                      {emailForm.isEmailSent ? t("personal.center.email.codeSent") : t("personal.center.email.sendCode")}
                    </Button>
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {emailForm.isEmailSent && (
                  <div>
                    <Label>{t("personal.center.email.verificationCode")}</Label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder={t("personal.center.email.verificationCode.placeholder")}
                        value={emailForm.verificationCode}
                        onChange={(e) => setEmailForm({...emailForm, verificationCode: e.target.value})}
                        className={errors.verificationCode ? "border-red-500" : ""}
                      />
                      <Button 
                        onClick={handleVerifyEmail}
                        disabled={emailForm.isEmailVerified}
                        variant="outline"
                      >
                        {emailForm.isEmailVerified ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          t("personal.center.email.verify")
                        )}
                      </Button>
                    </div>
                    {errors.verificationCode && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.verificationCode}
                      </p>
                    )}
                    {emailForm.isEmailVerified && (
                      <p className="text-sm text-green-500 flex items-center mt-1">
                        <Check className="h-3 w-3 mr-1" />
                        {t("personal.center.email.verification.success")}
                      </p>
                    )}
                  </div>
                )}

                <Button 
                  onClick={handleUpdateEmail}
                  disabled={!emailForm.isEmailVerified}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t("personal.center.email.update")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>{t("personal.center.dialog.tabs.password")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t("personal.center.security.newPassword")}</Label>
                  <div className="relative">
                    <Input
                      type={passwordForm.showNewPassword ? "text" : "password"}
                      placeholder={t("personal.center.security.newPassword.placeholder")}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className={errors.newPassword ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setPasswordForm({...passwordForm, showNewPassword: !passwordForm.showNewPassword})}
                    >
                      {passwordForm.showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{t("personal.center.password.strength.label")}:</span>
                        <span className={`text-sm font-medium ${passwordStrength.color}`}>
                          {passwordStrength.text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.level === 1 ? 'bg-red-500 w-1/4' :
                            passwordStrength.level === 2 ? 'bg-yellow-500 w-2/4' :
                            passwordStrength.level === 3 ? 'bg-green-500 w-3/4' :
                            'bg-green-600 w-full'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  {errors.newPassword && (
                    <p className="text-sm text-red-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <Label>{t("personal.center.security.confirmPassword")}</Label>
                  <div className="relative">
                    <Input
                      type={passwordForm.showConfirmPassword ? "text" : "password"}
                      placeholder={t("personal.center.security.confirmPassword.placeholder")}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className={errors.confirmPassword ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setPasswordForm({...passwordForm, showConfirmPassword: !passwordForm.showConfirmPassword})}
                    >
                      {passwordForm.showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">{t("personal.center.password.requirements.title")}：</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• {t("personal.center.password.requirements.minLength")}</li>
                    <li>• {t("personal.center.password.requirements.uppercase")}</li>
                    <li>• {t("personal.center.password.requirements.lowercase")}</li>
                    <li>• {t("personal.center.password.requirements.number")}</li>
                    <li>• {t("personal.center.password.requirements.special")}</li>
                  </ul>
                </div>

                <Button 
                  onClick={handlePasswordChange}
                  className="w-full"
                  disabled={!passwordForm.newPassword || !passwordForm.confirmPassword}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t("personal.center.security.submit")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}