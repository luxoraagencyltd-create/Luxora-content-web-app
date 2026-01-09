import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, ReviewMessage, LogEntry, Project, User, Issue } from './types';
import { db } from './lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import Sidebar from './components/Sidebar';
import SheetSimulator from './components/SheetSimulator';
import ReviewPortal from './components/ReviewPortal';
import LogPanel from './components/LogPanel';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import ProjectSelector from './components/ProjectSelector';
import ClientVisuals from './components/ClientVisuals';
import IssueLog from './components/IssueLog';
import PWAPrompt from './components/PWAPrompt';
import MobileNavbar from './components/MobileNavbar';
import { requestNotificationPermission } from './lib/notification'; 
import { getMessaging, onMessage } from "firebase/messaging";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxFTCYBBwC2s0Cu0KQkAjnJ15P9FmQx68orggfKhUtRMiA-VP2EaXWfruOCTfEmXdDUkQ/exec";
const NOTIFICATION_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const HUDCard = ({ label, count, color, active, onClick }: { label: string, count: number, color: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`p-4 relative transition-all group border border-l-4 overflow-hidden ${active ? 'bg-[#00f3ff]/10 border-[#00f3ff]' : 'bg-[#0f1115] border-[#ffffff]/10 hover:border-[#00f3ff]/50'}`} style={{ borderLeftColor: color }}>
    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#ffffff]/20"></div>
    <div className="flex flex-col items-start">
      <span className="code-font text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: active ? '#fff' : '#888' }}>{label}</span>
      <span className="headline-font text-3xl font-bold tracking-wider text-white" style={{ textShadow: active ? `0 0 10px ${color}` : 'none' }}>{count < 10 ? `0${count}` : count}</span>
    </div>
    {active && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00f3ff]/5 to-transparent h-full w-full animate-pulse pointer-events-none"></div>}
  </button>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('luxora_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('luxora_user', JSON.stringify(currentUser));
      if ('serviceWorker' in navigator) { requestNotificationPermission(currentUser.id); }
    } else {
      localStorage.removeItem('luxora_user');
    }
  }, [currentUser]);

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '2025-01-01', end: '2026-12-31' });
  const [activeTab, setActiveTab] = useState<'05' | '06'>('05'); 
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [messages, setMessages] = useState<ReviewMessage[]>([]);
  const [appConfig, setAppConfig] = useState<{googleSheetUrl: string; webAppUrl: string}>({ googleSheetUrl: '', webAppUrl: '' });
  
  const [chatDraft, setChatDraft] = useState<string>('');
  const [pendingFeedbackTask, setPendingFeedbackTask] = useState<string | null>(null); 
  const [feedbackAccumulator, setFeedbackAccumulator] = useState<string[]>([]); 
  
  const isFetchingRef = useRef(false);
  const prevTasksRef = useRef<Task[]>([]);

  const currentProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'CLIENT') { setActiveTab('06'); } else { setActiveTab('05'); }
    }
  }, [currentUser]);

  useEffect(() => {
    if (!selectedProjectId) { setMessages([]); return; }
    const q = query(collection(db, 'messages'), where('projectId', '==', selectedProjectId), orderBy('timestamp', 'asc'), limit(100));
    const unsubMessages = onSnapshot(q, 
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => {
          const data = doc.data();
          return { ...data, id: doc.id, timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp) } as ReviewMessage;
        });
        setMessages(msgs);
      },
      (error) => {
        if (error.message.includes("indexes")) addLog("Thiếu Index Firestore. Xem Console.", "WARNING");
      }
    );
    return () => unsubMessages();
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) return;
    const interval = setInterval(() => { syncWithSheet(true); }, 15000); 
    return () => clearInterval(interval);
  }, [selectedProjectId]); 

  useEffect(() => {
    try {
      const messaging = getMessaging();
      const unsubscribe = onMessage(messaging, (payload) => {
        const { title, body, icon } = payload.notification || {};
        playSound();
        if (Notification.permission === "granted") {
           new Notification(title || "Luxora", { body: body, icon: icon || '/assets/logo-192.png', tag: 'luxora-alert' });
        }
      });
      return () => unsubscribe();
    } catch (err) {}
  }, []);

  const playSound = () => { try { new Audio(NOTIFICATION_SOUND).play().catch(() => {}); } catch (e) {} };

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
  
  const syncWithSheet = useCallback(async (isSilent = false) => {
    if (!selectedProjectId) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    if (!isSilent) setIsLoading(true);
    if (!isSilent) addLog("INITIATING DATA SYNC PROTOCOL...", "INFO");
    
    try {
      const scriptUrl = currentProject?.webAppUrl || appConfig.webAppUrl || APPS_SCRIPT_URL;
      let finalUrl = (import.meta.env.DEV && !window.location.host.includes('vercel')) 
            ? `/api/proxy?action=getAllData&projectId=${encodeURIComponent(selectedProjectId)}&target=${encodeURIComponent(scriptUrl)}`
            : `/api/proxy?action=getAllData&projectId=${encodeURIComponent(selectedProjectId)}&target=${encodeURIComponent(scriptUrl)}`;

      const response = await fetch(finalUrl);
      const text = await response.text();
      let result: any;
      try { result = JSON.parse(text); } catch (err) {
        if (!isSilent) addLog('DATA CORRUPTION DETECTED (JSON ERROR)', 'WARNING');
        return;
      }
      
      let fetchedTasks: Task[] = [];

      // MAPPING DATA 05
      if (result.tasks05) {
        const t05 = result.tasks05.map((row: any) => {
           const getValue = (keywords: string[]) => {
            const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase())));
            return key ? String(row[key]) : '';
           };
           return {
            id: String(getValue(['id', 'id task'])),
            projectId: selectedProjectId,
            phase: getValue(['phase', 'giai đoạn']),
            name: getValue(['name', 'tên công việc', 'task name']),
            status: getValue(['status', 'trạng thái']) || 'To do',
            priority: getValue(['priority', 'ưu tiên']),
            planStart: getValue(['plan start', 'start']), 
            duration: parseInt(getValue(['duration'])) || 0,
            planEnd: getValue(['plan end', 'end']), 
            slack: getValue(['độ trễ']),
            link: getValue(['link', 'link file']) || '#',
            staff: getValue(['staff', 'người thực hiện', 'assignee']),
            feedbacks: [],
            tab: '05' as const
          };
        });
        fetchedTasks = [...fetchedTasks, ...t05];
      }
      
      // MAPPING DATA 06 (Dữ liệu quan trọng: Link, Hình, Content)
      if (result.tasks06) {
        // Log để kiểm tra
        if (result.tasks06.length > 0) console.log("🔍 REAL COLUMNS:", Object.keys(result.tasks06[0]));

        const t06 = (result.tasks06 || []).map((row: any) => {
          
          // Hàm lấy giá trị siêu đơn giản (Direct Access)
          // Ưu tiên tìm đúng tên cột như trong Console
          const get = (key: string) => {
             // Thử lấy chính xác
             if (row[key] !== undefined) return String(row[key]);
             // Thử lấy chữ thường
             const lowerKey = key.toLowerCase();
             const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === lowerKey);
             return foundKey ? String(row[foundKey]) : '';
          };

          return {
            id: get('ID task'),
            projectId: selectedProjectId,
            phase: get('Dạng content'), 
            planEnd: get('Thời gian đăng'),
            status: get('Status') || 'To do',
            pillar: get('Pillar'),
            name: get('Angle'), 
            
            // 👇 GỌI ĐÚNG TÊN CỘT TRONG CONSOLE (Case-insensitive)
            link: get('Link bài đăng'), 
            
            image: get('Hình'), 
            seeding: get('Nội dung seeding'),
            contentBody: get('Nội dung bài'),
            
            feedbacks: [],
            tab: '06' as const
          };
        });
        fetchedTasks = [...fetchedTasks, ...t06];
      }
      
      // Mapping Issues (Giữ nguyên)
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

      // --- 👇 LOGIC TRIGGER MỚI (THÔNG MINH HƠN) 👇 ---
      if (prevTasksRef.current.length > 0) {
        const triggeredIds = new Set();
        
        for (const newTask of fetchedTasks) {
            const oldTask = prevTasksRef.current.find(t => t.id === newTask.id);
            
            if (oldTask) {
                const oldStatus = (oldTask.status || '').toLowerCase().trim();
                const newStatus = (newTask.status || '').toLowerCase().trim();

                // Điều kiện: Chuyển sang Review
                if (oldStatus !== 'review' && newStatus === 'review') {
                    if (!triggeredIds.has(newTask.id)) {
                        triggeredIds.add(newTask.id);
                        
                        console.log("🔥 Trigger detected for", newTask.id);

                        // 👇 BƯỚC QUAN TRỌNG: TÌM PHIÊN BẢN GIÀU DỮ LIỆU NHẤT
                        // Tìm trong fetchedTasks xem có bản nào của Task ID này mà có Link hoặc Content không
                        // (Thường là bản ghi từ Tab 06)
                        const richTask = fetchedTasks.find(t => 
                           t.id === newTask.id && (t.link || t.contentBody || t.seeding)
                        ) || newTask; // Nếu không có thì dùng tạm bản hiện tại
                        
                        console.log("   - Using Data Source:", richTask.tab);
                        console.log("   - Link:", richTask.link);
                        
                        playSound();

                        // 👇 TẠO THÔNG BÁO TỪ richTask (Thay vì newTask)
                        const messageContent = `STATUS UPDATE: [${richTask.id}] ${richTask.name} >> REVIEW_MODE_ACTIVATED
--------------------------
📌 SEEDING CONTENT:
${richTask.seeding || '(Chưa cập nhật)'}

📝 MAIN CONTENT:
${richTask.contentBody || '(Chưa cập nhật)'}

🖼️ HÌNH ẢNH (SOURCE): 
${richTask.image ? richTask.image : 'N/A'}

🔗 LINK BÀI ĐĂNG (RESULT): 
${richTask.link && richTask.link !== '#' ? richTask.link : 'N/A'}`;
                        
                        // GỬI FIREBASE
                        const triggerKey = `${richTask.id}_REVIEW_ALERT`;
                        const q = query(collection(db, 'messages'), where('projectId', '==', selectedProjectId), where('triggerKey', '==', triggerKey));
                        const existingDocs = await getDocs(q);
                        
                        if (existingDocs.empty) {
                             await addDoc(collection(db, 'messages'), {
                                projectId: selectedProjectId,
                                senderId: 'SYSTEM',
                                senderName: 'CORE AI',
                                senderRole: 'ADMIN',
                                text: messageContent, 
                                timestamp: new Date(),
                                type: 'NOTIFICATION',
                                triggerKey: triggerKey
                              });
                             
                             // GỬI PUSH
                             const clientUsers = users.filter(u => u.role === 'CLIENT' && (currentProject?.clientIds || []).includes(u.id));
                             let targetTokens: string[] = [];
                             clientUsers.forEach(u => { if (u.fcmTokens) targetTokens.push(...u.fcmTokens); });
                             
                             if (targetTokens.length > 0) {
                                await fetch('/api/send-fcm', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                       tokens: targetTokens,
                                       title: "LUXORA PROTOCOL",
                                       body: `[${richTask.id}] ${richTask.name} cần review!`
                                    })
                                });
                             }
                             
                             addLog(`🔔 Alert sent for ${richTask.id}`, 'SUCCESS');
                        }
                    }
                }
            }
        }
      }

      setTasks(fetchedTasks);
      prevTasksRef.current = fetchedTasks;

      if (!isSilent) addLog("DATA SYNC COMPLETE.", "SUCCESS");
    } catch (error) {
      if (!isSilent) addLog("CONNECTION LOST.", "WARNING");
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [selectedProjectId, addLog, appConfig, currentProject, users]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => setUsers(snap.docs.map(d => d.data() as User)));
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => setProjects(snap.docs.map(d => d.data() as Project)));
    const unsubConfig = onSnapshot(doc(db, 'config', 'app'), (snap) => snap.exists() && setAppConfig(snap.data() as any));
    return () => { unsubUsers(); unsubProjects(); unsubConfig(); };
  }, []);

  useEffect(() => { if (selectedProjectId) syncWithSheet(); }, [selectedProjectId]);

  const handleUpdateProject = async (p: Project) => await setDoc(doc(db, 'projects', p.id), p);
  const handleCreateProject = async (p: Partial<Project>) => await setDoc(doc(db, 'projects', p.id || `P-${Date.now()}`), { ...p, id: p.id || `P-${Date.now()}`, clientIds: [], staffIds: [] } as Project);
  const handleUpdateUser = async (u: User) => await setDoc(doc(db, 'users', u.id), u);
  const handleCreateUser = async (u: User) => await setDoc(doc(db, 'users', u.id), u);
  const handleDeleteUser = async (uid: string) => await deleteDoc(doc(db, 'users', uid));
  const handleUpdateConfig = async (c: any) => await setDoc(doc(db, 'config', 'app'), c);
  const handleLogout = () => {
      setCurrentUser(null);
      setSelectedProjectId(null);
      localStorage.removeItem('luxora_user');
      setActiveView('dashboard');
  };

  const handleAction = async (action: string, taskId: string) => {
    if (action === 'approve') {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Done' } : t));
      addLog(`AUTHORIZING MODULE ${taskId}...`, 'INFO');
      try {
        const scriptUrl = currentProject?.webAppUrl || appConfig.webAppUrl || APPS_SCRIPT_URL;
        let finalUrl = (import.meta.env.DEV && !window.location.host.includes('vercel')) 
            ? `/api/proxy?target=${encodeURIComponent(scriptUrl)}`
            : `/api/proxy?target=${encodeURIComponent(scriptUrl)}`;
        
        await fetch(finalUrl, { method: 'POST', body: JSON.stringify({ action: 'approve', taskId: taskId }) });
        addLog(`MODULE ${taskId} STATUS: DEPLOYED (DONE)`, 'SUCCESS');
      } catch (error) { addLog(`UPLOAD FAILED FOR ${taskId}`, 'WARNING'); }
    } 
    else if (action === 'request_edit') {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const draft = `[${task.id}] [${task.name}]\nREQUESTING REVISION: `;
        setChatDraft(draft);
        setPendingFeedbackTask(taskId);
        setFeedbackAccumulator([]); 
        addLog(`FEEDBACK PROTOCOL INITIATED FOR ${taskId}`, 'INFO');
      }
    }
    else if (action === 'confirm_feedback') {
      if (!pendingFeedbackTask || feedbackAccumulator.length === 0) return;
      const combinedText = feedbackAccumulator.join('\n\n---\n\n'); 
      setTasks(prev => prev.map(t => t.id === pendingFeedbackTask ? { ...t, status: 'Need Edit' } : t));
      try {
        const scriptUrl = currentProject?.webAppUrl || appConfig.webAppUrl || APPS_SCRIPT_URL;
        let finalUrl = (import.meta.env.DEV && !window.location.host.includes('vercel')) 
            ? `/api/proxy?target=${encodeURIComponent(scriptUrl)}`
            : `/api/proxy?target=${encodeURIComponent(scriptUrl)}`;

        await fetch(finalUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'submit_feedback', taskId: pendingFeedbackTask, feedbackContent: combinedText })
        });
        addLog(`FEEDBACK UPLOADED. MODULE ${pendingFeedbackTask} FLAGGED FOR REVISION.`, 'SUCCESS');
      } catch (e) { addLog('TRANSMISSION ERROR', 'WARNING'); }
      setPendingFeedbackTask(null);
      setFeedbackAccumulator([]);
    }
  };

  const handleSendMessage = async (text: string, replyToId?: string, taggedIds?: string[]) => {
    if (!selectedProjectId || !currentUser) return;
    try {
      await addDoc(collection(db, 'messages'), {
        projectId: selectedProjectId,
        senderId: currentUser.id,
        senderName: currentUser.fullName || currentUser.username,
        senderRole: currentUser.role,
        text,
        timestamp: new Date(),
        type: 'CHAT',
        replyToId: replyToId || null,
        taggedUserIds: taggedIds || []
      });
      setChatDraft(''); 
      if (pendingFeedbackTask) { setFeedbackAccumulator(prev => [...prev, text]); }
    } catch (e) { addLog("MESSAGE FAILED TO SEND", "WARNING"); }
  };

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
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden text-[#e0e0e0] relative font-sans">
      {isLoading && (
        <div className="absolute inset-0 z-[100] bg-[#050505]/80 backdrop-blur-md flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 border-t-2 border-[#00f3ff] rounded-full animate-spin shadow-[0_0_20px_#00f3ff]"></div>
            <p className="headline-font text-[#00f3ff] text-xl tracking-[0.3em] animate-pulse">SYSTEM SYNCING...</p>
          </div>
        </div>
      )}

      {/* --- SIDEBAR CHO DESKTOP --- */}
      <div className="hidden md:flex h-full flex-shrink-0 z-40">
          <Sidebar 
             currentProject={currentProject} 
             activeView={activeView} 
             setActiveView={setActiveView} 
             userRole={currentUser.role} 
             onLogout={handleLogout} 
             onSwitchProject={() => setSelectedProjectId(null)} 
             currentUser={currentUser}
          />
      </div>
      
      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col min-w-0 md:border-l border-[#00f3ff]/20 bg-[url('/assets/grid-bg.png')] pb-20 md:pb-0">
        
        {/* HEADER RESPONSIVE */}
        <header className="h-auto min-h-[64px] md:h-20 border-b border-[#00f3ff]/20 bg-[#050505]/90 backdrop-blur-md flex flex-col md:flex-row items-center justify-between px-4 py-3 md:py-0 md:px-8 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] gap-3 md:gap-0 transition-all">
          
          {/* 1. Hàng trên: Logo + Nút Sync (Mobile) */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-sm bg-[#00f3ff]/10 flex items-center justify-center border border-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                <i className="fa-solid fa-microchip text-[#00f3ff] text-lg md:text-2xl"></i>
              </div>
              <div>
                <h1 className="headline-font text-lg md:text-2xl font-bold text-white tracking-widest text-shadow-neon">LUXORA</h1>
                <p className="code-font text-[8px] md:text-[10px] text-[#00f3ff] uppercase tracking-[0.2em] truncate max-w-[120px] md:max-w-none">
                  {currentUser.fullName}
                </p>
              </div>
            </div>

            {/* Nút Sync cho Mobile (Nằm góc phải trên cùng) */}
            <button onClick={() => syncWithSheet(false)} className="md:hidden group relative px-3 py-2 bg-transparent overflow-hidden rounded-sm border border-[#00f3ff] text-[#00f3ff] hover:text-black transition-colors active:bg-[#00f3ff] active:text-black">
              <div className="absolute inset-0 w-0 bg-[#00f3ff] transition-all duration-[250ms] ease-out group-hover:w-full"></div>
              <span className="relative flex items-center gap-2 headline-font font-bold text-[10px] tracking-widest">
                  <i className="fa-solid fa-rotate"></i> SYNC
              </span>
            </button>
          </div>
          
          {/* 2. Bộ lọc ngày tháng (Sửa lại để hiện trên Mobile) */}
          <div className="flex items-center justify-between bg-[#0f1115] border border-[#00f3ff]/20 p-1 gap-2 hud-panel w-full md:w-auto rounded-sm">
             <input 
                type="date" 
                value={dateRange.start} 
                onChange={e => setDateRange({...dateRange, start: e.target.value})} 
                className="bg-transparent text-xs text-[#00f3ff] p-2 outline-none code-font cursor-pointer uppercase dark:[color-scheme:dark] w-full text-center"
             />
             <span className="text-[#00f3ff]">-</span>
             <input 
                type="date" 
                value={dateRange.end} 
                onChange={e => setDateRange({...dateRange, end: e.target.value})} 
                className="bg-transparent text-xs text-[#00f3ff] p-2 outline-none code-font cursor-pointer uppercase dark:[color-scheme:dark] w-full text-center"
             />
          </div>

          {/* 3. Nút Sync cho Desktop */}
          <button onClick={() => syncWithSheet(false)} className="hidden md:flex group relative px-6 py-2 bg-transparent overflow-hidden rounded-sm border border-[#00f3ff] text-[#00f3ff] hover:text-black transition-colors">
            <div className="absolute inset-0 w-0 bg-[#00f3ff] transition-all duration-[250ms] ease-out group-hover:w-full"></div>
            <span className="relative flex items-center gap-2 headline-font font-bold text-sm tracking-widest">
                <i className="fa-solid fa-rotate"></i> SYNC DATA
            </span>
          </button>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-auto p-4 md:p-8 scrollbar-thin">
          {activeView === 'dashboard' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 h-auto lg:h-full">
              
              {/* LEFT COLUMN */}
              <div className="lg:col-span-8 space-y-4 flex flex-col h-auto lg:h-full lg:overflow-hidden">
                
                {/* HUD Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 shrink-0">
                  <HUDCard label="COMPLETED" count={stats.done} color="#00f3ff" active={statusFilter === 'Done'} onClick={() => setStatusFilter(statusFilter === 'Done' ? null : 'Done')} />
                  <HUDCard label="PENDING REVIEW" count={stats.review} color="#e0e0e0" active={statusFilter === 'Review'} onClick={() => setStatusFilter(statusFilter === 'Review' ? null : 'Review')} />
                  <HUDCard label="IN PROGRESS" count={stats.doing} color="#888888" active={statusFilter === 'Doing'} onClick={() => setStatusFilter(statusFilter === 'Doing' ? null : 'Doing')} />
                  <HUDCard label="QUEUED" count={stats.todo} color="#333333" active={statusFilter === 'To do'} onClick={() => setStatusFilter(statusFilter === 'To do' ? null : 'To do')} />
                </div>
                
                {/* Main Table Section */}
                <section className="flex-1 glass-panel p-1 flex flex-col relative rounded-sm min-h-[400px] lg:min-h-0 overflow-hidden">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#00f3ff]"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#00f3ff]"></div>

                    <div className="p-3 bg-[#0f1115]/50 border-b border-[#ffffff]/10 flex flex-col md:flex-row gap-2 justify-between items-start md:items-center shrink-0">
                      <div className="flex gap-4 w-full md:w-auto overflow-x-auto">
                        {currentUser?.role !== 'CLIENT' ? (
                          <>
                            <button onClick={() => { setActiveTab('05'); setStatusFilter(null); }} className={`px-4 md:px-6 py-2 text-[10px] md:text-xs font-bold headline-font transition-all clip-path-slant whitespace-nowrap ${activeTab === '05' ? 'bg-[#00f3ff] text-black' : 'bg-transparent text-[#888] border border-[#888] hover:border-[#00f3ff] hover:text-[#00f3ff]'}`}>TASK MASTER</button>
                            <button onClick={() => { setActiveTab('06'); setStatusFilter(null); }} className={`px-4 md:px-6 py-2 text-[10px] md:text-xs font-bold headline-font transition-all clip-path-slant whitespace-nowrap ${activeTab === '06' ? 'bg-[#00f3ff] text-black' : 'bg-transparent text-[#888] border border-[#888] hover:border-[#00f3ff] hover:text-[#00f3ff]'}`}>PRODUCTION</button>
                          </>
                        ) : (
                          <span className="headline-font text-[#00f3ff] text-xs md:text-sm font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                             <i className="fa-solid fa-layer-group"></i> PRODUCTION MODULE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#888] code-font">
                        VISIBLE NODES: <span className="text-[#00f3ff] font-bold">{currentTabTasks.length}</span>
                      </div>
                    </div>
                   
                   <div className="flex-1 overflow-auto">
                      <SheetSimulator tasks={currentTabTasks} onTaskSubmit={handleAction} currentTab={activeTab} />
                   </div>
                </section>
                
                {/* System Logs */}
                <section className="hidden md:flex h-32 hud-panel p-3 flex-col rounded-sm overflow-hidden shrink-0">
                    <h4 className="code-font text-[#00f3ff] text-[10px] mb-1 uppercase tracking-widest border-b border-[#00f3ff]/20 pb-1">System Logs</h4>
                    <LogPanel logs={logs} />
                </section>
              </div>
              
              {/* RIGHT COLUMN (CHAT) */}
              <div className="lg:col-span-4 h-[500px] lg:h-full">
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
      
      {/* MOBILE MENU */}
      <MobileNavbar 
         activeView={activeView} 
         setActiveView={setActiveView} 
         userRole={currentUser.role} 
         currentUser={currentUser}
         onLogout={handleLogout}         
         onSwitchProject={() => setSelectedProjectId(null)}
         project={currentProject}
      />

      <PWAPrompt />
    </div>
  );
};

export default App;