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
  const isAdmin = userRole === 'ADMIN';

  const NavItem = ({ id, icon, label, onClick }: { id: string, icon: string, label?: string, onClick?: () => void }) => {
    const isActive = activeView === id;
    return (
      <button 
        onClick={onClick || (() => setActiveView(id))}
        className={`flex flex-col items-center justify-center p-2 flex-1 transition-all ${isActive ? 'text-[#00f3ff]' : 'text-[#888]'}`}
      >
        <i className={`fa-solid ${icon} text-xl ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]' : ''} mb-1`}></i>
        {isActive && <span className="code-font text-[8px] uppercase font-bold tracking-widest">{label}</span>}
      </button>
    );
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-[#050505]/95 backdrop-blur-xl border-t border-[#00f3ff]/30 z-[90] flex justify-between items-center px-2 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,1)]">
      
      {/* 1. Dashboard (Ai cũng thấy) */}
      <NavItem id="dashboard" icon="fa-layer-group" label="Dash" />

      {/* 2. Issues (Ai cũng thấy) */}
      <NavItem id="issues" icon="fa-bug-slash" label="Issues" />

      {/* 3. Nút Chức năng riêng theo Role */}
      {isClient && (
         <NavItem id="visuals" icon="fa-chart-pie" label="Stats" />
      )}

      {/* ADMIN: Ưu tiên hiển thị nút Quản lý User ra ngoài */}
      {isAdmin && (
         <NavItem id="manage-users" icon="fa-users-gear" label="Users" />
      )}

      {/* STAFF: Có thể thêm nút xem Kanban hoặc để trống cho thoáng */}
      {/* Nếu sau này Staff có tính năng riêng thì thêm vào đây */}

      {/* 4. Menu mở rộng (Nút đỏ - Chứa các chức năng còn lại) */}
      <div className="relative group flex-1 flex justify-center">
         <button className="flex flex-col items-center justify-center p-2 text-[#c41e3a] transition-transform active:scale-90">
            <i className="fa-solid fa-bars text-xl"></i>
         </button>
         
         {/* Popup Menu */}
         <div className="absolute bottom-full right-0 mb-4 w-48 bg-[#1a1412] border border-[#c41e3a]/30 rounded-lg shadow-[0_0_30px_rgba(0,0,0,1)] hidden group-focus-within:block p-1 animate-in slide-in-from-bottom-5 fade-in duration-200">
            
            {/* Các chức năng ẩn của Admin */}
            {isAdmin && (
              <>
                <button onClick={() => setActiveView('manage-projects')} className="w-full text-left px-4 py-3 text-[11px] code-font text-[#f2ede4] hover:bg-[#d4af37]/10 flex items-center gap-3 border-b border-[#ffffff]/5">
                   <i className="fa-solid fa-diagram-project text-[#d4af37]"></i> Quản lý Dự Án
                </button>
                <button onClick={() => setActiveView('system-settings')} className="w-full text-left px-4 py-3 text-[11px] code-font text-[#f2ede4] hover:bg-[#00f3ff]/10 flex items-center gap-3 border-b border-[#ffffff]/5">
                   <i className="fa-solid fa-sliders text-[#00f3ff]"></i> Cấu Hình Hệ Thống
                </button>
              </>
            )}

            {/* Chức năng chung */}
            <button onClick={onSwitchProject} className="w-full text-left px-4 py-3 text-[11px] code-font text-[#f2ede4] hover:bg-[#d4af37]/10 flex items-center gap-3 border-b border-[#ffffff]/5">
               <i className="fa-solid fa-repeat text-[#d4af37]"></i> Đổi Dự Án
            </button>
            <button onClick={onLogout} className="w-full text-left px-4 py-3 text-[11px] code-font text-[#c41e3a] hover:bg-[#c41e3a]/10 flex items-center gap-3">
               <i className="fa-solid fa-power-off"></i> Đăng Xuất
            </button>
         </div>
      </div>
    </div>
  );
};

export default MobileNavbar;