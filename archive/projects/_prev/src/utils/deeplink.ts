/**
 * 深链与哈希路由工具函数集合。
 * 功能：
 * - 构建数据详情页的新标签页 URL（包含唯一 ID 与初始 Tab）。
 * - 解析当前页面的哈希参数，驱动原型级路由展示。
 * - 清理哈希，回到普通主页状态。
 */

export type DataDetailTab = 'overview' | 'versions' | 'missing';

/**
 * 构建数据详情页的深链 URL（哈希路由）。
 * @param id 数据集唯一标识
 * @param tab 初始页签，默认 'overview'
 * @returns 包含哈希与查询参数的绝对 URL 字符串
 */
export function buildDataDetailUrl(id: number, tab: DataDetailTab = 'overview'): string {
  // 使用当前页面的 origin 与 pathname，避免部署在子路径时丢失路径导致打开首页
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const base = `${origin}${pathname}`.replace(/\/$/, '/');
  const params = new URLSearchParams({ id: String(id), tab });
  return `${base}#data-detail?${params.toString()}`;
}

/**
 * 解析当前 location.hash，支持形如：
 * #data-detail?id=123&tab=versions
 * @returns 解析结果对象：view、id、tab
 */
export function parseHashParams(): { view?: string; id?: number; tab?: DataDetailTab } {
  if (typeof window === 'undefined') return {};
  const { hash } = window.location;
  if (!hash) return {};
  // 期望格式：#data-detail?key=value&key=value
  const [viewRaw, queryRaw] = hash.replace(/^#/, '').split('?');
  const view = viewRaw || undefined;
  const result: { view?: string; id?: number; tab?: DataDetailTab } = { view };
  if (queryRaw) {
    const qs = new URLSearchParams(queryRaw);
    const idStr = qs.get('id');
    const tabStr = qs.get('tab') as DataDetailTab | null;
    if (idStr) result.id = Number(idStr);
    if (tabStr) result.tab = tabStr;
  }
  return result;
}

/**
 * 清理哈希部分，使地址栏回到基础路径。
 */
export function clearHash(): void {
  if (typeof window === 'undefined') return;
  const { protocol, host, pathname } = window.location;
  const cleanUrl = `${protocol}//${host}${pathname}`;
  window.history.replaceState(null, '', cleanUrl);
}