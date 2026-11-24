import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { ConnectionState, HealthResponse } from '../types/api';

interface ConnectionBadgeProps {
  state: ConnectionState;
  health: HealthResponse | null;
  latencyMs: number | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({
  state,
  health,
  latencyMs,
  onRefresh,
  isRefreshing,
}) => {
  if (state === 'connected') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium">Backend Connected</span>
          {latencyMs !== null && (
            <span className="text-emerald-600 text-[11px] font-mono">({latencyMs}ms)</span>
          )}
          {health?.version && (
            <span className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[10px] font-mono">
              v{health.version}
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Recheck backend health"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
        </button>
      </div>
    );
  }

  if (state === 'connecting') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-800 shadow-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
        <span className="font-medium">Connecting to Backend...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs text-rose-800 shadow-xs">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        <span className="font-medium">Backend Unavailable</span>
      </div>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        title="Retry connection"
        className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors flex items-center gap-1 border border-slate-300"
      >
        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
        Retry
      </button>
    </div>
  );
};
