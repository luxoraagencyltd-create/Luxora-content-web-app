
import React from 'react';
import { Project } from '../types';

interface Props {
  projects: Project[];
  onSelect: (p: Project) => void;
  onLogout: () => void;
}

const ProjectSelector: React.FC<Props> = ({ projects, onSelect, onLogout }) => {
  return (
    <div className="fixed inset-0 bg-[#0d0b0a] flex items-center justify-center p-6 z-[200] overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#c41e3a]/10 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00f2ff]/5 rounded-full blur-[150px]"></div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block p-5 bg-[#c41e3a] rounded-xl shadow-[0_0_30px_rgba(196,30,58,0.4)] mb-8 border border-white/10 animate-pulse">
            <i className="fa-solid fa-lotus text-white text-4xl"></i>
          </div>
          <h1 className="heritage-font text-5xl font-black text-[#d4af37] mb-4 tracking-[0.3em] drop-shadow-lg">Phòng Chờ Giao Thức</h1>
          <p className="code-font text-[#a39e93] text-[10px] uppercase tracking-[0.4em] opacity-60">Vui lòng chọn Project Node để bắt đầu phiên làm việc</p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-[#1a1412] border border-[#c41e3a]/30 p-12 rounded-3xl text-center shadow-2xl lacquer-gloss">
             <i className="fa-solid fa-triangle-exclamation text-[#c41e3a] text-4xl mb-4"></i>
             <p className="heritage-font text-white text-xl">Bạn chưa được gán vào Dự án nào!</p>
             <p className="code-font text-[10px] text-[#a39e93] mt-2 uppercase tracking-widest">Vui lòng liên hệ Admin để được cấp quyền truy cập Node</p>
             <button onClick={onLogout} className="mt-8 heritage-font bg-[#c41e3a] text-white px-8 py-3 rounded font-black text-xs hover:bg-white hover:text-[#c41e3a] transition-all">THOÁT HỆ THỐNG</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelect(project)}
                className="group relative bg-[#1a1412] border border-[#d4af37]/20 p-8 rounded-2xl text-left transition-all hover:bg-[#1a1412] hover:border-[#00f2ff] hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,242,255,0.1)] shadow-2xl lacquer-gloss overflow-hidden"
              >
                {/* Accent line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent group-hover:via-[#00f2ff] transition-all"></div>
                
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 rounded-lg bg-[#0d0b0a] border border-[#d4af37]/20 flex items-center justify-center group-hover:border-[#00f2ff] group-hover:scale-110 transition-all duration-500">
                    <i className="fa-solid fa-folder-tree text-[#d4af37] group-hover:text-[#00f2ff] text-2xl"></i>
                  </div>
                  <span className="code-font text-[8px] text-[#a39e93] bg-[#0d0b0a] px-2 py-1 rounded border border-[#d4af37]/10 tracking-widest">{project.id}</span>
                </div>

                <h3 className="heritage-font text-2xl font-bold text-[#f2ede4] mb-2 group-hover:text-[#d4af37] transition-colors">{project.name}</h3>
                <div className="space-y-1 mb-10">
                   <div className="flex items-center gap-2 text-[9px] text-[#a39e93] uppercase tracking-widest">
                      <span className="text-[#d4af37]">Team:</span> 
                      <span>{project.staffIds.length} Cố vấn</span>
                      <span>•</span>
                      <span>{project.clientIds.length} Hội viên</span>
                   </div>
                   <p className="code-font text-[9px] text-[#a39e93] uppercase tracking-widest opacity-60 mt-1">
                      <span className="text-[#00f2ff]">Cloud:</span> {project.sheetUrl ? 'Private Node' : 'Shared Core'}
                   </p>
                </div>
                
                <div className="flex items-center gap-3 text-[10px] font-black heritage-font text-[#d4af37] tracking-[0.2em] group-hover:text-[#00f2ff] transition-all">
                  <span>TRUY CẬP NODE</span>
                  <i className="fa-solid fa-chevron-right text-[8px] group-hover:translate-x-1 transition-transform"></i>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-20 pt-10 border-t border-[#1a1412] flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="code-font text-[#a39e93] text-[9px] uppercase tracking-widest opacity-40 italic">© 2024 Luxora Cyber Temple. Restricted Access.</p>
          <button onClick={onLogout} className="heritage-font text-[#c41e3a] text-xs font-black tracking-widest hover:text-white transition-all flex items-center gap-2">
            <i className="fa-solid fa-power-off"></i> THOÁT DANH TÍNH
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSelector;
