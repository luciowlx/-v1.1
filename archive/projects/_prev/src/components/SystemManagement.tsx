import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DepartmentManagement } from "./DepartmentManagement";
import { RoleManagement } from "./RoleManagement";
import { PersonalCenter } from "./PersonalCenter";
import { ConfigurationManagement } from "./ConfigurationManagement";
import { 
  Users, 
  Shield, 
  UserCheck, 
  Settings,
  Building2,
  Key,
  UserCog,
  User,
  Plus,
  UserPlus,
  Settings2,
  ListChecks
} from "lucide-react";
import TaskTypeManagement from "./TaskTypeManagement";

interface SystemManagementProps {
  defaultSubTab?: string;
}

export function SystemManagement({ defaultSubTab = "overview" }: SystemManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab);

  const subTabs = [
    { 
      id: "overview", 
      name: "概览", 
      icon: Settings,
      description: "系统管理功能概览"
    },
    { 
      id: "department", 
      name: "部门与用户管理", 
      icon: Building2,
      description: "组织架构管理"
    },
    { 
      id: "role", 
      name: "角色管理", 
      icon: Shield,
      description: "权限角色配置"
    },
    { 
      id: "config", 
      name: "配置管理", 
      icon: Settings2,
      description: "业务字段配置管理"
    },
    {
      id: "tasktype",
      name: "任务类型管理",
      icon: ListChecks,
      description: "基于 JSON 的任务类型配置（管理员）"
    },
    { 
      id: "personal", 
      name: "个人中心", 
      icon: User,
      description: "个人信息设置"
    }
  ];

  const renderDepartmentManagement = () => (
    <DepartmentManagement />
  );

  const renderRoleManagement = () => (
    <RoleManagement />
  );

  const renderConfigurationManagement = () => (
    <ConfigurationManagement />
  );

  const renderTaskTypeManagement = () => (
    <TaskTypeManagement isAdmin={true} />
  );

  const renderPersonalCenter = () => (
    <PersonalCenter />
  );

  const renderContent = () => {
    switch (activeSubTab) {
      case "department":
        return renderDepartmentManagement();
      case "role":
        return renderRoleManagement();
      case "config":
        return renderConfigurationManagement();
      case "tasktype":
        return renderTaskTypeManagement();
      case "personal":
        return renderPersonalCenter();
      case "overview":
      default:
        return (
          <div className="space-y-8">
            {/* 系统统计信息 - 移到顶部 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="w-[200px] bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                    部门统计
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">总部门数</span>
                      <span className="text-2xl font-bold text-blue-600">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">活跃部门</span>
                      <span className="text-lg font-semibold text-green-600">11</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">停用部门</span>
                      <span className="text-lg font-semibold text-red-600">1</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-[200px] bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-green-600" />
                    角色统计
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">总角色数</span>
                      <span className="text-2xl font-bold text-green-600">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">系统角色</span>
                      <span className="text-lg font-semibold text-blue-600">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">自定义角色</span>
                      <span className="text-lg font-semibold text-purple-600">5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-[200px] bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Users className="h-5 w-5 mr-2 text-orange-600" />
                    用户统计
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">总用户数</span>
                      <span className="text-2xl font-bold text-orange-600">156</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">活跃用户</span>
                      <span className="text-lg font-semibold text-green-600">142</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">停用用户</span>
                      <span className="text-lg font-semibold text-red-600">14</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 快速操作 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border border-gray-200">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">新建部门</h4>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border border-gray-200">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">创建角色</h4>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border border-gray-200">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <UserPlus className="h-6 w-6 text-orange-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">添加用户</h4>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border border-gray-200">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">个人设置</h4>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 功能管理卡片区域已按需求移除 */}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 子功能导航 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {subTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeSubTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 内容区域 */}
      {renderContent()}
    </div>
  );
}