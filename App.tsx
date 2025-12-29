
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, ReviewMessage, LogEntry, AppConfig, Project, User, Issue } from './types';
import Sidebar from './components/Sidebar';
import SheetSimulator from './components/SheetSimulator';
import ReviewPortal from './components/ReviewPortal';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import LogPanel from './components/LogPanel';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import ProjectSelector from './components/ProjectSelector';
import ClientVisuals from './components/ClientVisuals';
import IssueLog from './components/IssueLog';

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7HIgfEnoIkUOWFB-xU7dlyno84OaSWrdvJ3LXlX9KryXRJ7uobHzShg6MCoEzbIdh-Q/exec";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parseCustomDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  try {
    const [d, m, y] = dateStr.split('/');
    const monthIndex = MONTHS.indexOf(m);
    if (monthIndex === -1) return null;
    return new Date(parseInt(y), monthIndex, parseInt(d));
  } catch (e) {
    return null;
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '2025-01-01', end: '2026-12-31' });
  const [activeTab, setActiveTab] = useState<'05' | '06'>('06');
  const [waitingForFeedback, setWaitingForFeedback] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('luxora_projects');
    return saved ? JSON.parse(saved) : [{ id: 'P-SAMPLE-ELITE', name: 'LUXORA ELITE 2025', clientIds: ['U-004'], staffIds: ['U-002'], color: 'gold-leaf' }];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('luxora_users');
    return saved ? JSON.parse(saved) : [
      { id: 'U-001', username: 'admin', role: 'ADMIN', fullName: 'Đường Bá Hổ', password: '123' },
      { id: 'U-002', username: 'mentor_vinh', role: 'STAFF', fullName: 'Cố vấn Quang Vinh', password: '123' },
      { id: 'U-004', username: 'member_elite', role: 'CLIENT', fullName: 'Hội Viên Elite', password: '123' }
    ];
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [messages, setMessages] = useState<ReviewMessage[]>([]);

  const addLog = useCallback((event: string, type: 'INFO' | 'SUCCESS' | 'WARNING' = 'INFO') => {
    const newLog: LogEntry = { id: Math.random().toString(), projectId: selectedProjectId || 'SYSTEM', timestamp: new Date(), event, type };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, [selectedProjectId]);

  const syncWithSheet = useCallback(async () => {
    if (!selectedProjectId) return;
    setIsLoading(true);
    addLog("Kích hoạt giao thức đồng bộ thực địa...", "INFO");
    
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getAllData&projectId=${selectedProjectId}`);
      const result = await response.json();
      
      if (result.tasks05) {
        setTasks(prev => {
          const t05 = result.tasks05.map((row: any) => ({
            id: row.id || row['ID task'],
            projectId: selectedProjectId,
            phase: row.phase || row['Giai đoạn (Phase)'],
            name: row.name || row['Tên công việc (Task Name)'],
            status: row.status || row['Trạng thái (Status)'],
            priority: row.priority || row['Ưu tiên (Priority)'],
            planStart: row.planStart || row['Plan Start'],
            duration: parseInt(row.duration) || 0,
            planEnd: row.planEnd || row['Plan End'],
            link: row.link || '#',
            staff: row.staff || row['Người thực hiện (Assignee)'],
            feedbacks: row.feedbacks || [],
            tab: '05'
          }));
          
          const t06 = (result.tasks06 || []).map((row: any) => ({
            id: row.id || row['ID task'],
            projectId: selectedProjectId,
            phase: row.type || row['Dạng content'],
            planEnd: row.publishDate || row['Thời gian đăng'],
            status: row.status || row['Status'],
            pillar: row.pillar || row['Pillar'],
            name: row.angle || row['Angle'],
            link: row.link || row['Link bài đăng'],
            seeding: row.seeding || row['Nội dung seeding'],
            contentBody: row.content || row['Nội dung bài'],
            image: row.image || row['Hình'],
            feedbacks: row.feedbacks || [],
            tab: '06'
          }));
          
          return [...t05, ...t06];
        });
      }

      if (Array.isArray(result.issues)) {
        setIssues(result.issues.map((row: any) => ({
          id: row.id || row['ID'],
          type: row.type || row['Loại (Type)'],
          summary: row.summary || row['Tên vấn đề (Issue Summary)'],
          severity: row.severity || row['Mức độ (Severity)'],
          owner: row.owner || row['Người chịu trách nhiệm (Owner)'],
          status: row.status || row['Trạng thái (Status)'],
          dateRaised: row.dateRaised || row['Ngày phát hiện (Date Raised)'],
          dueDate: row.dueDate || row['Hạn xử lý (Due Date)'],
          closedDate: row.closedDate || row['Ngày đóng (Closed Date)'],
          overdue: parseInt(row.overdue) || 0,
          daysOpen: parseInt(row.daysOpen) || 0,
          solution: row.solution || row['Giải pháp / Ghi chú']
        })));
      }
      
      addLog("Dữ liệu thực địa đã được nạp thành công.", "SUCCESS");
    } catch (error) {
      console.error("Sync Error:", error);
      addLog("Giao thức đồng bộ thất bại. Kiểm tra API kết nối.", "WARNING");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, addLog]);

  useEffect(() => {
    if (selectedProjectId) {
      syncWithSheet();
    }
  }, [selectedProjectId, syncWithSheet]);

  const handleSendMessage = (text: string, replyToId?: string, taggedIds?: string[]) => {
    if (!selectedProjectId || !currentUser) return;
    const newMsg: ReviewMessage = {
      id: Math.random().toString(),
      projectId: selectedProjectId,
      senderId: currentUser.id,
      senderName: currentUser.fullName || currentUser.username,
      senderRole: currentUser.role,
      text,
      timestamp: new Date(),
      type: 'CHAT',
      replyToId,
      taggedUserIds: taggedIds
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleAction = async (action: string, taskId: string) => {
    if (action === 'approve') {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Done' } : t));
      addLog(`Hội viên đã phê duyệt Node ${taskId}`, 'SUCCESS');
    } else if (action === 'edit') {
      setWaitingForFeedback(taskId);
    } else if (action === 'finish_feedback') {
      setWaitingForFeedback(null);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Need Edit' } : t));
      addLog(`Hội viên đã gửi Feedback cho Node ${taskId}`, 'INFO');
    }
  };

  const currentProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

  const currentTabTasks = useMemo(() => {
    return tasks.filter(t => (t as any).tab === activeTab);
  }, [tasks, activeTab]);

  const filteredTasks = useMemo(() => {
    return currentTabTasks.filter(task => {
      if (statusFilter && task.status !== statusFilter) return false;
      const taskDate = parseCustomDate(task.planEnd);
      if (taskDate) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        if (taskDate < start || taskDate > end) return false;
      }
      return true;
    });
  }, [currentTabTasks, statusFilter, dateRange]);

  const stats = useMemo(() => ({
    done: tasks.filter(t => t.status === 'Done').length,
    review: tasks.filter(t => t.status === 'Review' || t.status === 'Need Edit').length,
    doing: tasks.filter(t => t.status === 'Doing' || t.status === 'In Progress').length,
    todo: tasks.filter(t => t.status === 'To do' || t.status === 'Pending').length
  }), [tasks]);

  if (!currentUser) return <Login onLogin={setCurrentUser} users={users} />;
  
  if (activeView === 'project-selector' || (!selectedProjectId && currentUser.role !== 'ADMIN')) {
    const available = projects.filter(p => p.clientIds.includes(currentUser.id) || p.staffIds.includes(currentUser.id) || currentUser.role === 'ADMIN');
    return <ProjectSelector projects={available} onSelect={(p) => { setSelectedProjectId(p.id); setActiveView('dashboard'); }} onLogout={() => setCurrentUser(null)} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#0d0b0a] overflow-hidden text-[#f2ede4] relative">
      {isLoading && (
        <div className="absolute inset-0 z-[100] bg-[#0d0b0a]/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin"></div>
            <p className="heritage-font text-[#d4af37] text-xs font-black tracking-[0.4em]">SYNCING PROTOCOL...</p>
          </div>
        </div>
      )}

      <Sidebar 
        currentProject={currentProject} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        userRole={currentUser.role} 
        onLogout={() => { setCurrentUser(null); setSelectedProjectId(null); }} 
        onSwitchProject={() => setSelectedProjectId(null)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 border-l border-[#1a1412]">
        <header className="h-16 border-b border-[#1a1412] bg-[#0d0b0a]/80 backdrop-blur-md flex items-center justify-between px-6 z-20 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#c41e3a] flex items-center justify-center border border-white/10">
              <i className="fa-solid fa-microchip"></i>
            </div>
            <div>
              <h1 className="heritage-font text-lg font-bold text-[#d4af37] tracking-wider uppercase">Luxora Protocol</h1>
              <p className="code-font text-[7px] text-[#a39e93] uppercase tracking-[0.3em]">{currentUser.fullName} | {activeView.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={syncWithSheet} className="text-[#d4af37] border border-[#d4af37]/30 px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#d4af37]/5 transition-all flex items-center gap-2">
            <i className="fa-solid fa-sync"></i> SYNC SHEET
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {activeView === 'dashboard' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              <div className="lg:col-span-8 space-y-6 flex flex-col h-full overflow-hidden">
                {currentUser.role === 'CLIENT' ? (
                  <>
                    <div className="grid grid-cols-4 gap-4">
                      <ScoreCard label="DONE" count={stats.done} color="#00f2ff" active={statusFilter === 'Done'} onClick={() => setStatusFilter(statusFilter === 'Done' ? null : 'Done')} />
                      <ScoreCard label="REVIEW" count={stats.review} color="#d4af37" active={statusFilter === 'Review'} onClick={() => setStatusFilter(statusFilter === 'Review' ? null : 'Review')} />
                      <ScoreCard label="DOING" count={stats.doing} color="#f2ede4" active={statusFilter === 'Doing'} onClick={() => setStatusFilter(statusFilter === 'Doing' ? null : 'Doing')} />
                      <ScoreCard label="TO DO" count={stats.todo} color="#a39e93" active={statusFilter === 'To do'} onClick={() => setStatusFilter(statusFilter === 'To do' ? null : 'To do')} />
                    </div>
                    <div className="flex-1 bg-[#1a1412] rounded-2xl border border-[#d4af37]/10 overflow-hidden flex flex-col shadow-2xl">
                      <div className="p-4 border-b border-[#d4af37]/10 bg-[#0d0b0a]/30 flex justify-between items-center">
                        <h3 className="heritage-font text-xs font-bold tracking-widest text-[#d4af37]">Danh mục Giao thức Chiến lược</h3>
                        <div className="flex gap-2">
                           <button onClick={() => setActiveTab('05')} className={`px-3 py-1 text-[9px] font-bold border rounded transition-all ${activeTab === '05' ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'border-[#d4af37]/30 text-[#a39e93]'}`}>05. TASK MASTER</button>
                           <button onClick={() => setActiveTab('06')} className={`px-3 py-1 text-[9px] font-bold border rounded transition-all ${activeTab === '06' ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'border-[#d4af37]/30 text-[#a39e93]'}`}>06. PRODUCTION</button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto scrollbar-thin">
                        <table className="w-full text-left text-[11px]">
                          <thead className="sticky top-0 bg-[#0d0b0a] text-[#a39e93] z-10">
                            <tr><th className="p-4 w-12">#</th><th className="p-4">Nội dung Node</th><th className="p-4 text-center">Deadline</th><th className="p-4">Trạng thái</th><th className="p-4 text-center">BP</th></tr>
                          </thead>
                          <tbody>
                            {filteredTasks.map((t, i) => (
                              <tr key={t.id} className="border-b border-[#d4af37]/5 hover:bg-[#d4af37]/5 transition-colors">
                                <td className="p-4 code-font text-[#a39e93]">{i+1}</td>
                                <td className="p-4 italic font-medium">{t.name}</td>
                                <td className="p-4 code-font text-center font-bold text-[#d4af37]">{t.planEnd}</td>
                                <td className="p-4"><span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${t.status === 'Done' ? 'border-[#00f2ff] text-[#00f2ff]' : 'border-[#d4af37] text-[#d4af37]'}`}>{t.status}</span></td>
                                <td className="p-4 text-center"><a href={t.link} target="_blank" rel="noreferrer" className="text-[#00f2ff]"><i className="fa-solid fa-arrow-up-right-from-square"></i></a></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6 h-full flex flex-col">
                    <WorkflowVisualizer activeStage={tasks.some(t => t.status === 'Review') ? 2 : 1} />
                    <section className="flex-1 bg-[#1a1412] rounded-2xl border border-[#d4af37]/20 p-1 overflow-hidden flex flex-col shadow-2xl">
                      <div className="p-3 bg-[#0d0b0a] border-b border-[#d4af37]/20 flex gap-4">
                        <button onClick={() => setActiveTab('05')} className={`px-4 py-1 text-[10px] font-bold heritage-font transition-all ${activeTab === '05' ? 'text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-[#a39e93]'}`}>05. TASK MASTER</button>
                        <button onClick={() => setActiveTab('06')} className={`px-4 py-1 text-[10px] font-bold heritage-font transition-all ${activeTab === '06' ? 'text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-[#a39e93]'}`}>06. PRODUCTION</button>
                      </div>
                      <SheetSimulator tasks={currentTabTasks} onTaskSubmit={handleAction} currentTab={activeTab} />
                    </section>
                    <section className="h-40 bg-[#1a1412] rounded-2xl border border-[#d4af37]/10 p-4 flex flex-col"><LogPanel logs={logs} /></section>
                  </div>
                )}
              </div>
              <div className="lg:col-span-4 h-full"><ReviewPortal messages={messages} users={users} currentUser={currentUser} onAction={handleAction} onSendMessage={handleSendMessage} isWaiting={!!waitingForFeedback} projectName={currentProject?.name} activeTaskId={waitingForFeedback} /></div>
            </div>
          ) : activeView === 'issues' ? (
            <IssueLog issues={issues} />
          ) : activeView === 'visuals' ? (
            <ClientVisuals tasks={tasks} issues={issues} dateRange={dateRange} setDateRange={setDateRange} />
          ) : (
            <AdminPanel view={activeView} users={users} projects={projects} onUpdateProject={() => {}} onCreateProject={() => {}} onUpdateUser={() => {}} onCreateUser={() => {}} onDeleteUser={() => {}} config={{googleSheetUrl: '', webAppUrl: ''}} onUpdateConfig={() => {}} />
          )}
        </main>
      </div>
    </div>
  );
};

const ScoreCard = ({ label, count, color, active, onClick }: { label: string, count: number, color: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`p-4 rounded-xl border flex flex-col items-center gap-1 transition-all group ${active ? 'bg-white text-[#0d0b0a] border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-[#1a1412] border-[#d4af37]/10'}`}>
    <span className="code-font text-[8px] font-black tracking-[0.2em] uppercase" style={{ color: active ? '#0d0b0a' : color }}>{label}</span>
    <span className="heritage-font text-2xl font-bold tracking-widest">{count}</span>
  </button>
);

export default App;
