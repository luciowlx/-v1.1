export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  realName: string;
  department: string;
  role: string;
  status: "active" | "inactive" | "locked";
  lastLogin: string;
  createdAt: string;
  avatar?: string;
}