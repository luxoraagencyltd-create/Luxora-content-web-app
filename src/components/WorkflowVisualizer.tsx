
import React from 'react';

interface Props {
  activeStage: 1 | 2;
}

const WorkflowVisualizer: React.FC<Props> = ({ activeStage }) => {
  return (
    <div className="bg-[#1a1412] rounded-2xl border border-[#d4af37]/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl lacquer-gloss">
      <Stage 
        num={1} 
        title="KHỞI TẠO PHÁP LỆNH" 
        active={activeStage === 1}
        icon="fa-feather-pointed"
        items={[
          "Lấy Tech làm Bút, lấy Data làm Mực",
          "Nạp Giao thức Luxora OS",
          "Kích hoạt Viral Warfare tới Member"
        ]}
      />
      
      <div className="flex-1 flex items-center justify-center py-4 md:py-0 w-full">
        <div className={`h-[2px] flex-1 border-t-2 border-dashed ${activeStage === 2 ? 'border-[#00f2ff]' : 'border-[#d4af37]/20'} relative`}>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeStage === 2 ? 'bg-[#00f2ff] text-[#0d0b0a] animate-pulse shadow-[0_0_20px_#00f2ff]' : 'bg-[#1a1412] text-[#d4af37]/30 border border-[#d4af37]/20'}`}>
            <i className="fa-solid fa-bolt-lightning text-sm"></i>
          </div>
        </div>
      </div>

      <Stage 
        num={2} 
        title="PHÊ DUYỆT BLUEPRINT" 
        active={activeStage === 2}
        icon="fa-stamp"
        items={[
          "Member Phản hồi qua Thư viện Số",
          "Tái cấu trúc (Need Edit) khi cần",
          "Phong Ấn (Done) hoàn tất Giao thức"
        ]}
      />
    </div>
  );
};

const Stage = ({ num, title, active, items, icon }: { num: number, title: string, active: boolean, items: string[], icon: string }) => (
  <div className={`flex-1 w-full p-6 rounded-xl transition-all border ${active ? 'bg-[#d4af37]/5 border-[#d4af37]/40 shadow-[inset_0_0_20px_rgba(212,175,55,0.05)]' : 'bg-[#0d0b0a]/40 border-transparent opacity-40'}`}>
    <div className="flex items-center gap-4 mb-4">
      <div className={`w-10 h-10 rounded flex items-center justify-center font-bold ${active ? 'bg-[#d4af37] text-[#0d0b0a]' : 'bg-[#1a1412] text-[#d4af37]/40 border border-[#d4af37]/20'}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div>
        <h3 className={`heritage-font font-bold text-sm tracking-widest ${active ? 'text-[#d4af37]' : 'text-[#a39e93]'}`}>{title}</h3>
        <p className="code-font text-[8px] text-[#a39e93]/60">PHASE 0{num}.EXE</p>
      </div>
    </div>
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[10px] font-medium text-[#f2ede4]/80">
          <i className={`fa-solid fa-square-check mt-0.5 ${active ? 'text-[#00f2ff]' : 'text-[#a39e93]/40'}`}></i> 
          <span className="leading-relaxed italic">{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default WorkflowVisualizer;
