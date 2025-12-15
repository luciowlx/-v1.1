import type { User } from "../types/user";

export const registeredUsers: User[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@company.com",
    phone: "13800138001",
    realName: "系统管理员",
    department: "技术部",
    role: "超级管理员",
    status: "active",
    lastLogin: "2024-03-15 10:30:00",
    createdAt: "2024-01-01"
  },
  {
    id: "2",
    username: "zhangsan",
    email: "zhangsan@company.com",
    phone: "13800138002",
    realName: "张三",
    department: "技术部",
    role: "项目经理",
    status: "active",
    lastLogin: "2024-03-15 09:15:00",
    createdAt: "2024-01-15"
  },
  {
    id: "3",
    username: "lisi",
    email: "lisi@company.com",
    phone: "13800138003",
    realName: "李四",
    department: "产品部",
    role: "数据分析师",
    status: "active",
    lastLogin: "2024-03-14 16:45:00",
    createdAt: "2024-01-20"
  },
  {
    id: "4",
    username: "wangwu",
    email: "wangwu@company.com",
    phone: "13800138004",
    realName: "王五",
    department: "运营部",
    role: "普通用户",
    status: "inactive",
    lastLogin: "2024-03-10 14:20:00",
    createdAt: "2024-02-01"
  },
  {
    id: "5",
    username: "zhaoliu",
    email: "zhaoliu@company.com",
    phone: "13800138005",
    realName: "赵六",
    department: "人事部",
    role: "普通用户",
    status: "locked",
    lastLogin: "2024-03-05 11:30:00",
    createdAt: "2024-02-10"
  },
  {
    id: "6",
    username: "sunqi",
    email: "sunqi@company.com",
    phone: "13800138006",
    realName: "孙七",
    department: "技术部",
    role: "后端工程师",
    status: "active",
    lastLogin: "2024-03-15 12:05:00",
    createdAt: "2024-01-25"
  },
  {
    id: "7",
    username: "zhouba",
    email: "zhouba@company.com",
    phone: "13800138007",
    realName: "周八",
    department: "产品部",
    role: "产品经理",
    status: "active",
    lastLogin: "2024-03-14 09:40:00",
    createdAt: "2024-02-03"
  }
];