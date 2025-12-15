import React, { useEffect, useRef, useState } from 'react';
import { Modal } from 'antd';
import '../styles/floatingAssistant.css';

interface FloatingAssistantEntryProps {
  // 当提供该回调时，点击悬浮入口将触发同一个“智能助手”全屏页面（与右上角按钮一致）
  onOpenAIAssistant?: () => void;
}

// 全局悬浮动态助手入口
const FloatingAssistantEntry: React.FC<FloatingAssistantEntryProps> = ({ onOpenAIAssistant }) => {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [idleTick, setIdleTick] = useState(0);
  const idleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // 初始滑入 + 淡入
    const t = window.setTimeout(() => setMounted(true), 50);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    // 闲置状态：每30秒执行一次上下浮动10px（2秒动画）
    const startIdleCycle = () => {
      if (idleTimerRef.current) window.clearInterval(idleTimerRef.current);
      idleTimerRef.current = window.setInterval(() => {
        setIdleTick((n) => n + 1);
      }, 30000);
    };
    startIdleCycle();
    return () => {
      if (idleTimerRef.current) window.clearInterval(idleTimerRef.current);
    };
  }, []);

  const containerClass = [
    'floating-assistant-container',
    mounted ? 'fade-slide-in' : '',
    idleTick > 0 ? 'idle-float-once' : '',
  ].join(' ');

  return (
    <>
      <div
        className={containerClass}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => {
          // 优先走统一入口（与右上角按钮一致）
          if (onOpenAIAssistant) {
            onOpenAIAssistant();
          } else {
            // 兜底：如果未传入统一入口，则使用占位弹窗
            setOpen(true);
          }
        }}
        role="button"
        aria-label="打开AI助手"
      >
        {hover && (
          <div className="assistant-tooltip" aria-hidden>
            点击唤起AI助手
          </div>
        )}
        <div className={`assistant-button ${hover ? 'is-hover' : ''}`}>
          {/* Font Awesome 机器人图标 */}
          <i className="fa-solid fa-robot assistant-icon" />
        </div>
      </div>

      {/* 兜底弹窗：仅当未传入统一入口回调时才会显示 */}
      {!onOpenAIAssistant && (
        <Modal
          title="AI助手"
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
          centered
        >
          <div style={{ padding: '8px 2px' }}>正在加载助手...</div>
        </Modal>
      )}
    </>
  );
};

export default FloatingAssistantEntry;