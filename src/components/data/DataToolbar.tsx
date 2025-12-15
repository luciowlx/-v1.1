import { Button } from "../ui/button";
import { Columns, List, Grid3X3, Upload, Database, Download, Archive, Trash2 } from "lucide-react";

interface DataToolbarProps {
  selectedIds: string[];
  onOpenUpload: () => void;
  onOpenSubscription: () => void;
  onOpenSubscriptionList: () => void;
  onBatchDownload: () => void;
  onBatchArchive: () => void;
  onBatchDelete: () => void;
  onOpenColumnSettings: () => void;
  viewMode: 'list' | 'grid';
  onSwitchViewMode: (mode: 'list' | 'grid') => void;
  t: (key: string) => string;
}

export function DataToolbar({
  selectedIds,
  onOpenUpload,
  onOpenSubscription,
  onOpenSubscriptionList,
  onBatchDownload,
  onBatchArchive,
  onBatchDelete,
  onOpenColumnSettings,
  viewMode,
  onSwitchViewMode,
  t
}: DataToolbarProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex gap-2">
        <Button onClick={onOpenUpload}>
          <Upload className="h-4 w-4 mr-2" />
          {t('data.toolbar.uploadDataset')}
        </Button>
        <Button variant="outline" onClick={onOpenSubscription}>
          <Database className="h-4 w-4 mr-2" />
          {t('data.toolbar.newDatasource')}
        </Button>
        <Button variant="outline" onClick={onOpenSubscriptionList}>
          <List className="h-4 w-4 mr-2" />
          {t('data.toolbar.subscriptionMgmt')}
        </Button>
        {selectedIds.length > 0 && (
          <>
            <Button variant="outline" onClick={onBatchDownload}>
              <Download className="h-4 w-4 mr-2" />
              {t('data.toolbar.batchDownload')}
            </Button>
            <Button variant="outline" onClick={onBatchArchive}>
              <Archive className="h-4 w-4 mr-2" />
              {t('data.toolbar.batchArchive')}
            </Button>
            <Button variant="outline" onClick={onBatchDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('data.toolbar.batchDelete')}
            </Button>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onOpenColumnSettings}>
          <Columns className="h-4 w-4" />
        </Button>
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSwitchViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSwitchViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

