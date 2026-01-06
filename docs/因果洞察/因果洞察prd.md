收到，你现在要的不是“一个页面的筛选器”，而是一个**完整的「因果洞察任务系统」**：
有任务生命周期（创建/运行/完成/失败）、有数据源差异（每个数据的 X/Y 可能不同）、有列表与 CRUD、有详情与导出。

下面给你一份**开发可落地的系统级 PRD**（偏工程规格），按“信息架构 → 任务模型 → 页面与交互 → 权限/状态 → 导出 → 接口契约 → 验收”来写。你可以直接拆 Jira 史诗/故事点。

---

# PRD｜因果洞察（Causal Insights）任务系统（完整规格）

## 0. 术语与边界

* **决策推理任务（Decision Task）**：你现有模块产生的任务，已完成后有全量样本与输出。
* **因果洞察任务（Causal Insight Task，简称 CI 任务）**：本 PRD 新增的任务。以某个决策推理任务为输入，选择 X/Y 与筛选条件，跑出因果热力图与影响因子分数等洞察产物。
* **数据样本空间（Sample Space）**：某个决策推理任务对应的全量样本集合（含原始字段、派生字段、y 候选字段等）。
* **Schema（字段元数据）**：描述当前样本空间有哪些字段、字段类型、可做什么筛选/聚合。

> 关键原则：CI 任务是“面向样本切片 + 计算产物”的离线任务（可同步/异步），不是单页临时视图。

---

## 1. 目标与非目标

### 1.1 目标

1. 支持创建 CI 任务：从决策推理任务选数据源，并从其样本空间中灵活选择 X、Y 及过滤条件。
2. 支持 CI 任务列表：展示必要字段、支持增删改查（CRUD）、复制任务。
3. 支持 CI 任务详情：展示创建时的配置、运行状态、计算结果（热力图/条形图）、样本命中统计、日志摘要；支持导出数据与图表。
4. 支持“每个任务的 X/Y 不同”：创建时基于所选数据源动态加载字段与类型并驱动交互。

### 1.2 非目标（本期不做）

* 不做模型重训练/结构学习（如因果图结构发现）——默认基于已有推理产物或既定算法产物。
* 不做跨多个决策推理任务的联合分析（后续可加“多源合并”版本）。

---

## 2. 用户与权限（最小可行）

### 2.1 角色

* **管理员**：管理所有任务，含删除、导出。
* **普通用户**：仅管理自己创建的任务（默认）。

### 2.2 权限规则

* 列表：可见范围 = 自己 +（可选）同项目成员
* 删除：仅创建者/管理员
* 导出：有数据权限的人才可导出（对齐决策推理任务权限）

---

## 3. 信息架构（菜单与页面）

一级菜单：**因果洞察**（在“决策推理”之后）

页面：

1. **CI 任务列表页**（默认入口）
2. **创建 CI 任务页**（向导式/表单式）
3. **CI 任务详情页**
4. **编辑 CI 任务页**（复用创建页，受状态限制）
5. **（可选）CI 任务对比页**（非本期）

---

## 4. 核心数据模型（后端/前端一致）

### 4.1 CI 任务实体（CausalInsightTask）

**字段（建议）**

* `id`：任务ID
* `name`：任务名称
* `description`：备注
* `projectId`：项目/空间
* `sourceDecisionTaskId`：来源决策推理任务ID（必填）
* `sourceDecisionTaskName`：冗余展示字段
* `datasetSnapshotId`：数据快照ID（确保可复现：创建时固定数据版本）
* `xSpec`：X 选择配置（见 4.2）
* `ySpec`：Y 选择配置（见 4.3）
* `filters`：样本过滤DSL（见 4.4）
* `computeSpec`：计算参数（见 4.5）
* `status`：DRAFT / QUEUED / RUNNING / SUCCEEDED / FAILED / CANCELED
* `progress`：0-100
* `sampleTotal`：全量样本数（来自 source）
* `sampleHit`：过滤后样本数
* `resultRefs`：结果文件引用（图、表、数据）
* `createdBy/createdAt/updatedAt`
* `lastRunAt`：最近运行时间
* `errorMessage`：失败原因（可截断）
* `tags`：标签（可选）

> 这样设计最优原因：
>
> * 复现：`datasetSnapshotId` 固定样本版本
> * 配置可审计：`xSpec/ySpec/filters/computeSpec` 全可追溯
> * 结果分离：大文件走对象存储，DB只存引用

---

### 4.2 X 选择配置（xSpec）

支持两类模式（建议二选一或都做）：

**模式A：显式选择（推荐）**

* `mode: "explicit"`
* `fields: string[]`（选中的特征字段）
* `topK?: number`（可选：只取贡献前K的X用于展示）

**模式B：规则选择（可选）**

* `mode: "rule"`
* `includePatterns?: string[]`（如“*_日前”）
* `excludePatterns?: string[]`
* `maxFeatureCount?: number`

> 最优原因：显式选择让用户可控；规则选择适合字段多、命名规范时的效率。

---

### 4.3 Y 选择配置（ySpec）

* `field: string`（必填）
* `filterType: "Temporal" | "Numeric" | "Categorical" | "Derived"`（来自元数据）
* `labelMapping?: {...}`（分类映射，如 label -> 文案）
* `timeGranularity?: "minute"|"hour"|"day"`（时间型可选）
* `derivedRule?: {...}`（派生型可选）

---

### 4.4 过滤 DSL（filters）

统一为一套结构化条件树，前端构造，后端解析：

* 顶层：`AND` 关系的条件组（支持嵌套 OR）
* 单条件：

  * `field`
  * `op`：`EQ|NE|GT|GTE|LT|LTE|BETWEEN|IN|NOT_IN|IS_NULL|NOT_NULL`
  * `value`：单值/数组/区间
  * `valueType`：由字段元数据决定（string/number/time/bool）

**例子**

```json
{
  "and": [
    {"field":"风力发电_日前","op":"BETWEEN","value":[0.2,0.4]},
    {"field":"实时-日前偏差_label","op":"IN","value":["负偏差","极端偏差"]},
    {"field":"Time","op":"BETWEEN","value":["2025-08-01T00:00:00","2025-08-07T23:59:59"]}
  ]
}
```

---

### 4.5 计算参数（computeSpec）

* `heatmap`：

  * `normalize: "zscore"|"minmax"| "none"`
  * `clipRange?: [min,max]`（色阶截断，默认如[-2,2]）
* `barChart`：

  * `sortBy: "abs"|"pos"|"neg"`
  * `topK: number`（默认 20）
* `scoringMethod`：影响分数算法版本（如 `"v1_shap_like"`，你们内部实现）
* `timeAxisField?`：热力图纵轴使用哪个时间字段（若多个时间字段存在）

---

## 5. 创建 CI 任务（核心流程与交互）

### 5.1 创建入口

* 列表页右上角：`新建因果洞察任务`
* 决策推理任务详情页：`创建因果洞察`（带入 sourceDecisionTaskId）

---

### 5.2 创建页交互结构（推荐“向导式 4 步”）

#### Step 1｜选择数据源（决策推理任务）

**组件**

* 决策推理任务选择器（单选）
* 支持搜索：任务名/ID/创建人/时间

**选择后系统动作**

1. 拉取该任务的 **字段元数据 Schema**（见第 9 节接口）
2. 拉取样本概览：`sampleTotal`、时间范围（若存在）

**异常**

* 任务未完成：不可选（或提示“仅支持已完成任务”）
* 无权限：不可见

---

#### Step 2｜定义 X（特征集合）

**模式选择**

* 单选：`显式选择` / `规则选择`（规则可选做）

**显式选择 UI**

* 左侧：字段列表（支持搜索、按类型筛选）
* 右侧：已选 X 列表（可拖拽排序、可批量移除）
* 快捷：`全选某个分组`（按前缀/业务域分组）

**约束**

* X 至少 1 个
* X 最大数量（例如 200，超过提示性能风险）

---

#### Step 3｜定义 Y（结果变量）

**UI**

* Y 字段选择器（从 schema 中选择）
* 选择后展示：

  * 字段类型（只展示给高级用户或折叠）
  * 预览分布（可选：直方图/类别计数）

**系统动作**

* 根据 Y 的 `filterType` 自动决定 Step 4 中 Y 的筛选控件类型

---

#### Step 4｜样本过滤（场景切片）

把过滤分成两块：**X 条件** 与 **Y 条件** 与 **时间条件（若存在）**，但底层都写入同一 DSL。

##### 4.1 X 条件构造器

* 条件行：`字段` `操作符` `值`
* 字段来源：X 字段 +（可选）其他字段（建议允许全字段）
* 值输入组件随字段类型变化：

  * 数值：单值/区间/滑块
  * 枚举：多选
  * 文本：包含/等于（可选）

##### 4.2 Y 条件构造器（强类型 UI）

* 若 `Temporal`：时间范围选择器 + 快捷（最近7天/本月等）
* 若 `Numeric`：双滑块 + 输入框
* 若 `Categorical`：多选
* 若 `Derived`：规则选择 + 参数

##### 4.3 实时命中样本预估（强烈建议）

* 每次条件变更后，调用后端 `estimate` 返回：

  * `sampleHit`
  * 基础分布（可选）
* 样本数过小提示：`<50` 黄色提示；`=0` 红色提示

> 最优原因：
>
> * 用户避免在极小样本上“脑补因果”
> * 也避免提交后才发现无数据

---

### 5.3 提交与运行

**提交按钮**

* `保存为草稿`
* `保存并运行`

**运行策略**

* 运行必定基于 `datasetSnapshotId`（创建时生成快照 or 引用 source 的版本）
* 运行进入 `QUEUED → RUNNING → SUCCEEDED/FAILED`

---

## 6. CI 任务列表页（查询 + CRUD）

### 6.1 列表字段（必须）

* 任务名称（可点击进入详情）
* 来源决策推理任务
* Y 字段
* 样本命中：`sampleHit/sampleTotal`
* 状态 + 进度
* 创建人
* 更新时间
* 操作列

### 6.2 列表筛选（必须）

* 状态
* 创建人
* 来源任务
* 时间范围（创建时间/更新时间）
* 关键字搜索（name/id/sourceName）

### 6.3 操作（CRUD）

* 新建
* 查看（详情）
* 编辑（条件：DRAFT/FAILED 可编辑；SUCCEEDED 可“复制后编辑”）
* 删除（可软删除，需二次确认）
* 复制（推荐：复制配置生成新任务，默认 DRAFT）
* 运行/重跑（FAILED/SUCCEEDED 均可，SUCCEEDED 重跑会产生新结果版本或覆盖，需策略见 8.3）

---

## 7. CI 任务详情页（配置 + 结果 + 导出）

### 7.1 基础信息区

* 名称、描述、状态、进度
* 来源决策推理任务（可跳转）
* 创建人、创建时间、最后运行时间
* 数据快照版本信息（用于审计）

### 7.2 配置回显区（可折叠）

* X 列表（支持导出字段清单）
* Y 字段 + 类型
* 过滤条件摘要（人类可读形式 + 查看 DSL）
* computeSpec（算法版本、topK、normalize 等）

### 7.3 结果区（SUCCEEDED 可见）

**模块1：全量/子集因果热力图**

* 支持：

  * 切换 “全量” vs “子集 S”（如果你们希望默认同时看）
  * 色阶范围调整（[-2,2] 等）
  * 下载图片（PNG/SVG）

**模块2：影响因子正负条形图**

* topK 调整（前 10/20/50）
* 排序方式（abs/pos/neg）
* 下载图片（PNG/SVG）
* 下载数据（CSV）

**模块3：样本列表（可选但强建议）**

* 展示命中样本的前 N 行（分页）
* 支持导出命中样本（见 7.4 导出）

> 最优原因：
>
> * 图表一定会被质疑“依据是什么”，样本列表是最强的自证能力
> * 也方便后续定位异常点

### 7.4 导出能力（必须）

导出按钮放在详情页右上角：`导出`

支持导出类型：

1. **导出任务配置**

   * JSON（xSpec/ySpec/filters/computeSpec）
2. **导出图表**

   * 热力图 PNG/SVG
   * 条形图 PNG/SVG
3. **导出结果数据**

   * 条形图数据（feature, score, direction）
   * 热力图矩阵（time × feature 的值）
4. **导出命中样本**

   * CSV/Parquet（大数据建议异步导出生成下载链接）
   * 可选择字段子集（默认：Time、Y、TopK X）

导出策略：

* 小文件同步返回
* 大文件走异步任务：`EXPORT_QUEUED → EXPORT_READY`

---

## 8. 编辑、删除、版本策略（容易踩坑，提前定）

### 8.1 编辑限制

* `DRAFT`：可编辑全部
* `FAILED`：可编辑全部后重跑
* `RUNNING/QUEUED`：禁止编辑（可取消）
* `SUCCEEDED`：默认禁止直接编辑，提供：

  * `复制并编辑`（生成新任务）

### 8.2 删除策略

* 软删除：标记 deletedAt/deletedBy
* 删除不立即清理对象存储结果（可定期 GC）

### 8.3 重跑与结果版本

两种方案（二选一，推荐 A）：

**A. 结果版本化（推荐）**

* 每次运行生成 `runId`
* 详情默认展示 latest run
* 可查看历史 run（审计友好）

**B. 覆盖式**

* 重跑覆盖旧结果
* 简单但不利于追溯

---

## 9. 后端接口（建议契约）

> 你后端怎么实现无所谓，但接口要能支撑“动态 schema + 估算命中 + 异步计算 + 导出”。

### 9.1 获取可用决策推理任务（创建 step1）

`GET /api/decision-tasks?status=COMPLETED&keyword=&page=`

返回含：id/name/sampleTotal/timeRange/createdAt/createdBy

### 9.2 获取数据源 schema（创建后动态驱动 UI）

`GET /api/decision-tasks/{id}/schema`

返回：

* fields[]：`{name, displayName, dtype, filterType, categories?, min?, max?, isTime?, groupKey?}`
* recommendedX[]（可选）
* recommendedY[]（可选）

### 9.3 样本命中估算（创建 step4 实时提示）

`POST /api/causal-insight-tasks/estimate`
body：{sourceDecisionTaskId, xSpec, ySpec, filters}

返回：{sampleTotal, sampleHit, yDistribution?, warnings[]}

### 9.4 CI 任务 CRUD

* `POST /api/causal-insight-tasks`（创建）
* `GET /api/causal-insight-tasks?page=&filters=`（列表）
* `GET /api/causal-insight-tasks/{id}`（详情）
* `PUT /api/causal-insight-tasks/{id}`（编辑）
* `DELETE /api/causal-insight-tasks/{id}`（删除）
* `POST /api/causal-insight-tasks/{id}/run`（运行/重跑）
* `POST /api/causal-insight-tasks/{id}/cancel`（取消）

### 9.5 导出

* `POST /api/causal-insight-tasks/{id}/export` body:{type, format, fields?}
* `GET /api/exports/{exportId}`（查询状态/下载链接）

---

## 10. 前端状态机（必须对齐测试）

任务状态：

* DRAFT
* QUEUED
* RUNNING
* SUCCEEDED
* FAILED
* CANCELED

允许操作矩阵（示例）：

| 状态        | 编辑  | 删除    | 运行    | 取消 | 导出 |
| --------- | --- | ----- | ----- | -- | -- |
| DRAFT     | ✅   | ✅     | ✅     | ❌  | ❌  |
| QUEUED    | ❌   | ❌     | ❌     | ✅  | ❌  |
| RUNNING   | ❌   | ❌     | ❌     | ✅  | ❌  |
| SUCCEEDED | 复制✅ | ✅(可选) | ✅(重跑) | ❌  | ✅  |
| FAILED    | ✅   | ✅     | ✅(重跑) | ❌  | ❌  |
| CANCELED  | ✅   | ✅     | ✅     | ❌  | ❌  |

---

## 11. 验收标准（可测）

### 11.1 创建链路

1. 必须选择完成态决策推理任务才能创建
2. schema 动态变化：不同 source 任务字段不同，UI 正确更新 X/Y 可选项
3. Y 选择不同类型（时间/数值/枚举），Y 过滤控件自动切换
4. 条件变更能实时估算 sampleHit，且与最终运行结果一致（允许小误差需定义）

### 11.2 列表与 CRUD

1. 列表字段完整、可筛选、可搜索
2. 编辑限制符合状态机
3. 复制任务能完整复制配置但生成新 id
4. 删除后列表不可见，详情若访问提示无权限/已删除

### 11.3 详情与导出

1. 详情回显配置与 DSL
2. SUCCEEDED 状态下展示热力图与条形图
3. 导出：配置 JSON、图表 PNG、结果 CSV 均可拿到下载文件
4. 大文件导出走异步，导出任务可查询状态

---

## 12. 本期迭代拆分建议（给你方便排期）

* **V1（可上线）**

  * 创建（Step1-4）+ 估算 sampleHit
  * 任务列表（查询+删除+复制+运行）
  * 任务详情（配置回显 + 两张图 + 导出配置/图/结果数据）
* **V1.1**

  * 命中样本列表预览 + 导出命中样本
  * 结果版本化 runId
* **V1.2**

  * 场景对比（S1 vs S2）

---

如果你愿意，我下一步可以把这份 PRD **继续补到“字段元数据 Schema 规范”**（这是你说的“每个数据 xy 不同”能跑起来的关键），包括：

* dtype → 可用操作符映射表
* filterType 推断规则（后端如何从字段识别 Temporal/Numeric/Categorical）
* 字段分组策略（按业务域/前缀/来源）
* 以及“Y 是时间/数字/其他变量”的统一落库规范

这部分一旦定了，前端会非常省心，后端也不容易返工。
