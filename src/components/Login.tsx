import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Eye, EyeOff, Lock, User, HelpCircle } from "lucide-react";

interface LoginProps {
    onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        account: "",
        password: "",
        rememberMe: false
    });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate network request
        setTimeout(() => {
            setIsLoading(false);
            onLogin();
        }, 1000);
    };

    const handleForgotPassword = (e: React.MouseEvent) => {
        e.preventDefault();
        alert("请联系管理员重置密码\nPlease contact the administrator to reset your password");
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden !bg-[#0f172a]">
            {/* Simplified Dark Background */}
            <div className="absolute inset-0 w-full h-full !bg-[#0f172a]">
                {/* Main Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-slate-900 opacity-90" />

                {/* Subtle Aurora Beams */}
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        background: `
              radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 100% 100%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
              linear-gradient(115deg, transparent 40%, rgba(59, 130, 246, 0.1) 45%, rgba(147, 51, 234, 0.1) 55%, transparent 60%)
            `,
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            <div className="relative z-10 w-full max-w-md px-4 flex flex-col items-center">
                {/* Logo Area */}
                <div className="mb-8 text-center space-y-3">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto shadow-2xl border border-white/20">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-8 h-8 text-white"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold tracking-wider text-white font-mono drop-shadow-lg">limix</h1>
                    <p className="text-blue-200/80 text-xs tracking-[0.3em] uppercase font-medium">Machine Learning Platform</p>
                </div>

                {/* Login Card - Force styles with !important to override default theme */}
                <Card className="w-full !bg-white/10 !backdrop-blur-xl !border-white/10 !shadow-2xl overflow-hidden">
                    <CardHeader className="space-y-1 pb-6 text-center">
                        <CardTitle className="text-xl font-medium !text-white">
                            账号登录
                        </CardTitle>
                        <CardDescription className="!text-blue-200/70">
                            欢迎回来，请验证您的身份
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="account" className="text-sm font-medium !text-blue-100 ml-1">
                                    账号
                                </Label>
                                <div className="relative group">
                                    <Input
                                        id="account"
                                        placeholder="请输入邮箱 / 手机号"
                                        className="!pl-3 h-12 !bg-black/20 !border-white/10 !text-white !placeholder-white/30 focus:!bg-black/40 focus:!border-blue-400/50 transition-all duration-200"
                                        style={{ paddingLeft: '0.75rem' }}
                                        value={formData.account}
                                        onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-medium !text-blue-100 ml-1">
                                        密码
                                    </Label>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 w-5 h-5">
                                        <Lock className="h-5 w-5 text-blue-300/70 group-hover:text-blue-300 transition-colors" />
                                    </div>
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="请输入密码"
                                        className="!pl-12 !pr-10 h-12 !bg-black/20 !border-white/10 !text-white !placeholder-white/30 focus:!bg-black/40 focus:!border-blue-400/50 transition-all duration-200"
                                        style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute text-blue-300/50 hover:text-blue-300 focus:outline-none transition-colors p-1"
                                        style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 20 }}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 px-1">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        className="!border-white/30 data-[state=checked]:!bg-blue-500 data-[state=checked]:!border-blue-500"
                                        checked={formData.rememberMe}
                                        onCheckedChange={(checked: boolean) =>
                                            setFormData({ ...formData, rememberMe: checked })
                                        }
                                    />
                                    <label
                                        htmlFor="remember"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !text-blue-200/80 cursor-pointer"
                                    >
                                        记住我
                                    </label>
                                </div>
                                <a
                                    href="#"
                                    onClick={handleForgotPassword}
                                    className="text-sm font-medium !text-blue-400 hover:!text-blue-300 transition-colors"
                                >
                                    忘记密码？
                                </a>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 !bg-white !text-slate-900 hover:!bg-blue-50 font-semibold shadow-lg shadow-white/5 transition-all duration-200 hover:-translate-y-0.5 mt-4 text-base"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin mr-2" />
                                        登录中...
                                    </div>
                                ) : (
                                    "登 录"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <p className="text-xs text-blue-200/30 font-mono">
                        © 2025 limix. All rights reserved.
                    </p>
                </div>
            </div>


        </div>
    );
}
