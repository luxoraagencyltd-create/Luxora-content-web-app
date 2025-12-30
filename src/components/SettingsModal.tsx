
import React, { useState } from 'react';
import { AppConfig } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (newConfig: AppConfig) => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, config, onSave }) => {
  const [formData, setFormData] = useState<AppConfig>(config);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050404]/80 backdrop-blur-md">
      <div className="bg-[#1a1412] rounded-2xl border border-[#d4af37]/30 shadow-[0_0_50px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 lacquer-gloss">
        {/* Header mang phong cách Heritage */}
        <div className="bg-[#0d0b0a] p-6 border-b border-[#d4af37]/20 flex justify-between items-center relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent"></div>
          <div>
            <h2 className="heritage-font text-[#d4af37] text-xl font-bold tracking-[0.15em]">Cấu hình Hệ thống</h2>
            <p className="code-font text-[#a39e93] text-[9px] uppercase tracking-[0.2em] mt-1 opacity-70">Thiết lập cổng truyền nhận dữ liệu số</p>
          </div>
          <button onClick={onClose} className="text-[#a39e93] hover:text-[#d4af37] transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Input Google Sheet */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="code-font text-[9px] font-bold text-[#d4af37] uppercase tracking-widest">Google Sheet URL (Read-only)</label>
              <i className="fa-solid fa-table-list text-[#d4af37]/30 text-xs"></i>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-[#00f2ff]/5 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
              <input 
                type="text"
                value={formData.googleSheetUrl}
                onChange={e => setFormData({...formData, googleSheetUrl: e.target.value})}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="relative w-full bg-[#0d0b0a] border border-[#d4af37]/20 rounded-lg px-4 py-3 text-sm text-[#f2ede4] focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/30 outline-none transition-all placeholder:text-[#a39e93]/20 code-font"
              />
            </div>
            <p className="text-[10px] text-[#a39e93]/50 italic px-1 flex items-center gap-2">
              <i className="fa-solid fa-circle-info text-[#d4af37]/40"></i>
              Dùng để đồng bộ dữ liệu từ Thư viện Số vào App.
            </p>
          </div>

          {/* Input Script API */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="code-font text-[9px] font-bold text-[#d4af37] uppercase tracking-widest">Script API URL (Write-access)</label>
              <i className="fa-solid fa-bolt text-[#00f2ff]/30 text-xs"></i>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-[#c41e3a]/5 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
              <input 
                type="text"
                value={formData.webAppUrl}
                onChange={e => setFormData({...formData, webAppUrl: e.target.value})}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="relative w-full bg-[#0d0b0a] border border-[#d4af37]/20 rounded-lg px-4 py-3 text-sm text-[#f2ede4] focus:border-[#c41e3a] focus:ring-1 focus:ring-[#c41e3a]/30 outline-none transition-all placeholder:text-[#a39e93]/20 code-font"
              />
            </div>
            <p className="text-[10px] text-[#a39e93]/50 italic px-1 flex items-center gap-2">
              <i className="fa-solid fa-key text-[#d4af37]/40"></i>
              Dùng để ghi Feedback và cập nhật trạng thái về Sheet.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="pt-6 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 heritage-font px-4 py-3 border border-[#d4af37]/20 text-[#a39e93] rounded-lg text-[11px] font-bold hover:bg-[#d4af37]/5 transition-all tracking-widest uppercase"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              className="flex-1 heritage-font px-4 py-3 bg-[#c41e3a] text-white rounded-lg text-[11px] font-black hover:bg-white hover:text-[#c41e3a] shadow-[0_0_20px_rgba(196,30,58,0.3)] border border-white/10 transition-all active:scale-95 tracking-widest uppercase"
            >
              Lưu cấu hình
            </button>
          </div>
        </form>

        {/* Decorative elements */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent"></div>
      </div>
    </div>
  );
};

export default SettingsModal;
