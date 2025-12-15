# CONSENSUS_任务详情与列表状态同步

更新时间：2025-10-31（UTC+8）

## 1. 明确的需求与验收标准
- 详情页触发的任务状态变化会同步反映到任务列表：
  - 场景覆盖：start/stop/retry/rerun/cancel_queue/archive 等操作。
  - 同步字段：status、progress、hasQueuedBefore（至少）。
  - 列表与详情的按钮文案与可用性一致，例如取消排队后列表显示“重新运行”。
- 无刷新：无需手动刷新页面，效果即时可见。
- 稳定性：多次重复同一操作不应导致异常；跨标签切换后仍保持状态一致。

## 2. 技术实现方案
- 详情页：TaskDetailFullPage 在 applyTaskOverrides 中，除本地 setState 外，调用 onTaskPatched(taskId, patch)。
- 顶层：App.tsx 实现 handleTaskPatched：
  - 合并到 selectedTaskForFullPage，保证详情页与最新补丁一致；
  - 设置 externalTaskPatch（{ id, patch }）。
- 列表页：TaskManagement.tsx 接收 externalTaskPatch，并在 useEffect 中将 patch 合并到 tasks。

## 3. 任务边界限制
- 仅前端演示；不引入服务端；不处理并发冲突。
- 不改变既有任务字段定义与展示布局，仅同步数据。

## 4. 不确定性确认
- 重复应用同一补丁的策略：当前为幂等覆盖，接受重复应用；后续如需更精细控制再优化。

## 5. 验收方式
- 打开任务管理 → 进入某任务详情 → 执行“取消排队” → 立即看到详情页按钮切换为“重新运行”，返回列表也显示“重新运行”。
- 启动 DevServer 无编译错误，浏览器控制台无异常日志。

