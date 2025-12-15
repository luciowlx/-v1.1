# 阶段1产出：CONSENSUS（最终共识）

## 明确的需求描述
1. 在 DataPreprocessing → numeric_transform 规则面板中：
   - 对选中的每个数值字段渲染分布缩略图；当选择转换方法后，原/新分布并列显示，统一坐标域。
   - 提供“查看大图”，弹出对话框以更大采样绘制原/新分布，并支持 Brush、Tooltip、统计注记。
2. 支持的转换方法：log、sqrt、box_cox、yeo_johnson、quantile（uniform/normal）。
3. 性能：缩略图采样≈15k；大图采样≈100k；直方图计算与渲染应在3秒内完成。
4. 可访问性：统计注记与 Tooltip；后续补充键盘焦点与 ARIA 描述。

## 验收标准（可测试）
- 分布缩略图：
  - 能正确过滤非数值/空值。
  - 原/新并列图 xDomain 一致、yMax一致；统计注记显示 μ/σ/n。
  - 选择转换方法后，图表即时更新且终端无报错。
- 大图预览：
  - 打开/关闭对话框无异常；Brush 可选范围缩放；Tooltip显示密度与正态曲线值。
  - 采样上限生效（≤100k）；计算/渲染时间 ≤3s（以本地 mock 数据验证）。
- 代码与文档：
  - utils/distribution.ts 与 DistributionChart.tsx 导出/引用一致。
  - 文档（ALIGNMENT/CONSENSUS/DESIGN/TASK/ACCEPTANCE）更新到位。

## 技术实现方案与约束
- 前端：React + Recharts；直方图密度为 count/(n*bin_width)；正态曲线基于样本均值/标准差。
- 分箱策略：Freedman–Diaconis + 30 档默认；最大 200 档。
- 分位数变换：界面 `quantile` → 内部 `quantile_uniform`/`quantile_normal`。Normal 逆CDF 使用 Acklam 近似。
- 性能：reservoirSample 降低计算量；后续可接 Web Worker。

## 任务边界限制
- 仅用于前端可视化预览，不替代后端的严谨参数估计（如 Box-Cox/YJ 的 λ）。
- 暂未提供 KDE、bins 调整与导出能力；如有需要作为后续拓展。

## 不确定性处置
- 采样阈值、KDE、bins可调、导出功能、λ自动估计后端接口等，待产品/用户确认后迭代。

