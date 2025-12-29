
export enum TaskStatus {
  PENDING = 'To do',
  DOING = 'Doing',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  DONE = 'Done',
  REVISION = 'Need Edit',
  OVERDUE = 'Overdue',
  CANCEL = 'Cancel'
}

export type UserRole = 'ADMIN' | 'STAFF' | 'CLIENT';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  company?: string;
  password?: string;
  fullName?: string;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  clientIds: string[];
  staffIds: string[];
  color: string;
  sheetUrl?: string;    
  webAppUrl?: string;   
}

export interface Task {
  id: string;
  projectId: string;
  phase: string;        // 05: Giai đoạn | 06: Dạng content
  name: string;         // 05: Tên công việc | 06: Angle
  status: string;
  priority?: string;
  planStart?: string;
  duration?: number;
  planEnd: string;      // 05: Plan End | 06: Thời gian đăng
  link: string;         // 05: Link | 06: Link bài đăng
  staff?: string;       // 05: Người thực hiện (Assignee)
  feedbacks: string[];
  
  // Các trường chuyên biệt cho tab 06. Production
  pillar?: string;
  seeding?: string;
  contentBody?: string; // Nội dung bài
  image?: string;       // Hình
}

export interface Issue {
  id: string;
  type: string;         // Loại (Type)
  summary: string;      // Tên vấn đề (Issue Summary)
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  owner: string;        // Người chịu trách nhiệm
  status: string;       // Trạng thái
  dateRaised: string;   // Ngày phát hiện
  dueDate: string;      // Hạn xử lý
  closedDate?: string;  // Ngày đóng
  overdue: number;
  daysOpen: number;     // Số ngày tồn tại
  solution?: string;    // Giải pháp / Ghi chú
}

export interface ReviewMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: Date;
  taskId?: string;
  type: 'NOTIFICATION' | 'CHAT';
  replyToId?: string; 
  taggedUserIds?: string[]; 
}

export interface LogEntry {
  id: string;
  projectId: string;
  timestamp: Date;
  event: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING';
}

export interface AppConfig {
  googleSheetUrl: string;
  webAppUrl: string;
}
