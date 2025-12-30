
import React from 'react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
}

const LogPanel: React.FC<Props> = ({ logs }) => {
  return (
    <div className="flex-1 overflow-y-auto px-2 space-y-1 code-font text-[10px]">
      {logs.length === 0 && (
        <div className="text-[#a39e93]/40 italic py-6 text-center tracking-widest">AWAITING SYSTEM TRIGGER...</div>
      )}
      {logs.map((log) => (
        <div key={log.id} className="flex gap-4 py-2 border-b border-[#d4af37]/5 last:border-0 items-center">
          <span className="text-[#a39e93] shrink-0 font-bold">
            [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
          </span>
          <span className={`font-black w-20 shrink-0 tracking-[0.1em] ${
            log.type === 'SUCCESS' ? 'text-[#00f2ff]' :
            log.type === 'WARNING' ? 'text-[#c41e3a]' :
            'text-[#d4af37]'
          }`}>
            &gt; {log.type}
          </span>
          <span className="text-[#f2ede4]/70 uppercase">{log.event}</span>
        </div>
      ))}
    </div>
  );
};

export default LogPanel;
