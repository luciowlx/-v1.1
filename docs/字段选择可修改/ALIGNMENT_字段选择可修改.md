# 对齐阶段：数据预处理-字段选择（多数据集）允许修改

## 项目上下文分析
- 前端原型项目，所有交互基于模拟数据，无后端依赖；统一使用 React + TypeScript + Vite，UI 组件为自定义 `./ui/*`。
- 相关页面与文件：
  - 组件：`src/components/DataPreprocessing.tsx`
  - 说明文档：`说明文档.md`
- 向导步骤定义：Step 0 选择数据集、Step 1 字段选择、Step 2 规则配置。
- 在多数据集（selectedDatasetIds.length > 1）场景下，Step 1 使用 `aggregatedFields` 渲染字段表格，但字段名与类型控件此前被禁用。

## 原始需求
当步骤一选择多个数据集时，步骤二（用户口径，代码中的 Step 1「字段选择」）展示的字段应该允许修改（至少包括字段名与字段类型）。

## 任务范围与边界
- 放开多数据集下字段名和字段类型的编辑能力；保留原有选择（Checkbox）、指标展示（空值率、重复率、唯一性、示例值）。
- 校验与禁用条件需同步适配（空值、重复名、下一步按钮禁用逻辑）。
- 仅前端；不涉及真实数据合并、后端存储与接口。

## 现有实现理解
- 单源 `fields` 支持编辑：`handleFieldNameChange`、`handleFieldTypeChange` + `fieldNameEditValues/Errors` 校验。
- 多源 `aggregatedFields` 展示时 Input/Select 被 `disabled` 且无编辑态和校验状态。
- 下一步按钮禁用条件未区分单源/多源，仅使用 `fields` 与 `hasAnyNameError`。

## 关键不确定性与问题清单
1. 字段重命名需不需要联动 Step 2 聚合视图与清洗规则的字段引用？（默认：需要同步）
2. 多源场景的“类型冲突”提示保留，同时允许用户强制指定类型（默认：允许）。

## 预决策与处理策略
- 新增多源编辑态与校验状态：`aggFieldNameEditValues/Errors` 与 `aggDuplicateNameSet/hasAnyAggNameError`。
- 启用多源 Input/Select，并复用单源的校验与提示样式。
- 修正下一步按钮禁用条件：在多源时使用 `aggregatedFields` 与 `hasAnyAggNameError`。

## 待澄清点（如需人工决策）
- 是否需要增加跨数据集字段名同步提示与批量重命名能力（暂不实现）。

## 当前结论
- 在不引入后端与复杂数据合并逻辑的前提下，允许用户在多数据集场景下编辑字段名与类型，并提供基本校验与提示即可满足原型演示需求。