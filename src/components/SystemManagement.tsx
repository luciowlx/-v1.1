import { useState } from "react";
import { Splitter, Typography } from "antd";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DepartmentManagement } from "./DepartmentManagement";
import { RoleManagement } from "./RoleManagement";
import { PersonalCenter } from "./PersonalCenter";
import { ConfigurationManagement } from "./ConfigurationManagement";
import HtmlConfigManagement from "./HtmlConfigManagement";
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
  Cpu,
  FileText
} from "lucide-react";
import { LogManagement } from "./LogManagement";

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
      name: "数据字典",
      icon: Settings2,
      description: "统一维护系统数据字典"
    },
    {
      id: "taskengine",
      name: "任务引擎",
      icon: Cpu,
      description: "迁移自顶部配置管理的任务引擎功能"
    },

    ,
    {
      id: "log",
      name: "日志管理",
      icon: FileText,
      description: "系统日志采集与管理"
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

  const renderTaskEngine = () => (
    <HtmlConfigManagement />
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
      case "taskengine":
        return renderTaskEngine();
      case "personal":
        return renderPersonalCenter();
      case "log":
        return <LogManagement />;
      case "overview":
      default:
        return (
          <div className="space-y-8">
            <div className="mb-2">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">系统管理</h1>
              <p className="text-gray-600">管理系统用户、角色权限和组织架构，配置个人账户信息</p>
            </div>
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
                      <span className="text-sm text-gray-600">启用用户</span>
                      <span className="text-lg font-semibold text-green-600">142</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">禁用用户</span>
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


              </div>
            </div>

            {/* 功能管理卡片区域已按需求移除 */}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Splitter style={{ height: 640, boxShadow: "0 0 10px rgba(0,0,0,0.05)" }}>
        <Splitter.Panel defaultSize="22%" min="16%" max="30%">
          <div className="h-full border-r border-gray-200 bg-white">
            <div className="p-4">
              <Typography.Title level={5}>系统子菜单</Typography.Title>
            </div>
            <div className="px-2 space-y-1">
              {subTabs.map((tab) => {
                const IconComponent = tab.icon;
                const active = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${active ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-700"
                      }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Splitter.Panel>
        <Splitter.Panel>
          <div className="h-full p-2">
            {renderContent()}
          </div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}
