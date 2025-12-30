
import React from 'react';
import { Project, UserRole } from '../types';

interface Props {
  onSettingsClick?: () => void;
  currentProject?: Project;
  onLogout?: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  userRole?: UserRole;
  onSwitchProject?: () => void;
  unreadMessages?: number;
}

const Sidebar: React.FC<Props> = ({ onSettingsClick: _onSettingsClick, currentProject, onLogout, activeView, setActiveView, userRole, onSwitchProject, unreadMessages = 0 }) => {
  const isAdmin = userRole === 'ADMIN';
  const isClient = userRole === 'CLIENT';

  return (
    <aside className="w-20 lg:w-64 bg-[#0d0b0a] h-full flex flex-col flex-shrink-0 transition-all duration-300 border-r border-[#1a1412] z-30">
      <div className="p-8 flex items-center justify-center lg:justify-start gap-3">
        <LogoImage />
        <span className="hidden lg:block heritage-font font-bold text-[#d4af37] text-xl">Luxora {isAdmin ? 'Admin' : 'Portal'}</span>
      </div>
      
      <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
        {!isAdmin && (
          <>
            <div onClick={() => setActiveView('dashboard')} className="relative">
              <NavItem icon="fa-house-chimney-window" label="Production Report" active={activeView === 'dashboard'} />
              {unreadMessages > 0 && activeView !== 'dashboard' && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-[#c41e3a] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#0d0b0a] shadow-lg animate-bounce">
                  {unreadMessages}
                </span>
              )}
            </div>

            <div onClick={() => setActiveView('issues')}>
              <NavItem icon="fa-bug-slash" label="Nhật ký Sự cố" active={activeView === 'issues'} />
            </div>

            {isClient && (
              <div onClick={() => setActiveView('visuals')}>
                <NavItem icon="fa-chart-pie" label="Tiến Độ & Biểu Đồ" active={activeView === 'visuals'} />
              </div>
            )}
            
            <div className="pt-4 pb-2 px-4">
              <div className="h-px bg-[#d4af37]/10 w-full"></div>
            </div>

            <div onClick={onSwitchProject}>
              <NavItem icon="fa-arrows-left-right" label="Đổi Dự Án" />
            </div>
          </>
        )}
        
        {isAdmin && (
          <>
            <div className="pt-2 pb-1 px-4">
              <p className="hidden lg:block code-font text-[8px] text-[#a39e93] uppercase tracking-[0.2em]">Quản trị thực địa</p>
            </div>
            <div onClick={() => setActiveView('manage-users')}>
              <NavItem icon="fa-users-gear" label="Người Dùng" active={activeView === 'manage-users'} />
            </div>
            <div onClick={() => setActiveView('manage-projects')}>
              <NavItem icon="fa-diagram-project" label="Dự Án (Blueprints)" active={activeView === 'manage-projects'} />
            </div>
            
            <div className="pt-6 pb-2">
               <div className="h-px bg-[#d4af37]/10 w-full"></div>
            </div>

            <div onClick={() => setActiveView('system-settings')}>
              <NavItem icon="fa-sliders" label="Cấu Hình Hệ Thống" active={activeView === 'system-settings'} />
            </div>
          </>
        )}
        
        <div className="pt-2 flex-1"></div>

        <div onClick={onLogout} className="cursor-pointer mb-6">
          <NavItem icon="fa-power-off" label="Đăng Xuất" isDanger />
        </div>
      </nav>
      
      {!isAdmin && currentProject && (
        <div className="p-4 bg-[#1a1412] m-4 rounded-xl hidden lg:block border border-[#d4af37]/20 lacquer-gloss">
          <p className="code-font text-[9px] text-[#a39e93] uppercase font-bold tracking-[0.2em] mb-2">PROJECT NODE</p>
          <p className="heritage-font text-xs text-[#d4af37] font-bold truncate">{currentProject.name}</p>
        </div>
      )}
    </aside>
  );
};

const NavItem = ({ icon, label, active = false, isDanger = false }: { icon: string, label: string, active?: boolean, isDanger?: boolean }) => (
  <div className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all border border-transparent ${
    active ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37] shadow-[inset_0_0_15px_rgba(212,175,55,0.05)]' : 
    isDanger ? 'text-[#c41e3a] hover:bg-[#c41e3a]/10' : 'text-[#a39e93] hover:bg-[#1a1412] hover:text-[#f2ede4]'
  }`}>
    <i className={`fa-solid ${icon} text-lg w-6 text-center`}></i>
    <span className={`hidden lg:block font-medium text-xs ${active ? 'heritage-font' : ''}`}>{label}</span>
  </div>
);

export default Sidebar;

const LogoImage: React.FC = () => {
  const [failed, setFailed] = React.useState(false);
  if (!failed) {
    return <img src="/assets/logo-48.png" alt="Luxora" className="w-8 h-8 object-contain" onError={() => setFailed(true)} />;
  }
  return (
    <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <circle cx="32" cy="32" r="10" stroke="#d4af37" strokeWidth="2" fill="none" />
      <g stroke="#d4af37" strokeWidth="2" strokeLinecap="round">
        <line x1="32" y1="4" x2="32" y2="14" />
        <line x1="32" y1="50" x2="32" y2="60" />
        <line x1="4" y1="32" x2="14" y2="32" />
        <line x1="50" y1="32" x2="60" y2="32" />
        <line x1="45" y1="14" x2="52" y2="20" />
        <line x1="12" y1="45" x2="20" y2="52" />
        <line x1="12" y1="20" x2="20" y2="14" />
        <line x1="45" y1="52" x2="52" y2="45" />
      </g>
    </svg>
  );
};
