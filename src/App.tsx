import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { DataManagement } from "./components/data";
import { TaskManagement, TaskDetailFullPage, TaskCompare } from "./components/tasks";
import { ModelManagement, ModelTuning } from "./components/models";
import { SystemManagement } from "./components/SystemManagement";
import { PersonalCenterDialog } from "./components/PersonalCenterDialog";
import { PersonalizationSettings } from "./components/PersonalizationSettings";
import { SoloMode } from "./components/SoloMode";
import { FullPageView } from "./components/FullPageView";
import { ReportView } from "./components/ReportView";
import { DataDetailFullPage } from "./components/DataDetailFullPage";
import { NotebookManagement } from "./components/NotebookManagement";
import { NotebookDetail } from "./components/NotebookDetail";
import { JupyterLabMock, SSHRootTerminalMock } from "./components/NotebookMocks";
import { TASK_TYPES } from "./utils/taskTypes";
import { ProjectCard } from "./components/ProjectCard";
import { ProjectDetailCards } from "./components/ProjectDetailCards";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./components/ui/sheet";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
// 统计卡片复用
import { Card, CardContent } from "./components/ui/card";
import { X, Search, Grid3X3, List, ChevronDown, Calendar, Users, Database, TrendingUp, Clock, CheckCircle, Settings, UserPlus, Mail, Trash2, Eye, Archive, Copy, ToggleLeft, ToggleRight, Filter, ArrowUpDown, Plus, AlertTriangle, Link as LinkIcon, Code, Terminal } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { message, Modal } from "antd";
import { Checkbox } from "./components/ui/checkbox";
import FloatingAssistantEntry from "./components/FloatingAssistantEntry";
import TeamMemberSelector from "./components/TeamMemberSelector";
import { registeredUsers } from "./mock/users";
import { Popover, PopoverTrigger, PopoverContent } from "./components/ui/popover";
import { Calendar as DateRangeCalendar } from "./components/ui/calendar";
import { useLanguage } from "./i18n/LanguageContext";
import { parseHashParams, clearHash } from "./utils/deeplink";
import { Login } from "./components/Login";
import { getDatasetById } from "./mock/datasets";

/**
 * App 根组件
 * 功能：
 * - 管理顶层页面状态（导航、项目/数据/任务/模型等模块的视图与对话框）
 * - 集成 i18n 语言上下文，并动态设置浏览器 Tab 标题：根据当前语言切换为
 *   zh: "LimiX智能平台" / en: "Limix AI-powered ML Platform"
 * 参数：无
 * 返回：React 元素（页面主内容）
 */
export default function App() {
  const { t, lang } = useLanguage();
  // Login state - 使用 localStorage 持久化，确保新标签页直接进入系统
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('limix_is_logged_in') === 'true';
  });

  // Notebook 全局 Mock 状态
  const [activeNotebookMockView, setActiveNotebookMockView] = useState<'jupyter' | 'ssh' | null>(null);
  const [isNotebookConnectModalOpen, setIsNotebookConnectModalOpen] = useState(false);
  const [selectedNotebookForMock, setSelectedNotebookForMock] = useState<any>(null);

  const [activeTab, setActiveTab] = useState("系统总览");
  const [showModelTuning, setShowModelTuning] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    projectName: "",
    projectDescription: "",
    projectStartDate: "", // 项目开始日期
    projectEndDate: "", // 项目结束日期
    projectVisibility: "private", // 项目权限（private/public）
    teamLeader: "", // 团队负责人
    teamMembers: [] as string[] // 团队成员列表
  });

  // 项目管理页面状态
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [projectDateRange, setProjectDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  // 列表排序状态：支持按创建时间/更新时间排序
  const [projectSortField, setProjectSortField] = useState<"createdTime" | "updatedTime" | null>(null);
  const [projectSortOrder, setProjectSortOrder] = useState<"asc" | "desc">("asc");
  // 视图模式：默认优先列表
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);
  const [isProjectManageOpen, setIsProjectManageOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectDetailMode, setProjectDetailMode] = useState<'traditional' | 'auto'>('traditional');
  const [manageFormData, setManageFormData] = useState({
    projectName: "",
    projectDescription: "",
    teamLeader: "",
    projectStartDate: "",
    projectEndDate: "",
    projectVisibility: "private",
    teamMembers: [] as string[]
  });
  const [isDuplicateConfirmOpen, setIsDuplicateConfirmOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

  // 数据资产页面状态
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // 决策推理页面状态
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);

  // 个人中心状态
  const [isPersonalCenterOpen, setIsPersonalCenterOpen] = useState(false);
  const [isJupyterStandalone, setIsJupyterStandalone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'jupyter-mock') {
      setIsJupyterStandalone(true);
    }
  }, []);


  // 个性化设置状态
  const [isPersonalizationSettingsOpen, setIsPersonalizationSettingsOpen] = useState(false);

  // 当前项目状态
  const [currentProject, setCurrentProject] = useState<{
    name: string;
    mode: 'traditional' | 'auto';
  } | null>(null);

  // 系统管理子标签状态
  const [systemManagementSubTab, setSystemManagementSubTab] = useState("overview");

  // 全页面视图状态
  const [fullPageViewType, setFullPageViewType] = useState<'personal-center' | 'personalization-settings' | 'notification-center' | 'ai-assistant' | 'data-detail' | 'task-detail' | 'notebook-detail' | null>(null);
  const [isReportViewOpen, setIsReportViewOpen] = useState(false);
  // 新增：通知中心初始页签（notifications/activity），用于从看板打开活动中心
  const [notificationCenterInitialTab, setNotificationCenterInitialTab] = useState<'notifications' | 'activity' | null>(null);

  // 数据详情全页面状态
  const [selectedDatasetForFullPage, setSelectedDatasetForFullPage] = useState<any>(null);
  // 新增：数据详情初始 Tab（overview/versions/missing）
  const [dataDetailInitialTab, setDataDetailInitialTab] = useState<'overview' | 'versions' | 'missing' | null>(null);

  // 任务详情全页面状态
  const [selectedTaskForFullPage, setSelectedTaskForFullPage] = useState<any>(null);
  // 新增：Notebook 详情全页面状态
  const [selectedNotebookForFullPage, setSelectedNotebookForFullPage] = useState<any>(null);
  // 来自任务详情页的外部任务补丁（用于同步到列表）
  const [externalTaskPatch, setExternalTaskPatch] = useState<{ id: string; patch: Partial<any> } | null>(null);

  // AI助手已统一到 FullPageView（type='ai-assistant'），不再单独维护 isAIAssistantOpen

  // 团队成员由统一组件 TeamMemberSelector 管理（移除本地 availableMembers 与搜索状态）

  const projects = [
    {
      id: "PRJ001",
      title: "智能缺陷检测",
      mode: "协作模式",
      description: "基于用户产品智能推荐引荐用户中的智能推荐功能重新推荐",
      status: "进行中",
      stats: { datasets: 3, models: 7, tasks: 12 },
      dataset: "缺陷图像数据集",
      model: "CNN检测模型",
      task: "缺陷识别分类",
      date: "2024/9/18",
      members: 5,
      dataSource: "文件上传",
      color: "green" as const,
      owner: "张三",
      projectCycle: "2024/01/15 - 2024/03/15",
      createdTime: "2024/01/15 09:00:00",
      updatedTime: "2024/01/19 17:15:00",
      completeness: 75,
      totalTasks: 16,
      completedTasks: 12,
      recentActivities: [
        { time: "2024/1/19 17:15:00", activity: "智能推荐模型训练中", type: "training" },
        { time: "2024/1/18 22:30:00", activity: "API数据接入完成", type: "completed" },
        { time: "2024/1/17 19:20:00", activity: "数据清洗和验证", type: "processing" }
      ]
    },
    {
      id: "PRJ002",
      title: "能源预测",
      mode: "独立模式",
      description: "基于企业管理数据统计中的服务分支以外的智能推荐功能进而特制",
      status: "进行中",
      stats: { datasets: 1, models: 3, tasks: 6 },
      dataset: "能源消耗数据",
      model: "时间序列预测",
      task: "能源需求预测",
      date: "2024/1/8",
      members: 2,
      dataSource: "API接口",
      color: "blue" as const,
      owner: "李四",
      projectCycle: "2024/01/08 - 2024/02/28",
      createdTime: "2024/01/08 10:30:00",
      updatedTime: "2024/01/19 14:30:00",
      completeness: 60,
      totalTasks: 10,
      completedTasks: 6,
      recentActivities: [
        { time: "2024/1/19 14:30:00", activity: "预测模型优化中", type: "training" },
        { time: "2024/1/18 10:15:00", activity: "特征工程完成", type: "completed" },
        { time: "2024/1/17 16:45:00", activity: "数据预处理", type: "processing" }
      ]
    },
    {
      id: "PRJ003",
      title: "工艺优化分析",
      mode: "协作模式",
      description: "基于目标数据智能推荐中的分析化。量实最终优化产品分析",
      status: "已归档",
      stats: { datasets: 4, models: 6, tasks: 10 },
      dataset: "生产工艺数据",
      model: "优化算法模型",
      task: "工艺参数优化",
      date: "2024/7/9",
      members: 4,
      dataSource: "数据库",
      color: "purple" as const,
      owner: "王五",
      projectCycle: "2023/12/01 - 2024/01/19",
      createdTime: "2023/12/01 08:00:00",
      updatedTime: "2024/01/19 09:00:00",
      completeness: 100,
      totalTasks: 18,
      completedTasks: 18,
      recentActivities: [
        { time: "2024/1/19 09:00:00", activity: "项目已完成部署", type: "completed" },
        { time: "2024/1/18 15:20:00", activity: "模型测试通过", type: "completed" },
        { time: "2024/1/17 11:30:00", activity: "最终验证完成", type: "completed" }
      ]
    },
    {
      id: "PRJ004",
      title: "供应链优化分析",
      mode: "协作模式",
      description: "基于供应链数据进行库存优化、需求预测和成本分析",
      status: "进行中",
      stats: { datasets: 2, models: 4, tasks: 8 },
      dataset: "供应链数据",
      model: "库存优化模型",
      task: "供应链分析",
      date: "2024/6/15",
      members: 4,
      dataSource: "数据库",
      color: "orange" as const,
      owner: "赵六",
      projectCycle: "2024/01/10 - 2024/04/10",
      createdTime: "2024/01/10 14:00:00",
      updatedTime: "2024/01/19 17:15:00",
      completeness: 45,
      totalTasks: 18,
      completedTasks: 8,
      recentActivities: [
        { time: "2024/1/19 17:15:00", activity: "需求预测模型训练中", type: "training" },
        { time: "2024/1/18 22:30:00", activity: "API数据接入完成", type: "completed" },
        { time: "2024/1/17 19:20:00", activity: "数据清洗和验证", type: "processing" }
      ]
    }
  ];

  // 动态设置浏览器标题，随语言切换实时更新
  useEffect(() => {
    try {
      document.title = t("app.title") || "Limix";
    } catch { }
  }, [lang, t]);

  /**
   * 功能：过滤项目列表。
   * 规则：
   * - 文本搜索：匹配项目标题或描述（忽略大小写）；
   * - 状态筛选：
   *   - 当 statusFilter === 'all'（全部状态）时，默认隐藏“已归档”项目；
   *   - 其他情况严格匹配选定状态（进行中/已归档/已延期）；
   * - 负责人筛选：匹配 owner；
   * - 日期范围：按 createdTime（缺失则用 date）在选定范围内；
   * 返回：满足以上条件的项目集合，用于列表展示。
   */
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    // 当选择“全部状态”时，默认隐藏已归档项目；否则按选择的状态过滤
    const matchesStatus =
      statusFilter === "all"
        ? project.status !== "已归档"
        : project.status === statusFilter;
    const matchesOwner = ownerFilter === "all" || project.owner === ownerFilter;
    // 日期范围筛选：按项目创建时间 createdTime（若无则按 date）过滤
    const projectCreated = new Date(project.createdTime || project.date);
    const start = projectDateRange.start ? new Date(projectDateRange.start) : null;
    const end = projectDateRange.end ? new Date(projectDateRange.end) : null;
    const matchesDate = (!start || projectCreated >= start) && (!end || projectCreated <= end);

    return matchesSearch && matchesStatus && matchesOwner && matchesDate;
  });

  /**
   * 列表排序处理函数：切换“创建时间/更新时间”列的排序。
   * 参数：field - 要排序的字段（createdTime | updatedTime）。
   * 行为：
   * - 若重复点击同一字段，切换升序/降序；
   * - 若点击不同字段，切换到该字段并默认升序；
   * 返回值：无（更新组件内部的排序状态）。
   */
  const handleToggleProjectSort = (field: "createdTime" | "updatedTime") => {
    if (projectSortField === field) {
      setProjectSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setProjectSortField(field);
      setProjectSortOrder("asc");
    }
  };

  /**
   * 功能：根据当前排序字段与顺序，对过滤后的项目列表进行排序。
   * 规则：
   * - 无排序字段时返回原序；
   * - 按创建时间或更新时间排序，支持升序/降序；
   * 返回：排序后的项目数组。
   */
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!projectSortField) return 0;
    const aDate = new Date((projectSortField === "createdTime" ? a.createdTime : a.updatedTime) || a.date);
    const bDate = new Date((projectSortField === "createdTime" ? b.createdTime : b.updatedTime) || b.date);
    const diff = aDate.getTime() - bDate.getTime();
    return projectSortOrder === "asc" ? diff : -diff;
  });

  /**
   * 项目管理统计口径计算
   * 说明：统计卡片应与顶部筛选器（搜索/负责人/日期范围）保持一致，但不受“状态列筛选”影响。
   * 因此这里基于 projects 按搜索/负责人/日期三项过滤后进行聚合统计。
   */
  /**
   * 功能：为顶部统计卡片计算数据来源的过滤集合。
   * 说明：与顶部筛选器（搜索/负责人/日期范围）联动，但不受“状态列筛选”影响。
   * 返回：满足搜索/负责人/日期范围的项目集合，用于统计聚合。
   */
  const filteredProjectsForMetrics = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOwner = ownerFilter === "all" || project.owner === ownerFilter;
    const projectCreated = new Date(project.createdTime || project.date);
    const start = projectDateRange.start ? new Date(projectDateRange.start) : null;
    const end = projectDateRange.end ? new Date(projectDateRange.end) : null;
    const matchesDate = (!start || projectCreated >= start) && (!end || projectCreated <= end);
    return matchesSearch && matchesOwner && matchesDate;
  });

  const projectStats = [
    {
      label: "总项目",
      value: filteredProjectsForMetrics.length,
      icon: List
    },
    {
      label: "进行中",
      value: filteredProjectsForMetrics.filter(p => p.status === "进行中").length,
      icon: Clock
    },
    {
      label: "已归档",
      value: filteredProjectsForMetrics.filter(p => p.status === "已归档").length,
      icon: Archive
    },
    {
      label: "已延期",
      value: filteredProjectsForMetrics.filter(p => p.status === "已延期").length,
      icon: AlertTriangle
    }
  ];

  /**
   * 功能：触发一次项目列表的查询刷新（不改变筛选器状态）。
   * 场景：用户点击“查询”按钮，希望基于当前顶部筛选器（搜索、负责人、日期范围）的值显式刷新列表。
   * 说明：筛选本身已是响应式，这里通过浅拷贝 projectDateRange 以更新引用驱动重新渲染，避免误改状态。
   */
  const handleApplyProjectQuery = () => {
    setProjectDateRange(prev => ({ ...prev }));
  };

  /**
   * 功能：重置项目管理页顶部筛选器为默认值。
   * 重置范围：搜索关键词、负责人、日期范围；同时复位列表状态筛选（若当前使用）。
   */
  const handleResetProjectFilters = () => {
    setSearchQuery("");
    setOwnerFilter("all");
    setProjectDateRange({ start: "", end: "" });
    // 若使用列表状态筛选，统一复位为“全部状态”
    try {
      // @ts-ignore: 若状态筛选存在，复位到默认值
      setStatusFilter && setStatusFilter("all");
    } catch (_) {
      // 安全兜底：忽略不存在的 setter
    }
  };

  const handleNotebookConnect = (instance: any, type: 'jupyter' | 'vscode' | 'ssh') => {
    setSelectedNotebookForMock(instance);
    if (type === 'vscode') {
      setIsNotebookConnectModalOpen(true);
    } else if (type === 'jupyter') {
      setActiveNotebookMockView('jupyter');
    } else if (type === 'ssh') {
      setActiveNotebookMockView('ssh');
    }
  };

  const handleCreateProject = () => {
    // 验证必填字段

    if (!projectFormData.projectName.trim()) {
      alert("请输入项目名称");
      return;
    }
    if (!projectFormData.projectStartDate) {
      alert("请选择项目开始日期");
      return;
    }
    if (!projectFormData.projectEndDate) {
      alert("请选择项目结束日期");
      return;
    }
    if (new Date(projectFormData.projectStartDate) >= new Date(projectFormData.projectEndDate)) {
      alert("项目结束日期必须晚于开始日期");
      return;
    }
    if (!projectFormData.teamLeader.trim()) {
      alert("请选择团队负责人");
      return;
    }

    // 处理创建项目逻辑
    console.log("创建项目:", projectFormData);

    // 设置当前项目
    setCurrentProject({
      name: projectFormData.projectName,
      mode: 'traditional'
    });

    setIsCreateProjectOpen(false);
    // 重置表单
    setProjectFormData({
      projectName: "",
      projectDescription: "",
      projectStartDate: "",
      projectEndDate: "",
      projectVisibility: "private",
      teamLeader: "当前用户",
      teamMembers: []
    });

  };

  const handleCancelProject = () => {
    setIsCreateProjectOpen(false);
    // 重置表单
    setProjectFormData({
      projectName: "",
      projectDescription: "",
      projectStartDate: "",
      projectEndDate: "",
      projectVisibility: "private",
      teamLeader: "当前用户",
      teamMembers: []
    });

  };

  // 团队成员管理已由 TeamMemberSelector 统一处理（移除本地添加逻辑）

  // 团队成员移除逻辑也由 TeamMemberSelector 统一处理（移除本地移除函数）

  // 成员过滤与搜索逻辑由 TeamMemberSelector 内部实现（移除本地 filteredMembers）

  const handleViewProjectDetails = (project: any) => {
    setSelectedProject(project);
    setIsProjectDetailOpen(true);
  };

  const handleManageProject = (project: any) => {
    setSelectedProject(project);
    setManageFormData({
      projectName: project.title,
      projectDescription: project.description,
      teamLeader: project.teamLeader || "",
      projectStartDate: project.startDate || "",
      projectEndDate: project.endDate || "",
      projectVisibility: project.visibility || "private",
      teamMembers: Array.isArray(project?.members) ? project.members : []
    });
    setIsProjectManageOpen(true);
  };

  const handleSaveProjectSettings = () => {
    // 处理保存项目设置逻辑
    console.log("保存项目设置:", {
      project: selectedProject,
      settings: manageFormData
    });
    setIsProjectManageOpen(false);
  };

  const handleArchiveProject = () => {
    // 显示归档确认弹窗
    setIsArchiveConfirmOpen(true);
  };

  // 复制项目选项（默认全部勾选）
  const [duplicateOptions, setDuplicateOptions] = useState({
    copyTasks: true,
    copyDatasets: true,
    copyMembers: true,
  });

  const toggleDuplicateOption = (key: keyof typeof duplicateOptions, value: boolean) => {
    setDuplicateOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirmArchive = () => {
    // 处理归档项目逻辑
    console.log("归档项目:", selectedProject?.title);
    setIsArchiveConfirmOpen(false);
    setIsProjectManageOpen(false);
    // 这里可以添加实际的项目归档逻辑
  };

  const handleDuplicateProject = () => {
    // 显示复制确认弹窗
    setIsDuplicateConfirmOpen(true);
  };

  const handleConfirmDuplicate = () => {
    // 处理复制项目逻辑
    const duplicatedProjectName = `${selectedProject?.title} - 副本`;
    const { copyTasks, copyDatasets, copyMembers } = duplicateOptions;
    const onlyBasicInfo = !copyTasks && !copyDatasets && !copyMembers;
    console.log("复制项目:", duplicatedProjectName, {
      copyTasks,
      copyDatasets,
      copyMembers,
      strategy: onlyBasicInfo ? "仅复制基础信息（项目名称与描述）" : "复制所选内容",
    });
    setIsDuplicateConfirmOpen(false);
    setIsProjectManageOpen(false);
    // 这里可以添加实际的项目复制逻辑
  };

  // 成员邀请逻辑已由 TeamMemberSelector 统一管理，无需单独通过邮箱邀请

  const handleCancelManage = () => {
    setIsProjectManageOpen(false);
    setManageFormData({
      projectName: "",
      projectDescription: "",
      teamLeader: "",
      projectStartDate: "",
      projectEndDate: "",
      projectVisibility: "private",
      teamMembers: []
    });
  };

  // 个人中心和退出登录处理函数
  const handleOpenPersonalCenter = () => {
    setFullPageViewType('personal-center');
  };

  const handleLogout = () => {
    // 处理退出登录逻辑
    console.log("用户退出登录");
    localStorage.removeItem('limix_is_logged_in');
    setIsLoggedIn(false);
    alert("退出登录成功！");
  };

  // 个性化设置处理函数
  const handleOpenPersonalizationSettings = () => {
    setFullPageViewType('personalization-settings');
  };

  const handleClosePersonalizationSettings = () => {
    setIsPersonalizationSettingsOpen(false);
  };

  // 通知中心处理函数
  const handleOpenNotificationCenter = () => {
    setNotificationCenterInitialTab('notifications');
    setFullPageViewType('notification-center');
  };

  // 活动中心处理函数：打开通知中心并切换到“活动”Tab
  const handleOpenActivityCenter = () => {
    setNotificationCenterInitialTab('activity');
    setFullPageViewType('notification-center');
  };

  // 项目管理总览：切换到“项目管理”标签，不弹创建项目弹窗
  const handleGoToProjectOverview = () => {
    setActiveTab("项目管理");
  };

  // 关闭全页面视图
  const handleCloseFullPageView = () => {
    setFullPageViewType(null);
    setSelectedDatasetForFullPage(null);
    setSelectedTaskForFullPage(null);
    // 同步重置数据详情初始页签
    setDataDetailInitialTab(null);
    // 重置通知中心初始页签
    setNotificationCenterInitialTab(null);
    // 清理哈希，回到基础地址
    clearHash();
  };

  // 数据详情全页面处理函数
  const handleOpenDataDetailFullPage = (dataset: any, initialTab?: 'overview' | 'versions' | 'missing') => {
    setSelectedDatasetForFullPage(dataset);
    // 根据调用方传入的初始页签进行设置，默认跳转到概览
    setDataDetailInitialTab(initialTab ?? 'overview');
    setFullPageViewType('data-detail');
  };

  // 任务详情全页面处理函数
  const handleOpenTaskDetailFullPage = (task: any) => {
    setSelectedTaskForFullPage(task);
    setFullPageViewType('task-detail');
  };

  // Notebook 详情全页面处理函数
  const handleOpenNotebookDetailFullPage = (notebook: any) => {
    setSelectedNotebookForFullPage(notebook);
    setFullPageViewType('notebook-detail');
  };

  /**
   * 接收 TaskDetailFullPage 的任务补丁，并进行双向同步：
   * 1) 合并到本地 selectedTaskForFullPage，确保详情页即时回显；
   * 2) 通过 externalTaskPatch 将补丁下发至 TaskManagement，同步更新任务列表。
   *
   * 参数：
   * - taskId: string - 需要合并补丁的任务 ID。
   * - patch: Partial<any> - 任务的局部更新内容（如 status、progress、hasQueuedBefore 等）。
   * 返回值：void
   */
  const handleTaskPatched = (taskId: string, patch: Partial<any>) => {
    setSelectedTaskForFullPage((prev: any) => {
      if (!prev) return prev;
      if (prev.id !== taskId) return prev;
      return { ...prev, ...patch };
    });
    setExternalTaskPatch({ id: taskId, patch });
  };

  const handleOpenSoloMode = () => {
    // 如果没有当前项目，创建一个默认的自动模式项目
    if (!currentProject || currentProject.mode !== 'auto') {
      setCurrentProject({
        name: "智能分析项目",
        mode: 'auto'
      });
    }
  };

  // 智能助手入口（统一为 FullPageView -> ai-assistant）
  const handleOpenAIAssistant = () => {
    setFullPageViewType('ai-assistant');
  };

  // 路由加载状态（用于过渡与加载提示）
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  /**
   * 在应用加载与 hash 变化时，解析哈希参数并打开对应的全屏详情页。
   * 支持：#data-detail?id=123&tab=versions
   */
  useEffect(() => {
    const applyHashRoute = () => {
      const { view, id, tab } = parseHashParams();
      if (view === 'data-detail' && id) {
        const datasetId = Number(id);
        const dataset = getDatasetById(datasetId) || {
          id: datasetId,
          title: `数据集 ${id}`,
          description: '原型演示：未在共享数据源中找到该数据集，使用占位信息展示。',
          categories: [],
          tags: [],
          formats: [],
          size: '-',
          rows: '-',
          columns: '-',
          completeness: 0,
          source: '文件上传',
          version: 'v1.0',
          updateTime: '',
          status: 'success',
          color: 'border-l-blue-500'
        };
        setIsRouteLoading(true);
        // 轻微延时以展示加载过渡（模拟大数据加载的启动反馈）
        setTimeout(() => {
          setIsRouteLoading(false);
          handleOpenDataDetailFullPage(dataset, tab ?? 'overview');
        }, 150);
      } else if (view === 'notebook-detail' && id) {
        const mockNotebook = {
          id: id,
          name: id.startsWith('NB') ? `实例 ${id}` : '缺陷检测模型开发',
          status: 'Running',
          image: 'PyTorch 2.1.0-CUDA 11.8',
          spec: 'NVIDIA A100 (40GB) x 1 | 12 vCPU | 64GB',
          url: `https://jupyter.limix.ai/${id.toLowerCase()}`
        };
        setIsRouteLoading(true);
        setTimeout(() => {
          setIsRouteLoading(false);
          setActiveTab("开发空间"); // 同步切换后台页签
          handleOpenNotebookDetailFullPage(mockNotebook);
        }, 150);
      }
    };
    applyHashRoute();
    window.addEventListener('hashchange', applyHashRoute);
    return () => window.removeEventListener('hashchange', applyHashRoute);
  }, []);

  const renderContent = () => {
    console.log("当前活动标签:", activeTab); // 添加调试日志

    // 如果当前有项目且为自动模式，显示智能界面
    if (currentProject && currentProject.mode === 'auto') {
      return <SoloMode projectName={currentProject.name} />;
    }

    switch (activeTab) {
      case "系统总览":
        return (
          <div>
            <Dashboard
              onNavigateToProjectManagement={() => {
                setActiveTab("项目管理");
                setIsCreateProjectOpen(true);
              }}
              onNavigateToDataManagement={() => {
                setActiveTab("数据资产");
                setIsUploadDialogOpen(true);
              }}
              onNavigateToTaskManagement={() => {
                setActiveTab("决策推理");
                setIsCreateTaskDialogOpen(true);
              }}
              onNavigateToModelManagement={() => {
                setActiveTab("模型管理");
                setShowModelTuning(true);
              }}
              // 新增：从系统总览打开统一活动中心
              onOpenActivityCenter={handleOpenActivityCenter}
              // 新增：最近项目-查看全部 跳转到项目管理总览
              onNavigateToProjectOverview={handleGoToProjectOverview}
            />
          </div>
        );
      case "项目管理":
        return (
          <div>
            {/* 页头部分 */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">项目管理</h1>
              <p className="text-gray-600">管理您的机器学习项目，跟踪进度并与团队协作</p>
            </div>

            {/* 统计指标卡片（遵循顶部筛选：搜索/负责人/日期范围；不受状态列筛选影响） */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {projectStats.map((stat, index) => (
                <Card key={index} className="w-[200px]">
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <stat.icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 搜索、筛选与视图切换（左侧工具 + 右侧视图切换），移动端可自动换行 */}
            <div className="mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                {/* 左侧：搜索、负责人、日期、查询/重置 */}
                <div className="flex items-center gap-3 flex-wrap md:flex-nowrap flex-1">
                  {/* 搜索框 */}
                  <div className="relative w-[240px] md:w-[280px] shrink-0">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="搜索项目"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-10 md:h-12"
                    />
                  </div>

                  {/* Status Filter: 状态筛选 (Moved from Table Header) */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 md:w-36 shrink-0">
                      <SelectValue placeholder="状态" />
                      <ChevronDown className="w-4 h-4" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="进行中">进行中</SelectItem>
                      <SelectItem value="已归档">已归档</SelectItem>
                      <SelectItem value="已延期">已延期</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Date Filter: 日期范围选择 */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[240px] md:w-[260px] justify-between shrink-0">
                        <span className="truncate text-left">
                          {projectDateRange.start && projectDateRange.end
                            ? `${projectDateRange.start} - ${projectDateRange.end}`
                            : '开始日期 - 结束日期'}
                        </span>
                        <Calendar className="h-4 w-4 text-gray-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[640px] p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            readOnly
                            placeholder="开始日期"
                            value={projectDateRange.start || ''}
                            className="w-48"
                          />
                          <span className="text-gray-500">-</span>
                          <Input
                            readOnly
                            placeholder="结束日期"
                            value={projectDateRange.end || ''}
                            className="w-48"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setProjectDateRange({ start: '', end: '' })}
                          >
                            清除
                          </Button>
                        </div>
                        <DateRangeCalendar
                          mode="range"
                          numberOfMonths={2}
                          initialFocus
                          defaultMonth={projectDateRange.start ? new Date(projectDateRange.start) : new Date()}
                          selected={{
                            from: projectDateRange.start ? new Date(projectDateRange.start) : undefined,
                            to: projectDateRange.end ? new Date(projectDateRange.end) : undefined,
                          }}
                          onSelect={(range: any) => {
                            const startDate = range?.from ? new Date(range.from) : undefined;
                            const endDate = range?.to ? new Date(range.to) : undefined;
                            const fmt = (d: Date | undefined) =>
                              d
                                ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                                : '';
                            setProjectDateRange({ start: fmt(startDate), end: fmt(endDate) });
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* 查询 / 重置按钮：位于日期选择器之后；高度与日期对齐 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="default"
                      onClick={handleApplyProjectQuery}
                      className="h-10 md:h-12 px-4"
                    >
                      查询
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleResetProjectFilters}
                      className="h-10 md:h-12 px-4"
                    >
                      重置
                    </Button>
                  </div>
                </div>

                {/* 右侧：视图切换按钮（靠右展示） + 创建项目 */}
                <div className="flex items-center gap-2 ml-auto shrink-0">
                  {/* 视图切换：列表在前、网格在后 */}
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    onClick={() => setViewMode("list")}
                    className="px-3 h-10 md:h-12"
                  >
                    <List className="w-4 h-4 mr-1" />
                    列表
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    onClick={() => setViewMode("grid")}
                    className="px-3 h-10 md:h-12"
                  >
                    <Grid3X3 className="w-4 h-4 mr-1" />
                    网格
                  </Button>
                  {/* 新增：创建项目按钮（顶栏右侧） */}
                  <Button
                    variant="default"
                    onClick={() => setIsCreateProjectOpen(true)}
                    className="px-4 h-10 md:h-12 ml-2"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    创建项目
                  </Button>
                </div>
              </div>
            </div>

            {/* 项目内容区域 */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 已移除：网格视图中的“创建新项目”卡片，统一由顶栏按钮触发创建 */}
                {/* 保留项目卡片列表 */}

                {/* 项目卡片 */}
                {sortedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    title={project.title}
                    description={project.description}
                    status={project.status}
                    stats={project.stats}
                    date={project.date}
                    members={project.members}
                    dataSource={project.dataSource}
                    color={project.color}
                    onViewDetails={() => handleViewProjectDetails(project)}
                    onManage={() => handleManageProject(project)}
                  />
                ))}
              </div>
            ) : (
              /* 列表视图 */
              <div className="bg-white rounded-lg border overflow-x-auto">
                <div className="grid gap-2 px-6 py-4 border-b border-gray-200 text-sm font-medium text-gray-500 min-w-max" style={{ gridTemplateColumns: "80px 200px 100px 80px 150px 150px 150px 100px 120px 120px 120px 100px" }}>
                  <div>项目ID</div>
                  <div>项目名称</div>
                  <div>项目模式</div>
                  <div>状态</div>
                  <div>数据集</div>
                  <div>模型</div>
                  <div>任务</div>
                  <div className="flex items-center gap-1">
                    <span>负责人</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" aria-label="负责人筛选">
                          <Filter className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-44 p-2" align="start">
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500">负责人筛选</div>
                          <Select value={ownerFilter} onValueChange={(v: string) => setOwnerFilter(v)}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="选择负责人" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">全部负责人</SelectItem>
                              <SelectItem value="张三">张三</SelectItem>
                              <SelectItem value="李四">李四</SelectItem>
                              <SelectItem value="王五">王五</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>项目周期</div>
                  <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => handleToggleProjectSort("createdTime")}>
                    <span>创建时间</span>
                    <ArrowUpDown className={`h-3 w-3 ${projectSortField === "createdTime" ? "text-blue-600" : "text-gray-400"}`} />
                  </div>
                  <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => handleToggleProjectSort("updatedTime")}>
                    <span>更新时间</span>
                    <ArrowUpDown className={`h-3 w-3 ${projectSortField === "updatedTime" ? "text-blue-600" : "text-gray-400"}`} />
                  </div>
                  <div>操作</div>
                </div>

                {/* 已移除：列表内的“创建新项目”占位行，改为顶栏右侧按钮触发 */}

                {sortedProjects.map((project, index) => (
                  <div key={index} className="grid gap-2 px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors min-w-max" style={{ gridTemplateColumns: "80px 200px 100px 80px 150px 150px 150px 100px 120px 120px 120px 100px" }}>
                    <div className="flex items-center text-sm text-gray-700">{project.id}</div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{project.title}</div>
                      <div className="text-xs text-gray-500">{project.description}</div>
                    </div>
                    <div className="flex items-center text-xs text-gray-700">{project.mode}</div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${project.status === "进行中" ? "bg-green-100 text-green-700" :
                        project.status === "已归档" ? "bg-gray-100 text-gray-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-700">{project.stats.datasets}</div>
                    <div className="flex items-center text-xs text-gray-700">{project.stats.models}</div>
                    <div className="flex items-center text-xs text-gray-700">{project.stats.tasks}</div>
                    <div className="flex items-center text-xs text-gray-700">{project.owner}</div>
                    <div className="flex items-center text-xs text-gray-500">{project.projectCycle}</div>
                    <div className="flex items-center text-xs text-gray-500">{project.createdTime}</div>
                    <div className="flex items-center text-xs text-gray-500">{project.updatedTime}</div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleViewProjectDetails(project)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleManageProject(project)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
            }

            {/* 创建项目抽屉 */}
            <Sheet open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
              <SheetContent className="w-[900px] max-w-[90vw] max-h-[85vh] p-0 overflow-y-auto" side="right">
                <SheetHeader className="px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <SheetTitle>创建新项目</SheetTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelProject}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <SheetDescription>
                    填写项目信息以创建新的AI模型项目
                  </SheetDescription>
                </SheetHeader>

                <div className="px-6 py-6 space-y-6">
                  {/* 项目模式选择（已移除） */}

                  {/* 项目名称和团队负责人 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName" className="text-sm font-medium">
                        项目名称 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="projectName"
                        placeholder="请输入项目名称"
                        value={projectFormData.projectName}
                        onChange={(e) => setProjectFormData({ ...projectFormData, projectName: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        团队负责人 <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={projectFormData.teamLeader}
                        onValueChange={(value: string) => setProjectFormData({ ...projectFormData, teamLeader: value })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="选择团队负责人" />
                        </SelectTrigger>
                        <SelectContent>
                          {registeredUsers.map((u) => (
                            <SelectItem key={u.id} value={u.realName}>
                              {u.realName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 项目描述 */}
                  <div className="space-y-2">
                    <Label htmlFor="projectDescription" className="text-sm font-medium">
                      项目描述
                    </Label>
                    <Textarea
                      id="projectDescription"
                      placeholder="请输入项目描述（可选）"
                      value={projectFormData.projectDescription}
                      onChange={(e) => setProjectFormData({ ...projectFormData, projectDescription: e.target.value })}
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  {/* 项目周期 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      项目周期 <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="startDate" className="text-xs text-gray-600">开始日期</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={projectFormData.projectStartDate}
                          onChange={(e) => setProjectFormData({ ...projectFormData, projectStartDate: e.target.value })}
                          className="h-10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate" className="text-xs text-gray-600">结束日期</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={projectFormData.projectEndDate}
                          onChange={(e) => setProjectFormData({ ...projectFormData, projectEndDate: e.target.value })}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 项目权限设置和团队成员搜索 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        项目权限 <span className="text-red-500">*</span>
                      </Label>
                      <RadioGroup
                        value={projectFormData.projectVisibility}
                        onValueChange={(value: string) => setProjectFormData({ ...projectFormData, projectVisibility: value })}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="private" id="private" />
                          <Label htmlFor="private" className="text-sm cursor-pointer">
                            私有项目 - 仅团队成员可访问
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="public" id="public" />
                          <Label htmlFor="public" className="text-sm cursor-pointer">
                            公开项目 - 组织内所有成员可查看
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <TeamMemberSelector
                      selectedIds={projectFormData.teamMembers}
                      onChange={(ids) => setProjectFormData({ ...projectFormData, teamMembers: ids })}
                      currentUserRole="项目经理"
                    />
                  </div>
                </div>

                {/* 底部按钮 */}
                <div className="px-6 py-4 border-t flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleCancelProject}>
                    取消
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    className="bg-blue-500 hover:bg-blue-600"
                    disabled={
                      !projectFormData.projectName ||
                      !projectFormData.projectStartDate ||
                      !projectFormData.projectEndDate ||
                      !projectFormData.projectVisibility ||
                      !projectFormData.teamLeader
                    }
                  >
                    创建项目
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* 项目详情弹窗 */}
            <Dialog open={isProjectDetailOpen} onOpenChange={setIsProjectDetailOpen}>
              <DialogContent className="sm:max-w-[1200px] p-0" aria-describedby="project-detail-description">
                <DialogHeader className="px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <DialogTitle className="text-xl">{selectedProject?.title}</DialogTitle>
                      <Badge variant={selectedProject?.status === "进行中" ? "default" : "secondary"}>
                        {selectedProject?.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsProjectDetailOpen(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{selectedProject?.description}</p>
                </DialogHeader>

                <div className="px-6 py-4">
                  <ProjectDetailCards
                    project={selectedProject}
                    mode={projectDetailMode}
                    onNavigateToData={() => {
                      setIsProjectDetailOpen(false);
                      setActiveTab("数据资产");
                    }}
                    onNavigateToTasks={() => {
                      setIsProjectDetailOpen(false);
                      setActiveTab("决策推理");
                    }}
                    onNavigateToModels={() => {
                      setIsProjectDetailOpen(false);
                      setActiveTab("模型管理");
                    }}
                    onQuickPredict={() => {
                      // TODO: 实现快速预测功能
                      console.log("快速预测功能");
                    }}
                    onViewReports={() => {
                      // 打开查看报表全屏视图，并自动执行清洗-分析-展示流程
                      setIsReportViewOpen(true);
                    }}
                  />
                </div>

                <DialogDescription id="project-detail-description" className="sr-only">
                  查看项目详细信息，包括统计数据、进度和最近活动
                </DialogDescription>
              </DialogContent>
            </Dialog>

            {/* 项目管理弹窗 */}
            <Sheet open={isProjectManageOpen} onOpenChange={setIsProjectManageOpen}>
              <SheetContent className="w-3/4 sm:max-w-sm max-h-[85vh] p-0 overflow-y-auto" side="right">
                <SheetHeader className="px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-blue-600" />
                      <SheetTitle>项目设置</SheetTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelManage}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <SheetDescription>
                    管理项目设置，包括基本信息、团队成员和权限配置
                  </SheetDescription>
                </SheetHeader>

                <div className="px-6 py-4 space-y-8">
                  {/* 基本信息 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="text-lg">📋</div>
                      <h3 className="text-lg font-medium">基本信息</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="manage-project-name" className="text-sm">项目名称</Label>
                        <Input
                          id="manage-project-name"
                          value={manageFormData.projectName}
                          onChange={(e) => setManageFormData({ ...manageFormData, projectName: e.target.value })}
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="manage-project-description" className="text-sm">项目描述</Label>
                        <Textarea
                          id="manage-project-description"
                          value={manageFormData.projectDescription}
                          onChange={(e) => setManageFormData({ ...manageFormData, projectDescription: e.target.value })}
                          className="min-h-[80px] resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="manage-team-leader" className="text-sm">团队负责人 <span className="text-red-500">*</span></Label>
                        <Select value={manageFormData.teamLeader} onValueChange={(value: string) => setManageFormData({ ...manageFormData, teamLeader: value })}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="选择团队负责人" />
                          </SelectTrigger>
                          <SelectContent>
                            {registeredUsers.map((u) => (
                              <SelectItem key={u.id} value={u.realName}>
                                {u.realName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">项目周期 <span className="text-red-500">*</span></Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="manage-start-date" className="text-xs text-gray-600">开始日期</Label>
                            <Input
                              id="manage-start-date"
                              type="date"
                              value={manageFormData.projectStartDate}
                              onChange={(e) => setManageFormData({ ...manageFormData, projectStartDate: e.target.value })}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="manage-end-date" className="text-xs text-gray-600">结束日期</Label>
                            <Input
                              id="manage-end-date"
                              type="date"
                              value={manageFormData.projectEndDate}
                              onChange={(e) => setManageFormData({ ...manageFormData, projectEndDate: e.target.value })}
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 团队管理 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="text-lg">👥</div>
                      <h3 className="text-lg font-medium">团队管理</h3>
                    </div>

                    <TeamMemberSelector
                      selectedIds={manageFormData.teamMembers ?? []}
                      onChange={(ids) => setManageFormData({ ...manageFormData, teamMembers: ids })}
                      projectId={selectedProject?.id ?? ''}
                      currentUserRole="项目经理"
                    />
                  </div>

                  {/* 项目权限 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="text-lg">🔒</div>
                      <h3 className="text-lg font-medium">项目权限</h3>
                    </div>

                    <RadioGroup
                      value={manageFormData.projectVisibility}
                      onValueChange={(value: string) => setManageFormData({ ...manageFormData, projectVisibility: value })}
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="private" id="private" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="private" className="text-sm font-medium cursor-pointer">
                            私有项目
                          </Label>
                          <p className="text-sm text-gray-500">
                            只有团队成员可以访问
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="public" id="public" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="public" className="text-sm font-medium cursor-pointer">
                            公开项目
                          </Label>
                          <p className="text-sm text-gray-500">
                            所有人都可以查看
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* 底部按钮 */}
                <div className="px-6 py-4 border-t flex justify-between">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleArchiveProject}
                      className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <Archive className="h-4 w-4" />
                      归档项目
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDuplicateProject}
                      className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Copy className="h-4 w-4" />
                      复制项目
                    </Button>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleCancelManage}>
                      取消
                    </Button>
                    <Button
                      onClick={handleSaveProjectSettings}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      保存设置
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* 复制项目确认弹窗 */}
            <Dialog open={isDuplicateConfirmOpen} onOpenChange={setIsDuplicateConfirmOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Copy className="h-5 w-5 text-blue-600" />
                    复制项目
                  </DialogTitle>
                  <DialogDescription>
                    确认要复制项目 "{selectedProject?.title}" 吗？
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      <strong>新项目名称：</strong>{selectedProject?.title} - 副本
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      可选择复制任务、数据集与项目成员；若取消所有选项，则仅复制项目基础信息（名称与描述）。
                    </div>
                  </div>

                  {/* 复制选项（默认全部勾选） */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">选择需要复制的内容（可选）：</div>
                    <div className="grid grid-cols-1 gap-3">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <Checkbox
                          checked={duplicateOptions.copyTasks}
                          onCheckedChange={(checked: boolean) => toggleDuplicateOption("copyTasks", checked)}
                          aria-label="复制项目下的任务"
                        />
                        <span className="text-sm">复制项目下的任务</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <Checkbox
                          checked={duplicateOptions.copyDatasets}
                          onCheckedChange={(checked: boolean) => toggleDuplicateOption("copyDatasets", checked)}
                          aria-label="复制项目下的数据集"
                        />
                        <span className="text-sm">复制项目下的数据集</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <Checkbox
                          checked={duplicateOptions.copyMembers}
                          onCheckedChange={(checked: boolean) => toggleDuplicateOption("copyMembers", checked)}
                          aria-label="复制项目成员"
                        />
                        <span className="text-sm">复制项目成员</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsDuplicateConfirmOpen(false)}>
                    取消
                  </Button>
                  <Button
                    onClick={handleConfirmDuplicate}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    确认复制
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* 归档项目确认弹窗 */}
            <Dialog open={isArchiveConfirmOpen} onOpenChange={setIsArchiveConfirmOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Archive className="h-5 w-5 text-orange-600" />
                    归档项目
                  </DialogTitle>
                  <DialogDescription>
                    确认要归档项目 "{selectedProject?.title}" 吗？
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="text-sm text-orange-800">
                      <strong>注意：</strong>归档后的项目将被移至归档区域
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      归档的项目可以随时恢复，但将不会在主项目列表中显示
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsArchiveConfirmOpen(false)}>
                    取消
                  </Button>
                  <Button
                    onClick={handleConfirmArchive}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    确认归档
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div >
        );
      case "数据资产":
        return (
          <div className="relative">
            <DataManagement
              onNavigateToPreprocessing={() => {
                // 这里可以添加额外的跳转逻辑，比如显示通知等
                console.log("已跳转到数据预处理页面");
              }}
              isUploadDialogOpen={isUploadDialogOpen}
              onUploadDialogClose={() => setIsUploadDialogOpen(false)}
              onOpenDataDetailFullPage={handleOpenDataDetailFullPage}
            />
            {isRouteLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center transition-opacity">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                  <div className="text-sm text-gray-600">正在加载页面…</div>
                </div>
              </div>
            )}
          </div>
        );
      case "决策推理":
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t('task.title')}</h1>
              <p className="text-gray-600">创建、监控和管理AI模型训练任务，实时跟踪任务进度和性能指标</p>
            </div>
            <TaskManagement
              isCreateTaskDialogOpen={isCreateTaskDialogOpen}
              onCreateTaskDialogChange={(open: boolean) => setIsCreateTaskDialogOpen(open)}
              onOpenTaskDetailFullPage={handleOpenTaskDetailFullPage}
              externalTaskPatch={externalTaskPatch}
            />
          </div>
        );
      case "模型管理":
        console.log("正在渲染模型管理页面, showModelTuning:", showModelTuning); // 添加调试日志
        if (showModelTuning) {
          console.log("显示模型微调页面"); // 添加调试日志
          return (
            <ModelTuning onBack={() => setShowModelTuning(false)} />
          );
        }
        console.log("显示模型管理主页面"); // 添加调试日志
        return (
          <ModelManagement onOpenModelTuning={() => setShowModelTuning(true)} />
        );
      case "系统管理":
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">系统管理</h1>
              <p className="text-gray-600">管理系统用户、角色权限和组织架构，配置个人账户信息</p>
            </div>
            <SystemManagement defaultSubTab={systemManagementSubTab} />
          </div>
        );
      case "开发空间":
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">开发空间</h1>
              <p className="text-gray-600">管理您的 Notebook 开发环境，支持 JupyterLab、SSH 及 VS Code 接入</p>
            </div>
            <NotebookManagement
              onOpenDetail={handleOpenNotebookDetailFullPage}
              onConnect={handleNotebookConnect}
            />
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-xl text-gray-600">{activeTab} 页面正在开发中...</h2>
          </div>
        );
    }
  };

  // Demo: 任务对比入口
  const [showTaskCompareDemo, setShowTaskCompareDemo] = useState(false);

  const taskCompareDemoA = {
    info: { id: 'TASK-A', name: '缺陷识别-ResNet', dataset: '缺陷图像数据集 v1.0', model: 'ResNet50', params: { lr: 0.001, batch_size: 32 } },
    type: TASK_TYPES.classification,
    metrics: {
      accuracy: 0.9144, precision: 0.902, recall: 0.895, f1: 0.898, rocAuc: 0.945,
      rocCurve: Array.from({ length: 21 }, (_, i) => ({ fpr: i / 20, tpr: Math.min(1, Math.pow(i / 20, 0.6)) })),
      confusionMatrix: [[120, 10], [8, 140]],
      ci95: { accuracy: [0.90, 0.93] },
    },
    causalGraph: {
      nodes: [
        { id: 'n1', label: '纹理', x: 120, y: 60 },
        { id: 'n2', label: '亮度', x: 260, y: 120 },
        { id: 'n3', label: '边缘', x: 420, y: 80 },
        { id: 'n4', label: '判定', x: 600, y: 120 },
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.8 },
        { source: 'n2', target: 'n3', influenceStrength: 0.4 },
        { source: 'n3', target: 'n4', influenceStrength: 0.9 },
      ],
    },
    phases: [{ name: '数据加载', durationSec: 35 }, { name: '训练', durationSec: 820 }, { name: '评估', durationSec: 65 }],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 40 + (i % 5) * 5, gpu: 30 + (i % 7) * 3 })),
    totalTimeSec: 920,
    trainTimeSec: 820,
    inferTimeMs: 45,
    quota: { gpuMemGB: 16, cpuCores: 8, ramGB: 32, timeLimitMin: 60 },
    actual: { gpuMemGB: 12, cpuCores: 6, ramGB: 24 },
    warnings: ['评估阶段出现少量类不平衡警告'],
  };

  const taskCompareDemoB = {
    info: { id: 'TASK-B', name: '缺陷识别-EfficientNet', dataset: '缺陷图像数据集 v1.0', model: 'EfficientNet-B0', params: { lr: 0.0008, batch_size: 64 } },
    type: TASK_TYPES.classification,
    metrics: {
      accuracy: 0.904, precision: 0.895, recall: 0.882, f1: 0.888, rocAuc: 0.936,
      rocCurve: Array.from({ length: 21 }, (_, i) => ({ fpr: i / 20, tpr: Math.min(1, Math.pow(i / 20, 0.65)) })),
      confusionMatrix: [[115, 15], [12, 135]],
      ci95: { accuracy: [0.88, 0.92] },
    },
    causalGraph: {
      nodes: [
        { id: 'n1', label: '纹理', x: 120, y: 60 },
        { id: 'n5', label: '对比度', x: 280, y: 40 },
        { id: 'n3', label: '边缘', x: 420, y: 80 },
        { id: 'n4', label: '判定', x: 600, y: 120 },
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.6 },
        { source: 'n5', target: 'n3', influenceStrength: -0.2 },
        { source: 'n3', target: 'n4', influenceStrength: 0.8 },
      ],
    },
    phases: [{ name: '数据加载', durationSec: 40 }, { name: '训练', durationSec: 780 }, { name: '评估', durationSec: 70 }],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 35 + (i % 6) * 4, gpu: 25 + (i % 5) * 4 })),
    totalTimeSec: 890,
    trainTimeSec: 780,
    inferTimeMs: 38,
    quota: { gpuMemGB: 16, cpuCores: 8, ramGB: 32, timeLimitMin: 60 },
    actual: { gpuMemGB: 10, cpuCores: 6, ramGB: 22 },
    warnings: [],
  };

  // 如果个性化设置页面打开，则显示个性化设置页面
  if (isPersonalizationSettingsOpen) {
    return (
      <PersonalizationSettings
        onBack={handleClosePersonalizationSettings}
      />
    );
  }

  // JupyterLab 独立仿真页面模式 - 优先于登录检查
  if (isJupyterStandalone) {
    return <JupyterLabMock onClose={() => window.close()} />;
  }

  // If not logged in, show login page (full screen)
  if (!isLoggedIn) {
    return <Login onLogin={() => {
      localStorage.setItem('limix_is_logged_in', 'true');
      setIsLoggedIn(true);
    }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenPersonalCenter={handleOpenPersonalCenter}
        onOpenPersonalizationSettings={handleOpenPersonalizationSettings}
        onOpenNotificationCenter={handleOpenNotificationCenter}
        onLogout={handleLogout}
      />

      <main className="p-6 max-w-7xl mx-auto">
        {renderContent()}
      </main>

      {/* 全页面视图 */}
      {fullPageViewType === 'data-detail' && selectedDatasetForFullPage && (
        <DataDetailFullPage
          dataset={selectedDatasetForFullPage}
          onClose={handleCloseFullPageView}
          initialTab={dataDetailInitialTab ?? 'overview'}
        />
      )}
      {fullPageViewType === 'task-detail' && selectedTaskForFullPage && (
        <TaskDetailFullPage
          task={selectedTaskForFullPage}
          onClose={handleCloseFullPageView}
          onOpenDataDetail={handleOpenDataDetailFullPage}
          onTaskPatched={handleTaskPatched}
        />
      )}
      {fullPageViewType === 'notebook-detail' && selectedNotebookForFullPage && (
        <NotebookDetail
          instance={selectedNotebookForFullPage}
          onBack={handleCloseFullPageView}
          onStart={(id: string) => {
            message.loading({ content: `正在下发实例 ${id} 启动指令...`, key: 'nb_op' });
            setTimeout(() => {
              message.success({ content: '启动指令已送达，实例状态更新中', key: 'nb_op' });
            }, 1000);
          }}
          onStop={(id: string) => {
            Modal.confirm({
              title: '停止 Notebook 实例',
              icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
              content: '停止后，/home/ma-user/work 目录下的数据会保存，其余目录下内容会被清理。',
              okText: '确认停止',
              cancelText: '取消',
              onOk: () => {
                message.loading({ content: `正在下发实例 ${id} 停止指令...`, key: 'nb_op' });
                setTimeout(() => {
                  message.success({ content: '停止指令已送达，实例状态更新中', key: 'nb_op' });
                }, 1000);
              }
            });
          }}
          onConnect={handleNotebookConnect}
          onUpdateDescription={(id, desc) => {
            message.loading({ content: '正在同步更新描述...', key: 'nb_upd' });
            setTimeout(() => {
              setSelectedNotebookForFullPage((prev: any) => ({ ...prev, description: desc }));
              message.success({ content: '描述信息已更新', key: 'nb_upd' });
            }, 600);
          }}
        />
      )}
      {fullPageViewType && fullPageViewType !== 'data-detail' && fullPageViewType !== 'task-detail' && fullPageViewType !== 'notebook-detail' && (
        <FullPageView
          type={fullPageViewType}
          onClose={handleCloseFullPageView}
          notificationCenterInitialTab={notificationCenterInitialTab ?? 'notifications'}
        />
      )}

      {/* 报表全屏视图 */}
      {isReportViewOpen && (
        <ReportView onClose={() => setIsReportViewOpen(false)} />
      )}

      {/* AI助手已统一到 FullPageView（type='ai-assistant'） */}

      {/* 浮动预览入口：任务对比（仅在决策推理页显示） */}
      {activeTab === '决策推理' && (
        <>
          <div className="fixed bottom-6 right-6 space-y-2 z-50">
            <button
              className="shadow-lg rounded-full px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => setShowTaskCompareDemo(true)}
            >
              任务对比预览
            </button>
          </div>

          {/* 任务对比页面 */}
          <Dialog open={showTaskCompareDemo} onOpenChange={setShowTaskCompareDemo}>
            <DialogContent className="sm:max-w-6xl max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <DialogHeader>
                <DialogTitle>任务对比预览</DialogTitle>
              </DialogHeader>
              <TaskCompare task1={taskCompareDemoA as any} task2={taskCompareDemoB as any} onBack={() => setShowTaskCompareDemo(false)} />
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* 全局悬浮动态助手入口（与右上角智能助手按钮同源） */}
      <FloatingAssistantEntry onOpenAIAssistant={handleOpenAIAssistant} />

      {/* Notebook 全局连接仿真弹窗 */}
      <Modal
        title={
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <div className="p-1.5 bg-blue-100 rounded">
              <LinkIcon className="w-4 h-4 text-blue-600" />
            </div>
            <span>连接 Notebook 实例: {selectedNotebookForMock?.name}</span>
          </div>
        }
        open={isNotebookConnectModalOpen}
        onCancel={() => setIsNotebookConnectModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsNotebookConnectModalOpen(false)}>暂不连接</Button>,
          <Button key="jupyter" type="primary" onClick={() => {
            setIsNotebookConnectModalOpen(false);
            setActiveNotebookMockView('jupyter');
          }}>
            进入 JupyterLab
          </Button>
        ]}
        width={700}
      >
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-600" /> VS Code Remote - SSH 开发接入
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                <div>
                  <p className="text-xs font-bold text-slate-700 m-0">在本地打开 VS Code</p>
                  <p className="text-[11px] text-slate-500 m-0">确保已安装 <b>"Remote - SSH"</b> 官方扩展插件组件包。</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-700 m-0">直接粘贴 SSH 连接命令</p>
                  <p className="text-[11px] text-slate-500 mb-2">点击 Command Palette (F1) {'->'} SSH: Connect to Host...</p>
                  <div className="relative group">
                    <pre className="bg-slate-900 text-slate-300 p-3 rounded text-[11px] overflow-hidden whitespace-nowrap text-ellipsis border border-slate-700 pr-12">
                      {selectedNotebookForMock?.sshCommand || 'ssh -p 30022 root@192.168.1.100'}
                    </pre>
                    <Button
                      size="small"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-800 border-slate-600 text-slate-300 group-hover:bg-slate-700"
                      onClick={() => {
                        message.success('已复制到剪贴板');
                        navigator.clipboard.writeText(selectedNotebookForMock?.sshCommand || '');
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                <div>
                  <p className="text-xs font-bold text-slate-700 m-0">输入密码或确认密钥</p>
                  <p className="text-[11px] text-slate-500 m-0">若尚未配置免密登录，请在提示框中输入该环境对应的连接密码或生成新的密钥对上传。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>


      {/* Notebook 仿真界面 Overlay */}
      {activeNotebookMockView === 'ssh' && (
        <SSHRootTerminalMock
          instanceName={selectedNotebookForMock?.name || ''}
          onClose={() => setActiveNotebookMockView(null)}
        />
      )}
      {activeNotebookMockView === 'jupyter' && (
        <JupyterLabMock
          onClose={() => {
            Modal.confirm({
              title: '确定要关闭 JupyterLab 吗？',
              icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
              content: '未保存的更改可能会丢失。',
              okText: '确认关闭',
              cancelText: '取消',
              okButtonProps: { danger: true },
              onOk: () => setActiveNotebookMockView(null)
            });
          }}
        />
      )}

      <Toaster />
    </div>
  );
}
