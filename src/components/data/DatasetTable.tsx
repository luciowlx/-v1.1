import { VirtualTable } from "../ui/virtual-table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Card } from "../ui/card";
import { Filter, Eye, Zap, Download, Edit, Copy, Trash2, X, Upload } from "lucide-react";
import { GrayLabels } from "./GrayLabels";

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

interface DatasetTableProps {
  data: any[];
  selectAll: boolean;
  onSelectAll: () => void;
  selectedIds: Array<number | string>;
  onToggleSelect: (id: number | string) => void;
  sortBy: string;
  sortOrder: string;
  onSortChange: (column: string, order: string) => void;
  columnSettings: ColumnSettings;
  t: (key: string) => string;
  formatYYYYMMDD: (v: any) => string;
  isTagsColFilterOpen: boolean;
  onTagsFilterOpenChange: (open: boolean) => void;
  availableTags: string[];
  columnFilterTags: string[];
  onToggleTagFilter: (tag: string, checked: boolean) => void;
  onResetTagFilter: () => void;
  isFormatColFilterOpen: boolean;
  onFormatFilterOpenChange: (open: boolean) => void;
  availableFormats: string[];
  columnFilterFormat: string[];
  onToggleFormatFilter: (fmt: string, checked: boolean) => void;
  onResetFormatFilter: () => void;
  onViewDataDetail: (id: number | string) => void;
  onQuickPreprocess: (id: number | string) => void;
  onDownload: (id: number | string) => void;
  onEdit: (id: number | string) => void;
  onCopy: (id: number | string) => void;
  onDelete: (id: number | string) => void;
  onCancelUpload: (id: number | string) => void;
  projects?: Array<{ id: string; title: string }>;
}

export function DatasetTable(props: DatasetTableProps) {
  const {
    data,
    selectAll,
    onSelectAll,
    selectedIds,
    onToggleSelect,
    sortBy,
    sortOrder,
    onSortChange,
    columnSettings,
    t,
    formatYYYYMMDD,
    isTagsColFilterOpen,
    onTagsFilterOpenChange,
    availableTags,
    columnFilterTags,
    onToggleTagFilter,
    onResetTagFilter,
    isFormatColFilterOpen,
    onFormatFilterOpenChange,
    availableFormats,
    columnFilterFormat,
    onToggleFormatFilter,
    onResetFormatFilter,
    onViewDataDetail,
    onQuickPreprocess,
    onDownload,
    onEdit,
    onCopy,
    onDelete,
    onCancelUpload,
    projects = []
  } = props;

  return (
    <Card>
      <div className="p-2">
        <VirtualTable
          data={data as any}
          height={480}
          density={'normal'}
          enableColumnResize
          enableColumnDrag
          freezeRightCount={1}
          sortState={{ column: sortBy, order: sortOrder as 'asc' | 'desc' }}
          onSortChange={(column, order) => onSortChange(String(column), String(order))}
          style={{ border: 'none' }}
          headerRight={
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={onSelectAll}
                className="rounded"
              />
              {t('data.table.selectAllCurrent')}
            </label>
          }
          columns={[
            {
              key: 'select',
              label: '',
              width: 48,
              render: (_v: any, row: any) => (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(row.id)}
                  onChange={() => onToggleSelect(row.id)}
                  className="rounded"
                />
              )
            },
            columnSettings.name ? {
              key: 'name',
              label: t('data.columns.name'),
              width: 180,
              sortable: true,
              render: (_v: any, row: any) => (
                <span className="font-medium">{row.title}</span>
              )
            } : undefined,
            {
              key: 'project',
              label: '所属项目',
              width: 160,
              render: (_v: any, row: any) => {
                const project = projects.find(p => p.id === row.projectId);
                return <span className="text-gray-600 italic">{project ? project.title : (row.projectId || '-')}</span>;
              }
            },
            columnSettings.description ? {
              key: 'description',
              label: t('data.columns.description'),
              width: 240,
              render: (v: any) => (
                <span className="max-w-xs truncate inline-block align-middle">{v}</span>
              )
            } : undefined,
            columnSettings.categories ? {
              key: 'categories',
              label: (
                <div className="flex items-center gap-1">
                  <span>{t('data.columns.tags')}</span>
                  <Popover open={isTagsColFilterOpen} onOpenChange={onTagsFilterOpenChange}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        <Filter className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-48 p-2">
                      <div className="space-y-1 max-h-48 overflow-auto">
                        {availableTags.map((tag) => (
                          <label key={tag} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={columnFilterTags.includes(tag)}
                              onChange={(e) => onToggleTagFilter(tag, e.target.checked)}
                            />
                            <span>{tag}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button variant="ghost" size="sm" onClick={onResetTagFilter} className="text-gray-500">
                          {t('common.reset')}
                        </Button>
                        <Button variant="default" size="sm" onClick={() => onTagsFilterOpenChange(false)}>
                          {t('common.confirm')}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ),
              render: (_v: any, row: any) => <GrayLabels items={row.tags} />
            } : undefined,
            columnSettings.format ? {
              key: 'format',
              label: (
                <div className="flex items-center gap-1">
                  <span>{t('data.columns.format')}</span>
                  <Popover open={isFormatColFilterOpen} onOpenChange={onFormatFilterOpenChange}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        <Filter className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-40 p-2">
                      <div className="space-y-1">
                        {availableFormats.map((fmt) => (
                          <label key={fmt} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={columnFilterFormat.includes(fmt)}
                              onChange={(e) => onToggleFormatFilter(fmt, e.target.checked)}
                            />
                            <span>{fmt}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button variant="ghost" size="sm" onClick={onResetFormatFilter} className="text-gray-500">
                          {t('common.reset')}
                        </Button>
                        <Button variant="default" size="sm" onClick={() => onFormatFilterOpenChange(false)}>
                          {t('common.confirm')}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ),
              render: (_v: any, row: any) => (
                <span className="text-black" title={`全部格式：${(row.formats || []).join(' · ')}`}>
                  {(row.formats || []).join(' · ')}（{row.formats?.length ?? 0}）
                </span>
              )
            } : undefined,
            columnSettings.size ? { key: 'size', label: '文件数量', sortable: true, render: (_v: any, row: any) => (<span>{row.fileCount ?? 0}</span>) } : undefined,
            columnSettings.rows ? { key: 'rows', label: t('data.columns.rows'), sortable: true } : undefined,
            columnSettings.columns ? { key: 'columns', label: t('data.columns.columns'), sortable: true } : undefined,
            columnSettings.source ? { key: 'source', label: t('data.columns.source') } : undefined,
            columnSettings.version ? { key: 'version', label: '数据版本数量', render: (_v: any, row: any) => (<span>{row.versionCount ?? 0}</span>) } : undefined,
            columnSettings.updateTime ? { key: 'updateTime', label: t('data.columns.updateTime'), sortable: true, render: (v: any) => formatYYYYMMDD(v) } : undefined,
            columnSettings.status ? {
              key: 'status',
              label: t('data.columns.status'),
              render: (v: any) => (
                <Badge variant={v === 'success' ? 'default' : v === 'processing' ? 'secondary' : 'destructive'}>
                  {v === 'success' ? t('data.statusBadge.success') : v === 'processing' ? t('data.statusBadge.processing') : t('data.statusBadge.failed')}
                </Badge>
              )
            } : undefined,
            columnSettings.actions ? {
              key: 'actions',
              label: t('data.columns.actions'),
              width: 220,
              align: 'right',
              render: (_v: any, row: any) => (
                <div className="flex space-x-1">
                  {row.status === 'success' && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => onViewDataDetail(row.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onQuickPreprocess(row.id)}>
                        <Zap className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDownload(row.id)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onEdit(row.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onCopy(row.id)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(row.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {row.status === 'processing' && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => onViewDataDetail(row.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onCancelUpload(row.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {row.status === 'failed' && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => onViewDataDetail(row.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onEdit(row.id)}>
                        <Upload className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )
            } : undefined,
          ].filter(Boolean) as any}
        />
      </div>
    </Card>
  );
}
