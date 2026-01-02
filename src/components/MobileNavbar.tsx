import React, { useState } from 'react';
import { User, Project } from '../types';
// 👇 1. IMPORT HÀM XIN QUYỀN
import { requestNotificationPermission } from '../lib/notification';

interface Props {
  activeView: string;
  setActiveView: (view: string) => void;
  userRole: string;
  currentUser: User | null;
  onLogout: () => void;
  onSwitchProject: () => void;
  project?: Project;
}

const MobileNavbar: React.FC<Props> = ({ activeView, setActiveView, userRole, currentUser, onLogout, onSwitchProject }) => {
  const isClient = userRole === 'CLIENT';
  const isAdmin = userRole === 'ADMIN';
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavClick = (id: string) => {
    setActiveView(id);
    setIsMenuOpen(false);
  };

  // 👇 HÀM XỬ LÝ BẬT NOTI
  const handleEnableNoti = async () => {
    if (currentUser) {
        await requestNotificationPermission(currentUser.id);
        setIsMenuOpen(false); // Đóng menu sau khi bấm
    }
  };

  const NavItem = ({ id, icon, label, onClick }: { id: string, icon: string, label?: string, onClick?: () => void }) => {
    const isActive = activeView === id;
    return (
      <button 
        onClick={onClick || (() => handleNavClick(id))}
        className={`flex flex-col items-center justify-center p-2 flex-1 transition-all active:scale-90 ${isActive ? 'text-[#00f3ff]' : 'text-[#888]'}`}
      >
        <i className={`fa-solid ${icon} text-xl ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]' : ''} mb-1`}></i>
        {isActive && <span className="code-font text-[8px] uppercase font-bold tracking-widest">{label}</span>}
      </button>
    );
  };

  return (
    <>
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[95] animate-in fade-in duration-200"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-[#050505] border-t border-[#00f3ff]/30 z-[100] flex justify-between items-center px-2 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,1)]">
        
        <NavItem id="dashboard" icon="fa-layer-group" label="Dash" />
        <NavItem id="issues" icon="fa-bug-slash" label="Issues" />

        {isClient && <NavItem id="visuals" icon="fa-chart-pie" label="Stats" />}
        {isAdmin && <NavItem id="manage-users" icon="fa-users-gear" label="Users" />}

        <div className="relative flex-1 flex justify-center">
           <button 
              onClick={(e) => {
                 e.stopPropagation();
                 setIsMenuOpen(!isMenuOpen);
              }} 
              className={`flex flex-col items-center justify-center p-2 transition-transform active:scale-90 ${isMenuOpen ? 'text-[#c41e3a]' : 'text-[#a39e93]'}`}
           >
              <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
           </button>
           
           {isMenuOpen && (
             <div className="absolute bottom-full right-2 mb-4 w-60 bg-[#1a1412] border border-[#c41e3a]/30 rounded-lg shadow-[0_0_30px_rgba(0,0,0,1)] p-1 animate-in slide-in-from-bottom-5 fade-in duration-200 z-[101]">
                
                {isAdmin && (
                  <>
                    <button onClick={() => { setActiveView('manage-projects'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[11px] code-font text-[#f2ede4] hover:bg-[#d4af37]/10 flex items-center gap-3 border-b border-[#ffffff]/5 active:bg-[#d4af37]/20">
                       <i className="fa-solid fa-diagram-project text-[#d4af37]"></i> Quản lý Dự Án
                    </button>
                    <button onClick={() => { setActiveView('system-settings'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[11px] code-font text-[#f2ede4] hover:bg-[#00f3ff]/10 flex items-center gap-3 border-b border-[#ffffff]/5 active:bg-[#00f3ff]/20">
                       <i className="fa-solid fa-sliders text-[#00f3ff]"></i> Cấu Hình Hệ Thống
                    </button>
                  </>
                )}

                {/* 👇 NÚT BẬT THÔNG BÁO CHO CLIENT (Nằm ở đây) */}
                <button onClick={handleEnableNoti} className="w-full text-left px-4 py-3 text-[11px] code-font text-[#00f3ff] hover:bg-[#00f3ff]/10 flex items-center gap-3 border-b border-[#ffffff]/5 active:bg-[#00f3ff]/20">
                   <i className="fa-solid fa-bell animate-swing"></i> Bật Thông Báo
                </button>

                <button onClick={() => { onSwitchProject(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[11px] code-font text-[#f2ede4] hover:bg-[#d4af37]/10 flex items-center gap-3 border-b border-[#ffffff]/5 active:bg-[#d4af37]/20">
                   <i className="fa-solid fa-repeat text-[#d4af37]"></i> Đổi Dự Án
                </button>
                <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[11px] code-font text-[#c41e3a] hover:bg-[#c41e3a]/10 flex items-center gap-3 active:bg-[#c41e3a]/20">
                   <i className="fa-solid fa-power-off"></i> Đăng Xuất
                </button>
             </div>
           )}
        </div>
      </div>
    </>
  );
};

export default MobileNavbar;