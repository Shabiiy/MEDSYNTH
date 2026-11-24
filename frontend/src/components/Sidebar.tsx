import React from 'react';
import {
  LayoutDashboard,
  Database,
  Sparkles,
  Cpu,
  BarChart3,
  ShieldCheck,
  FolderArchive,
  FileText,
  Settings as SettingsIcon,
  Activity,
  HeartPulse,
} from 'lucide-react';
import type { NavigationTab } from '../types/navigation';
import type { ConnectionState } from '../types/api';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  connectionState: ConnectionState;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  section: 'CORE' | 'AI PIPELINE' | 'GOVERNANCE & OUTPUT';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, section: 'CORE' },
  { id: 'dataset-laboratory', label: 'Dataset Laboratory', icon: Database, section: 'CORE' },
  { id: 'synthetic-generation', label: 'Synthetic Generation', icon: Sparkles, section: 'AI PIPELINE' },
  { id: 'model-training', label: 'Model Training', icon: Cpu, section: 'AI PIPELINE' },
  { id: 'evaluation-validation', label: 'Evaluation & Validation', icon: BarChart3, section: 'AI PIPELINE' },
  { id: 'privacy-analysis', label: 'Privacy Analysis', icon: ShieldCheck, section: 'GOVERNANCE & OUTPUT' },
  { id: 'generated-datasets', label: 'Generated Datasets', icon: FolderArchive, section: 'GOVERNANCE & OUTPUT' },
  { id: 'reports', label: 'Reports', icon: FileText, section: 'GOVERNANCE & OUTPUT' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, section: 'GOVERNANCE & OUTPUT' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  connectionState,
}) => {
  const sections: Array<'CORE' | 'AI PIPELINE' | 'GOVERNANCE & OUTPUT'> = [
    'CORE',
    'AI PIPELINE',
    'GOVERNANCE & OUTPUT',
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
          <HeartPulse className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-white tracking-tight">MedSynth</span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
              v0.1
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Clinical Generative AI</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => {
          const items = NAV_ITEMS.filter((item) => item.section === section);
          return (
            <div key={section} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section}
              </div>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-teal-600/20 text-white border border-teal-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom Service Environment Banner */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[11px] font-medium text-slate-200">Engine API</div>
              <div className="text-[10px] text-slate-400 font-mono">127.0.0.1:8000</div>
            </div>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              connectionState === 'connected'
                ? 'bg-emerald-400'
                : connectionState === 'connecting'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
        </div>
      </div>
    </aside>
  );
};
