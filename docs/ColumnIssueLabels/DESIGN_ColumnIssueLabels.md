# 设计阶段：架构与接口

整体设计：
- 在 TableHeader 内新增一行“问题比例标签行”，每个 TableHead 对应一个字段的标签。
- 计算函数：calcColumnStats() 返回每字段的 missingRate/uniqueRate/missingCount/uniqueCount。
- 交互：点击标签设置 missingOnly/uniqueOnly，并设置 missingField 或 uniqueField，复用 getFilteredData() 完成筛选。

数据流：
1. mockData -> calcColumnStats() -> 标签渲染。
2. 标签点击 -> 更新状态 missingOnly/missingField 或 uniqueOnly/uniqueField -> getFilteredData() -> TableBody 渲染。

接口契约：
- calcColumnStats(): Record<string, { missingRate:number, uniqueRate:number, missingCount:number, uniqueCount:number }>
- isMissingValue(v: any): boolean
- getFilteredData(): DataRow[]（根据状态返回过滤后的数据）

异常策略：
- 数据为空时，百分比为 0，显示空行占位，避免崩溃。

