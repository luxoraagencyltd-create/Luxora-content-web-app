import React, { useState, useEffect, useRef } from 'react';
import { ReviewMessage, User } from '../types';

interface Props {
  messages: ReviewMessage[];
  users: User[];
  currentUser: User;
  onAction: (action: string, taskId: string) => void;
  onSendMessage: (text: string, replyToId?: string, taggedIds?: string[]) => void;
  isWaiting: boolean;
  projectName?: string;
  activeTaskId: string | null;
  draftMessage?: string;
  
  // 👇 1. KHAI BÁO PROP MỚI Ở ĐÂY
  hasPendingFeedback?: boolean; 
}

// 👇 2. THÊM hasPendingFeedback VÀO DANH SÁCH NHẬN PROPS
const ReviewPortal: React.FC<Props> = ({ 
  messages, users, currentUser, onAction, onSendMessage, 
  isWaiting, projectName, activeTaskId, draftMessage, hasPendingFeedback 
}) => {
  
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ReviewMessage | null>(null);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (draftMessage) {
      setInputText(draftMessage);
    }
  }, [draftMessage]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    const lastWord = val.split(' ').pop();
    if (lastWord?.startsWith('@')) {
      setTagSearch(lastWord.substring(1));
      setShowTagMenu(true);
    } else {
      setShowTagMenu(false);
    }
  };

  const handleTagClick = (user: User) => {
    const words = inputText.split(' ');
    words[words.length - 1] = `@${user.fullName || user.username} `;
    setInputText(words.join(' '));
    setShowTagMenu(false);
  };

  const filteredUsers = React.useMemo(() => {
    return users.filter(u => 
      (u.fullName || u.username).toLowerCase().includes(tagSearch.toLowerCase()) && u.id !== currentUser.id
    );
  }, [users, tagSearch, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const taggedIds = users.filter(u => inputText.includes(`@${u.fullName || u.username}`)).map(u => u.id);
    
    onSendMessage(inputText, replyTo?.id, taggedIds);
    setInputText('');
    setReplyTo(null);
  };

  const formatText = (text: string) => {
    return text.split(/(@\w+)/g).map((part, index) => 
      part.startsWith('@') ? <span key={index} className="text-[#00f2ff] font-black underline decoration-[#00f2ff]/30">{part}</span> : part
    );
  };

  const getReplyPreview = (id: string) => messages.find(m => m.id === id);

  return (
    <div className="flex flex-col h-full max-h-[850px] bg-[#0d0b0a] rounded-3xl border border-[#d4af37]/30 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden relative lacquer-gloss">
      {/* HEADER */}
      <div className="h-10 bg-[#050404] flex items-center justify-between px-8 text-[#a39e93] code-font text-[9px] font-bold">
        <span>GIAO THỨC TRỰC TUYẾN</span>
        <div className="flex gap-2">
          <i className="fa-solid fa-signal text-[#00f2ff]"></i>
          <i className="fa-solid fa-battery-three-quarters"></i>
        </div>
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

      {/* MESSAGES AREA */}
      <div ref={messagesEndRef} className="flex-1 bg-[#0d0b0a] p-4 overflow-y-auto space-y-6 scroll-smooth custom-scrollbar relative">
        {messages.length === 0 && (
           <div className="h-full flex items-center justify-center opacity-20 flex-col gap-4">
              <i className="fa-solid fa-ghost text-4xl text-[#d4af37]"></i>
              <p className="code-font text-[9px] tracking-[0.3em]">CHƯA CÓ GIAO THỨC PHÁT SINH</p>
           </div>
        )}
        {messages.map(msg => {
           const isMine = msg.senderId === currentUser.id;
           const replyMsg = msg.replyToId ? getReplyPreview(msg.replyToId) : null;
           return (
             <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}>
               <div className={`max-w-[85%] rounded-xl p-4 text-sm shadow-xl relative border transition-all ${isMine ? 'bg-[#c41e3a]/10 border-[#c41e3a]/40 text-[#f2ede4] rounded-tr-none' : msg.senderRole === 'STAFF' ? 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#f2ede4] rounded-tl-none' : 'bg-[#1a1412] border-white/10 text-[#f2ede4] rounded-tl-none'}`}>
                 {replyMsg && (
                    <div className="mb-3 p-2 bg-black/40 rounded border-l-2 border-[#00f2ff] text-[10px] opacity-70 italic truncate max-w-full">
                       <span className="font-bold text-[#00f2ff] not-italic block mb-0.5">{replyMsg.senderName}:</span>
                       {replyMsg.text}
                    </div>
                 )}
                 {msg.senderRole !== 'CLIENT' && !isMine && (
                    <div className={`code-font text-[8px] font-black mb-2 uppercase tracking-[0.2em] flex items-center gap-1 ${msg.senderRole === 'STAFF' ? 'text-[#d4af37]' : 'text-[#00f2ff]'}`}>
                       <i className={`fa-solid ${msg.senderRole === 'STAFF' ? 'fa-user-tie' : 'fa-terminal'}`}></i> {msg.senderName}
                    </div>
                 )}
                 <div className="whitespace-pre-wrap leading-relaxed italic">{formatText(msg.text)}</div>
                 <div className="flex items-center justify-between mt-3">
                   <div className={`code-font text-[7px] font-bold opacity-50 ${isMine ? 'text-[#c41e3a]' : 'text-[#a39e93]'}`}>{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                   <button onClick={() => setReplyTo(msg)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 text-[#d4af37] hover:text-white" title="Phản hồi"><i className="fa-solid fa-reply text-[10px]"></i></button>
                 </div>
               </div>
             </div>
           );
        })}

        {/* 👇 NÚT HOÀN TẤT FEEDBACK - HIỆN Ở ĐÂY */}
        {isWaiting && hasPendingFeedback && (
          <div className="sticky bottom-0 left-0 w-full flex justify-center py-4 bg-gradient-to-t from-[#0d0b0a] to-transparent pointer-events-none">
             <button 
                onClick={() => onAction('confirm_feedback', activeTaskId || '')}
                className="pointer-events-auto heritage-font bg-[#c41e3a] text-white px-6 py-3 rounded-full shadow-[0_0_20px_#c41e3a] text-xs font-black tracking-widest hover:scale-105 transition-transform animate-bounce flex items-center gap-2"
             >
                <i className="fa-solid fa-check-double"></i>
                HOÀN TẤT FEEDBACK
             </button>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="bg-[#050404] border-t border-[#1a1412] relative">
         {replyTo && (
           <div className="px-6 py-2 bg-[#d4af37]/5 border-b border-[#d4af37]/20 flex justify-between items-center animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <i className="fa-solid fa-reply text-[#d4af37] text-xs"></i>
                <div className="min-w-0">
                   <span className="block code-font text-[8px] font-bold text-[#d4af37] uppercase">Phản hồi {replyTo.senderName}</span>
                   <p className="text-[10px] italic opacity-50 truncate">{replyTo.text}</p>
                </div>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-[#c41e3a] hover:text-white"><i className="fa-solid fa-circle-xmark"></i></button>
           </div>
         )}
         
         {showTagMenu && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-5 w-64 bg-[#1a1412] border border-[#d4af37]/30 rounded-t-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
               <div className="p-2 bg-[#0d0b0a] text-[8px] code-font font-bold text-[#d4af37] tracking-widest uppercase">Tag thành viên</div>
               {filteredUsers.map(u => (
                  <button key={u.id} onClick={() => handleTagClick(u)} className="w-full p-3 flex items-center gap-3 hover:bg-[#d4af37]/10 transition-colors text-left">
                     <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${u.role === 'STAFF' ? 'bg-[#d4af37] text-black' : 'bg-[#c41e3a] text-white'}`}>{u.username.substring(0,1).toUpperCase()}</div>
                     <div>
                        <div className="text-xs font-bold text-[#f2ede4]">{u.fullName || u.username}</div>
                        <div className="text-[8px] text-[#a39e93] uppercase tracking-tighter">{u.role}</div>
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
                 onChange={handleInput} 
                 placeholder={isWaiting ? "Nhập nội dung cần sửa..." : "Gõ @ để tag, nhập tin nhắn..."}
                 className={`w-full bg-[#1a1412] border ${isWaiting ? 'border-[#c41e3a] animate-pulse placeholder:text-[#c41e3a]/50' : 'border-[#d4af37]/10'} rounded-lg px-5 py-3 text-xs text-[#f2ede4] focus:border-[#d4af37] outline-none transition-all font-medium placeholder:text-[#a39e93]/30`}
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