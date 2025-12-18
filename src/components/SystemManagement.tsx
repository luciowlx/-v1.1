import { useState } from "react";
import { Splitter, Typography, Card, Row, Col, Statistic, theme, Button } from "antd";
import { DepartmentManagement } from "./DepartmentManagement";
import { RoleManagement } from "./RoleManagement";
import { PersonalCenter } from "./PersonalCenter";
import { ConfigurationManagement } from "./ConfigurationManagement";
import HtmlConfigManagement from "./HtmlConfigManagement";
import {
  Users,
  Shield,
  Settings,
  Building2,
  Cpu,
  FileText,
  UserPlus,
  Settings2
} from "lucide-react";
import { LogManagement } from "./LogManagement";

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

interface SystemManagementProps {
  defaultSubTab?: string;
}

export function SystemManagement({ defaultSubTab = "overview" }: SystemManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab);
  const { token } = useToken();

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
          <div style={{ padding: '0 12px' }}>
            <div className="mb-6">
              <Title level={3} style={{ marginBottom: 8 }}>系统管理</Title>
              <Text type="secondary">
                管理系统用户、角色权限和组织架构，配置个人账户信息
              </Text>
            </div>

            <Row gutter={[24, 24]}>
              {/* 统计卡片 */}
              <Col xs={24} md={8}>
                <Card
                  bordered={false}
                  hoverable
                  style={{
                    background: 'linear-gradient(135deg, #E6F7FF 0%, #BAE7FF 100%)',
                    borderRadius: 12,
                    height: '100%'
                  }}
                >
                  <Statistic
                    title={<div className="flex items-center gap-2"><Building2 size={20} className="text-blue-600" /> <span className="text-blue-900 font-medium">部门统计</span></div>}
                    value={12}
                    valueStyle={{ color: '#0050B3', fontWeight: 'bold' }}
                    suffix={<span style={{ fontSize: 14, color: '#69c0ff' }}>个</span>}
                  />
                  <div className="mt-4 text-blue-800 opacity-80 text-sm">
                    覆盖全公司各个业务单元
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card
                  bordered={false}
                  hoverable
                  style={{
                    background: 'linear-gradient(135deg, #F6FFED 0%, #D9F7BE 100%)',
                    borderRadius: 12,
                    height: '100%'
                  }}
                >
                  <Statistic
                    title={<div className="flex items-center gap-2"><Shield size={20} className="text-green-600" /> <span className="text-green-900 font-medium">角色统计</span></div>}
                    value={8}
                    valueStyle={{ color: '#389E0D', fontWeight: 'bold' }}
                    suffix={<span style={{ fontSize: 14, color: '#95de64' }}>种</span>}
                  />
                  <div className="mt-4 text-green-800 opacity-80 text-sm">
                    精细化的权限与角色控制
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card
                  bordered={false}
                  hoverable
                  style={{
                    background: 'linear-gradient(135deg, #FFF7E6 0%, #FFE7BA 100%)',
                    borderRadius: 12,
                    height: '100%'
                  }}
                  bodyStyle={{ padding: '20px 24px' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 font-medium text-orange-900">
                      <Users size={20} className="text-orange-600" /> 用户统计
                    </div>
                    <span className="text-2xl font-bold text-orange-700">156</span>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">启用</div>
                      <div className="text-lg font-semibold text-green-600">142</div>
                    </div>
                    <div className="text-center border-l border-orange-200 pl-4">
                      <div className="text-xs text-gray-500 mb-1">禁用</div>
                      <div className="text-lg font-semibold text-red-500">14</div>
                    </div>
                    <div className="text-center border-l border-orange-200 pl-4">
                      <div className="text-xs text-gray-500 mb-1">在线</div>
                      <div className="text-lg font-semibold text-blue-500">89</div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* 快速操作标题 */}
              <Col span={24} style={{ marginTop: 12 }}>
                <Title level={4}>快速操作</Title>
              </Col>

              {/* 快速操作卡片 */}
              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  className="group"
                  style={{ borderRadius: 12, textAlign: 'center' }}
                  onClick={() => setActiveSubTab('department')}
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Building2 size={24} className="text-blue-600" />
                  </div>
                  <div className="mt-3 font-medium text-gray-700">新建部门</div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  className="group"
                  style={{ borderRadius: 12, textAlign: 'center' }}
                  onClick={() => setActiveSubTab('role')}
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Shield size={24} className="text-green-600" />
                  </div>
                  <div className="mt-3 font-medium text-gray-700">创建角色</div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  className="group"
                  style={{ borderRadius: 12, textAlign: 'center' }}
                  onClick={() => setActiveSubTab('department')}
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <UserPlus size={24} className="text-orange-600" />
                  </div>
                  <div className="mt-3 font-medium text-gray-700">添加用户</div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  className="group"
                  style={{ borderRadius: 12, textAlign: 'center' }}
                  onClick={() => setActiveSubTab('config')}
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Settings2 size={24} className="text-purple-600" />
                  </div>
                  <div className="mt-3 font-medium text-gray-700">数据字典</div>
                </Card>
              </Col>
            </Row>
          </div>
        );
    }
  };

  return (
    <div className="h-full">
      <Splitter style={{ height: 'calc(100vh - 120px)', boxShadow: "0 0 10px rgba(0,0,0,0.05)", borderRadius: 8, border: '1px solid #f0f0f0' }}>
        <Splitter.Panel defaultSize="18%" min="15%" max="25%">
          <div className="h-full bg-white flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <span className="font-semibold text-gray-700 text-base">系统设置</span>
            </div>
            <div className="p-2 space-y-1 overflow-y-auto flex-1">
              {subTabs.map((tab) => {
                const IconComponent = tab.icon;
                const active = activeSubTab === tab.id;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm cursor-pointer transition-all duration-200
                      ${active
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <IconComponent size={18} />
                    <span>{tab.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Splitter.Panel>
        <Splitter.Panel>
          <div className="h-full p-6 bg-gray-50 overflow-y-auto">
            {renderContent()}
          </div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}
