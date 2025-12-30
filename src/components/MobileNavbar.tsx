import React from 'react';
import { User, Project } from '../types';

interface Props {
  activeView: string;
  setActiveView: (view: string) => void;
  userRole: string;
  currentUser: User | null;
  onLogout: () => void;
  onSwitchProject: () => void;
  project?: Project;
}

const MobileNavbar: React.FC<Props> = ({ activeView, setActiveView, userRole, onLogout, onSwitchProject }) => {
  const isClient = userRole === 'CLIENT';

  const NavItem = ({ id, icon, label, onClick }: { id: string, icon: string, label?: string, onClick?: () => void }) => {
    const isActive = activeView === id;
    return (
      <button 
        onClick={onClick || (() => setActiveView(id))}
        className={`flex flex-col items-center justify-center p-2 flex-1 transition-all ${isActive ? 'text-[#00f3ff]' : 'text-[#888]'}`}
      >
        <i className={`fa-solid ${icon} text-lg ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]' : ''} mb-1`}></i>
        {isActive && <span className="code-font text-[8px] uppercase font-bold tracking-widest">{label}</span>}
      </button>
    );
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-[#050505]/95 backdrop-blur-xl border-t border-[#00f3ff]/30 z-[90] flex justify-around items-center px-2 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,1)]">
      
      {/* 1. Dashboard */}
      <NavItem id="dashboard" icon="fa-layer-group" label="Dash" />

      {/* 2. Issues */}
      <NavItem id="issues" icon="fa-bug-slash" label="Issues" />

      {/* 3. Stats (Client) hoặc Admin (Staff) */}
      {isClient ? (
         <NavItem id="visuals" icon="fa-chart-pie" label="Stats" />
      ) : (
         <NavItem id="manage-users" icon="fa-users-gear" label="Users" />
      )}

      {/* 4. Menu mở rộng (Nút đỏ) */}
      <div className="relative group">
         <button className="flex flex-col items-center justify-center p-2 text-[#c41e3a]">
            <i className="fa-solid fa-power-off text-lg"></i>
         </button>
         
         {/* Popup Menu nhỏ khi bấm nút đỏ */}
         <div className="absolute bottom-full right-2 mb-4 w-40 bg-[#1a1412] border border-[#c41e3a]/30 rounded-lg shadow-xl hidden group-focus-within:block p-1">
            {!isClient && (
                <button onClick={() => setActiveView('system-settings')} className="w-full text-left px-3 py-3 text-[10px] code-font text-[#00f3ff] hover:bg-[#00f3ff]/10 flex items-center gap-2 border-b border-[#ffffff]/5">
                   <i className="fa-solid fa-sliders"></i> Cấu Hình
                </button>
            )}
            <button onClick={onSwitchProject} className="w-full text-left px-3 py-3 text-[10px] code-font text-[#d4af37] hover:bg-[#d4af37]/10 flex items-center gap-2 border-b border-[#ffffff]/5">
               <i className="fa-solid fa-repeat"></i> Đổi Dự Án
            </button>
            <button onClick={onLogout} className="w-full text-left px-3 py-3 text-[10px] code-font text-[#c41e3a] hover:bg-[#c41e3a]/10 flex items-center gap-2">
               <i className="fa-solid fa-right-from-bracket"></i> Đăng Xuất
            </button>
         </div>
      </div>
    </div>
  );
};

export default MobileNavbar;