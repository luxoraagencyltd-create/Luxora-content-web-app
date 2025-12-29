
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ReviewMessage, User } from '../types';

interface Props {
  messages: ReviewMessage[];
  users: User[]; // Cần danh sách user để gợi ý tag
  currentUser: User;
  onAction: (action: string, taskId: string) => void;
  onSendMessage: (text: string, replyToId?: string, taggedIds?: string[]) => void;
  isWaiting: boolean;
  projectName?: string;
  activeTaskId: string | null;
}

const ReviewPortal: React.FC<Props> = ({ messages, users, currentUser, onAction, onSendMessage, isWaiting, projectName, activeTaskId }) => {
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReviewMessage | null>(null);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Logic xử lý Tagging
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    const words = value.split(' ');
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setTagQuery(lastWord.substring(1));
      setShowTagSuggestions(true);
    } else {
      setShowTagSuggestions(false);
    }
  };

  const insertTag = (user: User) => {
    const words = inputText.split(' ');
    words[words.length - 1] = `@${user.fullName || user.username} `;
    setInputText(words.join(' '));
    setShowTagSuggestions(false);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.fullName || u.username).toLowerCase().includes(tagQuery.toLowerCase()) &&
      u.id !== currentUser.id
    );
  }, [users, tagQuery, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Tìm các User IDs được tag dựa trên nội dung text (đơn giản hóa)
    const taggedIds = users
      .filter(u => inputText.includes(`@${u.fullName || u.username}`))
      .map(u => u.id);

    onSendMessage(inputText, replyingTo?.id, taggedIds);
    setInputText('');
    setReplyingTo(null);
  };

  // Hàm render text với highlight cho tag
  const renderMessageText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-[#00f2ff] font-black underline decoration-[#00f2ff]/30">{part}</span>;
      }
      return part;
    });
  };

  const findOriginalMessage = (id: string) => messages.find(m => m.id === id);

  return (
    <div className="flex flex-col h-full max-h-[850px] bg-[#0d0b0a] rounded-3xl border border-[#d4af37]/30 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden relative lacquer-gloss">
      <div className="h-10 bg-[#050404] flex items-center justify-between px-8 text-[#a39e93] code-font text-[9px] font-bold">
        <span>GIAO THỨC TRỰC TUYẾN</span>
        <div className="flex gap-2"><i className="fa-solid fa-signal text-[#00f2ff]"></i><i className="fa-solid fa-battery-three-quarters"></i></div>
      </div>
      
      <div className="bg-[#0d0b0a] pt-4 pb-6 px-6 border-b border-[#1a1412]">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-[#c41e3a] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(196,30,58,0.4)] rotate-3 border border-white/10">
             <i className="fa-solid fa-comments text-white text-xl"></i>
           </div>
           <div>
             <h3 className="heritage-font font-black text-sm tracking-widest text-[#d4af37]">{projectName || 'Dự Án Nội Bộ'}</h3>
             <div className="flex items-center gap-1.5 mt-1">
               <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse"></span>
               <span className="code-font text-[9px] text-[#a39e93] font-bold uppercase tracking-widest">Kênh Trao Đổi Dự Án</span>
             </div>
           </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 bg-[#0d0b0a] p-4 overflow-y-auto space-y-6 scroll-smooth custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-20 flex-col gap-4">
            <i className="fa-solid fa-ghost text-4xl text-[#d4af37]"></i>
            <p className="code-font text-[9px] tracking-[0.3em]">CHƯA CÓ GIAO THỨC PHÁT SINH</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const originalMsg = msg.replyToId ? findOriginalMessage(msg.replyToId) : null;

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
              <div className={`max-w-[85%] rounded-xl p-4 text-sm shadow-xl relative border transition-all ${
                isMe 
                  ? 'bg-[#c41e3a]/10 border-[#c41e3a]/40 text-[#f2ede4] rounded-tr-none' 
                  : msg.senderRole === 'STAFF'
                  ? 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#f2ede4] rounded-tl-none'
                  : 'bg-[#1a1412] border-white/10 text-[#f2ede4] rounded-tl-none'
              }`}>
                
                {/* Replying context within bubble */}
                {originalMsg && (
                  <div className="mb-3 p-2 bg-black/40 rounded border-l-2 border-[#00f2ff] text-[10px] opacity-70 italic truncate max-w-full">
                    <span className="font-bold text-[#00f2ff] not-italic block mb-0.5">{originalMsg.senderName}:</span>
                    {originalMsg.text}
                  </div>
                )}

                {msg.senderRole !== 'CLIENT' && !isMe && (
                  <div className={`code-font text-[8px] font-black mb-2 uppercase tracking-[0.2em] flex items-center gap-1 ${msg.senderRole === 'STAFF' ? 'text-[#d4af37]' : 'text-[#00f2ff]'}`}>
                    <i className={`fa-solid ${msg.senderRole === 'STAFF' ? 'fa-user-tie' : 'fa-terminal'}`}></i> {msg.senderName}
                  </div>
                )}
                
                <div className="whitespace-pre-wrap leading-relaxed italic">
                  {renderMessageText(msg.text)}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className={`code-font text-[7px] font-bold opacity-50 ${isMe ? 'text-[#c41e3a]' : 'text-[#a39e93]'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  {/* Quick Reply Button */}
                  <button 
                    onClick={() => setReplyingTo(msg)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 text-[#d4af37] hover:text-white"
                    title="Phản hồi"
                  >
                    <i className="fa-solid fa-reply text-[10px]"></i>
                  </button>
                </div>
                
                {msg.type === 'NOTIFICATION' && msg.text.includes('Blueprint:') && !isWaiting && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button onClick={() => {
                      const taskId = msg.text.match(/\[(.*?)\]/)?.[1] || "";
                      onAction('approve', taskId);
                    }} className="heritage-font bg-[#d4af37] hover:bg-white text-[#0d0b0a] text-[10px] font-bold py-2.5 rounded shadow-lg transition-all">PHÊ DUYỆT</button>
                    <button onClick={() => {
                      const taskId = msg.text.match(/\[(.*?)\]/)?.[1] || "";
                      onAction('edit', taskId);
                    }} className="heritage-font bg-transparent border border-[#c41e3a] text-[#c41e3a] hover:bg-[#c41e3a]/10 text-[10px] font-bold py-2.5 rounded transition-all">FEEDBACK</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isWaiting && (
          <div className="flex flex-col gap-4 py-4">
             <div className="flex justify-center">
                <button 
                  onClick={() => onAction('finish_feedback', activeTaskId || '')}
                  className="heritage-font bg-[#00f2ff] text-[#0d0b0a] text-[10px] font-black tracking-widest px-8 py-2.5 rounded shadow-[0_0_20px_#00f2ff] active:scale-95 transition-all animate-pulse"
                >
                  XÁC NHẬN HOÀN TẤT FEEDBACK
                </button>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-[#050404] border-t border-[#1a1412] relative">
        {/* Reply Context Preview */}
        {replyingTo && (
          <div className="px-6 py-2 bg-[#d4af37]/5 border-b border-[#d4af37]/20 flex justify-between items-center animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <i className="fa-solid fa-reply text-[#d4af37] text-xs"></i>
              <div className="min-w-0">
                <span className="block code-font text-[8px] font-bold text-[#d4af37] uppercase">Phản hồi {replyingTo.senderName}</span>
                <p className="text-[10px] italic opacity-50 truncate">{replyingTo.text}</p>
              </div>
            </div>
            <button onClick={() => setReplyingTo(null)} className="text-[#c41e3a] hover:text-white"><i className="fa-solid fa-circle-xmark"></i></button>
          </div>
        )}

        {/* Tag Suggestions Popup */}
        {showTagSuggestions && filteredUsers.length > 0 && (
          <div className="absolute bottom-full left-5 w-64 bg-[#1a1412] border border-[#d4af37]/30 rounded-t-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
            <div className="p-2 bg-[#0d0b0a] text-[8px] code-font font-bold text-[#d4af37] tracking-widest uppercase">Tag thành viên</div>
            {filteredUsers.map(user => (
              <button 
                key={user.id} 
                onClick={() => insertTag(user)}
                className="w-full p-3 flex items-center gap-3 hover:bg-[#d4af37]/10 transition-colors text-left"
              >
                <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${user.role === 'STAFF' ? 'bg-[#d4af37] text-black' : 'bg-[#c41e3a] text-white'}`}>
                  {user.username.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#f2ede4]">{user.fullName || user.username}</div>
                  <div className="text-[8px] text-[#a39e93] uppercase tracking-tighter">{user.role}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={isWaiting ? "Đang trong chế độ Feedback..." : "Gõ @ để tag, nhập tin nhắn..."}
              className="w-full bg-[#1a1412] border border-[#d4af37]/10 rounded-lg px-5 py-3 text-xs text-[#f2ede4] focus:border-[#d4af37] outline-none transition-all font-medium placeholder:text-[#a39e93]/30"
            />
          </div>
          <button type="submit" disabled={!inputText.trim()} className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${inputText.trim() ? 'bg-[#d4af37] text-[#0d0b0a] shadow-lg shadow-[#d4af37]/20' : 'bg-[#1a1412] text-[#a39e93] opacity-30'}`}>
            <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewPortal;
