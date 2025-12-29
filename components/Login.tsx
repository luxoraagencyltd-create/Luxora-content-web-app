
import React, { useState } from 'react';
import { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<Props> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Kiểm tra danh tính dựa trên Username hoặc ID NODE
    const lookup = username.trim().toLowerCase();
    const matchedUser = users.find(u => {
      const uname = (u.username ?? '').toLowerCase();
      const uid = (u.id ?? '').toLowerCase();
      return (uname === lookup || uid === lookup) && (u.password ?? '') === password;
    });

    if (matchedUser) {
      onLogin(matchedUser);
    } else {
      setError('DANH TÍNH HOẶC MÃ BẢO MẬT KHÔNG CHÍNH XÁC!');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0d0b0a] flex items-center justify-center p-6 z-[300]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#c41e3a]/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00f2ff]/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="w-full max-w-md bg-[#1a1412] border border-[#d4af37]/20 p-10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,1)] relative lacquer-gloss">
        <div className="text-center mb-10">
          <div className="inline-block p-5 bg-[#c41e3a] rounded-lg shadow-[0_0_20px_rgba(196,30,58,0.4)] mb-8 border border-white/10">
            <i className="fa-solid fa-lotus text-white text-4xl"></i>
          </div>
          <h1 className="heritage-font text-3xl font-black text-[#d4af37] mb-2 tracking-[0.2em]">Luxora Edtech</h1>
          <p className="code-font text-[#a39e93] text-[9px] uppercase tracking-[0.3em]">Digital Temple Protocol 2.0</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-3">
            <label className="code-font text-[9px] font-bold text-[#d4af37] uppercase ml-1 tracking-widest">Node ID / Username</label>
            <div className="relative">
              <i className="fa-solid fa-key absolute left-4 top-1/2 -translate-y-1/2 text-[#a39e93]/50"></i>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="NHẬP DANH TÍNH..."
                className="w-full bg-[#0d0b0a] border border-[#d4af37]/10 rounded-lg py-4 pl-12 pr-4 text-[#f2ede4] placeholder:text-[#a39e93]/20 code-font text-xs focus:ring-1 focus:ring-[#00f2ff] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="code-font text-[9px] font-bold text-[#d4af37] uppercase ml-1 tracking-widest">Security Code</label>
            <div className="relative">
              <i className="fa-solid fa-shield-halved absolute left-4 top-1/2 -translate-y-1/2 text-[#a39e93]/50"></i>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0d0b0a] border border-[#d4af37]/10 rounded-lg py-4 pl-12 pr-4 text-[#f2ede4] placeholder:text-[#a39e93]/20 code-font text-xs focus:ring-1 focus:ring-[#00f2ff] outline-none transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="bg-[#c41e3a]/10 border border-[#c41e3a]/30 text-[#c41e3a] text-[10px] py-3 px-4 rounded-lg flex items-center gap-2 font-bold italic animate-pulse">
              <i className="fa-solid fa-triangle-exclamation"></i>
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full heritage-font bg-[#c41e3a] hover:bg-white hover:text-[#c41e3a] text-white font-black py-4 rounded shadow-[0_0_20px_rgba(196,30,58,0.4)] transition-all active:scale-[0.98] tracking-[0.2em]"
          >
            VÀO HỌC VIỆN
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="code-font text-[#a39e93]/40 text-[8px] uppercase tracking-widest font-bold">Node Identities:</p>
          <div className="flex justify-center gap-4 mt-4 overflow-x-auto pb-2">
            {users.map((u, i) => (
              <span key={u.id ?? u.username ?? i} className="text-[7px] code-font text-[#d4af37] opacity-60 hover:opacity-100 cursor-default uppercase">
                {u.id ?? u.username}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
