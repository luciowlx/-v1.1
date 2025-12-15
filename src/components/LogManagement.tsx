import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { VirtualTable, Column } from "./ui/virtual-table";
import { 
  Filter,
  Search,
  Download,
  FileDown,
  Info,
  Shield,
  User,
  Server,
  Activity
} from "lucide-react";
import { toast } from "sonner";

type LogType = "operation" | "task" | "system";
type LogLevel = "INFO" | "WARN" | "ERROR";

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  module: string;
  action: string;
  result: "成功" | "失败";
  level: LogLevel;
  summary: string;
  context: Record<string, any>;
  type: LogType;
}

export function LogManagement() {
  const [activeType, setActiveType] = useState<LogType>("operation");
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState({
    start: "",
    end: "",
    user: "",
    module: "",
    action: "",
    keyword: "",
    level: "" as "" | LogLevel,
    logic: "AND" as "AND" | "OR",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailLog, setDetailLog] = useState<LogEntry | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sortState, setSortState] = useState<{ column?: string; order?: "asc" | "desc" }>({ column: "timestamp", order: "desc" });
  const [currentRole, setCurrentRole] = useState<string>("项目经理");

  useEffect(() => {
    const role = localStorage.getItem("currentUserRole");
    if (role) setCurrentRole(role);
  }, []);

  useEffect(() => {
    const users = ["alice", "bob", "carol", "dave", "erin"];
    const modules = ["数据管理", "任务管理", "模型管理", "系统设置", "项目管理"];
    const actions = ["上传数据集", "发布模型", "创建任务", "修改权限", "登录", "登出", "删除数据", "调整配置"];
    const levels: LogLevel[] = ["INFO", "WARN", "ERROR"];
    const types: LogType[] = ["operation", "task", "system"];
    const now = Date.now();
    const gen: LogEntry[] = Array.from({ length: 200 }, (_, i) => {
      const t = new Date(now - i * 36_000).toISOString().replace("T", " ").slice(0, 19);
      const type = types[i % types.length];
      const level = levels[i % levels.length];
      const user = users[i % users.length];
      const module = modules[i % modules.length];
      const action = actions[i % actions.length];
      const result = i % 7 === 0 && level !== "INFO" ? "失败" : "成功";
      return {
        id: `log-${i + 1}`,
        timestamp: t,
        user,
        module,
        action,
        result,
        level,
        summary: `${user}在${module}执行${action}，结果${result}`,
        context: {
          params: { a: Math.floor(Math.random() * 10), b: Math.random().toFixed(2) },
          meta: { ip: `192.168.0.${(i % 50) + 1}`, ua: "Chrome/120.0", location: "北京" },
          message: level === "ERROR" ? "NullPointer in task runner" : level === "WARN" ? "Latency above threshold" : "OK",
        },
        type,
      };
    });
    setAllLogs(gen);
  }, []);

  const users = useMemo(() => Array.from(new Set(allLogs.map(l => l.user))), [allLogs]);
  const modules = useMemo(() => Array.from(new Set(allLogs.map(l => l.module))), [allLogs]);
  const actions = useMemo(() => Array.from(new Set(allLogs.map(l => l.action))), [allLogs]);

  const filteredLogs = useMemo(() => {
    const byType = allLogs.filter(l => l.type === activeType);
    const terms: ((l: LogEntry) => boolean)[] = [];
    if (filters.start) terms.push(l => new Date(l.timestamp.replace(" ", "T")).getTime() >= new Date(filters.start).getTime());
    if (filters.end) terms.push(l => new Date(l.timestamp.replace(" ", "T")).getTime() <= new Date(filters.end).getTime());
    if (filters.user) terms.push(l => l.user === filters.user);
    if (filters.module) terms.push(l => l.module === filters.module);
    if (filters.action) terms.push(l => l.action === filters.action);
    if (filters.level) terms.push(l => l.level === filters.level);
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      terms.push(l => l.summary.toLowerCase().includes(kw) || JSON.stringify(l.context).toLowerCase().includes(kw));
    }
    const match = (l: LogEntry) => {
      if (terms.length === 0) return true;
      return filters.logic === "AND" ? terms.every(fn => fn(l)) : terms.some(fn => fn(l));
    };
    const base = byType.filter(match);
    if (sortState.column) {
      const col = sortState.column as keyof LogEntry;
      const ord = sortState.order === "asc" ? 1 : -1;
      base.sort((a, b) => String(a[col]).localeCompare(String(b[col])) * ord);
    }
    return base;
  }, [allLogs, activeType, filters, sortState]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page, pageSize]);

  const columns: Column<LogEntry>[] = [
    { key: "timestamp", label: "时间", sortable: true, width: 160 },
    { key: "user", label: "用户", width: 100 },
    { key: "module", label: "模块", width: 140 },
    { key: "action", label: "操作类型", width: 160 },
    { key: "level", label: "日志级别", width: 100, render: (v) => (
      <Badge variant={v === "ERROR" ? "destructive" : v === "WARN" ? "secondary" : "default"}>{v}</Badge>
    ) },
    { key: "summary", label: "摘要", width: 320 },
    { key: "actions", label: "操作", width: 120, render: (_, row) => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setDetailLog(row)}>查看</Button>
      </div>
    ) },
  ];

  const canExport = useMemo(() => ["超级管理员", "项目Owner"].includes(currentRole), [currentRole]);
  const maxExportRows = 1000;

  const exportLogs = async (format: "csv" | "xlsx") => {
    if (!canExport) {
      toast.error("无导出权限，仅管理员与项目Owner可导出");
      return;
    }
    const rows = filteredLogs;
    if (rows.length > maxExportRows) {
      toast.error(`导出行数超过限制（${maxExportRows}），请缩小筛选范围或分页导出`);
      return;
    }
    setExporting(true);
    try {
      const mapped = rows.map(r => ({
        时间: r.timestamp,
        用户: r.user,
        模块: r.module,
        操作类型: r.action,
        日志级别: r.level,
        摘要: r.summary,
        结果: r.result,
      }));
      const csv = [Object.keys(mapped[0] || { 时间: "", 用户: "", 模块: "", 操作类型: "", 日志级别: "", 摘要: "", 结果: "" }).join(","), ...mapped.map(m => Object.values(m).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs_${activeType}_${Date.now()}.${format === "csv" ? "csv" : "xlsx"}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("日志已导出");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">日志管理</h2>
        <p className="text-gray-600 mt-1">支持全链路日志的采集、检索与导出，默认展示最近数据并按时间倒序。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">快速筛选</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={filters.start ? "outline" : "default"}
              size="sm"
              onClick={() => {
                setFilters(prev => ({ ...prev, start: "", end: "" }));
                setPage(1);
              }}
            >不限时间</Button>
            <Button
              variant={filters.start ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const end = new Date();
                const start = new Date(Date.now() - 60 * 60 * 1000);
                const fmt = (d: Date) => `${d.toISOString().slice(0,16)}`;
                setFilters(prev => ({ ...prev, start: fmt(start), end: fmt(end) }));
                setPage(1);
              }}
            >最近1小时</Button>
            <Button
              variant={filters.start ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const end = new Date();
                const start = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const fmt = (d: Date) => `${d.toISOString().slice(0,16)}`;
                setFilters(prev => ({ ...prev, start: fmt(start), end: fmt(end) }));
                setPage(1);
              }}
            >最近24小时</Button>
            <Button
              variant={filters.start ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const end = new Date();
                const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const fmt = (d: Date) => `${d.toISOString().slice(0,16)}`;
                setFilters(prev => ({ ...prev, start: fmt(start), end: fmt(end) }));
                setPage(1);
              }}
            >最近7天</Button>
            <Button
              variant={filters.start ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const end = new Date();
                const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const fmt = (d: Date) => `${d.toISOString().slice(0,16)}`;
                setFilters(prev => ({ ...prev, start: fmt(start), end: fmt(end) }));
                setPage(1);
              }}
            >最近30天</Button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={!filters.level ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilters(prev => ({ ...prev, level: "" })); setPage(1); }}
            >全部级别</Button>
            <Button
              variant={filters.level === "ERROR" ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilters(prev => ({ ...prev, level: "ERROR" })); setPage(1); }}
            >仅ERROR</Button>
            <Button
              variant={filters.level === "WARN" ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilters(prev => ({ ...prev, level: "WARN" })); setPage(1); }}
            >仅WARN</Button>
            <Button
              variant={filters.level === "INFO" ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilters(prev => ({ ...prev, level: "INFO" })); setPage(1); }}
            >仅INFO</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeType} onValueChange={(v) => { setActiveType(v as LogType); setPage(1); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="operation">操作日志</TabsTrigger>
          <TabsTrigger value="task">任务运行日志</TabsTrigger>
          <TabsTrigger value="system">系统安全日志</TabsTrigger>
        </TabsList>
        <TabsContent value="operation" />
        <TabsContent value="task" />
        <TabsContent value="system" />
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />检索与筛选
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start">开始时间</Label>
              <Input id="start" type="datetime-local" value={filters.start} onChange={(e) => setFilters({ ...filters, start: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="end">结束时间</Label>
              <Input id="end" type="datetime-local" value={filters.end} onChange={(e) => setFilters({ ...filters, end: e.target.value })} />
            </div>
            <div>
              <Label>日志级别</Label>
              <Select value={filters.level || "ALL"} onValueChange={(v) => setFilters({ ...filters, level: v === "ALL" ? "" : (v as LogLevel) })}>
                <SelectTrigger><SelectValue placeholder="选择级别" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="WARN">WARN</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>用户</Label>
              <Select value={filters.user || "ALL"} onValueChange={(v) => setFilters({ ...filters, user: v === "ALL" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="选择用户" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部</SelectItem>
                  {users.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>模块</Label>
              <Select value={filters.module || "ALL"} onValueChange={(v) => setFilters({ ...filters, module: v === "ALL" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="选择模块" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部</SelectItem>
                  {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>操作类型</Label>
              <Select value={filters.action || "ALL"} onValueChange={(v) => setFilters({ ...filters, action: v === "ALL" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="选择操作" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部</SelectItem>
                  {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>关键字</Label>
              <div className="flex items-center gap-2">
                <Input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} placeholder="摘要或上下文关键字" />
                <ToggleGroup type="single" value={filters.logic} onValueChange={(v) => setFilters({ ...filters, logic: (v as "AND" | "OR") || "AND" })}>
                  <ToggleGroupItem value="AND">AND</ToggleGroupItem>
                  <ToggleGroupItem value="OR">OR</ToggleGroupItem>
                </ToggleGroup>
                <Button variant="outline" onClick={() => setPage(1)}>
                  <Search className="h-4 w-4 mr-2" />查询
                </Button>
                <Button variant="ghost" onClick={() => { setFilters({ start: "", end: "", user: "", module: "", action: "", keyword: "", level: "", logic: "AND" }); setPage(1); }}>重置</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">日志列表</CardTitle>
        </CardHeader>
        <CardContent>
          <VirtualTable<LogEntry>
            data={pagedData}
            columns={columns}
            height={420}
            density="comfortable"
            sortState={sortState}
            onSortChange={(c, o) => setSortState({ column: c, order: o })}
            freezeLeftCount={1}
            freezeRightCount={1}
            headerRight={
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">第{page}/{totalPages}页</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-[120px]"><SelectValue placeholder="每页" /></SelectTrigger>
                  <SelectContent>
                    {[10,20,50,100].map(n => <SelectItem key={n} value={String(n)}>{n}/页</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))}>上一页</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>下一页</Button>
                <Button variant={canExport ? "default" : "outline"} size="sm" disabled={!canExport || exporting} onClick={() => exportLogs("csv")}>导出CSV</Button>
                <Button variant={canExport ? "default" : "outline"} size="sm" disabled={!canExport || exporting} onClick={() => exportLogs("xlsx")}>导出Excel</Button>
              </div>
            }
          />
        </CardContent>
      </Card>

      <Dialog open={!!detailLog} onOpenChange={(o) => !o && setDetailLog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>日志详情</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {detailLog && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>时间：{detailLog.timestamp}</div>
                  <div>用户：{detailLog.user}</div>
                  <div>模块：{detailLog.module}</div>
                  <div>操作：{detailLog.action}</div>
                  <div>级别：{detailLog.level}</div>
                  <div>结果：{detailLog.result}</div>
                </div>
                <div className="rounded border p-3 bg-gray-50">
                  <pre className="text-xs overflow-auto max-h-72">{JSON.stringify(detailLog.context, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LogManagement;
