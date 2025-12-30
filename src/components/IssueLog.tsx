import React, { useMemo } from 'react';
import { Issue } from '../types';

interface Props {
  issues: Issue[];
  dateRange: { start: string, end: string }; // Nhận thêm dateRange
}

const IssueLog: React.FC<Props> = ({ issues, dateRange }) => {
  
  // Hàm xử lý ngày tháng (Copy lại để đảm bảo hoạt động độc lập)
  const parseDate = (dStr: string) => {
    if (!dStr || dStr === 'N/A' || dStr.trim() === '') return null;
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) return d;
    try {
      const [day, month, year] = dStr.split('/');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const mIdx = months.findIndex(m => m.toLowerCase() === (month || '').toLowerCase());
      if (mIdx === -1) return null;
      return new Date(parseInt(year), mIdx, parseInt(day));
    } catch (e) { return null; }
  };

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // 1. Loại bỏ các dòng rác (không có ID hoặc Summary)
      if (!issue.id || !issue.summary) return false;

      // 2. Lọc theo Ngày (Dùng Due Date - Cột H)
      const dueDate = parseDate(issue.dueDate);
      
      // Nếu Issue không có Due Date thì vẫn cho hiện (để không bị sót issue quan trọng)
      if (dueDate) {
        dueDate.setHours(0, 0, 0, 0);
        const start = new Date(dateRange.start); start.setHours(0, 0, 0, 0);
        const end = new Date(dateRange.end); end.setHours(0, 0, 0, 0);

        // Logic: Ngày Due Date phải nằm trong khoảng lọc
        if (dueDate < start || dueDate > end) return false;
      }

      return true;
    });
  }, [issues, dateRange]);

  const getSeverityStyle = (sev: string) => {
    const s = (sev || '').trim().toLowerCase();
    switch (s) {
      case 'critical': return 'bg-[#c41e3a] text-white shadow-[0_0_10px_#c41e3a]';
      case 'high': return 'bg-[#d4af37] text-[#0d0b0a]';
      case 'medium': return 'bg-[#8c7333] text-white';
      default: return 'bg-[#a39e93] text-[#0d0b0a]';
    }
  };

  const getStatusStyle = (status: string) => {
     const s = (status || '').trim().toLowerCase();
     if (s === 'closed' || s === 'hoàn thành') return 'border-[#00f2ff] text-[#00f2ff] bg-[#00f2ff]/10';
     return 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10';
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-[#1a1412] p-6 rounded-2xl border border-[#c41e3a]/20 lacquer-gloss relative overflow-hidden flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#c41e3a]"></div>
            <div className="w-12 h-12 rounded-xl bg-[#c41e3a]/10 flex items-center justify-center border border-[#c41e3a]/30 shadow-[0_0_15px_rgba(196,30,58,0.1)]">
            <i className="fa-solid fa-bug-slash text-[#c41e3a] text-xl"></i>
            </div>
            <div>
            <h3 className="heritage-font text-base font-bold text-[#f2ede4] tracking-[0.2em] uppercase">Nhật ký Sự cố (Issue Log)</h3>
            <p className="code-font text-[9px] text-[#a39e93] uppercase tracking-widest mt-1">Truy vết và xử lý các điểm nghẽn Giao thức</p>
            </div>
        </div>
        <div className="text-right">
             <div className="code-font text-[9px] text-[#a39e93] uppercase tracking-widest">Filter Range</div>
             <div className="heritage-font text-[#d4af37] text-sm font-bold">
                {dateRange.start} <span className="text-[#a39e93] mx-1">➜</span> {dateRange.end}
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
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center code-font text-[#a39e93] opacity-30 tracking-[0.5em] uppercase italic">
                    Không tìm thấy sự cố trong khoảng thời gian này...
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr key={issue.id} className="border-b border-[#d4af37]/5 hover:bg-[#c41e3a]/5 transition-colors group">
                    <td className="p-4 code-font text-[#00f2ff] font-bold neon-blue-glow">{issue.id}</td>
                    <td className="p-4">
                      <span className="code-font text-[9px] bg-white/5 px-2 py-0.5 rounded text-[#a39e93] border border-white/10">
                        {issue.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-[#f2ede4] italic">{issue.summary}</div>
                      {issue.solution && (
                        <div className="text-[9px] text-[#00f2ff] mt-1 opacity-60">
                          ↳ Giải pháp: {issue.solution}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getSeverityStyle(issue.severity)}`}>
                        {issue.severity || 'Low'}
                      </span>
                    </td>
                    <td className="p-4 text-[#a39e93] font-bold uppercase tracking-tighter text-[9px]">
                      {issue.owner}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${getStatusStyle(issue.status)}`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="p-4 text-center code-font font-bold text-[#c41e3a]">
                      {issue.dueDate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IssueLog;