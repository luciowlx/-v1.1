// JSON Schema for 任务类型配置（前端校验用）
// 说明：此 Schema 为演示用，覆盖了主要字段与类型约束

export const taskTypeSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["id", "name", "category", "input", "output"],
  properties: {
    id: { type: "string", minLength: 1 },
    name: { type: "string", minLength: 1 },
    category: { type: "string", enum: ["时序预测", "分类", "回归"] },
    input: {
      type: "object",
      required: ["dataset", "targetFieldRequired", "featuresSelection", "models", "parameters"],
      properties: {
        dataset: {
          type: "object",
          required: ["maxFiles", "requireCommonFields", "needPrimaryDataset", "allowCovariateFiles"],
          properties: {
            maxFiles: { type: "integer", minimum: 1 },
            requireCommonFields: { type: "boolean" },
            needPrimaryDataset: { type: "boolean" },
            allowCovariateFiles: { type: "boolean" }
          }
        },
        targetFieldRequired: { type: "boolean" },
        featuresSelection: { type: "string", enum: ["auto_all", "manual_select"] },
        models: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["id", "name", "source", "version"],
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              source: { type: "string" },
              version: { type: "string" },
              default: { type: "boolean" }
            }
          }
        },
        parameters: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "label", "type"],
            properties: {
              name: { type: "string" },
              label: { type: "string" },
              type: { type: "string", enum: ["number", "string", "boolean", "datetime", "enum"] },
              required: { type: "boolean" },
              default: {},
              options: {
                type: "array",
                items: { type: "string" }
              },
              optionsSource: { type: "string" }
            }
          }
        }
      }
    },
    output: {
      type: "object",
      required: ["metrics", "charts", "enableCausalAnalysis"],
      properties: {
        metrics: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" }
            }
          }
        },
        charts: {
          type: "array",
          items: { type: "string" }
        },
        enableCausalAnalysis: { type: "boolean" }
      }
    }
  }
} as const;