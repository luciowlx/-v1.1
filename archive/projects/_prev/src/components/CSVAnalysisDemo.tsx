import React, { useMemo, useState } from 'react';
import { Button, Divider, Space, Table, Upload, message } from 'antd';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  LineChart, Line,
  PieChart, Pie, Cell,
  ResponsiveContainer,
} from 'recharts';

type Row = Record<string, string | number | null>;

// 简易 CSV 行解析，支持逗号和双引号包裹字段
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { // 转义双引号
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result.map(s => s.trim());
}

function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return [];
  const headers = parseCSVRow(lines[0]);
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVRow(lines[i]);
    const row: Row = {};
    headers.forEach((h, idx) => {
      const raw = fields[idx] ?? '';
      const num = raw !== '' && !isNaN(Number(raw)) ? Number(raw) : raw || null;
      row[h] = num as any;
    });
    rows.push(row);
  }
  return rows;
}

function generateSample(): Row[] {
  const regions = ['华东', '华南', '华北', '西部'];
  const rows: Row[] = [];
  const start = dayjs().subtract(29, 'day');
  for (let d = 0; d < 30; d++) {
    const date = start.add(d, 'day').format('YYYY-MM-DD');
    regions.forEach((r, idx) => {
      const sales = Math.round(8000 + Math.random() * 12000 + d * 80 + idx * 500);
      const cost = Math.round(sales * (0.6 + Math.random() * 0.1));
      const profit = sales - cost;
      const orders = Math.round(40 + Math.random() * 120);
      rows.push({ 日期: date, 地区: r, 销售额: sales, 成本: cost, 利润: profit, 订单数: orders });
    });
  }
  return rows;
}

function mean(nums: number[]): number { return nums.reduce((a, b) => a + b, 0) / (nums.length || 1); }
function min(nums: number[]): number { return Math.min(...nums); }
function max(nums: number[]): number { return Math.max(...nums); }
function stddev(nums: number[]): number {
  const m = mean(nums);
  return Math.sqrt(mean(nums.map(n => (n - m) ** 2)));
}
function median(nums: number[]): number {
  const arr = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

function groupBy<T extends Row>(rows: T[], key: string): Record<string, T[]> {
  return rows.reduce((acc, cur) => {
    const k = String(cur[key] ?? '未知');
    (acc[k] ||= []).push(cur);
    return acc;
  }, {} as Record<string, T[]>);
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#8dd1e1', '#a4de6c'];

interface CSVAnalysisDemoProps {
  onClose?: () => void;
}

const CSVAnalysisDemo: React.FC<CSVAnalysisDemoProps> = ({ onClose }) => {
  const [rows, setRows] = useState<Row[]>(generateSample());

  // 在部分环境下 UploadProps 可能包含 capture 字段且与我们使用方式不匹配，这里显式移除该字段以避免类型报错
  const uploadProps: Omit<UploadProps, 'capture'> = {
    accept: '.csv',
    maxCount: 1,
    showUploadList: true,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result || '');
          const parsed = parseCSV(text);
          if (parsed.length === 0) {
            message.error('CSV 文件为空或解析失败');
            return;
          }
          setRows(parsed);
          message.success('CSV 上传解析成功（仅前端演示）');
        } catch (e) {
          console.error(e);
          message.error('解析 CSV 失败，请检查格式');
        }
      };
      reader.readAsText(file);
      return false; // 阻止实际上传
    }
  };

  // 字段检测
  const headers = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);
  const numericHeaders = useMemo(() => headers.filter(h => rows.some(r => typeof r[h] === 'number')), [headers, rows]);
  const hasDate = useMemo(() => headers.some(h => /日期|时间|date/i.test(h)), [headers]);
  const regionKey = useMemo(() => headers.find(h => /地区|区域|region/i.test(h)) || '', [headers]);

  // 汇总信息
  const summary = useMemo(() => {
    const info: Record<string, any> = {};
    numericHeaders.forEach(h => {
      const nums = rows.map(r => r[h]).filter(v => typeof v === 'number') as number[];
      if (nums.length) {
        info[h] = {
          count: nums.length,
          min: min(nums), max: max(nums), avg: Math.round(mean(nums)), median: Math.round(median(nums)), std: Math.round(stddev(nums))
        };
      }
    });
    return info;
  }, [rows, numericHeaders]);

  // 为图表准备数据
  const byRegion = useMemo(() => {
    if (!regionKey) return [] as { name: string, 销售额?: number, 利润?: number }[];
    const groups = groupBy(rows, regionKey);
    return Object.entries(groups).map(([name, items]) => {
      const sales = items.reduce((acc, cur) => acc + (typeof cur['销售额'] === 'number' ? (cur['销售额'] as number) : 0), 0);
      const profit = items.reduce((acc, cur) => acc + (typeof cur['利润'] === 'number' ? (cur['利润'] as number) : 0), 0);
      return { name, 销售额: sales, 利润: profit };
    });
  }, [rows, regionKey]);

  const byDate = useMemo(() => {
    const dateKey = headers.find(h => /日期|时间|date/i.test(h));
    if (!dateKey) return [] as { 日期: string, 销售额?: number }[];
    const groups = groupBy(rows, dateKey);
    const result = Object.entries(groups).map(([日期, items]) => {
      const sales = items.reduce((acc, cur) => acc + (typeof cur['销售额'] === 'number' ? (cur['销售额'] as number) : 0), 0);
      return { 日期, 销售额: sales };
    }).sort((a, b) => a.日期.localeCompare(b.日期));
    return result;
  }, [rows, headers]);

  const columns = useMemo(() => headers.map(h => ({ title: h, dataIndex: h, key: h })), [headers]);

  return (
    <div className="w-full max-w-[1000px] mx-auto">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>数据分析演示（CSV 上传解析，前端生成报告/表格/图表）</CardTitle>
        </CardHeader>
        <CardContent>
          <Space wrap>
            <Upload {...uploadProps}>
              <Button type="primary">上传 CSV（演示）</Button>
            </Upload>
            <Button onClick={() => setRows(generateSample())}>使用示例数据</Button>
            <Button onClick={() => setRows([])}>清空</Button>
            {onClose && <Button onClick={onClose}>隐藏演示</Button>}
          </Space>

          <Divider />
          <div>
            <h3 className="text-base font-semibold mb-2">分析报告（自动摘要）</h3>
            {numericHeaders.length ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 list-disc pl-5">
                {numericHeaders.map(h => (
                  <li key={h}>
                    {h}：样本 {summary[h]?.count || 0}，均值 {summary[h]?.avg ?? '-'}，中位数 {summary[h]?.median ?? '-'}，范围 {summary[h]?.min ?? '-'} ~ {summary[h]?.max ?? '-'}，标准差 {summary[h]?.std ?? '-'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">未检测到数值列，请上传包含数值的 CSV 或使用示例数据。</p>
            )}
          </div>

          <Divider />
          <h3 className="text-base font-semibold mb-2">数据表（前 20 行）</h3>
          <Table dataSource={rows.slice(0, 20).map((r, idx) => ({ ...r, key: idx }))} columns={columns} size="small" pagination={false} />

          <Divider />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>按地区统计（柱状图）</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={byRegion}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RTooltip />
                      <Bar dataKey="销售额" fill="#8884d8" />
                      <Bar dataKey="利润" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>每日销售趋势（折线图）</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <LineChart data={byDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="日期" />
                      <YAxis />
                      <RTooltip />
                      <Line type="monotone" dataKey="销售额" stroke="#ff7f50" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>地区占比（饼图）</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={byRegion} dataKey="销售额" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {byRegion.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVAnalysisDemo;