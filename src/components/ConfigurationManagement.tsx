import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { 
  Settings2, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Building,
  Layers,
  Database,
  Cpu,
  Filter,
  Download,
  Upload,
  FileText,
  FolderPlus,
  Settings
} from "lucide-react";
import { AddCategoryModal } from "./AddCategoryModal";

// 配置项类型定义
interface ConfigItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  creator: string;
}

// 配置分类定义
interface ConfigCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  count: number;
  isCustom?: boolean; // 是否为自定义分类
  createdAt?: string;
  updatedAt?: string;
}

export function ConfigurationManagement() {
  const [activeCategory, setActiveCategory] = useState("industry");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  // 初始化配置分类数据
  const [categories, setCategories] = useState<ConfigCategory[]>([
    {
      id: "industry",
      name: "行业配置",
      description: "管理系统支持的行业类型",
      icon: Building,
      count: 25,
      isCustom: false
    },
    {
      id: "scenario",
      name: "任务类型配置",
      description: "管理任务类型配置",
      icon: Layers,
      count: 18,
      isCustom: false
    },
    {
      id: "datatype",
      name: "数据类型",
      description: "管理数据分类和类型配置",
      icon: Database,
      count: 12,
      isCustom: false
    },
    {
      id: "modeltype",
      name: "模型类型",
      description: "管理AI模型分类配置",
      icon: Cpu,
      count: 8,
      isCustom: false
    }
  ]);

  // 初始化配置项数据
  const [configItems, setConfigItems] = useState<ConfigItem[]>([
    {
      id: "1",
      name: "制造业",
      description: "传统制造业及智能制造",
      category: "industry",
      status: "active",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20",
      creator: "admin"
    },
    {
      id: "2",
      name: "金融业",
      description: "银行、保险、证券等金融服务",
      category: "industry",
      status: "active",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-18",
      creator: "admin"
    },
    {
      id: "3",
      name: "医疗健康",
      description: "医疗服务、健康管理、医药研发",
      category: "industry",
      status: "active",
      createdAt: "2024-01-16",
      updatedAt: "2024-01-19",
      creator: "admin"
    },
    {
      id: "4",
      name: "教育培训",
      description: "在线教育、职业培训、学历教育",
      category: "industry",
      status: "active",
      createdAt: "2024-01-17",
      updatedAt: "2024-01-21",
      creator: "admin"
    },
    {
      id: "5",
      name: "质量检测",
      description: "产品质量检测和质量控制",
      category: "scenario",
      status: "active",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20",
      creator: "admin"
    },
    {
      id: "6",
      name: "预测分析",
      description: "基于历史数据的趋势预测",
      category: "scenario",
      status: "active",
      createdAt: "2024-01-16",
      updatedAt: "2024-01-19",
      creator: "admin"
    },
    {
      id: "7",
      name: "图像数据",
      description: "图片、视频等视觉数据",
      category: "datatype",
      status: "active",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-18",
      creator: "admin"
    },
    {
      id: "8",
      name: "文本数据",
      description: "文档、评论、日志等文本信息",
      category: "datatype",
      status: "active",
      createdAt: "2024-01-16",
      updatedAt: "2024-01-20",
      creator: "admin"
    },
    {
      id: "9",
      name: "深度学习模型",
      description: "基于神经网络的深度学习模型",
      category: "modeltype",
      status: "active",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-19",
      creator: "admin"
    },
    {
      id: "10",
      name: "机器学习模型",
      description: "传统机器学习算法模型",
      category: "modeltype",
      status: "active",
      createdAt: "2024-01-16",
      updatedAt: "2024-01-21",
      creator: "admin"
    }
  ]);

  // 根据当前分类和搜索条件过滤配置项
  const filteredItems = configItems.filter(item => {
    const matchesCategory = item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // 模板导出功能
  const handleExportTemplate = () => {
    const currentCategoryItems = configItems.filter(item => item.category === activeCategory);
    const template = {
      category: activeCategory,
      categoryName: currentCategory?.name,
      items: currentCategoryItems,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentCategory?.name}_配置模板_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 模板导入功能
  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target?.result as string);
        if (template.items && Array.isArray(template.items)) {
          const newItems = template.items.map((item: ConfigItem) => ({
            ...item,
            id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
            creator: "当前用户"
          }));
          setConfigItems(prev => [...prev, ...newItems]);
          // 更新分类计数
          setCategories(prev => prev.map(cat => 
            cat.id === activeCategory 
              ? { ...cat, count: cat.count + newItems.length }
              : cat
          ));
        }
      } catch (error) {
        alert('模板文件格式错误，请检查文件内容');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // 重置文件输入
  };

  // 添加新分类
  const handleAddCategory = (newCategory: Omit<ConfigCategory, 'id' | 'count' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    const categoryWithMetadata = {
      ...newCategory,
      id: newCategory.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      count: 0,
      createdAt: now,
      updatedAt: now
    };
    setCategories(prev => [...prev, categoryWithMetadata]);
    setIsAddCategoryModalOpen(false);
  };

  const currentCategory = categories.find(cat => cat.id === activeCategory);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">配置管理</h2>
          <p className="text-gray-600 mt-1">统一管理系统内所有业务字段的配置</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline"
            onClick={() => setIsAddCategoryModalOpen(true)}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            添加分类
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增配置
          </Button>
        </div>
      </div>

      {/* 配置分类导航 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isActive = activeCategory === category.id;
          
          return (
            <Card 
              key={category.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {category.count}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 当前分类的配置管理 */}
      {currentCategory && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <currentCategory.icon className="w-6 h-6 text-blue-600" />
                <div>
                  <CardTitle>{currentCategory.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{currentCategory.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="搜索配置项..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  筛选
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportTemplate}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  导出模板
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportTemplate}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="template-import"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    导入模板
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 配置项列表 */}
            <div className="space-y-3">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <Badge 
                          variant={item.status === 'active' ? 'default' : 'secondary'}
                          className={item.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {item.status === 'active' ? '启用' : '禁用'}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>创建时间: {item.createdAt}</span>
                        <span>更新时间: {item.updatedAt}</span>
                        <span>创建人: {item.creator}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        编辑
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Settings2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无配置项</p>
                  <p className="text-sm mt-1">点击"新增配置"按钮添加新的配置项</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 添加分类模态框 */}
        <AddCategoryModal
          isOpen={isAddCategoryModalOpen}
          onClose={() => setIsAddCategoryModalOpen(false)}
          onAdd={handleAddCategory}
        />
    </div>
  );
}