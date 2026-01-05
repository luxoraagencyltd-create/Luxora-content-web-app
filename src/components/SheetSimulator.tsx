import React from 'react';
import { Task } from '../types';

interface Props {
  tasks: Task[];
  onTaskSubmit: (action: string, taskId: string) => void;
  currentTab: '05' | '06';
}

const SheetSimulator: React.FC<Props> = ({ tasks, onTaskSubmit, currentTab }) => {

  // 1. FORMAT NGÀY
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} - ${month} - ${year}`;
  };

  // 2. RENDER LINK (Nút bấm đẹp)
  const renderLink = (url?: string, label: string = "OPEN") => {
    if (!url || url === '#' || url.trim() === '') return <span className="text-[#888]/30">-</span>;
    
    // Nếu là link http -> hiện nút bấm
    if (url.startsWith('http')) {
        return (
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#00f3ff]/10 border border-[#00f3ff]/40 rounded text-[#00f3ff] hover:bg-[#00f3ff] hover:text-black transition-all text-[9px] font-bold uppercase tracking-wider whitespace-nowrap"
              title={url}
            >
                <i className="fa-solid fa-link"></i> {label}
            </a>
        );
    }
    return <span className="text-[9px] text-[#e0e0e0]">{url}</span>;
  };

  const renderClickableContent = (content?: string) => {
    if (!content) return '-';
    if (content.startsWith('http')) {
      return (
        <a href={content} target="_blank" rel="noreferrer" className="text-[#00f3ff] hover:text-white hover:underline transition-colors flex items-center gap-1 code-font text-[9px]">
          <i className="fa-solid fa-link"></i> Mở Link
        </a>
      );
    }
    return <span className="opacity-80 whitespace-pre-wrap">{content}</span>;
  };

  return (
    <div className="flex-1 overflow-auto bg-[#1a1412] rounded-xl shadow-inner">
      <table className="w-full text-left text-[11px] border-collapse min-w-[1400px]">
        <thead>
          <tr className="bg-[#0d0b0a] sticky top-0 border-b border-[#00f3ff]/20 z-10 shadow-lg">
            
            {/* --- HEADER TAB 05 --- */}
            {currentTab === '05' && (
              <>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-36 uppercase tracking-widest">ID Giao thức</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-36">GIAI ĐOẠN</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5">TÊN CÔNG VIỆC</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-32">NGƯỜI THỰC HIỆN</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-32 text-center">TRẠNG THÁI</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-24 text-center">PLAN END</th>
              </>
            )}

            {/* --- HEADER TAB 06 (CẬP NHẬT THÊM CỘT) --- */}
            {currentTab === '06' && (
              <>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-32 uppercase tracking-widest">ID (A)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-28">DẠNG (B)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-28 text-center">NGÀY (C)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-28 text-center">STATUS (D)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-40">ANGLE (F)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-40">SEEDING (H)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-48">CONTENT (I)</th>
                
                {/* 👇 THÊM 2 CỘT NÀY */}
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-24 text-center">HÌNH (J)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#ffffff]/5 w-24 text-center">LINK BÀI (G)</th>
              </>
            )}
            
            <th className="p-4 heritage-font font-bold text-[#d4af37] text-center w-32 bg-[#d4af37]/5">KÍCH HOẠT</th>
          </tr>
        </thead>
        <tbody className="bg-[#1a1412]">
          {tasks.map(r => (
            <tr key={r.id} className="border-b border-[#ffffff]/5 hover:bg-[#00f3ff]/5 transition-colors group">
              
              {/* --- BODY TAB 05 --- */}
              {currentTab === '05' && (
                <>
                  <td className="p-4 code-font font-bold text-[#00f3ff] border-r border-[#ffffff]/5 neon-blue-glow">{r.id}</td>
                  <td className="p-4 text-[#888] border-r border-[#ffffff]/5 text-[9px] font-bold">{r.phase}</td>
                  <td className="p-4 font-medium text-[#e0e0e0] border-r border-[#ffffff]/5 italic">{r.name}</td>
                  <td className="p-4 text-[#888] border-r border-[#ffffff]/5 font-bold tracking-wider uppercase text-[9px]">{r.staff}</td>
                  <td className="p-4 border-r border-[#ffffff]/5 text-center"><StatusBadge status={r.status} /></td>
                  <td className="p-4 border-r border-[#ffffff]/5 text-center code-font text-[#d4af37]">{formatDateDisplay(r.planEnd)}</td>
                </>
              )}

              {/* --- BODY TAB 06 (CẬP NHẬT) --- */}
              {currentTab === '06' && (
                <>
                  <td className="p-4 code-font font-bold text-[#00f3ff] border-r border-[#ffffff]/5 neon-blue-glow">{r.id}</td>
                  
                  <td className="p-4 border-r border-[#ffffff]/5">
                     <span className="bg-[#00f3ff]/10 px-2 py-1 rounded-sm text-[#00f3ff] font-bold code-font border border-[#00f3ff]/20 uppercase text-[9px] inline-block w-full text-center whitespace-normal">
                       {r.phase}
                     </span>
                  </td>

                  <td className="p-4 text-[#888] border-r border-[#ffffff]/5 code-font tracking-wider text-center text-[10px] whitespace-nowrap">
                    {formatDateDisplay(r.planEnd)}
                  </td>
                  
                  <td className="p-4 border-r border-[#ffffff]/5 text-center align-middle">
                      <StatusBadge status={r.status} />
                  </td>

                  <td className="p-4 font-bold text-[#e0e0e0] border-r border-[#ffffff]/5 heritage-font tracking-wider text-[10px] italic">
                    {r.name}
                  </td>
                  
                  <td className="p-4 border-r border-[#ffffff]/5 text-[9px] text-[#00f3ff]">
                      {renderClickableContent(r.seeding)}
                  </td>
                  
                  <td className="p-4 border-r border-[#ffffff]/5 text-[9px] text-[#e0e0e0]">
                      {renderClickableContent(r.contentBody)}
                  </td>

                  {/* 👇 HIỂN THỊ LINK SOURCE (HÌNH) - Cột J */}
                  <td className="p-4 border-r border-[#ffffff]/5 text-center">
                    {renderLink(r.image, "Source")}
                  </td>

                  {/* 👇 HIỂN THỊ LINK BÀI ĐĂNG - Cột G */}
                  <td className="p-4 border-r border-[#ffffff]/5 text-center">
                    {renderLink(r.link, "View")}
                  </td>
                </>
              )}

              {/* ACTION BUTTONS */}
              <td className="p-4 text-center bg-[#00f3ff]/5">
                {r.status === 'Review' ? (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => onTaskSubmit('approve', r.id)} className="heritage-font bg-[#00f3ff] text-black px-3 py-1.5 rounded-sm shadow-[0_0_10px_rgba(0,243,255,0.3)] text-[9px] font-black hover:bg-white transition-all w-full clip-path-slant whitespace-nowrap">
                      <i className="fa-solid fa-check mr-1"></i> DUYỆT
                    </button>
                    <button onClick={() => onTaskSubmit('request_edit', r.id)} className="heritage-font bg-transparent border border-[#ff003c] text-[#ff003c] px-3 py-1.5 rounded-sm text-[9px] font-black hover:bg-[#ff003c] hover:text-white transition-all w-full clip-path-slant whitespace-nowrap">
                      <i className="fa-solid fa-wrench mr-1"></i> SỬA
                    </button>
                  </div>
                ) : (
                  <i className={`fa-solid ${r.status === 'Done' ? 'fa-circle-check text-[#00f3ff]' : r.status === 'Need Edit' ? 'fa-triangle-exclamation text-[#ff003c] animate-pulse' : 'fa-hourglass-start text-[#888]'}`}></i>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Status Badge
const StatusBadge = ({ status }: { status: string }) => {
  const s = (status || '').toLowerCase().trim();
  let style = "bg-[#1a1412] text-[#888] border-[#888]/30";
  
  if (s === 'done') style = "border-[#00f3ff] text-[#00f3ff] bg-[#00f3ff]/10 shadow-[0_0_8px_rgba(0,243,255,0.2)]";
  else if (s === 'review') style = "border-[#eab308] text-[#eab308] bg-[#eab308]/10 shadow-[0_0_8px_rgba(234,179,8,0.2)]";
  else if (s === 'need edit') style = "border-[#ff003c] text-[#ff003c] bg-[#ff003c]/10 animate-pulse";
  else if (s === 'doing' || s === 'in progress') style = "border-[#f2ede4] text-[#f2ede4] bg-[#f2ede4]/10";
  else if (s === 'to do' || s === 'todo') style = "border-[#888] text-[#888] bg-[#888]/10";

  return (
    <span className={`code-font px-3 py-1 rounded-sm text-[8px] font-bold uppercase border tracking-widest whitespace-nowrap inline-flex items-center justify-center min-w-[70px] ${style}`}>
       {status || 'Unknown'}
    </span>
  );
};

export default SheetSimulator;