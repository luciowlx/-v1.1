import { Button } from "../ui/button";
import { X } from "lucide-react";

interface ColumnSettings {
  id: boolean;
  name: boolean;
  description: boolean;
  categories: boolean;
  format: boolean;
  size: boolean;
  rows: boolean;
  columns: boolean;
  source: boolean;
  version: boolean;
  updateTime: boolean;
  status: boolean;
  actions: boolean;
}

interface ColumnSettingsDialogProps {
  open: boolean;
  title: string;
  settings: ColumnSettings;
  onChange: (key: keyof ColumnSettings, value: boolean) => void;
  onSelectAll: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

export function ColumnSettingsDialog({ open, title, settings, onChange, onSelectAll, onClose, t }: ColumnSettingsDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {Object.entries(settings).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onChange(key as keyof ColumnSettings, e.target.checked)}
              />
              <span className="text-sm">
                {key === 'id' ? 'ID' :
                 key === 'name' ? t('data.columns.name') :
                 key === 'description' ? t('data.columns.description') :
                 key === 'categories' ? t('data.columns.tags') :
                 key === 'format' ? t('data.columns.format') :
                 key === 'size' ? t('data.columns.size') :
                 key === 'rows' ? t('data.columns.rows') :
                 key === 'columns' ? t('data.columns.columns') :
                 key === 'source' ? t('data.columns.source') :
                 key === 'version' ? t('data.columns.version') :
                 key === 'updateTime' ? t('data.columns.updateTime') :
                 key === 'status' ? t('data.columns.status') :
                 key === 'actions' ? t('data.columns.actions') : key}
              </span>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onSelectAll}>{t('data.columnsSettings.selectAll')}</Button>
          <Button onClick={onClose}>{t('common.confirm')}</Button>
        </div>
      </div>
    </div>
  );
}

