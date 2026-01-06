import { TaskType } from '../utils/taskTypes';
export type { TaskType };


export type TaskStatus = 'not_started' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';
export type AverageMethod = 'micro' | 'macro' | 'samples' | 'weighted' | 'binary' | 'acc';

export interface SelectedDatasetEntry {
    id: string;
    name: string;
    version: string;
    files?: string[];
}

export interface Task {
    id: string;
    taskName: string;
    taskType: TaskType;
    projectId?: string;
    projectName?: string;
    datasetName: string;
    datasetVersion: string;
    datasets?: SelectedDatasetEntry[];
    modelName: string;
    priority: TaskPriority;
    status: TaskStatus;
    progress?: number;
    createdAt: string;
    completedAt?: string;
    createdBy: string;
    description?: string;
    config?: any;
    results?: any;
    estimatedTime?: number;
    actualTime?: number;
    hasQueuedBefore?: boolean;
}

export interface DatasetVersion {
    version: string;
    createdAt: string;
    description: string;
    size: string;
    fieldCount: number;
    sampleCount: number;
    files?: string[];
}

export interface DatasetInfo {
    id: string;
    name: string;
    description: string;
    size: string;
    fieldCount: number;
    sampleCount: number;
    source: 'upload' | 'subscription';
    status: 'success' | 'processing' | 'failed';
    versions: DatasetVersion[];
    files?: string[];
    previewData?: any[];
}

export interface OutputConfig {
    forecasting: {
        metrics: {
            mse: boolean;
            rmse: boolean;
            mae: boolean;
            mape: boolean;
            r2: boolean;
            relDeviationPercent: number;
            absDeviationValue: number;
            customMetricCode: string;
        };
        visualizations: {
            lineChart: boolean;
            residualPlot: boolean;
            predVsTrueScatter: boolean;
            errorHistogram: boolean;
        };
    };
    classification: {
        metrics: {
            accuracy: boolean;
            precision: boolean;
            recall: boolean;
            f1Score: boolean;
            rocAuc: boolean;
            averageMethod: AverageMethod;
            customMetricCode: string;
        };
        visualizations: {
            rocCurve: boolean;
            prCurve: boolean;
            confusionMatrix: boolean;
        };
    };
    regression: {
        metrics: {
            mse: boolean;
            rmse: boolean;
            mae: boolean;
            mape: boolean;
            r2: boolean;
            relDeviationPercent: number;
            absDeviationValue: number;
            customMetricCode: string;
        };
        visualizations: {
            lineChart: boolean;
            residualPlot: boolean;
            predVsTrueScatter: boolean;
            errorHistogram: boolean;
        };
    };
}

export interface SelectedFileRole {
    fileName: string;
    role: 'train' | 'test';
    datasetId: number;
    version: string;
}

export interface FormData {
    taskName: string;
    taskType: TaskType;
    projectId: string;
    datasetName: string;
    datasetVersion: string;
    selectedDataset: DatasetInfo | null;
    selectedDatasets: SelectedDatasetEntry[];
    // 新增：选中的文件元数据和角色
    selectedFilesMetadata: Array<{
        name: string;
        size: string;
        rows: number;
        columns: number;
        fields: string[];
        datasetId: number;
        datasetTitle: string;
        version: string;
    }>;
    fileRoles: Record<string, 'train' | 'test'>; // key 为 fileName
    searchDatasetTerm: string;

    modelName: string;
    models: string[];
    modelSelectionMode: 'single' | 'multiple';
    targetFields: string[];
    availableFields: string[];
    priority: TaskPriority;
    description: string;
    forecastingConfig: {
        timeColumn: string;
        targetColumn: string;
        contextLength: number;
        forecastLength: number;
        stepLength: number;
        startTime: string;
        mainVariableFiles: string[];
        covariateFiles: string[];
        splitMode: 'percent' | 'date';
        trainRatio: number;
        testRatio: number;
        splitDate?: Date;
    };
    classificationConfig: {
        trainRatio: number;
        testRatio: number;
        trainFiles?: string[];
        testFile?: string;
        targetColumn?: string;
        shuffle: boolean;
    };
    regressionConfig: {
        trainRatio: number;
        testRatio: number;
        trainFiles?: string[];
        testFile?: string;
        targetColumn?: string;
        shuffle: boolean;
    };
    outputConfig: OutputConfig;
    resourceType: 'cpu' | 'gpu' | 'npu';
    resourceConfig: {
        cores: number;
        memory: number;
        acceleratorCards?: number;
        maxRunTime: number;
    };
}
