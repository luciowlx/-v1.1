import React, { useState, useEffect } from 'react';
import { Card, Button, message } from 'antd';
import { useTranslation } from 'react-i18next'; // 假设项目使用 i18n
// import styles from './Component.module.css'; // 如果使用 CSS Modules

interface MyComponentProps {
    title?: string;
    onAction?: () => void;
}

/**
 * MyComponent - [组件中文描述]
 * 
 * @param title 组件标题
 * @param onAction 点击操作回调
 */
const MyComponent: React.FC<MyComponentProps> = ({
    title = '默认标题',
    onAction
}) => {
    const [loading, setLoading] = useState(false);

    // 模拟异步操作
    const handleAction = async () => {
        setLoading(true);
        try {
            if (onAction) {
                await onAction();
            }
            message.success('操作成功');
        } catch (error) {
            console.error(error);
            message.error('操作失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title={title} className="w-full">
            <div className="flex flex-col gap-4">
                <p>组件内容区域...</p>

                <div className="flex justify-end">
                    <Button
                        type="primary"
                        loading={loading}
                        onClick={handleAction}
                    >
                        执行操作
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default MyComponent;
