# ALIGNMENT — 任务资源配置增强

目标：在任务创建/编辑表单的资源配置中引入加速卡数量（GPU/NPU），并统一默认值与校验，提升一致性与可用性。

## 项目上下文分析
- 技术栈：React 18 + TypeScript，UI 基于 shadcn/ui + antd 部分组件，构建工具 Vite。
- 文件位置：src/components/TaskManagement.tsx 为任务创建/编辑的主页面，包含表单状态、校验、提交逻辑与 UI。
- 现状：
  - FormData.resourceConfig 包含 cores/memory/maxRunTime。
  - UI 中有资源类型选择（CPU/GPU/NPU），但未提供加速卡数量配置。
  - 内存默认值为 8GB，与实际期望不一致（期望 32GB）。

## 原始需求与范围
- 增加 resourceConfig.acceleratorCards?: number 字段（GPU/NPU 时启用）。
- 将内存默认值统一改为 32GB。
- 在 UI 中条件渲染“加速卡数量”输入框（仅在 GPU/NPU 时显示）。
- 扩展表单校验，确保加速卡数量范围正确（1-8）。
- 资源类型联动：
  - CPU：保证内存≥32GB并隐藏/移除加速卡数量。
  - GPU/NPU：默认加速卡数量为 1。
- 不改动后端接口（仍为模拟），仅前端类型、表单、校验与 UI 行为。

## 边界确认
- 不引入新的后端交互；不改动 Task 接口结构（仅可在 config 或表单状态中体现）。
- 不实现资源历史持久化除加载（避免过度设计）。

## 需求理解
- 创建、编辑两处初始值需要统一（memory=32, acceleratorCards=1）。
- 校验在提交时触发，同时在输入框上显示错误样式与提示。

## 疑问澄清（待确认）
- 是否需要在 Task.config 中显式保存 resourceType/resourceConfig（当前仅 estimatedTime 使用 maxRunTime）？
- acceleratorCards 最大值是否固定为 8（是否根据设备动态变化）？

## 智能决策策略
- 以最小改动满足 UI 与类型一致性，保持现有代码风格。
- 在 CPU 模式自动去除 acceleratorCards 以降低歧义。

## 中断并询问关键决策点
- 若需在任务对象或导出 payload 中显式包含资源配置，请确认字段位置与格式。

