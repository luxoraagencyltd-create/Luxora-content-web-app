import React, { useMemo } from 'react';
import { Task, Issue } from '../types';

interface Props {
  tasks: Task[];
  issues: Issue[];
  dateRange: { start: string, end: string };
  setDateRange: (range: { start: string, end: string }) => void;
}

const ClientVisuals: React.FC<Props> = ({ tasks, issues, dateRange }) => {
  
  // --- HELPERS ---
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') return '-';
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
       const day = date.getDate().toString().padStart(2, '0');
       const month = (date.getMonth() + 1).toString().padStart(2, '0');
       const year = date.getFullYear();
       return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  const parseDate = (dStr: string) => {
    if (!dStr || dStr === 'N/A' || dStr.trim() === '') return null;
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) return d;
    try {
      const parts = dStr.split(/[/-]/);
      if (parts.length === 3) {
         const day = parseInt(parts[0]);
         const monthStr = parts[1];
         const year = parseInt(parts[2]);
         const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
         const mIdx = months.findIndex(m => m === monthStr.toLowerCase());
         if (mIdx !== -1) return new Date(year, mIdx, day);
      }
    } catch (e) {}
    return null;
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // --- LOGIC DATA ---
  const masterTasks = useMemo(() => tasks.filter(t => t.tab === '05'), [tasks]);
  
  const filteredTasks = useMemo(() => {
    const sourceTasks = masterTasks.length > 0 ? masterTasks : tasks.filter(t => t.tab === '06');
    return sourceTasks.filter(t => {
      if (!t.id) return false;
      const taskDate = parseDate(t.planEnd);
      if (!taskDate) return true; 

      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      taskDate.setHours(0,0,0,0);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);

      return taskDate >= start && taskDate <= end;
    });
  }, [tasks, masterTasks, dateRange]);

  const filteredIssues = useMemo(() => {
    return issues.filter(i => {
       if (!i.id || !i.summary) return false;
       const issueDate = parseDate(i.dueDate || i.dateRaised);
       if (!issueDate) return true;
       const start = new Date(dateRange.start);
       const end = new Date(dateRange.end);
       issueDate.setHours(0,0,0,0);
       start.setHours(0,0,0,0);
       end.setHours(0,0,0,0);
       return issueDate >= start && issueDate <= end;
    });
  }, [issues, dateRange]);

  const activeIssues = useMemo(() => filteredIssues.filter(i => {
      const s = (i.status || '').toLowerCase();
      return s !== 'closed' && s !== 'hoàn thành';
  }), [filteredIssues]);

  const criticalIssuesCount = useMemo(() => activeIssues.filter(i => (i.severity || '').trim().toLowerCase() === 'critical').length, [activeIssues]);

  // --- STATS CONFIG ---
  const statusConfigs = useMemo((): { id: string; label: string; color: string; icon: string }[] => [
    { id: 'To do', label: 'Todo', color: '#a39e93', icon: 'fa-list-ul' },
    { id: 'Doing', label: 'In Progress', color: '#f2ede4', icon: 'fa-spinner' },
    { id: 'Review', label: 'Review', color: '#d4af37', icon: 'fa-eye' },
    { id: 'Overdue', label: 'Trễ Deadline', color: '#c41e3a', icon: 'fa-triangle-exclamation' },
    { id: 'Done', label: 'Done', color: '#00f2ff', icon: 'fa-check-double' },
  ], []);

  const getTaskStatus = React.useCallback((t: Task) => {
    if (t.status === 'Done') return 'Done';
    const dEnd = parseDate(t.planEnd);
    if (dEnd) {
       dEnd.setHours(0,0,0,0);
       if (dEnd < today && t.status !== 'Done') return 'Overdue';
    }
    const s = (t.status || '').toLowerCase().trim();
    if (s === 'to do' || s === 'pending') return 'To do';
    if (s === 'doing' || s === 'in progress') return 'Doing';
    if (s === 'review' || s === 'need edit') return 'Review';
    return 'To do';
  }, [today]);

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    statusConfigs.forEach(cfg => map[cfg.id] = []);
    filteredTasks.forEach(t => {
      const status = getTaskStatus(t);
      if (map[status]) map[status].push(t);
    });
    return map;
  }, [filteredTasks, statusConfigs, getTaskStatus]);

  const totalFiltered = filteredTasks.length || 1;
  const stats = useMemo(() => {
    return statusConfigs.map(cfg => ({
      ...cfg,
      count: tasksByStatus[cfg.id].length,
      percent: Math.round((tasksByStatus[cfg.id].length / totalFiltered) * 100)
    }));
  }, [tasksByStatus, totalFiltered, statusConfigs]);

  const normalizeSeverity = (sev: string) => {
      const s = (sev || '').trim().toLowerCase();
      if (s === 'critical') return 'Critical';
      if (s === 'high') return 'High';
      if (s === 'medium') return 'Medium';
      return 'Low'; 
  };

  const getPriorityStyle = (p: string) => {
      const s = (p || '').toLowerCase().trim();
      if (s === 'critical') return 'bg-[#c41e3a] text-white shadow-[0_0_8px_#c41e3a]';
      if (s === 'high') return 'bg-[#d4af37] text-black';
      if (s === 'medium') return 'bg-[#8c7333] text-white';
      return 'bg-[#a39e93] text-black';
  };

  const getSlackStyle = (val: string) => {
     if (!val || val === '-') return 'text-[#a39e93]';
     const num = parseInt(val);
     if (isNaN(num)) return 'text-[#f2ede4]';
     if (num > 0) return 'text-[#c41e3a] font-black animate-pulse';
     return 'text-[#00f2ff] font-bold'; 
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* FILTER HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#1a1412] p-6 rounded-2xl border border-[#d4af37]/20 flex flex-wrap items-center justify-between gap-6 shadow-2xl lacquer-gloss relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#d4af37]"></div>
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
               <i className="fa-solid fa-calendar-range text-[#d4af37] text-xl"></i>
             </div>
             <div>
               <h3 className="heritage-font text-base font-bold text-[#d4af37] tracking-[0.2em] uppercase">Bộ lọc dự án</h3>
               <p className="code-font text-[9px] text-[#a39e93] uppercase tracking-widest mt-1">Phạm vi quan sát dữ liệu</p>
             </div>
          </div>
          <div className="flex items-center gap-3 bg-[#0d0b0a] px-4 py-2 rounded-xl border border-[#d4af37]/30 shadow-inner">
            <span className="text-[#a39e93] text-[10px] code-font uppercase tracking-widest">Active Range:</span>
            <span className="heritage-font text-[#d4af37] text-sm font-bold">{formatDateDisplay(dateRange.start)}</span>
            <span className="text-[#a39e93] text-xs px-1"><i className="fa-solid fa-arrow-right-long"></i></span>
            <span className="heritage-font text-[#d4af37] text-sm font-bold">{formatDateDisplay(dateRange.end)}</span>
          </div>
        </div>
        
        {/* ISSUE OVERVIEW CARD */}
        <div className="lg:col-span-4 bg-[#1a1412] p-6 rounded-2xl border border-[#c41e3a]/30 shadow-2xl lacquer-gloss relative group overflow-hidden">
          <div className={`absolute inset-0 bg-[#c41e3a]/5 transition-opacity ${criticalIssuesCount > 0 ? 'opacity-100' : 'opacity-0'}`}></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <i className={`fa-solid fa-triangle-exclamation text-xl ${criticalIssuesCount > 0 ? 'text-[#c41e3a] animate-pulse' : 'text-[#a39e93]'}`}></i>
              <span className="heritage-font text-xs font-bold text-[#f2ede4] tracking-widest">RỦI RO HỆ THỐNG</span>
            </div>
            <span className="code-font text-lg font-black text-[#c41e3a]">{activeIssues.length} ISSUES</span>
          </div>
          <div className="mt-4 flex gap-2 relative z-10">
            <div className="bg-[#c41e3a]/10 px-3 py-1 rounded border border-[#c41e3a]/30 flex flex-col">
              <span className="text-[7px] text-[#c41e3a] font-black uppercase">Critical</span>
              <span className="text-sm font-bold text-white">{criticalIssuesCount}</span>
            </div>
            <div className="bg-white/5 px-3 py-1 rounded border border-white/10 flex flex-col flex-1">
              <span className="text-[7px] text-[#a39e93] font-black uppercase">Active Owners</span>
              <span className="text-sm font-bold text-[#f2ede4]">{[...new Set(activeIssues.map(i => i.owner).filter(o => o && o.trim()))].length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- PHẦN 2: CHART & RISK (ĐÃ THÊM LẠI ĐẦY ĐỦ) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 1. DONUT CHART */}
        <div className="lg:col-span-5 bg-[#1a1412] p-10 rounded-3xl border border-[#d4af37]/20 lacquer-gloss flex flex-col items-center shadow-2xl relative min-h-[500px]">
          <h3 className="heritage-font text-lg font-bold text-[#d4af37] tracking-[0.3em] mb-12 text-center uppercase border-b border-[#d4af37]/10 pb-4 w-full">Tổng quan Giao thức</h3>
          <div className="relative w-64 h-64 my-4">
             <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {stats.reduce((acc, curr, idx) => {
                  if (curr.percent === 0) return acc;
                  const strokeDash = `${curr.percent} ${100 - curr.percent}`;
                  const offset = 100 - acc.totalPercent;
                  acc.totalPercent += curr.percent;
                  const circle = (<circle key={idx} cx="18" cy="18" r="15.915" fill="transparent" stroke={curr.color} strokeWidth="3" strokeDasharray={strokeDash} strokeDashoffset={offset} strokeLinecap="round" />);
                  acc.elements.push(circle);
                  return acc;
                }, { totalPercent: 0, elements: [] as JSX.Element[] }).elements}
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="heritage-font text-5xl font-black text-white">{filteredTasks.length}</span>
                <span className="code-font text-[10px] text-[#d4af37] font-black uppercase tracking-[0.4em]">Nodes</span>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-8 w-full">
            {stats.map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                <span className="code-font text-[9px] text-[#a39e93] flex-1 font-bold">{s.label}</span>
                <span className="code-font text-[10px] font-black text-white">{s.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. RISK ANALYSIS */}
        <div className="lg:col-span-7 bg-[#1a1412] p-10 rounded-3xl border border-[#d4af37]/20 lacquer-gloss shadow-2xl min-h-[500px] flex flex-col">
          <h3 className="heritage-font text-lg font-bold text-[#c41e3a] tracking-[0.2em] mb-10 uppercase border-b border-[#c41e3a]/10 pb-4">Chỉ số rủi ro vận hành</h3>
          <div className="grid grid-cols-2 gap-6 mb-8">
             <div className="p-4 bg-[#0d0b0a] rounded-xl border border-[#c41e3a]/20">
               <div className="flex justify-between items-start mb-2">
                 <i className="fa-solid fa-biohazard text-[#c41e3a]"></i>
                 <span className="code-font text-[10px] text-[#a39e93] font-bold">Severity Ratio</span>
               </div>
               <div className="text-2xl font-black text-[#f2ede4]">{activeIssues.length > 0 ? Math.round((criticalIssuesCount/activeIssues.length)*100) : 0}%</div>
               <p className="text-[8px] text-[#a39e93] uppercase mt-1">Critical issues on total active</p>
             </div>
             <div className="p-4 bg-[#0d0b0a] rounded-xl border border-[#00f2ff]/20">
               <div className="flex justify-between items-start mb-2">
                 <i className="fa-solid fa-clock-rotate-left text-[#00f2ff]"></i>
                 <span className="code-font text-[10px] text-[#a39e93] font-bold">AVG Aging</span>
               </div>
               <div className="text-2xl font-black text-[#f2ede4]">{activeIssues.length > 0 ? Math.round(activeIssues.reduce((acc, i) => acc + i.daysOpen, 0) / activeIssues.length) : 0} <span className="text-[10px]">Days</span></div>
               <p className="text-[8px] text-[#a39e93] uppercase mt-1">Average time issues remain open</p>
             </div>
          </div>

          <div className="space-y-6 flex-1">
            {['Critical', 'High', 'Medium', 'Low'].map(sev => {
               const count = filteredIssues.filter(i => normalizeSeverity(i.severity) === sev).length;
               const percent = filteredIssues.length > 0 ? Math.round((count/filteredIssues.length)*100) : 0;
               const colors: Record<string, string> = { Critical: '#c41e3a', High: '#d4af37', Medium: '#8c7333', Low: '#a39e93' };
               return (
                 <div key={sev} className="space-y-2">
                   <div className="flex justify-between text-[9px] code-font font-bold uppercase tracking-widest text-[#a39e93]">
                     <span>{sev} Issue</span>
                     <span className="text-white">{count} Nodes</span>
                   </div>
                   <div className="h-2 bg-[#0d0b0a] rounded-full overflow-hidden">
                     <div className="h-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: colors[sev] }}></div>
                   </div>
                 </div>
               )
             })}
          </div>

          <div className="mt-8 p-4 bg-[#c41e3a]/5 border border-[#c41e3a]/20 rounded-xl">
               <p className="code-font text-[9px] text-[#f2ede4]/60 leading-relaxed">
               <i className="fa-solid fa-circle-info mr-2 text-[#c41e3a]"></i>
               Dữ liệu Issue được trích xuất trực tiếp từ tab <span className="text-[#c41e3a] font-bold">Issue Log</span>. Hội viên nên ưu tiên xem xét các sự cố Critical để tránh gián đoạn tiến độ chung.
             </p>
          </div>
        </div>
      </div>

      {/* --- PHẦN 3: BẢNG CHI TIẾT TASK (TASK MASTER) --- */}
      <div className="bg-[#1a1412] rounded-3xl border border-[#d4af37]/20 p-8 shadow-2xl lacquer-gloss animate-in fade-in slide-in-from-bottom-8">
         <div className="flex justify-between items-center mb-6 border-b border-[#d4af37]/10 pb-4">
            <h3 className="heritage-font text-lg font-bold text-[#d4af37] tracking-[0.3em] uppercase">CHI TIẾT TIẾN ĐỘ (TASK MASTER)</h3>
            <span className="code-font text-[10px] text-[#a39e93]">{filteredTasks.length} NODES</span>
         </div>
         <div className="overflow-x-auto rounded-xl border border-[#d4af37]/10">
            <table className="w-full text-left text-[11px] border-collapse min-w-[1000px]">
               <thead>
                  <tr className="bg-[#0d0b0a] text-[#a39e93] border-b border-[#d4af37]/20">
                     <th className="p-4 uppercase tracking-widest w-32 border-r border-[#d4af37]/10">ID (A)</th>
                     <th className="p-4 uppercase tracking-widest border-r border-[#d4af37]/10">TÊN CÔNG VIỆC (C)</th>
                     <th className="p-4 uppercase tracking-widest w-32 text-center border-r border-[#d4af37]/10">TRẠNG THÁI (G)</th>
                     <th className="p-4 uppercase tracking-widest w-32 text-center border-r border-[#d4af37]/10">ƯU TIÊN (H)</th>
                     <th className="p-4 uppercase tracking-widest w-32 text-center border-r border-[#d4af37]/10">PLAN END (K)</th>
                     <th className="p-4 uppercase tracking-widest w-24 text-center">ĐỘ TRỄ (O)</th>
                  </tr>
               </thead>
               <tbody className="bg-[#0d0b0a]/50">
                  {filteredTasks.length === 0 ? (
                    <tr><td colSpan={6} className="p-10 text-center italic opacity-30 code-font">Không có dữ liệu hiển thị...</td></tr>
                  ) : filteredTasks.map(t => (
                    <tr key={t.id} className="border-b border-[#d4af37]/5 hover:bg-[#d4af37]/5 transition-colors">
                       <td className="p-4 code-font text-[#00f2ff] font-bold">{t.id}</td>
                       <td className="p-4 font-bold text-[#f2ede4] italic">{t.name}</td>
                       <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase ${
                             t.status.toLowerCase() === 'done' ? 'border-[#00f2ff] text-[#00f2ff] bg-[#00f2ff]/10' : 'border-[#a39e93] text-[#a39e93]'
                          }`}>{t.status}</span>
                       </td>
                       <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${getPriorityStyle(t.priority || '')}`}>
                             {t.priority || '-'}
                          </span>
                       </td>
                       <td className="p-4 text-center code-font text-[#d4af37]">
                          {formatDateDisplay(t.planEnd)}
                       </td>
                       <td className={`p-4 text-center code-font font-bold ${getSlackStyle(t.slack || '')}`}>
                          {t.slack || '-'}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

    </div>
  );
};

export default ClientVisuals;