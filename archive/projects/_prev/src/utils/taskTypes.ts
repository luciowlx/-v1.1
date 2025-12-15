// Centralized task type constants and helpers
export const TASK_TYPES = {
  forecasting: 'forecasting',
  classification: 'classification',
  regression: 'regression',
} as const;

export type TaskType = typeof TASK_TYPES[keyof typeof TASK_TYPES];

export const ALLOWED_TASK_TYPES: readonly TaskType[] = [
  TASK_TYPES.forecasting,
  TASK_TYPES.classification,
  TASK_TYPES.regression,
] as const;

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  [TASK_TYPES.forecasting]: '时序预测',
  [TASK_TYPES.classification]: '分类',
  [TASK_TYPES.regression]: '回归',
};

export const getTaskTypeLabel = (type: TaskType): string => TASK_TYPE_LABELS[type];

export const isTaskType = (t: string): t is TaskType => (ALLOWED_TASK_TYPES as readonly string[]).includes(t);