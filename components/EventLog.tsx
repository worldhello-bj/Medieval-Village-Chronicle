
import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';

interface EventLogProps {
  logs: LogEntry[];
}

export const EventLog: React.FC<EventLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-stone-800 rounded-lg border border-stone-600 h-full flex flex-col">
      <div className="p-3 border-b border-stone-700 bg-stone-900/50">
        <h3 className="medieval-font text-stone-200">Chronicle</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-sm custom-scrollbar">
        {logs.map(log => (
          <div key={log.id} className="flex space-x-2">
             <span className="text-stone-500 shrink-0">[Week {log.tick}]</span>
             <span className={`
               ${log.type === 'danger' ? 'text-red-400' : ''}
               ${log.type === 'warning' ? 'text-amber-400' : ''}
               ${log.type === 'success' ? 'text-emerald-400' : ''}
               ${log.type === 'ai' ? 'text-purple-400 italic' : ''}
               ${log.type === 'info' ? 'text-stone-300' : ''}
             `}>
               {log.message}
             </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};
