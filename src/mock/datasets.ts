/**
 * 共享的前端原型数据源：数据集列表。
 * 目的：在不同页面/新标签页之间保持数据一致性。
 * 说明：字段与 DataManagement 中使用的结构保持一致，便于直接展示。
 */

export interface MockDataset {
  id: number;
  title: string;
  description: string;
  categories: Array<{ name: string; color: string }>;
  tags: Array<{ name: string; color: string }>;
  formats: string[];
  size: string;
  rows: string;
  columns: string;
  completeness: number;
  source: string;
  version: string;
  versionCount?: number;
  fileCount?: number;
  updateTime: string;
  status: 'success' | 'processing' | 'failed';
  color: string;
  type?: string;
  fieldCount?: number;
  sampleCount?: number;
}

/**
 * 返回指定 ID 的数据集，未找到则返回 undefined。
 * @param id 唯一标识
 * @returns 匹配的数据集或 undefined
 */
export function getDatasetById(id: number): MockDataset | undefined {
  return mockDatasets.find(d => d.id === id);
}

/**
 * 原型数据初始列表
 */
const initialDatasets: MockDataset[] = [
  {
    id: 1,
    title: "销售数据集",
    description: "包含2023年全年销售记录，涵盖产品信息、客户数据、交易金额等关键指标",
    categories: [
      { name: "销售", color: "bg-blue-100 text-blue-800" },
      { name: "财务", color: "bg-green-100 text-green-800" }
    ],
    tags: [
      { name: "交易数据", color: "bg-gray-100 text-gray-800" },
      { name: "客户数据", color: "bg-green-100 text-green-800" }
    ],
    formats: ["CSV", "Parquet", "JSONL"],
    size: "2.5MB",
    rows: "10,234",
    columns: "15",
    completeness: 95,
    source: "文件上传",
    version: "v1.2",
    versionCount: 3,
    fileCount: 3,
    updateTime: "2024-01-15 14:30",
    status: 'success',
    color: "border-l-blue-500"
  },
  {
    id: 2,
    title: "用户行为数据",
    description: "网站用户行为追踪数据，包含页面访问、点击事件、停留时间等用户交互信息",
    categories: [
      { name: "用户行为", color: "bg-purple-100 text-purple-800" },
      { name: "网站分析", color: "bg-orange-100 text-orange-800" }
    ],
    tags: [
      { name: "客户数据", color: "bg-gray-100 text-gray-800" },
      { name: "交易数据", color: "bg-blue-100 text-blue-800" }
    ],
    formats: ["JSON", "JSONL"],
    size: "15.8MB",
    rows: "45,678",
    columns: "12",
    completeness: 88,
    source: "API接口",
    version: "v2.1",
    versionCount: 5,
    fileCount: 12,
    updateTime: "2024-01-14 09:15",
    status: 'processing',
    color: "border-l-purple-500"
  },
  {
    id: 3,
    title: "产品库存数据",
    description: "实时产品库存信息，包含商品编码、库存数量、仓库位置、供应商信息等",
    categories: [
      { name: "库存管理", color: "bg-green-100 text-green-800" },
      { name: "供应链", color: "bg-yellow-100 text-yellow-800" }
    ],
    tags: [
      { name: "供应商数据", color: "bg-gray-100 text-gray-800" },
      { name: "库存数据", color: "bg-red-100 text-red-800" }
    ],
    formats: ["Excel", "CSV"],
    size: "8.2MB",
    rows: "23,456",
    columns: "20",
    completeness: 80,
    source: "数据库",
    version: "v1.0",
    versionCount: 2,
    fileCount: 6,
    updateTime: "2024-01-10 18:20",
    status: 'failed',
    color: "border-l-green-500"
  }
];

// 缓存 Key
const STORAGE_KEY = 'limix_mock_datasets';

/**
 * 初始化并导出 mockDatasets
 * 优先从 localStorage 获取，实现原型演示中的持久化
 */
export const mockDatasets: MockDataset[] = (() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved datasets', e);
    }
  }
  return [...initialDatasets];
})();

/**
 * 向全局列表添加新数据集并持久化
 * @param dataset 新数据集对象
 */
export function addMockDataset(dataset: MockDataset) {
  mockDatasets.unshift(dataset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockDatasets));
  // 触发一个自定义事件，通知页面刷新数据
  window.dispatchEvent(new CustomEvent('datasets-updated'));
}

/**
 * 重置数据（原型测试用）
 */
export function resetMockDatasets() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}