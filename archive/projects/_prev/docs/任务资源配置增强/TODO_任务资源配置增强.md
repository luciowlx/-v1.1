# TODO — 任务资源配置增强

## 待确认/待办事项
- 是否需要在 Task 对象或导出 payload 中显式包含 resourceType/resourceConfig（当前仅用于前端表单与 estimatedTime）。
- acceleratorCards 范围是否固定为 1-8，是否应根据后端/设备能力动态获取上限。
- 是否需要持久化“上次成功的资源配置”并在创建任务时自动填充（当前仅示例性加载 history，未写入）。

## 指引
- 若需要将资源参数进入后端，请提供字段契约（例如 config.resources）与示例；前端可在 handleCreateTask 中合并并提交。
- 若需要动态上限，建议在页面加载时拉取设备资源信息，然后更新校验与 UI 限制。

