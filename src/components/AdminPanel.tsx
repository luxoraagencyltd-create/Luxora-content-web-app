
import React, { useState, useRef, useEffect } from 'react';
import { User, Project, AppConfig, UserRole } from '../types';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Props {
  view: string;
  users: User[];
  projects: Project[];
  onUpdateProject: (p: Project) => void;
  onUpdateUser: (u: User) => void;
  onCreateUser: (u: User) => void;
  onDeleteUser: (userId: string) => void;
  onCreateProject: (p: Partial<Project>) => void;
  config: AppConfig;
  onUpdateConfig: (c: AppConfig) => void;
}

const AdminPanel: React.FC<Props> = ({ view, users, projects, onUpdateProject, onUpdateUser, onCreateUser, onDeleteUser, onCreateProject, config: _config, onUpdateConfig: _onUpdateConfig }) => {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState<User>({ 
    id: '',
    username: '', 
    fullName: '', 
    company: '',
    role: 'CLIENT', 
    password: '123' 
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({ id: 'P-', name: '', color: 'gold-leaf' });

  const [localConfig, setLocalConfig] = useState<AppConfig>(_config || { googleSheetUrl: '', webAppUrl: '' });
  useEffect(() => { setLocalConfig(_config || { googleSheetUrl: '', webAppUrl: '' }); }, [_config]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleToggleUserInProject = (projectId: string, field: 'staffIds' | 'clientIds', userId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const currentIds = [...(project[field] || [])];
      const index = currentIds.indexOf(userId);
      if (index === -1) {
        currentIds.push(userId);
      } else {
        currentIds.splice(index, 1);
      }
      const updated = { ...project, [field]: currentIds };
      onUpdateProject(updated);
      setEditingProject(updated);
    }
  };

  const handleUpdateUserField = (field: keyof User, value: unknown) => {
    if (editingUser) {
      const updated = { ...editingUser, [field]: value };
      setEditingUser(updated);
    }
  };

  const handleSaveUser = () => {
    if (editingUser) {
      onUpdateUser(editingUser);
      setEditingUser(null);
    }
  };

  const handleCreateUserSubmit = () => {
    if (newUser.username) {
      const id = newUser.id || `U-${Math.floor(Math.random() * 900) + 100}`;
      onCreateUser({ ...newUser, id });
      setIsCreatingUser(false);
      setNewUser({ 
        id: '',
        username: '', 
        fullName: '', 
        company: '',
        role: 'CLIENT', 
        password: '123' 
      });
    } else {
      alert("Vui lòng nhập Username để khởi tạo Node!");
    }
  };

  const handleCreateProjectSubmit = () => {
    if (newProject.id && newProject.name) {
      onCreateProject(newProject);
      setIsCreatingProject(false);
      setNewProject({ id: 'P-', name: '', color: 'gold-leaf' });
    }
  };

  // ---- Import users from file (Excel / CSV) ----
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const normalizeKey = (k: string) => k.trim().toLowerCase();

  const handleFile = async (file?: File) => {
    if (!file) return;
    setImportStatus('Reading file...');
    setImportErrors([]);

    try {
      const data = await file.arrayBuffer();
      const xlsx = await import('xlsx');
      const workbook = xlsx.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = xlsx.utils.sheet_to_json(sheet, { defval: '' });

      if (!rows || rows.length === 0) {
        setImportStatus('No rows found in file.');
        return;
      }

      const required = ['id node', 'vai trò', 'họ và tên', 'công ty', 'username', 'pass'];
      const createdIds: string[] = [];
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const raw = rows[i];
        // map keys to lowercase
        const obj: Record<string, any> = {};
        Object.keys(raw).forEach(k => (obj[normalizeKey(String(k))] = raw[k]));

        const id = (obj['id node'] || obj['id'] || obj['node id'] || obj['nodeid'] || obj['node'])?.toString().trim();
        const roleRaw = (obj['vai trò'] || obj['role'] || obj['vaitro'] || obj['vai-tro'])?.toString().trim();
        const fullName = (obj['họ và tên'] || obj['ho va ten'] || obj['fullname'] || obj['full name'])?.toString().trim();
        const company = (obj['công ty'] || obj['cong ty'] || obj['company'])?.toString().trim() || 'Sample';
        const username = (obj['username'] || obj['user'] || obj['login'])?.toString().trim();
        const pass = (obj['pass'] || obj['password'] || obj['pwd'])?.toString();

        const rowLabel = `row ${i + 2}`; // header is row 1

        if (!id) { errors.push(`${rowLabel}: missing ID node`); continue; }
        if (!roleRaw) { errors.push(`${rowLabel}: missing Vai trò`); continue; }
        if (!username) { errors.push(`${rowLabel}: missing username`); continue; }
        if (!pass) { errors.push(`${rowLabel}: missing pass`); continue; }

        const role = (roleRaw.toUpperCase().startsWith('A') ? 'ADMIN' : roleRaw.toUpperCase().startsWith('S') ? 'STAFF' : 'CLIENT') as UserRole;

        const user: User = {
          id,
          username: username || id,
          role,
          company,
          password: pass || '123',
          fullName: fullName || username || id
        };

        try {
          await onCreateUser(user);
          createdIds.push(id);
        } catch (err: any) {
          errors.push(`${rowLabel}: failed to create ${id} — ${err?.message ?? err}`);
        }
      }

      // create samples/test-users doc listing staff+client ids
      try {
        const sampleMemberIds = createdIds.filter(id => !id.toLowerCase().startsWith('admin'));
        await setDoc(doc(db, 'samples', 'test-users'), { memberIds: sampleMemberIds });
      } catch (err) {
        // non-fatal
        console.error('Could not write samples/test-users', err);
      }

      setImportErrors(errors);
      setImportStatus(`Imported ${createdIds.length} users; ${errors.length} errors.`);
    } catch (err: any) {
      setImportStatus('Import failed: ' + (err?.message ?? err));
    }
  };


  const renderUserModal = (user: User, isEdit: boolean) => {
    const title = isEdit ? "CHỈNH SỬA DANH TÍNH" : "KHỞI TẠO DANH TÍNH MỚI";
    const onSave = isEdit ? handleSaveUser : handleCreateUserSubmit;
    const onClose = () => isEdit ? setEditingUser(null) : setIsCreatingUser(false);
    
    const setField = (field: keyof User, val: unknown) => {
      if (isEdit) handleUpdateUserField(field, val);
      else setNewUser(prev => ({ ...prev, [field]: val }));
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050404]/95 backdrop-blur-xl">
        <div className="bg-[#1a1412] rounded-2xl border border-[#d4af37]/40 p-0 w-full max-w-md shadow-[0_0_100px_rgba(0,0,0,1)] lacquer-gloss animate-in zoom-in duration-200 overflow-hidden">
          <div className="bg-[#0d0b0a] p-6 border-b border-[#d4af37]/20 flex justify-between items-center">
            <h3 className="heritage-font text-[#d4af37] text-lg font-bold tracking-widest flex items-center gap-3">
              <i className={`fa-solid ${isEdit ? 'fa-user-pen' : 'fa-user-plus'} text-[#00f2ff]`}></i> {title}
            </h3>
            <button onClick={onClose} className="text-[#a39e93] hover:text-[#c41e3a] transition-all"><i className="fa-solid fa-xmark text-xl"></i></button>
          </div>
          <div className="p-8 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-1.5">
              <label className="code-font text-[9px] font-black text-[#a39e93] uppercase tracking-widest">Node ID (Cố định)</label>
              <input type="text" value={user.id} onChange={(e) => setField('id', e.target.value)} className="w-full bg-[#0d0b0a]/50 border border-[#d4af37]/20 rounded-lg p-3 text-xs text-[#00f2ff] outline-none code-font font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="code-font text-[9px] font-black text-[#d4af37] uppercase tracking-widest">Tên Đăng Nhập (Username)</label>
              <input type="text" value={user.username} onChange={(e) => setField('username', e.target.value)} className="w-full bg-[#0d0b0a] border border-[#d4af37]/30 rounded-lg p-3 text-xs text-[#f2ede4] outline-none focus:border-[#00f2ff] transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="code-font text-[9px] font-black text-[#d4af37] uppercase tracking-widest">Họ Tên / Biệt Danh</label>
              <input type="text" value={user.fullName || ''} onChange={(e) => setField('fullName', e.target.value)} className="w-full bg-[#0d0b0a] border border-[#d4af37]/30 rounded-lg p-3 text-xs text-[#f2ede4] outline-none focus:border-[#00f2ff] transition-all" placeholder="VD: Đường Bá Hổ" />
            </div>
            <div className="space-y-1.5 p-3 bg-[#d4af37]/5 rounded-lg border border-[#d4af37]/10">
              <label className="code-font text-[9px] font-black text-[#00f2ff] uppercase tracking-widest flex items-center gap-2">
                <i className="fa-solid fa-building"></i> Tên Công Ty / Tổ Chức
              </label>
              <input type="text" value={user.company || ''} onChange={(e) => setField('company', e.target.value)} className="w-full bg-[#0d0b0a] border border-[#d4af37]/40 rounded-lg p-3 text-xs text-[#f2ede4] outline-none focus:border-[#00f2ff] transition-all" placeholder="VD: Luxora Media Group..." />
            </div>
            <div className="space-y-1.5">
              <label className="code-font text-[9px] font-black text-[#a39e93] uppercase tracking-widest">Vai Trò Hệ Thống</label>
              <select value={user.role} onChange={(e) => setField('role', e.target.value as UserRole)} className="w-full bg-[#0d0b0a] border border-[#d4af37]/30 rounded-lg p-3 text-xs text-[#f2ede4] outline-none focus:border-[#d4af37] cursor-pointer">
                <option value="ADMIN">ADMIN - Tổng Quản</option>
                <option value="STAFF">STAFF - Cố Vấn</option>
                <option value="CLIENT">CLIENT - Member</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="code-font text-[9px] font-black text-[#c41e3a] uppercase tracking-widest flex items-center gap-2">
                <i className="fa-solid fa-shield-halved"></i> Mã Bảo Mật (Password)
              </label>
              <input type="text" value={user.password || ''} onChange={(e) => setField('password', e.target.value)} className="w-full bg-[#0d0b0a] border border-[#c41e3a]/30 rounded-lg p-3 text-xs text-[#f2ede4] outline-none focus:border-[#00f2ff] code-font font-bold" />
            </div>
          </div>
          <div className="p-6 bg-[#0d0b0a] flex gap-4 border-t border-[#d4af37]/10">
            <button onClick={onClose} className="flex-1 py-3 text-[#a39e93] text-[10px] heritage-font tracking-[0.2em] uppercase hover:text-white transition-colors">HỦY BỎ</button>
            <button onClick={onSave} className="flex-1 py-3 bg-[#d4af37] text-[#0d0b0a] rounded font-black text-[10px] heritage-font tracking-[0.2em] uppercase hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] active:scale-95">
              {isEdit ? 'LƯU DANH TÍNH' : 'KHỞI TẠO NODE'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTeamConfigModal = () => {
    if (!editingProject) return null;
    const staffUsers = users.filter(u => u.role === 'STAFF');
    const clientUsers = users.filter(u => u.role === 'CLIENT');
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050404]/95 backdrop-blur-xl">
        <div className="bg-[#1a1412] rounded-2xl border border-[#d4af37]/40 p-0 w-full max-w-4xl shadow-[0_0_150px_rgba(0,0,0,1)] lacquer-gloss animate-in zoom-in duration-200 overflow-hidden">
          <div className="bg-[#0d0b0a] p-6 border-b border-[#d4af37]/20 flex justify-between items-center">
            <h3 className="heritage-font text-[#d4af37] text-xl font-bold tracking-widest flex items-center gap-3">
              <i className="fa-solid fa-users-rectangle text-[#00f2ff]"></i> QUẢN TRỊ NHÂN SỰ: {editingProject.name}
            </h3>
            <button onClick={() => setEditingProject(null)} className="text-[#a39e93] hover:text-[#c41e3a] transition-all"><i className="fa-solid fa-xmark text-2xl"></i></button>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10 max-h-[70vh] overflow-y-auto scrollbar-thin">
            <div className="space-y-6">
               <div className="flex justify-between items-end border-b border-[#00f2ff]/20 pb-2">
                 <h4 className="heritage-font text-[#00f2ff] text-xs font-bold tracking-widest uppercase">Đội Ngũ Cố Vấn (Staff)</h4>
                 <span className="code-font text-[9px] text-[#a39e93]">{(editingProject.staffIds || []).length} Đã gán</span>
               </div>
               <div className="bg-[#0d0b0a] border border-[#d4af37]/10 rounded-xl overflow-hidden divide-y divide-[#d4af37]/5 h-96 overflow-y-auto scrollbar-thin">
                  {staffUsers.length === 0 ? (
                    <div className="p-10 text-center code-font text-[10px] text-[#a39e93] opacity-30 italic">KHÔNG CÓ NHÂN SỰ STAFF</div>
                  ) : staffUsers.map(s => (
                    <div key={s.id} onClick={() => handleToggleUserInProject(editingProject.id, 'staffIds', s.id)} className={`flex items-center gap-4 p-4 cursor-pointer transition-all hover:bg-[#00f2ff]/5 ${(editingProject.staffIds || []).includes(s.id) ? 'bg-[#00f2ff]/10' : ''}`}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${(editingProject.staffIds || []).includes(s.id) ? 'bg-[#00f2ff] border-[#00f2ff]' : 'border-[#d4af37]/20 bg-transparent'}`}>{(editingProject.staffIds || []).includes(s.id) && <i className="fa-solid fa-check text-[#0d0b0a] text-[10px]"></i>}</div>
                      <div className="flex-1"><div className="text-xs font-bold text-[#f2ede4]">{s.fullName || s.username}</div><div className="text-[8px] code-font text-[#a39e93] tracking-widest uppercase">ID: {s.id}</div></div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="space-y-6">
               <div className="flex justify-between items-end border-b border-[#d4af37]/20 pb-2">
                 <h4 className="heritage-font text-[#d4af37] text-xs font-bold tracking-widest uppercase">Danh Sách Hội Viên (Clients)</h4>
                 <span className="code-font text-[9px] text-[#a39e93]">{(editingProject.clientIds || []).length} Đã gán</span>
               </div>
               <div className="bg-[#0d0b0a] border border-[#d4af37]/10 rounded-xl overflow-hidden divide-y divide-[#d4af37]/5 h-96 overflow-y-auto scrollbar-thin">
                  {clientUsers.length === 0 ? (
                    <div className="p-10 text-center code-font text-[10px] text-[#a39e93] opacity-30 italic">KHÔNG CÓ HỘI VIÊN CLIENT</div>
                  ) : clientUsers.map(c => (
                    <div key={c.id} onClick={() => handleToggleUserInProject(editingProject.id, 'clientIds', c.id)} className={`flex items-center gap-4 p-4 cursor-pointer transition-all hover:bg-[#d4af37]/5 ${(editingProject.clientIds || []).includes(c.id) ? 'bg-[#d4af37]/10' : ''}`}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${(editingProject.clientIds || []).includes(c.id) ? 'bg-[#d4af37] border-[#d4af37]' : 'border-[#d4af37]/20 bg-transparent'}`}>{(editingProject.clientIds || []).includes(c.id) && <i className="fa-solid fa-check text-[#0d0b0a] text-[10px]"></i>}</div>
                      <div className="flex-1"><div className="text-xs font-bold text-[#f2ede4]">{c.fullName || c.username}</div><div className="text-[8px] code-font text-[#a39e93] tracking-widest uppercase">{c.company || 'Private Node'}</div></div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="md:col-span-2 mt-4">
               <div className="pt-6 border-t border-[#d4af37]/10">
                 <h4 className="heritage-font text-[#d4af37] text-xs font-bold tracking-widest uppercase mb-3">Cấu hình Dự án</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <label className="code-font text-[9px] text-[#a39e93] uppercase">Apps Script (Web App) URL</label>
                     <input type="text" value={editingProject.webAppUrl || ''} onChange={(e) => setEditingProject(prev => prev ? ({...prev, webAppUrl: e.target.value}) : prev)} className="w-full bg-[#0d0b0a] border border-[#d4af37]/30 rounded-lg p-3 text-xs text-[#f2ede4] outline-none" placeholder="https://script.google.com/macros/s/.../exec" />
                   </div>
                   <div className="space-y-1">
                     <label className="code-font text-[9px] text-[#a39e93] uppercase">Google Sheet URL</label>
                     <input type="text" value={editingProject.sheetUrl || ''} onChange={(e) => setEditingProject(prev => prev ? ({...prev, sheetUrl: e.target.value}) : prev)} className="w-full bg-[#0d0b0a] border border-[#d4af37]/30 rounded-lg p-3 text-xs text-[#f2ede4] outline-none" placeholder="https://docs.google.com/spreadsheets/d/..." />
                   </div>
                   <div className="flex items-center gap-2 mt-2">
                     <button onClick={async () => {
                        if (!editingProject) return;
                        setIsTesting(true); setTestResult(null);
                        try {
                          const proxy = `/api/proxy?action=test&target=${encodeURIComponent(editingProject.webAppUrl || '')}`;
                          const r = await fetch(proxy);
                          const text = await r.text();
                          setTestResult(text);
                        } catch (err:any) {
                          setTestResult(String(err));
                        } finally { setIsTesting(false); }
                      }} className="px-3 py-2 bg-[#00f2ff] text-[#0d0b0a] rounded text-xs font-bold">{isTesting ? 'ĐANG KIỂM TRA...' : 'KIỂM TRA WEBAPP NÀY'}</button>
                     {testResult && <div className="text-[10px] code-font text-[#a39e93]">Kết quả: <span className="italic">(xem bên dưới)</span></div>}
                   </div>
                   {testResult && (
                     <div className="mt-3 p-3 bg-[#0d0b0a] border border-[#d4af37]/10 rounded text-xs code-font max-h-48 overflow-auto whitespace-pre-wrap">{testResult}</div>
                   )}
                 </div>
               </div>
            </div>
          </div>
          <div className="bg-[#0d0b0a] p-8 flex gap-4 border-t border-[#d4af37]/10">
            <button onClick={() => {
                if (editingProject) onUpdateProject(editingProject);
                setEditingProject(null);
              }} className="flex-1 heritage-font bg-[#d4af37] text-[#0d0b0a] py-4 rounded font-black text-xs hover:bg-white tracking-[0.2em] transition-all shadow-lg active:scale-95">XÁC NHẬN THIẾT LẬP NHÂN SỰ</button>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectManager = () => (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="overflow-hidden bg-[#1a1412] border border-[#d4af37]/20 rounded-2xl lacquer-gloss shadow-2xl">
        <div className="p-6 border-b border-[#d4af37]/20 flex justify-between items-center bg-[#0d0b0a]/50">
          <div>
            <h2 className="heritage-font text-[#d4af37] text-xl font-bold tracking-widest uppercase">Quản lý Dự án (Blueprints)</h2>
            <p className="code-font text-[9px] text-[#a39e93] uppercase tracking-widest mt-1">Cấu hình nhân sự và phạm vi Giao thức</p>
          </div>
          <button onClick={() => setIsCreatingProject(true)} className="bg-[#00f2ff] text-[#0d0b0a] px-5 py-2.5 rounded font-black text-[10px] heritage-font hover:bg-white transition-all uppercase shadow-[0_0_20px_rgba(0,242,255,0.2)]">
            + KHỞI TẠO DỰ ÁN
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#0d0b0a] text-[#a39e93] border-b border-[#d4af37]/10">
                <th className="p-4 uppercase tracking-tighter w-12">#</th>
                <th className="p-4 uppercase tracking-widest">ID Dự án</th>
                <th className="p-4 uppercase tracking-widest">Tên Dự Án</th>
                <th className="p-4 uppercase tracking-widest text-center">Cố vấn</th>
                <th className="p-4 uppercase tracking-widest text-center">Hội viên</th>
                <th className="p-4 uppercase tracking-widest text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr key="no-projects"><td colSpan={6} className="p-20 text-center code-font text-[#a39e93] opacity-30 tracking-[0.5em] uppercase italic">CHƯA CÓ DỰ ÁN TRÊN HỆ THỐNG</td></tr>
                  ) : projects.map((p, i) => (
                <tr key={p.id} className="border-b border-[#d4af37]/5 hover:bg-[#d4af37]/5 transition-colors group">
                  <td className="p-4 code-font text-[#a39e93]">{i + 1}</td>
                  <td className="p-4 code-font text-[#00f2ff] font-bold neon-blue-glow">{p.id}</td>
                  <td className="p-4">
                    <div className="font-bold text-[#f2ede4] heritage-font tracking-widest">{p.name}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-[#00f2ff]/10 text-[#00f2ff] px-2 py-1 rounded text-[10px] font-bold border border-[#00f2ff]/20">{(p.staffIds || []).length}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-[#d4af37]/10 text-[#d4af37] px-2 py-1 rounded text-[10px] font-bold border border-[#d4af37]/20">{(p.clientIds || []).length}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => setEditingProject(p)} className="px-4 py-1.5 rounded-lg bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d0b0a] transition-all border border-[#d4af37]/20 text-[9px] font-black tracking-widest heritage-font">
                        GÁN NHÂN SỰ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUserManager = () => (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="overflow-hidden bg-[#1a1412] border border-[#d4af37]/20 rounded-2xl lacquer-gloss shadow-2xl">
        <div className="p-6 border-b border-[#d4af37]/20 flex justify-between items-center bg-[#0d0b0a]/50">
          <div>
            <h2 className="heritage-font text-[#d4af37] text-xl font-bold tracking-widest uppercase">Quản lý Danh tính (Users)</h2>
            <p className="code-font text-[9px] text-[#a39e93] uppercase tracking-widest mt-1">Quản trị phân quyền và bảo mật Node</p>
          </div>
          <button onClick={() => setIsCreatingUser(true)} className="bg-[#d4af37] text-[#0d0b0a] px-5 py-2.5 rounded font-black text-[10px] heritage-font hover:bg-white transition-all uppercase shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            + THÊM DANH TÍNH
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#0d0b0a] text-[#a39e93] border-b border-[#d4af37]/10">
                <th className="p-4 uppercase tracking-tighter w-12">#</th>
                <th className="p-4 uppercase tracking-widest">ID Node</th>
                <th className="p-4 uppercase tracking-widest">Vai Trò</th>
                <th className="p-4 uppercase tracking-widest">Họ Tên / Công Ty</th>
                <th className="p-4 uppercase tracking-widest text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-b border-[#d4af37]/5 hover:bg-[#d4af37]/5 transition-colors">
                  <td className="p-4 text-[#a39e93] font-bold">{i + 1}</td>
                  <td className="p-4 code-font text-[#00f2ff] font-bold">{u.id}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${u.role === 'ADMIN' ? 'border-[#c41e3a] text-[#c41e3a]' : 'border-[#d4af37] text-[#d4af37]'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-[#f2ede4]">{u.fullName || u.username}</div>
                    <div className="text-[9px] text-[#a39e93] mt-1 italic uppercase opacity-70 tracking-tight">
                      <i className="fa-solid fa-briefcase mr-1 text-[#d4af37]/40"></i> {u.company || 'Corporate Node'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => setEditingUser(u)} className="w-8 h-8 rounded-lg bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d0b0a] transition-all flex items-center justify-center border border-[#d4af37]/20" title="Chỉnh sửa"><i className="fa-solid fa-user-pen text-xs"></i></button>
                      <button onClick={() => onDeleteUser(u.id)} className="w-8 h-8 rounded-lg bg-[#c41e3a]/10 text-[#c41e3a] hover:bg-[#c41e3a] hover:text-white transition-all flex items-center justify-center border border-[#c41e3a]/20" title="Xóa"><i className="fa-solid fa-user-slash text-xs"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(view) {
      case 'manage-users':
        return renderUserManager();
      case 'manage-projects':
        return renderProjectManager();
      case 'system-settings':
        return (
          <div className="bg-[#1a1412] p-6 rounded-2xl border border-[#d4af37]/20 animate-in fade-in">
            <h3 className="heritage-font text-[#d4af37] text-lg font-bold tracking-widest mb-4">CẤU HÌNH HỆ THỐNG</h3>
            <p className="code-font text-[10px] text-[#a39e93] uppercase tracking-widest mb-6">Thiết lập URL Google Apps Script và Web App hook để đồng bộ dữ liệu.</p>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="code-font text-[9px] text-[#a39e93] uppercase">Apps Script (Web App) URL</label>
                <input type="text" value={localConfig.webAppUrl} onChange={(e) => setLocalConfig(prev => ({...prev, webAppUrl: e.target.value}))} className="w-full bg-[#0d0b0a] border border-[#d4af37]/30 rounded-lg p-3 text-xs text-[#f2ede4] outline-none" placeholder="https://script.google.com/macros/s/...." />
              </div>
              <div className="space-y-1">
                <label className="code-font text-[9px] text-[#a39e93] uppercase">Google Sheet URL</label>
                <input type="text" value={localConfig.googleSheetUrl} onChange={(e) => setLocalConfig(prev => ({...prev, googleSheetUrl: e.target.value}))} className="w-full bg-[#0d0b0a] border border-[#d4af37]/30 rounded-lg p-3 text-xs text-[#f2ede4] outline-none" placeholder="https://docs.google.com/spreadsheets/d/..." />
              </div>
              <div className="flex flex-col md:flex-row gap-4 mt-4 items-start">
                <div className="flex gap-2">
                  <button onClick={() => { setLocalConfig(_config); }} className="px-4 py-2 bg-transparent border border-[#d4af37]/20 text-[#a39e93] rounded">HỦY</button>
                  <button onClick={() => { _onUpdateConfig(localConfig); }} className="px-4 py-2 bg-[#d4af37] text-[#0d0b0a] rounded font-bold">LƯU CẤU HÌNH</button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={async () => {
                      setIsTesting(true); setTestResult(null);
                      try {
                        const proxy = `/api/proxy?action=test&target=${encodeURIComponent(localConfig.webAppUrl || '')}`;
                        const r = await fetch(proxy);
                        const text = await r.text();
                        setTestResult(text);
                      } catch (err:any) {
                        setTestResult(String(err));
                      } finally { setIsTesting(false); }
                    }} className="px-4 py-2 bg-[#00f2ff] text-[#0d0b0a] rounded font-bold">{isTesting ? 'ĐANG KIỂM TRA...' : 'KIỂM TRA WEBAPP'}</button>
                </div>
              </div>
              {testResult && (
                <div className="mt-4 p-3 bg-[#0d0b0a] border border-[#d4af37]/10 rounded text-xs code-font max-h-48 overflow-auto whitespace-pre-wrap">{testResult}</div>
              )}
            </div>
          </div>
        );
      default:
        return renderUserManager();
    }
  };

  return (
    <div className="flex-1 overflow-auto p-2 scrollbar-thin">
      {renderContent()}
      
      {/* Modals */}
      {renderTeamConfigModal()}
      {editingUser && renderUserModal(editingUser, true)}
      {isCreatingUser && renderUserModal(newUser, false)}
      
      {isCreatingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050404]/95 backdrop-blur-xl">
          <div className="bg-[#1a1412] rounded-2xl border border-[#00f2ff]/40 p-0 w-full max-w-md shadow-[0_0_100px_rgba(0,0,0,1)] lacquer-gloss animate-in zoom-in duration-200">
             <div className="bg-[#0d0b0a] p-6 border-b border-[#00f2ff]/20 flex justify-between items-center">
               <h3 className="heritage-font text-[#00f2ff] text-lg font-bold tracking-widest flex items-center gap-3">
                 <i className="fa-solid fa-diagram-project"></i> KHỞI TẠO DỰ ÁN MỚI
               </h3>
               <button onClick={() => setIsCreatingProject(false)} className="text-[#a39e93] hover:text-[#c41e3a] transition-all"><i className="fa-solid fa-xmark text-xl"></i></button>
             </div>
             <div className="p-8 space-y-5">
               <div className="space-y-1.5">
                 <label className="code-font text-[9px] font-black text-[#a39e93] uppercase tracking-widest">Mã Dự Án (ID)</label>
                 <input type="text" value={newProject.id} onChange={(e) => setNewProject({...newProject, id: e.target.value})} className="w-full bg-[#0d0b0a] border border-[#00f2ff]/30 rounded-lg p-3 text-xs text-[#00f2ff] outline-none code-font font-bold" placeholder="P-EXAMPLE" />
               </div>
               <div className="space-y-1.5">
                 <label className="code-font text-[9px] font-black text-[#d4af37] uppercase tracking-widest">Tên Dự Án (Blueprint Name)</label>
                 <input type="text" value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} className="w-full bg-[#0d0b0a] border border-[#d4af37]/30 rounded-lg p-3 text-xs text-[#f2ede4] outline-none focus:border-[#00f2ff] transition-all" placeholder="Tên dự án chiến lược..." />
               </div>
             </div>
             <div className="p-6 bg-[#0d0b0a] flex gap-4 border-t border-[#00f2ff]/10">
               <button onClick={() => setIsCreatingProject(false)} className="flex-1 py-3 text-[#a39e93] text-[10px] heritage-font tracking-[0.2em] uppercase hover:text-white">HỦY BỎ</button>
               <button onClick={handleCreateProjectSubmit} className="flex-1 py-3 bg-[#00f2ff] text-[#0d0b0a] rounded font-black text-[10px] heritage-font tracking-[0.2em] uppercase hover:bg-white shadow-[0_0_20px_rgba(0,242,255,0.3)]">KHỞI TẠO DỰ ÁN</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
