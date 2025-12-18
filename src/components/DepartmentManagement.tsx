import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Tree,
  Table,
  Button,
  Input,
  Modal,
  Form,
  Select,
  Splitter,
  Typography,
  Tag,
  Avatar,
  Space,
  Breadcrumb,
  Empty,
  Dropdown,
  MenuProps,
  Badge,
  Tooltip,
  message,
  Switch
} from "antd";
import type { DataNode, TreeProps } from "antd/es/tree";
import type { ColumnsType } from "antd/es/table";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Building2,
  Search,
  Filter,
  UserPlus,
  ArrowUpDown,
  FolderPlus,
  Move,
  Phone,
  Mail,
  Calendar,
  MoreHorizontal,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { setDepartmentTree } from "../services/departments";

const { Search: AntSearch } = Input;
const { Title, Text } = Typography;
const { confirm } = Modal;

// 用户接口定义
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string;
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

  useEffect(() => {
    setDepartmentTree(departments as any);
  }, [departments]);

  // 用户数据
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "张三",
      email: "zhangsan@company.com",
      phone: "13800138001",
      role: "总经理",
      departmentId: "1",
      status: "active",
      joinDate: "2024-01-01"
    },
    {
      id: "3",
      name: "王五",
      email: "wangwu@company.com",
      phone: "13800138003",
      role: "技术总监",
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
  // 移动部门目标父级
  const [moveTargetParentId, setMoveTargetParentId] = useState<string>("");
  // 删除部门二次确认
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>("");
  // 删除用户二次确认
  const [isDeleteUserConfirmOpen, setIsDeleteUserConfirmOpen] = useState<boolean>(false);
  const [deleteUserTargetId, setDeleteUserTargetId] = useState<string>("");

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
    password: "",
    confirmPassword: "",
    role: "",
    departmentId: ""
  });
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);

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
    const affectedIds = [deleteTargetId, ...getDescendantIds(departments, deleteTargetId)];
    // 员工归并到父级部门
    const newDeptId = target.parentId;
    setUsers(prev => prev.map(u => affectedIds.includes(u.departmentId) ? { ...u, departmentId: newDeptId } : u));
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
    const targetParentId = moveTargetParentId;
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
    if (!userFormData.password || userFormData.password.length < 8) {
      alert("请输入至少8位的密码");
      return;
    }
    if (userFormData.password !== userFormData.confirmPassword) {
      alert("两次输入的密码不一致");
      return;
    }
    const newUser: User = {
      id: Date.now().toString(),
      name: userFormData.name,
      email: userFormData.email,
      phone: userFormData.phone,
      role: userFormData.role,
      departmentId: userFormData.departmentId,
      status: "active",
      joinDate: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, newUser]);
    setUserFormData({ name: "", email: "", phone: "", password: "", confirmPassword: "", role: "", departmentId: "" });
    setIsAddUserDialogOpen(false);
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    if (!userFormData.password || userFormData.password.length < 8) {
      alert("请输入至少8位的密码");
      return;
    }
    if (userFormData.password !== userFormData.confirmPassword) {
      alert("两次输入的密码不一致");
      return;
    }

    setUsers(users.map(user =>
      user.id === selectedUser.id
        ? { ...user, ...userFormData }
        : user
    ));

    setUserFormData({ name: "", email: "", phone: "", password: "", confirmPassword: "", role: "", departmentId: "" });
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
    setUserFormData({ name: "", email: "", phone: "", password: "", confirmPassword: "", role: "", departmentId: "" });
    setIsDeptChangeDialogOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    setDeleteUserTargetId(id);
    setIsDeleteUserConfirmOpen(true);
  };

  const confirmDeleteUser = () => {
    if (!deleteUserTargetId) return;
    setUsers(users.filter(u => u.id !== deleteUserTargetId));
    setIsDeleteUserConfirmOpen(false);
    setDeleteUserTargetId("");
    // 如果选中的用户被删除，清除选中状态
    if (selectedUser?.id === deleteUserTargetId) {
      setSelectedUser(null);
    }
  };

  const handleBatchUserStatusUpdate = (status: "active" | "inactive") => {
    if (selectedUsers.length === 0) return;
    setUsers(users.map(user =>
      selectedUsers.includes(user.id) ? { ...user, status } : user
    ));
    setSelectedUsers([]);
    message.success(`已批量${status === 'active' ? '启用' : '禁用'} ${selectedUsers.length} 位用户`);
  };

  const handleToggleUserStatus = (userId: string, enabled: boolean) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, status: enabled ? "active" : "inactive" } : user
    ));
    message.success(`用户已${enabled ? '启用' : '禁用'}`);
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
      password: "********",
      confirmPassword: "********",
      role: user.role,
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


  // 部门树数据转换
  const convertToTreeData = (depts: Department[]): DataNode[] => {
    return depts.map(dept => ({
      title: (
        <div className="flex flex-row items-center justify-between group w-full pr-2 overflow-hidden">
          <span className="truncate flex-1 font-medium text-gray-700">{dept.name}</span>
          <Space className="hidden group-hover:flex flex-shrink-0" size={0} onClick={(e) => e.stopPropagation()}>
            <Tooltip title="添加子部门">
              <Button type="text" size="small" icon={<FolderPlus size={14} />} onClick={() => handleAddSubDepartment(dept.id)} />
            </Tooltip>
            {dept.parentId && (
              <>
                <Tooltip title="编辑">
                  <Button type="text" size="small" icon={<Edit size={14} />} onClick={() => openEditDialog(dept)} />
                </Tooltip>
                <Tooltip title="移动">
                  <Button type="text" size="small" icon={<Move size={14} />} onClick={() => { setSelectedDepartment(dept); setMoveTargetParentId(dept.parentId || ""); setIsMoveDeptDialogOpen(true); }} />
                </Tooltip>
                <Tooltip title="删除">
                  <Button type="text" size="small" danger icon={<Trash2 size={14} />} onClick={() => handleDeleteDepartment(dept.id)} />
                </Tooltip>
              </>
            )}
            {!dept.parentId && (
              <Tooltip title="编辑">
                <Button type="text" size="small" icon={<Edit size={14} />} onClick={() => openEditDialog(dept)} />
              </Tooltip>
            )}
          </Space>
        </div>
      ),
      key: dept.id,
      children: dept.children ? convertToTreeData(dept.children) : [],
    }));
  };

  const treeData = convertToTreeData(filterDepartmentsTree(departments, deptSearch));

  // 用户列表列定义
  const columns: ColumnsType<User> = [
    {
      title: '员工信息',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar}>{record.name?.charAt(0)}</Avatar>
          <div>
            <div className="font-medium">{record.name}</div>
            <Tag bordered={false} color="blue">{record.role}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (_, record) => (
        <div className="space-y-1 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Mail size={14} /> {record.email}
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} /> {record.phone}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => (
        <Space>
          <Switch
            size="small"
            checked={record.status === 'active'}
            onChange={(checked) => handleToggleUserStatus(record.id, checked)}
          />
          <span className="text-gray-500 text-sm">{record.status === 'active' ? '启用' : '禁用'}</span>
        </Space>
      ),
    },
    {
      title: '加入时间',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (text) => <span className="text-gray-500"><Calendar className="inline-block mr-1" size={14} />{text}</span>
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" size="small" icon={<Edit size={14} />} onClick={() => openUserDetailDialog(record)}>编辑</Button>
          <Button
            type="text"
            size="small"
            danger
            icon={<Trash2 size={14} />}
            disabled={record.status === 'active'}
            onClick={() => handleDeleteUser(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const filteredUsers = users.filter(user => {
    const q = (userSearch || searchQuery).toLowerCase();
    const matchesSearch = user.name.toLowerCase().includes(q) || user.id.toLowerCase().includes(q);
    const statusValue = userStatusFilter || (statusFilter as 'all' | 'active' | 'inactive');
    const matchesStatus = statusValue === "all" || user.status === statusValue;
    const matchesDept = user.departmentId === selectedDeptId;
    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="h-[calc(100vh-140px)] bg-white rounded-lg border border-gray-200 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <div>
          <Title level={4} style={{ margin: 0 }}>部门管理</Title>
          <Text type="secondary" className="text-xs">管理组织架构与人员信息</Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setIsCreateDeptDialogOpen(true)}
          >
            新建部门
          </Button>
        </Space>
      </div>

      <Splitter style={{ flex: 1 }}>
        <Splitter.Panel defaultSize="25%" min="20%" max="40%">
          <div className="h-full flex flex-col max-h-full">
            <div className="p-3 border-b border-gray-100">
              <AntSearch
                placeholder="搜索部门"
                onChange={(e) => setDeptSearch(e.target.value)}
                allowClear
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <Tree
                treeData={treeData}
                defaultExpandAll
                selectedKeys={[selectedDeptId]}
                onSelect={(keys) => {
                  if (keys.length > 0) {
                    const newId = keys[0] as string;
                    setSelectedDeptId(newId);
                    // Set selected department object if needed
                    const findDept = (nodes: Department[]): Department | undefined => {
                      for (const node of nodes) {
                        if (node.id === newId) return node;
                        if (node.children) {
                          const res = findDept(node.children);
                          if (res) return res;
                        }
                      }
                    }
                    setSelectedDepartment(findDept(departments) || null);
                  }
                }}
                blockNode
                showIcon
              />
            </div>
          </div>
        </Splitter.Panel>
        <Splitter.Panel>
          <div className="h-full flex flex-col max-h-full overflow-hidden">
            {/* Header Info */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <Breadcrumb
                    items={getDepartmentPath(selectedDeptId).split(' / ').map(name => ({ title: name }))}
                    className="mb-2"
                  />
                  <div className="flex items-center gap-3">
                    <Title level={3} style={{ margin: 0 }}>{getDepartmentName(selectedDeptId)}</Title>
                  </div>
                  <Text type="secondary" className="mt-1 block">
                    {findDepartmentById(departments, selectedDeptId)?.description || '暂无描述'}
                  </Text>
                </div>
                <Space>
                  {selectedUsers.length > 0 && (
                    <Button icon={<ArrowUpDown size={14} />} onClick={() => setIsDeptChangeDialogOpen(true)}>
                      批量转部门
                    </Button>
                  )}
                  {selectedUsers.length > 0 && (
                    <>
                      <Button
                        icon={<ToggleRight size={14} />}
                        className="text-green-600 border-green-200 hover:text-green-700 hover:border-green-300 hover:bg-green-50"
                        onClick={() => handleBatchUserStatusUpdate("active")}
                      >
                        批量启用
                      </Button>
                      <Button
                        icon={<ToggleLeft size={14} />}
                        className="text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        onClick={() => handleBatchUserStatusUpdate("inactive")}
                      >
                        批量禁用
                      </Button>
                    </>
                  )}
                  <Button type="primary" icon={<UserPlus size={16} />} onClick={() => setIsAddUserDialogOpen(true)}>
                    添加员工
                  </Button>
                </Space>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4 mt-6">
                <AntSearch
                  placeholder="搜索员工姓名"
                  style={{ width: 240 }}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <Select
                  defaultValue="all"
                  style={{ width: 120 }}
                  onChange={(val: any) => setUserStatusFilter(val)}
                  options={[
                    { label: '全部状态', value: 'all' },
                    { label: '已启用', value: 'active' },
                    { label: '已禁用', value: 'inactive' },
                  ]}
                />
              </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-auto p-0">
              <Table
                rowKey="id"
                columns={columns}
                dataSource={filteredUsers}
                rowSelection={{
                  selectedRowKeys: selectedUsers,
                  onChange: (keys) => setSelectedUsers(keys as string[]),
                }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
                scroll={{ y: 'calc(100vh - 400px)' }}
              />
            </div>
          </div>
        </Splitter.Panel>
      </Splitter>





      {/* Delete Dept Confirm */}
      <Modal
        title="确认删除部门"
        open={isDeleteConfirmOpen}
        onOk={confirmDeleteDepartment}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除该部门吗？此操作不可撤回。</p>
        <p className="text-gray-500 text-sm mt-2">注意：删除后，该部门及其子部门将被删除，所有员工将归入上级部门。</p>
      </Modal>

      {/* Create Dept */}
      <Modal
        title="新建部门"
        open={isCreateDeptDialogOpen}
        onOk={handleCreateDepartment}
        onCancel={() => setIsCreateDeptDialogOpen(false)}
        okText="创建"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="部门名称" required>
            <Input value={deptFormData.name} onChange={e => setDeptFormData({ ...deptFormData, name: e.target.value })} placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item label="部门描述">
            <Input.TextArea value={deptFormData.description} onChange={e => setDeptFormData({ ...deptFormData, description: e.target.value })} placeholder="请输入部门描述" />
          </Form.Item>
          <Form.Item label="上级部门">
            <Select
              allowClear
              placeholder="请选择上级部门（为空则为一级部门）"
              value={deptFormData.parentId || undefined}
              onChange={val => setDeptFormData({ ...deptFormData, parentId: val })}
            >
              {getAllDepartments(departments).map(dept => (
                <Select.Option key={dept.id} value={dept.id}>{dept.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="部门负责人">
            <Input value={deptFormData.manager} onChange={e => setDeptFormData({ ...deptFormData, manager: e.target.value })} placeholder="请输入负责人姓名" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Sub Dept */}
      <Modal
        title="添加子部门"
        open={isAddSubDeptDialogOpen}
        onOk={() => { handleCreateDepartment(); setIsAddSubDeptDialogOpen(false); }}
        onCancel={() => setIsAddSubDeptDialogOpen(false)}
        okText="添加"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="上级部门">
            <Input value={getDepartmentName(deptFormData.parentId)} disabled />
          </Form.Item>
          <Form.Item label="部门名称" required>
            <Input value={deptFormData.name} onChange={e => setDeptFormData({ ...deptFormData, name: e.target.value })} placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item label="部门描述">
            <Input.TextArea value={deptFormData.description} onChange={e => setDeptFormData({ ...deptFormData, description: e.target.value })} placeholder="请输入部门描述" />
          </Form.Item>
          <Form.Item label="部门负责人">
            <Input value={deptFormData.manager} onChange={e => setDeptFormData({ ...deptFormData, manager: e.target.value })} placeholder="请输入负责人姓名" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Dept */}
      <Modal
        title="编辑部门"
        open={isEditDeptDialogOpen}
        onOk={handleEditDepartment}
        onCancel={() => setIsEditDeptDialogOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="部门名称" required>
            <Input value={deptFormData.name} onChange={e => setDeptFormData({ ...deptFormData, name: e.target.value })} placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item label="部门描述">
            <Input.TextArea value={deptFormData.description} onChange={e => setDeptFormData({ ...deptFormData, description: e.target.value })} placeholder="请输入部门描述" />
          </Form.Item>
          <Form.Item label="部门负责人">
            <Input value={deptFormData.manager} onChange={e => setDeptFormData({ ...deptFormData, manager: e.target.value })} placeholder="请输入负责人姓名" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Move Dept */}
      <Modal
        title="移动部门"
        open={isMoveDeptDialogOpen}
        onOk={handleMoveDepartment}
        onCancel={() => setIsMoveDeptDialogOpen(false)}
        okText="确认移动"
        cancelText="取消"
      >
        <p className="mb-4">将部门 <b>{selectedDepartment?.name}</b> 移动到：</p>
        <Select
          style={{ width: '100%' }}
          placeholder="请选择新的上级部门"
          value={moveTargetParentId || undefined}
          onChange={val => setMoveTargetParentId(val)}
          allowClear
        >
          <Select.Option value="">无（作为一级部门）</Select.Option>
          {getAllDepartments(departments).filter(d => d.id !== selectedDepartment?.id).map(dept => (
            <Select.Option key={dept.id} value={dept.id} disabled={getDescendantIds(departments, selectedDepartment?.id || '').includes(dept.id)}>
              {dept.name}
            </Select.Option>
          ))}
        </Select>
      </Modal>

      {/* Add User */}
      <Modal
        title="添加员工"
        open={isAddUserDialogOpen}
        onOk={handleCreateUser}
        onCancel={() => setIsAddUserDialogOpen(false)}
        okText="添加"
        cancelText="取消"
        width={600}
      >
        <Form layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="姓名" required>
              <Input value={userFormData.name} onChange={e => setUserFormData({ ...userFormData, name: e.target.value })} placeholder="员工姓名" />
            </Form.Item>
            <Form.Item label="手机号">
              <Input value={userFormData.phone} onChange={e => setUserFormData({ ...userFormData, phone: e.target.value })} placeholder="11位手机号" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="邮箱">
              <Input value={userFormData.email} onChange={e => setUserFormData({ ...userFormData, email: e.target.value })} placeholder="员工邮箱" />
            </Form.Item>
            <Form.Item label="角色">
              <Select value={userFormData.role} onChange={val => setUserFormData({ ...userFormData, role: val })} placeholder="选择角色">
                <Select.Option value="普通用户">普通用户</Select.Option>
                <Select.Option value="项目经理">项目经理</Select.Option>
                <Select.Option value="数据分析师">数据分析师</Select.Option>
                <Select.Option value="总经理">总经理</Select.Option>
                <Select.Option value="技术总监">技术总监</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="所属部门">
              <Select value={userFormData.departmentId} onChange={val => setUserFormData({ ...userFormData, departmentId: val })} placeholder="选择部门">
                {getAllDepartments(departments).map(dept => (
                  <Select.Option key={dept.id} value={dept.id}>{dept.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="设置密码" required>
              <Input.Password value={userFormData.password} onChange={e => setUserFormData({ ...userFormData, password: e.target.value })} placeholder="至少8位" />
            </Form.Item>
            <Form.Item label="确认密码" required>
              <Input.Password value={userFormData.confirmPassword} onChange={e => setUserFormData({ ...userFormData, confirmPassword: e.target.value })} placeholder="再次输入密码" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Edit User Details */}
      <Modal
        title="员工详情"
        open={isUserDetailDialogOpen}
        onOk={handleEditUser}
        onCancel={() => setIsUserDetailDialogOpen(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="姓名" required>
              <Input value={userFormData.name} onChange={e => setUserFormData({ ...userFormData, name: e.target.value })} placeholder="员工姓名" />
            </Form.Item>
            <Form.Item label="手机号">
              <Input value={userFormData.phone} onChange={e => setUserFormData({ ...userFormData, phone: e.target.value })} placeholder="11位手机号" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="邮箱">
              <Input value={userFormData.email} onChange={e => setUserFormData({ ...userFormData, email: e.target.value })} placeholder="员工邮箱" />
            </Form.Item>
            <Form.Item label="角色">
              <Select value={userFormData.role} onChange={val => setUserFormData({ ...userFormData, role: val })} placeholder="选择角色">
                <Select.Option value="普通用户">普通用户</Select.Option>
                <Select.Option value="项目经理">项目经理</Select.Option>
                <Select.Option value="数据分析师">数据分析师</Select.Option>
                <Select.Option value="总经理">总经理</Select.Option>
                <Select.Option value="技术总监">技术总监</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="所属部门">
              <Select value={userFormData.departmentId} onChange={val => setUserFormData({ ...userFormData, departmentId: val })} placeholder="选择部门">
                {getAllDepartments(departments).map(dept => (
                  <Select.Option key={dept.id} value={dept.id}>{dept.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="密码">
              <Input.Password value={userFormData.password} onChange={e => setUserFormData({ ...userFormData, password: e.target.value })} placeholder="不修改请留空或保持星号" />
            </Form.Item>
            <Form.Item label="确认密码">
              <Input.Password value={userFormData.confirmPassword} onChange={e => setUserFormData({ ...userFormData, confirmPassword: e.target.value })} placeholder="确认密码" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Batch Change Dept */}
      <Modal
        title={`批量变更部门 (已选 ${selectedUsers.length} 人)`}
        open={isDeptChangeDialogOpen}
        onOk={handleDepartmentChange}
        onCancel={() => setIsDeptChangeDialogOpen(false)}
        okText="确认变更"
        cancelText="取消"
      >
        <div className="mb-4">
          <Text type="secondary">将选中的员工移动到：</Text>
        </div>
        <Select
          style={{ width: '100%' }}
          placeholder="请选择目标部门"
          value={userFormData.departmentId}
          onChange={val => setUserFormData({ ...userFormData, departmentId: val })}
        >
          {getAllDepartments(departments).map(dept => (
            <Select.Option key={dept.id} value={dept.id}>{dept.name}</Select.Option>
          ))}
        </Select>
      </Modal>

      {/* Delete User Confirm */}
      <Modal
        title="确认删除员工"
        open={isDeleteUserConfirmOpen}
        onOk={confirmDeleteUser}
        onCancel={() => setIsDeleteUserConfirmOpen(false)}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除该员工吗？此操作不可撤回。</p>
      </Modal>

    </div>
  );
}
