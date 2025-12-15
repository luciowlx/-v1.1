# 原子任务拆分

1) 标签计算与渲染
- 输入：mockData、allVariables
- 输出：列头上方标签
- 验收：显示符合样式规范；与列宽对齐

2) 点击联动筛选（缺失/唯一）
- 输入：用户交互（点击/键盘）
- 输出：更新 missingOnly/missingField 或 uniqueOnly/uniqueField；表格过滤结果
- 验收：点击标签后仅显示对应问题行

3) 可访问性增强
- 输入：无
- 输出：ARIA label、键盘可操作
- 验收：Tab 可聚焦；Enter/Space 触发；Tooltip 可读

4) 性能优化（虚拟滚动）
- 输入：大数据量表格
- 输出：仅渲染可见行
- 验收：滚动顺畅；首屏渲染时间降低
- 依赖：选择 react-virtual 或 react-window（待确认）

5) 原型配色与系统设计变量对齐
- 输入：设计色值（待提供）
- 输出：统一颜色变量
- 验收：颜色一致性通过设计验收

