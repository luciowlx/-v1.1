import React, { useMemo, useState, useEffect } from "react";
import { Splitter, Modal, Form, Input, message, Tag, Button, Switch } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, LeftOutlined } from "@ant-design/icons";

type ComponentData = {
  componentName: string;
  label: string;
  paramId?: string;
  metricId?: string;
  vizId?: string;
  defaultValue?: number | boolean | string;
  isDefault?: boolean;
  description?: string;
  tooltip?: string;
  rules?: Array<{ type: string; value?: number; message?: string }>;
  width?: string;
  fullWidth?: boolean;
};

interface TaskTemplate {
  name: string;
  tag: '系统' | '自定义';
  desc: string;
  enabled: boolean;
  config?: Record<string, ComponentData>;
}

export default function HtmlConfigManagement() {
  const [form] = Form.useForm();
  const [page, setPage] = useState<"list" | "editor">("list");
  const [templateName, setTemplateName] = useState<string>("回归任务");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplate[]>([
    { name: "时序预测任务", tag: "系统", desc: "用于处理时间序列数据的预测，如销量预测、股价预测等。", enabled: true },
    { name: "分类任务", tag: "系统", desc: "用于处理离散值预测，如客户流失预警、垃圾邮件识别等。", enabled: true },
    { name: "回归任务", tag: "系统", desc: "用于处理连续值预测，如房价预测、产品定价等。", enabled: true },
    { name: "客户聚类", tag: "自定义", desc: "基于用户画像的 K-Means 聚类分析。", enabled: false }
  ]);
  const [leftTab, setLeftTab] = useState<"materials" | "outline" | "schema">("materials");
  const [materialSubTab, setMaterialSubTab] = useState<"input" | "output">("input");
  const [propsTab, setPropsTab] = useState<"properties" | "styles" | "advanced">("properties");
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, ComponentData>[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ open: boolean; message: string } | null>(null);
  const [publishedSnapshot, setPublishedSnapshot] = useState<Record<string, ComponentData> | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<Record<string, ComponentData> | null>(null);

  const vizLibrary = useMemo(
    () => [
      { label: "折线图/预测图", value: "forecast_plot" },
      { label: "预测vs真实散点", value: "pred_vs_true_scatter" },
      { label: "残差图", value: "residual_plot" },
      { label: "误差直方图", value: "error_histogram" },
      { label: "ROC 曲线", value: "roc_curve" },
      { label: "PR 曲线", value: "pr_curve" },
      { label: "混淆矩阵", value: "confusion_matrix" }
    ],
    []
  );

  const [dataStore, setDataStore] = useState<Record<string, ComponentData>>({
    train_split_ratio: {
      componentName: "NumberSetter",
      label: "训练集比例(%)",
      paramId: "train_split_ratio",
      defaultValue: 80,
      tooltip: "训练数据占总数据的百分比。",
      rules: [
        { type: "required", message: "此项必填" },
        { type: "min", value: 1 },
        { type: "max", value: 99 }
      ]
    },
    shuffle: {
      componentName: "BoolSetter",
      label: "洗牌(Shuffle)",
      paramId: "shuffle",
      defaultValue: false,
      tooltip: "是否在训练前打乱数据顺序。"
    },
    metric_mse: {
      componentName: "MetricSetter",
      label: "MSE",
      metricId: "mse",
      isDefault: true,
      description: "均方误差，越小越好。"
    },
    viz_residual_plot: {
      componentName: "VizSetter",
      label: "残差图",
      vizId: "residual_plot",
      isDefault: true,
      description: "检查模型误差是否随机分布。"
    }
  });

  useEffect(() => {
    setBaseline({ ...dataStore });
    setHistory([{ ...dataStore }]);
    setHistoryIndex(0);
  }, []);

  const css = `
  :root{--color-primary:#007bff;--color-primary-light:#e6f3ff;--color-border:#dcdfe6;--color-bg:#f4f7fa;--color-text:#333;--color-text-secondary:#666;--color-text-light:#909399;--header-height:50px;--left-panel-width:260px;--right-panel-width:320px}
  .btn{font-size:14px;padding:6px 14px;border:1px solid var(--color-border);border-radius:4px;background:#fff;cursor:pointer}
  .btn:hover{border-color:var(--color-primary);color:var(--color-primary)}
  .btn-primary{background:var(--color-primary);color:#fff;border-color:var(--color-primary)}
  .editor-header{display:flex;justify-content:space-between;align-items:center;padding:0 16px;background:#fff;border-bottom:1px solid var(--color-border);height:var(--header-height)}
  .header-group{display:flex;align-items:center;gap:12px}
  .header-title{font-size:16px;font-weight:600}
  .editor-main{display:block;height:calc(100vh - var(--header-height) - 140px)}
  .editor-left-panel{background:#fff;border-right:1px solid var(--color-border);display:flex;flex-direction:column}
  .panel-tabs{display:flex;border-bottom:1px solid var(--color-border)}
  .tab-button{flex:1;padding:10px 0;text-align:center;color:var(--color-text-secondary);cursor:pointer;border-bottom:2px solid transparent}
  .tab-button.active{color:var(--color-primary);border-bottom-color:var(--color-primary);font-weight:500}
  .panel-content-wrapper{overflow-y:auto;flex:1}
  .panel-content{padding:12px}
  .material-sub-tabs{display:flex;gap:8px;margin-bottom:12px}
  .sub-tab{padding:4px 10px;border:1px solid var(--color-border);border-radius:4px;cursor:pointer}
  .sub-tab.active{background:var(--color-primary-light);border-color:var(--color-primary);color:var(--color-primary)}
  .material-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .material-item{padding:10px 8px;border:1px solid var(--color-border);border-radius:4px;text-align:center;background:#fcfcfc}
  .editor-canvas-area{background:var(--color-bg);padding:24px;overflow-y:auto}
  .canvas-slot{background:#fff;border:1px dashed var(--color-border);border-radius:6px;padding:16px;min-height:200px}
  .slot-title{font-size:15px;font-weight:600;color:var(--color-text-secondary);margin:0 0 16px 0;padding-bottom:8px;border-bottom:1px solid #f0f2f5}
  .canvas-item{padding:12px;border:1px solid #f0f2f5;border-radius:4px;margin-bottom:10px;background:#fcfcfc;cursor:pointer}
  .canvas-item.selected{border-color:var(--color-primary)!important;background:var(--color-primary-light);box-shadow:0 0 0 2px var(--color-primary-light)}
  .editor-right-panel{background:#fff;border-left:1px solid var(--color-border);display:flex;flex-direction:column}
  .props-panel-header{padding:12px 16px;border-bottom:1px solid var(--color-border)}
  .props-panel-content-wrapper{overflow-y:auto;flex:1}
  .props-panel-placeholder{text-align:center;color:var(--color-text-light);margin-top:40px}
  .form-group{margin-bottom:14px}
  .form-group label{display:block;font-size:13px;font-weight:500;margin-bottom:6px}
  .form-group input,.form-group textarea,.form-group select{width:100%;padding:8px 10px;font-size:13px;border:1px solid var(--color-border);border-radius:4px}
  .form-group-checkbox{display:flex;align-items:center}
  .form-group-checkbox input{margin-right:8px}
  `;

  const extraCss = `
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;z-index:50}
  .modal-content{background:#fff;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.15);width:720px;max-width:90vw;max-height:80vh;overflow:auto;padding:20px}
  .toast{position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#1f2937;color:#fff;padding:10px 16px;border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,0.2);z-index:60}
  .canvas-mockup-card{background:#f5faff;border:1px solid #d0e6ff;border-radius:8px;padding:20px;max-width:800px;margin:0 auto}
  .mock-section-title{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:600;color:#0d69d5;margin:0 0 16px 0;padding-bottom:10px;border-bottom:1px solid #d0e6ff}
  .mock-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px;margin-bottom:16px}
  .mock-field{padding:4px}
  .mock-field label{display:block;margin-bottom:8px;font-weight:500;font-size:14px;color:#303133}
  .mock-field label .required{color:#f56c6c;margin-left:2px}
  .mock-field label .tooltip{color:#909399;font-weight:400;font-size:13px}
  .mock-input-display{background:#fff;border:1px solid #d0e6ff;border-radius:4px;padding:10px 12px;color:#606266;font-size:14px}
  .mock-checkbox-display{background:transparent;font-size:14px;color:#606266;display:flex;align-items:center;gap:8px;padding:10px 4px}
  .mock-output-group-title{font-weight:600;color:#303133;font-size:15px;margin-top:24px;margin-bottom:12px}
  .mock-metrics-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .mock-metric-item{display:flex;align-items:center;gap:8px;padding:8px 4px;font-size:14px}
  .mock-code-display{background:#fff;border:1px solid #d0e6ff;border-radius:4px;padding:10px 12px;color:#c0c4cc;font-family:Courier,monospace;font-size:13px}
  `;

  const initialTemplates: Record<string, Record<string, ComponentData>> = {
    forecasting: {
      ts_time_column: { componentName: "FieldSelector", label: "时间列", description: "选择时间字段" },
      ts_target_column: { componentName: "FieldSelector", label: "预测目标列" },
      ts_context_len: { componentName: "NumberSetter", label: "上下文长度", defaultValue: 30 },
      ts_forecast_horizon: { componentName: "NumberSetter", label: "预测长度", defaultValue: 7 },
      ts_step_size: { componentName: "NumberSetter", label: "预测步长", defaultValue: 1 },
      ts_start_time: { componentName: "TextSetter", label: "预测开始时间" },
      ts_primary_file: { componentName: "SelectSetter", label: "主变量文件" },
      ts_covariate_files: { componentName: "MultiSelectSetter", label: "协变量文件" },
      metric_mse: { componentName: "MetricSetter", label: "MSE", metricId: "mse", isDefault: true },
      metric_rmse: { componentName: "MetricSetter", label: "RMSE", metricId: "rmse", isDefault: true },
      metric_mae: { componentName: "MetricSetter", label: "MAE", metricId: "mae", isDefault: true },
      metric_mape: { componentName: "MetricSetter", label: "MAPE", metricId: "mape", isDefault: true },
      metric_r2: { componentName: "MetricSetter", label: "R²", metricId: "r2", isDefault: true },
      bias_relative: { componentName: "NumberSetter", label: "正负相对偏差(%)", defaultValue: 10 },
      bias_absolute: { componentName: "NumberSetter", label: "正负绝对偏差", defaultValue: 10 },
      viz_forecast: { componentName: "VizSetter", label: "折线图/预测图", vizId: "forecast_plot", isDefault: true },
      viz_residual: { componentName: "VizSetter", label: "残差图", vizId: "residual_plot", isDefault: true },
      viz_scatter: { componentName: "VizSetter", label: "预测值vs真实值散点", vizId: "pred_vs_true_scatter", isDefault: true },
      viz_hist: { componentName: "VizSetter", label: "误差分布直方图", vizId: "error_histogram", isDefault: true }
    },
    classification: {
      class_train_ratio: { componentName: "NumberSetter", label: "训练集比例(%)", defaultValue: 80 },
      class_test_ratio: { componentName: "NumberSetter", label: "测试集比例(%)", defaultValue: 20 },
      class_shuffle: { componentName: "BoolSetter", label: "数据洗牌", defaultValue: false },
      metric_accuracy: { componentName: "MetricSetter", label: "Accuracy", metricId: "accuracy", isDefault: true },
      metric_precision: { componentName: "MetricSetter", label: "Precision", metricId: "precision", isDefault: true },
      metric_recall: { componentName: "MetricSetter", label: "Recall", metricId: "recall", isDefault: true },
      metric_f1: { componentName: "MetricSetter", label: "F1", metricId: "f1", isDefault: true },
      metric_roc_auc: { componentName: "MetricSetter", label: "ROC-AUC", metricId: "roc_auc", isDefault: true },
      averaging_method: { componentName: "SelectSetter", label: "平均方式", description: "binary/macro/micro/samples/weighted" },
      viz_roc: { componentName: "VizSetter", label: "ROC 曲线", vizId: "roc_curve", isDefault: true },
      viz_pr: { componentName: "VizSetter", label: "PR 曲线", vizId: "pr_curve", isDefault: true },
      viz_cm: { componentName: "VizSetter", label: "混淆矩阵", vizId: "confusion_matrix", isDefault: true }
    },
    regression: {
      reg_train_ratio: { componentName: "NumberSetter", label: "训练集比例(%)", defaultValue: 80 },
      reg_test_ratio: { componentName: "NumberSetter", label: "测试集比例(%)", defaultValue: 20 },
      reg_shuffle: { componentName: "BoolSetter", label: "数据洗牌", defaultValue: false },
      metric_mse: { componentName: "MetricSetter", label: "MSE", metricId: "mse", isDefault: true },
      metric_rmse: { componentName: "MetricSetter", label: "RMSE", metricId: "rmse", isDefault: true },
      metric_mae: { componentName: "MetricSetter", label: "MAE", metricId: "mae", isDefault: true },
      metric_mape: { componentName: "MetricSetter", label: "MAPE", metricId: "mape", isDefault: true },
      metric_r2: { componentName: "MetricSetter", label: "R²", metricId: "r2", isDefault: true },
      bias_relative: { componentName: "NumberSetter", label: "正负相对偏差(%)", defaultValue: 10 },
      bias_absolute: { componentName: "NumberSetter", label: "正负绝对偏差", defaultValue: 10 },
      viz_residual: { componentName: "VizSetter", label: "残差图", vizId: "residual_plot", isDefault: true },
      viz_scatter: { componentName: "VizSetter", label: "预测值vs真实值散点", vizId: "pred_vs_true_scatter", isDefault: true },
      viz_hist: { componentName: "VizSetter", label: "误差分布直方图", vizId: "error_histogram", isDefault: true }
    }
  };

  const applyInitialTemplate = (name: string) => {
    const key = name.includes("时序") ? "forecasting" : name.includes("分类") ? "classification" : name.includes("回归") ? "regression" : "forecasting";
    const tpl = initialTemplates[key] || initialTemplates.regression;
    setDataStore({ ...tpl });
    setBaseline({ ...tpl });
    setHistory([{ ...tpl }]);
    setHistoryIndex(0);
    setSelectedComponentId(null);
    setPropsTab("properties");
  };

  /**
   * 处理新增模板提交
   * @param values 表单各项值
   */
  const handleAddTemplate = (values: any) => {
    const hide = message.loading('正在创建模板...', 0);
    setTimeout(() => {
      const newTemplate: TaskTemplate = {
        name: values.name,
        tag: '自定义',
        desc: values.desc || '暂无描述',
        enabled: true,
        config: { ...initialTemplates.regression } // 默认初始化为回归模板配置
      };
      setTemplates([...templates, newTemplate]);
      hide();
      message.success('模板创建成功');
      setIsAddModalOpen(false);
      form.resetFields();
    }, 800);
  };

  const renderListPage = () => (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm p-8" style={{ marginTop: 24 }}>
      <div className="flex items-center justify-between border-b pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">任务模板管理</h1>
          <p className="text-gray-500 mt-1">管理并配置不同业务场景下的算法任务模板</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => { setIsAddModalOpen(true); }}
        >
          新增任务模板
        </Button>
      </div>

      <div className="space-y-4">
        {templates.map((it: TaskTemplate) => (
          <div key={it.name} className="flex items-center p-6 border rounded-xl hover:shadow-md transition-shadow bg-white group">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-gray-800">{it.name}</span>
                <Tag color={it.tag === "系统" ? "blue" : "purple"}>
                  {it.tag}
                </Tag>
              </div>
              <div className="text-gray-500 text-sm mt-2 leading-relaxed">{it.desc}</div>
            </div>

            <div className="flex items-center gap-8 mr-12 text-sm text-gray-500">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">应用状态</span>
                <Switch
                  checked={it.enabled}
                  onChange={(checked) => {
                    Modal.confirm({
                      title: `确认${checked ? '启用' : '禁用'}模板？`,
                      content: (
                        <div>
                          <p>是否确认 {checked ? '启用' : '禁用'} 任务模板 <strong>[{it.name}]</strong>？</p>
                          <p style={{ color: '#ff4d4f', marginTop: 8 }}>⚠️ 注意：该操作将直接影响“任务管理”中的任务创建流程。</p>
                        </div>
                      ),
                      okText: '确认',
                      cancelText: '取消',
                      onOk: () => {
                        setTemplates((prev: TaskTemplate[]) =>
                          prev.map((tpl: TaskTemplate) =>
                            tpl.name === it.name ? { ...tpl, enabled: checked } : tpl
                          )
                        );
                        message.success(`模板 [${it.name}] 已${checked ? '启用' : '禁用'}`);
                      }
                    });
                  }}
                />
              </div>
            </div>
            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="primary"
                ghost
                icon={<EditOutlined />}
                onClick={() => {
                  setTemplateName(it.name);
                  if (it.config) {
                    setDataStore({ ...it.config });
                    setBaseline({ ...it.config });
                    setHistory([{ ...it.config }]);
                    setHistoryIndex(0);
                  } else {
                    applyInitialTemplate(it.name);
                  }
                  setPage("editor");
                }}
              >
                配置
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: '确认删除',
                    content: `是否确认删除模板 [${it.name}]？`,
                    okText: '确认',
                    cancelText: '取消',
                    onOk: () => {
                      setTemplates((prev: TaskTemplate[]) => prev.filter((t: TaskTemplate) => t.name !== it.name));
                      message.success('删除成功');
                    }
                  });
                }}
              >
                删除
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        title="新增任务模板"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onOk={() => form.submit()}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddTemplate}
          initialValues={{ name: '', desc: '' }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }, { max: 30, message: '名称最多30个字符' }]}
          >
            <Input placeholder="输入任务模板名称，例如：个性化推荐任务" maxLength={30} />
          </Form.Item>
          <Form.Item
            name="desc"
            label="模板描述"
            rules={[{ required: true, message: '请输入模板描述' }]}
          >
            <Input.TextArea placeholder="简要描述该模板的用途和适用场景" rows={4} maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

  const renderPropsForm = (data: ComponentData) => (
    <div className="panel-content">
      <div className="form-group"><label>标签 (Label)</label><input type="text" value={data.label} onChange={(e) => updateData({ label: e.target.value })} /></div>
      {data.paramId && <div className="form-group"><label>参数ID (paramId)</label><input type="text" value={data.paramId} disabled /></div>}
      {data.metricId && <div className="form-group"><label>指标ID (metricId)</label><input type="text" value={data.metricId} disabled /></div>}
      {data.vizId !== undefined && (
        <div className="form-group">
          <label>图表类型 (vizId)</label>
          <select value={data.vizId} onChange={(e) => updateData({ vizId: e.target.value })}>
            {vizLibrary.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      )}
      {data.defaultValue !== undefined && (
        typeof data.defaultValue === "boolean" ? (
          <div className="form-group-checkbox"><input type="checkbox" checked={data.defaultValue as boolean} onChange={(e) => updateData({ defaultValue: e.target.checked })} /><label>默认值</label></div>
        ) : (
          <div className="form-group"><label>默认值</label><input type="text" value={String(data.defaultValue)} onChange={(e) => updateData({ defaultValue: e.target.value })} /></div>
        )
      )}
      {data.isDefault !== undefined && (
        <div className="form-group-checkbox"><input type="checkbox" checked={!!data.isDefault} onChange={(e) => updateData({ isDefault: e.target.checked })} /><label>默认启用</label></div>
      )}
      {data.description !== undefined && (
        <div className="form-group"><label>描述 (Description)</label><textarea rows={3} value={data.description || ""} onChange={(e) => updateData({ description: e.target.value })} /></div>
      )}
      {data.tooltip !== undefined && (
        <div className="form-group"><label>提示信息</label><textarea rows={3} value={data.tooltip || ""} onChange={(e) => updateData({ tooltip: e.target.value })} /></div>
      )}
    </div>
  );

  const updateData = (partial: Partial<ComponentData>) => {
    if (!selectedComponentId) return;
    setDataStore(prev => {
      const next = {
        ...prev,
        [selectedComponentId]: { ...prev[selectedComponentId], ...partial }
      };
      setHistory((h: Record<string, ComponentData>[]) => [...h.slice(0, historyIndex + 1), { ...next }]);
      setHistoryIndex((i: number) => i + 1);
      return next;
    });
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    setHistoryIndex(idx);
    setDataStore({ ...history[idx] });
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    setHistoryIndex(idx);
    setDataStore({ ...history[idx] });
  };

  const handleSaveDraft = () => {
    setDraftSavedAt(new Date().toISOString());
    setToast({ open: true, message: "暂存成功（不对现有任务生效）" });
    setTimeout(() => setToast(null), 2000);
  };

  const handleRestoreDefault = () => {
    const ok = window.confirm("确认恢复默认？");
    if (!ok || !baseline) return;
    setDataStore({ ...baseline });
    setHistory((h: Record<string, ComponentData>[]) => [...h.slice(0, historyIndex + 1), { ...baseline }]);
    setHistoryIndex((i: number) => i + 1);
  };

  const handlePublish = () => {
    const ok = window.confirm("是否发布？发布后对新建任务生效，不影响历史任务");
    if (!ok) return;
    setPublishedSnapshot({ ...dataStore });
    setToast({ open: true, message: "已保存并发布，新建任务生效" });
    setTimeout(() => setToast(null), 2200);
  };

  const selectedData = selectedComponentId ? dataStore[selectedComponentId] : null;

  const renderEditorPage = () => (
    <div>
      <style>{css}</style>
      <style>{extraCss}</style>
      <header className="editor-header">
        <div className="header-group">
          <Button icon={<LeftOutlined />} onClick={() => setPage("list")}>返回列表</Button>
          <span className="header-title" style={{ marginLeft: 12 }}>{templateName}</span>
        </div>
        <div className="header-group">
          <button className="btn" onClick={handleSaveDraft}>暂存</button>
          <button className="btn" onClick={handleUndo} disabled={historyIndex <= 0}>上一步</button>
          <button className="btn" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>下一步</button>
          <button className="btn" onClick={() => setIsPreviewOpen(true)}>预览</button>
          <button className="btn" onClick={handleRestoreDefault}>恢复默认</button>
          <button className="btn btn-primary" onClick={handlePublish}>保存并发布</button>
        </div>
      </header>
      {toast && toast.open && (
        <div className="toast">{toast.message}</div>
      )}
      <main className="editor-main">
        <Splitter style={{ height: '100%' }}>
          <Splitter.Panel defaultSize="26%" min="18%" max="40%">
            <aside className="editor-left-panel">
              <nav className="panel-tabs">
                <div className={`tab-button ${leftTab === 'materials' ? 'active' : ''}`} onClick={() => setLeftTab('materials')}>物料</div>
                <div className={`tab-button ${leftTab === 'outline' ? 'active' : ''}`} onClick={() => setLeftTab('outline')}>大纲</div>
                <div className={`tab-button ${leftTab === 'schema' ? 'active' : ''}`} onClick={() => setLeftTab('schema')}>源码</div>
              </nav>
              <div className="panel-content-wrapper">
                {leftTab === 'materials' && (
                  <div className="panel-content">
                    <nav className="material-sub-tabs">
                      <div className={`sub-tab ${materialSubTab === 'input' ? 'active' : ''}`} onClick={() => setMaterialSubTab('input')}>输入配置</div>
                      <div className={`sub-tab ${materialSubTab === 'output' ? 'active' : ''}`} onClick={() => setMaterialSubTab('output')}>输出配置</div>
                    </nav>
                    {materialSubTab === 'input' ? (
                      <div className="material-grid">
                        <div className="material-item">🔢 数字输入</div>
                        <div className="material-item">✅ 布尔设置</div>
                        <div className="material-item">🔽 下拉选择</div>
                        <div className="material-item">📝 多行文本</div>
                        <div className="material-item">📋 字段选择器</div>
                      </div>
                    ) : (
                      <div className="material-grid">
                        <div className="material-item">📈 指标配置器</div>
                        <div className="material-item">📊 图表配置器</div>
                      </div>
                    )}
                  </div>
                )}
                {leftTab === 'outline' && (
                  <div className="panel-content">
                    <pre className="outline-tree">{`Page\n  ├─ InputSlot\n  │   ├─ NumberSetter (train_split_ratio)\n  │   └─ BoolSetter (shuffle)\n  └─ OutputSlot\n      ├─ MetricSetter (mse)\n      └─ VizSetter (residual_plot)`}</pre>
                  </div>
                )}
                {leftTab === 'schema' && (
                  <div className="panel-content">
                    <pre className="schema-editor">{`{\n  "templateId": "task_regression_v1",\n  "templateName": "回归任务",\n  "page": {\n    "componentName": "Page"\n  }\n}`}</pre>
                  </div>
                )}
              </div>
            </aside>
          </Splitter.Panel>
          <Splitter.Panel>
            <section className="editor-canvas-area">
              {(() => {
                const isForecasting = !!dataStore.ts_time_column;
                const isClassification = !!dataStore.class_train_ratio;
                const isRegression = !!dataStore.reg_train_ratio;
                if (!isForecasting && !isClassification && !isRegression) {
                  return (
                    <div className="canvas-mockup-card">
                      <h2 className="mock-section-title">⚙️ 输入配置</h2>
                      <p style={{ textAlign: 'center', color: '#909399', margin: '40px 0' }}>从左侧“物料”面板拖拽“输入组件”到这里</p>
                      <h2 className="mock-section-title" style={{ marginTop: 30 }}>📊 输出配置</h2>
                      <p style={{ textAlign: 'center', color: '#909399', margin: '40px 0' }}>从左侧“物料”面板拖拽“输出组件”到这里</p>
                    </div>
                  );
                }
                if (isForecasting) {
                  return (
                    <div className="canvas-mockup-card">
                      <h2 className="mock-section-title">⚙️ 输入配置</h2>
                      <div className="mock-form-grid">
                        {dataStore.ts_time_column && (
                          <div className={`mock-field canvas-item ${selectedComponentId === 'ts_time_column' ? 'selected' : ''}`} data-component-id="ts_time_column" onClick={() => { setSelectedComponentId('ts_time_column'); setPropsTab('properties'); }}>
                            <label>时间列 <span className="required">*</span> <span className="tooltip">(请先在第2步...)</span></label>
                            <div className="mock-input-display">{dataStore.ts_time_column.label || '选择时间列'}</div>
                          </div>
                        )}
                        {dataStore.ts_target_column && (
                          <div className={`mock-field canvas-item ${selectedComponentId === 'ts_target_column' ? 'selected' : ''}`} data-component-id="ts_target_column" onClick={() => { setSelectedComponentId('ts_target_column'); setPropsTab('properties'); }}>
                            <label>预测目标列 <span className="required">*</span> <span className="tooltip">(请先在第2步...)</span></label>
                            <div className="mock-input-display">{dataStore.ts_target_column.label || '选择预测目标列'}</div>
                          </div>
                        )}
                        {dataStore.ts_context_len && (
                          <div className={`mock-field canvas-item ${selectedComponentId === 'ts_context_len' ? 'selected' : ''}`} data-component-id="ts_context_len" onClick={() => { setSelectedComponentId('ts_context_len'); setPropsTab('properties'); }}>
                            <label>上下文长度 <span className="required">*</span></label>
                            <div className="mock-input-display">{String(dataStore.ts_context_len.defaultValue ?? '')}</div>
                          </div>
                        )}
                        {dataStore.ts_forecast_horizon && (
                          <div className={`mock-field canvas-item ${selectedComponentId === 'ts_forecast_horizon' ? 'selected' : ''}`} data-component-id="ts_forecast_horizon" onClick={() => { setSelectedComponentId('ts_forecast_horizon'); setPropsTab('properties'); }}>
                            <label>预测长度 <span className="required">*</span></label>
                            <div className="mock-input-display">{String(dataStore.ts_forecast_horizon.defaultValue ?? '')}</div>
                          </div>
                        )}
                        {dataStore.ts_step_size && (
                          <div className={`mock-field canvas-item ${selectedComponentId === 'ts_step_size' ? 'selected' : ''}`} data-component-id="ts_step_size" onClick={() => { setSelectedComponentId('ts_step_size'); setPropsTab('properties'); }}>
                            <label>预测步长 <span className="required">*</span></label>
                            <div className="mock-input-display">{String(dataStore.ts_step_size.defaultValue ?? '')}</div>
                          </div>
                        )}
                        {dataStore.ts_start_time && (
                          <div className={`mock-field canvas-item ${selectedComponentId === 'ts_start_time' ? 'selected' : ''}`} data-component-id="ts_start_time" onClick={() => { setSelectedComponentId('ts_start_time'); setPropsTab('properties'); }}>
                            <label>预测开始时间 <span className="tooltip">(可选)</span></label>
                            <div className="mock-input-display">{String(dataStore.ts_start_time.defaultValue ?? '') || '选择开始时间'}</div>
                          </div>
                        )}
                        {dataStore.ts_primary_file && (
                          <div className={`mock-field canvas-item ${selectedComponentId === 'ts_primary_file' ? 'selected' : ''}`} data-component-id="ts_primary_file" onClick={() => { setSelectedComponentId('ts_primary_file'); setPropsTab('properties'); }}>
                            <label>主变量文件 <span className="tooltip">(可选, 互斥)</span></label>
                            <div className="mock-input-display">{dataStore.ts_primary_file.label || '选择主变量文件'}</div>
                          </div>
                        )}
                        {dataStore.ts_covariate_files && (
                          <div className={`mock-field canvas-item ${selectedComponentId === 'ts_covariate_files' ? 'selected' : ''}`} data-component-id="ts_covariate_files" onClick={() => { setSelectedComponentId('ts_covariate_files'); setPropsTab('properties'); }}>
                            <label>协变量文件 <span className="tooltip">(可选, 互斥)</span></label>
                            <div className="mock-input-display">{dataStore.ts_covariate_files.label || '选择协变量文件'}</div>
                          </div>
                        )}
                      </div>
                      <h2 className="mock-section-title" style={{ marginTop: 30 }}>📊 输出配置</h2>
                      <h3 className="mock-output-group-title">评估指标</h3>
                      <div className="mock-metrics-grid">
                        {dataStore.metric_mse && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_mse' ? 'selected' : ''}`} data-component-id="metric_mse" onClick={() => { setSelectedComponentId('metric_mse'); setPropsTab('properties'); }}><label>MSE</label></div>)}
                        {dataStore.metric_rmse && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_rmse' ? 'selected' : ''}`} data-component-id="metric_rmse" onClick={() => { setSelectedComponentId('metric_rmse'); setPropsTab('properties'); }}><label>RMSE</label></div>)}
                        {dataStore.metric_mae && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_mae' ? 'selected' : ''}`} data-component-id="metric_mae" onClick={() => { setSelectedComponentId('metric_mae'); setPropsTab('properties'); }}><label>MAE</label></div>)}
                        {dataStore.metric_mape && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_mape' ? 'selected' : ''}`} data-component-id="metric_mape" onClick={() => { setSelectedComponentId('metric_mape'); setPropsTab('properties'); }}><label>MAPE</label></div>)}
                        {dataStore.metric_r2 && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_r2' ? 'selected' : ''}`} data-component-id="metric_r2" onClick={() => { setSelectedComponentId('metric_r2'); setPropsTab('properties'); }}><label>R²</label></div>)}
                      </div>
                      <div className="mock-form-grid" style={{ marginTop: 16 }}>
                        {dataStore.bias_relative && (
                          <div className={`mock-field canvas-item ${selectedComponentId === 'bias_relative' ? 'selected' : ''}`} data-component-id="bias_relative" onClick={() => { setSelectedComponentId('bias_relative'); setPropsTab('properties'); }}>
                            <label>相对偏差阈值(±%)</label>
                            <div className="mock-input-display">{String(dataStore.bias_relative.defaultValue ?? '')}</div>
                          </div>
                        )}
                        {dataStore.bias_absolute && (
                          <div className={`mock-field canvas-item ${selectedComponentId === 'bias_absolute' ? 'selected' : ''}`} data-component-id="bias_absolute" onClick={() => { setSelectedComponentId('bias_absolute'); setPropsTab('properties'); }}>
                            <label>绝对偏差阈值(±)</label>
                            <div className="mock-input-display">{String(dataStore.bias_absolute.defaultValue ?? '')}</div>
                          </div>
                        )}
                      </div>
                      <h3 className="mock-output-group-title">可视化</h3>
                      <div className="mock-metrics-grid">
                        {dataStore.viz_forecast && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'viz_forecast' ? 'selected' : ''}`} data-component-id="viz_forecast" onClick={() => { setSelectedComponentId('viz_forecast'); setPropsTab('properties'); }}><label>折线图</label></div>)}
                        {dataStore.viz_residual && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'viz_residual' ? 'selected' : ''}`} data-component-id="viz_residual" onClick={() => { setSelectedComponentId('viz_residual'); setPropsTab('properties'); }}><label>残差图</label></div>)}
                        {dataStore.viz_scatter && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'viz_scatter' ? 'selected' : ''}`} data-component-id="viz_scatter" onClick={() => { setSelectedComponentId('viz_scatter'); setPropsTab('properties'); }}><label>预测vs真实散点</label></div>)}
                        {dataStore.viz_hist && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'viz_hist' ? 'selected' : ''}`} data-component-id="viz_hist" onClick={() => { setSelectedComponentId('viz_hist'); setPropsTab('properties'); }}><label>误差直方图</label></div>)}
                      </div>
                    </div>
                  );
                }
                if (isClassification) {
                  return (
                    <div className="canvas-mockup-card">
                      <h2 className="mock-section-title">⚙️ 输入配置</h2>
                      <div className="mock-form-grid">
                        {dataStore.class_train_ratio && (
                          <div className={`mock-field canvas-item ${selectedComponentId === 'class_train_ratio' ? 'selected' : ''}`} data-component-id="class_train_ratio" onClick={() => { setSelectedComponentId('class_train_ratio'); setPropsTab('properties'); }}>
                            <label>训练集比例(%)</label>
                            <div className="mock-input-display">{String(dataStore.class_train_ratio.defaultValue ?? '')}</div>
                          </div>
                        )}
                        {dataStore.class_test_ratio && (
                          <div className={`mock-field canvas-item ${selectedComponentId === 'class_test_ratio' ? 'selected' : ''}`} data-component-id="class_test_ratio" onClick={() => { setSelectedComponentId('class_test_ratio'); setPropsTab('properties'); }}>
                            <label>测试集比例(%)</label>
                            <div className="mock-input-display">{String(dataStore.class_test_ratio.defaultValue ?? '')}</div>
                          </div>
                        )}
                      </div>
                      {dataStore.class_shuffle && (
                        <div className={`mock-checkbox-display canvas-item ${selectedComponentId === 'class_shuffle' ? 'selected' : ''}`} data-component-id="class_shuffle" onClick={() => { setSelectedComponentId('class_shuffle'); setPropsTab('properties'); }}>
                          <label>洗牌(Shuffle)</label>
                        </div>
                      )}
                      <h2 className="mock-section-title" style={{ marginTop: 30 }}>📊 输出配置</h2>
                      <h3 className="mock-output-group-title">评估指标与平均方式</h3>
                      <div className="mock-metrics-grid">
                        {dataStore.metric_accuracy && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_accuracy' ? 'selected' : ''}`} data-component-id="metric_accuracy" onClick={() => { setSelectedComponentId('metric_accuracy'); setPropsTab('properties'); }}><label>Accuracy</label></div>)}
                        {dataStore.metric_precision && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_precision' ? 'selected' : ''}`} data-component-id="metric_precision" onClick={() => { setSelectedComponentId('metric_precision'); setPropsTab('properties'); }}><label>Precision</label></div>)}
                        {dataStore.metric_recall && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_recall' ? 'selected' : ''}`} data-component-id="metric_recall" onClick={() => { setSelectedComponentId('metric_recall'); setPropsTab('properties'); }}><label>Recall</label></div>)}
                        {dataStore.metric_f1 && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_f1' ? 'selected' : ''}`} data-component-id="metric_f1" onClick={() => { setSelectedComponentId('metric_f1'); setPropsTab('properties'); }}><label>F1</label></div>)}
                        {dataStore.metric_roc_auc && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_roc_auc' ? 'selected' : ''}`} data-component-id="metric_roc_auc" onClick={() => { setSelectedComponentId('metric_roc_auc'); setPropsTab('properties'); }}><label>ROC-AUC</label></div>)}
                      </div>
                      {dataStore.averaging_method && (
                        <div className="mock-form-grid" style={{ marginTop: 16 }}>
                          <div className={`mock-field canvas-item ${selectedComponentId === 'averaging_method' ? 'selected' : ''}`} data-component-id="averaging_method" onClick={() => { setSelectedComponentId('averaging_method'); setPropsTab('properties'); }}>
                            <label>平均方式 <span className="tooltip">(Precision/Recall/F1/ROC-AUC)</span></label>
                            <div className="mock-input-display">{String(dataStore.averaging_method.defaultValue ?? '')}</div>
                          </div>
                        </div>
                      )}
                      <h3 className="mock-output-group-title">可视化</h3>
                      <div className="mock-metrics-grid">
                        {dataStore.viz_roc && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'viz_roc' ? 'selected' : ''}`} data-component-id="viz_roc" onClick={() => { setSelectedComponentId('viz_roc'); setPropsTab('properties'); }}><label>ROC 曲线</label></div>)}
                        {dataStore.viz_pr && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'viz_pr' ? 'selected' : ''}`} data-component-id="viz_pr" onClick={() => { setSelectedComponentId('viz_pr'); setPropsTab('properties'); }}><label>PR 曲线</label></div>)}
                        {dataStore.viz_cm && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'viz_cm' ? 'selected' : ''}`} data-component-id="viz_cm" onClick={() => { setSelectedComponentId('viz_cm'); setPropsTab('properties'); }}><label>混淆矩阵</label></div>)}
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="canvas-mockup-card">
                    <h2 className="mock-section-title">⚙️ 输入配置</h2>
                    <div className="mock-form-grid">
                      {dataStore.reg_train_ratio && (
                        <div className={`mock-field canvas-item ${selectedComponentId === 'reg_train_ratio' ? 'selected' : ''}`} data-component-id="reg_train_ratio" onClick={() => { setSelectedComponentId('reg_train_ratio'); setPropsTab('properties'); }}>
                          <label>训练集比例(%)</label>
                          <div className="mock-input-display">{String(dataStore.reg_train_ratio.defaultValue ?? '')}</div>
                        </div>
                      )}
                      {dataStore.reg_test_ratio && (
                        <div className={`mock-field canvas-item ${selectedComponentId === 'reg_test_ratio' ? 'selected' : ''}`} data-component-id="reg_test_ratio" onClick={() => { setSelectedComponentId('reg_test_ratio'); setPropsTab('properties'); }}>
                          <label>测试集比例(%)</label>
                          <div className="mock-input-display">{String(dataStore.reg_test_ratio.defaultValue ?? '')}</div>
                        </div>
                      )}
                    </div>
                    {dataStore.reg_shuffle && (
                      <div className={`mock-checkbox-display canvas-item ${selectedComponentId === 'reg_shuffle' ? 'selected' : ''}`} data-component-id="reg_shuffle" onClick={() => { setSelectedComponentId('reg_shuffle'); setPropsTab('properties'); }}>
                        <label>洗牌(Shuffle)</label>
                      </div>
                    )}
                    <h2 className="mock-section-title" style={{ marginTop: 30 }}>📊 输出配置</h2>
                    <h3 className="mock-output-group-title">评估指标</h3>
                    <div className="mock-metrics-grid">
                      {dataStore.metric_mse && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_mse' ? 'selected' : ''}`} data-component-id="metric_mse" onClick={() => { setSelectedComponentId('metric_mse'); setPropsTab('properties'); }}><label>MSE</label></div>)}
                      {dataStore.metric_rmse && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_rmse' ? 'selected' : ''}`} data-component-id="metric_rmse" onClick={() => { setSelectedComponentId('metric_rmse'); setPropsTab('properties'); }}><label>RMSE</label></div>)}
                      {dataStore.metric_mae && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_mae' ? 'selected' : ''}`} data-component-id="metric_mae" onClick={() => { setSelectedComponentId('metric_mae'); setPropsTab('properties'); }}><label>MAE</label></div>)}
                      {dataStore.metric_mape && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_mape' ? 'selected' : ''}`} data-component-id="metric_mape" onClick={() => { setSelectedComponentId('metric_mape'); setPropsTab('properties'); }}><label>MAPE</label></div>)}
                      {dataStore.metric_r2 && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'metric_r2' ? 'selected' : ''}`} data-component-id="metric_r2" onClick={() => { setSelectedComponentId('metric_r2'); setPropsTab('properties'); }}><label>R²</label></div>)}
                    </div>
                    <div className="mock-form-grid" style={{ marginTop: 16 }}>
                      {dataStore.bias_relative && (
                        <div className={`mock-field canvas-item ${selectedComponentId === 'bias_relative' ? 'selected' : ''}`} data-component-id="bias_relative" onClick={() => { setSelectedComponentId('bias_relative'); setPropsTab('properties'); }}>
                          <label>相对偏差阈值(±%)</label>
                          <div className="mock-input-display">{String(dataStore.bias_relative.defaultValue ?? '')}</div>
                        </div>
                      )}
                      {dataStore.bias_absolute && (
                        <div className={`mock-field canvas-item ${selectedComponentId === 'bias_absolute' ? 'selected' : ''}`} data-component-id="bias_absolute" onClick={() => { setSelectedComponentId('bias_absolute'); setPropsTab('properties'); }}>
                          <label>绝对偏差阈值(±)</label>
                          <div className="mock-input-display">{String(dataStore.bias_absolute.defaultValue ?? '')}</div>
                        </div>
                      )}
                    </div>
                    <h3 className="mock-output-group-title">可视化</h3>
                    <div className="mock-metrics-grid">
                      {dataStore.viz_residual && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'viz_residual' ? 'selected' : ''}`} data-component-id="viz_residual" onClick={() => { setSelectedComponentId('viz_residual'); setPropsTab('properties'); }}><label>残差图</label></div>)}
                      {dataStore.viz_scatter && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'viz_scatter' ? 'selected' : ''}`} data-component-id="viz_scatter" onClick={() => { setSelectedComponentId('viz_scatter'); setPropsTab('properties'); }}><label>预测vs真实散点</label></div>)}
                      {dataStore.viz_hist && (<div className={`mock-metric-item canvas-item ${selectedComponentId === 'viz_hist' ? 'selected' : ''}`} data-component-id="viz_hist" onClick={() => { setSelectedComponentId('viz_hist'); setPropsTab('properties'); }}><label>误差直方图</label></div>)}
                    </div>
                  </div>
                );
              })()}
            </section>
          </Splitter.Panel>
          <Splitter.Panel defaultSize="32%" min="24%" max="48%">
            <aside className="editor-right-panel">
              {!selectedData ? (
                <div className="props-panel-placeholder"><p>请在画布中选中一个组件</p><p>以编辑其属性</p></div>
              ) : (
                <div>
                  <div className="props-panel-header">
                    <h3>{selectedData.label} [属性]</h3>
                    <p>{selectedData.componentName}</p>
                  </div>
                  <nav className="panel-tabs props-tabs-container">
                    <div className={`tab-button ${propsTab === 'properties' ? 'active' : ''}`} onClick={() => setPropsTab('properties')}>属性</div>
                    <div className={`tab-button ${propsTab === 'styles' ? 'active' : ''}`} onClick={() => setPropsTab('styles')}>样式</div>
                    <div className={`tab-button ${propsTab === 'advanced' ? 'active' : ''}`} onClick={() => setPropsTab('advanced')}>高级</div>
                  </nav>
                  <div className="props-panel-content-wrapper">
                    {propsTab === 'properties' && renderPropsForm(selectedData)}
                    {propsTab === 'styles' && (
                      <div className="panel-content">
                        <div className="form-group"><label>宽度 (Width)</label><input type="text" value={selectedData.width || '100%'} onChange={(e) => updateData({ width: e.target.value })} /></div>
                        <div className="form-group-checkbox"><input type="checkbox" checked={!!selectedData.fullWidth} onChange={(e) => updateData({ fullWidth: e.target.checked })} /><label>是否独占一行</label></div>
                      </div>
                    )}
                    {propsTab === 'advanced' && (
                      <div className="panel-content">
                        <h4 className="text-sm font-semibold mb-2">校验规则</h4>
                        {(selectedData.rules || []).length === 0 ? (
                          <p className="text-xs text-gray-500">此组件无高级配置。</p>
                        ) : (
                          (selectedData.rules || []).map((rule, idx) => (
                            <div key={idx} className="form-group">
                              <label>{rule.type}</label>
                              <input type="text" value={rule.message || String(rule.value || '')} onChange={(e) => {
                                const next = [...(selectedData.rules || [])];
                                next[idx] = { ...rule, message: e.target.value };
                                updateData({ rules: next });
                              }} />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </Splitter.Panel>
        </Splitter>
      </main>
      {isPreviewOpen && (
        <div className="modal-overlay" onClick={() => setIsPreviewOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 600 }}>预览渲染</div>
              <button className="btn" onClick={() => setIsPreviewOpen(false)}>关闭</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>输入配置</div>
                {dataStore.ts_time_column && (
                  <div className="canvas-item"><div>时间列</div><div>{dataStore.ts_time_column.label}</div></div>
                )}
                {dataStore.ts_target_column && (
                  <div className="canvas-item"><div>预测目标列</div><div>{dataStore.ts_target_column.label}</div></div>
                )}
                {dataStore.ts_context_len && (
                  <div className="canvas-item"><div>上下文长度</div><div>{String(dataStore.ts_context_len.defaultValue ?? '')}</div></div>
                )}
                {dataStore.ts_forecast_horizon && (
                  <div className="canvas-item"><div>预测长度</div><div>{String(dataStore.ts_forecast_horizon.defaultValue ?? '')}</div></div>
                )}
                {dataStore.ts_step_size && (
                  <div className="canvas-item"><div>预测步长</div><div>{String(dataStore.ts_step_size.defaultValue ?? '')}</div></div>
                )}
                {dataStore.class_train_ratio && (
                  <div className="canvas-item"><div>训练集比例(%)</div><div>{String(dataStore.class_train_ratio.defaultValue ?? '')}</div></div>
                )}
                {dataStore.reg_train_ratio && (
                  <div className="canvas-item"><div>训练集比例(%)</div><div>{String(dataStore.reg_train_ratio.defaultValue ?? '')}</div></div>
                )}
                {(dataStore.class_shuffle || dataStore.reg_shuffle) && (
                  <div className="canvas-item"><div>数据洗牌</div><div>{String((dataStore.class_shuffle || dataStore.reg_shuffle).defaultValue ?? false)}</div></div>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>输出配置</div>
                {dataStore.metric_mse && (<div className="canvas-item"><div>MSE</div><div>mse</div></div>)}
                {dataStore.metric_rmse && (<div className="canvas-item"><div>RMSE</div><div>rmse</div></div>)}
                {dataStore.metric_mae && (<div className="canvas-item"><div>MAE</div><div>mae</div></div>)}
                {dataStore.metric_mape && (<div className="canvas-item"><div>MAPE</div><div>mape</div></div>)}
                {dataStore.metric_r2 && (<div className="canvas-item"><div>R²</div><div>r2</div></div>)}
                {dataStore.metric_accuracy && (<div className="canvas-item"><div>Accuracy</div><div>accuracy</div></div>)}
                {dataStore.metric_precision && (<div className="canvas-item"><div>Precision</div><div>precision</div></div>)}
                {dataStore.metric_recall && (<div className="canvas-item"><div>Recall</div><div>recall</div></div>)}
                {dataStore.metric_f1 && (<div className="canvas-item"><div>F1</div><div>f1</div></div>)}
                {dataStore.metric_roc_auc && (<div className="canvas-item"><div>ROC-AUC</div><div>roc_auc</div></div>)}
                {dataStore.viz_forecast && (<div className="canvas-item"><div>折线图/预测图</div><div>forecast_plot</div></div>)}
                {dataStore.viz_residual && (<div className="canvas-item"><div>残差图</div><div>residual_plot</div></div>)}
                {dataStore.viz_scatter && (<div className="canvas-item"><div>预测值vs真实值散点</div><div>pred_vs_true_scatter</div></div>)}
                {dataStore.viz_hist && (<div className="canvas-item"><div>误差分布直方图</div><div>error_histogram</div></div>)}
                {dataStore.viz_roc && (<div className="canvas-item"><div>ROC 曲线</div><div>roc_curve</div></div>)}
                {dataStore.viz_pr && (<div className="canvas-item"><div>PR 曲线</div><div>pr_curve</div></div>)}
                {dataStore.viz_cm && (<div className="canvas-item"><div>混淆矩阵</div><div>confusion_matrix</div></div>)}
              </div>
            </div>
            {publishedSnapshot && (
              <div style={{ marginTop: 16, fontSize: 12, color: '#555' }}>当前已发布配置版本对新建任务生效</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      {page === "list" ? renderListPage() : renderEditorPage()}
    </div>
  );
}
