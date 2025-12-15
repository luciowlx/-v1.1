# ALIGNMENT — 任务管理简化改造

更新时间：2025-10-31 00:00（UTC+8）

## 1. 项目上下文分析
- 技术栈：React + TypeScript + 组件库（shadcn/ui 风格），前端原型，使用模拟数据。
- 关键文件：
  - src/components/TaskManagement.tsx（创建/编辑任务主流程，包含 config 构建与 UI）
  - src/components/TaskTypeManagement.tsx（任务类型相关入口与导入引用）
  - src/components/DataPreprocessing.tsx（可能对 task.config 有引用）
- 约定：Task 接口包含 `config?: any`；历史兼容了字符串 JSON 与对象两种形式。

## 2. 需求理解确认
### 原始需求
1) 移除参数配置中的 JSON 配置模式；2) 仅保留页面配置；3) 删除所有模式切换；4) 默认直接显示页面配置；5) 保持功能完整；6) 同步更新前端展示、后端参数处理逻辑（此项目仅前端模拟）与相关文档。

### 边界与范围
- 仅前端原型与模拟数据；不涉及真实后端接口。这里所称“后端参数处理逻辑”指前端内部的 config 构建与保存流程。
- 不改动任务列表、筛选、统计等非必要模块行为，除非受引用清理影响。

### 现有实现理解
- TaskManagement.tsx 中存在 hyperparameterMode（page/json）与 manualConfig（字符串 JSON）等状态与校验；存在 buildJsonTemplate/handleExportJsonTemplate/handleImportJsonFile 等函数和相关 UI（Textarea、导入/导出按钮）。
- 部分地方对 task.config 为字符串或对象做兼容解析。

## 3. 智能决策策略
- 统一 config 为对象模式；彻底移除 json 模式相关状态、函数与 UI；清除所有字符串 JSON 解析与兼容逻辑。
- 保留页面配置中各任务类型（预测/分类/回归）的参数项、校验与默认值；确保编辑任务时能正确回显并保存。

## 4. 疑问澄清（需确认的点）
- 是否保留“模板导出/导入”能力的替代方案？结论：根据需求移除 JSON 模式与相关入口，暂不提供替代；如未来需要，再评估。
- 旧任务若存储为字符串 JSON（历史数据）如何展示？结论：本原型仅前端模拟，统一视为对象模式；若遇到字符串，将在渲染时尝试解析并即时转对象（但不再提供 JSON 编辑 UI）。

## 5. 共识（临时）
- UI：删除模式切换与 JSON 文本域，直接展示页面配置表单。
- 逻辑：删除或改写 buildJsonTemplate/handleExportJsonTemplate/handleImportJsonFile；移除 manualConfig 与 hyperparameterMode 字段；保存时仅以对象写入 task.config。
- 文档：更新 CHANGELOG 与设计/任务拆分文档，最终提交验收与总结。

