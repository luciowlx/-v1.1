# 项目目录结构说明

本文档描述项目的目录组织结构，帮助开发者快速定位文件。

## 目录结构

```
v1.0-P0_完善版本/
├── src/                    # 主业务代码
│   ├── components/         # React 组件
│   ├── mock/               # Mock 数据
│   ├── services/           # 服务层
│   ├── styles/             # 样式文件
│   ├── types/              # TypeScript 类型定义
│   └── utils/              # 工具函数
├── public/                 # 静态资源（图片、图标）
├── docs/                   # 文档目录
│   ├── design/             # UI 原型 / 设计稿
│   ├── notes/              # 开发笔记 / 临时文档
│   └── prd/                # PRD / 需求文档
├── data/                   # 数据目录（模拟数据 CSV）
├── scripts/                # 构建/运维脚本
├── _archive/               # 历史归档（非活跃代码）
├── build/                  # 构建产物（自动生成）
├── .agent/                 # Agent 配置（Skills、Workflows）
├── .github/                # GitHub Actions CI/CD
├── index.html              # Vite 入口
├── vite.config.ts          # Vite 构建配置
├── package.json            # 依赖管理
└── README.md               # 项目说明
```

## 软链接说明

为保持向后兼容，以下路径使用软链接指向新位置：

| 软链接路径 | 实际指向 |
|-----------|---------|
| `模拟数据/` | `data/` |
| `temp_project_columns.tsx` | `src/components/_temp/temp_project_columns.tsx` |

## 关键入口

- **开发启动**：`npm run dev`
- **构建**：`npm run build`
- **主入口**：`src/main.tsx` → `src/App.tsx`
