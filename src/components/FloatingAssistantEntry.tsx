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

  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: window.innerHeight / 2 - 32 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMoved, setIsMoved] = useState(false); // 用于区分点击和拖拽
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初始位置：靠右垂直居中
    setPosition({ x: window.innerWidth - 48, y: window.innerHeight / 2 - 32 });
    const t = window.setTimeout(() => setMounted(true), 50);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
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

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    setIsMoved(false);
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y
    });
  };

  // 处理拖拽过程
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const newX = clientX - dragStart.x;
      const newY = clientY - dragStart.y;

      // 边界检查
      const boundedX = Math.max(0, Math.min(window.innerWidth - 48, newX));
      const boundedY = Math.max(0, Math.min(window.innerHeight - 64, newY));

      if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
        setIsMoved(true);
      }

      setPosition({ x: boundedX, y: boundedY });
    };

    const handleEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);

      // 自动吸附逻辑：根据位置坐标吸附到左侧或右侧
      const screenWidth = window.innerWidth;
      const targetX = position.x > screenWidth / 2 ? screenWidth - 48 : 0;
      setPosition(prev => ({ ...prev, x: targetX }));
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragStart, position]);

  const containerClass = [
    'floating-assistant-container',
    mounted ? 'fade-slide-in' : '',
    idleTick > 0 && !isDragging ? 'idle-float-once' : '',
    isDragging ? 'is-dragging' : ''
  ].join(' ');

  // 根据吸附边缘调整圆角样式
  const isAtRight = position.x > window.innerWidth / 2;
  const buttonStyle: React.CSSProperties = {
    borderRadius: isAtRight ? '32px 0 0 32px' : '0 32px 32px 0',
    paddingRight: isAtRight ? '4px' : '0',
    paddingLeft: isAtRight ? '0' : '4px'
  };

  return (
    <>
      <div
        ref={containerRef}
        className={containerClass}
        style={{
          left: position.x,
          top: position.y,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onClick={(e) => {
          // 如果拖拽位移较小，视为点击
          if (!isMoved) {
            if (onOpenAIAssistant) {
              onOpenAIAssistant();
            } else {
              setOpen(true);
            }
          }
        }}
        role="button"
        aria-label="打开AI助手"
      >
        {hover && !isDragging && (
          <div className="assistant-tooltip" style={{ right: isAtRight ? '60px' : 'auto', left: isAtRight ? 'auto' : '60px' }}>
            点击唤起AI助手 (按住可拖动)
          </div>
        )}
        <div className={`assistant-button ${hover ? 'is-hover' : ''}`} style={buttonStyle}>
          {/* 恢复机器人图标 */}
          <i className="fa-solid fa-robot assistant-icon" />
        </div>
      </div>

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