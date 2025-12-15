import { useMemo, useState } from "react";
import type { User } from "../types/user";
import { registeredUsers } from "../mock/users";
import { searchUsers, addProjectMembers, removeProjectMember, getUsersByIds } from "../services/projectMembers";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Search, UserPlus, X } from "lucide-react";

interface TeamMemberSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[], users?: User[]) => void;
  projectId?: string; // 传入则在编辑模式下调用统一 API 同步变更
  currentUserRole?: string; // 用于权限过滤，默认项目经理
}

export default function TeamMemberSelector({ selectedIds, onChange, projectId, currentUserRole = "项目经理" }: TeamMemberSelectorProps) {
  const [query, setQuery] = useState("");
  const [pendingSelect, setPendingSelect] = useState<string[]>([]);

  const selectedUsers = useMemo(() => getUsersByIds(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    const excludeSelected = (u: User) => !selectedIds.includes(u.id);
    if (!query) return registeredUsers.filter(excludeSelected);
    return searchUsers(query, currentUserRole).filter(excludeSelected);
  }, [query, currentUserRole, selectedIds]);

  const togglePending = (id: string) => {
    setPendingSelect(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBatchAdd = async () => {
    if (pendingSelect.length === 0) return;
    const newIds = Array.from(new Set([...selectedIds, ...pendingSelect]));
    const newUsers = getUsersByIds(newIds);
    if (projectId) {
      await addProjectMembers(projectId, pendingSelect);
    }
    onChange(newIds, newUsers);
    setPendingSelect([]);
  };

  const handleRemove = async (id: string) => {
    const remainIds = selectedIds.filter(x => x !== id);
    const remainUsers = getUsersByIds(remainIds);
    if (projectId) {
      await removeProjectMember(projectId, id);
    }
    onChange(remainIds, remainUsers);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">团队成员</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="按用户名/邮箱搜索用户"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[48px]">选择</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>部门</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-gray-500">未找到匹配的用户</TableCell>
              </TableRow>
            ) : (
              filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <input type="checkbox" checked={pendingSelect.includes(u.id)} onChange={() => togglePending(u.id)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback>{u.realName?.[0] || u.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">{u.realName} <Badge variant="secondary" className="ml-1">{u.username}</Badge></div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{u.department}</TableCell>
                  <TableCell className="text-sm">{u.role}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={async () => {
                      const newIds = Array.from(new Set([...selectedIds, u.id]));
                      if (projectId) await addProjectMembers(projectId, [u.id]);
                      onChange(newIds, getUsersByIds(newIds));
                    }}>
                      <UserPlus className="h-4 w-4 mr-1" /> 添加
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600">已选：{selectedIds.length} 人</div>
        <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={handleBatchAdd} disabled={pendingSelect.length === 0}>
          <UserPlus className="h-4 w-4 mr-1" /> 批量添加所选
        </Button>
      </div>

      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-600">已添加成员：</div>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map(u => (
              <div key={u.id} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm">
                <span>{u.realName}（{u.department}·{u.role}）</span>
                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => handleRemove(u.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}