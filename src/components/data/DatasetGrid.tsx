import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Edit, Copy, Trash2, Eye, Zap, Download, X, Upload } from "lucide-react";
import { GrayLabels } from "./GrayLabels";

interface DatasetGridProps {
  datasets: any[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onCopy: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetail: (id: string) => void;
  onQuickPreprocess: (id: string) => void;
  onDownload: (id: string) => void;
  onCancelUpload: (id: string) => void;
  t: (key: string) => string;
}

export function DatasetGrid({
  datasets,
  selectedIds,
  onToggleSelect,
  onEdit,
  onCopy,
  onDelete,
  onViewDetail,
  onQuickPreprocess,
  onDownload,
  onCancelUpload,
  t
}: DatasetGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {datasets.map((dataset: any) => (
        <Card key={dataset.id} className={`hover:shadow-lg transition-shadow border-l-4 ${dataset.color}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(dataset.id)}
                  onChange={() => onToggleSelect(dataset.id)}
                  className="rounded"
                />
                <CardTitle className="text-lg">{dataset.title}</CardTitle>
              </div>
              <div className="flex space-x-1">
                {dataset.status === 'success' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(dataset.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onCopy(dataset.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(dataset.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {dataset.status === 'failed' && (
                  <Button variant="ghost" size="sm" onClick={() => onDelete(dataset.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 line-clamp-2">{dataset.description}</p>

            <GrayLabels items={dataset.categories} />
            <GrayLabels items={dataset.tags} />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t('data.grid.versionCount')}</span>
                <span className="ml-1 font-medium">{dataset.versionCount ?? 0}</span>
              </div>
              <div>
                <span className="text-gray-500">{t('data.grid.fileCount')}</span>
                <span className="ml-1 font-medium">{dataset.fileCount ?? 0}</span>
              </div>
              <div>
                <span className="text-gray-500">{t('data.grid.size')}</span>
                <span className="ml-1 font-medium">{dataset.size}</span>
              </div>
              <div>
                <span className="text-gray-500">{t('data.grid.rows')}</span>
                <span className="ml-1 font-medium">{dataset.rows}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">{t('data.upload.progress')}</span>
                <span className="font-medium">{dataset.status === 'success' ? 100 : dataset.status === 'failed' ? 0 : 88}%</span>
              </div>
              <Progress value={dataset.status === 'success' ? 100 : dataset.status === 'failed' ? 0 : 88} className="h-2" />
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex space-x-2">
                {dataset.status === 'success' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onViewDetail(dataset.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onQuickPreprocess(dataset.id)}>
                      <Zap className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDownload(dataset.id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {dataset.status === 'processing' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onViewDetail(dataset.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onCancelUpload(dataset.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {dataset.status === 'failed' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onViewDetail(dataset.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEdit(dataset.id)}>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              <Badge variant={dataset.status === 'success' ? 'default' : dataset.status === 'processing' ? 'secondary' : 'destructive'}>
                {dataset.status === 'success' 
                  ? t('data.statusBadge.success') 
                  : dataset.status === 'processing' 
                    ? t('data.statusBadge.processing') 
                    : t('data.statusBadge.failed')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

