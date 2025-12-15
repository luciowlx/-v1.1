# 项目版本修改记录

本文件用于全程维护项目的版本修改记录，记录每次重要变更、修复与验证步骤，确保团队成员可以追踪历史与定位问题。

## 维护规则

- 更新时机：完成一次可感知的变更（功能、样式、结构、配置、文档）后立即更新本文件。
- 记录内容：日期、变更类型（Feature/Fix/Style/Docs/Build）、简要描述、涉及文件、验证方式/预览地址（如有）。
- 书写格式：采用倒序时间排列，最近的变更在最上方。
- 文件路径：使用相对路径，便于快速定位。

## 记录模板

```
### YYYY-MM-DD
- [类型] 变更标题/简述
  - 涉及文件：
  - 说明/验证：
```

---

## 变更历史

### 2025-11-13
- [Tweak/DataManagement/List] 列含义调整：将“版本”列改为“数据版本数量”，将“大小”列改为“文件数量”，并按文件数量进行排序。
  - 涉及文件：`src/components/DataManagement.tsx`
  - 说明/验证：本地预览 `http://localhost:3000/`，列头与数值显示正确，排序按数量生效。

- [Remove/DataDetail/UI] 移除数据详情页右侧“统计信息”模块，顶栏栅格改为单列使“基本信息”占满宽度。
  - 涉及文件：`src/components/DataDetailFullPage.tsx`
  - 说明/验证：本地预览 `http://localhost:3000/`，统计信息不再显示，页面无报错。

- [Remove/DataManagement/List] 隐藏数据集列表“列数”列（可通过设置弹窗恢复）。
  - 涉及文件：`src/components/DataManagement.tsx`
  - 说明/验证：本地预览 `http://localhost:3000/`，列表不再显示“列数”。

### 2025-11-12
- [Fix/DataManagement/Preprocessing] 操作二次确认弹窗文案兜底：为“停止/重试/删除”确认弹窗增加本地化兜底逻辑，缺失 i18n 键时仍显示中文提示，避免出现键名。
  - 涉及文件：`src/components/DataManagement.tsx`
  - 说明/验证：在“数据管理 → 预处理任务管理”列表，点击“停止/重试/删除”均弹出二次确认；文案显示为中文，不再出现 `task.confirm.*`。

- [Tweak/PersonalCenter/UI] 精简个人信息页：移除“职位/所在地/个人简介”与下方“账户信息卡片”；将“最后登录时间”移动到基本信息区域只读显示。
  - 涉及文件：`src/components/PersonalCenter.tsx`
  - 说明/验证：打开“个人信息”页，红框内内容不再显示；“最后登录时间”在基本信息区域展示且不可编辑。

### 2025-11-11
- [Feat/DataPreprocessing/DataMerge] 简化数据合并面板：移除主/从展示与红色校验规则提示，仅保留“公共字段”“合并方式”控件与禁用逻辑。
  - 涉及文件：`src/components/DataPreprocessing.tsx`
  - 说明/验证：本地预览 `http://localhost:3000/`；公共字段选择与合并方式选择正常；无公共字段时禁用提交并显示控件级提示。

- [Fix/TypeCheck] 统一字段类型兼容判断：公共字段候选仅在类型严格一致时可选，移除 `text/category` 特判，修复 TS 联合类型比较错误。
  - 涉及文件：`src/components/DataPreprocessing.tsx`
  - 说明/验证：编译通过，IDE 诊断错误消失。

- [Docs] 同步更新数据合并规则文档：ALIGNMENT/CONSENSUS/DESIGN 明确不在面板展示主/从信息，仅用于计算公共字段候选与类型校验。
  - 涉及文件：`docs/数据合并规则/ALIGNMENT_数据合并规则.md`、`docs/数据合并规则/CONSENSUS_数据合并规则.md`、`docs/数据合并规则/DESIGN_数据合并规则.md`
  - 说明/验证：文档已与 UI 行为对齐。

### 2025-11-07
- [Chore/Git] 更新 Git 远端地址：将 `origin` 由 `git@github.com:luciowlx/limix.git` 更新为 `git@github.com:luciowlx/ldm-mvp.git`。
  - 涉及文件：N/A（仓库配置变更）
  - 说明/验证：`git remote -v` 显示 fetch/push 均为新地址；后续 `git push` 正常。

### 2025-11-07
- [I18n/UI] 顶层动态浏览器标题：新增 `app.title`（zh/en），在 App.tsx 根据当前语言动态设置 `document.title`。
  - 涉及文件：
    - `src/i18n/LanguageContext.tsx`（新增 `app.title`：zh `LimiX智能平台`，en `Limix AI-powered ML Platform`）
    - `src/App.tsx`（引入 `useEffect` 与 `useLanguage`，`document.title = t('app.title')`；补充组件级 JSDoc 注释）
  - 说明/验证：
    - 预览地址 `http://localhost:5000/`；切换 zh/en 标题即时更新；刷新后保留语言偏好（localStorage）；终端与浏览器控制台无报错。

- [Chore/UI] 静态回退标题：将 `index.html` 的 `<title>` 改为“Limix Platform”，用于 JS 尚未执行阶段的回退显示。
  - 涉及文件：
    - `index.html`（`<title>Limix Platform</title>`）
  - 说明/验证：
    - 页面初次加载阶段显示“Limix Platform”，随后由 App.tsx 的动态国际化覆盖为当前语言对应标题。

### 2025-11-07
- [I18n/UI] ReportView 与 VersionDetail 页面国际化替换，补齐语言键并完成本地预览验证。
  - 涉及文件：
    - src/components/ReportView.tsx（导入 useLanguage；将标题、统计、交互维度、时序预测、因果权重、数据表预览与底部按钮替换为 t('report.*' / 'common.*')；补充关键函数 JSDoc 注释）
    - src/components/VersionDetail.tsx（导入 useLanguage；统一页面文案使用 t('versionDetail.*' / 'common.*')；getStatusBadge/getSourceBadge 映射为 t('versionDetail.status.*'、'versionDetail.source.*')）
    - src/i18n/LanguageContext.tsx（新增 common.selectAll、common.back、common.export；补齐 report.* 与 versionDetail.* 的中英翻译）
  - 说明/验证：
    - 运行 `npm run dev` 启动 Vite，本地预览地址：`http://localhost:3002/`；
    - 切换 zh/en 语言后，两个页面文案正确国际化，布局未破坏；控制台无报错。

### 2025-11-06
- [Chore/i18n] 补全多页面的中文文案键值并提供英文翻译；为后续替换硬编码中文提供映射。
  - 涉及文件：
    - src/i18n/LanguageContext.tsx（新增 PersonalCenter、NotificationCenter、GlobalAIAssistant、AddCategoryModal、ReportView、VersionDetail 等模块的 zh/en 键值共 300+ 行）
  - 说明/验证：
    - 通过 ripgrep 全局扫描 `src` 内硬编码中文，归纳多页面通用文案并补全到 i18n 映射表；
    - 切换语言后，已使用 `t()` 的页面可正常显示英文；未使用 `t()` 的页面需在下一步替换硬编码中文为 i18n 键；
    - 词汇遵循产品与技术文档术语：如“自动清洗/Auto Cleaning”“缺失值填充/Missing Value Imputation”“异常值处理/Anomaly Handling”等；
    - 待办：逐页将硬编码中文替换为对应键值，进行 UI 预览与布局核验。

### 2025-11-05
- [Tweak/DataManagement/Preprocessing/UI] 排队中状态的主操作由“开始执行”改为“取消排队”；新增二次确认弹窗；确认后任务状态置为“未开始(not_started)”，并在曾经排队的任务上显示“重试”主操作（清空进度）。
  - 涉及文件：
    - src/components/DataManagement.tsx（新增 not_started 与 hasQueuedBefore 字段；加入取消排队确认弹窗与处理逻辑；调整操作列按钮与状态徽章渲染）
    - src/i18n/LanguageContext.tsx（新增键：task.actions.cancelQueue、task.dialog.cancelQueue.description、task.filters.status.not_started、data.toast.cancelQueueSuccess 的中英文文案）
  - 说明/验证：
    - 启动开发服务器并预览 http://localhost:3000/ → “数据管理” → “预处理任务管理”；
    - 在排队中（pending）任务行点击“取消排队”，弹出确认对话框；点击“确认”后状态切换为“未开始”，进度清空；若 hasQueuedBefore=true，则“未开始”主操作显示为“重试”；
    - 切换语言，确认新增文案键均正常展示；终端与控制台无报错；交互符合预期。

### 2025-11-05
- [Remove/DataManagement/Preprocessing/UI] 预处理任务列表移除“复制规则”按钮（保持其他操作不变）。
  - 涉及文件：
    - src/components/DataManagement.tsx（删除在 failed/success 两种状态下渲染的 `t('task.actions.copyRules')` 按钮）
  - 说明/验证：
    - 运行 `npm run dev` 并打开 http://localhost:3000/ → 数据管理 → 预处理任务管理；
    - 在列表“操作”列不再显示“复制规则”按钮；其他按钮如“查看详情/开始/编辑/删除/重试”等正常；终端与控制台无报错。

- [Chore/Cleanup] 清理“复制规则”相关的残留代码与文案键值（避免死代码与无用 i18n）。
  - 涉及文件：
    - src/components/DataManagement.tsx（删除未使用的 `handleCopyRules` 函数）
    - src/i18n/LanguageContext.tsx（移除 `task.actions.copyRules` 与 `data.toast.copyRulesToTemplateSuccess` 的中英文键值）
  - 说明/验证：
    - 启动 `npm run dev`，确认编译通过、控制台无缺失键值的报错；
    - 页面功能不受影响；“复制规则”按钮与相关提示已不存在；
    - HMR 正常，无 Fast Refresh 异常停止（有日志提示但页面刷新后正常）。

### 2025-11-04
- [Remove/DataDetail&VersionHistory/UI] 去掉红框内的内容：移除“数据概览”页的标题与说明文案；移除“版本历史”页顶部标题与数据集名称；删除版本列表“操作”列中的两个图标按钮（仅保留“切换查看”文字按钮）。
  - 涉及文件：
    - src/components/DataDetailFullPage.tsx（删除 `renderDataOverview` 顶部标题区）
    - src/components/VersionHistory.tsx（删除页头标题与数据集名；移除操作列 Eye/RotateCcw 两个图标按钮）
  - 说明/验证：
    - 启动 `npm run dev`；预览“数据详情 → 数据概览/版本历史”。
    - 页面不再显示被红框标注的标题/说明文案；版本列表操作列只保留“切换查看”按钮；交互与筛选逻辑不受影响；控制台与终端无报错。

### 2025-11-04
- [Fix/VersionHistory/UI] 按用户要求恢复“回滚”按钮（RotateCcw 图标），保留“查看”图标移除。
  - 涉及文件：
    - src/components/VersionHistory.tsx（在操作列重新加入 RotateCcw ghost 按钮，点击触发 handleRollback；失败状态下禁用）
  - 说明/验证：
    - 预览 http://localhost:3000/ → 数据详情 → 版本历史；操作列显示回滚图标按钮，点击弹出回退确认并执行模拟回退；控制台与终端无报错。

### 2025-11-04
- [Tweak/DataDetail/VersionHistory] 数据详情-版本历史列表：将顶部“全部状态”“全部来源”筛选迁移到版本列表表头 Popover（来源方式、状态两列），统一筛选入口与交互。
  - 涉及文件：
    - src/components/VersionHistory.tsx（移除顶部两个 Select；为“来源方式”“状态”两列新增 Popover + RadioGroup 单选：全部/具体选项；新增 `isStatusColFilterOpen/isSourceColFilterOpen` 与临时选择 `tempStatusFilter/tempSourceFilter`，支持重置和确认）
  - 说明/验证：
    - 启动：`npm run dev`；预览 http://localhost:3000/ → 数据详情页 → “版本历史”。
    - 在表头点击 Filter 图标弹出筛选 Popover，选择后列表过滤正确；点击“重置”回到“全部”，点击“确认”应用并关闭；控制台与终端无报错。

### 2025-11-04
- [Tweak/DataManagement/Preprocessing] 预处理任务列表“状态筛选”入口迁移：顶部“全部状态”下拉移至“状态”列头 Popover（与项目管理页列头筛选风格一致）。
  - 涉及文件：
    - src/components/DataManagement.tsx（移除顶部状态下拉；新增 `isPreprocessStatusColFilterOpen`；在表头“状态”处加入 Popover + RadioGroup 单选：全部/运行中/排队中/已完成/失败；保留原有 `taskFilters.status` 逻辑）
  - 说明/验证：
    - 启动：`npm run dev`；预览 http://localhost:3000/ → “数据管理” → “预处理任务管理”。
    - 顶部不再显示“全部状态”下拉；“状态”列头显示过滤图标，点击弹出筛选 Popover，选择任一状态后列表即时过滤；点击“重置”回到“全部”。
    - 与搜索框和日期范围保持联动；桌面/移动端交互正常，控制台与终端无报错。

### 2025-11-04
- [Feat/ProjectManagement/MetricsCards] 项目管理页面新增四个统计指标卡片（总项目、进行中、已完成、已延期），与顶部筛选（搜索/负责人/日期范围）联动，状态列筛选不影响统计。
  - 涉及文件：
    - src/App.tsx（新增统计计算 `filteredProjectsForMetrics` 与 `projectStats`；引入 `Card`/`CardContent` 并在页头与工具栏之间插入卡片栅格；补充 `AlertTriangle` 图标）
  - 说明/验证：
    - 启动开发服务器：`npm run dev`；预览地址 http://localhost:3000/ → “项目管理”。
    - 默认无筛选时，当前 mock 数据统计为：总项目 4、进行中 3、已完成 1、已延期 0；在搜索/负责人/日期范围变化后，卡片数值随之更新；切换状态列筛选（列表表头 Popover）不会影响卡片数值。
    - 桌面端与移动端栅格响应式正常，控制台与终端无报错。

### 2025-11-04
- [Tweak/Projects&Data/ViewMode] 项目管理与数据管理页面默认视图改为“列表”，并将视图切换按钮顺序调整为“列表在前、网格在后”。
  - 涉及文件：
    - src/App.tsx（`viewMode` 默认值由 `grid` → `list`；顶栏切换按钮顺序调整为“列表、网格”）
    - src/components/DataManagement.tsx（`viewMode` 默认值由 `grid` → `list`；右侧切换按钮顺序调整为“列表、网格”）
  - 说明/验证：
    - 启动开发服务器并访问 http://localhost:3001/；进入“项目管理”“数据管理”两页。
    - 页面初始即展示“列表视图”，切换按钮组中“列表”处于激活态，“网格”为非激活态；点击可在两种视图间切换。
    - 桌面端与移动端（窄屏）下按钮布局与交互一致，控制台与终端无报错。

### 2025-11-04
- [Remove/ProjectManagement/Entry] 移除网格视图中的“创建新项目”卡片；统一入口为顶栏右侧“创建项目”按钮。
  - 涉及文件：
    - src/App.tsx（删除网格“创建新项目”卡片 JSX；保留顶栏按钮触发抽屉）
  - 说明/验证：
    - 打开 http://localhost:3001/ → “项目管理”；切换到“网格视图”，不再显示“创建新项目”卡片；
    - 顶栏右侧“创建项目”按钮仍可打开创建抽屉；控制台与终端无报错。

### 2025-11-04
- [Tweak/ProjectManagement/UI] 在项目管理列表的日期选择器与视图切换按钮之间新增“查询”和“重置”按钮，便于显式触发筛选与快速清空。
  - 涉及文件：
    - src/App.tsx（新增 handleApplyProjectQuery/handleResetProjectFilters；在日期 Popover 与视图切换之间插入按钮组）
  - 说明/验证：
    - 启动 `npm run dev` 并在 http://localhost:3001/ 打开“项目管理”；
    - 确认顶部工具栏中“开始日期 - 结束日期”右侧出现“查询/重置”按钮；
    - 点击“查询”不改变筛选状态但触发显式刷新；点击“重置”清空搜索、负责人与日期范围（状态列筛选回到“全部状态”）；
    - 控制台与终端无报错，HMR 正常。

- [Tweak/ProjectManagement/UI] 顶栏视图切换靠右与样式统一：将“网格/列表”按钮移动到顶栏右侧独立分区；统一“查询/重置/视图切换”按钮高度与间距，并优化激活/非激活配色。
  - 涉及文件：
    - src/App.tsx（重构顶栏布局为左右分区；右侧 `ml-auto` 靠右展示视图切换；按钮统一 `h-10 md:h-12`、`px-4`、`gap-2`；视图切换非激活改为 `outline`，重置按钮使用 `outline`）
  - 说明/验证：
    - 打开 http://localhost:3001/ → “项目管理”；观察顶栏右侧为“网格/列表”按钮组，左侧依次为搜索/负责人/日期/查询/重置；
    - 切换“网格/列表”验证激活态为填充（default），非激活态为描边（outline）；
    - 在 1280/1440/移动端宽度下检查按钮高度与间距一致，移动端可换行但右侧按钮始终靠右；终端与控制台无报错。

- [Tweak/ProjectManagement/Entry] 创建入口调整：在列表上方（顶栏右侧）新增“创建项目”主按钮；移除列表内的“创建新项目”占位行，避免视觉干扰。
  - 涉及文件：
    - src/App.tsx（在右侧视图切换按钮旁新增“创建项目”按钮：`<Plus/> 创建项目`；删除列表视图中“创建新项目行” JSX；保留网格视图中的“创建新项目卡片”）
  - 说明/验证：
    - 打开 http://localhost:3001/ → “项目管理”；确认顶栏右侧出现“创建项目”按钮，点击可打开右侧创建抽屉；
    - 切换到“列表视图”时不再显示首行的“创建新项目”占位行；
    - 网格视图仍保留“创建新项目”卡片；控制台与终端无报错。

### 2025-11-04
- [Remove/TaskManagement/UI] 移除任务管理页标题下方的“筛选条件”面板（红框区域），统一改用列表列头 Popover 作为唯一筛选入口；同时保留顶部操作栏中的“搜索/数据集名称/日期范围”。
  - 涉及文件：
    - src/components/TaskManagement.tsx（删除筛选面板整块 JSX；保留列头筛选与顶部三项；为相关事件添加类型注解以消除隐式 any）
  - 说明/验证：
    - 启动 `npm run dev` 并在 http://localhost:3000/ 打开“任务管理”；
    - 页面标题下方不再出现“筛选条件”大面板（红框区域）；
    - 列头“任务类型/状态/所属项目/优先级/模型”筛选图标可弹出 Popover 并即时过滤；
    - 顶部工具栏左侧保留“搜索/数据集名称/日期范围”，交互正常；
    - 终端与控制台均无报错；Vite HMR 更新正常。

- [Tweak/TaskManagement/Toolbar] 顶部右侧按钮改造：将“筛选”按钮移除，替换为“查询”和“重置”按钮；查询按钮触发一次轻量刷新，重置按钮清空所有筛选状态。
  - 涉及文件：
    - src/components/TaskManagement.tsx（新增 handleApplyQuery；右侧工具栏替换为“查询/重置”；移除 showFilters 状态）
  - 说明/验证：
    - 预览 http://localhost:3000/ → 任务管理页；右侧不再显示“筛选”，改为“查询/重置”；
    - 点击“查询”列表按当前 filters 渲染；点击“重置”清空筛选并回到默认值；控制台无报错。

### 2025-11-04
- [Tweak/TaskManagement/UI] 顶部工具栏新增快速筛选：将任务管理列表页的“搜索/数据集名称/日期范围”三项从下方筛选面板迁移到页面上方红框位置（标题下方的操作栏左侧），与右侧的“筛选/视图切换/创建任务”同排显示；移动端自动换行。
  - 涉及文件：
    - src/components/TaskManagement.tsx（在顶部操作栏新增左侧容器，加入搜索输入、多选数据集 Popover、日期范围 Popover；移除筛选面板中的这三项，避免重复；布局采用 `flex justify-between items-center flex-wrap md:flex-nowrap`，控件设置固定宽度并 `shrink-0` 保证桌面端不换行）
  - 说明/验证：
    - 启动 `npm run dev` 并在 http://localhost:3000/ 打开“任务管理”；
    - 在 1280/1440/1920 宽度下，顶部操作栏左侧应显示“搜索/数据集名称/日期范围”三项，同一行；右侧保留“筛选/网格-列表切换/创建任务”；
    - 点击“筛选”按钮仍可展开筛选面板（不含上述三项），重置与应用正常；控制台无报错。

### 2025-11-04
- [Tweak/ProjectManagement/UI] 顶部工具栏合并：将“网格/列表”视图切换按钮与“搜索项目/全部负责人/日期筛选”放在同一行展示；缩短控件宽度并为控件添加 `shrink-0`，在 `md` 及以上屏幕保证不换行，移动端自动换行。
  - 涉及文件：
    - src/App.tsx（将原左右分栏 `md:flex-row md:justify-between` 改为单一容器同排；把视图切换按钮并入左侧工具栏容器；为搜索框、负责人选择、日期按钮与切换按钮组设置固定宽度与 `shrink-0`）
  - 说明/验证：
    - 启动 `npm run dev` 并在 http://localhost:3000/ 打开“项目管理”；
    - 在 1024/1280/1440 宽度下确认“搜索项目、全部负责人、日期筛选、网格/列表”四项同一行；
    - 将窗口缩至 <768px 时控件会自动换行但保持可点击；控制台无报错。

### 2025-11-04
- [Tweak/ProjectManagement/UI] 顶部工具栏布局优化：将“搜索项目”“全部负责人”“日期筛选”三项合并为同一行；同时将搜索框宽度缩短为约 280px，日期范围按钮宽度调整为约 260px，保证桌面端常见分辨率下三项并排展示。
  - 涉及文件：
    - src/App.tsx（将原“搜索框”单独一行改为与筛选并排的 flex 布局；`Input` 采用 `w-full md:w-[280px]`；`SelectTrigger` 维持 `w-32`；日期范围触发 `Button` 改为 `w-[260px]`；容器使用 `flex flex-col md:flex-row md:items-center md:justify-between` 保证桌面同排、移动端可换行）
  - 说明/验证：
    - 启动本地开发服务器并在 http://localhost:3000/ 打开“项目管理”页；
    - 在 1280/1440/1920 宽度下，搜索框、负责人筛选、日期筛选三项在一行展示；小屏（<768px）下自动按需换行；
    - 更改搜索/负责人/日期范围后过滤行为保持不变，控制台无报错。

### 2025-11-04
- [Remove/ProjectManagement/UI] 移除项目管理页顶部工具栏的“全部状态”下拉筛选框，并从“状态”列的 Popover 选项中删除“暂停”；同步清理筛选逻辑中对“暂停”的兼容映射（不再与“已延期”关联）。
  - 涉及文件：
    - src/App.tsx（删除顶部“全部状态” Select；移除 Popover 中“暂停”选项；删除筛选逻辑对“暂停”的兼容映射）
    - project.md（去掉“暂停”状态与“暂停”操作描述；明确顶部不再提供“全部状态”筛选框）
  - 说明/验证：启动开发服务器，打开项目管理页，确认顶部不再显示“全部状态”筛选框；列表表头“状态”列 Popover 中不含“暂停”选项；切换其他状态过滤正常，控制台无报错。

### 2025-11-04
- [Feat/DataManagement/UI] 顶部“高级筛选”按钮改为“查询”，并移除高级筛选弹窗；筛选逻辑保持响应式（标签检索与日期范围即时生效），按钮仅作为显式触发。
  - 涉及文件：
    - src/components/DataManagement.tsx（删除 isAdvancedFilterOpen 与弹窗 JSX；新增 handleApplyQuery；按钮文案改为 `t('data.filter.query')`）
    - src/i18n/LanguageContext.tsx（新增 `data.filter.query` 的中英键值：查询/Query）
  - 说明/验证：启动 `npm run dev` 并在 http://localhost:3000/ 进入“数据管理”页；顶部显示“查询”按钮，点击不弹窗；标签检索和日期范围选择仍可即时过滤；控制台无报错。

- [Feat/ProjectManagement/List] 项目管理列表：状态列筛选（列头 Popover）+ 创建时间/更新时间排序（点击列头切换升/降序）。
  - 涉及文件：
    - src/App.tsx（新增 projectSortField/order 状态与 handleToggleProjectSort；列表/网格视图统一使用 sortedProjects；在“状态”列头加入 Popover 复用顶部 statusFilter；为“创建时间/更新时间”列头加入 ArrowUpDown 点击切换）。
  - 说明/验证：`npm run dev` 启动后在 http://localhost:3001/ 打开“项目管理 → 列表视图”；点击“状态”列头的筛选图标选择状态，列表与顶部筛选保持一致；点击“创建时间/更新时间”列头切换升/降序；控制台无报错。

### 2025-11-03
- [Feat/DataManagement/Filter] 高级筛选：将“大小范围 (MB)”改为“列数范围”，并移除“完整度范围”筛选项；筛选逻辑改为按列数过滤。
  - 涉及文件：
    - src/components/DataManagement.tsx（替换 advancedFilters.sizeRange -> columnsRange；移除 completenessRange；更新筛选与重置逻辑；更新弹窗 UI）
    - src/i18n/LanguageContext.tsx（新增 i18n 键 `data.filter.columnsRange`：中/英分别为“列数范围/Columns Range”）
  - 说明/验证：运行 `npm run dev` 并在 http://localhost:3000/ 打开“数据管理 -> 高级筛选”，确认：
    - 弹窗中“大小范围 (MB)”已变为“列数范围”，且“完整度范围”输入项已移除；
    - 点击“应用”后，列表按列数范围过滤；
    - 切换语言，中英文标签均正常显示；控制台无报错。

### 2025-11-03
- [Feat/TaskDetail/UI] “显示训练数据”开关与训练/测试数据叠加展示：
  - 指标趋势（RMSE、MAPE）：在开启开关时叠加训练集曲线（虚线），图例区分“测试/训练”。
  - 时序预测折线图（真实值/预测值/CI 上下界）：开启时叠加训练集，训练数据使用虚线与紫色系区分。
  - 预测值 vs 真实值散点图与残差图：开启时叠加训练集散点，颜色区分训练/测试。
  - 误差分布直方图：开启时展示训练/测试双柱对比；关闭时保持总误差计数。
  - 分类指标报表：在卡片中追加训练集指标值的小字标注（紫色），保持测试集为主显示；ROC/PR 仍以测试集为主，后续可按需叠加训练曲线。
  - 预测结果表：新增“显示训练数据”切换开关与“数据集”列；使用 Badge 区分训练（紫）/测试（蓝）；CSV 导出在开关开启时同时导出数据集标识与合并数据。
  - 数据层：新增 combinedForecastLineData 用于合并训练/测试时序；保留 combinedMetricTrend；所有合并通过 useMemo 计算，确保切换流畅。
  - 涉及文件：
    - src/components/TaskDetailFullPage.tsx
    - 说明文档.md
  - 说明/验证：运行 `npm run dev` 并在 http://localhost:3000/ 打开任务详情（时序预测）；切换“显示训练数据”开关验证图表与表格叠加效果；导出 CSV 验证包含“数据集”列与训练/测试合并数据；控制台无报错。


### 2025-10-31
- [Feat/I18n/DataUpload] 国际化 DataUpload 组件：导入 useLanguage、初始化 t、替换表单标签/占位、状态文案、toast 提示、语音模块、文件上传区域、解析结果表头、操作按钮等为 t() 键。
  - 涉及文件：
    - src/components/DataUpload.tsx
    - src/i18n/LanguageContext.tsx
  - 新增 i18n 键：
    - common.noContent
    - data.projects.noneSelected
  - 说明/验证：运行 `npm run dev`，在 http://localhost:3002/ 打开数据上传弹窗，切换中英文验证文案均正确国际化；控制台无报错。

- [Fix/UI] 编辑数据集弹窗：去掉“数据格式”和“版本”两个输入项（与最新交互稿一致，简化表单）。
  - 涉及文件：
    - src/components/DataManagement.tsx（移除 edit-format/edit-version 区块，仅保留名称、数据源、描述与标签）
  - 说明/验证：启动开发服务器并打开“数据管理 -> 编辑数据集”，弹窗内不再显示“数据格式/版本”两个字段；保存编辑正常。

### 2025-10-29
- [Feat/TaskDetail/Export] 预测结果表支持“一键导出 CSV”（utf-8-sig + BOM），导出列顺序与页面一致，并采用整表数据（不受分页限制）。
  - 细节：
    - 文件编码：utf-8-sig（含 BOM）以便 Excel/中文环境无乱码；首行表头包含“时间/真实值/预测结果”与中间的测试集特征列。
    - 列顺序：与 UI 保持一致（时间 → 真实值 → 特征列 → 预测结果）；字段名来自 `testFeatureFieldNames`。
    - 文件命名：`forecasting_results_<taskId>_<timestamp>.csv`；直接触发浏览器下载。
    - 数据范围：导出整表数据（`forecastingTestSetRows` 全量），与当前页码无关。
  - 涉及文件：
    - src/components/TaskDetailFullPage.tsx（新增 handleDownloadForecastCSV，并在卡片右上角加入“导出 CSV”按钮）
  - 说明/验证：运行 `npm run dev` 打开 http://localhost:3003/，进入“任务详情（时序预测）”点击“导出 CSV”按钮，下载文件可在 Excel 正常打开且中文不乱码。


### 2025-10-29
- [Feat/TaskDetail/UI] 预测结果表：用真实测试集字段名替换 E1~E5，并新增分页器（每页 10 行，支持页码与省略显示）。
  - 细节：
    - 字段名来源：聚合 task.datasets 的 unionFields（过滤 id/time/date/timestamp 等字段）；若不足 5 列则使用特征权重 featureWeights 的字段名补齐。
    - 表格数据：保留“时间/真实值/预测结果”，中间列为上述动态字段名对应的示例特征值（示意数据）。
    - 分页：数据变化时自动回到第 1 页；页码区显示邻近页与首尾页，过长时使用省略号（ellipsis）。
  - 涉及文件：
    - src/components/TaskDetailFullPage.tsx
  - 验证：运行 `npm run dev`，在 http://localhost:3002// 进入某个“时序预测”任务详情页，确认表格列名来自 unionFields（或权重补齐）且分页器可交互。

- [Fix/TaskDetail] 修复“任务详情打开报错（2 条日志）”：原因是在组件渲染顺序中对未初始化变量进行访问（Temporal Dead Zone）。
  - 措施：将 testFeatureFieldNames、forecastingTestSetRows 与分页相关逻辑移动到 aggregatedStats 定义之后，且确保依赖的 featureWeights 已初始化；避免在依赖尚未初始化时参与 Hook 的依赖计算。
  - 涉及文件：
    - src/components/TaskDetailFullPage.tsx（调整 Hook 顺序，消除 ReferenceError）
  - 验证：保存后 Vite 热更新；重新打开“任务详情（时序预测）”，不再出现初始化顺序报错。

### 2025-10-29
- [Fix/UI] 输出配置：将“绝对偏差阈值(±%)”的标签文案去掉最后的百分号，改为“绝对偏差阈值(±)”。不影响输入值与保存逻辑。
  - 涉及文件：
    - src/components/TaskManagement.tsx（forecasting/regression 两处标签）
  - 验证：运行 `npm run dev`，在 http://localhost:3000/ 进入“任务管理 -> 创建新任务 -> 输出配置”；查看“绝对偏差阈值”标签，已显示为“(±)”且不再包含“%”。

- [Feat/TaskDetail/UI] 在任务详情（时序预测）页面的“任务指标”和“指标趋势”之间新增“预测结果表”，展示测试集数据列与最后一列预测结果。
  - 说明：表格展示最近 40 条记录，列包含“时间/真实值/E1/E2/E3/E4/E5/预测结果”；测试集列为示意数据，后续可替换为后端真实特征。
  - 涉及文件：
    - src/components/TaskDetailFullPage.tsx（新增 forecastingTestSetRows 数据构造；插入 Table 卡片）
  - 验证：运行 `npm run dev` 并打开 http://localhost:3000/（如端口占用则自动切换到 3001）；进入任务详情的时序预测页，确认在“任务指标”后的红框区域显示“预测结果表”，最后一列为预测结果。

### 2025-10-29
- [Feat/Tasks/UI] 参数配置：将“预测开始时间”改为非必填，并把输入控件从日期/时间选择改为文本框；占位提示“可选，示例：2025-10-29 08:00 或留空”。
  - 涉及文件：
    - src/components/TaskManagement.tsx（移除必填校验；label 去星号；输入类型改为 text）
    - src/mock/taskTypeTemplates.ts（模板字段改为非必填，类型改为 text）
  - 验证：运行 `npm run dev` 打开 http://localhost:3000/，进入“任务管理 -> 创建新任务 -> 参数配置（时序预测）”；“预测开始时间”字段不再显示红色星号；输入框为文本框且可留空提交。

### 2025-10-27
- [Fix/UI] 任务对比入口渲染范围修正：将“任务对比预览”浮动按钮与弹窗仅在“任务管理”页渲染，解决在“数据管理”页出现的底部伪影。
  - 涉及文件：
    - src/App.tsx（根据 activeTab === '任务管理' 条件渲染 FloatingAssistantEntry/TaskCompare 对话框）
  - 验证：在 http://localhost:3000/ 进入“数据管理”页，底部不再出现对比按钮伪影；切换到“任务管理”页按钮/弹窗正常。

- [Feat/DataManagement] 预处理任务列表切换为“任务ID”：将列表第一列与搜索逻辑从“任务名称”改为“任务ID”，并将筛选占位文案更新为“按任务ID或数据集搜索”；查看详情提示改为展示任务ID。
  - 涉及文件：
    - src/components/DataManagement.tsx（列标题/内容、搜索占位与过滤逻辑、查看详情提示文案）
  - 验证：在 http://localhost:3000/ 进入“数据管理 -> 预处理任务管理”，第一列显示任务ID；输入任务ID或数据集名可过滤列表。

- [Chore/Dev] 开发预览地址统一：确认并改用 vite.config.ts 中配置的 3000 端口；启动本地开发服务器进行联调与验证。
  - 预览地址：http://localhost:3000/


### 2025-10-23
- [Feature/Config] 任务管理：新增 OutputConfig 类型定义并扩展 FormData，初始化默认输出配置（预测/分类/回归均勾选常用指标与可视化）。
  - 涉及文件：
    - src/components/TaskManagement.tsx（新增 AverageMethod/OutputConfig 类型；在 formData 中加入 outputConfig 默认值）
  - 说明/验证：本次为类型与默认值扩展，暂不包含 UI 渲染；后续将补充“输出配置”页面区块并将其映射到任务提交 payload。

- [Feature/Import/Export] 任务管理：JSON 模板导出/导入支持输出配置（output）字段，并与 UI 预填联动
  - 涉及文件：
    - src/components/TaskManagement.tsx（buildJsonTemplate/handleExportJsonTemplate/handleImportJsonFile）
  - 说明/验证：
    - 导出模板包含 output（随 taskType 的分支）
    - 导入 JSON 自动切换到 json 模式，并按输出配置预填 UI
    - 预览地址：http://localhost:3002/

- [Feature/Edit] 编辑模式预填：从 task.config.output 映射到 formData.outputConfig（按任务类型）
  - 涉及文件：
    - src/components/TaskManagement.tsx
  - 说明：编辑任务时自动回显输出配置，避免手动重选

- [Feature/Save] 保存逻辑统一：
  - json 模式：解析 manualConfig 并合并当前 output 到 JSON（补齐 taskType/mode），再字符串化保存
  - page 模式：在 base（forecasting/classification/regression）结构上加入 output 字段
  - 涉及文件：
    - src/components/TaskManagement.tsx
  - 说明/验证：无论模式，后端收到的 config 均含 output 字段

- [Tweak/Type] 类型增强：handleInputChange 使用泛型 <K extends keyof FormData>
  - 涉及文件：
    - src/components/TaskManagement.tsx
  - 说明：减少隐式 any 警告，提升类型安全


### 2025-10-22
- [Feature/UI] 重复值弹窗“行详情”改为展示整行数据的表格
  - 变更点：PopoverContent 宽度 `w-[820px] max-w-[90vw]`；外层容器添加 `overflow-auto max-h-[420px] max-w-full`；表头/单元格添加 `whitespace-nowrap`；提示信息更新。
  - 效果：完整展示整行数据，横向/纵向滚动均可，列不自动换行，适合查看长行。
  - 涉及文件：
    - `src/components/DataPreprocessing.tsx`
  - 预览：进入“数据管理 -> 数据预处理 -> 去重规则”，点击“列预览/样本值”，弹窗显示整行表，滚动正常。

- [Feature/Mock] 预览数据接入 mock 并默认显示
  - 新增：`src/mock/datasetPreview.ts` 提供示例行（设备、ERP、日志、质检），涵盖字符串/数字/日期/数组(tags)/对象(meta)。
  - 接入：`DataPreprocessing.tsx` 中 `rawPreviewRows` 优先使用 `datasetPreviewRows[activeDatasetId]`，否则按 `previewSchema` 生成；打开弹窗时自动选择第一个数据集；扩展 `datasetFieldSchemas`（为数据集 `id=1` 补充 `tags/meta/location/batch_no/process/station/remarks` 等列）。
  - 影响：即使未接后端，也能直观看到示例数据；去重与预览逻辑基于该数据工作。
  - 预览：运行 `npm run dev`，在 `http://localhost:3000/` 打开“数据预处理”，无需额外操作即可看到预览数据。


### 2025-10-21
- [Feature/UI] 数据预处理：新增“数据转换（numeric_transform）”规则配置区，支持多字段选择与方法参数设置
  - 方法：对数变换、平方根变换、Box-Cox、Yeo-Johnson、分位数变换；提供默认参数与输入校验；Box-Cox/Yeo-Johnson 的 λ 支持自动估计；分位数变换支持分位数数目与输出分布选择
  - 涉及文件：
    - src/components/DataPreprocessing.tsx
  - 预览：
    - 运行 `npm run dev`；在 http://localhost:3000/ 打开“数据管理 -> 数据预处理”，新增规则类型选择“数据转换”，配置区可正常渲染与交互。
- [Validation] 扩展 `handleApply` 对 numeric_transform 的严格校验：仅数值型字段；Box-Cox/Yeo-Johnson 的 λ（若填写）需为数值；分位数变换的分位数数目需为>=2的整数，输出分布需为均匀或正态
  - 涉及文件：
    - src/components/DataPreprocessing.tsx
- [Feature/UI] 范围值拆分（split_range）：增加“自动建议分隔符”和“检测样例”按钮；优化分隔符/正则占位符与说明文案，支持负数范围（如 -5~5）
  - 涉及文件：
    - src/components/DataPreprocessing.tsx

- [Tweak/UI] 数据详情页：移除“数据交互分析”页签与内容，保留“数据概览及变量”和“缺失分析”；简化导航与说明文案，界面更清晰
  - 涉及文件：
    - src/components/DataDetailFullPage.tsx
  - 预览：
    - 在 http://localhost:3000/ 打开“数据管理 -> 数据集详情分析”，确认不再显示“数据交互分析”页签，页面无报错。

### 2025-10-16
- [Feature/UI] 数据预处理：在“选择数据集（Step 0）”新增结构化信息面板
  - 右侧信息面板在选择数据集后即时显示：
    - 数据名称（标题行、右侧提供“上传”按钮以便替换/补充文件）
    - 数据量（记录总数，如 98,500 条记录）
    - 字段梳理（字段名 + 类型列表，可滚动查看）
    - 文件大小（如 85MB）
  - 为示例数据集补充字段 schema 映射（datasetFieldSchemas），用于 Step 0 的即时展示，不依赖后续字段加载。
  - 涉及文件：
    - src/components/DataPreprocessing.tsx（新增 datasetFieldSchemas；在 Step 0 渲染结构化信息面板）
  - 验证：
    - 运行 `npm run dev`，在 http://localhost:3000/ 进入“数据管理 -> 数据预处理 -> 选择数据集”；选择任一数据集后，右侧面板显示“数据名称/数据量/字段梳理/文件大小”，字段列表可滚动。


### 2025-10-16
- [Feature/UI] 预处理执行入口与二次确认弹窗优化：
  - 将“应用处理”按钮改为“开始执行数据处理”，并使用播放图标（Play）以符合原型视觉；加载态文案为“处理中...”。
  - 二次确认弹窗（action='apply'）新增：当前所选数据集名称、醒目提示块（黑底蓝字）与“确认开始”按钮文案；说明“此操作不会修改原始数据”。
  - 涉及文件：
    - src/components/DataPreprocessing.tsx（按钮文案与图标、确认弹窗内容与样式；复用 handleApply/handleConfirm）
  - 验证：`npm run dev` 后在 http://localhost:3000/ 进入“数据管理 -> 数据预处理 -> 规则 JSON”页签，查看底部主按钮与确认弹窗效果。

- [Build/Deploy] 部署准备：新增 Vercel 配置并完成本地构建
  - 新增 vercel.json，指定输出目录为 build，并通过 rewrites 实现 SPA 路由回退（避免影响静态资源请求）。
  - 运行 `npm run build` 成功生成构建产物到 build/ 目录。

- [Chore/Repo] 忽略构建产物与系统文件
  - 更新 .gitignore：添加 build/、dist/、.vercel/ 与 .DS_Store，避免将构建产物与本地文件提交到仓库。

- [Docs] 更新日志，记录上述 UI、构建与仓库配置变更。

### 2025-10-16
- [Fix/AI] 修复“智能助手”在 FullPageView 中打开后崩溃的问题：
  - 现象：点击右上角“智能助手”按钮，页面报错并提示在 `<GlobalAIAssistant>` 组件中发生错误。
  - 原因排查：
    - 组件在挂载阶段使用了 `useXAgent/useXChat` 钩子并传入空配置，可能触发运行时校验导致异常；
    - 同时使用了 `antd` 的 `Flex` 组件，在某些版本下存在运行时不兼容风险，可能造成 “Element type is invalid” 类错误。
  - 修复措施：
    - 移除 `useXAgent/useXChat`，改为本地 `useState` 管理消息与加载态，仅模拟回复，不依赖后端；
    - 将 `Flex` 替换为 `div + CSS（display:flex; gap）`，移除对 `antd/Flex` 的运行时依赖；
    - 在 `src/components/FullPageView.tsx` 的 `ai-assistant` 场景中引入 `ErrorBoundary` 包裹助手组件，避免异常扩散；
    - 通过 `onClose` 将 FullPageView 的关闭逻辑传递给 `GlobalAIAssistant`，启用悬浮关闭按钮。
  - 涉及文件：
    - src/components/GlobalAIAssistant.tsx（移除 useXAgent/useXChat；替换 Flex；本地消息状态；保留前端原型逻辑）
    - src/components/ErrorBoundary.tsx（新增：错误边界）
    - src/components/FullPageView.tsx（为 ai-assistant 引入错误边界并传递 onClose）
  - 验证：
    - 运行 `npm run dev`，在 http://localhost:3000/ 点击“智能助手”按钮可正常打开；输入消息获得模拟回复；悬浮关闭按钮与顶部返回/关闭均可正常关闭；控制台不再出现崩溃日志。

### 2025-10-16
- [Feature/AI/UI] 合并智能助手入口为单一入口，并将 AI Copilot 改为纯前端原型（使用模拟数据与本地回复），随后统一到 FullPageView（type='ai-assistant'）：
  - 变更点：
    - src/components/Header.tsx：移除旧的“Bot”图标与 onOpenBot 入口，仅保留右上角“智能助手”按钮（MessageCircle）。
    - src/App.tsx：移除 GlobalBot 引用与直接渲染；改为通过 FullPageView 统一打开助手（type='ai-assistant'），删除 isAIAssistantOpen 状态。
    - src/components/GlobalAIAssistant.tsx：去除真实网络请求逻辑，保留 Ant Design X 结构；新增本地模拟回复（按主题生成演示文案）、加载状态与取消机制；保留会话管理、提示词、附件占位与气泡列表等。
    - src/components/FullPageView.tsx：新增 'ai-assistant' 类型并渲染 GlobalAIAssistant，替换旧的 'global-bot'。
  - 说明/验证：
    - 通过 `npm run dev` 启动 Vite，本地预览 http://localhost:3000/。
    - 点击右上角“智能助手”打开 FullPageView -> 智能助手；输入内容会在 0.8s 后生成模拟回复；可点击“取消”中止当前模拟回复；提示卡片与多会话切换正常。
  - 参考原型：https://ant-design-x.antgroup.com/docs/playground/copilot-cn

### 2025-10-16
- [Fix/Chart] 修复“任务结果”区图表不显示问题：为 ChartContainer 增加尺寸检测与数值回退，避免父容器宽/高为 0 时 Recharts 无法渲染；当检测到 0 尺寸时以 640×240 作为回退尺寸渲染；正常情况下仍维持 width/height 为 100% 的响应式。
  - 涉及文件：
    - src/components/ui/chart.tsx（新增 ResizeObserver 尺寸测量；在 ResponsiveContainer 上增加数值回退逻辑；保留 w-full 与 min-h-[220px]）
    - src/components/TaskDetailFullPage.tsx（确认“指标趋势/时序预测/预测值vs真实值/残差图/误差直方图/模型对比”等 6 类图表使用示例数据渲染）
  - 说明/验证：使用 `npm run dev` 启动 Vite，本地预览 http://localhost:3000/；进入某个“时序预测”任务的“任务结果”页签，6 类图表均能正常显示（无控制台报错）。

- [Docs] 更新版本修改记录，补充本次修复说明与验证步骤。
  - 预览地址：http://localhost:3000/
 
- [Feature/UI] 将“参数 JSON 回显”从“参数配置”区移动至“任务产物”区进行展示，并在产物列表新增 `task_params.json` 条目；为该条目绑定“下载”直接导出 JSON 与“预览”滚动定位到下方卡片；预览区增大高度并使用 `whitespace-pre` 确保格式完整呈现。
  - 涉及文件：
    - src/components/TaskDetailFullPage.tsx（新增 artifacts 列表项、产物区参数 JSON 卡片、下载/预览行为联动；移除参数配置区的旧卡片）
  - 说明/验证：运行 `npm run dev`，在任务详情页左侧点击“任务产物”，确认列表出现 `task_params.json`；点击“预览”会滚动到下方“参数 JSON 回显”卡片，点击“下载”直接导出 JSON 文件；预览区域可完整显示格式化 JSON；预览地址 http://localhost:3000/。

- [Feature/Artifacts] 任务产物支持预览：点击 `model_config.yaml` 的“预览”按钮弹窗展示 YAML 内容（示例占位），点击“下载”直接导出该 YAML；`task_params.json` 保持列表预览联动为滚动定位、下载为 JSON 导出。
  - 涉及文件：
    - src/components/TaskDetailFullPage.tsx（新增产物预览弹窗状态与内容，绑定下载/预览按钮行为）
  - 说明/验证：在“任务产物”中点击 `model_config.yaml` 的预览按钮，可查看弹窗中的示例 YAML；下载按钮直接保存为 model_config.yaml；预览地址 http://localhost:3000/。

- [Fix/UI] 调整预览高度：将“任务产物”预览弹窗容器限制为 `max-h-[72vh]`，预览内容区域 `max-h-[60vh]` 并开启滚动；同时将“参数 JSON 回显”卡片的默认高度收敛为 `max-h-[420px]`（中屏为 `520px`，大屏为 `60vh`），避免过高影响页面浏览。

- [Fix/Artifacts] 去掉红框内容：从产物列表中移除 `training_history.json`（示例数据不再展示）；移除下方“参数 JSON 回显”卡片，并将 `task_params.json` 的“预览”改为弹窗展示，保持“下载”导出不变。

- [Feat/Artifacts] 更新 `task_params.json` 的预览内容：弹窗中展示新的结构体字段（task_info、dataset_config、model_config、resource_config），与需求示例一致；下载内容与预览保持一致。

- [Tweak/UI] 因果关系图尺寸优化：将因果图的 SVG 高度从 `h-64` 调整为 `h-48 md:h-56`，并增加 `max-h-[50vh]` 限制，同时略微收紧外层内边距（`p-2 md:p-3`），以与其他可视化图表保持更协调的占位比例。
  

### 2025-10-11
- [Fix/UX] 数据预处理规则卡片：移除“启用/禁用”开关，仅保留右侧删除按钮；清洗规则将按当前配置执行（不再提供启用开关）
  - 涉及文件：
    - src/components/DataPreprocessing.tsx（删除 Switch 引用与开关 UI，保留并右对齐删除按钮）
  - 说明/验证：在 http://localhost:3000/ 打开“数据管理 -> 数据预处理 -> 创建预处理任务”，规则卡片顶部不再出现开关，仅保留右侧删除按钮；控制台无错误。

- [Feature/UX] Solo 模式策略选择：语音输入替换为文本输入，并新增占位提示
  - 占位提示文案：请让输入自然语言指令，例如对数据进行去重、缺失值填充（均值/众数/前向填充）
  - 涉及文件：
    - src/components/SoloDataCleaning.tsx（移除语音入口 UI，新增 Label/Textarea 与占位提示）
  - 说明/验证：在 http://localhost:3000/ 打开 Solo 模式，策略选择区域显示文本输入框与上述占位提示，无语音控件。

- [Feature/AI] 文本指令与策略联动：基于关键词的自动勾选与排序
  - 变更点：
    - 新增 strategyKeywordMap（去重、缺失值填充：均值/众数/前向填充、格式标准化、异常值、文本标准化等关键词）。
    - computeStrategyScores 对文本进行关键词匹配评分。
    - 在“策略选择”步骤中，根据分数对策略排序，并自动勾选匹配到的策略（保留用户已有选择）。
  - 涉及文件：
    - src/components/SoloDataCleaning.tsx（新增映射、评分与 useEffect 联动逻辑）
  - 说明/验证：在策略文本框输入“去重，并对缺失值做前向填充与均值填充”，相关策略将自动靠前排序并被勾选。

- [Build/Dev] 启动本地开发服务器以验证上述 UI 交互
  - 预览地址：http://localhost:3000/
  

### 2025-10-10
- [Feature/UX] 项目详情页（Solo 模式）新增“语音指令入口”与“本次与历史 Solo 会话记录”展示：
  - 语音入口包含录音按钮（占位实现）、文本输入与执行按钮；执行后将指令转为简化任务并记录。
  - 会话记录展示简化任务名、时间与“查看详情”入口；详情含原始指令与预计执行步骤。
  - 涉及文件：
    - src/components/ProjectDetailCards.tsx（新增 Mic/Square/Send/MessageSquare/Clock/Eye 图标、语义理解示例 semanticSimplify、会话记录 UI 与交互）。
  - 说明/验证：在 http://localhost:3000/ 进入项目详情（Solo 模式），右下角卡片可输入指令并执行；左下角记录区新增条目，点击“查看详情”展开原始指令与步骤。

- [Feature/Security] 数据上传与数据源新增：强制“所属项目”必选与“权限设置”可见性说明，公开权限覆盖项目成员可见性：
  - 涉及文件：
    - src/components/DataUpload.tsx（新增 projectId、permission 字段与校验；可见性预览区）。
    - src/components/DataSubscription.tsx（新增 projectId、permission 字段与校验；可见性预览区）。
  - 说明/验证：未选择项目时阻止上传/创建并提示；切换为公开时展示“公开数据”徽标与覆盖说明。

### 2025-10-10
- [Feature/Style] 报表页交互维度选择：新增无数据时的模拟字段选项与默认全选；未选项默认文字色改为黑色
  - 涉及文件：
    - src/components/ReportView.tsx（FALLBACK_X/FALLBACK_Y；未选标签文字色、边框调整；初始化选择与联动）
  - 说明/验证：在 http://localhost:3000/ 打开“分析报表”，若未加载数据，X 显示 12 个示例字段、Y 显示 prediction/actual，均可多选；未选标签文本为黑色，交互与下方数据表联动正常。

### 2025-10-10
- [Fix/UX] 移除项目详情中的“项目完成度”字段与进度条显示
  - 背景：当前系统无法准确计算完成度指标，展示可能造成误导。
  - 涉及文件：
    - src/components/ProjectDetailCards.tsx（删除完成度区块与 Progress 引用）
  - 说明/验证：在 http://localhost:3000/ 进入项目详情页，基本信息卡片中不再显示“项目完成度”与进度条，布局保持正常。

### 2025-10-10
- [Build/Automation] 引入 Husky + Commitlint，并新增 pre-commit 自动校验：当 src/styles/vite.config.ts/package.json 有改动时，要求本次提交同步更新 CHANGELOG.md 且包含当天日期段（如：`### 2025-10-10`）。
  - 涉及文件：
    - package.json（新增 devDependencies 与 prepare/check 脚本）
    - commitlint.config.cjs（提交信息规范：Conventional Commits）
    - scripts/check-changelog.js（自定义校验脚本）
    - .husky/pre-commit、.husky/commit-msg（Git 钩子）
  - 说明/验证：修改 src 任意文件后尝试提交，若未更新 CHANGELOG.md 将被阻止；更新并暂存 CHANGELOG 后提交可通过。提交信息需符合 Conventional Commits 规范。

### 2025-10-10
- [Fix/UX] 预处理创建流程补全：新增 Step 0“选择数据集”，统一从列表页与行内入口的流程顺序
  - 背景：点击“创建预处理任务”直接跳到“字段选择”，缺失数据集选择步骤，导致不同入口的流程不一致。
  - 变更点：
    - 新增 Step 0“选择数据集”，整体流程调整为 0 选择数据集 → 1 字段选择 → 2 规则配置 → 3 预览结果。
    - 引入 `selectedDatasetId` 状态并在进入“字段选择”后按所选数据集加载字段信息。
    - 从数据集行内入口打开时自动预选对应数据集，但仍停留在 Step 0 显示已选数据集，以保持流程一致性。
  - 涉及文件：
    - src/components/DataPreprocessing.tsx（新增步骤、状态与 Tabs；调整 useEffect 与加载逻辑；更新步骤指示器为四步）
    - src/components/DataManagement.tsx（列表页“创建预处理任务”不传 datasetId；行内预处理传入 datasetId）
  - 说明/验证：在 http://localhost:3000/ 打开“数据管理 -> 数据预处理”，点击“创建预处理任务”应首先显示“选择数据集”步骤；选择数据集并点击“下一步：字段选择”后再加载字段信息；从数据集行内入口也应先停留在“选择数据集”，但已预选目标数据集。

### 2025-10-10
- [Fix/UX] 修复数据管理模块中“数据预处理”入口点击后直接弹窗的问题，恢复为任务列表页面优先展示
  - 说明：切换到“数据预处理”子菜单时，先展示“预处理任务管理”列表与“创建预处理任务”按钮；仅在点击“创建预处理任务”或数据集行内的预处理操作时再打开预处理弹窗。
  - 涉及文件：
    - src/components/DataManagement.tsx（新增任务列表 UI、状态与操作；移除子菜单中直接渲染弹窗的逻辑）
  - 说明/验证：在本地预览 http://localhost:3000/ 打开“数据管理 -> 数据预处理”，应看到任务列表与信息提示条；点击“创建预处理任务”后弹出预处理对话框。

### 2025-10-10
- [Fix/Style] 调整“数据预处理”弹窗宽度与滚动以避免水平滚动条
  - 主要修改：将弹窗容器从 `max-w-7xl`/默认 `sm:max-w-lg` 改为 `sm:max-w-6xl max-w-6xl w-[95vw]`，并增加 `overflow-x-hidden` 与 `max-h-[90vh] overflow-y-auto`；同时让次级弹窗在小屏下 `w-[95vw]`，避免过窄导致内容挤压。
  - 涉及文件：
    - src/components/DataPreprocessing.tsx（更新 DialogContent 样式类名）
  - 说明/验证：在 http://localhost:3000/ 打开“数据管理 -> 数据预处理 -> 创建预处理任务”，弹窗应在桌面端宽屏达到 6xl（约 72rem）且不出现水平滚动，内容可在垂直方向滚动查看。

### 2025-10-10
- [Feature/UX] 在项目管理的“复制项目”弹窗中新增三项可选内容（复选框，默认全部勾选）：
  - 复制项目下的任务
  - 复制项目下的数据集
  - 复制项目成员
  - 若用户取消所有勾选，则仅复制项目基础信息（项目名称与描述）。
  - 涉及文件：
    - src/App.tsx（新增 Checkbox 组件引用与状态逻辑，更新对话框内容与确认逻辑）
  - 说明/验证：在本地预览 http://localhost:3000/ 中打开“项目管理 -> 复制项目”，确认三个复选框默认勾选、布局清晰，取消全部时仅复制基础信息。

### 2025-10-10
- [Style/Fix] 调整“任务对比预览”对话框的高度与滚动，避免内容超出页面后无法完整查看
  - 涉及文件：
    - src/App.tsx
    - src/components/TaskManagement.tsx
  - 主要修改：在 DialogContent 上增加 `max-h-[90vh]` 与 `overflow-y-auto`，确保内容在视口内可滚动查看。
  - 说明/验证：在本地预览中确认纵向可滚动、内容可完整查看。

- [Style/Responsive] 统一“任务对比预览”对话框宽度策略以适配大屏并避免横向滚动
  - 涉及文件：
    - src/App.tsx
    - src/components/TaskManagement.tsx
  - 主要修改：设置 `sm:max-w-6xl max-w-6xl w-[95vw]`，并隐藏横向滚动 `overflow-x-hidden`，保证大屏自适应、内容尽量在宽度内完整展示。
  - 说明/验证：在本地预览 http://localhost:3000/ 验证无水平滚动、宽度在大屏达到 `max-w-6xl`。

- [Build/Dev] 启动本地开发服务器以验证 UI 修改
  - 涉及文件：vite.config.ts（端口配置 3000）
  - 说明/验证：通过 `npm run dev` 启动 Vite 开发服务器，预览地址为 http://localhost:3000/。

- [Docs/Repo] 初始化 Git 仓库并配置远程
  - 说明：执行 `git init`；添加远程仓库 `origin` -> `https://github.com/luciowlx/learngit.git`；完成首次提交 `Initial commit`。

---

如需进一步自动化维护（例如在提交前检查是否更新此日志），可在后续增加提交规范或自动化脚本（例如使用 commitlint/linters 或自定义 Pre-Commit 钩子）。
  - 追加优化：为左侧工具栏容器添加 `md:flex-nowrap`，在 md 及以上屏幕强制单行不换行，避免组件在宽屏仍出现自动换行。
## [Unreleased] - 列头筛选迁移（任务管理）

### 变更
- 将以下筛选条件从筛选面板迁移到任务列表列头的筛选：
  - 任务类型（TableHead → Popover + Select）
  - 状态（保留点击排序，同时支持列头筛选）
  - 所属项目（TableHead → Popover + Select）
  - 优先级（保留点击排序，同时支持列头筛选）
- 移除了筛选面板中的上述四个控件，避免与列头筛选重复。

### 涉及文件
- src/components/TaskManagement.tsx

### 验证
- 打开任务管理页，确认在任务列表表头的“任务类型 / 所属项目 / 优先级 / 状态”右侧出现滤镜按钮；点击按钮弹出下拉选择；选择后列表实时按条件过滤；再次点击“清空”恢复为全部。
- 排序行为仍可通过点击列名触发；列头的筛选按钮不会触发排序（已阻止事件冒泡）。

### 预览
- 本地开发服务器: http://localhost:3000/
### 2025-11-06

- docs(guidelines): add bilingual heading to src/guidelines/Guidelines.md to align with zh-first style
- docs(readme): translate README to zh-CN with bilingual style
### 2025-11-06
- [I18n/UI] GlobalAIAssistant 与 NotificationCenter 国际化替换与语言键补齐：
  - GlobalAIAssistant.tsx：替换 Welcome（标题/副标题）、Sender（上传文件/拖拽提示/描述）、chatSider（新建对话）、回复进度提示为 t('assistant.*')；保留原型交互逻辑与本地模拟回复。
  - NotificationCenterContent.tsx：修正“相关实体”键名为 `notifications.center.detail.relatedEntity`，确保与语言包一致；活动列表“关联:”已使用 `notifications.center.activities.related.prefix`；其他通知与活动文案此前已完成替换。
  - LanguageContext.tsx：新增并补齐缺失的助手相关键（zh/en）：
    - `assistant.replyInProgress.tip`、`assistant.actions.newChat`
    - `assistant.upload.title`、`assistant.upload.dragHere`、`assistant.upload.description`
    - `assistant.welcome.title`、`assistant.welcome.subtitle`
    - `assistant.input.placeholder`（作为 `assistant.placeholder.input` 的别名）
    - `assistant.quick.analysis` 及 `assistant.quick.*.plan`
  - 验证：`npm run dev` 启动 Vite（端口 3002），在助手与通知中心页面切换中英文，文案正常、布局无异常；控制台与终端无报错。