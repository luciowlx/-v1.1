import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Switch } from "./ui/switch";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "./ui/pagination";
import { Skeleton } from "./ui/skeleton";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Building2, 
  MoreHorizontal,
  Search,
  Filter,
  UserPlus,
  ArrowUpDown,
  FolderPlus,
  Move,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  ChevronRight
} from "lucide-react";

// 用户接口定义
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  position: string;
  departmentId: string;
  status: "active" | "inactive";
  joinDate: string;
}

// 部门接口定义
interface Department {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  manager: string;
  memberCount: number;
  status: "active" | "inactive";
  createdAt: string;
  children?: Department[];
}

export function DepartmentManagement() {
  // Tabs: 切换查看 部门列表 / 用户列表
  const [activeTab, setActiveTab] = useState<'department' | 'user'>('department');
  // 视图独立筛选与分页状态
  const [deptSearch, setDeptSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [deptStatusFilter, setDeptStatusFilter] = useState<'all' | 'active' | 'inactive'>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>("all");
  const [deptPage, setDeptPage] = useState(1);
  const [deptPageSize] = useState(10);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize] = useState(10);
  // 部门数据
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: "1",
      name: "华特迪士尼公司",
      description: "总公司",
      manager: "张三",
      memberCount: 50,
      status: "active",
      createdAt: "2024-01-15",
      children: [
        {
          id: "1-1",
          name: "董事会",
          description: "公司董事会",
          parentId: "1",
          manager: "李四",
          memberCount: 8,
          status: "active",
          createdAt: "2024-01-16"
        },
        {
          id: "1-2",
          name: "技术部",
          description: "负责技术开发",
          parentId: "1",
          manager: "王五",
          memberCount: 25,
          status: "active",
          createdAt: "2024-01-17",
          children: [
            {
              id: "1-2-1",
              name: "前端部门",
              description: "前端开发团队",
              parentId: "1-2",
              manager: "赵六",
              memberCount: 12,
              status: "active",
              createdAt: "2024-01-18"
            },
            {
              id: "1-2-2",
              name: "后端部门",
              description: "后端开发团队",
              parentId: "1-2",
              manager: "钱七",
              memberCount: 13,
              status: "active",
              createdAt: "2024-01-19"
            }
          ]
        }
      ]
    }
  ]);

  // 用户数据
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "张三",
      email: "zhangsan@company.com",
      phone: "13800138001",
      position: "总经理",
      departmentId: "1",
      status: "active",
      joinDate: "2024-01-01"
    },
    {
      id: "2",
      name: "李四",
      email: "lisi@company.com",
      phone: "13800138002",
      position: "董事长",
      departmentId: "1-1",
      status: "active",
      joinDate: "2024-01-02"
    },
    {
      id: "3",
      name: "王五",
      email: "wangwu@company.com",
      phone: "13800138003",
      position: "技术总监",
      departmentId: "1-2",
      status: "active",
      joinDate: "2024-01-03"
    }
  ]);

  // 对话框状态
  const [isCreateDeptDialogOpen, setIsCreateDeptDialogOpen] = useState(false);
  const [isEditDeptDialogOpen, setIsEditDeptDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isUserDetailDialogOpen, setIsUserDetailDialogOpen] = useState(false);
  const [isDeptChangeDialogOpen, setIsDeptChangeDialogOpen] = useState(false);
  const [isAddSubDeptDialogOpen, setIsAddSubDeptDialogOpen] = useState(false);
  const [isMoveDeptDialogOpen, setIsMoveDeptDialogOpen] = useState(false);
  // 移动部门目标父级（空字符串表示设为顶级）
  const [moveTargetParentId, setMoveTargetParentId] = useState<string>("");
  // 删除部门二次确认
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>("");

  // 选中的数据
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [expandedDepts, setExpandedDepts] = useState<string[]>(["1"]);
  // 左右分栏联动与选中态
  const [selectedDeptId, setSelectedDeptId] = useState<string>("1");
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  // 懒加载模拟：记录加载中的部门与已加载的部门
  const [loadingDepts, setLoadingDepts] = useState<string[]>([]);
  const [lazyLoaded, setLazyLoaded] = useState<Record<string, boolean>>({});
  // 员工列表加载状态（分页/筛选时模拟网络加载）
  const [isUserLoading, setIsUserLoading] = useState<boolean>(false);

  // 保留旧搜索状态（向后兼容，后续以独立视图状态为主）
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // 表单数据
  const [deptFormData, setDeptFormData] = useState({
    name: "",
    description: "",
    parentId: "",
    manager: ""
  });

  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    departmentId: ""
  });

  // 部门操作函数
  /**
   * 创建部门
   * 功能：根据当前表单数据创建一个新的部门并插入到组织结构中
   * 参数：无（使用组件内部的 deptFormData 状态）
   * 返回：void（通过 setDepartments 更新状态）
   * 约束：部门名称为必填，其余字段均为可选；如未选择上级部门则作为根部门添加
   */
  const handleCreateDepartment = () => {
    // 校验：部门名称必填
    if (!deptFormData.name || !deptFormData.name.trim()) {
      alert("请输入部门名称");
      return;
    }
    const newDepartment: Department = {
      id: Date.now().toString(),
      name: deptFormData.name,
      description: deptFormData.description,
      parentId: deptFormData.parentId || undefined,
      manager: deptFormData.manager,
      memberCount: 0,
      status: "active",
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    if (deptFormData.parentId) {
      // 添加到父部门的children中
      const updateDepartments = (depts: Department[]): Department[] => {
        return depts.map(dept => {
          if (dept.id === deptFormData.parentId) {
            return {
              ...dept,
              children: [...(dept.children || []), newDepartment]
            };
          }
          if (dept.children) {
            return {
              ...dept,
              children: updateDepartments(dept.children)
            };
          }
          return dept;
        });
      };
      setDepartments(updateDepartments(departments));
    } else {
      setDepartments([...departments, newDepartment]);
    }
    
    setDeptFormData({ name: "", description: "", parentId: "", manager: "" });
    setIsCreateDeptDialogOpen(false);
  };

  /**
   * 编辑部门
   * 功能：将选中的部门更新为表单中的值
   * 参数：无（依赖 selectedDepartment 与 deptFormData）
   * 返回：void（更新 departments 状态）
   * 约束：部门名称为必填，其余字段可选；保持原有层级结构不变
   */
  const handleEditDepartment = () => {
    if (!selectedDepartment) return;
    if (!deptFormData.name || !deptFormData.name.trim()) {
      alert("请输入部门名称");
      return;
    }
    
    const updateDepartments = (depts: Department[]): Department[] => {
      return depts.map(dept => {
        if (dept.id === selectedDepartment.id) {
          return { ...dept, ...deptFormData };
        }
        if (dept.children) {
          return {
            ...dept,
            children: updateDepartments(dept.children)
          };
        }
        return dept;
      });
    };
    
    setDepartments(updateDepartments(departments));
    setDeptFormData({ name: "", description: "", parentId: "", manager: "" });
    setIsEditDeptDialogOpen(false);
    setSelectedDepartment(null);
  };

  // 查找部门
  const findDepartmentById = (depts: Department[], id: string): Department | null => {
    for (const d of depts) {
      if (d.id === id) return d;
      if (d.children) {
        const found = findDepartmentById(d.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleDeleteDepartment = (id: string) => {
    // 顶级部门不可删除（按钮已禁用，这里双重保护）
    const target = findDepartmentById(departments, id);
    if (!target || !target.parentId) return;
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
  };

  /**
   * 确认删除部门：删除该部门及其子部门；其所有员工（含子孙部门）归入一级部门
   */
  const confirmDeleteDepartment = () => {
    if (!deleteTargetId) return;
    const target = findDepartmentById(departments, deleteTargetId);
    if (!target || !target.parentId) {
      setIsDeleteConfirmOpen(false);
      return;
    }
    const rootId = (departments.find(d => !d.parentId)?.id) || selectedDeptId || "1";
    const affectedIds = [deleteTargetId, ...getDescendantIds(departments, deleteTargetId)];
    // 员工归并到一级部门
    setUsers(prev => prev.map(u => affectedIds.includes(u.departmentId) ? { ...u, departmentId: rootId } : u));
    // 删除部门树中的该节点及其子树
    const deleteDepartment = (depts: Department[]): Department[] => {
      return depts.filter(dept => {
        if (dept.id === deleteTargetId) return false;
        if (dept.children) {
          dept.children = deleteDepartment(dept.children);
        }
        return true;
      });
    };
    setDepartments(deleteDepartment(departments));
    setIsDeleteConfirmOpen(false);
    setDeleteTargetId("");
  };

  const handleAddSubDepartment = (parentId: string) => {
    setDeptFormData({ ...deptFormData, parentId });
    setIsAddSubDeptDialogOpen(true);
  };

  /**
   * 计算某部门的所有子孙部门ID集合
   * 参数：depts 组织树；id 目标部门ID
   * 返回：string[]
   */
  const getDescendantIds = (depts: Department[], id: string): string[] => {
    const target = findDepartmentById(depts, id);
    const ids: string[] = [];
    const walk = (node?: Department) => {
      if (!node || !node.children) return;
      node.children.forEach((c) => {
        ids.push(c.id);
        walk(c);
      });
    };
    walk(target || undefined);
    return ids;
  };

  /**
   * 从树中移除指定部门并返回被移除的节点
   * 返回：[被移除的部门, 新的部门树]
   */
  const removeDepartmentFromTree = (depts: Department[], id: string): [Department | null, Department[]] => {
    let removed: Department | null = null;
    const walk = (nodes: Department[]): Department[] => {
      return nodes
        .map((n) => {
          if (n.id === id) {
            removed = n;
            return null as unknown as Department; // 占位，稍后过滤
          }
          if (n.children && n.children.length > 0) {
            const newChildren = walk(n.children);
            return { ...n, children: newChildren };
          }
          return n;
        })
        .filter(Boolean) as Department[];
    };
    const newTree = walk(depts);
    return [removed, newTree];
  };

  /**
   * 将部门插入到指定父级（空表示作为顶级）
   */
  const insertDepartmentIntoTree = (depts: Department[], dept: Department, parentId: string): Department[] => {
    if (!parentId) {
      // 顶级
      return [...depts, { ...dept, parentId: undefined }];
    }
    const walk = (nodes: Department[]): Department[] => {
      return nodes.map((n) => {
        if (n.id === parentId) {
          const children = n.children ? [...n.children] : [];
          children.push({ ...dept, parentId });
          return { ...n, children };
        }
        if (n.children && n.children.length > 0) {
          return { ...n, children: walk(n.children) };
        }
        return n;
      });
    };
    return walk(depts);
  };

  /**
   * 移动部门：将 selectedDepartment 移动到 moveTargetParentId 作为新父级
   */
  const handleMoveDepartment = () => {
    if (!selectedDepartment) return;
    const deptId = selectedDepartment.id;
    const targetParentId = moveTargetParentId === "__root__" ? "" : moveTargetParentId;
    // 禁止将部门移动到自身或其子孙
    const invalidTargets = [deptId, ...getDescendantIds(departments, deptId)];
    if (invalidTargets.includes(targetParentId)) {
      alert("不能将部门移动到自身或其子部门下");
      return;
    }

    // 如果父级未变化，直接关闭
    const originalParentId = selectedDepartment.parentId || "";
    if (originalParentId === targetParentId) {
      setIsMoveDeptDialogOpen(false);
      return;
    }

    const [removed, withoutDept] = removeDepartmentFromTree(departments, deptId);
    if (!removed) return;
    const inserted = insertDepartmentIntoTree(withoutDept, { ...removed, parentId: targetParentId || undefined }, targetParentId);
    setDepartments(inserted);
    setIsMoveDeptDialogOpen(false);
    // 维持选中项不变
    setSelectedDeptId(deptId);
    setExpandedDepts((prev) => (targetParentId ? Array.from(new Set([...prev, targetParentId])) : prev));
  };

  // 用户操作函数
  const handleCreateUser = () => {
    const newUser: User = {
      id: Date.now().toString(),
      name: userFormData.name,
      email: userFormData.email,
      phone: userFormData.phone,
      position: userFormData.position,
      departmentId: userFormData.departmentId,
      status: "active",
      joinDate: new Date().toISOString().split('T')[0]
    };
    
    setUsers([...users, newUser]);
    setUserFormData({ name: "", email: "", phone: "", position: "", departmentId: "" });
    setIsAddUserDialogOpen(false);
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    
    setUsers(users.map(user => 
      user.id === selectedUser.id 
        ? { ...user, ...userFormData }
        : user
    ));
    
    setUserFormData({ name: "", email: "", phone: "", position: "", departmentId: "" });
    setIsUserDetailDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDepartmentChange = () => {
    if (selectedUsers.length === 0 || !userFormData.departmentId) return;
    
    setUsers(users.map(user => 
      selectedUsers.includes(user.id)
        ? { ...user, departmentId: userFormData.departmentId }
        : user
    ));
    
    setSelectedUsers([]);
    setUserFormData({ name: "", email: "", phone: "", position: "", departmentId: "" });
    setIsDeptChangeDialogOpen(false);
  };

  // 辅助函数
  // 编辑直接打开，无需二次确认
  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department);
    setDeptFormData({
      name: department.name,
      description: department.description,
      parentId: department.parentId || "",
      manager: department.manager
    });
    setIsEditDeptDialogOpen(true);
  };

  const openUserDetailDialog = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      position: user.position,
      departmentId: user.departmentId
    });
    setIsUserDetailDialogOpen(true);
  };

  const toggleDeptExpansion = (deptId: string) => {
    // 折叠
    if (expandedDepts.includes(deptId)) {
      setExpandedDepts(prev => prev.filter(id => id !== deptId));
      return;
    }
    // 展开（首次模拟懒加载）
    if (!lazyLoaded[deptId]) {
      setLoadingDepts(prev => [...prev, deptId]);
      setTimeout(() => {
        setLazyLoaded(prev => ({ ...prev, [deptId]: true }));
        setLoadingDepts(prev => prev.filter(id => id !== deptId));
        setExpandedDepts(prev => [...prev, deptId]);
      }, 400);
    } else {
      setExpandedDepts(prev => [...prev, deptId]);
    }
  };

  const getAllDepartments = (depts: Department[]): Department[] => {
    let result: Department[] = [];
    depts.forEach(dept => {
      result.push(dept);
      if (dept.children) {
        result = result.concat(getAllDepartments(dept.children));
      }
    });
    return result;
  };

  const getDepartmentName = (deptId: string): string => {
    const allDepts = getAllDepartments(departments);
    const dept = allDepts.find(d => d.id === deptId);
    return dept?.name || "未知部门";
  };

  /**
   * 获取部门的直接员工数量（不包含子部门）
   * 参数：deptId 部门ID
   * 返回：number 该部门直接隶属的员工数量
   */
  const getDepartmentUserCount = (deptId: string): number => {
    return users.filter(u => u.departmentId === deptId).length;
  };

  // 计算部门完整路径（父子关系），如：华特迪士尼公司 / 技术部 / 前端部门
  const getDepartmentPath = (deptId: string): string => {
    const allDepts = getAllDepartments(departments);
    const path: string[] = [];
    let current = allDepts.find(d => d.id === deptId);
    while (current) {
      path.unshift(current.name);
      if (!current.parentId) break;
      current = allDepts.find(d => d.id === current?.parentId);
    }
    return path.join(" / ");
  };

  // 根据搜索过滤树（命中自己或子节点时保留）
  const filterDepartmentsTree = (depts: Department[], query: string): Department[] => {
    const q = query.trim().toLowerCase();
    if (!q) return depts;
    const walk = (nodes: Department[]): Department[] => {
      const res: Department[] = [];
      nodes.forEach((n) => {
        const children = n.children ? walk(n.children) : undefined;
        if (n.name.toLowerCase().includes(q) || (children && children.length > 0)) {
          res.push({ ...n, children });
        }
      });
      return res;
    };
    return walk(depts);
  };

  const renderDepartmentTree = (depts: Department[], level = 0) => {
    return depts.map(dept => (
      <div key={dept.id} className="border rounded-lg mb-2">
        <div
          className={`p-4 flex items-center justify-between ${selectedDeptId === dept.id ? 'bg-blue-50' : 'bg-gray-50'} ${level > 0 ? 'ml-' + (level * 4) : ''} cursor-pointer`}
          onClick={() => { setSelectedDeptId(dept.id); setSelectedDepartment(dept); }}
        >
          <div className="flex items-center space-x-3">
            {dept.children && dept.children.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); toggleDeptExpansion(dept.id); }}
                className="p-1"
              >
                {expandedDepts.includes(dept.id) ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            )}
            <Building2 className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium">{dept.name}</h3>
              <p className="text-sm text-gray-600">{dept.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {getDepartmentUserCount(dept.id)}
            </span>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleAddSubDepartment(dept.id); }}
                title="添加子部门"
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); openEditDialog(dept); }}
                title="编辑部门"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); setSelectedDepartment(dept); setMoveTargetParentId(dept.parentId || ""); setIsMoveDeptDialogOpen(true); }}
                title="移动部门"
              >
                <Move className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!dept.parentId}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleDeleteDepartment(dept.id); }}
                className="text-red-600 hover:text-red-700"
                title="删除部门"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {loadingDepts.includes(dept.id) && (
          <div className="pl-8 pb-2">
            <Skeleton className="h-6 w-full" />
          </div>
        )}
        {dept.children && dept.children.length > 0 && expandedDepts.includes(dept.id) && (
          <div className="pl-8 pb-2">
            {renderDepartmentTree(dept.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  // 用户视图过滤（独立搜索与状态）
  const filteredUsers = users.filter(user => {
    const q = (userSearch || searchQuery).toLowerCase();
    const matchesSearch = user.name.toLowerCase().includes(q) || user.id.toLowerCase().includes(q);
    const statusValue = userStatusFilter || (statusFilter as 'all' | 'active' | 'inactive');
    const matchesStatus = statusValue === "all" || user.status === statusValue;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">部门管理</h2>
          <p className="text-gray-600 mt-1">管理组织架构，设置部门信息和权限</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>添加员工</span>
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <Dialog open={isCreateDeptDialogOpen} onOpenChange={setIsCreateDeptDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>新建部门</span>
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* 搜索和筛选（仅在用户视图显示） */}
      {activeTab === 'user' && (
        <Card>
          <CardContent className="pt-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="搜索用户姓名/工号"
                      value={userSearch}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setUserSearch(e.target.value); setUserPage(1); }}
                      className="pl-10"
                    />
                  </div>
                </div>
              <ToggleGroup type="single" value={userStatusFilter} onValueChange={(v: 'all' | 'active' | 'inactive' | undefined) => setUserStatusFilter(v || 'all')}>
                <ToggleGroupItem value="all">全部</ToggleGroupItem>
                <ToggleGroupItem value="active">启用</ToggleGroupItem>
                <ToggleGroupItem value="inactive">禁用</ToggleGroupItem>
              </ToggleGroup>
              {selectedUsers.length > 0 && (
                <Button
                  onClick={() => setIsDeptChangeDialogOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  <span>变更部门 ({selectedUsers.length})</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 两表切换控制已移除：按照需求去掉顶部的部门/用户切换标签 */}

      {/* 部门视图（左右分栏：左树 + 右员工列表） */}
      {activeTab === 'department' && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            部门列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row space-x-6">
            {/* 左侧：部门树 + 搜索 */}
            <div
              className="md:w-1/3 border-r pr-4"
              ref={leftPaneRef}
              onScroll={() => {
                if (!leftPaneRef.current || !rightPaneRef.current) return;
                const l = leftPaneRef.current;
                const r = rightPaneRef.current;
                const ratio = l.scrollTop / Math.max(1, (l.scrollHeight - l.clientHeight));
                r.scrollTop = ratio * Math.max(1, (r.scrollHeight - r.clientHeight));
              }}
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
            >
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="搜索部门名称（支持模糊）"
                    value={deptSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeptSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                {renderDepartmentTree(filterDepartmentsTree(departments, deptSearch))}
              </div>
            </div>

            {/* 右侧：选中部门的员工列表 */}
            <div className="md:w-2/3 pl-4" ref={rightPaneRef} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-medium">{getDepartmentName(selectedDeptId)} 的员工</h3>
                  <p className="text-xs text-gray-500">路径：{getDepartmentPath(selectedDeptId)}</p>
                </div>
                <div className="w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="搜索员工姓名/工号"
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <ToggleGroup type="single" value={userStatusFilter} onValueChange={(v: 'all' | 'active' | 'inactive' | undefined) => setUserStatusFilter(v || 'all')}>
                  <ToggleGroupItem value="all">全部</ToggleGroupItem>
                  <ToggleGroupItem value="active">启用</ToggleGroupItem>
                  <ToggleGroupItem value="inactive">禁用</ToggleGroupItem>
                </ToggleGroup>
              </div>

              {(() => {
                // 模拟加载效果
                const allUsers = users.filter(u => u.departmentId === selectedDeptId);
                const q = (userSearch || '').toLowerCase();
                const filtered = allUsers.filter(u =>
                  (u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)) &&
                  (userStatusFilter === 'all' || u.status === userStatusFilter)
                );
                const totalPages = Math.max(1, Math.ceil(filtered.length / userPageSize));
                const currentPage = Math.min(userPage, totalPages);
                const pageItems = filtered.slice((currentPage - 1) * userPageSize, currentPage * userPageSize);

                return (
                  <div>
                    {isUserLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>员工信息</TableHead>
                            <TableHead>联系方式</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>入职时间</TableHead>
                            <TableHead>操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pageItems.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.position}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center text-sm">
                                    <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                    {user.email}
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                    {user.phone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant={user.status === "active" ? "default" : "secondary"}>
                                    {user.status === "active" ? "启用" : "禁用"}
                                  </Badge>
                                  <Switch
                                    checked={user.status === "active"}
                                    onCheckedChange={(checked: boolean) => {
                                      setUsers(users.map(u => u.id === user.id ? { ...u, status: checked ? "active" : "inactive" } : u));
                                    }}
                                    aria-label="切换用户启用/禁用状态"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center text-sm">
                                  <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                  {user.joinDate}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => openUserDetailDialog(user)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm text-gray-600">第 {currentPage} / {totalPages} 页，共 {filtered.length} 条</div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious size="default" href="#" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); setUserPage(Math.max(1, currentPage - 1)); }} />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext size="default" href="#" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); setUserPage(Math.min(totalPages, currentPage + 1)); }} />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* 用户列表（切换） */}
      {activeTab === 'user' && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            员工列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setSelectedUsers(filteredUsers.map(user => user.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>员工信息</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>所属部门</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>入职时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const totalPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
                const currentPage = Math.min(userPage, totalPages);
                const pageItems = filteredUsers.slice((currentPage - 1) * userPageSize, currentPage * userPageSize);
                return pageItems.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.position}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                        {user.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1 text-gray-400" />
                        {user.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getDepartmentName(user.departmentId)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>
                        {user.status === "active" ? "启用" : "禁用"}
                      </Badge>
                      <Switch
                        checked={user.status === "active"}
                        onCheckedChange={(checked: boolean) => {
                          setUsers(users.map(u => u.id === user.id ? { ...u, status: checked ? "active" : "inactive" } : u));
                        }}
                        aria-label="切换用户启用/禁用状态"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                      {user.joinDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openUserDetailDialog(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                ));
              })()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}

      {/* 删除部门二次确认对话框 */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除部门</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              删除后，该部门及其子部门会被移除，其所有员工将默认归入一级部门。此操作不可撤回，是否继续？
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>取消</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={confirmDeleteDepartment}>确认删除</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 移动部门对话框 */}
      <Dialog open={isMoveDeptDialogOpen} onOpenChange={setIsMoveDeptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>移动部门</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>当前部门</Label>
              <p className="mt-1 text-sm text-gray-700">{selectedDepartment?.name}</p>
            </div>
            <div>
              <Label htmlFor="move-parent">目标父级</Label>
              {(() => {
                const invalidIds = selectedDepartment ? [selectedDepartment.id, ...getDescendantIds(departments, selectedDepartment.id)] : [];
                const candidates = getAllDepartments(departments).filter(d => !invalidIds.includes(d.id));
                return (
                  <Select value={moveTargetParentId} onValueChange={(value: string) => setMoveTargetParentId(value)}>
                    <SelectTrigger id="move-parent">
                      <SelectValue placeholder="选择目标父级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__root__">设为顶级部门</SelectItem>
                      {candidates.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              })()}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsMoveDeptDialogOpen(false)}>取消</Button>
              <Button onClick={handleMoveDepartment}>确认移动</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新建部门对话框 */}
      <Dialog open={isCreateDeptDialogOpen} onOpenChange={setIsCreateDeptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建部门</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dept-name">部门名称 <span className="text-red-500">*</span></Label>
              <Input
                id="dept-name"
                value={deptFormData.name}
                onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                placeholder="请输入部门名称"
              />
            </div>
            <div>
              <Label htmlFor="dept-parent">上级部门</Label>
              <Select value={deptFormData.parentId} onValueChange={(value: string) => setDeptFormData({ ...deptFormData, parentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择上级部门（可选）" />
                </SelectTrigger>
                <SelectContent>
                  {getAllDepartments(departments).map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dept-description">部门描述</Label>
              <Textarea
                id="dept-description"
                value={deptFormData.description}
                onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                placeholder="请输入部门描述"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDeptDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateDepartment}>
                创建
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑部门对话框 */}
      <Dialog open={isEditDeptDialogOpen} onOpenChange={setIsEditDeptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑部门</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-dept-name">部门名称 <span className="text-red-500">*</span></Label>
              <Input
                id="edit-dept-name"
                value={deptFormData.name}
                onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                placeholder="请输入部门名称"
              />
            </div>
            <div>
              <Label htmlFor="edit-dept-description">部门描述</Label>
              <Textarea
                id="edit-dept-description"
                value={deptFormData.description}
                onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                placeholder="请输入部门描述"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDeptDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleEditDepartment}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加员工对话框 */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加员工</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-name">姓名</Label>
              <Input
                id="user-name"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                placeholder="请输入员工姓名"
              />
            </div>
            <div>
              <Label htmlFor="user-email">邮箱</Label>
              <Input
                id="user-email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="请输入邮箱地址"
              />
            </div>
            <div>
              <Label htmlFor="user-phone">手机号</Label>
              <Input
                id="user-phone"
                value={userFormData.phone}
                onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                placeholder="请输入手机号码"
              />
            </div>
            <div>
              <Label htmlFor="user-position">职位</Label>
              <Input
                id="user-position"
                value={userFormData.position}
                onChange={(e) => setUserFormData({ ...userFormData, position: e.target.value })}
                placeholder="请输入职位名称"
              />
            </div>
            <div>
              <Label htmlFor="user-department">所属部门</Label>
              <Select value={userFormData.departmentId} onValueChange={(value: string) => setUserFormData({ ...userFormData, departmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择所属部门" />
                </SelectTrigger>
                <SelectContent>
                  {getAllDepartments(departments).map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateUser}>
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 员工详情对话框 */}
      <Dialog open={isUserDetailDialogOpen} onOpenChange={setIsUserDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>员工详情</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="detail-user-name">姓名</Label>
              <Input
                id="detail-user-name"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                placeholder="请输入员工姓名"
              />
            </div>
            <div>
              <Label htmlFor="detail-user-email">邮箱</Label>
              <Input
                id="detail-user-email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="请输入邮箱地址"
              />
            </div>
            <div>
              <Label htmlFor="detail-user-phone">手机号</Label>
              <Input
                id="detail-user-phone"
                value={userFormData.phone}
                onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                placeholder="请输入手机号码"
              />
            </div>
            <div>
              <Label htmlFor="detail-user-position">职位</Label>
              <Input
                id="detail-user-position"
                value={userFormData.position}
                onChange={(e) => setUserFormData({ ...userFormData, position: e.target.value })}
                placeholder="请输入职位名称"
              />
            </div>
            <div>
              <Label htmlFor="detail-user-department">所属部门</Label>
              <Select value={userFormData.departmentId} onValueChange={(value: string) => setUserFormData({ ...userFormData, departmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择所属部门" />
                </SelectTrigger>
                <SelectContent>
                  {getAllDepartments(departments).map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsUserDetailDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleEditUser}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 部门变更对话框 */}
      <Dialog open={isDeptChangeDialogOpen} onOpenChange={setIsDeptChangeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>变更部门</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>选中员工 ({selectedUsers.length} 人)</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {selectedUsers.map(userId => {
                  const user = users.find(u => u.id === userId);
                  return user ? (
                    <div key={userId} className="flex items-center space-x-2 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                      <span className="text-gray-500">({user.position})</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            <div>
              <Label htmlFor="change-department">目标部门</Label>
              <Select value={userFormData.departmentId} onValueChange={(value: string) => setUserFormData({ ...userFormData, departmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择目标部门" />
                </SelectTrigger>
                <SelectContent>
                  {getAllDepartments(departments).map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDeptChangeDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleDepartmentChange}>
                确认变更
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加子部门对话框 */}
      <Dialog open={isAddSubDeptDialogOpen} onOpenChange={setIsAddSubDeptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加子部门</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sub-dept-name">部门名称 <span className="text-red-500">*</span></Label>
              <Input
                id="sub-dept-name"
                value={deptFormData.name}
                onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                placeholder="请输入部门名称"
              />
            </div>
            <div>
              <Label htmlFor="sub-dept-description">部门描述</Label>
              <Textarea
                id="sub-dept-description"
                value={deptFormData.description}
                onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                placeholder="请输入部门描述"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddSubDeptDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={() => {
                handleCreateDepartment();
                setIsAddSubDeptDialogOpen(false);
              }}>
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}