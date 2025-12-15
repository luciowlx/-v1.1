import React, { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { useLanguage } from '../i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Calendar, User, Database, FileText, BarChart3, Settings, CheckCircle, AlertTriangle } from 'lucide-react';

interface Version {
  id: string;
  versionNumber: string;
  source: '上传' | '订阅' | '清洗';
  createTime: string;
  creator: string;
  size: string;
  status: '成功' | '失败';
  description?: string;
  fieldCount: number;
  sampleCount: number;
  missingRate: number;
  anomalyRate: number;
  rules?: string[];
  processingDetails?: {
    originalFields: number;
    processedFields: number;
    removedFields: string[];
    addedFields: string[];
    transformations: string[];
  };
}

interface VersionDetailProps {
  version: Version;
  datasetName: string;
  onBack: () => void;
}

const VersionDetail: React.FC<VersionDetailProps> = ({ version, datasetName, onBack }) => {
  const { t } = useLanguage();
  const [previewRows, setPreviewRows] = useState<number>(20);
  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === '成功' ? 'default' : 'destructive'}>
        {status === '成功' ? t('versionDetail.status.success') : t('versionDetail.status.failed')}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const variants = {
      '上传': 'secondary',
      '订阅': 'outline',
      '清洗': 'default'
    } as const;
    
    return (
      <Badge variant={variants[source as keyof typeof variants]}>
        {source === '上传' ? t('versionDetail.source.upload') : source === '订阅' ? t('versionDetail.source.subscription') : t('versionDetail.source.cleaning')}
      </Badge>
    );
  };

  // 预处理后数据结构与示例数据（示例/占位，用于预览展示）
  const processedSchema = useMemo(
    () => (
      [
        { name: 'PassengerId', type: 'number', status: '标准化' },
        { name: 'Survived', type: 'number', status: '标签转换' },
        { name: 'Pclass', type: 'number', status: '缺失值填充' },
        { name: 'Name', type: 'string', status: '去重/清洗' },
        { name: 'Sex', type: 'string', status: '枚举校验' },
        { name: 'Age', type: 'number', status: '缺失值填充' },
        { name: 'SibSp', type: 'number', status: '标准化' },
        { name: 'Parch', type: 'number', status: '标准化' },
        { name: 'Ticket', type: 'string', status: '格式化' },
        { name: 'Fare', type: 'number', status: '异常值处理' },
        { name: 'Cabin', type: 'string', status: '缺失值标记' },
        { name: 'Embarked', type: 'string', status: '枚举校验' },
      ]
    ),
    []
  );

  const processedRows = useMemo(() => (
    [
      { PassengerId: 1, Survived: 0, Pclass: 3, Name: 'Braund, Mr. Owen Harris', Sex: 'male', Age: 22, SibSp: 1, Parch: 0, Ticket: 'A/5 21171', Fare: 7.25, Cabin: null, Embarked: 'S' },
      { PassengerId: 2, Survived: 1, Pclass: 1, Name: 'Cumings, Mrs. Bradley (Florence Briggs Thayer)', Sex: 'female', Age: 38, SibSp: 1, Parch: 0, Ticket: 'PC 17599', Fare: 71.2833, Cabin: 'C85', Embarked: 'C' },
      { PassengerId: 3, Survived: 1, Pclass: 3, Name: 'Heikkinen, Miss. Laina', Sex: 'female', Age: 26, SibSp: 0, Parch: 0, Ticket: 'STON/O2. 3101282', Fare: 7.925, Cabin: null, Embarked: 'S' },
      { PassengerId: 4, Survived: 1, Pclass: 1, Name: 'Futrelle, Mrs. Jacques Heath (Lily May Peel)', Sex: 'female', Age: 35, SibSp: 1, Parch: 0, Ticket: '113803', Fare: 53.1, Cabin: 'C123', Embarked: 'S' },
      { PassengerId: 5, Survived: 0, Pclass: 3, Name: 'Allen, Mr. William Henry', Sex: 'male', Age: 35, SibSp: 0, Parch: 0, Ticket: '373450', Fare: 8.05, Cabin: null, Embarked: 'S' },
      { PassengerId: 6, Survived: 0, Pclass: 3, Name: 'Montvila, Rev. Juozas', Sex: 'male', Age: 27, SibSp: 0, Parch: 0, Ticket: '211536', Fare: 13, Cabin: null, Embarked: 'S' },
      { PassengerId: 7, Survived: 0, Pclass: 1, Name: 'Graham, Miss. Margaret Edith', Sex: 'female', Age: 19, SibSp: 0, Parch: 0, Ticket: '112053', Fare: 30, Cabin: 'B42', Embarked: 'S' },
      { PassengerId: 8, Survived: 0, Pclass: 3, Name: 'Johnston, Miss. Catherine Helen "Carrie"', Sex: 'female', Age: 19, SibSp: 1, Parch: 0, Ticket: 'W./C. 6607', Fare: 23.45, Cabin: null, Embarked: 'S' },
      { PassengerId: 9, Survived: 1, Pclass: 3, Name: 'Behr, Mr. Karl Howell', Sex: 'male', Age: 26, SibSp: 0, Parch: 0, Ticket: '111369', Fare: 30, Cabin: 'C148', Embarked: 'C' },
      { PassengerId: 10, Survived: 1, Pclass: 3, Name: 'Dooley, Mr. Patrick', Sex: 'male', Age: 32, SibSp: 0, Parch: 0, Ticket: '370376', Fare: 7.75, Cabin: null, Embarked: 'S' },
    ]
  ), []);

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('versionDetail.title')}</h1>
            <p className="text-gray-600">{datasetName} - {version.versionNumber}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {getStatusBadge(version.status)}
          {getSourceBadge(version.source)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基本信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              {t('versionDetail.basicInfo.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('versionDetail.fields.versionNumber')}</label>
                <p className="text-lg font-semibold">{version.versionNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('versionDetail.fields.source')}</label>
                <div className="mt-1">{getSourceBadge(version.source)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('versionDetail.fields.createTime')}</label>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{version.createTime}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('versionDetail.fields.creator')}</label>
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{version.creator}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('versionDetail.fields.size')}</label>
                <div className="flex items-center mt-1">
                  <Database className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{version.size}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('versionDetail.fields.status')}</label>
                <div className="mt-1">{getStatusBadge(version.status)}</div>
              </div>
            </div>
            {version.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">{t('versionDetail.fields.description')}</label>
                <p className="mt-1 text-gray-700">{version.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 统计信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              {t('versionDetail.stats.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{version.fieldCount}</div>
                <div className="text-sm text-blue-600">{t('versionDetail.stats.fieldCount')}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{version.sampleCount.toLocaleString()}</div>
                <div className="text-sm text-green-600">{t('versionDetail.stats.sampleCount')}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{version.missingRate}%</div>
                <div className="text-sm text-yellow-600">{t('versionDetail.stats.missingRate')}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{version.anomalyRate}%</div>
                <div className="text-sm text-red-600">{t('versionDetail.stats.anomalyRate')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 规则摘要卡片 */}
      {version.rules && version.rules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              {t('versionDetail.rules.summary.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {version.rules.map((rule, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm">{rule}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 处理详情卡片 */}
      {version.processingDetails && (
        <Card>
          <CardHeader>
            <CardTitle>{t('versionDetail.process.detail.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">{t('versionDetail.process.fieldChanges.title')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('versionDetail.process.originalFields')}:</span>
                    <span className="font-medium">{version.processingDetails.originalFields}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('versionDetail.process.processedFields')}:</span>
                    <span className="font-medium">{version.processingDetails.processedFields}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">{t('versionDetail.process.transformations.title')}</h4>
                <div className="space-y-1">
                  {version.processingDetails.transformations.map((transformation, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {transformation}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {(version.processingDetails.removedFields.length > 0 || version.processingDetails.addedFields.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {version.processingDetails.removedFields.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">{t('versionDetail.process.deletedFields.title')}</h4>
                    <div className="space-y-1">
                      {version.processingDetails.removedFields.map((field, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                          {field}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {version.processingDetails.addedFields.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">{t('versionDetail.process.addedFields.title')}</h4>
                    <div className="space-y-1">
                      {version.processingDetails.addedFields.map((field, index) => (
                        <div key={index} className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                          {field}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 版本数据预览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('versionDetail.preview.title')}</span>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">{t('versionDetail.preview.selectRows.label')}</span>
              <Select value={String(previewRows)} onValueChange={(v: string) => setPreviewRows(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 数据结构与字段处理状态 */}
          <div>
            <h4 className="font-semibold mb-3">{t('versionDetail.structure.title')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {processedSchema.map((field) => (
                <div key={field.name} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{field.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{field.type}</span>
                  </div>
                  <div className="mt-2 flex items-center text-xs text-gray-600">
                    {field.status?.includes('异常') ? (
                      <AlertTriangle className="h-3 w-3 text-orange-500 mr-1" />
                    ) : (
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                    )}
                    <span>{field.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 表格预览 */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {processedSchema.map((f) => (
                    <TableHead key={f.name} className="text-sm text-gray-600">{f.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedRows.slice(0, previewRows).map((row, idx) => (
                  <TableRow key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    {processedSchema.map((f) => (
                      <TableCell key={f.name} className="py-2 px-3 text-sm">
                        {String((row as any)[f.name] ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 说明 */}
          <p className="text-xs text-gray-500">{t('versionDetail.note')}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VersionDetail;