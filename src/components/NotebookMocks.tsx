import React, { useState, useEffect, useRef } from 'react';
import {
    File, FolderOpen, Search, Settings,
    Play, Save, Plus, ChevronRight,
    Terminal as TerminalIcon, X, Maximize2,
    Layout, Cpu, HardDrive, Database,
    Code2, BarChart3, Clock, CheckCircle2,
    AlertCircle, Copy, HelpCircle,
    Folder, FileJson, FileCode, Beaker,
    RefreshCw, Square
} from 'lucide-react';

/**
 * JupyterLab 仿真界面组件
 * 功能：模拟真实 JupyterLab 的菜单、工具栏交互
 */
export function JupyterLabMock({ onClose }: { onClose: () => void }) {
    // 页签数据结构定义
    interface Tab {
        id: string;
        title: string;
        type: 'notebook' | 'launcher' | 'terminal';
        icon?: React.ReactNode;
    }

    const [tabs, setTabs] = useState<Tab[]>([
        { id: 'defect_detection.ipynb', title: 'defect_detection.ipynb', type: 'notebook', icon: <FileCode className="w-3.5 h-3.5 text-orange-500" /> },
        { id: 'terminal-1', title: 'Terminal 1', type: 'terminal', icon: <TerminalIcon className="w-3.5 h-3.5" /> }
    ]);
    const [activeTabId, setActiveTabId] = useState('defect_detection.ipynb');

    // 动态文件列表状态
    const [files, setFiles] = useState<{ name: string, type: 'notebook' | 'json' | 'code' | 'markdown' }[]>([
        { name: 'defect_detection.ipynb', type: 'notebook' },
        { name: 'config.json', type: 'json' }
    ]);

    const [isExecuting, setIsExecuting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [kernelStatus, setKernelStatus] = useState<'idle' | 'busy' | 'restarting'>('idle');
    const [cellCount, setCellCount] = useState(2);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    // 新增交互状态
    const [activeSideTab, setActiveSideTab] = useState('file'); // file, search, data, terminal, settings
    const [expandedFolders, setExpandedFolders] = useState<string[]>(['data', 'models']);
    const [activeFile, setActiveFile] = useState('defect_detection.ipynb');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 处理新页签 logic
    const handleAddTab = () => {
        const launcherId = `launcher-${Date.now()}`;
        const newLauncher: Tab = {
            id: launcherId,
            title: 'Launcher',
            type: 'launcher'
        };
        setTabs([...tabs, newLauncher]);
        setActiveTabId(launcherId);
    };

    const handleCloseTab = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== id);
        if (newTabs.length === 0) {
            handleAddTab(); // 如果全部关闭，自动打开 Launcher
            return;
        }
        setTabs(newTabs);
        if (activeTabId === id) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    // 处理 Launcher 项目点击动作
    const handleLauncherAction = (name: string, type: 'notebook' | 'terminal' | 'code' | 'markdown') => {
        showToast(`正在启动 ${name}...`);

        setTimeout(() => {
            let fileName = '';
            let icon: React.ReactNode = null;

            if (type === 'notebook') {
                fileName = `untitled_${tabs.length}.ipynb`;
                icon = <FileCode className="w-3.5 h-3.5 text-orange-500" />;
            } else if (type === 'code') {
                fileName = `untitled_${tabs.length}.py`;
                icon = <Code2 className="w-3.5 h-3.5 text-yellow-600" />;
            } else if (type === 'markdown') {
                fileName = `untitled_${tabs.length}.md`;
                icon = <FileCode className="w-3.5 h-3.5 text-blue-500" />;
            } else {
                fileName = `Terminal ${tabs.length}`;
                icon = <TerminalIcon className="w-3.5 h-3.5" />;
            }

            // 添加到文件浏览器 (如果是文件类型)
            if (type !== 'terminal') {
                setFiles(prev => [...prev, { name: fileName, type: type === 'code' ? 'code' : (type === 'markdown' ? 'markdown' : 'notebook') }]);
            }

            // 替换或新增页签
            const newTab: Tab = {
                id: fileName,
                title: fileName,
                type: type === 'terminal' ? 'terminal' : 'notebook',
                icon: icon
            };

            // 如果当前是 Launcher，则替换它；否则新增
            const currentTab = tabs.find(t => t.id === activeTabId);
            if (currentTab?.type === 'launcher') {
                setTabs(tabs.map(t => t.id === activeTabId ? newTab : t));
                setActiveTabId(newTab.id);
            } else {
                setTabs([...tabs, newTab]);
                setActiveTabId(newTab.id);
            }

            showToast(`✓ 已创建 ${fileName}`);
        }, 600);
    };

    // 处理刷新逻辑
    const handleRefreshList = () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        showToast('正在同步文件列表...');
        setTimeout(() => {
            setIsRefreshing(false);
            showToast('✓ 文件列表已更新');
        }, 1200);
    };

    // 处理新建文件逻辑
    const handleNewFile = () => {
        showToast('正在创建新文件...');
        setTimeout(() => {
            showToast('✓ 已创建 untitled.ipynb');
        }, 800);
    };

    // 处理文件夹折叠逻辑
    const toggleFolder = (folderName: string) => {
        setExpandedFolders(prev =>
            prev.includes(folderName)
                ? prev.filter(f => f !== folderName)
                : [...prev, folderName]
        );
    };

    // 处理关闭操作
    const handleCloseRequest = () => {
        setShowCloseConfirm(true);
    };

    const handleConfirmClose = () => {
        setShowCloseConfirm(false);
        onClose();
    };


    // 显示 Toast 提示
    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 2000);
    };

    // 模拟执行代码
    const handleRun = () => {
        if (isExecuting) return;
        setIsExecuting(true);
        setKernelStatus('busy');
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsExecuting(false);
                    setKernelStatus('idle');
                    showToast('✓ 代码执行完成');
                    return 100;
                }
                return prev + 2;
            });
        }, 50);
    };

    // 模拟保存
    const handleSave = () => {
        showToast('✓ Notebook 已保存');
    };

    // 模拟添加单元格
    const handleAddCell = () => {
        setCellCount(prev => prev + 1);
        showToast(`+ 已添加新单元格 (共 ${cellCount + 1} 个)`);
    };

    // 模拟停止执行
    const handleStop = () => {
        if (isExecuting) {
            setIsExecuting(false);
            setKernelStatus('idle');
            setProgress(0);
            showToast('⏹ 执行已中断');
        }
    };

    // 模拟重启内核
    const handleRestartKernel = () => {
        setKernelStatus('restarting');
        showToast('🔄 正在重启内核...');
        setTimeout(() => {
            setKernelStatus('idle');
            setProgress(0);
            showToast('✓ 内核已重启');
        }, 1500);
    };

    // 菜单项定义
    const menuItems: Record<string, string[]> = {
        'File': ['新建 Notebook', '打开...', '保存', '另存为...', '导出为 HTML', '关闭'],
        'Edit': ['撤销', '重做', '剪切单元格', '复制单元格', '粘贴单元格', '删除单元格'],
        'View': ['显示行号', '折叠所有输出', '展开所有输出', '全屏模式'],
        'Run': ['运行选中单元格', '运行所有单元格', '中断内核', '重启内核并运行所有'],
        'Kernel': ['中断', '重启', '重启并清除输出', '关闭', '更改内核...'],
        'Settings': ['JupyterLab 主题', '文本编辑器设置', '高级设置编辑器']
    };

    // 处理菜单项点击
    const handleMenuItemClick = (menu: string, item: string) => {
        setActiveMenu(null);
        if (item === '保存') handleSave();
        else if (item === '关闭') onClose();
        else if (item === '运行选中单元格' || item === '运行所有单元格') handleRun();
        else if (item === '中断' || item === '中断内核') handleStop();
        else if (item === '重启' || item === '重启内核并运行所有') handleRestartKernel();
        else showToast(`已点击: ${item}`);
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-[#f5f5f5] flex flex-col font-sans animate-in fade-in duration-300 overflow-hidden">
            {/* 菜单关闭透明遮罩层 - 仅在菜单打开时显示 */}
            {activeMenu && (
                <div
                    className="fixed inset-0 z-[8000] bg-transparent cursor-default"
                    onClick={() => setActiveMenu(null)}
                />
            )}

            {/* Toast 提示 */}
            {toast && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900/95 text-white text-sm px-5 py-2.5 rounded-lg shadow-2xl border border-white/10 backdrop-blur-sm">
                    {toast}
                </div>
            )}


            {/* 顶部菜单栏 */}
            <div className="h-10 bg-white border-b border-gray-200 flex items-center justify-between px-3 text-sm text-gray-700 relative z-[1001]">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center gap-1.5 font-bold">
                        <div className="w-5 h-5 bg-[#F37626] rounded-sm flex items-center justify-center text-white text-[10px]">J</div>
                        <span>JupyterLab</span>
                    </div>
                    <div className="flex space-x-1 text-xs relative">
                        {Object.keys(menuItems).map(menu => (
                            <div key={menu} className="relative">
                                <span
                                    className={`cursor-pointer px-2 py-1 rounded transition-colors ${activeMenu === menu ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenu(activeMenu === menu ? null : menu);
                                    }}
                                >
                                    {menu}
                                </span>
                                {activeMenu === menu && (
                                    <div className="fixed mt-1 bg-white border border-gray-200 rounded-md shadow-xl py-1 min-w-[180px] z-[9000]" style={{ top: '40px' }} onClick={e => e.stopPropagation()}>
                                        {menuItems[menu].map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMenuItemClick(menu, item);
                                                }}
                                            >
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        <div className={`w-2 h-2 rounded-full ${kernelStatus === 'idle' ? 'bg-green-500' : kernelStatus === 'busy' ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500 animate-spin'}`}></div>
                        <span>Python 3.10 (Standard) | {kernelStatus === 'idle' ? 'Idle' : kernelStatus === 'busy' ? 'Busy' : 'Restarting...'}</span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCloseRequest();
                        }}
                        className="p-1 hover:bg-red-50 hover:text-red-500 rounded transition-colors text-gray-400 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative z-[1002]">
                {/* 最左侧工具栏 */}
                <div className="w-10 bg-[#e0e0e0] border-r border-gray-300 flex flex-col items-center py-4 space-y-4 relative z-[1003]">
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveSideTab('file'); }}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${activeSideTab === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-300'}`}
                        title="文件浏览器"
                    >
                        <FolderOpen className="w-5 h-5 pointer-events-none" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveSideTab('search'); }}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${activeSideTab === 'search' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:bg-gray-300'}`}
                        title="搜索"
                    >
                        <Search className="w-5 h-5 pointer-events-none" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveSideTab('data'); }}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${activeSideTab === 'data' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:bg-gray-300'}`}
                        title="数据连接器"
                    >
                        <Database className="w-5 h-5 pointer-events-none" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveSideTab('terminal'); }}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${activeSideTab === 'terminal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:bg-gray-300'}`}
                        title="终端"
                    >
                        <TerminalIcon className="w-5 h-5 pointer-events-none" />
                    </button>
                    <div className="flex-1"></div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveSideTab('settings'); }}
                        className={`p-1.5 rounded transition-colors mb-2 cursor-pointer ${activeSideTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:bg-gray-300'}`}
                        title="设置"
                    >
                        <Settings className="w-5 h-5 pointer-events-none" />
                    </button>
                </div>


                {/* 动态左侧面板 */}
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col relative z-[1003]">
                    {activeSideTab === 'file' ? (
                        <>
                            <div className="h-9 px-3 border-b border-gray-200 flex items-center justify-between text-xs font-bold uppercase text-gray-500 tracking-wider bg-gray-50">
                                <span>File Browser</span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleNewFile(); }}
                                        className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition-all cursor-pointer active:scale-90"
                                        title="新建文件"
                                    >
                                        <Plus className="w-4 h-4 pointer-events-none" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRefreshList(); }}
                                        className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition-all cursor-pointer active:scale-90"
                                        title="刷新"
                                    >
                                        <RefreshCw className={`w-4 h-4 pointer-events-none ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                {/* Folders */}
                                <div
                                    className={`flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-blue-50 cursor-pointer rounded transition-colors ${activeFile === 'data-folder' ? 'bg-blue-100' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); toggleFolder('data'); setActiveFile('data-folder'); }}
                                >
                                    <ChevronRight className={`w-3 h-3 transition-transform ${expandedFolders.includes('data') ? 'rotate-90' : ''}`} />
                                    <Folder className="w-4 h-4 text-blue-400 fill-current" />
                                    <span>data</span>
                                </div>
                                {expandedFolders.includes('data') && (
                                    <div className="ml-5 border-l border-gray-200">
                                        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 cursor-pointer rounded" onClick={(e) => { e.stopPropagation(); showToast('📄 train.csv'); }}>
                                            <File className="w-4 h-4 text-gray-400" />
                                            <span>train.csv</span>
                                        </div>
                                    </div>
                                )}

                                <div
                                    className={`flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-blue-50 cursor-pointer rounded transition-colors ${activeFile === 'models-folder' ? 'bg-blue-100' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); toggleFolder('models'); setActiveFile('models-folder'); }}
                                >
                                    <ChevronRight className={`w-3 h-3 transition-transform ${expandedFolders.includes('models') ? 'rotate-90' : ''}`} />
                                    <Folder className="w-4 h-4 text-blue-400 fill-current" />
                                    <span>models</span>
                                </div>
                                {expandedFolders.includes('models') && (
                                    <div className="ml-5 border-l border-gray-200">
                                        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 cursor-pointer rounded" onClick={(e) => { e.stopPropagation(); showToast('📄 weights.pt'); }}>
                                            <File className="w-4 h-4 text-gray-400" />
                                            <span>weights.pt</span>
                                        </div>
                                    </div>
                                )}

                                {/* Files */}
                                {files.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer rounded transition-colors mt-1 ${activeFile === file.name ? 'bg-blue-100 border-r-2 border-blue-500' : 'text-gray-600 hover:bg-blue-50'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveFile(file.name);
                                            // 尝试打开存在的页签或展示提示
                                            if (tabs.some(t => t.id === file.name)) {
                                                setActiveTabId(file.name);
                                            } else {
                                                showToast(`📄 ${file.name}`);
                                            }
                                        }}
                                    >
                                        <div className="w-3 h-3"></div>
                                        {file.type === 'notebook' && <FileCode className="w-4 h-4 text-orange-500" />}
                                        {file.type === 'json' && <FileJson className="w-4 h-4 text-gray-400" />}
                                        {file.type === 'code' && <Code2 className="w-4 h-4 text-yellow-600" />}
                                        {file.type === 'markdown' && <FileCode className="w-4 h-4 text-blue-500" />}
                                        <span className={`truncate ${activeFile === file.name ? 'text-blue-700 font-medium' : ''}`}>{file.name}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col p-4 bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold uppercase text-gray-500">{activeSideTab.toUpperCase()}</span>
                                <X className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => setActiveSideTab('file')} />
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-2">
                                {activeSideTab === 'search' && <Search className="w-10 h-10 opacity-20" />}
                                {activeSideTab === 'data' && <Database className="w-10 h-10 opacity-20" />}
                                {activeSideTab === 'terminal' && <TerminalIcon className="w-10 h-10 opacity-20" />}
                                {activeSideTab === 'settings' && <Settings className="w-10 h-10 opacity-20" />}
                                <span className="text-xs">暂无{activeSideTab === 'search' ? '搜索结果' : '数据连接'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 内容编辑区 */}
                <div className="flex-1 flex flex-col bg-[#e5e5e5]">
                    {/* 内容编辑区 */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden">
                        {/* Tabs Bar */}
                        <div className="h-9 bg-[#dadada] flex items-center overflow-x-auto no-scrollbar border-b border-gray-300">
                            {tabs.map((tab) => (
                                <div
                                    key={tab.id}
                                    onClick={() => setActiveTabId(tab.id)}
                                    className={`h-full px-4 border-r border-gray-300 flex items-center gap-2 text-xs cursor-pointer transition-colors relative min-w-[120px] max-w-[200px] group
                                    ${activeTabId === tab.id ? 'bg-white border-t-2 border-t-blue-500 z-10' : 'text-gray-500 hover:bg-[#e0e0e0]'}`}
                                >
                                    <div className="flex-shrink-0">
                                        {tab.icon || (tab.type === 'launcher' ? <Layout className="w-3.5 h-3.5 text-blue-500" /> : <TerminalIcon className="w-3.5 h-3.5" />)}
                                    </div>
                                    <span className="truncate flex-1">{tab.title}</span>
                                    <X
                                        className="w-3 h-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => handleCloseTab(tab.id, e)}
                                    />
                                </div>
                            ))}
                            {/* Tab Bar "+" Button - Requested by user */}
                            <div
                                onClick={(e) => { e.stopPropagation(); handleAddTab(); }}
                                className="h-full px-3 flex items-center justify-center hover:bg-[#e0e0e0] cursor-pointer text-gray-600 active:scale-90 transition-all border-r border-gray-300"
                                title="New Tab"
                            >
                                <Plus className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Content Area Rendering based on tab type */}
                        <div className="flex-1 overflow-hidden relative">
                            {tabs.find(t => t.id === activeTabId)?.type === 'launcher' ? (
                                <div className="absolute inset-0 bg-[#f3f3f3] overflow-y-auto p-12 select-none">
                                    <div className="max-w-4xl mx-auto space-y-12">
                                        {/* Launcher Header */}
                                        <div className="border-b border-gray-300 pb-2">
                                            <h1 className="text-xl font-light text-gray-800">Launcher</h1>
                                        </div>

                                        {/* Notebook Section */}
                                        <section>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-4 h-4 bg-[#F37626] rounded-sm flex items-center justify-center text-white text-[8px]">N</div>
                                                <h2 className="text-sm font-bold text-gray-600">Notebook</h2>
                                            </div>
                                            <div className="flex flex-wrap gap-x-6 gap-y-8">
                                                {[
                                                    { name: 'Python (Pyodide)', icon: <div className="text-[#3776ab] font-bold text-lg">PY</div>, color: 'hover:border-[#3776ab]/50' },
                                                    { name: 'C++23', icon: <div className="text-[#00599c] font-bold text-lg">C++</div>, color: 'hover:border-[#00599c]/50' },
                                                    { name: 'C23', icon: <div className="text-[#a8b9cc] font-bold text-lg">C</div>, color: 'hover:border-[#a8b9cc]/50' },
                                                    { name: 'Python 3.13 (XPython)', icon: <div className="text-[#ffde57] font-bold text-lg">PY</div>, color: 'hover:border-yellow-400/50' },
                                                    { name: 'R 4.5.1 (xr)', icon: <div className="text-[#276dc3] font-bold text-lg">R</div>, color: 'hover:border-[#276dc3]/50' }
                                                ].map((tool, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => handleLauncherAction(tool.name, 'notebook')}
                                                        className={`w-28 min-h-[112px] bg-white border border-transparent shadow-sm rounded flex flex-col items-center justify-start p-3 gap-2 cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95 ${tool.color}`}
                                                    >
                                                        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center border border-gray-100 rounded bg-gray-50 mb-1">
                                                            {tool.icon}
                                                        </div>
                                                        <span className="text-[10px] text-center px-1 text-gray-600 leading-tight w-full break-words">{tool.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* Console Section */}
                                        <section>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-4 h-4 bg-[#2196F3] rounded-sm flex items-center justify-center text-white text-[8px]">C</div>
                                                <h2 className="text-sm font-bold text-gray-600">Console</h2>
                                            </div>
                                            <div className="flex flex-wrap gap-x-6 gap-y-8">
                                                {['Python (Pyodide)', 'C++23'].map((name, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => handleLauncherAction(`${name} Console`, 'terminal')}
                                                        className="w-28 min-h-[112px] bg-white border border-transparent shadow-sm rounded flex flex-col items-center justify-start p-3 gap-2 cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95 hover:border-blue-400/50"
                                                    >
                                                        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center border border-gray-100 rounded bg-gray-50 mb-1 text-blue-500 font-bold text-lg">
                                                            {name.includes('Python') ? 'PY' : 'C++'}
                                                        </div>
                                                        <span className="text-[10px] text-center px-1 text-gray-600 leading-tight w-full break-words">{name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* Other Section */}
                                        <section>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-4 h-4 bg-gray-600 rounded-sm flex items-center justify-center text-white text-[8px]">$_</div>
                                                <h2 className="text-sm font-bold text-gray-600">Other</h2>
                                            </div>
                                            <div className="flex flex-wrap gap-x-6 gap-y-8">
                                                {[
                                                    { name: 'Terminal', icon: <TerminalIcon className="w-6 h-6 text-gray-700" />, action: () => handleLauncherAction('Terminal', 'terminal') },
                                                    { name: 'Text File', icon: <File className="w-6 h-6 text-gray-500" />, action: () => handleLauncherAction('Untitled', 'code') },
                                                    { name: 'Markdown File', icon: <FileCode className="w-6 h-6 text-blue-500" />, action: () => handleLauncherAction('README', 'markdown') },
                                                    { name: 'Python File', icon: <Code2 className="w-6 h-6 text-yellow-600" />, action: () => handleLauncherAction('Script', 'code') }
                                                ].map((tool, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => tool.action()}
                                                        className="w-28 min-h-[112px] bg-white border border-transparent shadow-sm rounded flex flex-col items-center justify-start p-3 gap-2 cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95 hover:border-gray-300"
                                                    >
                                                        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center border border-gray-100 rounded bg-gray-50 mb-1">
                                                            {tool.icon}
                                                        </div>
                                                        <span className="text-[10px] text-center px-1 text-gray-600 leading-tight w-full break-words">{tool.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            ) : tabs.find(t => t.id === activeTabId)?.type === 'terminal' ? (
                                /* Mock Terminal View */
                                <div className="absolute inset-0 bg-[#1e1e1e] flex flex-col p-4 font-mono text-sm text-gray-300 overflow-hidden select-text">
                                    <div className="flex-1 overflow-y-auto space-y-1">
                                        <p className="text-green-500 font-bold mb-2">Welcome to JupyterLab Virtual Terminal</p>
                                        <p className="text-gray-500 mb-4">Instance: compute-node-a100-01 (ready)</p>
                                        <div className="space-y-1">
                                            <p><span className="text-blue-400">root@notebook</span>:<span className="text-yellow-400">~</span># ls -la</p>
                                            <p>total 24</p>
                                            <p>drwxr-xr-x  5 root root 4096 Jan 22 14:05 .</p>
                                            <p>drwxr-xr-x 20 root root 4096 Jan 22 14:00 ..</p>
                                            <p>-rw-r--r--  1 root root  220 Jan 22 14:05 defect_detection.ipynb</p>
                                            <p>drwxr-xr-x  2 root root 4096 Jan 22 14:05 data</p>
                                            <p>drwxr-xr-x  2 root root 4096 Jan 22 14:05 models</p>
                                            <p><span className="text-blue-400">root@notebook</span>:<span className="text-yellow-400">~</span># <span className="animate-pulse">_</span></p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Notebook View (The existing mockup code) */
                                <div className="absolute inset-0 flex flex-col bg-white overflow-hidden">
                                    {/* Notebook Toolbar */}
                                    <div className="h-9 bg-white border-b border-gray-200 flex items-center px-4 space-x-4 relative z-[1003]">
                                        <div className="flex items-center space-x-3 text-gray-600">
                                            <span title="保存" onClick={(e) => { e.stopPropagation(); handleSave(); }} className="cursor-pointer hover:text-blue-600 active:scale-90 transition-all"><Save className="w-4 h-4" /></span>
                                            <span title="添加单元格" onClick={(e) => { e.stopPropagation(); handleAddCell(); }} className="cursor-pointer hover:text-blue-600 active:scale-90 transition-all"><Plus className="w-4 h-4" /></span>
                                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                            <span title="运行" onClick={(e) => { e.stopPropagation(); handleRun(); }} className={`cursor-pointer hover:text-green-600 active:scale-90 transition-all ${isExecuting ? 'text-green-500 animate-pulse' : ''}`}><Play className="w-4 h-4" /></span>
                                            <span title="停止" onClick={(e) => { e.stopPropagation(); handleStop(); }} className="cursor-pointer hover:text-red-500 active:scale-90 transition-all"><Square className="w-4 h-4" /></span>
                                            <span title="重启内核" onClick={(e) => { e.stopPropagation(); handleRestartKernel(); }} className={`cursor-pointer hover:text-blue-600 active:scale-90 transition-all ${kernelStatus === 'restarting' ? 'animate-spin text-blue-500' : ''}`}><RefreshCw className="w-4 h-4" /></span>
                                        </div>
                                        <div className="w-px h-4 bg-gray-300"></div>
                                        <div className="flex items-center gap-2">
                                            <select className="text-xs border rounded px-1 py-0.5 bg-gray-50 focus:outline-none cursor-pointer" onChange={(e) => showToast(`切换为 ${e.target.value}`)}>
                                                <option>Code</option>
                                                <option>Markdown</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Notebook Content */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-[13px] select-text">
                                        {/* Cell 1 */}
                                        <div className="flex gap-4 group">
                                            <div className="w-12 text-right text-gray-400 py-2 select-none">In [1]:</div>
                                            <div className="flex-1 bg-gray-50 border border-gray-300 rounded p-2 focus-within:border-blue-500 transition-colors">
                                                <div className="text-blue-600 font-bold">import</div> <span className="text-gray-800">torch</span><br />
                                                <div className="text-blue-600 font-bold">import</div> <span className="text-gray-800">torch.nn</span> <div className="text-blue-600 font-bold">as</div> <span className="text-gray-800">nn</span><br />
                                                <div className="text-blue-600 font-bold">import</div> <span className="text-gray-800">pandas</span> <div className="text-blue-600 font-bold">as</div> <span className="text-gray-800">pd</span><br />
                                                <br />
                                                <span className="text-gray-500"># 检查 GPU 可用性</span><br />
                                                <span className="text-gray-800">device = torch.device(</span><span className="text-green-600">"cuda"</span> <div className="text-blue-600 font-bold">if</div> <span className="text-gray-800">torch.cuda.is_available()</span> <div className="text-blue-600 font-bold">else</div> <span className="text-green-600">"cpu"</span><span className="text-gray-800">)</span><br />
                                                <span className="text-gray-800">print(f</span><span className="text-green-600">"Using device: {'{'}device{'}'}"</span><span className="text-gray-800">)</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 p-2 text-xs text-gray-600">Using device: cuda:0 (NVIDIA A100-SXM4-40GB)</div>

                                        {/* Cell 2 */}
                                        <div className="flex gap-4 group">
                                            <div className="w-12 text-right text-gray-400 py-2 select-none">In [2]:</div>
                                            <div className="flex-1 bg-gray-50 border border-gray-300 rounded p-2">
                                                <span className="text-gray-500"># 模拟模型训练循环</span><br />
                                                <div className="text-blue-600 font-bold">for</div> <span className="text-gray-800">epoch</span> <div className="text-blue-600 font-bold">in</div> <span className="text-gray-800">range(1, 11):</span><br />
                                                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-gray-800">loss = simulate_train_step(epoch)</span><br />
                                                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-gray-800">print(f</span><span className="text-green-600">"Epoch {'{'}epoch{'}'}: Loss={'{'}loss:.4f{'}'}"</span><span className="text-gray-800">)</span>
                                            </div>
                                        </div>

                                        {/* Cell 2 Output with Progress Bar */}
                                        <div className="flex gap-4">
                                            <div className="w-12 text-right text-gray-400 py-2 select-none italic text-[10px]">Out [2]:</div>
                                            <div className="flex-1 bg-white border border-gray-200 rounded p-4 shadow-inner">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Beaker className="w-5 h-5 text-blue-500" />
                                                    <span className="font-bold text-gray-700 text-sm">模型训练进度</span>
                                                    <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                                                        <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                    <span className="text-xs font-mono w-10">{progress}%</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <BarChart3 className="w-4 h-4 text-blue-600" />
                                                            <span className="text-xs font-bold text-blue-800">Loss Curve</span>
                                                        </div>
                                                        <div className="h-20 bg-white rounded border border-blue-100 flex items-end p-1 gap-1">
                                                            {[0.8, 0.6, 0.45, 0.38, 0.32, 0.28, 0.25, 0.22, 0.20, 0.18].map((v, i) => (
                                                                <div key={i} className="flex-1 bg-blue-400 rounded-t" style={{ height: `${v * 100}%`, opacity: (i / 10) + 0.3 }}></div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="bg-green-50 p-3 rounded border border-green-100">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                            <span className="text-xs font-bold text-green-800">Accuracy Summary</span>
                                                        </div>
                                                        <div className="space-y-1 text-xs">
                                                            <div className="flex justify-between"><span className="text-gray-500">Val:</span> <span className="font-bold text-green-600">94.2%</span></div>
                                                            <div className="flex justify-between"><span className="text-gray-500">Test:</span> <span className="font-bold text-green-600">93.8%</span></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 关闭确认弹窗 */}
            {
                showCloseConfirm && (
                    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center animate-in fade-in duration-150">
                        <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 animate-in zoom-in-95 duration-200">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">停止 Notebook 实例</h3>
                                    <div className="text-sm text-gray-500">
                                        <p>Notebook 停止后：</p>
                                        <p>/home/ma-user/work 目录下的数据会保存，其余目录下内容会被清理。</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowCloseConfirm(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border-none cursor-pointer"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleConfirmClose}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors border-none cursor-pointer"
                                >
                                    确认停止
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}


/**
 * SSH 终端仿真界面组件
 */
export function SSHRootTerminalMock({ onClose, instanceName }: { onClose: () => void, instanceName: string }) {
    const [history, setHistory] = useState<string[]>([
        'Last login: Mon Jan 22 09:30:15 2024 from 192.168.1.15',
        'Welcome to LimiX Notebook Compute node.',
        '-------------------------------------------------------',
        'Instance: NB-202401 (缺陷检测模型开发)',
        'Resources: NVIDIA A100-SXM4-40GB x 1 | 12 vCPU | 64GB',
        'Mapping Path: /workspace/projects (Mounted)',
        '-------------------------------------------------------',
        ''
    ]);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleInput = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const cmd = input.trim().toLowerCase();
            const newHistory = [...history, `root@notebook:~# ${input}`];

            if (cmd === 'ls') {
                newHistory.push('data  models  notebooks  scripts  README.md');
            } else if (cmd === 'nvidia-smi') {
                newHistory.push('+-----------------------------------------------------------------------------+');
                newHistory.push('| NVIDIA-SMI 535.104.05   Driver Version: 535.104.05   CUDA Version: 12.2     |');
                newHistory.push('|-------------------------------+----------------------+----------------------+');
                newHistory.push('| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |');
                newHistory.push('| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |');
                newHistory.push('|                               |                      |               MIG M. |');
                newHistory.push('|===============================+======================+======================|');
                newHistory.push('|   0  NVIDIA A100-SXM...  On   | 00000000:00:04.0 Off |                    0 |');
                newHistory.push('| N/A   32C    P0    52W / 400W |  15242MiB / 40960MiB |     42%      Default |');
                newHistory.push('|                               |                      |             Disabled |');
                newHistory.push('+-------------------------------+----------------------+----------------------+');
            } else if (cmd === 'df -h') {
                newHistory.push('Filesystem      Size  Used Avail Use% Mounted on');
                newHistory.push('/dev/vda1        50G  4.2G   46G   9% /');
                newHistory.push('projects        5.0T  2.1T  2.9T  42% /workspace/projects');
            } else if (cmd === 'help') {
                newHistory.push('Available commands: ls, nvidia-smi, df -h, echo, help, clear');
            } else if (cmd === 'clear') {
                setHistory([]);
                setInput('');
                return;
            } else if (cmd !== '') {
                newHistory.push(`-bash: ${cmd}: command not found`);
            }

            setHistory(newHistory);
            setInput('');
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8 animate-in fade-in duration-200" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-4xl rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col overflow-hidden h-[600px]" style={{ backgroundColor: '#09090b' }}>
                {/* 终端标题栏 */}
                <div className="px-4 h-10 flex items-center justify-between border-b border-white/5" style={{ backgroundColor: '#18181b' }}>
                    <div className="flex items-center gap-2">
                        <TerminalIcon className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-mono" style={{ color: '#a1a1aa' }}>root@notebook: ~ (SSH) - {instanceName}</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500/20"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/20"></div>
                        <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors shadow-[0_0_8px_rgba(239,68,68,0.4)]"></button>
                    </div>
                </div>

                {/* 终端内容区 */}
                <div className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700" style={{ color: '#e4e4e7' }}>
                    <div className="space-y-1">
                        {history.map((line, i) => (
                            <div key={i} className="whitespace-pre-wrap">{line}</div>
                        ))}
                    </div>

                    <div className="flex mt-1">
                        <span className="text-green-400 shrink-0">root@notebook:~#&nbsp;</span>
                        <input
                            autoFocus
                            className="flex-1 bg-transparent border-none outline-none"
                            style={{ color: '#fafafa' }}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleInput}
                        />
                    </div>
                    <div ref={bottomRef} className="h-4"></div>
                </div>

                {/* 底部提示 */}
                <div className="px-4 py-1.5 flex items-center gap-4 text-[10px] border-t border-white/5" style={{ backgroundColor: 'rgba(24, 24, 27, 0.5)', color: '#71717a' }}>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Latency: 12ms</span>
                    <span className="flex items-center gap-1"><Layout className="w-3 h-3" /> Buffer: 2MB</span>
                    <span className="ml-auto text-blue-400/80 transition-opacity">Tip: Type 'nvidia-smi' or 'help'</span>
                </div>
            </div>
        </div>
    );
}
