import React, { useState, useEffect, useRef } from 'react';
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
  const isAdmin = userRole === 'ADMIN';
  
  // 👇 THÊM STATE ĐỂ QUẢN LÝ MENU
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Logic: Bấm ra ngoài thì đóng menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (id: string) => {
    setActiveView(id);
    setIsMenuOpen(false); // Đóng menu khi chuyển trang
  };

  const NavItem = ({ id, icon, label, onClick }: { id: string, icon: string, label?: string, onClick?: () => void }) => {
    const isActive = activeView === id;
    return (
      <button 
        onClick={onClick || (() => handleNavClick(id))}
        className={`flex flex-col items-center justify-center p-2 flex-1 transition-all active:scale-95 ${isActive ? 'text-[#00f3ff]' : 'text-[#888]'}`}
      >
        <i className={`fa-solid ${icon} text-xl ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]' : ''} mb-1`}></i>
        {isActive && <span className="code-font text-[8px] uppercase font-bold tracking-widest">{label}</span>}
      </button>
    );
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-[#050505]/95 backdrop-blur-xl border-t border-[#00f3ff]/30 z-[90] flex justify-between items-center px-2 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,1)]">
      
      <NavItem id="dashboard" icon="fa-layer-group" label="Dash" />
      <NavItem id="issues" icon="fa-bug-slash" label="Issues" />

      {isClient && <NavItem id="visuals" icon="fa-chart-pie" label="Stats" />}
      {isAdmin && <NavItem id="manage-users" icon="fa-users-gear" label="Users" />}

      {/* 4. Menu mở rộng */}
      {/* 👇 GẮN REF VÀO ĐÂY ĐỂ CHECK CLICK OUTSIDE */}
      <div className="relative flex-1 flex justify-center" ref={menuRef}>
         <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} // Toggle bật/tắt
            className={`flex flex-col items-center justify-center p-2 transition-transform active:scale-90 ${isMenuOpen ? 'text-[#c41e3a]' : 'text-[#a39e93]'}`}
         >
            <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
         </button>
         
         {/* 👇 DÙNG CLASS ĐỂ ẨN HIỆN MENU DỰA TRÊN STATE */}
         <div className={`absolute bottom-full right-2 mb-4 w-56 bg-[#1a1412] border border-[#c41e3a]/30 rounded-lg shadow-[0_0_30px_rgba(0,0,0,1)] p-1 transition-all duration-200 origin-bottom-right ${isMenuOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
            
            {isAdmin && (
              <>
                <button onClick={() => { setActiveView('manage-projects'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[11px] code-font text-[#f2ede4] hover:bg-[#d4af37]/10 flex items-center gap-3 border-b border-[#ffffff]/5">
                   <i className="fa-solid fa-diagram-project text-[#d4af37]"></i> Quản lý Dự Án
                </button>
                <button onClick={() => { setActiveView('system-settings'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[11px] code-font text-[#f2ede4] hover:bg-[#00f3ff]/10 flex items-center gap-3 border-b border-[#ffffff]/5">
                   <i className="fa-solid fa-sliders text-[#00f3ff]"></i> Cấu Hình Hệ Thống
                </button>
              </>
            )}

            <button onClick={() => { onSwitchProject(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[11px] code-font text-[#f2ede4] hover:bg-[#d4af37]/10 flex items-center gap-3 border-b border-[#ffffff]/5">
               <i className="fa-solid fa-repeat text-[#d4af37]"></i> Đổi Dự Án
            </button>
            <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[11px] code-font text-[#c41e3a] hover:bg-[#c41e3a]/10 flex items-center gap-3">
               <i className="fa-solid fa-power-off"></i> Đăng Xuất
            </button>
         </div>
      </div>
    </div>
  );
};

export default MobileNavbar;