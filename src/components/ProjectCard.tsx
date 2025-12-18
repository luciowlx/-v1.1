import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Users, Calendar } from "lucide-react";
import { Button } from "./ui/button";

interface ProjectCardProps {
  // 允许在列表渲染中传入 React 的特殊属性 `key`（不会在组件内部使用）
  // 使用基础类型以避免额外类型导入，兼容 React.Key 的 string | number
  key?: string | number;
  title: string;
  description: string;
  status: string;
  stats: {
    datasets: number;
    models: number;
    tasks: number;
  };
  date?: string;
  members?: number;
  dataSource?: string;
  color?: "blue" | "green" | "purple" | "orange";
  onViewDetails?: () => void;
  onManage?: () => void;
}

export function ProjectCard({ title, description, status, stats, date, members, dataSource, color = "blue", onViewDetails, onManage }: ProjectCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    orange: "bg-orange-50 border-orange-200"
  };

  const badgeColors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700"
  };

  // 归档状态统一灰色显示，其他状态按卡片色系展示
  const statusBadgeClass = status === '已归档' ? 'bg-gray-100 text-gray-700' : badgeColors[color];

  return (
    <Card className={`${colorClasses[color]} hover:shadow-md transition-shadow flex flex-col h-full`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg mb-2">{title}</CardTitle>
            <p className="text-sm text-gray-600 mb-3">{description}</p>
            <Badge className={`${statusBadgeClass} text-xs`}>
              {status}
            </Badge>
          </div>
          {/* 移除项目卡片右上角的省略号按钮 */}
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex flex-col flex-grow">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-semibold">{stats.datasets}</div>
            <div className="text-xs text-gray-500">数据集</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold">{stats.models}</div>
            <div className="text-xs text-gray-500">模型</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold">{stats.tasks}</div>
            <div className="text-xs text-gray-500">任务</div>
          </div>
        </div>

        <div className="space-y-2 mb-4 text-xs text-gray-500">
          {date && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>创建时间: {date}</span>
            </div>
          )}
          {members && (
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>成员: {members}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={onViewDetails}
          >
            查看详情
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={onManage}
          >
            管理
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}