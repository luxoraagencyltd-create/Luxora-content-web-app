
import React from 'react';
import { Issue } from '../types';

interface Props {
  issues: Issue[];
}

const IssueLog: React.FC<Props> = ({ issues }) => {
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'bg-[#c41e3a] text-white shadow-[0_0_10px_#c41e3a]';
      case 'High': return 'bg-[#d4af37] text-black';
      case 'Medium': return 'bg-[#8c7333] text-white';
      default: return 'bg-[#a39e93] text-black';
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-[#1a1412] p-6 rounded-2xl border border-[#c41e3a]/20 lacquer-gloss relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#c41e3a]"></div>
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-[#c41e3a]/10 flex items-center justify-center border border-[#c41e3a]/30 shadow-[0_0_15px_rgba(196,30,58,0.1)]">
             <i className="fa-solid fa-bug-slash text-[#c41e3a] text-xl"></i>
           </div>
           <div>
             <h3 className="heritage-font text-base font-bold text-[#f2ede4] tracking-[0.2em] uppercase">Nhật ký Sự cố (Issue Log)</h3>
             <p className="code-font text-[9px] text-[#a39e93] uppercase tracking-widest mt-1">Truy vết và xử lý các điểm nghẽn Giao thức</p>
           </div>
        </div>
      </div>

      <div className="bg-[#1a1412] rounded-2xl border border-[#d4af37]/10 overflow-hidden shadow-2xl flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#0d0b0a] text-[#a39e93] border-b border-[#d4af37]/10 sticky top-0 z-10">
                <th className="p-4 uppercase tracking-tighter w-24">ID</th>
                <th className="p-4 uppercase tracking-widest w-32">Loại</th>
                <th className="p-4 uppercase tracking-widest">Nội dung vấn đề</th>
                <th className="p-4 uppercase tracking-widest w-24 text-center">Mức độ</th>
                <th className="p-4 uppercase tracking-widest w-32">Chủ trì</th>
                <th className="p-4 uppercase tracking-widest w-24 text-center">Status</th>
                <th className="p-4 uppercase tracking-widest w-24 text-center">Hạn Xử Lý</th>
              </tr>
            </thead>
            <tbody>
              {issues.length === 0 ? (
                <tr><td colSpan={7} className="p-20 text-center code-font text-[#a39e93] opacity-30 tracking-[0.5em] uppercase italic">Chưa phát hiện rò rỉ Giao thức...</td></tr>
              ) : issues.map((iss) => (
                <tr key={iss.id} className="border-b border-[#d4af37]/5 hover:bg-[#c41e3a]/5 transition-colors group">
                  <td className="p-4 code-font text-[#00f2ff] font-bold neon-blue-glow">{iss.id}</td>
                  <td className="p-4"><span className="code-font text-[9px] bg-white/5 px-2 py-0.5 rounded text-[#a39e93]">{iss.type}</span></td>
                  <td className="p-4">
                    <div className="font-medium text-[#f2ede4] italic">{iss.summary}</div>
                    {iss.solution && <div className="text-[9px] text-[#00f2ff] mt-1 opacity-60">↳ Giải pháp: {iss.solution}</div>}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getSeverityColor(iss.severity)}`}>
                      {iss.severity}
                    </span>
                  </td>
                  <td className="p-4 text-[#a39e93] font-bold uppercase tracking-tighter">{iss.owner}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${iss.status === 'Closed' ? 'border-[#00f2ff] text-[#00f2ff]' : 'border-[#d4af37] text-[#d4af37]'}`}>
                      {iss.status}
                    </span>
                  </td>
                  <td className="p-4 text-center code-font font-bold text-[#c41e3a]">{iss.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IssueLog;
