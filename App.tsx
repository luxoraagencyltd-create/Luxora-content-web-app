
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, ReviewMessage, LogEntry, Project, User, Issue } from './types';
import { db } from './lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import Sidebar from './components/Sidebar';
import SheetSimulator from './components/SheetSimulator';
import ReviewPortal from './components/ReviewPortal';
// removed unused WorkflowVisualizer import
import LogPanel from './components/LogPanel';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import ProjectSelector from './components/ProjectSelector';
import ClientVisuals from './components/ClientVisuals';
import IssueLog from './components/IssueLog';

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7HIgfEnoIkUOWFB-xU7dlyno84OaSWrdvJ3LXlX9KryXRJ7uobHzShg6MCoEzbIdh-Q/exec";

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
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [messages, setMessages] = useState<ReviewMessage[]>([]);
  const [appConfig, setAppConfig] = useState<{googleSheetUrl: string; webAppUrl: string}>({ googleSheetUrl: '', webAppUrl: '' });

  // 1. Lấy dữ liệu Real-time từ Firebase cho Users và Projects
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), async (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as User);
      setUsers(usersData);

      // If collection is empty, seed with sample users for testing
      if (usersData.length === 0) {
        try {
          const sampleUsers: User[] = [
            { id: 'admin', username: 'admin', role: 'ADMIN', company: 'Sample', password: '123', fullName: 'Administrator' },
            { id: 'staff1', username: 'staff1', role: 'STAFF', company: 'Sample', password: '123', fullName: 'Staff One' },
            { id: 'staff2', username: 'staff2', role: 'STAFF', company: 'Sample', password: '123', fullName: 'Staff Two' },
            { id: 'staff3', username: 'staff3', role: 'STAFF', company: 'Sample', password: '123', fullName: 'Staff Three' },
            { id: 'client1', username: 'client1', role: 'CLIENT', company: 'Sample', password: '123', fullName: 'Client One' },
            { id: 'client2', username: 'client2', role: 'CLIENT', company: 'Sample', password: '123', fullName: 'Client Two' },
            { id: 'client3', username: 'client3', role: 'CLIENT', company: 'Sample', password: '123', fullName: 'Client Three' }
          ];

          for (const u of sampleUsers) {
            await setDoc(doc(db, 'users', u.id), u);
          }

          // Create a sample group/document to collect staff+client IDs for easy sharing
          const sampleMemberIds = sampleUsers.filter(s => s.role !== 'ADMIN').map(s => s.id);
          await setDoc(doc(db, 'samples', 'test-users'), { memberIds: sampleMemberIds });
        } catch (err) {
          console.error('Seeding sample users failed:', err);
        }
      }
    });
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => doc.data() as Project);
      setProjects(projectsData);
    });
    const configDoc = doc(db, 'config', 'app');
    const unsubConfig = onSnapshot(configDoc, (snap) => {
      if (snap.exists()) setAppConfig(snap.data() as any);
    });
    return () => { unsubUsers(); unsubProjects(); unsubConfig(); };
  }, []);

  const handleUpdateConfig = async (c: {googleSheetUrl: string; webAppUrl: string}) => {
    await setDoc(doc(db, 'config', 'app'), c);
    addLog('Cấu hình hệ thống đã được lưu.', 'SUCCESS');
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
      const proxyUrl = `/api/proxy?action=getAllData&projectId=${encodeURIComponent(selectedProjectId)}${scriptUrl ? `&target=${encodeURIComponent(scriptUrl)}` : ''}`;
      const response = await fetch(proxyUrl);
      const result = await response.json();
      
      if (result.tasks05) {
        const t05 = result.tasks05.map((row: Record<string, unknown>) => ({
          id: String(row['id'] ?? row['ID task'] ?? ''),
          projectId: selectedProjectId,
          phase: row.phase || row['Giai đoạn (Phase)'],
          name: String(row['name'] ?? row['Tên công việc (Task Name)'] ?? ''),
          status: String(row['status'] ?? row['Trạng thái (Status)'] ?? ''),
          priority: String(row['priority'] ?? row['Ưu tiên (Priority)'] ?? ''),
          planStart: String(row['planStart'] ?? row['Plan Start'] ?? ''),
          duration: parseInt(String(row['duration'] ?? '0')) || 0,
          planEnd: String(row['planEnd'] ?? row['Plan End'] ?? ''),
          link: String(row['link'] ?? '#'),
          staff: String(row['staff'] ?? row['Người thực hiện (Assignee)'] ?? ''),
          feedbacks: Array.isArray(row['feedbacks']) ? (row['feedbacks'] as unknown[]).map(String) : [],
          tab: '05'
        }));
        
        const t06 = (result.tasks06 || []).map((row: Record<string, unknown>) => ({
          id: String(row['id'] ?? row['ID task'] ?? ''),
          projectId: selectedProjectId,
          phase: String(row['type'] ?? row['Dạng content'] ?? ''),
          planEnd: String(row['publishDate'] ?? row['Thời gian đăng'] ?? ''),
          status: String(row['status'] ?? row['Status'] ?? ''),
          pillar: String(row['pillar'] ?? row['Pillar'] ?? ''),
          name: String(row['angle'] ?? row['Angle'] ?? ''),
          link: String(row['link'] ?? row['Link bài đăng'] ?? ''),
          seeding: String(row['seeding'] ?? row['Nội dung seeding'] ?? ''),
          contentBody: String(row['content'] ?? row['Nội dung bài'] ?? ''),
          image: String(row['image'] ?? row['Hình'] ?? ''),
          feedbacks: Array.isArray(row['feedbacks']) ? (row['feedbacks'] as unknown[]).map(String) : [],
          tab: '06'
        }));
        setTasks([...t05, ...t06]);
      }

      if (Array.isArray(result.issues)) {
        setIssues(result.issues.map((row: Record<string, unknown>) => ({
          id: String(row['id'] ?? row['ID'] ?? ''),
          type: String(row['type'] ?? row['Loại (Type)'] ?? ''),
          summary: String(row['summary'] ?? row['Tên vấn đề (Issue Summary)'] ?? ''),
          severity: (() => {
            const s = String(row['severity'] ?? row['Mức độ (Severity)'] ?? 'Low');
            return ['Critical', 'High', 'Medium', 'Low'].includes(s) ? (s as import('./types').Issue['severity']) : 'Low';
          })(),
          owner: String(row['owner'] ?? row['Người chịu trách nhiệm (Owner)'] ?? ''),
          status: String(row['status'] ?? row['Trạng thái (Status)'] ?? ''),
          dateRaised: String(row['dateRaised'] ?? row['Ngày phát hiện (Date Raised)'] ?? ''),
          dueDate: String(row['dueDate'] ?? row['Hạn xử lý (Due Date)'] ?? ''),
          closedDate: row['closedDate'] ? String(row['closedDate']) : undefined,
          overdue: parseInt(String(row['overdue'] ?? '0')) || 0,
          daysOpen: parseInt(String(row['daysOpen'] ?? '0')) || 0,
          solution: row['solution'] ? String(row['solution']) : undefined
        })));
      }
      addLog("Dữ liệu thực địa đã được nạp thành công.", "SUCCESS");
    } catch (error) {
      console.error("Sync Error:", error);
      addLog("Giao thức đồng bộ thất bại. Kiểm tra API kết nối.", "WARNING");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, addLog, appConfig]);

  useEffect(() => {
    if (selectedProjectId) syncWithSheet();
  }, [selectedProjectId, syncWithSheet]);

  // 2. Các hàm CRUD đồng bộ với Firebase
  const handleUpdateProject = async (p: Project) => {
    await setDoc(doc(db, 'projects', p.id), p);
    addLog(`Dự án ${p.id} đã được cập nhật trên Cloud.`, 'SUCCESS');
  };

  const handleCreateProject = async (p: Partial<Project>) => {
    const id = p.id || `P-${Date.now()}`;
    const newProj: Project = { id, name: p.name || 'Dự Án Mới', clientIds: [], staffIds: [], color: 'gold-leaf' };
    await setDoc(doc(db, 'projects', id), newProj);
    addLog(`Dự án ${id} đã được khởi tạo trên Cloud.`, 'SUCCESS');
  };

  const handleUpdateUser = async (u: User) => {
    await setDoc(doc(db, 'users', u.id), u);
    addLog(`Node ${u.id} đã được cập nhật.`, 'SUCCESS');
  };

  const handleCreateUser = async (u: User) => {
    await setDoc(doc(db, 'users', u.id), u);
    addLog(`Node ${u.id} đã được khởi tạo.`, 'SUCCESS');
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteDoc(doc(db, 'users', userId));
    addLog(`Node ${userId} đã bị xóa khỏi hệ thống.`, 'WARNING');
  };

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
      addLog(`Phê duyệt Node ${taskId}`, 'SUCCESS');
    } else if (action === 'edit') {
      setWaitingForFeedback(taskId);
    } else if (action === 'finish_feedback') {
      setWaitingForFeedback(null);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Need Edit' } : t));
    }
  };

  const currentProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const currentTabTasks = useMemo(() => tasks.filter(t => t.tab === activeTab), [tasks, activeTab]);

  

  const stats = useMemo(() => ({
    done: tasks.filter(t => t.status === 'Done').length,
    review: tasks.filter(t => t.status === 'Review' || t.status === 'Need Edit').length,
    doing: tasks.filter(t => t.status === 'Doing' || t.status === 'In Progress').length,
    todo: tasks.filter(t => t.status === 'To do' || t.status === 'Pending').length
  }), [tasks]);

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
                   <div className="p-3 bg-[#0d0b0a] border-b border-[#d4af37]/20 flex gap-4">
                      <button onClick={() => setActiveTab('05')} className={`px-4 py-1 text-[10px] font-bold heritage-font transition-all ${activeTab === '05' ? 'text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-[#a39e93]'}`}>05. TASK MASTER</button>
                      <button onClick={() => setActiveTab('06')} className={`px-4 py-1 text-[10px] font-bold heritage-font transition-all ${activeTab === '06' ? 'text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-[#a39e93]'}`}>06. PRODUCTION</button>
                   </div>
                   <SheetSimulator tasks={currentTabTasks} onTaskSubmit={handleAction} currentTab={activeTab} />
                </section>
                <section className="h-40 bg-[#1a1412] rounded-2xl border border-[#d4af37]/10 p-4 flex flex-col"><LogPanel logs={logs} /></section>
              </div>
              <div className="lg:col-span-4 h-full"><ReviewPortal messages={messages} users={users} currentUser={currentUser} onAction={handleAction} onSendMessage={handleSendMessage} isWaiting={!!waitingForFeedback} projectName={currentProject?.name} activeTaskId={waitingForFeedback} /></div>
            </div>
          ) : activeView === 'issues' ? (
            <IssueLog issues={issues} />
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

const ScoreCard = ({ label, count, color, active, onClick }: { label: string, count: number, color: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`p-4 rounded-xl border flex flex-col items-center gap-1 transition-all group ${active ? 'bg-white text-[#0d0b0a] border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-[#1a1412] border-[#d4af37]/10'}`}>
    <span className="code-font text-[8px] font-black tracking-[0.2em] uppercase" style={{ color: active ? '#0d0b0a' : color }}>{label}</span>
    <span className="heritage-font text-2xl font-bold tracking-widest">{count}</span>
  </button>
);

export default App;
