import React, { useEffect, useRef, useState } from 'react';
import {
  AppstoreAddOutlined,
  CloudUploadOutlined,
  CommentOutlined,
  CopyOutlined,
  DeleteOutlined,
  DislikeOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileSearchOutlined,
  HeartOutlined,
  LikeOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ProductOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  ScheduleOutlined,
  ShareAltOutlined,
  SmileOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import {
  Attachments,
  Bubble,
  Conversations,
  Prompts,
  Sender,
  Welcome,
} from '@ant-design/x';
import { Avatar, Button, Space, Spin, message } from 'antd';
import CSVAnalysisDemo from './CSVAnalysisDemo';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import { useLanguage } from '../i18n/LanguageContext';

const DEFAULT_CONVERSATIONS_ITEMS = [
  {
    key: 'default-0',
    label: 'limix智能助手介绍',
    group: '今天',
  },
  {
    key: 'default-1',
    label: '如何创建新项目？',
    group: '今天',
  },
  {
    key: 'default-2',
    label: '团队协作最佳实践',
    group: '昨天',
  },
];

const HOT_TOPICS = {
  key: '1',
  label: '热门话题',
  children: [
    {
      key: '1-1',
      description: '项目管理系统有哪些新功能？',
      icon: <span style={{ color: '#f93a4a', fontWeight: 700 }}>1</span>,
    },
    {
      key: '1-2',
      description: '如何高效管理团队项目？',
      icon: <span style={{ color: '#ff6565', fontWeight: 700 }}>2</span>,
    },
    {
      key: '1-3',
      description: '数据分析和报告功能介绍',
      icon: <span style={{ color: '#ff8f1f', fontWeight: 700 }}>3</span>,
    },
    {
      key: '1-4',
      description: '探索AI驱动的项目管理新范式',
      icon: <span style={{ color: '#00000040', fontWeight: 700 }}>4</span>,
    },
    {
      key: '1-5',
      description: '如何快速上手系统功能？',
      icon: <span style={{ color: '#00000040', fontWeight: 700 }}>5</span>,
    },
  ],
};

const DESIGN_GUIDE = {
  key: '2',
  label: '功能指南',
  children: [
    {
      key: '2-1',
      icon: <HeartOutlined />,
      label: '项目创建',
      description: '快速创建和配置新项目',
    },
    {
      key: '2-2',
      icon: <SmileOutlined />,
      label: '团队管理',
      description: '管理团队成员和权限',
    },
    {
      key: '2-3',
      icon: <CommentOutlined />,
      label: '任务协作',
      description: '高效的任务分配和跟踪',
    },
    {
      key: '2-4',
      icon: <PaperClipOutlined />,
      label: '数据分析',
      description: '项目数据可视化和报告',
    },
  ],
};

const SENDER_PROMPTS = [
  {
    key: '1',
    description: '项目管理',
    icon: <ScheduleOutlined />,
  },
  {
    key: '2',
    description: '团队协作',
    icon: <ProductOutlined />,
  },
  {
    key: '3',
    description: '数据分析',
    icon: <FileSearchOutlined />,
  },
  {
    key: '4',
    description: '系统帮助',
    icon: <AppstoreAddOutlined />,
  },
];

const useStyle = createStyles(({ token, css }) => {
  return {
    layout: css`
      width: 100%;
      min-width: 1000px;
      height: 100vh;
      display: flex;
      background: ${token.colorBgContainer};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `,
    sider: css`
      background: ${token.colorBgLayout}80;
      width: 280px;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0 12px;
      box-sizing: border-box;
    `,
    logo: css`
      display: flex;
      align-items: center;
      justify-content: start;
      padding: 0 24px;
      box-sizing: border-box;
      gap: 8px;
      margin: 24px 0;

      span {
        font-weight: bold;
        color: ${token.colorText};
        font-size: 16px;
      }
    `,
    addBtn: css`
      background: #1677ff0f;
      border: 1px solid #1677ff34;
      height: 40px;
    `,
    conversations: css`
      flex: 1;
      overflow-y: auto;
      margin-top: 12px;
      padding: 0;

      .ant-conversations-list {
        padding-inline-start: 0;
      }
    `,
    siderFooter: css`
      border-top: 1px solid ${token.colorBorderSecondary};
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `,
    chat: css`
      height: 100%;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      padding-block: ${token.paddingLG}px;
      gap: 16px;
    `,
    closeBtn: css`
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 1000;
    `,
    chatPrompt: css`
      .ant-prompts-label {
        color: #000000e0 !important;
      }
      .ant-prompts-desc {
        color: #000000a6 !important;
        width: 100%;
      }
      .ant-prompts-icon {
        color: #000000a6 !important;
      }
    `,
    chatList: css`
      flex: 1;
      overflow: auto;
    `,
    loadingMessage: css`
      background-image: linear-gradient(90deg, #ff6b23 0%, #af3cb8 31%, #53b6ff 89%);
      background-size: 100% 2px;
      background-repeat: no-repeat;
      background-position: bottom;
    `,
    placeholder: css`
      padding-top: 32px;
    `,
    sender: css`
      width: 100%;
      max-width: 700px;
      margin: 0 auto;
    `,
    speechButton: css`
      font-size: 18px;
      color: ${token.colorText} !important;
    `,
    senderPrompt: css`
      width: 100%;
      max-width: 700px;
      margin: 0 auto;
      color: ${token.colorText};
    `,
  };
});

interface GlobalAIAssistantProps {
  onClose?: () => void;
}

const GlobalAIAssistant: React.FC<GlobalAIAssistantProps> = ({ onClose }) => {
  // i18n
  const { t } = useLanguage();
  const { styles } = useStyle();
  const abortController = useRef<AbortController | null>(null);
  const replyTimerRef = useRef<number | null>(null);
  
  // ==================== State ====================
  const [messageHistory, setMessageHistory] = useState<Record<string, any[]>>({});
  const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS_ITEMS);
  const [curConversation, setCurConversation] = useState(DEFAULT_CONVERSATIONS_ITEMS[0].key);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');

  // ==================== Runtime（前端原型：使用模拟数据，不触发后端/网络请求） ====================
  // 不使用 useXAgent / useXChat，改为本地状态管理消息，避免配置校验导致运行时错误
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAnalysisDemo, setShowAnalysisDemo] = useState(false);

  // ==================== Event ====================
  /**
   * 构建基于关键字的本地模拟回复文本（原型演示，不触发网络请求）。
   * @param input 用户输入的文本内容
   * @returns 返回本地化后的回复文本（string）
   */
  const buildMockReply = (input: string): string => {
    const lower = input.toLowerCase();
    if (lower.includes('项目') || lower.includes('project')) {
        return t('assistant.quick.project.plan');
    }
    if (lower.includes('团队') || lower.includes('协作')) {
        return t('assistant.quick.collaboration.plan');
    }
    if (lower.includes('数据') || lower.includes('分析')) {
        return t('assistant.quick.analysis.plan');
    }
    if (lower.includes('帮助') || lower.includes('使用')) {
      return '系统使用指南：\n- 左侧导航进入看板/项目/数据/任务/模型/系统管理\n- 右上角「智能助手」为统一入口，支持多会话、上传附件与快捷提示\n- 任何页面均可唤起助手获取解释或生成报告\n需要我按你的需求生成一个「快速上手清单」吗？';
    }
        return t('assistant.reply.template').replace('${chatInput}', input);
  };

  /**
   * 发送用户输入并追加模拟助手回复。
   * @param val 当前输入框内容
   */
  const onSubmit = (val: string): void => {
    if (!val) return;
    if (loading) {
      message.error('助手正在响应中，请稍后再试或取消当前回复。');
      return;
    }
    // 追加用户消息
    setMessages([...(messages || []), { role: 'user', content: val }]);
    setLoading(true);
    // 模拟思考，再追加 AI 回复
    const timer = window.setTimeout(() => {
      const reply = buildMockReply(val);
      setMessages([...(messages || []), { role: 'user', content: val }, { role: 'assistant', content: reply }]);
      setLoading(false);
    }, 800);
    replyTimerRef.current = timer;
  };

  // ==================== Nodes ====================
  const chatSider = (
    <div className={styles.sider}>
      {/* Logo */}
      <div className={styles.logo}>
        <div style={{ 
          width: 24, 
          height: 24, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          AI
        </div>
            <span>{t('assistant.floating.title')}</span>
      </div>

      {/* 添加会话 */}
      <Button
        onClick={() => {
          // 当正在生成回复时，不允许切换来创建新会话
          if (loading) {
            message.error(t('assistant.replyInProgress.tip'));
            return;
          }
          const now = dayjs().valueOf().toString();
          setConversations([
            {
              key: now,
              label: `新对话 ${conversations.length + 1}`,
              group: '今天',
            },
            ...conversations,
          ]);
          setCurConversation(now);
          setMessages([]);
        }}
        type="link"
        className={styles.addBtn}
        icon={<PlusOutlined />}
      >
            {t('assistant.actions.newChat')}
      </Button>

      {/* 会话管理 */}
      <Conversations
        items={conversations}
        className={styles.conversations}
        activeKey={curConversation}
        onActiveChange={async (val: string) => {
          abortController.current?.abort();
          setTimeout(() => {
            setCurConversation(val);
            setMessages(messageHistory?.[val] || []);
          }, 100);
        }}
        groupable
        styles={{ item: { padding: '0 8px' } }}
        menu={(conversation: any) => ({
          items: [
            {
            label: t('common.rename'),
              key: 'rename',
              icon: <EditOutlined />,
            },
            {
            label: t('common.delete'),
              key: 'delete',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => {
                const newList = conversations.filter(item => item.key !== conversation.key);
                const newKey = newList?.[0]?.key;
                setConversations(newList);
                setTimeout(() => {
                  if (conversation.key === curConversation) {
                    setCurConversation(newKey);
                    setMessages(messageHistory?.[newKey] || []);
                  }
                }, 200);
              },
            },
          ],
        })}
      />

      <div className={styles.siderFooter}>
        <Avatar size={24} />
        <Button type="text" icon={<QuestionCircleOutlined />} />
      </div>
    </div>
  );

  const chatList = (
    <div className={styles.chatList}>
      {messages?.length ? (
        <>
          <Bubble.List
            items={messages || []}
            style={{ height: '100%', paddingInline: 'calc(calc(100% - 700px) /2)' }}
            roles={{
              assistant: {
                placement: 'start',
                footer: (
                  <div style={{ display: 'flex' }}>
                    <Button type="text" size="small" icon={<ReloadOutlined />} />
                    <Button type="text" size="small" icon={<CopyOutlined />} />
                    <Button type="text" size="small" icon={<LikeOutlined />} />
                    <Button type="text" size="small" icon={<DislikeOutlined />} />
                  </div>
                ),
                loadingRender: () => <Spin size="small" />,
              },
              user: { placement: 'end' },
            }}
          />
          {showAnalysisDemo && (
            <div style={{ paddingInline: 'calc(calc(100% - 700px) /2)' }}>
              <CSVAnalysisDemo onClose={() => setShowAnalysisDemo(false)} />
            </div>
          )}
        </>
      ) : (
        <Space
          direction="vertical"
          size={16}
          style={{ paddingInline: 'calc(calc(100% - 700px) /2)' }}
          className={styles.placeholder}
        >
          <Welcome
            variant="borderless"
            icon={
              <div style={{ 
                width: 48, 
                height: 48, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold'
              }}>
                AI
              </div>
            }
            title={t('assistant.welcome.title')}
            description={t('assistant.welcome.subtitle')}
            extra={
              <Space>
                <Button icon={<ShareAltOutlined />} />
                <Button icon={<EllipsisOutlined />} />
              </Space>
            }
          />
          <div style={{ display: 'flex', gap: 16 }}>
            <Prompts
              items={[HOT_TOPICS]}
              styles={{
                list: { height: '100%' },
                item: {
                  flex: 1,
                  backgroundImage: 'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
                  borderRadius: 12,
                  border: 'none',
                },
                subItem: { padding: 0, background: 'transparent' },
              }}
              onItemClick={(info: any) => {
                onSubmit(info.data.description);
              }}
              className={styles.chatPrompt}
            />

            <Prompts
              items={[DESIGN_GUIDE]}
              styles={{
                item: {
                  flex: 1,
                  backgroundImage: 'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
                  borderRadius: 12,
                  border: 'none',
                },
                subItem: { background: '#ffffffa6' },
              }}
              onItemClick={(info: any) => {
                // 点击“数据分析”展示 CSV 演示工作台，其它项走常规聊天流程
            if (
              info?.data?.label === t('assistant.quick.analysis') ||
              info?.data?.label === '数据分析' ||
              String(info?.data?.description || '').includes(t('assistant.quick.analysis')) ||
              String(info?.data?.description || '').includes('数据分析')
            ) {
                  setShowAnalysisDemo(true);
                } else {
                  onSubmit(info.data.description);
                }
              }}
              className={styles.chatPrompt}
            />
          </div>
          {showAnalysisDemo && (
            <div style={{ paddingInline: 'calc(calc(100% - 700px) /2)' }}>
              <CSVAnalysisDemo onClose={() => setShowAnalysisDemo(false)} />
            </div>
          )}
        </Space>
      )}
    </div>
  );

  const senderHeader = (
    <Sender.Header
            title={t('assistant.upload.title')}
      open={attachmentsOpen}
      onOpenChange={setAttachmentsOpen}
      styles={{ content: { padding: 0 } }}
    >
      <Attachments
        beforeUpload={() => false}
        items={attachedFiles}
        onChange={(info: any) => setAttachedFiles(info.fileList)}
        placeholder={(type) =>
          type === 'drop'
            ? { title: t('assistant.upload.dragHere') }
            : {
                icon: <CloudUploadOutlined />,
            title: t('assistant.upload.title'),
            description: t('assistant.upload.description'),
              }
        }
      />
    </Sender.Header>
  );

  const chatSender = (
    <>
      {/* 提示词 */}
      <Prompts
        items={SENDER_PROMPTS}
        onItemClick={(info: any) => {
          const text = String(info?.data?.description || '');
            if (text.includes('数据分析') || text.includes(t('assistant.quick.analysis'))) {
            setShowAnalysisDemo(true);
          } else {
            onSubmit(info.data.description);
          }
        }}
        styles={{
          item: { padding: '6px 12px' },
        }}
        className={styles.senderPrompt}
      />
      {/* 输入框 */}
      <Sender
        value={inputValue}
        header={senderHeader}
        onSubmit={() => {
          onSubmit(inputValue);
          setInputValue('');
        }}
        onChange={setInputValue}
        onCancel={() => {
          // 取消当前模拟回复
          if (replyTimerRef.current) {
            clearTimeout(replyTimerRef.current);
            replyTimerRef.current = null;
          }
          setLoading(false);
        }}
        prefix={
          <Button
            type="text"
            icon={<PaperClipOutlined style={{ fontSize: 18 }} />}
            onClick={() => setAttachmentsOpen(!attachmentsOpen)}
          />
        }
        loading={loading}
        className={styles.sender}
        allowSpeech
        actions={(_: any, info: any) => {
          const { SendButton, LoadingButton, SpeechButton } = info.components;
          return (
            <div style={{ display: 'flex', gap: 4 }}>
              <SpeechButton className={styles.speechButton} />
              {loading ? <LoadingButton type="default" /> : <SendButton type="primary" />}
            </div>
          );
        }}
            placeholder={t('assistant.input.placeholder')}
      />
    </>
  );

  useEffect(() => {
    // 历史记录模拟
    if (messages?.length) {
      setMessageHistory(prev => ({
        ...prev,
        [curConversation]: messages,
      }));
    }
  }, [messages, curConversation]);

  // ==================== Render =================
  return (
    <div className={styles.layout}>
      {/* 关闭按钮（统一入口的浮层可随时关闭）*/}
      {onClose && (
        <Button type="text" className={styles.closeBtn} icon={<CloseOutlined />} onClick={onClose} />
      )}
      {chatSider}
      <div className={styles.chat}>
        {chatList}
        {chatSender}
      </div>
    </div>
  );
};

export default GlobalAIAssistant;
