/**
 * 嵌套可展开数据表格组件
 * 功能：实现数据集 → 版本 → 文件三层嵌套展示
 * 使用 Ant Design Table 的 expandedRowRender 实现
 */
import React, { useState } from 'react';
import { Table, Badge, Button, Space, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Eye, Zap, Download, Edit, Copy, Trash2, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import type { MockDataset, DatasetFileVersion } from '../../mock/datasets';

/**
 * 文件信息接口
 */
interface FileInfo {
    key: string;
    name: string;
    size: string;
    rows: number;
    columns: number;
}

/**
 * 版本信息接口（用于表格展示）
 */
interface VersionRow {
    key: string;
    version: string;
    fileCount: number;
    totalSize: string;
    files: FileInfo[];
}

/**
 * 组件属性接口
 */
interface NestedDatasetTableProps {
    /** 数据集列表 */
    data: MockDataset[];
    /** 选中的数据集 ID 列表 */
    selectedIds: number[];
    /** 切换选中状态回调 */
    onToggleSelect: (id: number) => void;
    /** 查看数据详情回调 */
    onViewDataDetail: (id: number) => void;
    /** 快速预处理回调 */
    onQuickPreprocess: (id: number) => void;
    /** 下载回调 */
    onDownload: (id: number) => void;
    /** 编辑回调 */
    onEdit: (id: number) => void;
    /** 复制回调（数据集级别） */
    onCopy: (id: number) => void;
    /** 复制回调（版本级别） */
    onCopyVersion?: (datasetId: number, version: string) => void;
    /** 删除回调 */
    onDelete: (id: number) => void;
}

/**
 * 嵌套可展开数据表格组件
 * @param props 组件属性
 * @returns React 组件
 */
export function NestedDatasetTable(props: NestedDatasetTableProps) {
    const {
        data,
        selectedIds,
        onToggleSelect,
        onViewDataDetail,
        onQuickPreprocess,
        onDownload,
        onEdit,
        onCopy,
        onCopyVersion,
        onDelete,
    } = props;

    // 展开的数据集 ID 列表
    const [expandedDatasetKeys, setExpandedDatasetKeys] = useState<React.Key[]>([]);
    // 展开的版本 Key 列表（格式：datasetId-version）
    const [expandedVersionKeys, setExpandedVersionKeys] = useState<React.Key[]>([]);

    /**
     * 文件列表表格列定义
     */
    const fileColumns: ColumnsType<FileInfo> = [
        {
            title: '文件名',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    {text}
                </span>
            ),
        },
        {
            title: '大小',
            dataIndex: 'size',
            key: 'size',
            width: 100,
        },
        {
            title: '行数',
            dataIndex: 'rows',
            key: 'rows',
            width: 100,
            render: (v: number) => v?.toLocaleString() || '-',
        },
        {
            title: '列数',
            dataIndex: 'columns',
            key: 'columns',
            width: 100,
        },
    ];

    /**
     * 版本列表表格列定义
     * @param datasetId 数据集ID，用于版本操作回调
     */
    const getVersionColumns = (datasetId: number): ColumnsType<VersionRow> => [
        {
            title: '版本号',
            dataIndex: 'version',
            key: 'version',
            width: 120,
            render: (text: string) => <Badge status="success" text={text} />,
        },
        {
            title: '文件数量',
            dataIndex: 'fileCount',
            key: 'fileCount',
            width: 100,
        },
        {
            title: '总大小',
            dataIndex: 'totalSize',
            key: 'totalSize',
            width: 120,
        },
        {
            title: '操作',
            key: 'actions',
            width: 200,
            render: (_: any, record: VersionRow) => (
                <Space size="small">
                    <Tooltip title="查看">
                        <Button type="text" size="small" icon={<Eye className="h-4 w-4" />} onClick={() => onViewDataDetail(datasetId)} />
                    </Tooltip>
                    <Tooltip title="预处理">
                        <Button type="text" size="small" icon={<Zap className="h-4 w-4" />} onClick={() => onQuickPreprocess(datasetId)} />
                    </Tooltip>
                    <Tooltip title="下载">
                        <Button type="text" size="small" icon={<Download className="h-4 w-4" />} onClick={() => onDownload(datasetId)} />
                    </Tooltip>
                    <Tooltip title="复制">
                        <Button type="text" size="small" icon={<Copy className="h-4 w-4" />} onClick={() => {
                            if (onCopyVersion) {
                                onCopyVersion(datasetId, record.version);
                            } else {
                                onCopy(datasetId);
                            }
                        }} />
                    </Tooltip>
                    <Tooltip title="删除">
                        <Button type="text" size="small" icon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(datasetId)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    /**
     * 渲染版本行的展开内容（文件列表）
     * @param versionRow 版本行数据
     * @returns 文件列表表格
     */
    const renderFileTable = (versionRow: VersionRow) => {
        return (
            <Table
                columns={fileColumns}
                dataSource={versionRow.files}
                pagination={false}
                size="small"
                rowKey="key"
                showHeader={true}
                style={{ marginLeft: 48 }}
            />
        );
    };

    /**
     * 渲染数据集行的展开内容（版本列表）
     * @param record 数据集记录
     * @returns 版本列表表格
     */
    const renderVersionTable = (record: MockDataset) => {
        // 将 versions 转换为表格数据格式
        const versionData: VersionRow[] = (record.versions || []).map((v, idx) => ({
            key: `${record.id}-${v.version}-${idx}`,
            version: v.version,
            fileCount: v.files?.length || 0,
            totalSize: v.files?.reduce((acc, f) => {
                const sizeMatch = f.size?.match(/(\d+\.?\d*)/);
                return acc + (sizeMatch ? parseFloat(sizeMatch[1]) : 0);
            }, 0).toFixed(1) + 'MB',
            files: (v.files || []).map((f, fIdx) => ({
                key: `${record.id}-${v.version}-file-${fIdx}`,
                name: f.name,
                size: f.size,
                rows: f.rows,
                columns: f.columns,
            })),
        }));

        return (
            <Table
                columns={getVersionColumns(record.id)}
                dataSource={versionData}
                pagination={false}
                size="small"
                rowKey="key"
                showHeader={true}
                expandable={{
                    expandedRowKeys: expandedVersionKeys,
                    onExpandedRowsChange: (keys) => setExpandedVersionKeys(keys as React.Key[]),
                    expandedRowRender: renderFileTable,
                    expandIcon: ({ expanded, onExpand, record }) =>
                        record.files && record.files.length > 0 ? (
                            <span
                                onClick={(e) => onExpand(record, e)}
                                style={{ cursor: 'pointer', marginRight: 8 }}
                            >
                                {expanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                            </span>
                        ) : (
                            <span style={{ width: 24, display: 'inline-block' }} />
                        ),
                }}
                style={{ marginLeft: 48 }}
            />
        );
    };

    /**
     * 主表格列定义
     */
    const datasetColumns: ColumnsType<MockDataset> = [
        {
            title: '',
            key: 'select',
            width: 48,
            render: (_: any, record: MockDataset) => (
                <input
                    type="checkbox"
                    checked={selectedIds.includes(record.id)}
                    onChange={() => onToggleSelect(record.id)}
                    className="rounded"
                />
            ),
        },
        {
            title: '名称',
            dataIndex: 'title',
            key: 'title',
            width: 200,
            ellipsis: true,
            render: (text: string) => <span className="font-medium">{text}</span>,
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text: string) => (
                <Tooltip title={text}>
                    <span className="text-gray-600">{text}</span>
                </Tooltip>
            ),
        },
        {
            title: '版本数',
            key: 'versionCount',
            width: 80,
            render: (_: any, record: MockDataset) => record.versions?.length || record.versionCount || 0,
        },
        {
            title: '文件数',
            key: 'fileCount',
            width: 80,
            render: (_: any, record: MockDataset) => {
                const total = (record.versions || []).reduce((acc, v) => acc + (v.files?.length || 0), 0);
                return total || record.fileCount || 0;
            },
        },
        {
            title: '更新时间',
            dataIndex: 'updateTime',
            key: 'updateTime',
            width: 160,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
                const statusMap: Record<string, { color: 'success' | 'processing' | 'error'; text: string }> = {
                    success: { color: 'success', text: '成功' },
                    processing: { color: 'processing', text: '导入中' },
                    failed: { color: 'error', text: '失败' },
                };
                const config = statusMap[status] || { color: 'success', text: status };
                return <Badge status={config.color} text={config.text} />;
            },
        },
        {
            title: '操作',
            key: 'actions',
            width: 240,
            fixed: 'right',
            render: (_: any, record: MockDataset) => (
                <Space size="small">
                    {record.status === 'success' && (
                        <>
                            <Tooltip title="查看详情">
                                <Button type="text" size="small" icon={<Eye className="h-4 w-4" />} onClick={() => onViewDataDetail(record.id)} />
                            </Tooltip>
                            <Tooltip title="快速预处理">
                                <Button type="text" size="small" icon={<Zap className="h-4 w-4" />} onClick={() => onQuickPreprocess(record.id)} />
                            </Tooltip>
                            <Tooltip title="下载">
                                <Button type="text" size="small" icon={<Download className="h-4 w-4" />} onClick={() => onDownload(record.id)} />
                            </Tooltip>
                            <Tooltip title="编辑">
                                <Button type="text" size="small" icon={<Edit className="h-4 w-4" />} onClick={() => onEdit(record.id)} />
                            </Tooltip>
                            <Tooltip title="复制">
                                <Button type="text" size="small" icon={<Copy className="h-4 w-4" />} onClick={() => onCopy(record.id)} />
                            </Tooltip>
                            <Tooltip title="删除">
                                <Button type="text" size="small" icon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(record.id)} />
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="nested-dataset-table">
            <Table
                columns={datasetColumns}
                dataSource={data}
                rowKey="id"
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
                size="middle"
                scroll={{ x: 1200 }}
                expandable={{
                    expandedRowKeys: expandedDatasetKeys,
                    onExpandedRowsChange: (keys) => setExpandedDatasetKeys(keys as React.Key[]),
                    expandedRowRender: renderVersionTable,
                    rowExpandable: (record) => (record.versions?.length || 0) > 0,
                    expandIcon: ({ expanded, onExpand, record }) =>
                        (record.versions?.length || 0) > 0 ? (
                            <span
                                onClick={(e) => onExpand(record, e)}
                                style={{ cursor: 'pointer', marginRight: 8 }}
                            >
                                {expanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                            </span>
                        ) : (
                            <span style={{ width: 24, display: 'inline-block' }} />
                        ),
                }}
            />
        </div>
    );
}

export default NestedDatasetTable;
