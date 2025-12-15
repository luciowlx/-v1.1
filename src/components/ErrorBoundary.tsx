import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// 简易错误边界，防止某些运行时异常导致整页崩溃
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // 增加类型声明以避免编辑器在缺少 React 类型定义时提示 state/props/setState 不存在
  declare props: Readonly<ErrorBoundaryProps>;
  declare state: Readonly<ErrorBoundaryState>;
  declare setState: React.Component<ErrorBoundaryProps, ErrorBoundaryState>['setState'];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // 输出详细错误到控制台便于定位
    console.error('[ErrorBoundary] 捕获到错误:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) return <>{fallback}</>;

      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6">
          <div className="max-w-xl w-full bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">助手组件加载失败</h2>
            <p className="text-sm text-gray-600 mb-4">发生了意外错误。您可以尝试刷新页面或稍后再试。</p>
            <div className="flex items-center justify-center gap-3">
              <button
                className="px-3 py-2 rounded bg-slate-800 text-white hover:bg-slate-700"
                onClick={() => window.location.reload()}
              >刷新页面</button>
              <button
                className="px-3 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
                onClick={this.reset}
              >重试</button>
            </div>
          </div>
        </div>
      );
    }

    return children as React.ReactElement;
  }
}

export default ErrorBoundary;