# 阶段1：Align（对齐阶段）

## 项目上下文分析
- 技术栈：React 18 + Vite 6、Radix UI、Tailwind、Recharts。项目已有通用 Chart 容器（components/ui/chart.tsx）。
- 相关页面：DataPreprocessing.tsx 中的“清洗规则 → 数据转换（numeric_transform）”配置面板；原始预览数据来源 rawPreviewRows。
- 已有实现：
  - utils/distribution.ts：统计、直方图、正态曲线、分位数变换、采样（reservoirSampling）。
  - components/DistributionChart.tsx：直方图 + 正态曲线叠加，支持 Brush 缩放、Tooltip、统计注记、统一轴域（fixedDomain/fixedYMax）。
  - DataPreprocessing.tsx：为每个选中数值字段展示缩略图（原/新并列），并提供“大图预览”对话框，统一坐标域。

## 原始需求与范围
- 为“数据转换（numeric_transform）”增加分布可视化：
  - 缩略图：每个选中字段展示原始分布；若选择了转换方法，则并列显示转换后分布；支持统一坐标域和统计量注记（均值、标准差、样本量）。
  - 大图预览：点击“查看大图”后打开对话框，以更大采样绘制原/新分布并列图，支持 Brush 缩放。
  - 交互：Tooltip、Brush、统一轴域；方法选择实时更新分布。
- 性能：针对>100万数据设计采样策略（缩略图≈15k、大图≈100k），直方图计算在3秒内完成；为后续 Web Worker 预留接口。
- 可访问性：提供统计注记、Tooltip；后续补充键盘导航与屏幕阅读器描述。

## 需求边界确认
- 仅针对数值型字段；非数值/空值在可视化构造过程中剔除。
- 分布图以直方图密度（count/(n*bin_width)）为 y 轴，正态曲线使用当前样本的均值/标准差估算。
- 统一轴域：原/新分布的 xDomain 取并集范围，同步 yMax；缩略图不使用 Brush，大图使用 Brush。
- 分位数变换：界面值为 `quantile`，内部映射为 `quantile_uniform` 或 `quantile_normal`。
- Box-Cox 默认 λ 不填时按可视化友好方式使用 λ=0 等价对数；Yeo-Johnson 默认 λ=1；这两者仅用于前端可视化预览并不替代后端精确估计。
- 直方图分箱：优先使用 Freedman–Diaconis 规则，边界退化时用默认 30 档；最多 200 档。

## 需求理解与现有约定
- rawPreviewRows 提供预览级数据；当数据量较大时以蓄水池采样降低计算量。
- UI 组件与样式沿用项目现有模式（Radix + Tailwind）；统计注记显示在图表标题区域。
- 组件属性固定域：DistributionChart 支持 fixedDomain、fixedYMax 保持原/新并列图同尺度。

## 疑问澄清清单（按优先级）
1. 大数据场景的上限与采样阈值是否需要可配置（当前：缩略图 15k、大图 100k）？
2. 是否需要支持 KDE（核密度估计）而不仅是正态曲线？
3. 是否需要允许用户调整直方图分箱数（bins）？若需要，配置项放在规则面板还是仅限大图对话框？
4. Box-Cox/Yeo-Johnson 的 λ 是否需要提供自动估计的实际后端接口？目前前端仅用于近似预览。
5. 分位数变换参数（nQuantiles）是否需要暴露或限制范围？当前默认 100。
6. 是否需要导出图片/CSV（直方图数据）能力？

## 当前智能决策与默认值（可调整）
- 采样阈值：缩略图 MAX=15000，大图 MAX=100000。
- 直方图分箱：Freedman–Diaconis 规则 + 默认 30 档；最大不超过 200 档。
- 分位数输出分布默认均匀；允许选择正态。
- 统计注记统一格式：μ、σ、n。
- 可访问性优先：保留 Tooltip 与统计注记，后续补充 Keyboard/ARIA。

## 中断并询问的关键决策点
- 请确认是否需要：KDE 支持、bins 可调、图片/CSV 导出、采样阈值可配置、对 λ 自动估计的后端接口。

## Align 输出
- 若上述决策获得确认，将固化到 CONSENSUS 文档并在 DESIGN/TASK 中体现。

