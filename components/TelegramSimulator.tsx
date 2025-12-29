
import React, { useState, useEffect, useRef } from 'react';
// Fix: Import ReviewMessage as TelegramMessage is not exported from types.ts
import { ReviewMessage } from '../types';

interface Props {
  messages: ReviewMessage[];
  // Aligned with ReviewPortal's action pattern
  onAction: (action: string, taskId: string) => void;
  onReply: (text: string) => void;
  isWaiting: boolean;
  projectName?: string;
  activeTaskId?: string | null;
}

const TelegramSimulator: React.FC<Props> = ({ messages, onAction, onReply, isWaiting, projectName, activeTaskId }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isWaiting) return;
    onReply(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden max-w-[340px] mx-auto relative">
      {/* Phone Header */}
      <div className="h-14 bg-slate-800 flex items-center justify-between px-8 text-white">
        <span className="text-xs font-bold">9:41</span>
        <div className="flex gap-1.5 items-center">
          <i className="fa-solid fa-signal text-[10px]"></i>
          <i className="fa-solid fa-wifi text-[10px]"></i>
          <i className="fa-solid fa-battery-full text-[10px]"></i>
        </div>
      </div>
      
      {/* Telegram App Header */}
      <div className="bg-[#242f3d] py-2 px-4 flex items-center gap-3">
        <i className="fa-solid fa-arrow-left text-white/80"></i>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-[10px]">EG</div>
          <div className="min-w-0">
            <div className="text-white text-[12px] font-bold leading-tight truncate">{projectName || 'Elite Group'}</div>
            <div className="text-indigo-300 text-[9px]">Official Bot Review</div>
          </div>
        </div>
        <i className="fa-solid fa-ellipsis-vertical text-white/80 ml-auto"></i>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 telegram-bg p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-10">
            <span className="bg-black/20 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm italic">
              Khởi tạo chat cho {projectName}...
            </span>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'CLIENT' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm relative ${
              msg.senderRole === 'ADMIN' ? 'bg-white rounded-tl-none' : 
              msg.senderRole === 'STAFF' ? 'bg-[#d7f8ff] rounded-tl-none' :
              'bg-[#effdde] rounded-tr-none'
            }`}>
              {msg.senderRole !== 'CLIENT' && (
                <div className="text-[10px] font-bold mb-1 uppercase tracking-tight" style={{ color: msg.senderRole === 'ADMIN' ? '#3390ec' : '#10b981' }}>
                  {msg.senderName}
                </div>
              )}
              <div className="text-xs whitespace-pre-wrap leading-relaxed text-slate-800">
                {msg.text}
              </div>
              <div className="text-[9px] text-slate-400 mt-1 text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              
              {msg.type === 'NOTIFICATION' && msg.text.includes('Blueprint:') && !isWaiting && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const taskId = msg.text.match(/\[(.*?)\]/)?.[1] || "";
                      onAction('approve', taskId);
                    }}
                    className="bg-[#3390ec] hover:bg-[#2b82d9] text-white text-[10px] font-bold py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Duyệt Bản Vẽ
                  </button>
                  <button
                    onClick={() => {
                      const taskId = msg.text.match(/\[(.*?)\]/)?.[1] || "";
                      onAction('edit', taskId);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Tái Cấu Trúc
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isWaiting && (
          <div className="flex flex-col gap-2 items-start">
             <div className="bg-black/10 text-white text-[10px] px-2 py-1 rounded-lg italic">Manager is typing...</div>
             <button 
                onClick={() => onAction('finish_feedback', activeTaskId || '')}
                className="bg-green-600 text-white text-[10px] px-4 py-2 rounded-lg font-bold shadow-md hover:bg-green-700 transition-colors"
             >
               Hoàn Tất Feedback
             </button>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t flex items-center gap-2">
        <form onSubmit={handleSubmit} className="flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!isWaiting}
            placeholder={isWaiting ? "Type feedback..." : "Wait for Bot request..."}
            className="w-full bg-slate-100 border-none rounded-full px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
          />
        </form>
        <button 
          onClick={handleSubmit} 
          disabled={!isWaiting}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isWaiting ? 'bg-[#3390ec] text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}
        >
          <i className="fa-solid fa-paper-plane text-xs"></i>
        </button>
      </div>
      
      <div className="h-4 bg-white"></div>
    </div>
  );
};

export default TelegramSimulator;
