/**
 * JATAYU — Live Geospatial System Log Terminal Component
 */

import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Trash2, CheckCircle2 } from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

interface SystemLogTerminalProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const SystemLogTerminal: React.FC<SystemLogTerminalProps> = ({
  logs,
  onClear
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border-t border-slate-800 bg-slate-950 font-mono text-xs select-none">
      {/* Header Bar */}
      <div className="h-8 px-4 flex items-center justify-between bg-slate-950 border-b border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-300">Geospatial Execution Stream</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-500">
            {logs.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-900 transition"
            title="Clear Stream"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-900 transition"
            title={collapsed ? 'Expand Stream' : 'Collapse Stream'}
          >
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Terminal Lines */}
      {!collapsed && (
        <div className="h-28 overflow-y-auto p-3 space-y-1 font-mono text-[11px] bg-slate-950/90">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">No execution events logged. Select a dataset to begin.</div>
          ) : (
            logs.map((log) => {
              const levelColor =
                log.level === 'error' ? 'text-rose-400' :
                log.level === 'warn' ? 'text-amber-400' :
                log.level === 'success' ? 'text-emerald-400' :
                'text-cyan-300';

              return (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 text-[10px] flex-shrink-0">[{log.timestamp}]</span>
                  <span className={`flex-shrink-0 uppercase text-[9px] px-1 py-0.2 rounded font-bold ${
                    log.level === 'error' ? 'bg-rose-950/80 text-rose-300' :
                    log.level === 'warn' ? 'bg-amber-950/80 text-amber-300' :
                    log.level === 'success' ? 'bg-emerald-950/80 text-emerald-300' :
                    'bg-slate-900 text-cyan-400'
                  }`}>
                    {log.level}
                  </span>
                  <span className={`${levelColor} break-all`}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
