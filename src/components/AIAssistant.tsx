import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, Trash2, HelpCircle, ArrowRight, CornerDownLeft } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIAssistantProps {
  themeMode: 'light' | 'dark';
  primaryColor: string;
  activeTab: string;
}

const PRESET_QUESTIONS = [
  { text: 'Cách sử dụng website uBox?', label: 'Cách sử dụng' },
  { text: 'Làm thế nào để upload file, ảnh, video?', label: 'Cách upload' },
  { text: 'Đổi tên hoặc yêu thích nhiều tệp cùng lúc?', label: 'Đổi tên hàng loạt' },
  { text: 'Xóa vĩnh viễn tệp trong thùng rác ra sao?', label: 'Xóa vĩnh viễn' }
];

export default function AIAssistant({ themeMode, primaryColor, activeTab }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'Xin chào! Tôi là **UBox AI**, trợ lý ảo đồng hành cùng bạn trên **UBox Cloud**. Tôi ở đây để hướng dẫn bạn tải lên, quản lý, đổi tên hàng loạt hoặc khôi phục/hoàn tác dữ liệu từ thùng rác. \n\nBạn có thể thử click vào các **câu hỏi gợi ý có sẵn** ở bên dưới hoặc gõ tin nhắn tự do nhé!'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDark = themeMode === 'dark';

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setErrorText(null);
    const userMessage: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Keep only last 10 messages for history context to stay fast & within token limits
      const chatHistory = messages.slice(-10);

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory,
          activeTab
        }),
      });

      if (!response.ok) {
        throw new Error('Không nhận được phản hồi chính xác từ máy chủ.');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [...prev, { role: 'model', text: data.text }]);
    } catch (err: any) {
      console.error('AI assistant error:', err);
      setErrorText(err.message || 'Có lỗi xảy ra khi kết nối trợ lý.');
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: '⚠️ **Đã xảy ra lỗi kết nối**. Vui lòng đảm bảo bạn đã cấu hình kho mật khẩu sinh trắc học hoặc `GEMINI_API_KEY` trong bối cảnh ứng dụng để khởi chạy trợ lý ảo nhé.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('Bạn muốn xóa toàn bộ lịch sử hội thoại với Trợ lý ảo?')) {
      setMessages([
        {
          role: 'model',
          text: 'Cuộc trò chuyện đã được làm mới! Bạn cần tôi hướng dẫn thao tác gì trên website uBox Cloud hôm nay?'
        }
      ]);
      setErrorText(null);
    }
  };

  // Basic Markdown inline converter for bold (**), code (`), line-breaks (\n)
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, i) => {
      // Check if it's a bullet item starting with "-" or "*"
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      let content = isBullet ? line.trim().substring(2) : line;

      // Handle bold text (**text**)
      const parts = [];
      let lastIndex = 0;
      const boldRegex = /\*\*(.*?)\*\*/g;
      let match;

      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-extrabold px-1 rounded" style={{ color: '#000000', backgroundColor: 'rgba(245, 158, 11, 0.2)', fontWeight: 800 }}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      // Render line
      if (isBullet) {
        return (
          <li key={i} className="ml-4 list-disc pl-1 text-[13px] leading-relaxed my-1" style={{ color: '#000000', fontWeight: 600 }}>
            {parts.length > 0 ? parts : content}
          </li>
        );
      } else {
        return (
          <p key={i} className="text-[13px] leading-relaxed my-1.5 min-h-[1px]" style={{ color: '#000000', fontWeight: 600 }}>
            {parts.length > 0 ? parts : content}
          </p>
        );
      }
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          id="ai-toggle-btn"
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: primaryColor }}
          className="flex items-center space-x-2 px-4 py-3 rounded-full text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer group animate-bounce-slow"
          title="Trợ lý hướng dẫn website"
        >
          <div className="relative">
            <Sparkles size={18} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-xs font-bold font-sans tracking-wide">Trợ lý UBox AI</span>
        </button>
      )}

      {/* Main Chat Box Container with transparent glassmorphism */}
      {isOpen && (
        <div 
          id="ai-chat-panel"
          className={`flex flex-col w-[350px] sm:w-[380px] h-[520px] rounded-2.5xl shadow-2xl border transition-all duration-300 overflow-hidden backdrop-blur-xl ${
            isDark 
              ? 'bg-neutral-950/75 border-neutral-800 text-neutral-100' 
              : 'bg-white/75 border-neutral-200 text-neutral-950'
          }`}
        >
          {/* Header */}
          <div 
            className="px-4 py-3.5 flex items-center justify-between border-b relative"
            style={{ 
              backgroundColor: isDark ? 'rgba(20, 20, 20, 0.45)' : 'rgba(255, 255, 255, 0.45)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
            }}
          >
            <div className="flex items-center space-x-2.5">
              <div 
                className="p-1.5 rounded-lg text-white flex items-center justify-center shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-[13px] tracking-wide">UBox Guide AI</span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" title="Online"></span>
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium font-sans">
                  Người hướng dẫn sử dụng website uBox
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={clearHistory}
                className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Làm mới cuộc trò chuyện"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
                title="Đóng bảng chat"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div 
            className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3 scrollbar-thin"
            style={{
              backgroundColor: 'transparent'
            }}
          >
            {messages.map((msg, index) => {
              const isAI = msg.role === 'model';
              return (
                <div 
                  key={index}
                  className={`flex ${isAI ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm border ${
                    isAI 
                      ? 'border-neutral-200' 
                      : 'text-white shadow-3xs border-transparent'
                  }`}
                  style={isAI ? { backgroundColor: '#FFFFFF', color: '#000000' } : { backgroundColor: primaryColor }}
                  >
                    <div className="space-y-1 bg-transparent" style={isAI ? { color: '#000000', fontWeight: 600 } : {}}>
                      {isAI ? renderFormattedText(msg.text) : <p className="leading-relaxed font-semibold">{msg.text}</p>}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Error handling */}
            {errorText && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs border border-red-100 dark:border-red-950/40">
                {errorText}
              </div>
            )}

            {/* Typing Thinking Indicator */}
            {isLoading && (
              <div className="flex justify-start items-center space-x-1.5 ml-2 py-1">
                <span className="text-[11px] text-neutral-400 italic">UBox AI đang suy nghĩ</span>
                <span className="flex space-x-1">
                  <span className="h-1.5 w-1.5 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-bounce"></span>
                  <span className="h-1.5 w-1.5 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-bounce delay-75"></span>
                  <span className="h-1.5 w-1.5 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-bounce delay-150"></span>
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Predefined Questions */}
          <div 
            className="p-3 border-t border-neutral-100 dark:border-neutral-800"
            style={{ 
              backgroundColor: isDark ? 'rgba(25, 25, 25, 0.45)' : 'rgba(247, 247, 247, 0.45)'
            }}
          >
            <div className="flex items-center space-x-1.5 mb-1.5 text-[10.5px] text-neutral-500 font-semibold uppercase tracking-wider">
              <HelpCircle size={12} />
              <span>Gợi ý câu hỏi nhanh:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q.text)}
                  disabled={isLoading}
                  className="px-2 py-1.5 bg-white/70 dark:bg-neutral-800/70 hover:bg-white/90 dark:hover:bg-neutral-700/90 text-[11px] font-sans font-medium rounded-lg text-left text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
                >
                  <span className="truncate mr-1">{q.label}</span>
                  <ArrowRight size={10} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Post Message Input Bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center space-x-2"
            style={{ 
              backgroundColor: isDark ? 'rgba(20, 20, 20, 0.45)' : 'rgba(255, 255, 255, 0.45)'
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Hỏi trợ lý UBox bất cứ điều gì..."
              disabled={isLoading}
              className="flex-1 bg-neutral-100/70 dark:bg-neutral-800/75 text-neutral-800 dark:text-neutral-200 text-xs px-3 py-2.5 rounded-xl border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center transition-all cursor-pointer hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:scale-100"
              style={{ backgroundColor: primaryColor }}
              title="Gửi câu hỏi"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
