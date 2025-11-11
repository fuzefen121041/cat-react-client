import { useState, useRef, useEffect } from 'react';
import './ChatPage.css';
import { simpleConsultation, fileToBase64, validateImageFile } from '../services/api';
import type { ChatMessage, ConsultationType } from '../types/api';

function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<ConsultationType>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证图片
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setSelectedImage(file);

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 清除图片
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 发送消息
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!input.trim() && !selectedImage) || isLoading) return;

    // 创建用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || '(发送了一张图片)',
      timestamp: new Date(),
      imageUrl: imagePreview || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 准备请求数据
      let imageBase64: string | undefined;
      if (selectedImage) {
        imageBase64 = await fileToBase64(selectedImage);
      }

      // 调用 API
      const response = await simpleConsultation({
        consultationType,
        additionalNotes: userMessage.content,
        imageBase64,
      });

      if (response.success && response.report) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.report.text,
          timestamp: new Date(response.report.timestamp),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.error || '未知错误');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，发生了错误: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      clearImage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    clearImage();
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1>🐱 猫咪健康咨询 AI</h1>
        <button onClick={clearChat} className="clear-btn">
          清空对话
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h2>欢迎使用猫咪健康咨询 AI！</h2>
            <p>我可以帮助您解答关于猫咪的各种问题：</p>
            <ul>
              <li>🏥 健康咨询 - 疾病症状、健康评估</li>
              <li>🍽️ 营养建议 - 饮食搭配、喂养指导</li>
              <li>🎯 行为理解 - 行为分析、训练建议</li>
              <li>📚 品种识别 - 上传图片识别品种</li>
            </ul>
            <p className="tip">💡 提示：您可以上传猫咪图片进行更准确的咨询</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role}`}
          >
            <div className="message-avatar">
              {message.role === 'user' ? '👤' : '🐱'}
            </div>
            <div className="message-content">
              {message.imageUrl && (
                <div className="message-image">
                  <img src={message.imageUrl} alt="上传的图片" />
                </div>
              )}
              <div className="message-text">{message.content}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">🐱</div>
            <div className="message-content">
              <div className="message-text loading">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 咨询类型选择 */}
      <div className="consultation-type">
        <label>咨询类型：</label>
        <select
          value={consultationType}
          onChange={(e) => setConsultationType(e.target.value as ConsultationType)}
          disabled={isLoading}
        >
          <option value="general">综合咨询</option>
          <option value="health">健康咨询</option>
          <option value="nutrition">营养咨询</option>
          <option value="behavior">行为咨询</option>
        </select>
      </div>

      {/* 图片预览 */}
      {imagePreview && (
        <div className="image-preview-container">
          <div className="image-preview">
            <img src={imagePreview} alt="预览" />
            <button onClick={clearImage} className="remove-image-btn">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 输入表单 */}
      <form onSubmit={sendMessage} className="chat-input-form">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="upload-btn"
          disabled={isLoading}
          title="上传图片"
        >
          📷
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入您的问题，或上传猫咪图片..."
          className="chat-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={isLoading || (!input.trim() && !selectedImage)}
        >
          发送
        </button>
      </form>
    </div>
  );
}

export default ChatPage;
