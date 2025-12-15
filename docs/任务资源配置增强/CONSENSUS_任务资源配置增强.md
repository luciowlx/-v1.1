# CONSENSUS — 任务资源配置增强

## 明确的需求描述
1) 在 FormData.resourceConfig 增加 acceleratorCards?: number 字段。
2) 将资源配置默认内存统一为 32GB。
3) 在 UI 中按资源类型联动：
   - CPU：显示 CPU核心数与内存（内存不少于 32GB），隐藏/移除 acceleratorCards。
   - GPU/NPU：隐藏 CPU核心数与内存；显示 acceleratorCards（默认值 1，范围 1-8）。
4) 扩展提交校验：对 cores/memory/maxRunTime 与 acceleratorCards 做范围检查，错误信息可视化提示。

## 验收标准（可测试）
- 创建任务弹窗默认内存为 32GB；编辑已有任务时，资源配置默认值统一。
- 切换资源类型到 GPU/NPU 时出现“加速卡数量”输入框，默认值为 1。
- 提交时：
  - cores 不在 [1,32]、memory 不在 [1,128]、maxRunTime 不在 [5,2880] 会提示错误；
  - 在 GPU/NPU 时 acceleratorCards 不在 [1,8] 会提示错误。
- CPU 类型下不显示“加速卡数量”，且不会报该字段相关错误。

## 技术实现方案与约束
- 类型：更新 FormData.resourceConfig；不新增 Task 接口字段，仅在 estimatedTime 使用 maxRunTime。
- UI：基于现有 shadcn/ui Input/Label/Select 等组件，条件渲染 acceleratorCards 输入。
- 逻辑：新增 useEffect 处理资源类型联动；扩展 validateForm 增加 acceleratorCards 校验。

## 集成方案
- 仅改动 TaskManagement.tsx，不影响其他页面。

## 任务边界
- 不改动后端接口；不引入复杂持久化；不增加新的依赖。

## 不确定性解决
- 待用户确认是否需要把 resourceConfig 显式存入 Task.config；当前仅用于前端表单与 estimatedTime。
