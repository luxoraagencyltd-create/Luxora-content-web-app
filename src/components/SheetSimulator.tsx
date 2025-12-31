import React from 'react';
import { Task } from '../types';

interface Props {
  tasks: Task[];
  onTaskSubmit: (action: string, taskId: string) => void;
  currentTab: '05' | '06';
}

const SheetSimulator: React.FC<Props> = ({ tasks, onTaskSubmit, currentTab }) => {
  return (
    <div className="flex-1 overflow-auto bg-[#1a1412] rounded-xl shadow-inner">
      <table className="w-full text-left text-[11px] border-collapse min-w-[1200px]">
        <thead>
          <tr className="bg-[#0d0b0a] sticky top-0 border-b border-[#d4af37]/20 z-10 shadow-lg">
            {currentTab === '05' && (
              <>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-36 uppercase tracking-widest">ID Giao thức</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-36">GIAI ĐOẠN</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10">TÊN CÔNG VIỆC</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-32">NGƯỜI THỰC HIỆN</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-32">TRẠNG THÁI</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-24 text-center">PLAN END</th>
              </>
            )}

            {currentTab === '06' && (
              <>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-32 uppercase tracking-widest">ID (A)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-32">DẠNG (B)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-32 text-center">NGÀY (C)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-32 text-center">STATUS (D)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-48">ANGLE (F)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-48">SEEDING (H)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-64">CONTENT (I)</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-24 text-center">LINK (G)</th>
              </>
            )}
            
            <th className="p-4 heritage-font font-bold text-[#d4af37] text-center w-40 bg-[#d4af37]/5">KÍCH HOẠT</th>
          </tr>
        </thead>
        <tbody className="bg-[#1a1412]">
          {tasks.map(r => (
            <tr key={r.id} className="border-b border-[#d4af37]/10 hover:bg-[#d4af37]/5 transition-colors group">
              {currentTab === '05' && (
                <>
                  <td className="p-4 code-font font-bold text-[#00f2ff] border-r border-[#d4af37]/10 neon-blue-glow">{r.id}</td>
                  <td className="p-4 text-[#a39e93] border-r border-[#d4af37]/10 text-[9px] font-bold">{r.phase}</td>
                  <td className="p-4 font-medium text-[#f2ede4] border-r border-[#d4af37]/10 italic">{r.name}</td>
                  <td className="p-4 text-[#a39e93] border-r border-[#d4af37]/10 font-bold tracking-wider uppercase text-[9px]">{r.staff}</td>
                  <td className="p-4 border-r border-[#d4af37]/10"><StatusBadge status={r.status} /></td>
                  <td className="p-4 border-r border-[#d4af37]/10 text-center code-font text-[#d4af37]">{r.planEnd}</td>
                </>
              )}

              {currentTab === '06' && (
                <>
                  <td className="p-4 code-font font-bold text-[#00f2ff] border-r border-[#d4af37]/10 neon-blue-glow">{r.id}</td>
                  <td className="p-4 border-r border-[#d4af37]/10">
                     {/* 👇 FIX LỖI CHỒNG CHỮ: thêm whitespace-normal và inline-block */}
                     <span className="bg-[#d4af37]/10 px-2 py-1 rounded text-[#d4af37] font-bold code-font border border-[#d4af37]/20 uppercase text-[9px] whitespace-normal inline-block text-center w-full leading-tight">
                       {r.phase}
                     </span>
                  </td>
                  <td className="p-4 text-[#a39e93] border-r border-[#d4af37]/10 code-font tracking-wider text-center">{r.planEnd}</td>
                  <td className="p-4 border-r border-[#d4af37]/10 text-center"><StatusBadge status={r.status} /></td>
                  <td className="p-4 font-bold text-[#f2ede4] border-r border-[#d4af37]/10 heritage-font tracking-wider text-[10px] italic">{r.name}</td>
                  <td className="p-4 border-r border-[#d4af37]/10 text-[9px] text-[#00f2ff] opacity-80 whitespace-pre-wrap">{r.seeding}</td>
                  <td className="p-4 border-r border-[#d4af37]/10 text-[9px] text-[#f2ede4] opacity-80 whitespace-pre-wrap">{r.contentBody}</td>
                  <td className="p-4 border-r border-[#d4af37]/10 text-center">
                    {r.link && r.link !== '#' ? (
                        <a href={r.link} target="_blank" rel="noreferrer" className="text-[#00f2ff] hover:underline code-font text-[9px]"><i className="fa-solid fa-link"></i> Link</a>
                    ) : ( <span className="text-[#a39e93]/30">-</span> )}
                  </td>
                </>
              )}

              {/* ACTION BUTTONS */}
              <td className="p-4 text-center bg-[#d4af37]/5">
                {r.status === 'Review' ? (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => onTaskSubmit('approve', r.id)} className="heritage-font bg-[#d4af37] text-[#0d0b0a] px-3 py-1.5 rounded shadow-[0_0_10px_rgba(212,175,55,0.3)] text-[9px] font-black hover:bg-white transition-all w-full">
                      <i className="fa-solid fa-check mr-1"></i> APPROVE
                    </button>
                    {/* 👇 NÚT MỚI: YÊU CẦU SỬA */}
                    <button onClick={() => onTaskSubmit('request_edit', r.id)} className="heritage-font bg-transparent border border-[#c41e3a] text-[#c41e3a] px-3 py-1.5 rounded text-[9px] font-black hover:bg-[#c41e3a] hover:text-white transition-all w-full">
                      <i className="fa-solid fa-pen-to-square mr-1"></i> NEED EDIT
                    </button>
                  </div>
                ) : (
                  <i className={`fa-solid ${r.status === 'Done' ? 'fa-circle-check text-[#00f2ff]' : r.status === 'Need Edit' ? 'fa-triangle-exclamation text-[#c41e3a]' : 'fa-hourglass-start text-[#a39e93]'}`}></i>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Cuối file SheetSimulator.tsx

const StatusBadge = ({ status }: { status: string }) => {
  const s = (status || '').toLowerCase().trim();
  
  // Mặc định (To do)
  let style = "border-[#94a3b8] text-[#94a3b8] bg-[#94a3b8]/10"; // Xám

  if (s === 'done') style = "border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]"; // Xanh lá
  else if (s === 'review') style = "border-[#eab308] text-[#eab308] bg-[#eab308]/10 shadow-[0_0_10px_rgba(234,179,8,0.2)]"; // Vàng
  else if (s === 'doing' || s === 'in progress') style = "border-[#3b82f6] text-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]"; // Xanh dương
  else if (s === 'need edit') style = "border-[#f97316] text-[#f97316] bg-[#f97316]/10 animate-pulse"; // Cam đất
  else if (s === 'cancel') style = "border-[#ef4444] text-[#ef4444] bg-[#ef4444]/10"; // Đỏ
  else if (s === 'pending') style = "border-[#ec4899] text-[#ec4899] bg-[#ec4899]/10"; // Hồng

  return <span className={`code-font px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-widest ${style}`}>{status}</span>;
};

export default SheetSimulator;