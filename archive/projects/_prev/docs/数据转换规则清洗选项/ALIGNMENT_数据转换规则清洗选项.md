阶段1：Align（对齐）——数据转换规则清洗选项

1. 项目上下文分析
- 技术栈：React + TypeScript + Vite，UI为Tailwind类风格和自研UI封装；图表使用 Recharts。
- 相关组件与文件：
  - src/components/DataPreprocessing.tsx：字段选择、规则配置、分布预览与查看大图入口。
  - src/components/DistributionChart.tsx：直方图 + 正态曲线叠加，支持固定域与Brush。
  - src/components/ui/chart.tsx：ChartContainer（ResponsiveContainer包装，包含小宽度兜底逻辑）、ChartTooltip。
  - src/utils/distribution.ts：分布构建、统计计算、变换工具（已有基础方法或将完善）。
- 已知布局约束与修复：
  - 预览栅格由固定断点列改为 repeat(auto-fit, minmax(280px,1fr))，保证卡片最小宽度并自适应列数。
  - ChartContainer 在宽度过小（<160px）时使用固定数值宽高进行兜底渲染并启用横向滚动。

2. 需求理解确认
- 目标：为数值型字段提供常用分布变换（log、sqrt、Box-Cox、Yeo-Johnson、quantile），并可视化对比原始与转换后分布，支持参数配置与规则保存。
- 范围：字段多选、方法与参数配置、缩略图预览与大图对比、参数校验、性能优化（采样与响应式）与文档同步。
- 边界：
  - Box-Cox仅正值；sqrt非负；log默认自然对数，非正值建议偏移或使用Yeo-Johnson；Yeo-Johnson可处理负值；quantile进行CDF映射到uniform或normal。
  - 图表高度固定在缩略图约160–180px范围，宽度随卡片自适应；极窄容器允许横向滚动。
- 需求理解：PRD已明确交互规范、算法与参数、校验与异常、验收标准与里程碑。
- 疑问澄清（已在本次共识中解决）：
  - log是否开放“base与偏移量”参数？默认不开放，仅提供文案提示，后续可迭代。
  - 分箱策略默认采用FD规则，自适应；数据量很小或方差过小时fallback固定分箱数（如50）。
  - 缩略图卡片最小宽度阈值：采用≥280px；如后续反馈可调至320px。
  - 查看大图默认Brush关闭，提供可选开关；导出图像不在本期范围。

3. 智能决策策略
- 优先遵循PRD与现有代码模式；在图表布局与性能方面采用保守且可读性优先的策略（minmax + 兜底尺寸）。
- 算法默认使用FD分箱；特殊情况回退固定分箱数以避免过少或过多分箱影响可读性。
- 参数校验严格阻止非法保存，并提供中文提示文案。

4. 中断并询问关键决策点
- 当前无阻塞项；如后续需要开放log base与偏移量或导出图能力，将在PRD增补后再行确认。

5. 最终共识（摘要，详见 CONSENSUS 文档）
- 方法与参数默认：log(base=e)、sqrt(无参)、Box-Cox(λ=auto)、Yeo-Johnson(λ=auto)、quantile(n=100, output=uniform|normal)
- 分箱默认：FD规则，自适应；small-data或异常分布回退固定50。
- UI布局：栅格auto-fit + minmax(≥280px,1fr)；极窄容器触发ChartContainer兜底尺寸并允许横向滚动。
- 验收标准：正确显示统计量与曲线，参数校验有效；在多字段+大样本下交互流畅；规则保存后可追溯并应用。

