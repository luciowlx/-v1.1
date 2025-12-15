import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

type Mode = "create" | "edit";

interface Props {
  open: boolean;
  mode: Mode;
  initialEmail?: string;
  initialPhone?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { email: string; phone: string; password?: string }) => void;
  extra?: React.ReactNode;
}

export default function UserFormDialog({ open, mode, initialEmail = "", initialPhone = "", onOpenChange, onSubmit, extra }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePassword, setChangePassword] = useState(mode === "create");

  const [errors, setErrors] = useState<{ email?: string; phone?: string; password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    if (open) {
      setEmail(initialEmail);
      setPhone(initialPhone);
      setPassword("");
      setConfirmPassword("");
      setChangePassword(mode === "create");
      setErrors({});
    }
  }, [open, initialEmail, initialPhone, mode]);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
  const phoneValid = useMemo(() => /^1[3-9]\d{9}$/.test(phone), [phone]);

  const strength = useMemo(() => {
    const s = password;
    let score = 0;
    if (s.length >= 8) score++;
    if (/[A-Z]/.test(s)) score++;
    if (/[a-z]/.test(s)) score++;
    if (/[0-9]/.test(s)) score++;
    if (/[^A-Za-z0-9]/.test(s)) score++;
    return Math.min(score, 4);
  }, [password]);

  const strengthLabel = ["弱", "一般", "中", "强"][Math.max(0, strength - 1)] || (password ? "弱" : "");

  const validate = () => {
    const next: typeof errors = {};
    if (!emailValid) next.email = "邮箱格式不正确";
    if (!phoneValid) next.phone = "手机号格式不正确";
    if (changePassword) {
      if (!password) next.password = "请输入密码";
      if (password && password.length < 8) next.password = "密码至少8位";
      if (password && confirmPassword && password !== confirmPassword) next.confirmPassword = "两次密码不一致";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload: { email: string; phone: string; password?: string } = { email, phone };
    if (changePassword) payload.password = password;
    onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "创建用户" : "编辑用户"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {extra}
          <div>
            <Label htmlFor="email">邮箱 <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }}
              aria-invalid={!!errors.email}
              aria-describedby="email-error"
              placeholder="name@company.com"
            />
            {!!errors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">手机号 <span className="text-red-500">*</span></Label>
            <Input
              id="phone"
              inputMode="numeric"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors({ ...errors, phone: undefined }); }}
              aria-invalid={!!errors.phone}
              aria-describedby="phone-error"
              placeholder="13800138000"
            />
            {!!errors.phone && (
              <p id="phone-error" className="mt-1 text-xs text-red-600">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            {mode === "edit" && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={changePassword} onChange={(e) => setChangePassword(e.target.checked)} />
                <span>修改密码</span>
              </label>
            )}

            {changePassword && (
              <>
                <div>
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }}
                    aria-invalid={!!errors.password}
                    aria-describedby="password-error"
                    placeholder="至少8位，含大小写、数字或符号"
                  />
                  {!!errors.password && (
                    <p id="password-error" className="mt-1 text-xs text-red-600">{errors.password}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 w-32 bg-gray-200 rounded">
                      <div className={`h-2 rounded ${strength >= 3 ? "bg-green-600" : strength === 2 ? "bg-yellow-500" : strength === 1 ? "bg-orange-500" : "bg-gray-300"}`} style={{ width: `${Math.min(100, strength * 25)}%` }} />
                    </div>
                    {password && <Badge variant="outline">{strengthLabel}</Badge>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">确认密码</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined }); }}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby="confirm-error"
                    placeholder="再次输入密码"
                  />
                  {!!errors.confirmPassword && (
                    <p id="confirm-error" className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button onClick={handleSubmit}>提交</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
