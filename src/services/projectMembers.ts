import type { User } from "../types/user";
import { registeredUsers } from "../mock/users";
import { toast } from "sonner";

// 权限控制：示例规则
export type CurrentUserRole = "超级管理员" | "项目经理" | "普通用户" | string;

export const canManageUser = (currentRole: CurrentUserRole, user: User) => {
  if (currentRole === "超级管理员") return true;
  // 项目经理可以管理除“超级管理员”和“锁定”外的用户
  if (currentRole === "项目经理") return user.role !== "超级管理员" && user.status !== "locked";
  // 其它角色仅可管理“active”普通成员
  return user.status === "active" && user.role !== "超级管理员";
};

export const searchUsers = (query: string, currentRole: CurrentUserRole, extraFilter?: (user: User) => boolean): User[] => {
  const q = (query || "").toLowerCase();
  return registeredUsers
    .filter(u => canManageUser(currentRole, u))
    .filter(u => !extraFilter || extraFilter(u))
    .filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.realName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
};

export const getUsersByIds = (ids: string[]): User[] => {
  const set = new Set(ids);
  return registeredUsers.filter(u => set.has(u.id));
};

// 统一的成员变更 API（模拟与即时反馈）
export const addProjectMembers = async (projectId: string, userIds: string[]) => {
  // TODO: 替换为真实后端 API 调用
  toast.success(`已添加 ${userIds.length} 名成员到项目 ${projectId}`);
  return { ok: true };
};

export const removeProjectMember = async (projectId: string, userId: string) => {
  // TODO: 替换为真实后端 API 调用
  const user = registeredUsers.find(u => u.id === userId);
  toast.success(`已从项目 ${projectId} 移除成员：${user?.realName || userId}`);
  return { ok: true };
};

export const replaceProjectMembers = async (projectId: string, userIds: string[]) => {
  // TODO: 替换为真实后端 API 调用
  toast.success(`项目 ${projectId} 成员已更新，共 ${userIds.length} 人`);
  return { ok: true };
};