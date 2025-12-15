# ALIGNMENT_任务详情与列表状态同步

更新时间：2025-10-31（UTC+8）

## 1. 项目上下文分析
- 技术栈：React 18 + TypeScript + Vite + Radix UI/Shadcn 组件 + Tailwind；前端原型，无后端。
- 结构与模式：
  - App.tsx 作为页面编排与全屏视图（FullPage）路由容器。
  - TaskManagement.tsx 负责任务列表、筛选、任务创建与列表内动作。
  - TaskDetailFullPage.tsx 负责任务详情全屏页，包含丰富的日志、指标、图表、数据预览等模拟逻辑。
- 现状：
  - 详情页内已支持 localTaskOverrides 本地覆盖，能够即时反映取消排队/重新运行等操作，但外层列表不会同步更新。
  - 列表页与详情页 Task 接口结构基本一致，字段存在重复定义（可接受，原型阶段）。

## 2. 需求理解确认
- 目标：在详情页执行操作时，将局部状态补丁（如 status、progress、hasQueuedBefore 等）上报给父级，使任务列表数据同步更新，实现 UI 一致性。
- 范围：纯前端桥接与状态同步；不引入持久化，不改动后端（无后端）。
- 交互节点：
  - TaskDetailFullPage 内部调用 applyTaskOverrides 时，额外触发 onTaskPatched(taskId, patch)。
  - App.tsx 接收并：
    1) 合并到 selectedTaskForFullPage（保持详情页即时回显一致性）；
    2) 将补丁透传给 TaskManagement（externalTaskPatch）以合并到列表 tasks。
  - TaskManagement.tsx 接收 externalTaskPatch 后，通过 useEffect 合并到本地 tasks 状态。

## 3. 智能决策策略
- 决策：使用“上报回调 + 顶层桥接 + 列表合并”的最小侵入方案，无需全局状态管理库；便于原型快速联调。
- 风险与权衡：
  - 若在切换标签后 TaskManagement 重新挂载，effect 将再次应用最后一次补丁（幂等合并，无副作用）。
  - 未来可升级为事件总线或全局 store，但当前范围内不必要。

## 4. 疑问澄清（待确认项）
- 是否需要在 App.tsx 中重置 externalTaskPatch（设为 null）以避免后续初次挂载时重复应用？目前设计为幂等合并，暂不重置。
- 详情页与列表页 Task 接口是否需要抽离统一类型？目前保持文件内定义，便于原型独立演进。

## 5. 边界与不做事项
- 不做：跨页面的历史操作记录持久化；服务端同步；复杂冲突合并策略。
- 不做：改造为全局状态管理方案（Redux/Zustand）。

## 6. 初步结论
- 采用 onTaskPatched → App.handleTaskPatched → externalTaskPatch → TaskManagement.useEffect 的单向数据流桥接；满足一致性与低耦合目标。

