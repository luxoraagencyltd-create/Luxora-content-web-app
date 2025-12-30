import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, ReviewMessage, LogEntry, Project, User, Issue } from './types';
import { db } from './lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import Sidebar from './components/Sidebar';
import SheetSimulator from './components/SheetSimulator';
import ReviewPortal from './components/ReviewPortal';
import LogPanel from './components/LogPanel';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import ProjectSelector from './components/ProjectSelector';
import ClientVisuals from './components/ClientVisuals';
import IssueLog from './components/IssueLog';

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxFTCYBBwC2s0Cu0KQkAjnJ15P9FmQx68orggfKhUtRMiA-VP2EaXWfruOCTfEmXdDUkQ/exec";

// Component thẻ trạng thái
const ScoreCard = ({ label, count, color, active, onClick }: { label: string, count: number, color: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`p-4 rounded-xl border flex flex-col items-center gap-1 transition-all group ${active ? 'bg-white text-[#0d0b0a] border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-[#1a1412] border-[#d4af37]/10'}`}>
    <span className="code-font text-[8px] font-black tracking-[0.2em] uppercase" style={{ color: active ? '#0d0b0a' : color }}>{label}</span>
    <span className="heritage-font text-2xl font-bold tracking-widest">{count}</span>
  </button>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // State bộ lọc
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '2025-01-01', end: '2026-12-31' });
  const [activeTab, setActiveTab] = useState<'05' | '06'>('05'); 
  
  // State Feedback & Logs
  const [waitingForFeedback, setWaitingForFeedback] = useState<string | null>(null); // Dùng để điều khiển UI ReviewPortal
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [messages, setMessages] = useState<ReviewMessage[]>([]);
  const [appConfig, setAppConfig] = useState<{googleSheetUrl: string; webAppUrl: string}>({ googleSheetUrl: '', webAppUrl: '' });

  // State mới cho Logic Feedback gộp
  const [chatDraft, setChatDraft] = useState<string>('');
  const [pendingFeedbackTask, setPendingFeedbackTask] = useState<string | null>(null); // ID task đang soạn feedback
  const [feedbackAccumulator, setFeedbackAccumulator] = useState<string[]>([]); // Mảng chứa các tin nhắn feedback chưa gửi

  const currentProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

  // --- 1. TỰ ĐỘNG CHUYỂN TAB DỰA TRÊN ROLE ---
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'CLIENT') {
        setActiveTab('06'); // Khách vào thẳng Production
      } else {
        setActiveTab('05'); // Admin/Staff vào Master
      }
    }
  }, [currentUser]);

  // Hàm xử lý ngày tháng
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

  const addLog = useCallback((event: string, type: 'INFO' | 'SUCCESS' | 'WARNING' = 'INFO') => {
    const newLog: LogEntry = { id: Math.random().toString(), projectId: selectedProjectId || 'SYSTEM', timestamp: new Date(), event, type };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, [selectedProjectId]);

  const syncWithSheet = useCallback(async () => {
    if (!selectedProjectId) return;
    setIsLoading(true);
    addLog("Kích hoạt giao thức đồng bộ thực địa...", "INFO");
    
    try {
      const scriptUrl = currentProject?.webAppUrl || appConfig.webAppUrl || APPS_SCRIPT_URL;
      
      let finalUrl;
      // Logic URL check môi trường
      if (import.meta.env.DEV && !window.location.host.includes('vercel')) {
         finalUrl = `/api/proxy?action=getAllData&projectId=${encodeURIComponent(selectedProjectId)}&target=${encodeURIComponent(scriptUrl)}`;
      } else {
         finalUrl = `/api/proxy?action=getAllData&projectId=${encodeURIComponent(selectedProjectId)}&target=${encodeURIComponent(scriptUrl)}`;
      }

      const response = await fetch(finalUrl);
      const text = await response.text();
      let result: any;
      try { result = JSON.parse(text); } catch (err) {
        addLog('Lỗi dữ liệu JSON từ Server.', 'WARNING');
        setIsLoading(false);
        return;
      }
      
      if (result.tasks05) {
        const t05 = result.tasks05.map((row: any) => ({
          id: String(row['id'] || row['ID task'] || ''),
          projectId: selectedProjectId,
          phase: row.phase || row['Giai đoạn (Phase)'],
          name: String(row['name'] || row['Tên công việc (Task Name)'] || ''),
          status: String(row['status'] || row['Trạng thái (Status)'] || 'To do'),
          priority: String(row['priority'] || row['Ưu tiên (Priority)'] || ''),
          planStart: String(row['planStart'] || row['Plan Start'] || ''),
          duration: parseInt(String(row['duration'] || '0')) || 0,
          planEnd: String(row['planEnd'] || row['Plan End'] || ''),
          link: String(row['link'] || '#'),
          staff: String(row['staff'] || row['Người thực hiện (Assignee)'] || ''),
          feedbacks: [],
          tab: '05'
        }));
        
        const t06 = (result.tasks06 || []).map((row: any) => ({
          id: String(row['id'] || row['ID task'] || ''),
          projectId: selectedProjectId,
          phase: String(row['type'] || row['Dạng content'] || ''),
          planEnd: String(row['publishDate'] || row['Thời gian đăng'] || ''),
          status: String(row['status'] || row['Status'] || 'To do'),
          pillar: String(row['pillar'] || row['Pillar'] || ''),
          name: String(row['angle'] || row['Angle'] || ''),
          link: String(row['link'] || row['Link bài đăng'] || ''),
          seeding: String(row['seeding'] || row['Nội dung seeding'] || ''),
          contentBody: String(row['content'] || row['Nội dung bài'] || ''),
          image: String(row['image'] || row['Hình'] || ''),
          feedbacks: [],
          tab: '06'
        }));
        setTasks([...t05, ...t06]);
      }
      
      // Xử lý Issue Log (Logic tìm cột thông minh như bài trước)
      if (Array.isArray(result.issues)) {
         setIssues(result.issues.map((row: Record<string, unknown>) => {
            const findValue = (keywords: string[]) => {
              const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase())));
              return key ? String(row[key]) : '';
            };
            const rawSeverity = findValue(['severity', 'mức độ']); 
            let finalSeverity = 'Low';
            const s = rawSeverity.trim().toLowerCase();
            if (s === 'critical') finalSeverity = 'Critical';
            else if (s === 'high') finalSeverity = 'High';
            else if (s === 'medium') finalSeverity = 'Medium';

            return {
              id: findValue(['id']),
              type: findValue(['type', 'loại']),
              summary: findValue(['summary', 'tên vấn đề', 'issue summary']),
              severity: finalSeverity as any,
              owner: findValue(['owner', 'người chịu trách nhiệm']),
              status: findValue(['status', 'trạng thái']),
              dateRaised: findValue(['date raised', 'ngày phát hiện']),
              dueDate: findValue(['due date', 'hạn xử lý']),
              closedDate: findValue(['closed date', 'ngày đóng']),
              overdue: parseInt(findValue(['overdue'])) || 0,
              daysOpen: parseInt(findValue(['days open', 'số ngày tồn tại'])) || 0,
              solution: findValue(['solution', 'giải pháp', 'resolution'])
            };
         }));
      }

      addLog("Dữ liệu thực địa đã được nạp thành công.", "SUCCESS");
    } catch (error) {
      console.error(error);
      addLog("Giao thức đồng bộ thất bại.", "WARNING");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, addLog, appConfig, currentProject]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => setUsers(snap.docs.map(d => d.data() as User)));
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => setProjects(snap.docs.map(d => d.data() as Project)));
    const unsubConfig = onSnapshot(doc(db, 'config', 'app'), (snap) => snap.exists() && setAppConfig(snap.data() as any));
    return () => { unsubUsers(); unsubProjects(); unsubConfig(); };
  }, []);

  useEffect(() => { if (selectedProjectId) syncWithSheet(); }, [selectedProjectId, syncWithSheet]);

  const handleUpdateProject = async (p: Project) => await setDoc(doc(db, 'projects', p.id), p);
  const handleCreateProject = async (p: Partial<Project>) => await setDoc(doc(db, 'projects', p.id || `P-${Date.now()}`), { ...p, id: p.id || `P-${Date.now()}`, clientIds: [], staffIds: [] } as Project);
  const handleUpdateUser = async (u: User) => await setDoc(doc(db, 'users', u.id), u);
  const handleCreateUser = async (u: User) => await setDoc(doc(db, 'users', u.id), u);
  const handleDeleteUser = async (uid: string) => await deleteDoc(doc(db, 'users', uid));
  const handleUpdateConfig = async (c: any) => await setDoc(doc(db, 'config', 'app'), c);

  // --- XỬ LÝ ACTIONS (DUYỆT & GỬI FEEDBACK) ---
  const handleAction = async (action: string, taskId: string) => {
    // 1. DUYỆT (APPROVE) -> Gửi ngay
    if (action === 'approve') {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Done' } : t));
      addLog(`Phê duyệt Node ${taskId}`, 'INFO');
      try {
        const scriptUrl = currentProject?.webAppUrl || appConfig.webAppUrl || APPS_SCRIPT_URL;
        let finalUrl = (import.meta.env.DEV && !window.location.host.includes('vercel')) 
            ? `/api/proxy?target=${encodeURIComponent(scriptUrl)}`
            : `/api/proxy?target=${encodeURIComponent(scriptUrl)}`;

        await fetch(finalUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'approve', taskId: taskId })
        });
        addLog(`Đã lưu trạng thái DONE cho Node ${taskId}`, 'SUCCESS');
      } catch (error) {
        addLog(`Lỗi đồng bộ phê duyệt Node ${taskId}`, 'WARNING');
      }
    } 
    // 2. YÊU CẦU SỬA (REQUEST EDIT) -> Mở mode chat, chưa gửi API
    else if (action === 'request_edit') {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const draft = `[${task.id}] [${task.name}]\nCần sửa với nội dung: `;
        setChatDraft(draft);
        setPendingFeedbackTask(taskId);
        setWaitingForFeedback(taskId); // Để mở UI ReviewPortal nếu cần
        setFeedbackAccumulator([]); // Reset bộ nhớ
        addLog(`Bắt đầu phiên Feedback cho Node ${taskId}...`, 'INFO');
      }
    }
    // 3. HOÀN TẤT FEEDBACK (CONFIRM) -> Gộp tin nhắn và gửi API
    else if (action === 'confirm_feedback') {
      if (!pendingFeedbackTask || feedbackAccumulator.length === 0) return;
      const combinedText = feedbackAccumulator.join('\n\n---\n\n');
      
      // Hiển thị log đang gửi...
      addLog(`Đang gửi dữ liệu lên Server...`, 'INFO');

      try {
        const scriptUrl = currentProject?.webAppUrl || appConfig.webAppUrl || APPS_SCRIPT_URL;
        let finalUrl = (import.meta.env.DEV && !window.location.host.includes('vercel')) 
            ? `/api/proxy?target=${encodeURIComponent(scriptUrl)}`
            : `/api/proxy?target=${encodeURIComponent(scriptUrl)}`;

        const response = await fetch(finalUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'submit_feedback',
            taskId: pendingFeedbackTask,
            feedbackContent: combinedText
          })
        });
        
        // 👇 ĐỌC KẾT QUẢ TỪ SERVER ĐỂ BIẾT LỖI GÌ
        const result = await response.json();

        if (result.status === 'success') {
            // Chỉ cập nhật UI khi Server báo thành công
            setTasks(prev => prev.map(t => t.id === pendingFeedbackTask ? { ...t, status: 'Need Edit' } : t));
            addLog(result.message, 'SUCCESS'); // Hiện thông báo thật từ server
            
            // Reset form
            setPendingFeedbackTask(null);
            setFeedbackAccumulator([]);
            setWaitingForFeedback(null);
        } else {
            // Server báo lỗi (ví dụ: Không tìm thấy ID)
            addLog(`Lỗi Server: ${result.message}`, 'WARNING');
        }

      } catch (e) {
        console.error(e);
        addLog('Lỗi kết nối mạng hoặc lỗi Proxy', 'WARNING');
      }
    }
  };

  // --- XỬ LÝ GỬI TIN NHẮN ---
  const handleSendMessage = async (text: string, replyToId?: string, taggedIds?: string[]) => {
    if (!selectedProjectId || !currentUser) return;
    
    // 1. Hiện tin nhắn lên chat
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
    setChatDraft(''); 

    // 2. Nếu đang trong phiên Feedback -> CHỈ TÍCH LŨY, KHÔNG GỬI API
    if (pendingFeedbackTask) {
       setFeedbackAccumulator(prev => [...prev, text]);
    }
  };

  // --- LỌC DỮ LIỆU HIỂN THỊ TRONG BẢNG ---
  const currentTabTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.tab !== activeTab) return false;
      const tDate = parseDate(t.planEnd);
      if (tDate) {
        tDate.setHours(0,0,0,0);
        const start = new Date(dateRange.start); start.setHours(0,0,0,0);
        const end = new Date(dateRange.end); end.setHours(0,0,0,0);
        if (tDate < start || tDate > end) return false;
      }
      if (statusFilter) {
        const s = t.status.toLowerCase().trim();
        if (statusFilter === 'Done') return s === 'done';
        if (statusFilter === 'Review') return s === 'review' || s === 'need edit';
        if (statusFilter === 'Doing') return s === 'doing' || s === 'in progress';
        if (statusFilter === 'To do') return s === 'to do' || s === 'pending';
      }
      return true;
    });
  }, [tasks, activeTab, statusFilter, dateRange]);

  // --- TÍNH TOÁN SCORECARD ---
  const stats = useMemo(() => {
    const baseList = tasks.filter(t => {
        if (t.tab !== activeTab) return false;
        const tDate = parseDate(t.planEnd);
        if (tDate) {
            tDate.setHours(0,0,0,0);
            const start = new Date(dateRange.start); start.setHours(0,0,0,0);
            const end = new Date(dateRange.end); end.setHours(0,0,0,0);
            if (tDate < start || tDate > end) return false;
        }
        return true;
    });
    const count = (keywords: string[]) => baseList.filter(t => keywords.includes(t.status.toLowerCase().trim())).length;
    return {
      done: count(['done']),
      review: count(['review', 'need edit']),
      doing: count(['doing', 'in progress']),
      todo: count(['to do', 'pending'])
    };
  }, [tasks, activeTab, dateRange]);

  if (!currentUser) return <Login onLogin={setCurrentUser} users={users} />;
  
  if (activeView === 'project-selector' || (!selectedProjectId && currentUser.role !== 'ADMIN')) {
    const available = projects.filter(p => (p.clientIds || []).includes(currentUser.id) || (p.staffIds || []).includes(currentUser.id) || currentUser.role === 'ADMIN');
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

      <Sidebar currentProject={currentProject} activeView={activeView} setActiveView={setActiveView} userRole={currentUser.role} onLogout={() => { setCurrentUser(null); setSelectedProjectId(null); }} onSwitchProject={() => setSelectedProjectId(null)} />
      
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
          
          <div className="flex items-center bg-[#1a1412] border border-[#d4af37]/20 rounded-lg p-1 gap-2">
             <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent text-[10px] text-[#f2ede4] p-1 outline-none code-font"/>
             <span className="text-[#d4af37]">-</span>
             <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent text-[10px] text-[#f2ede4] p-1 outline-none code-font"/>
          </div>

          <button onClick={syncWithSheet} className="text-[#d4af37] border border-[#d4af37]/30 px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#d4af37]/5 transition-all flex items-center gap-2">
            <i className="fa-solid fa-sync"></i> SYNC SHEET
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6 scrollbar-thin">
          {activeView === 'dashboard' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              <div className="lg:col-span-8 space-y-6 flex flex-col h-full overflow-hidden">
                <div className="grid grid-cols-4 gap-4">
                  <ScoreCard label="DONE" count={stats.done} color="#00f2ff" active={statusFilter === 'Done'} onClick={() => setStatusFilter(statusFilter === 'Done' ? null : 'Done')} />
                  <ScoreCard label="REVIEW" count={stats.review} color="#d4af37" active={statusFilter === 'Review'} onClick={() => setStatusFilter(statusFilter === 'Review' ? null : 'Review')} />
                  <ScoreCard label="DOING" count={stats.doing} color="#f2ede4" active={statusFilter === 'Doing'} onClick={() => setStatusFilter(statusFilter === 'Doing' ? null : 'Doing')} />
                  <ScoreCard label="TO DO" count={stats.todo} color="#a39e93" active={statusFilter === 'To do'} onClick={() => setStatusFilter(statusFilter === 'To do' ? null : 'To do')} />
                </div>
                <section className="flex-1 bg-[#1a1412] rounded-2xl border border-[#d4af37]/20 p-1 overflow-hidden flex flex-col shadow-2xl">
                   
                   {/* --- LOGIC HIỂN THỊ TAB (CLIENT vs STAFF) --- */}
                   {currentUser?.role !== 'CLIENT' ? (
                     <div className="p-3 bg-[#0d0b0a] border-b border-[#d4af37]/20 flex gap-4 justify-between items-center">
                        <div className="flex gap-4">
                          <button onClick={() => { setActiveTab('05'); setStatusFilter(null); }} className={`px-4 py-1 text-[10px] font-bold heritage-font transition-all ${activeTab === '05' ? 'text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-[#a39e93]'}`}>05. TASK MASTER</button>
                          <button onClick={() => { setActiveTab('06'); setStatusFilter(null); }} className={`px-4 py-1 text-[10px] font-bold heritage-font transition-all ${activeTab === '06' ? 'text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-[#a39e93]'}`}>06. PRODUCTION</button>
                        </div>
                        <div className="text-[9px] text-[#a39e93] code-font">
                          Showing: <span className="text-[#f2ede4] font-bold">{currentTabTasks.length}</span> nodes
                        </div>
                     </div>
                   ) : (
                     <div className="p-3 bg-[#0d0b0a] border-b border-[#d4af37]/20 flex justify-between items-center">
                        <span className="heritage-font text-[#d4af37] text-xs font-bold tracking-widest uppercase">
                           DANH SÁCH BÀI ĐĂNG (PRODUCTION)
                        </span>
                        <div className="text-[9px] text-[#a39e93] code-font">
                          Showing: <span className="text-[#f2ede4] font-bold">{currentTabTasks.length}</span> nodes
                        </div>
                     </div>
                   )}
                   
                   <SheetSimulator tasks={currentTabTasks} onTaskSubmit={handleAction} currentTab={activeTab} />
                </section>
                <section className="h-40 bg-[#1a1412] rounded-2xl border border-[#d4af37]/10 p-4 flex flex-col"><LogPanel logs={logs} /></section>
              </div>
              <div className="lg:col-span-4 h-full">
                  <ReviewPortal 
                    messages={messages} 
                    users={users} 
                    currentUser={currentUser} 
                    onAction={handleAction} 
                    onSendMessage={handleSendMessage} 
                    isWaiting={!!pendingFeedbackTask} 
                    projectName={currentProject?.name} 
                    activeTaskId={pendingFeedbackTask}
                    draftMessage={chatDraft}
                    hasPendingFeedback={feedbackAccumulator.length > 0} 
                  />
              </div>
            </div>
          ) : activeView === 'issues' ? (
            <IssueLog issues={issues} dateRange={dateRange} />
          ) : activeView === 'visuals' ? (
            <ClientVisuals tasks={tasks} issues={issues} dateRange={dateRange} setDateRange={setDateRange} />
          ) : (
            <AdminPanel 
              view={activeView} users={users} projects={projects} 
              onUpdateProject={handleUpdateProject} onCreateProject={handleCreateProject} 
              onUpdateUser={handleUpdateUser} onCreateUser={handleCreateUser} onDeleteUser={handleDeleteUser} 
              config={appConfig} onUpdateConfig={handleUpdateConfig} 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;