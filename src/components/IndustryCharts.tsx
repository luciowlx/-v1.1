import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  BarChart3,
  TrendingUp,
  Zap,
  Settings,
  AlertTriangle,
  Truck,
  Activity,
  Thermometer,
  Gauge
} from "lucide-react";

interface IndustryChartsProps {
  industry: string;
}

export function IndustryCharts({ industry }: IndustryChartsProps) {
  
  // 钢铁缺陷预测图表
  const SteelDefectCharts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* 缺陷类型分布图 */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">缺陷类型分布</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">表面划痕</span>
              <div className="flex items-center gap-2">
                <Progress value={45} className="w-20 h-2" />
                <span className="text-sm font-medium">45%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">氧化斑点</span>
              <div className="flex items-center gap-2">
                <Progress value={28} className="w-20 h-2" />
                <span className="text-sm font-medium">28%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">裂纹缺陷</span>
              <div className="flex items-center gap-2">
                <Progress value={18} className="w-20 h-2" />
                <span className="text-sm font-medium">18%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">其他缺陷</span>
              <div className="flex items-center gap-2">
                <Progress value={9} className="w-20 h-2" />
                <span className="text-sm font-medium">9%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 质量趋势图 */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">质量趋势分析</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">合格率</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                96.8%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">检测精度</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                98.2%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">处理速度</span>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                150件/分钟
              </Badge>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-2">本月质量改善</div>
              <Progress value={85} className="h-3" />
              <div className="text-xs text-gray-500 mt-1">较上月提升 8.5%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 检测设备状态 */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">检测设备状态</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">视觉检测单元1</span>
              <Badge className="bg-green-500 text-white">正常</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">视觉检测单元2</span>
              <Badge className="bg-green-500 text-white">正常</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">图像处理服务器</span>
              <Badge className="bg-yellow-500 text-white">维护中</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">数据存储系统</span>
              <Badge className="bg-green-500 text-white">正常</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 缺陷严重程度 */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">缺陷严重程度</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">轻微缺陷</span>
              <div className="flex items-center gap-2">
                <Progress value={65} className="w-20 h-2" />
                <span className="text-sm font-medium text-green-600">65%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">中等缺陷</span>
              <div className="flex items-center gap-2">
                <Progress value={25} className="w-20 h-2" />
                <span className="text-sm font-medium text-yellow-600">25%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">严重缺陷</span>
              <div className="flex items-center gap-2">
                <Progress value={10} className="w-20 h-2" />
                <span className="text-sm font-medium text-red-600">10%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 电力能源预测图表
  const PowerEnergyCharts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* 负荷预测曲线 */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">24小时负荷预测</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">峰值负荷</span>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                8,500 MW
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">谷值负荷</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                4,200 MW
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">当前负荷</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                6,800 MW
              </Badge>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-2">负荷率</div>
              <Progress value={80} className="h-3" />
              <div className="text-xs text-gray-500 mt-1">80% (正常范围)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 能源结构分析 */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">能源结构分析</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">火力发电</span>
              <div className="flex items-center gap-2">
                <Progress value={45} className="w-20 h-2" />
                <span className="text-sm font-medium">45%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">水力发电</span>
              <div className="flex items-center gap-2">
                <Progress value={25} className="w-20 h-2" />
                <span className="text-sm font-medium">25%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">风力发电</span>
              <div className="flex items-center gap-2">
                <Progress value={20} className="w-20 h-2" />
                <span className="text-sm font-medium">20%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">太阳能发电</span>
              <div className="flex items-center gap-2">
                <Progress value={10} className="w-20 h-2" />
                <span className="text-sm font-medium">10%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 电网稳定性指标 */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">电网稳定性指标</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">频率稳定性</span>
              <Badge className="bg-green-500 text-white">99.8%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">电压稳定性</span>
              <Badge className="bg-green-500 text-white">99.5%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">功率平衡</span>
              <Badge className="bg-yellow-500 text-white">98.2%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">系统可靠性</span>
              <Badge className="bg-green-500 text-white">99.9%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 能耗效率分析 */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">能耗效率分析</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">传输损耗率</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                2.8%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">发电效率</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                92.5%
              </Badge>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-2">本月效率提升</div>
              <Progress value={75} className="h-3" />
              <div className="text-xs text-gray-500 mt-1">较上月提升 3.2%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 工艺时序预测图表
  const ManufacturingCharts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* 工艺参数监控 */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">关键工艺参数</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">温度控制</span>
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <Badge className="bg-green-500 text-white">正常</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">压力控制</span>
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-blue-500" />
                <Badge className="bg-green-500 text-white">正常</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">流量控制</span>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                <Badge className="bg-yellow-500 text-white">调整中</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">速度控制</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <Badge className="bg-green-500 text-white">正常</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 产品质量指标 */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">产品质量指标</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">合格率</span>
              <div className="flex items-center gap-2">
                <Progress value={95} className="w-20 h-2" />
                <span className="text-sm font-medium">95.2%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">一次通过率</span>
              <div className="flex items-center gap-2">
                <Progress value={88} className="w-20 h-2" />
                <span className="text-sm font-medium">88.7%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">返工率</span>
              <div className="flex items-center gap-2">
                <Progress value={12} className="w-20 h-2" />
                <span className="text-sm font-medium">1.2%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">废品率</span>
              <div className="flex items-center gap-2">
                <Progress value={8} className="w-20 h-2" />
                <span className="text-sm font-medium">0.8%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 生产效率分析 */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">生产效率分析</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">设备利用率</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                92.5%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">生产节拍</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                45秒/件
              </Badge>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-2">效率提升趋势</div>
              <Progress value={82} className="h-3" />
              <div className="text-xs text-gray-500 mt-1">较上月提升 5.8%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 工艺优化建议 */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">工艺优化建议</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800">温度优化</div>
              <div className="text-xs text-blue-600 mt-1">建议将加热温度调整至385°C，可提升3%效率</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-sm font-medium text-yellow-800">流量调整</div>
              <div className="text-xs text-yellow-600 mt-1">原料流量可适当增加15%，提升产能</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800">维护提醒</div>
              <div className="text-xs text-green-600 mt-1">设备运行良好，建议按计划维护</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 根据行业类型返回对应的图表
  switch (industry) {
    case 'steel':
      return <SteelDefectCharts />;
    case 'power':
      return <PowerEnergyCharts />;
    case 'manufacturing':
      return <ManufacturingCharts />;
    default:
      return (
        <div className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无专业图表数据</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
  }
}