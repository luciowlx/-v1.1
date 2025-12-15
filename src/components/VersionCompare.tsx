import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';

interface FieldInfo {
  name: string;
  type: string; // 简化类型约束以避免字面量类型推断问题
  nullable?: boolean;
  missingRate?: number; // 百分比 0-100
  uniqueRate?: number;  // 百分比 0-100
  description?: string;
}

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
  tags?: string[]; // 新增：数据标签（可选）
  fields?: FieldInfo[]; // 新增：字段列表（可选）
}

interface VersionCompareProps {
  version1: Version;
  version2: Version;
  datasetName: string;
  onBack: () => void;
}

// 基于版本号的字段 mock（若上游未提供 fields，则使用该函数生成）
const getMockFields = (versionNumber: string): FieldInfo[] => {
  const base: FieldInfo[] = [
    { name: "PassengerId", type: "number", nullable: false, missingRate: 0, uniqueRate: 100, description: "乘客唯一 ID" },
    { name: "Survived", type: "number", nullable: false, missingRate: 0, uniqueRate: 2, description: "是否生还" },
    { name: "Pclass", type: "number", nullable: false, missingRate: 0, uniqueRate: 10, description: "舱位等级" },
    { name: "Name", type: "string", nullable: false, missingRate: 0, uniqueRate: 95, description: "乘客姓名" },
    { name: "Sex", type: "category", nullable: false, missingRate: 0, uniqueRate: 2, description: "性别" },
    { name: "Age", type: "number", nullable: true, missingRate: 20, uniqueRate: 40, description: "年龄" },
    { name: "SibSp", type: "number", nullable: false, missingRate: 0, uniqueRate: 30, description: "兄弟姐妹/配偶数量" },
    { name: "Parch", type: "number", nullable: false, missingRate: 0, uniqueRate: 25, description: "父母/子女数量" },
    { name: "Ticket", type: "string", nullable: false, missingRate: 5, uniqueRate: 70, description: "船票编号" },
    { name: "Fare", type: "number", nullable: false, missingRate: 0, uniqueRate: 60, description: "票价" },
    { name: "Cabin", type: "string", nullable: true, missingRate: 70, uniqueRate: 50, description: "舱位号" },
    { name: "Embarked", type: "category", nullable: false, missingRate: 2, uniqueRate: 10, description: "登船港口" },
    { name: "Boat", type: "string", nullable: true, missingRate: 80, uniqueRate: 10, description: "救生船编号" },
    { name: "HomePort", type: "category", nullable: true, missingRate: 5, uniqueRate: 20, description: "原居港" },
  ];
  if (versionNumber === "v1.1") {
    return [
      ...base.map(f => f.name === "Age" ? { ...f, missingRate: 12 } : f), // 缺失率优化
      { name: "isSenior", type: "boolean", nullable: false, missingRate: 0, uniqueRate: 50, description: "是否老年人(>=65)" },
    ].filter(f => f.name !== "Boat"); // 该版本移除了 Boat 字段
  }
  if (versionNumber === "v1.2") {
    return [
      ...base.map(f => f.name === "Age" ? { ...f, missingRate: 8 } : f), // 进一步优化
      { name: "isSenior", type: "boolean", nullable: false, missingRate: 0, uniqueRate: 50, description: "是否老年人(>=65)" },
      { name: "CabinType", type: "category", nullable: true, missingRate: 75, uniqueRate: 30, description: "舱位类型" },
    ].filter(f => f.name !== "Boat");
  }
  return base; // 其它版本使用基础字段
};

const VersionCompare: React.FC<VersionCompareProps> = ({ version1, version2, datasetName, onBack }) => {
  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === '成功' ? 'default' : 'destructive'}>
        {status}
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
        {source}
      </Badge>
    );
  };

  const getChangeIcon = (value1: number, value2: number) => {
    if (value1 === value2) return <Minus className="h-4 w-4 text-gray-400" />;
    if (value1 < value2) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getChangeColor = (value1: number, value2: number, isGoodWhenHigher: boolean = true) => {
    if (value1 === value2) return 'text-gray-600';
    const isIncreasing = value1 < value2;
    if (isGoodWhenHigher) {
      return isIncreasing ? 'text-green-600' : 'text-red-600';
    } else {
      return isIncreasing ? 'text-red-600' : 'text-green-600';
    }
  };

  const calculateChange = (value1: number, value2: number) => {
    if (value1 === 0) return value2 === 0 ? 0 : 100;
    return ((value2 - value1) / value1 * 100);
  };

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  // 字段列表获取（优先使用上游传入，其次使用本地 mock）
  const fields1: FieldInfo[] = React.useMemo(() => version1.fields ?? getMockFields(version1.versionNumber), [version1]);
  const fields2: FieldInfo[] = React.useMemo(() => version2.fields ?? getMockFields(version2.versionNumber), [version2]);

  const map1 = React.useMemo(() => new Map(fields1.map(f => [f.name, f])), [fields1]);
  const map2 = React.useMemo(() => new Map(fields2.map(f => [f.name, f])), [fields2]);

  const allNames = React.useMemo(() => Array.from(new Set([...fields1.map(f => f.name), ...fields2.map(f => f.name)])), [fields1, fields2]);
  const addedNames = React.useMemo(() => allNames.filter(n => !map1.has(n) && map2.has(n)), [allNames, map1, map2]);
  const removedNames = React.useMemo(() => allNames.filter(n => map1.has(n) && !map2.has(n)), [allNames, map1, map2]);
  const commonNames = React.useMemo(() => allNames.filter(n => map1.has(n) && map2.has(n)), [allNames, map1, map2]);

  const changedNames = React.useMemo(() => commonNames.filter(n => {
    const f1 = map1.get(n)!; const f2 = map2.get(n)!;
    const safe = (x?: number) => Math.round(((x ?? 0)) * 1000) / 1000;
    return f1.type !== f2.type || (f1.nullable ?? false) !== (f2.nullable ?? false) || (safe(f1.missingRate) !== safe(f2.missingRate)) || (safe(f1.uniqueRate) !== safe(f2.uniqueRate));
  }), [commonNames, map1, map2]);

  const [onlyChanged, setOnlyChanged] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const rows = React.useMemo(() => {
    const base = (onlyChanged ? changedNames : commonNames)
      .filter(n => n.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
    return base.map(n => ({ name: n, f1: map1.get(n)!, f2: map2.get(n)! }));
  }, [changedNames, commonNames, search, map1, map2, onlyChanged]);

  const formatPct = (v?: number) => `${(v ?? 0).toFixed(1)}%`;

  // 标签对比辅助：读取两侧版本的标签并设置颜色规则（共同标签灰色、左侧独有红色、右侧独有绿色）
  const tags1 = React.useMemo(() => version1.tags ?? [], [version1]);
  const tags2 = React.useMemo(() => version2.tags ?? [], [version2]);
  const getLeftTagClass = (tag: string) => (tags2.includes(tag) ? "border-gray-300 text-gray-600" : "border-red-300 text-red-600");
  const getRightTagClass = (tag: string) => (tags1.includes(tag) ? "border-gray-300 text-gray-600" : "border-green-300 text-green-600");

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">版本对比</h1>
            <p className="text-gray-600">{datasetName}</p>
          </div>
        </div>
      </div>

      {/* 版本对比概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{version1.versionNumber}</span>
              <div className="flex space-x-2">
                {getStatusBadge(version1.status)}
                {getSourceBadge(version1.source)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">创建时间:</span>
              <span>{version1.createTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">创建人:</span>
              <span>{version1.creator}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">文件大小:</span>
              <span>{version1.size}</span>
            </div>
            {version1.description && (
              <div className="flex justify-between">
                <span className="text-gray-600">描述:</span>
                <span className="text-right">{version1.description}</span>
              </div>
            )}
            <div className="flex justify-between items-start">
              <span className="text-gray-600">数据标签:</span>
              <div className="flex flex-wrap gap-2 justify-end">
                {tags1.length === 0 ? (
                  <span className="text-gray-400">暂无标签</span>
                ) : (
                  tags1.map((t, idx) => (
                    <Badge key={idx} className={getLeftTagClass(t)} variant="outline">{t}</Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{version2.versionNumber}</span>
              <div className="flex space-x-2">
                {getStatusBadge(version2.status)}
                {getSourceBadge(version2.source)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">创建时间:</span>
              <span>{version2.createTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">创建人:</span>
              <span>{version2.creator}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">文件大小:</span>
              <span>{version2.size}</span>
            </div>
            {version2.description && (
              <div className="flex justify-between">
                <span className="text-gray-600">描述:</span>
                <span className="text-right">{version2.description}</span>
              </div>
            )}
            <div className="flex justify-between items-start">
              <span className="text-gray-600">数据标签:</span>
              <div className="flex flex-wrap gap-2 justify-end">
                {tags2.length === 0 ? (
                  <span className="text-gray-400">暂无标签</span>
                ) : (
                  tags2.map((t, idx) => (
                    <Badge key={idx} className={getRightTagClass(t)} variant="outline">{t}</Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 统计数据对比 */}
      <Card>
        <CardHeader>
          <CardTitle>统计数据对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 字段数对比 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-semibold">字段数</div>
                {getChangeIcon(version1.fieldCount, version2.fieldCount)}
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{version1.fieldCount}</div>
                  <div className="text-sm text-gray-600">{version1.versionNumber}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg text-gray-400">→</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{version2.fieldCount}</div>
                  <div className="text-sm text-gray-600">{version2.versionNumber}</div>
                </div>
                <div className={`text-center ${getChangeColor(version1.fieldCount, version2.fieldCount)}`}>
                  <div className="text-lg font-semibold">
                    {formatChange(calculateChange(version1.fieldCount, version2.fieldCount))}
                  </div>
                  <div className="text-sm">变化</div>
                </div>
              </div>
            </div>

            {/* 样本数对比 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-semibold">样本数</div>
                {getChangeIcon(version1.sampleCount, version2.sampleCount)}
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{version1.sampleCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{version1.versionNumber}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg text-gray-400">→</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{version2.sampleCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{version2.versionNumber}</div>
                </div>
                <div className={`text-center ${getChangeColor(version1.sampleCount, version2.sampleCount)}`}>
                  <div className="text-lg font-semibold">
                    {formatChange(calculateChange(version1.sampleCount, version2.sampleCount))}
                  </div>
                  <div className="text-sm">变化</div>
                </div>
              </div>
            </div>

            {/* 缺失比例对比 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-semibold">缺失比例</div>
                {getChangeIcon(version1.missingRate, version2.missingRate)}
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{version1.missingRate}%</div>
                  <div className="text-sm text-gray-600">{version1.versionNumber}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg text-gray-400">→</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{version2.missingRate}%</div>
                  <div className="text-sm text-gray-600">{version2.versionNumber}</div>
                </div>
                <div className={`text-center ${getChangeColor(version1.missingRate, version2.missingRate, false)}`}>
                  <div className="text-lg font-semibold">
                    {formatChange(calculateChange(version1.missingRate, version2.missingRate))}
                  </div>
                  <div className="text-sm">变化</div>
                </div>
              </div>
            </div>

            {/* 异常比例对比 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-semibold">异常比例</div>
                {getChangeIcon(version1.anomalyRate, version2.anomalyRate)}
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{version1.anomalyRate}%</div>
                  <div className="text-sm text-gray-600">{version1.versionNumber}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg text-gray-400">→</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{version2.anomalyRate}%</div>
                  <div className="text-sm text-gray-600">{version2.versionNumber}</div>
                </div>
                <div className={`text-center ${getChangeColor(version1.anomalyRate, version2.anomalyRate, false)}`}>
                  <div className="text-lg font-semibold">
                    {formatChange(calculateChange(version1.anomalyRate, version2.anomalyRate))}
                  </div>
                  <div className="text-sm">变化</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 字段详细对比 */}
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>字段详细对比</CardTitle>
          <CardDescription>
            展示两版本在字段维度的具体差异，包括类型、缺失率、唯一性与可空属性。支持搜索与仅显示差异字段。
          </CardDescription>
          <div className="flex items-center gap-2">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="按字段名称搜索..." className="max-w-xs" />
            <Button variant={onlyChanged ? "default" : "outline"} size="sm" onClick={() => setOnlyChanged(v => !v)}>
              {onlyChanged ? "显示全部字段" : "仅显示差异字段"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="secondary">新增字段：{addedNames.length}</Badge>
            <Badge variant="secondary">删除字段：{removedNames.length}</Badge>
            <Badge variant="secondary">发生变更：{changedNames.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">字段名称</TableHead>
                  <TableHead className="whitespace-nowrap">{version1.versionNumber} 类型</TableHead>
                  <TableHead className="whitespace-nowrap">{version2.versionNumber} 类型</TableHead>
                  <TableHead className="whitespace-nowrap">可空变化</TableHead>
                  <TableHead className="whitespace-nowrap">缺失率变化</TableHead>
                  <TableHead className="whitespace-nowrap">唯一性变化</TableHead>
                  <TableHead className="whitespace-nowrap">备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">无匹配字段</TableCell>
                  </TableRow>
                )}
                {rows.map(({ name, f1, f2 }) => {
                  const typeChanged = f1.type !== f2.type;
                  const nullableChanged = (f1.nullable ?? false) !== (f2.nullable ?? false);
                  const missChange = calculateChange(f1.missingRate ?? 0, f2.missingRate ?? 0);
                  const uniqChange = calculateChange(f1.uniqueRate ?? 0, f2.uniqueRate ?? 0);
                  return (
                    <TableRow key={name}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className={typeChanged ? "text-red-600" : ""}>{f1.type}</TableCell>
                      <TableCell className={typeChanged ? "text-red-600" : ""}>{f2.type}</TableCell>
                      <TableCell className={nullableChanged ? "text-red-600" : ""}>{(f1.nullable ? "可空" : "不可空") + " -> " + (f2.nullable ? "可空" : "不可空")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{formatPct(f1.missingRate)}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span className={getChangeColor(f1.missingRate ?? 0, f2.missingRate ?? 0, false)}>{formatPct(f2.missingRate)}</span>
                          <Badge variant="outline" className={getChangeColor(f1.missingRate ?? 0, f2.missingRate ?? 0, false)}>{missChange.toFixed(1)}%</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{formatPct(f1.uniqueRate)}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span className={getChangeColor(f1.uniqueRate ?? 0, f2.uniqueRate ?? 0, true)}>{formatPct(f2.uniqueRate)}</span>
                          <Badge variant="outline" className={getChangeColor(f1.uniqueRate ?? 0, f2.uniqueRate ?? 0, true)}>{uniqChange.toFixed(1)}%</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{f2.description ?? f1.description ?? ""}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* 新增/删除字段清单 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="rounded-md border p-3">
              <div className="font-medium mb-2">新增字段（仅 {version2.versionNumber}）</div>
              {addedNames.length === 0 ? (
                <div className="text-sm text-muted-foreground">无新增字段</div>
              ) : (
                <ul className="text-sm list-disc pl-5">
                  {addedNames.map(n => {
                    const f = map2.get(n)!;
                    return <li key={n}>{n}（类型：{f.type}，缺失率：{formatPct(f.missingRate)}，唯一性：{formatPct(f.uniqueRate)}）</li>;
                  })}
                </ul>
              )}
            </div>
            <div className="rounded-md border p-3">
              <div className="font-medium mb-2">删除字段（仅 {version1.versionNumber}）</div>
              {removedNames.length === 0 ? (
                <div className="text-sm text-muted-foreground">无删除字段</div>
              ) : (
                <ul className="text-sm list-disc pl-5">
                  {removedNames.map(n => {
                    const f = map1.get(n)!;
                    return <li key={n}>{n}（类型：{f.type}，缺失率：{formatPct(f.missingRate)}，唯一性：{formatPct(f.uniqueRate)}）</li>;
                  })}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 处理规则对比 */}
      {(version1.rules || version2.rules) && (
        <Card>
          <CardHeader>
            <CardTitle>处理规则对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">{version1.versionNumber}</h4>
                {version1.rules && version1.rules.length > 0 ? (
                  <div className="space-y-2">
                    {version1.rules.map((rule, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{rule}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">无处理规则</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-purple-600">{version2.versionNumber}</h4>
                {version2.rules && version2.rules.length > 0 ? (
                  <div className="space-y-2">
                    {version2.rules.map((rule, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{rule}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">无处理规则</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default VersionCompare;