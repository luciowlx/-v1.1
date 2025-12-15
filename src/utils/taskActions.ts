import { Eye, Play, Pencil, Trash2, Square, Download, Archive, Copy, RotateCcw, XCircle } from 'lucide-react';

// Shared task status type across list and detail pages
export type TaskStatus = 'not_started' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'archived' | 'paused';

export type TaskAction = { key: string; label: string; icon: any };

// Return available actions based on task status
/**
 * 基于任务状态返回可用操作列表（前端模拟）。
 * 参数：task - 任务对象，至少包含 status；可选 hasQueuedBefore。
 * 返回：任务操作数组。
 */
export const getAvailableActions = (task: { status: TaskStatus; hasQueuedBefore?: boolean }): TaskAction[] => {
  const mapping: Record<TaskStatus, TaskAction[]> = {
    not_started: [
      { key: 'view', label: '详情', icon: Eye },
      // 默认显示“开始”，如果曾排队过则替换为“重新运行”
      ...(task.hasQueuedBefore
        ? [{ key: 'retry', label: '重新运行', icon: RotateCcw }]
        : [{ key: 'start', label: '开始', icon: Play }]),
      { key: 'edit', label: '编辑', icon: Pencil },
      { key: 'delete', label: '删除', icon: Trash2 },
    ],
    pending: [
      { key: 'view', label: '详情', icon: Eye },
      { key: 'cancel_queue', label: '取消排队', icon: XCircle },
      { key: 'edit', label: '编辑', icon: Pencil },
      { key: 'delete', label: '删除', icon: Trash2 },
    ],
    running: [
      { key: 'view', label: '详情', icon: Eye },
      { key: 'stop', label: '停止', icon: Square },
    ],
    completed: [
      { key: 'view', label: '详情', icon: Eye },
      { key: 'export', label: '导出', icon: Download },
      { key: 'archive', label: '归档', icon: Archive },
      { key: 'copy', label: '复制', icon: Copy },
    ],
    failed: [
      { key: 'view', label: '详情', icon: Eye },
      { key: 'edit', label: '编辑', icon: Pencil },
      { key: 'retry', label: '重新运行', icon: RotateCcw },
      { key: 'delete', label: '删除', icon: Trash2 },
    ],
    cancelled: [
      { key: 'view', label: '详情', icon: Eye },
      { key: 'edit', label: '编辑', icon: Pencil },
      { key: 'retry', label: '重新运行', icon: RotateCcw },
      { key: 'delete', label: '删除', icon: Trash2 },
    ],
    archived: [
      { key: 'view', label: '详情', icon: Eye },
    ],
    paused: [
      { key: 'view', label: '详情', icon: Eye },
      { key: 'start', label: '开始', icon: Play },
      { key: 'stop', label: '停止', icon: Square },
    ],
  };
  return mapping[task.status];
};

/**
 * 返回常用操作键（直接显示的按钮），其他操作进入“更多”下拉。
 * 参数：task - 任务对象，至少包含 status；可选 hasQueuedBefore。
 * 返回：常用操作键数组。
 */
export const getCommonActionKeys = (task: { status: TaskStatus; hasQueuedBefore?: boolean }): string[] => {
  const mapping: Record<TaskStatus, string[]> = {
    not_started: task.hasQueuedBefore ? ['retry', 'edit'] : ['start', 'edit'],
    pending: ['cancel_queue', 'edit'],
    running: ['stop'],
    completed: ['export', 'archive'],
    failed: ['retry', 'edit'],
    cancelled: ['retry', 'edit'],
    archived: ['view'],
    paused: ['start', 'stop'],
  };
  return mapping[task.status];
};