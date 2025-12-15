// 任务类型配置模板（仅用于前端演示）
// 注意：这些模板仅为 mock 数据，真实环境需由后端或配置库管理

export type TaskTypeTemplate = {
  id: string;
  name: string;
  category: "时序预测" | "分类" | "回归";
  input: any;
  output: any;
};

export const taskTypeTemplates: TaskTypeTemplate[] = [
  {
    id: "TimeSeries_Electricity",
    name: "时序预测",
    category: "时序预测",
    input: {
      dataset: {
        maxFiles: 5,
        requireCommonFields: true,
        needPrimaryDataset: true,
        allowCovariateFiles: true
      },
      targetFieldRequired: true,
      featuresSelection: "auto_all",
      models: [
        { id: "LimiX_TS", name: "LimiX内置", source: "自研", version: "1.0", default: true },
        { id: "XGBoost_TS", name: "XGBoost", source: "第三方", version: "1.6.0" }
      ],
      parameters: [
        { name: "context_length", label: "上下文长度", type: "number", required: true, default: 30 },
        // 改为非必填，类型使用字符串以符合 JSON Schema 定义
        { name: "forecast_start_time", label: "预测开始时间", type: "string", required: false },
        { name: "primary_dataset", label: "主变量文件", type: "enum", optionsSource: "datasets", required: true }
      ]
    },
    output: {
      metrics: [
        { name: "MSE" },
        { name: "RMSE" },
        { name: "R2" }
      ],
      charts: ["forecast_curve", "residual_plot", "model_comparison"],
      enableCausalAnalysis: true
    }
  },
  {
    id: "Classification_SteelDefect",
    name: "分类",
    category: "分类",
    input: {
      dataset: {
        maxFiles: 1,
        requireCommonFields: false,
        needPrimaryDataset: true,
        allowCovariateFiles: false
      },
      targetFieldRequired: true,
      featuresSelection: "manual_select",
      models: [
        { id: "ResNet50", name: "ResNet50", source: "第三方", version: "2.0", default: true },
        { id: "EfficientNetB0", name: "EfficientNetB0", source: "第三方", version: "1.0" }
      ],
      parameters: [
        { name: "train_ratio", label: "训练集比例(%)", type: "number", required: true, default: 80 },
        { name: "shuffle_data", label: "数据随机打散", type: "boolean", required: false, default: false }
      ]
    },
    output: {
      metrics: [{ name: "Accuracy" }, { name: "F1" }, { name: "AUC" }],
      charts: ["roc_curve", "confusion_matrix"],
      enableCausalAnalysis: false
    }
  },
  {
    id: "Regression_Quality",
    name: "回归",
    category: "回归",
    input: {
      dataset: {
        maxFiles: 1,
        requireCommonFields: true,
        needPrimaryDataset: true,
        allowCovariateFiles: false
      },
      targetFieldRequired: true,
      featuresSelection: "manual_select",
      models: [
        { id: "LightGBM", name: "LightGBM", source: "第三方", version: "3.3.2", default: true },
        { id: "XGBoost", name: "XGBoost", source: "第三方", version: "1.7.0" }
      ],
      parameters: [
        { name: "train_ratio", label: "训练集比例(%)", type: "number", required: true, default: 80 },
        { name: "shuffle_data", label: "数据随机打散", type: "boolean", required: false, default: false }
      ]
    },
    output: {
      metrics: [{ name: "MAE" }, { name: "RMSE" }, { name: "R2" }],
      charts: ["residual_plot", "error_histogram", "scatter_plot"],
      enableCausalAnalysis: false
    }
  }
];

// 一个空白模板
export const blankTemplate: TaskTypeTemplate = {
  id: "New_TaskType",
  name: "未命名任务类型",
  category: "回归",
  input: {
    dataset: {
      maxFiles: 1,
      requireCommonFields: true,
      needPrimaryDataset: true,
      allowCovariateFiles: false
    },
    targetFieldRequired: true,
    featuresSelection: "manual_select",
    models: [
      { id: "LightGBM", name: "LightGBM", source: "第三方", version: "3.3.2", default: true }
    ],
    parameters: [
      { name: "train_ratio", label: "训练集比例(%)", type: "number", required: true, default: 80 }
    ]
  },
  output: {
    metrics: [{ name: "MAE" }, { name: "RMSE" }],
    charts: ["residual_plot"],
    enableCausalAnalysis: false
  }
};