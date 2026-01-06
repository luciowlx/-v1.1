import { useMemo, useState } from "react";
import { Modal, message } from "antd";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Switch } from "./ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Plus, Edit, Trash2, Shield, Users, Settings, Search, Eye, UserPlus, Mail, Lock, ToggleLeft, ToggleRight } from "lucide-react";
import type { User } from "../types/user";
import { registeredUsers } from "../mock/users";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  status: "active" | "inactive";
  createdAt: string;
  isDefault?: boolean;
}

// 三层权限结构：一级菜单 -> 二级菜单 -> 三级按钮
interface ActionItem { id: string; name: string; }
interface SubModule { id: string; name: string; actions: ActionItem[]; }
interface PermissionGroup { id: string; name: string; submodules: SubModule[]; }

const permissionTree: PermissionGroup[] = [
  {
    id: "dashboard",
    name: "首页/统计",
    submodules: [
      { id: "dashboard_overview", name: "查看全局统计系统总览", actions: [{ id: "dashboard_view", name: "查看统计" }] },
      {
        id: "dashboard_quick",
        name: "快速操作",
        actions: [
          { id: "quick_project_create", name: "创建新项目" },
          { id: "quick_data_upload", name: "上传数据" },
          { id: "quick_task_create", name: "创建任务" }
        ]
      }
    ]
  },
  {
    id: "project_mgmt",
    name: "项目管理",
    submodules: [
      {
        id: "project_basic",
        name: "项目管理",
        actions: [
          { id: "project_create", name: "创建项目" },
          { id: "project_view", name: "查看详情" },
          { id: "project_edit", name: "编辑项目" },
          { id: "project_config", name: "配置项目" }
        ]
      }
    ]
  },
  {
    id: "data_mgmt",
    name: "数据管理",
    submodules: [
      {
        id: "dataset_basic",
        name: "数据集管理",
        actions: [
          { id: "data_upload", name: "上传数据集" },
          { id: "data_edit", name: "编辑数据集" },
          { id: "data_copy", name: "复制数据集" },
          { id: "data_delete", name: "删除数据集" },
          { id: "data_detail", name: "查看数据集详情" },
          { id: "data_archive", name: "归档" },
          { id: "data_download", name: "下载数据集" },
          { id: "data_history", name: "历史版本" }
        ]
      },
      {
        id: "preprocess_task",
        name: "数据预处理",
        actions: [
          { id: "preprocess_view", name: "查看任务" },
          { id: "preprocess_edit", name: "编辑" },
          { id: "preprocess_delete", name: "删除" },
          { id: "preprocess_start", name: "开始执行" },
          { id: "preprocess_stop", name: "停止" },
          { id: "preprocess_retry", name: "重试" }
        ]
      }
    ]
  },
  {
    id: "task_mgmt",
    name: "任务管理",
    submodules: [
      {
        id: "task_basic",
        name: "任务管理",
        actions: [
          { id: "task_create", name: "创建任务" },
          { id: "task_detail", name: "详情" },
          { id: "task_start", name: "开始任务" },
          { id: "task_rerun", name: "重新运行" },
          { id: "task_stop", name: "停止" },
          { id: "task_edit", name: "编辑" },
          { id: "task_export", name: "导出" },
          { id: "task_archive", name: "归档" }
        ]
      }
    ]
  },
  {
    id: "assistant",
    name: "智能助手",
    submodules: [
      { id: "assistant_chat", name: "多轮对话", actions: [{ id: "assistant_access", name: "访问助手" }] }
    ]
  },
  {
    id: "system",
    name: "系统管理",
    submodules: [
      {
        id: "system_users",
        name: "部门与用户管理",
        actions: [
          { id: "system_users_view", name: "查看" },
          { id: "system_users_edit", name: "编辑" }
        ]
      },
      {
        id: "system_roles",
        name: "角色管理",
        actions: [
          { id: "system_roles_view", name: "查看" },
          { id: "system_roles_edit", name: "编辑" }
        ]
      },
      {
        id: "system_task_types",
        name: "任务类型管理",
        actions: [
          { id: "system_task_types_view", name: "查看" },
          { id: "system_task_types_edit", name: "编辑" }
        ]
      },
      { id: "system_personal_center", name: "个人中心", actions: [{ id: "system_personal_view", name: "查看" }] },
      { id: "system_personal_settings", name: "个性化设置", actions: [{ id: "system_personal_settings_edit", name: "编辑" }] }
    ]
  }
];

const allPermissions: Permission[] = [
  { id: "project_view", name: "查看项目", description: "可以查看项目列表和详情", module: "项目管理" },
  { id: "project_create", name: "创建项目", description: "可以创建新项目", module: "项目管理" },
  { id: "project_edit", name: "编辑项目", description: "可以编辑项目信息", module: "项目管理" },
  { id: "project_delete", name: "删除项目", description: "可以删除项目", module: "项目管理" },
  { id: "data_view", name: "查看数据", description: "可以查看数据集", module: "数据管理" },
  { id: "data_upload", name: "上传数据", description: "可以上传数据集", module: "数据管理" },
  { id: "data_edit", name: "编辑数据", description: "可以编辑数据集", module: "数据管理" },
  { id: "data_delete", name: "删除数据", description: "可以删除数据集", module: "数据管理" },
  { id: "task_view", name: "查看任务", description: "可以查看任务列表", module: "任务管理" },
  { id: "task_create", name: "创建任务", description: "可以创建新任务", module: "任务管理" },
  { id: "task_edit", name: "编辑任务", description: "可以编辑任务", module: "任务管理" },
  { id: "task_delete", name: "删除任务", description: "可以删除任务", module: "任务管理" },
  { id: "model_view", name: "查看模型", description: "可以查看模型列表", module: "模型管理" },
  { id: "model_train", name: "训练模型", description: "可以训练和微调模型", module: "模型管理" },
  { id: "model_deploy", name: "部署模型", description: "可以部署模型", module: "模型管理" },
  { id: "config_view", name: "查看配置", description: "可以查看系统配置项", module: "配置管理" },
  { id: "config_create", name: "创建配置", description: "可以创建新的配置项", module: "配置管理" },
  { id: "config_edit", name: "编辑配置", description: "可以编辑配置项", module: "配置管理" },
  { id: "config_delete", name: "删除配置", description: "可以删除配置项", module: "配置管理" },
  { id: "config_template_export", name: "导出配置模板", description: "可以导出配置项为模板", module: "配置管理" },
  { id: "config_template_import", name: "导入配置模板", description: "可以从模板导入配置项", module: "配置管理" },
  { id: "config_category_view", name: "查看配置分类", description: "可以查看配置分类列表", module: "配置管理" },
  { id: "config_category_create", name: "创建配置分类", description: "可以创建新的配置分类", module: "配置管理" },
  { id: "config_category_edit", name: "编辑配置分类", description: "可以编辑配置分类信息", module: "配置管理" },
  { id: "config_category_delete", name: "删除配置分类", description: "可以删除配置分类", module: "配置管理" },
  { id: "system_manage", name: "系统管理", description: "可以管理系统设置", module: "系统管理" }
];

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: "default-role-001",
      name: "默认角色",
      description: "企业版全功能权限默认角色",
      permissions: allPermissions.map(p => p.id),
      userCount: 0,
      status: "active",
      createdAt: "2024-01-01",
      isDefault: true
    },
    {
      id: "1",
      name: "超级管理员",
      description: "拥有系统所有权限",
      permissions: allPermissions.map(p => p.id),
      userCount: 0,
      status: "active",
      createdAt: "2024-01-01"
    },
    {
      id: "2",
      name: "项目经理",
      description: "负责项目管理相关工作",
      permissions: ["project_view", "project_create", "project_edit", "task_view", "task_create", "task_edit"],
      userCount: 0,
      status: "active",
      createdAt: "2024-01-02"
    },
    {
      id: "3",
      name: "数据分析师",
      description: "负责数据分析和模型训练",
      permissions: ["data_view", "data_upload", "data_edit", "model_view", "model_train"],
      userCount: 0,
      status: "active",
      createdAt: "2024-01-03"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [isUserListDialogOpen, setIsUserListDialogOpen] = useState(false);
  const [userListRole, setUserListRole] = useState<Role | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<User[]>(registeredUsers);
  const [isAssignUserDialogOpen, setIsAssignUserDialogOpen] = useState(false);
  const [assignUserRole, setAssignUserRole] = useState<Role | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [assignUserSearch, setAssignUserSearch] = useState("");
  const [assignUserPage, setAssignUserPage] = useState(1);
  const ASSIGN_USER_PAGE_SIZE = 10;

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[]
  });

  // 模拟当前登录身份（仅用于原型演示权限控制）
  const [simulatedRole, setSimulatedRole] = useState<"超级管理员" | "普通用户">("超级管理员");

  const operationLogs = [
    {
      id: "1",
      action: "创建角色",
      target: "数据分析师",
      operator: "admin",
      timestamp: "2024-01-03 10:30:00",
      details: "创建了数据分析师角色，分配了数据管理和模型训练权限"
    },
    {
      id: "2",
      action: "编辑角色",
      target: "项目经理",
      operator: "admin",
      timestamp: "2024-01-02 15:20:00",
      details: "修改了项目经理角色的权限配置"
    }
  ];

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * 获取指定角色的用户列表（从 mock 数据中过滤）
   * @param roleName 角色名称
   * @returns 该角色下的用户数组
   */
  const getUsersByRole = (roleName: string): User[] => {
    return users.filter(u => u.role === roleName);
  };

  /**
   * 计算角色的用户数量（动态与列表一致）
   * @param roleName 角色名称
   * @returns 用户数量
   */
  const getUserCount = (roleName: string): number => {
    return getUsersByRole(roleName).length;
  };

  const handleCreateRole = () => {
    if (newRole.name.trim()) {
      const role: Role = {
        id: Date.now().toString(),
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
        userCount: 0,
        status: "active",
        createdAt: new Date().toISOString().split('T')[0]
      };
      setRoles([...roles, role]);
      setNewRole({ name: "", description: "", permissions: [] });
      setIsCreateDialogOpen(false);
    }
  };

  const handleEditRole = () => {
    if (currentRole && newRole.name.trim()) {
      setRoles(roles.map(role =>
        role.id === currentRole.id
          ? { ...role, name: newRole.name, description: newRole.description, permissions: newRole.permissions }
          : role
      ));
      setIsEditDialogOpen(false);
      setCurrentRole(null);
      setNewRole({ name: "", description: "", permissions: [] });
    }
  };

  /**
   * 删除角色
   * 当角色下存在用户，或角色是启用状态时无法删除，显示警告提示；
   * 否则，弹出二次确认框，确认后删除。
   * @param roleId 角色ID
   */
  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const userCount = getUserCount(role.name);
    // 检查是否有关联用户或处于启用状态
    if (userCount > 0 || role.status === "active") {
      Modal.warning({
        title: "无法删除",
        content: "无法删除：该角色尚有关联用户或处于启用状态",
        okText: "确定",
      });
      return;
    }

    // 二次确认删除
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除角色 "${role.name}" 吗？此操作不可撤销。`,
      okText: "确定",
      cancelText: "取消",
      centered: true,
      onOk: () => {
        setRoles(roles.filter(r => r.id !== roleId));
        message.success("角色删除成功");
      },
      okButtonProps: { danger: true },
    });
  };

  /**
   * 切换角色状态（启用/禁用）
   * @param roleId 角色ID
   * @param enabled 是否启用
   */
  const handleToggleRoleStatus = (roleId: string, enabled: boolean) => {
    const role = roles.find(r => r.id === roleId);
    if (!role || role.isDefault) return; // Prevent updating default role
    setRoles(roles.map(role => role.id === roleId ? { ...role, status: enabled ? "active" : "inactive" } : role));
  };

  const handleBatchStatusUpdate = (status: "active" | "inactive") => {
    setRoles(roles.map(role => {
      if (selectedRoles.includes(role.id) && !role.isDefault) {
        return { ...role, status };
      }
      return role;
    }));
    setSelectedRoles([]);
  };

  const openEditDialog = (role: Role) => {
    setCurrentRole(role);
    setNewRole({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
    setIsEditDialogOpen(true);
  };

  const openPermissionDialog = (role: Role) => {
    setCurrentRole(role);
    setNewRole({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
    setIsPermissionDialogOpen(true);
  };

  /**
   * 打开用户列表对话框
   * @param role 角色对象
   */
  const openUserListDialog = (role: Role) => {
    setUserListRole(role);
    setUserSearch("");
    setIsUserListDialogOpen(true);
  };

  const openAssignUserDialog = (role: Role) => {
    setAssignUserRole(role);
    setAssignUserSearch("");
    setAssignUserPage(1); // Reset page on open
    // Initialize selected users based on current role
    const currentUsers = users.filter(u => u.role === role.name).map(u => u.id);
    setSelectedUserIds(currentUsers);
    setIsAssignUserDialogOpen(true);
  };

  const handleAssignUsers = () => {
    if (assignUserRole) {
      setUsers(users.map(user => {
        // If user is selected, assign the role
        if (selectedUserIds.includes(user.id)) {
          return { ...user, role: assignUserRole.name };
        }
        // If user was previously in this role but now deselected, revert to "普通用户" (or handle as needed)
        // Note: This logic assumes a user can only have one role.
        if (user.role === assignUserRole.name && !selectedUserIds.includes(user.id)) {
          return { ...user, role: "普通用户" };
        }
        return user;
      }));
      setIsAssignUserDialogOpen(false);
      setAssignUserRole(null);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setNewRole(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionId]
      }));
    } else {
      setNewRole(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => id !== permissionId)
      }));
    }
  };

  const savePermissions = () => {
    if (currentRole) {
      setRoles(roles.map(role =>
        role.id === currentRole.id
          ? { ...role, permissions: newRole.permissions }
          : role
      ));
      setIsPermissionDialogOpen(false);
      setCurrentRole(null);
    }
  };

  // 辅助：从三级动作扁平化出ID集合
  const flattenGroupActionIds = (group: PermissionGroup) => group.submodules.flatMap(sm => sm.actions.map(a => a.id));
  const flattenSubActionIds = (sub: SubModule) => sub.actions.map(a => a.id);

  const isActionChecked = (id: string) => newRole.permissions.includes(id);
  const isSubChecked = (sub: SubModule) => sub.actions.every(a => isActionChecked(a.id));
  const isGroupChecked = (group: PermissionGroup) => group.submodules.every(isSubChecked);

  const toggleAction = (id: string, checked: boolean) => {
    setNewRole(prev => ({
      ...prev,
      permissions: checked ? [...prev.permissions, id] : prev.permissions.filter(pid => pid !== id)
    }));
  };

  const toggleSub = (sub: SubModule, checked: boolean) => {
    const ids = flattenSubActionIds(sub);
    setNewRole(prev => ({
      ...prev,
      permissions: checked
        ? Array.from(new Set([...prev.permissions, ...ids]))
        : prev.permissions.filter(pid => !ids.includes(pid))
    }));
  };

  const toggleGroup = (group: PermissionGroup, checked: boolean) => {
    const ids = flattenGroupActionIds(group);
    setNewRole(prev => ({
      ...prev,
      permissions: checked
        ? Array.from(new Set([...prev.permissions, ...ids]))
        : prev.permissions.filter(pid => !ids.includes(pid))
    }));
  };

  // UI：权限弹窗左侧菜单选择状态
  const [selectedPermissionGroupId, setSelectedPermissionGroupId] = useState<string>(permissionTree[0]?.id ?? "");
  const getGroupById = (id: string) => permissionTree.find(g => g.id === id) || permissionTree[0];
  const selectedGroup = getGroupById(selectedPermissionGroupId);
  const groupActionIds = (group: PermissionGroup) => group.submodules.flatMap(sm => sm.actions.map(a => a.id));
  const countSelectedInGroup = (group: PermissionGroup) => groupActionIds(group).filter(id => newRole.permissions.includes(id)).length;
  const totalActionsInGroup = (group: PermissionGroup) => groupActionIds(group).length;

  const getPermissionsByModule = () => {
    const modules: { [key: string]: Permission[] } = {};
    allPermissions.forEach(permission => {
      if (!modules[permission.module]) {
        modules[permission.module] = [];
      }
      modules[permission.module].push(permission);
    });
    return modules;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">角色管理</h2>
          <p className="text-gray-600 mt-1">管理系统角色和权限配置</p>
        </div>
        <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-amber-800 font-medium">
            <Lock className="w-4 h-4" />
            演示身份切换：
          </div>
          <RadioGroup
            defaultValue="超级管理员"
            className="flex gap-4"
            onValueChange={(val: any) => {
              setSimulatedRole(val);
              message.info(`已切换至 ${val} 视图`);
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="超级管理员" id="sim-admin" />
              <Label htmlFor="sim-admin" className="cursor-pointer">后台超级管理员</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="普通用户" id="sim-user" />
              <Label htmlFor="sim-user" className="cursor-pointer">系统用户</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex gap-3">
          {selectedRoles.length > 0 && (
            <>
              <Button variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleBatchStatusUpdate("active")}>
                <ToggleRight className="w-4 h-4 mr-2" />
                批量启用 ({selectedRoles.length})
              </Button>
              <Button variant="outline" className="text-gray-600 hover:text-gray-700 hover:bg-gray-50" onClick={() => handleBatchStatusUpdate("inactive")}>
                <ToggleLeft className="w-4 h-4 mr-2" />
                批量禁用 ({selectedRoles.length})
              </Button>
            </>
          )}

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新建角色
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新建角色</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">角色名称</Label>
                  <Input
                    id="name"
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="请输入角色名称"
                  />
                </div>
                <div>
                  <Label htmlFor="description">角色描述</Label>
                  <Textarea
                    id="description"
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="请输入角色描述"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateRole}>
                    确定
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索角色名称或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            角色列表
            <Badge variant="secondary">{filteredRoles.length} 个角色</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRoles.length === filteredRoles.length && filteredRoles.length > 0}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setSelectedRoles(filteredRoles.map(role => role.id));
                      } else {
                        setSelectedRoles([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>角色名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>权限数量</TableHead>
                <TableHead>用户数量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRoles.includes(role.id)}
                      disabled={role.isDefault}
                      onCheckedChange={(checked: boolean) => {
                        if (role.isDefault) return; // Cannot select default role for deletion
                        if (checked) {
                          setSelectedRoles([...selectedRoles, role.id]);
                        } else {
                          setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.name}</span>
                        {role.isDefault && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 gap-1">
                            <Lock className="w-3 h-3" />
                            系统内置
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{role.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{role.permissions.length} 个权限</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="link" className="px-0" onClick={() => openUserListDialog(role)}>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        {getUserCount(role.name)}
                      </div>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {role.isDefault ? (
                        <div className="flex items-center gap-2 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          <span>长期生效</span>
                        </div>
                      ) : (
                        <>
                          <Switch
                            checked={role.status === "active"}
                            onCheckedChange={(checked: boolean) => handleToggleRoleStatus(role.id, checked)}
                            aria-label={`切换角色 ${role.name} 状态`}
                          />
                          <span className="text-sm text-gray-600">{role.status === "active" ? "启用" : "禁用"}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{role.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {/* 操作按钮：
                           1. 非默认角色：显示编辑、配置、删除
                           2. 默认角色：仅当模拟身份为超级管理员时，显示配置图标
                       */}
                      {!role.isDefault ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(role)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPermissionDialog(role)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={role.isDefault}
                            onClick={() => handleDeleteRole(role.id)}
                            title={role.isDefault ? "默认角色无法删除" : "删除角色"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        // 默认角色的特殊逻辑
                        simulatedRole === "超级管理员" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPermissionDialog(role)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            title="配置默认角色权限"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        )
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAssignUserDialog(role)}
                        title="分配用户"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">角色名称</Label>
              <Input
                id="edit-name"
                value={newRole.name}
                onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入角色名称"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">角色描述</Label>
              <Textarea
                id="edit-description"
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入角色描述"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleEditRole}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-5xl p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>权限配置 - {currentRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-[240px_1fr] gap-0 h-[70vh]">
            {/* 左侧：一级菜单导航列表 */}
            <div className="border-r">
              <ScrollArea className="h-[70vh] px-2 py-3">
                <div className="space-y-1">
                  {permissionTree.map((group) => {
                    const selectedCount = countSelectedInGroup(group);
                    const total = totalActionsInGroup(group);
                    const active = selectedPermissionGroupId === group.id;
                    return (
                      <div
                        key={group.id}
                        className={`flex items-center justify-between rounded-md px-3 py-2 cursor-pointer ${active ? "bg-muted" : "hover:bg-muted"}`}
                        onClick={() => setSelectedPermissionGroupId(group.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isGroupChecked(group)}
                            onCheckedChange={(checked: boolean) => toggleGroup(group, checked)}
                            aria-label={`全选 ${group.name}`}
                          />
                          <span className="text-sm font-medium">{group.name}</span>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {selectedCount}/{total}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* 右侧：二级菜单 + 三级按钮 */}
            <div className="h-[70vh] overflow-y-auto px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-semibold">{selectedGroup.name}</h4>
                  <Badge variant="outline">{countSelectedInGroup(selectedGroup)}/{totalActionsInGroup(selectedGroup)}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isGroupChecked(selectedGroup)}
                    onCheckedChange={(checked: boolean) => toggleGroup(selectedGroup, checked)}
                    aria-label="当前菜单全选"
                  />
                  <span className="text-sm text-gray-600">当前菜单全选</span>
                </div>
              </div>
              <Separator className="mb-4" />
              <div className="space-y-4">
                {selectedGroup.submodules.map((sub) => (
                  <div key={sub.id} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSubChecked(sub)}
                        onCheckedChange={(checked: boolean) => toggleSub(sub, checked)}
                      />
                      <Label className="font-medium">{sub.name}</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {sub.actions.map((action) => (
                        <div key={action.id} className="flex items-center gap-3 p-2 border rounded-md">
                          <Checkbox
                            checked={isActionChecked(action.id)}
                            onCheckedChange={(checked: boolean) => toggleAction(action.id, checked)}
                          />
                          <Label className="cursor-pointer">{action.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-4 mt-6 border-t">
                <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={savePermissions}>
                  保存权限
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>操作日志</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>操作</TableHead>
                  <TableHead>目标</TableHead>
                  <TableHead>操作人</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>详情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operationLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.target}</TableCell>
                    <TableCell>{log.operator}</TableCell>
                    <TableCell className="text-gray-600">{log.timestamp}</TableCell>
                    <TableCell className="text-sm text-gray-600">{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 角色用户列表对话框 */}
      <Dialog open={isUserListDialogOpen} onOpenChange={setIsUserListDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {userListRole ? `用户列表 - ${userListRole.name}` : "用户列表"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索姓名、用户名、邮箱..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>用户名</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {useMemo(() => {
                  const list = userListRole ? getUsersByRole(userListRole.name) : [];
                  const filtered = list.filter(u =>
                    u.realName.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearch.toLowerCase())
                  );
                  return filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.realName}</TableCell>
                      <TableCell className="text-gray-600">@{u.username}</TableCell>
                      <TableCell>{u.department}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.status === "active" ? "default" : u.status === "inactive" ? "secondary" : "outline"}>
                          {u.status === "active" ? "正常" : u.status === "inactive" ? "停用" : "锁定"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ));
                }, [userListRole, userSearch])}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 分配用户对话框 */}
      <Dialog open={isAssignUserDialogOpen} onOpenChange={setIsAssignUserDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {assignUserRole ? `分配用户 - ${assignUserRole.name}` : "分配用户"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索用户名、手机号、邮箱"
                value={assignUserSearch}
                onChange={(e) => {
                  setAssignUserSearch(e.target.value);
                  setAssignUserPage(1); // Reset page on search
                }}
                className="pl-10"
              />
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">选择</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>手机号</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>当前角色</TableHead>
                    <TableHead>部门</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const filteredUsers = users.filter((u) =>
                      u.realName.toLowerCase().includes(assignUserSearch.toLowerCase()) ||
                      u.username.toLowerCase().includes(assignUserSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(assignUserSearch.toLowerCase())
                    );

                    const totalPages = Math.ceil(filteredUsers.length / ASSIGN_USER_PAGE_SIZE);
                    const paginatedUsers = filteredUsers.slice(
                      (assignUserPage - 1) * ASSIGN_USER_PAGE_SIZE,
                      assignUserPage * ASSIGN_USER_PAGE_SIZE
                    );

                    return (
                      <>
                        {paginatedUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUserIds.includes(u.id)}
                                onCheckedChange={(checked: boolean) => {
                                  if (checked) {
                                    setSelectedUserIds([...selectedUserIds, u.id]);
                                  } else {
                                    setSelectedUserIds(selectedUserIds.filter((id) => id !== u.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{u.username}</TableCell>
                            <TableCell className="text-gray-600">{u.phone}</TableCell>
                            <TableCell className="text-gray-600">{u.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{u.role}</Badge>
                            </TableCell>
                            <TableCell>{u.department}</TableCell>
                          </TableRow>
                        ))}
                        {totalPages > 1 && (
                          <TableRow>
                            <TableCell colSpan={6}>
                              <div className="flex justify-center py-4">
                                <Pagination>
                                  <PaginationContent>
                                    <PaginationItem>
                                      <PaginationPrevious
                                        onClick={() => setAssignUserPage(p => Math.max(1, p - 1))}
                                        className={assignUserPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        size="default"
                                      />
                                    </PaginationItem>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                      <PaginationItem key={page}>
                                        <PaginationLink
                                          isActive={assignUserPage === page}
                                          onClick={() => setAssignUserPage(page)}
                                          size="icon"
                                        >
                                          {page}
                                        </PaginationLink>
                                      </PaginationItem>
                                    ))}

                                    <PaginationItem>
                                      <PaginationNext
                                        onClick={() => setAssignUserPage(p => Math.min(totalPages, p + 1))}
                                        className={assignUserPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        size="default"
                                      />
                                    </PaginationItem>
                                  </PaginationContent>
                                </Pagination>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })()}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAssignUserDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAssignUsers}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div >
  );
}