import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GripVertical, ArrowUpDown } from 'lucide-react';

export type Column<T extends Record<string, any>> = {
  key: keyof T | string;
  label: React.ReactNode; // 支持在表头内放置自定义UI（如筛选Popovers）
  width?: number;
  minWidth?: number;
  sortable?: boolean;
  render?: (value: any, row: T, rowIndex: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
};

export type Density = 'compact' | 'normal' | 'comfortable';

export interface VirtualTableProps<T extends Record<string, any>> {
  data: T[];
  columns?: Column<T>[];
  height: number; // px
  rowHeight?: number; // px, 覆盖密度的行高
  overscan?: number; // 额外预渲染的行数
  density?: Density;
  enableColumnResize?: boolean;
  enableColumnDrag?: boolean;
  defaultColumnOrder?: string[]; // 按 key
  defaultColumnWidths?: Record<string, number>;
  onColumnOrderChange?: (order: string[]) => void;
  onColumnWidthsChange?: (w: Record<string, number>) => void;
  resettable?: boolean;
  onReset?: () => void;
  sortState?: { column?: string; order?: 'asc' | 'desc' };
  onSortChange?: (column: string, order: 'asc' | 'desc') => void;
  className?: string;
  style?: React.CSSProperties;
  headerRight?: React.ReactNode;
  freezeLeftCount?: number; // 新增：冻结左侧列数量
  freezeRightCount?: number; // 新增：冻结右侧列数量（用于固定操作栏）
}

// 统一的虚拟滚动 Table 组件（CSS-in-JS 样式隔离 + 列宽拖拽 + 列顺序拖拽 + 重置能力）
/**
 * VirtualTable
 * 功能：提供高性能、可拖拽/可调整列宽的表格，支持粘性表头与左右侧冻结列。
 * 参数：详见 VirtualTableProps。
 * 返回：React 组件，渲染一个支持虚拟滚动的表格。
 */
export function VirtualTable<T extends Record<string, any>>({
  data,
  columns,
  height,
  rowHeight,
  overscan = 6,
  density = 'normal',
  enableColumnResize = true,
  enableColumnDrag = true,
  defaultColumnOrder,
  defaultColumnWidths,
  onColumnOrderChange,
  onColumnWidthsChange,
  resettable = true,
  onReset,
  sortState,
  onSortChange,
  className,
  style,
  headerRight,
  freezeLeftCount = 0,
  freezeRightCount = 0,
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const latestScrollTop = useRef(0);
  const [scrollTop, setScrollTop] = useState(0);

  const baseRowHeight = useMemo(() => {
    if (rowHeight) return rowHeight;
    if (density === 'compact') return 28;
    if (density === 'comfortable') return 42;
    return 34;
  }, [density, rowHeight]);

  // 列定义与顺序
  const inferredColumns = useMemo<Column<T>[]>(() => {
    if (columns && columns.length) return columns;
    const first = data[0] || {} as T;
    return Object.keys(first).map((k) => ({ key: k, label: k }));
  }, [columns, data]);

  const [manualOrder, setManualOrder] = useState<string[]>(defaultColumnOrder || []);
  const [widths, setWidths] = useState<Record<string, number>>(defaultColumnWidths || {});
  const headerRefs = useRef<Record<string, HTMLTableCellElement | null>>({});

  const orderedColumns = useMemo(() => {
    const baseKeys = inferredColumns.map(c => String(c.key));
    if (manualOrder.length) {
      const setBase = new Set(baseKeys);
      const ordered = manualOrder.filter(k => setBase.has(k));
      const rest = baseKeys.filter(k => !ordered.includes(k));
      return [...ordered, ...rest].map(k => inferredColumns.find(c => String(c.key) === k)!);
    }
    if (defaultColumnOrder && defaultColumnOrder.length) {
      const setBase = new Set(baseKeys);
      const ordered = defaultColumnOrder.filter(k => setBase.has(k));
      const rest = baseKeys.filter(k => !ordered.includes(k));
      return [...ordered, ...rest].map(k => inferredColumns.find(c => String(c.key) === k)!);
    }
    return inferredColumns;
  }, [inferredColumns, manualOrder, defaultColumnOrder]);

  // 计算冻结列的 left 偏移
  const leftOffsets = useMemo(() => {
    const arr: number[] = [];
    let acc = 0;
    orderedColumns.forEach((c) => {
      const key = String(c.key);
      const w = widths[key] ?? c.width ?? 100;
      arr.push(acc);
      acc += w;
    });
    return arr;
  }, [orderedColumns, widths]);

  /**
   * 计算右侧冻结列的 right 偏移。
   * 说明：从最右侧开始累加列宽，以便为 position: sticky; right: X 提供偏移值。
   */
  const rightOffsets = useMemo(() => {
    const arr: number[] = [];
    let acc = 0;
    // 仅当 freezeRightCount > 0 时计算，提高性能
    if (freezeRightCount > 0) {
      for (let i = orderedColumns.length - 1; i >= 0; i--) {
        const c = orderedColumns[i];
        const key = String(c.key);
        const w = widths[key] ?? c.width ?? 100;
        arr[i] = acc; // 为该列记录当前偏移
        acc += w;
      }
    }
    return arr;
  }, [orderedColumns, widths, freezeRightCount]);

  // 虚拟滚动范围计算（使用 rAF 节流）
  const total = data.length;
  const visibleCount = Math.max(1, Math.ceil(height / baseRowHeight));
  const startIndex = Math.max(0, Math.floor(scrollTop / baseRowHeight) - overscan);
  const endIndex = Math.min(total, startIndex + visibleCount + overscan * 2);
  const translateY = startIndex * baseRowHeight;

  const visibleRows = useMemo(() => data.slice(startIndex, endIndex), [data, startIndex, endIndex]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    latestScrollTop.current = (e.currentTarget as HTMLDivElement).scrollTop;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(latestScrollTop.current);
      rafRef.current && cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    });
  };

  // 列宽拖拽
  const startResize = (key: string, e: React.MouseEvent) => {
    if (!enableColumnResize) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = (e as any).clientX as number;
    const startW = widths[key] ?? headerRefs.current[key]?.getBoundingClientRect().width ?? 100;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const next = Math.max(60, Math.round((startW as number) + delta));
      setWidths(prev => {
        const nw = { ...prev, [key]: next };
        onColumnWidthsChange?.(nw);
        return nw;
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // 列顺序拖拽
  const onHeaderDragStart = (key: string) => (e: React.DragEvent) => {
    if (!enableColumnDrag) return;
    e.dataTransfer.setData('text/col', key);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onHeaderDragOver = (e: React.DragEvent) => {
    if (!enableColumnDrag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onHeaderDrop = (targetKey: string) => (e: React.DragEvent) => {
    if (!enableColumnDrag) return;
    e.preventDefault();
    const sourceKey = e.dataTransfer.getData('text/col');
    if (!sourceKey || sourceKey === targetKey) return;
    const current = orderedColumns.map(c => String(c.key));
    const next = current.filter(k => k !== sourceKey);
    const idx = next.indexOf(targetKey);
    next.splice(idx >= 0 ? idx : next.length, 0, sourceKey);
    setManualOrder(next);
    onColumnOrderChange?.(next);
  };

  // 重置
  const resetAll = () => {
    setManualOrder(defaultColumnOrder || []);
    setWidths(defaultColumnWidths || {});
    onColumnOrderChange?.(defaultColumnOrder || []);
    onColumnWidthsChange?.(defaultColumnWidths || {});
    onReset?.();
  };

  const containerStyle: React.CSSProperties = {
    height,
    overflow: 'auto',
    position: 'relative',
    border: '1px solid var(--border, #e5e7eb)',
    borderRadius: 8,
    background: 'var(--background, #fff)',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch'
  };

  const tableStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    // 使用 max-content 使表格在列总宽度超过容器时出现水平滚动
    width: 'max-content',
    borderCollapse: 'separate',
    fontSize: '0.875rem'
  };

  const theadStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    background: 'var(--background, #fff)'
  };

  const tbodyStyle: React.CSSProperties = {
    transform: `translateY(${translateY}px)`
  };

  const totalHeight = total * baseRowHeight;

  return (
    <div className={className} style={{ ...containerStyle, ...style }} onScroll={onScroll} ref={containerRef}>
      <div style={{ height: totalHeight }} />
      <table style={tableStyle}>
        <thead style={theadStyle}>
          <tr style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
            {orderedColumns.map((c, i) => {
              const key = String(c.key);
              const w = widths[key] ?? c.width;
              const styleTh: React.CSSProperties = {
                textAlign: c.align || 'left',
                height: 40,
                padding: '8px',
                whiteSpace: 'nowrap',
                position: 'relative',
                ...(w ? { width: w, minWidth: w } : {})
              };
              const isFrozenLeft = i < freezeLeftCount;
              const isFrozenRight = freezeRightCount > 0 && i >= orderedColumns.length - freezeRightCount;
              if (isFrozenLeft) {
                Object.assign(styleTh, { position: 'sticky', left: leftOffsets[i], zIndex: 3, background: 'var(--background, #fff)' });
              }
              if (isFrozenRight) {
                Object.assign(styleTh, { position: 'sticky', right: rightOffsets[i] ?? 0, zIndex: 3, background: 'var(--background, #fff)', boxShadow: 'inset 8px 0 8px -8px rgba(0,0,0,0.06)' });
              }
              return (
                <th
                  key={key}
                  ref={(el) => { headerRefs.current[key] = el; }}
                  style={styleTh}
                  draggable={enableColumnDrag}
                  onDragStart={onHeaderDragStart(key)}
                  onDragOver={onHeaderDragOver}
                  onDrop={onHeaderDrop(key)}
                  onClick={() => {
                    if (!c.sortable) return;
                    const isSame = sortState?.column === key;
                    const nextOrder: 'asc' | 'desc' = isSame ? (sortState?.order === 'asc' ? 'desc' : 'asc') : 'asc';
                    onSortChange?.(key, nextOrder);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {enableColumnDrag && <GripVertical size={14} color="#9ca3af" />}
                    <span>{c.label}</span>
                    {c.sortable && (
                      <ArrowUpDown size={14} color="#9ca3af" style={{ opacity: sortState?.column === key ? 1 : 0.5, transform: sortState?.column === key && sortState?.order === 'desc' ? 'rotate(180deg)' : 'none' }} />
                    )}
                  </div>
                  {enableColumnResize && (
                    <div
                      onMouseDown={(e) => startResize(key, e)}
                      style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 4, cursor: 'col-resize' }}
                    />
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody style={tbodyStyle}>
          {visibleRows.map((row, i) => (
            <tr key={startIndex + i} style={{ height: baseRowHeight, borderBottom: '1px solid var(--border, #e5e7eb)' }}>
              {orderedColumns.map((c, ci) => {
                const key = String(c.key);
                const w = widths[key] ?? c.width;
                const styleTd: React.CSSProperties = {
                  textAlign: c.align || 'left',
                  padding: density === 'compact' ? '4px 8px' : density === 'comfortable' ? '10px 8px' : '6px 8px',
                  whiteSpace: 'nowrap',
                  ...(w ? { width: w, minWidth: w } : {})
                };
                const isFrozenLeft = ci < freezeLeftCount;
                const isFrozenRight = freezeRightCount > 0 && ci >= orderedColumns.length - freezeRightCount;
                if (isFrozenLeft) {
                  Object.assign(styleTd, { position: 'sticky', left: leftOffsets[ci], zIndex: 1, background: 'var(--background, #fff)' });
                }
                if (isFrozenRight) {
                  Object.assign(styleTd, { position: 'sticky', right: rightOffsets[ci] ?? 0, zIndex: 2, background: 'var(--background, #fff)', borderLeft: '1px solid var(--border, #e5e7eb)' });
                }
                const v = (row as any)[key];
                const content = c.render ? c.render(v, row, startIndex + i) : (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : String(v));
                return (
                  <td key={key} style={styleTd}>{content}</td>
                );
              })}
            </tr>
          ))}
          {visibleRows.length === 0 && (
            <tr>
              <td colSpan={Math.max(1, orderedColumns.length)} style={{ textAlign: 'center', padding: 12, color: '#6b7280' }}>无数据</td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ position: 'absolute', top: 4, right: 8, display: 'flex', gap: 8 }}>
        {headerRight}
        {resettable && (
          <button
            onClick={resetAll}
            style={{ border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
          >重置列顺序/列宽</button>
        )}
      </div>
    </div>
  );
}

export default VirtualTable;