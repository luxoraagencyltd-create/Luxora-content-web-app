
import React from 'react';
import { Task } from '../types';

interface Props {
  tasks: Task[];
  onTaskSubmit: (action: string, id: string) => void;
  currentTab: '05' | '06';
}

const SheetSimulator: React.FC<Props> = ({ tasks, onTaskSubmit, currentTab }) => {
  return (
    <div className="flex-1 overflow-auto bg-[#1a1412] rounded-xl shadow-inner">
      <table className="w-full text-left text-[11px] border-collapse min-w-[1200px]">
        <thead>
          <tr className="bg-[#0d0b0a] sticky top-0 border-b border-[#d4af37]/20 z-10 shadow-lg">
            <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-36 uppercase tracking-widest">ID Giao thức</th>
            {currentTab === '05' ? (
              <>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-36">GIAI ĐOẠN</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10">TÊN CÔNG VIỆC</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-32">NGƯỜI THỰC HIỆN</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-32">TRẠNG THÁI</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-24 text-center">PLAN END</th>
              </>
            ) : (
              <>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-36">DẠNG CONTENT</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-36">THỜI GIAN ĐĂNG</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-32">PILLAR</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10">ANGLE / BẢN VẼ</th>
                <th className="p-4 heritage-font font-bold text-[#d4af37] border-r border-[#d4af37]/10 w-56">SEEDING / CONTENT</th>
              </>
            )}
            <th className="p-4 heritage-font font-bold text-[#d4af37] text-center w-32 bg-[#d4af37]/5">KÍCH HOẠT</th>
          </tr>
        </thead>
        <tbody className="bg-[#1a1412]">
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-[#d4af37]/10 hover:bg-[#d4af37]/5 transition-colors group">
              <td className="p-4 code-font font-bold text-[#00f2ff] border-r border-[#d4af37]/10 neon-blue-glow">{task.id}</td>
              {currentTab === '05' ? (
                <>
                  <td className="p-4 text-[#a39e93] border-r border-[#d4af37]/10 text-[9px] font-bold">{task.phase}</td>
                  <td className="p-4 font-medium text-[#f2ede4] border-r border-[#d4af37]/10 italic">{task.name}</td>
                  <td className="p-4 text-[#a39e93] border-r border-[#d4af37]/10 font-bold tracking-wider uppercase text-[9px]">{task.staff}</td>
                  <td className="p-4 border-r border-[#d4af37]/10"><StatusBadge status={task.status} /></td>
                  <td className="p-4 border-r border-[#d4af37]/10 text-center code-font text-[#d4af37]">{task.planEnd}</td>
                </>
              ) : (
                <>
                  <td className="p-4 border-r border-[#d4af37]/10"><span className="bg-[#d4af37]/10 px-2 py-1 rounded text-[#d4af37] font-bold code-font border border-[#d4af37]/20 uppercase text-[9px]">{task.phase}</span></td>
                  <td className="p-4 text-[#a39e93] border-r border-[#d4af37]/10 code-font tracking-wider">{task.planEnd}</td>
                  <td className="p-4 border-r border-[#d4af37]/10 italic text-[#a39e93]">{task.pillar}</td>
                  <td className="p-4 font-bold text-[#f2ede4] border-r border-[#d4af37]/10 heritage-font tracking-wider text-[10px]">{task.name}</td>
                  <td className="p-4 border-r border-[#d4af37]/10">
                    <div className="flex flex-col gap-1">
                      <div className="text-[9px] text-[#00f2ff] opacity-60 truncate">S: {task.seeding}</div>
                      <div className="text-[9px] text-[#f2ede4] opacity-80 line-clamp-1 italic">C: {task.contentBody}</div>
                    </div>
                  </td>
                </>
              )}
              <td className="p-4 text-center bg-[#d4af37]/5">
                {task.status === 'Review' ? (
                  <button onClick={() => onTaskSubmit('approve', task.id)} className="heritage-font bg-[#c41e3a] text-white px-4 py-1.5 rounded shadow-[0_0_10px_rgba(196,30,58,0.3)] text-[10px] font-black hover:bg-white hover:text-[#c41e3a] transition-all">GỬI DUYỆT</button>
                ) : (
                  <i className={`fa-solid ${task.status === 'Done' ? 'fa-circle-check text-[#00f2ff]' : 'fa-hourglass-start text-[#a39e93]'}`}></i>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    'Done': 'border-[#00f2ff] text-[#00f2ff] bg-[#00f2ff]/5',
    'Review': 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/5',
    'Critical': 'border-[#c41e3a] text-[#c41e3a] bg-[#c41e3a]/5 animate-pulse font-black shadow-[0_0_10px_rgba(196,30,58,0.3)]',
    'Need Edit': 'border-[#c41e3a] text-[#c41e3a] bg-[#c41e3a]/5'
  };
  return <span className={`code-font px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-widest ${styles[status] || 'bg-[#1a1412] text-[#a39e93] border-[#a39e93]/30'}`}>{status}</span>;
};

export default SheetSimulator;
