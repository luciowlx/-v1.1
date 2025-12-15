import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { 
  Building2, 
  Layers, 
  Database, 
  Brain, 
  Settings, 
  FileText, 
  Table,
  Folder,
  Tag,
  Grid
} from "lucide-react";

interface ConfigCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (category: Omit<ConfigCategory, 'id' | 'count' | 'createdAt' | 'updatedAt'>) => void;
}

// 可选择的图标列表
const iconOptions = [
  { icon: Building2, name: "building2", label: "建筑" },
  { icon: Layers, name: "layers", label: "层级" },
  { icon: Database, name: "database", label: "数据库" },
  { icon: Brain, name: "brain", label: "大脑" },
  { icon: Settings, name: "settings", label: "设置" },
  { icon: FileText, name: "fileText", label: "文档" },
  { icon: Table, name: "table", label: "表格" },
  { icon: Folder, name: "folder", label: "文件夹" },
  { icon: Tag, name: "tag", label: "标签" },
  { icon: Grid, name: "grid", label: "网格" }
];

export function AddCategoryModal({ isOpen, onClose, onAdd }: AddCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "folder"
  });

  const [errors, setErrors] = useState({
    name: "",
    description: ""
  });

  // 验证表单
  const validateForm = () => {
    const newErrors = {
      name: "",
      description: ""
    };

    if (!formData.name.trim()) {
      newErrors.name = "分类名称不能为空";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "分类名称至少需要2个字符";
    } else if (formData.name.trim().length > 20) {
      newErrors.name = "分类名称不能超过20个字符";
    }

    if (!formData.description.trim()) {
      newErrors.description = "分类描述不能为空";
    } else if (formData.description.trim().length < 5) {
      newErrors.description = "分类描述至少需要5个字符";
    } else if (formData.description.trim().length > 100) {
      newErrors.description = "分类描述不能超过100个字符";
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.description;
  };

  // 处理表单提交
  const handleSubmit = () => {
    if (validateForm()) {
      onAdd({
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: formData.icon,
        isCustom: true
      });
      
      // 重置表单
      setFormData({
        name: "",
        description: "",
        icon: "folder"
      });
      setErrors({
        name: "",
        description: ""
      });
      
      onClose();
    }
  };

  // 处理取消
  const handleCancel = () => {
    // 重置表单
    setFormData({
      name: "",
      description: "",
      icon: "folder"
    });
    setErrors({
      name: "",
      description: ""
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">添加配置分类</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* 分类名称 */}
          <div className="space-y-2">
            <Label htmlFor="categoryName" className="text-sm font-medium">
              分类名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="categoryName"
              placeholder="请输入分类名称（如：表配置）"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* 分类描述 */}
          <div className="space-y-2">
            <Label htmlFor="categoryDescription" className="text-sm font-medium">
              分类描述 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="categoryDescription"
              placeholder="请输入分类描述（如：管理数据库表结构和字段配置）"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={errors.description ? "border-red-500" : ""}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* 图标选择 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">选择图标</Label>
            <div className="grid grid-cols-5 gap-3">
              {iconOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: option.name })}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                      ${formData.icon === option.name 
                        ? "border-blue-500 bg-blue-50 text-blue-600" 
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }
                    `}
                    title={option.label}
                  >
                    <IconComponent className="h-5 w-5 mb-1" />
                    <span className="text-xs">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 预览 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">预览效果</Label>
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                {(() => {
                  const selectedIcon = iconOptions.find(opt => opt.name === formData.icon);
                  const IconComponent = selectedIcon?.icon || Folder;
                  return <IconComponent className="h-6 w-6 text-blue-600" />;
                })()}
                <div>
                  <h3 className="font-medium text-gray-900">
                    {formData.name || "分类名称"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formData.description || "分类描述"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            添加分类
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}