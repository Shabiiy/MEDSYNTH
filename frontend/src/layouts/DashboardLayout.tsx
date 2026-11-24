import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import type { NavigationTab } from '../types/navigation';
import type { ConnectionState, HealthResponse } from '../types/api';

interface DashboardLayoutProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  connectionState: ConnectionState;
  health: HealthResponse | null;
  latencyMs: number | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeTab,
  onSelectTab,
  connectionState,
  health,
  latencyMs,
  onRefresh,
  isRefreshing,
  children,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        connectionState={connectionState}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <TopNavbar
          activeTab={activeTab}
          connectionState={connectionState}
          health={health}
          latencyMs={latencyMs}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
