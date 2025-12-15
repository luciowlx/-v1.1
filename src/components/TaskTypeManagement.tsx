import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Download, Upload, Eye, History, Plus, FileJson, Save, Layers, ListChecks, Trash2, Pencil, RefreshCcw } from "lucide-react";
import Ajv from "ajv";
import { taskTypeSchema } from "../utils/taskTypeSchema";
import { blankTemplate, taskTypeTemplates } from "../mock/taskTypeTemplates";

// 任务类型条目数据（仅前端 mock）
interface TaskTypeItem {
  id: string;
  name: string;
  category: "时序预测" | "分类" | "回归";
  enabled: boolean;
  version: number;
  updatedAt: string;
  createdAt: string;
}

interface VersionRecord {
  version: number;
  json: any;
  createdAt: string;
  author: string;
}

interface TaskTypeManagementProps {
  isAdmin?: boolean; // 仅管理员可访问
}

const STORAGE_KEY = "task_type_configs_v1";

export default function TaskTypeManagement({ isAdmin = true }: TaskTypeManagementProps) {
  const [items, setItems] = useState<TaskTypeItem[]>(() => {
    // 初始 mock 列表
    const init: TaskTypeItem[] = [
      { id: "TimeSeries_Electricity", name: "时序预测", category: "时序预测", enabled: true, version: 1, createdAt: "2024-01-15", updatedAt: "2024-01-20" },
      { id: "Classification_SteelDefect", name: "分类", category: "分类", enabled: true, version: 1, createdAt: "2024-01-15", updatedAt: "2024-01-20" },
      { id: "Regression_Quality", name: "回归", category: "回归", enabled: true, version: 1, createdAt: "2024-01-15", updatedAt: "2024-01-20" }
    ];
    return init;
  });

  const [versions, setVersions] = useState<Record<string, VersionRecord[]>>(() => {
    // 从 localStorage 恢复
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    // 初始化版本：从模板填充 v1
    const init: Record<string, VersionRecord[]> = {};
    for (const tpl of taskTypeTemplates) {
      init[tpl.id] = [{ version: 1, json: tpl, createdAt: new Date().toISOString(), author: "admin" }];
    }
    return init;
  });

  useEffect(() => {
    // 持久化到 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
  }, [versions]);

  const [selectedId, setSelectedId] = useState<string>(items[0]?.id || "");
  const currentVersionList = versions[selectedId] || [];
  const currentJson = currentVersionList[currentVersionList.length - 1]?.json || blankTemplate;
  const [editorText, setEditorText] = useState<string>(JSON.stringify(currentJson, null, 2));
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'create'>('create');
  const [paramJsonText, setParamJsonText] = useState<string>("{}");
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [selectedRollbackVersion, setSelectedRollbackVersion] = useState<number | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);

  const ajv = useMemo(() => new Ajv({ allErrors: true }), []);
  const validate = useMemo(() => ajv.compile(taskTypeSchema as any), [ajv]);

  useEffect(() => {
    // 切换条目时重置编辑区
    const json = versions[selectedId]?.[versions[selectedId].length - 1]?.json;
    if (json) {
      setEditorText(JSON.stringify(json, null, 2));
      setValidationErrors([]);
    }
  }, [selectedId, versions]);

  const parseEditorJson = (): { ok: boolean; data?: any; error?: string } => {
    try {
      const data = JSON.parse(editorText);
      return { ok: true, data };
    } catch (e: any) {
      return { ok: false, error: e?.message || "JSON 解析失败" };
    }
  };

  const runSchemaValidation = (json: any): boolean => {
    const ok = validate(json) as boolean;
    if (!ok) {
      const errors = (validate.errors || []).map(err => {
        const path = err.instancePath || err.schemaPath;
        return `${path}: ${err.message}`;
      });
      setValidationErrors(errors);
      return false;
    }
    setValidationErrors([]);
    return true;
  };

  const handleSave = () => {
    const parsed = parseEditorJson();
    if (!parsed.ok || !parsed.data) {
      alert(`JSON 格式错误：${parsed.error}`);
      return;
    }
    if (!runSchemaValidation(parsed.data)) {
      alert("Schema 校验失败，请修正错误后再提交");
      return;
    }
    // 新增版本
    const prev = versions[selectedId] || [];
    const nextVersion = (prev[prev.length - 1]?.version || 0) + 1;
    const next: VersionRecord = {
      version: nextVersion,
      json: parsed.data,
      createdAt: new Date().toISOString(),
      author: "admin"
    };
    setVersions({ ...versions, [selectedId]: [...prev, next] });
    // 更新列表版本号与时间
    setItems(items.map(it => it.id === selectedId ? { ...it, version: nextVersion, updatedAt: new Date().toISOString() } : it));
    alert("已保存新版本");
  };

  const handleAddNew = () => {
    const newId = `New_${Date.now()}`;
    const newItem: TaskTypeItem = {
      id: newId,
      name: "未命名任务类型",
      category: "回归",
      enabled: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setItems([newItem, ...items]);
    setVersions({ ...versions, [newId]: [{ version: 1, json: blankTemplate, createdAt: new Date().toISOString(), author: "admin" }] });
    setSelectedId(newId);
    setEditorText(JSON.stringify(blankTemplate, null, 2));
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    setItems(items.map(it => it.id === id ? { ...it, enabled } : it));
  };

  const handleImportJsonFile = async (file: File) => {
    const text = await file.text();
    setEditorText(text);
  };

  const handleExportJson = () => {
    const blob = new Blob([editorText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreview = () => {
    const parsed = parseEditorJson();
    if (!parsed.ok || !parsed.data) {
      alert(`JSON 解析失败：${parsed.error}`);
      return;
    }
    if (!runSchemaValidation(parsed.data)) {
      alert("Schema 校验失败，无法预览");
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleRollback = () => {
    if (selectedRollbackVersion == null) return;
    const list = versions[selectedId] || [];
    const found = list.find(v => v.version === selectedRollbackVersion);
    if (!found) return;
    // 回滚：将该版本复制为新的最新版本
    const nextVersion = (list[list.length - 1]?.version || 0) + 1;
    const next: VersionRecord = { version: nextVersion, json: found.json, createdAt: new Date().toISOString(), author: "admin" };
    setVersions({ ...versions, [selectedId]: [...list, next] });
    setRollbackOpen(false);
    setSelectedRollbackVersion(null);
    alert(`已回滚到版本 ${found.version}（生成新版本 ${nextVersion}）`);
  };

  const applyTemplate = (tplId: string) => {
    const tpl = taskTypeTemplates.find(t => t.id === tplId);
    if (!tpl) return;
    setEditorText(JSON.stringify(tpl, null, 2));
  };

  // 预览渲染（任务创建页）
  const renderCreatePreview = (config: any) => {
    const params = config.input?.parameters || [];
    const models = config.input?.models || [];
    const datasetCfg = config.input?.dataset || {};

    // 如果用户粘贴了参数 JSON，则根据其填充值
    let paramValues: Record<string, any> = {};
    try {
      paramValues = JSON.parse(paramJsonText || "{}");
    } catch {}

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基础信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>任务名称</Label>
              <Input placeholder={`示例：${config.name}`} />
            </div>
            <div>
              <Label>任务类型</Label>
              <Input value={config.category} readOnly />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>数据集选择</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>主数据集文件</Label>
                <Select defaultValue="dataset_v1">
                  <SelectTrigger>
                    <SelectValue placeholder="选择数据集" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dataset_v1">dataset_v1.csv</SelectItem>
                    <SelectItem value="dataset_v2">dataset_v2.csv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>协变量文件</Label>
                <Select defaultValue={datasetCfg.allowCovariateFiles ? "cov_1" : "none"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不选择</SelectItem>
                    {datasetCfg.allowCovariateFiles && <SelectItem value="cov_1">covariate.csv</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <div>最多文件数：{datasetCfg.maxFiles ?? 1}</div>
              <div>需要公共字段：{String(datasetCfg.requireCommonFields ?? false)}</div>
              <div>需要主变量：{String(datasetCfg.needPrimaryDataset ?? true)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>模型选择</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {models.map((m: any) => (
              <div key={m.id} className="border rounded p-3">
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-gray-500">来源：{m.source} | 版本：{m.version}</div>
                <div className="mt-2 flex items-center space-x-2">
                  <Switch checked={!!m.default} />
                  <span className="text-xs text-gray-600">默认</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>参数表单</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {params.map((p: any) => {
              const value = paramValues[p.name] ?? p.default ?? "";
              switch (p.type) {
                case "number":
                  return (
                    <div key={p.name}>
                      <Label className="flex items-center space-x-1"><span>{p.label}</span>{p.required && <span className="text-red-500">*</span>}</Label>
                      <Input type="number" defaultValue={value} />
                    </div>
                  );
                case "string":
                  return (
                    <div key={p.name}>
                      <Label className="flex items-center space-x-1"><span>{p.label}</span>{p.required && <span className="text-red-500">*</span>}</Label>
                      <Input defaultValue={value} />
                    </div>
                  );
                case "boolean":
                  return (
                    <div key={p.name} className="flex items-center space-x-3">
                      <Switch defaultChecked={!!value} />
                      <Label>{p.label}</Label>
                    </div>
                  );
                case "datetime":
                  return (
                    <div key={p.name}>
                      <Label className="flex items-center space-x-1"><span>{p.label}</span>{p.required && <span className="text-red-500">*</span>}</Label>
                      <Input type="datetime-local" />
                    </div>
                  );
                case "enum":
                  return (
                    <div key={p.name}>
                      <Label className="flex items-center space-x-1"><span>{p.label}</span>{p.required && <span className="text-red-500">*</span>}</Label>
                      <Select defaultValue={String(value || (p.options?.[0] ?? ""))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(p.options || ["A", "B", "C"]).map((opt: string) => (
                            <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                default:
                  return (
                    <div key={p.name}>
                      <Label>{p.label}</Label>
                      <Input placeholder={`未支持类型：${p.type}`} />
                    </div>
                  );
              }
            })}

            <div className="pt-4 border-t">
              <Label>参数 JSON 导入（等价表单）</Label>
              <Textarea value={paramJsonText} onChange={(e) => setParamJsonText(e.target.value)} rows={6} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };


  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <div className="text-xl font-semibold">无权限访问</div>
              <div className="text-gray-600">仅管理员可访问“任务类型管理”功能</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ writingMode: 'horizontal-tb' }}>
      {/* 页面标题 */}
      <div className="lg:col-span-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">任务类型管理</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">用于定义和维护任务类型的 JSON 配置，支持模板导入、预览渲染、版本管理与禁用控制。仅支持 .json 文件。</p>
          </CardContent>
        </Card>
      </div>
      {/* 左侧：任务类型列表 */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2"><ListChecks className="h-5 w-5" /><span>任务类型列表</span></span>
            <Button size="sm" onClick={handleAddNew} className="flex items-center space-x-2"><Plus className="h-4 w-4" /><span>新增</span></Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[560px] pr-2">
            <div className="space-y-3">
              {items.map(it => (
                <div key={it.id} className={`p-3 border rounded ${selectedId === it.id ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-xs text-gray-500">{it.category} | v{it.version}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* onCheckedChange 显式声明参数类型，避免 TS 隐式 any 警告 */}
                      <Switch checked={it.enabled} onCheckedChange={(v: boolean) => handleToggleEnabled(it.id, !!v)} />
                      <span className="text-xs text-gray-600">{it.enabled ? '启用' : '禁用'}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedId(it.id)} className="flex items-center space-x-1"><Pencil className="h-4 w-4" /><span>编辑</span></Button>
                    <Button size="sm" variant="outline" onClick={handleExportJson} className="flex items-center space-x-1"><Download className="h-4 w-4" /><span>导出</span></Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 右侧：JSON 编辑 + 操作 */}
      <Card className="lg:col-span-9">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2"><FileJson className="h-5 w-5" /><span>JSON 编辑区</span></span>
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer" title="仅支持 .json 文件">
                <input type="file" accept="application/json" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportJsonFile(file);
                }} />
                <Button variant="outline" size="sm" className="flex items-center space-x-1"><Upload className="h-4 w-4" /><span>导入 JSON</span></Button>
              </label>
              <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)} className="flex items-center space-x-1"><Layers className="h-4 w-4" /><span>导入模板</span></Button>
              <Button variant="outline" size="sm" onClick={handleExportJson} className="flex items-center space-x-1"><Download className="h-4 w-4" /><span>导出JSON</span></Button>
              <Button size="sm" onClick={handlePreview} className="flex items-center space-x-1"><Eye className="h-4 w-4" /><span>预览渲染</span></Button>
              <Button size="sm" onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-1"><Save className="h-4 w-4" /><span>保存配置</span></Button>
              <Button variant="outline" size="sm" onClick={() => setRollbackOpen(true)} className="flex items-center space-x-1"><History className="h-4 w-4" /><span>回滚版本</span></Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={editorText} onChange={(e) => setEditorText(e.target.value)} rows={22} className="font-mono text-sm" />

          {validationErrors.length > 0 && (
            <div className="mt-4 p-3 border rounded bg-red-50 text-red-700 text-sm">
              <div className="font-medium mb-2">Schema 校验错误：</div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预览对话框（固定高度 + 可滚动）*/}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>预览渲染 - {items.find(it => it.id === selectedId)?.name}</DialogTitle>
          </DialogHeader>
          <Tabs value={previewTab} className="mt-2">
            <TabsList>
              <TabsTrigger value="create">任务创建预览</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="mt-4">
              <ScrollArea className="h-[calc(80vh-160px)] pr-2">
                {renderCreatePreview(JSON.parse(editorText))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 版本回滚对话框（固定高度 + 可滚动）*/}
      <Dialog open={rollbackOpen} onOpenChange={setRollbackOpen}>
        <DialogContent className="max-w-xl h-[60vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>版本回滚 - {items.find(it => it.id === selectedId)?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>选择历史版本</Label>
              <Select value={selectedRollbackVersion ? String(selectedRollbackVersion) : undefined} onValueChange={(v: string) => setSelectedRollbackVersion(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择版本" />
                </SelectTrigger>
                <SelectContent>
                  {(versions[selectedId] || []).map(v => (
                    <SelectItem key={v.version} value={String(v.version)}>
                      v{v.version} - {new Date(v.createdAt).toLocaleString()} - {v.author}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setRollbackOpen(false)}>取消</Button>
              <Button onClick={handleRollback} className="bg-orange-500 hover:bg-orange-600 text-white flex items-center space-x-1"><RefreshCcw className="h-4 w-4" /><span>确认回滚</span></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 模板选择对话框（固定高度 + 可滚动）*/}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-2xl h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>选择模板</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {taskTypeTemplates.map(tpl => (
              <Card key={tpl.id} className="border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{tpl.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-gray-500">类别：{tpl.category}</div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => { applyTemplate(tpl.id); setTemplateOpen(false); }}>应用</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}