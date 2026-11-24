import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { DatasetLaboratoryPage } from './pages/DatasetLaboratoryPage';
import { SyntheticGenerationPage } from './pages/SyntheticGenerationPage';
import { ModelTrainingPage } from './pages/ModelTrainingPage';
import { EvaluationValidationPage } from './pages/EvaluationValidationPage';
import { PrivacyAnalysisPage } from './pages/PrivacyAnalysisPage';
import { GeneratedDatasetsPage } from './pages/GeneratedDatasetsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import type { NavigationTab } from './types/navigation';
import type { ConnectionState, DashboardSummaryResponse, HealthResponse } from './types/api';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);

  const fetchTelemetry = useCallback(async () => {
    setIsRefreshing(true);

    // 1. Check health
    const healthResult = await api.getHealth();
    setLatencyMs(healthResult.latencyMs);

    if (healthResult.data) {
      setHealth(healthResult.data);
      setConnectionState('connected');
    } else {
      setHealth(null);
      setConnectionState('unavailable');
    }

    // 2. Fetch summary if connected or attempting
    try {
      const summaryResult = await api.getDashboardSummary();
      if (summaryResult.data) {
        setSummary(summaryResult.data);
      }
    } catch {
      // Keep previous summary or null if unavailable
    } finally {
      setIsLoadingSummary(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();

    // Recheck health and summary every 30 seconds
    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewPage
            summary={summary}
            health={health}
            connectionState={connectionState}
            onNavigate={setActiveTab}
            isLoading={isLoadingSummary}
          />
        );
      case 'dataset-laboratory':
        return <DatasetLaboratoryPage />;
      case 'synthetic-generation':
        return <SyntheticGenerationPage />;
      case 'model-training':
        return <ModelTrainingPage />;
      case 'evaluation-validation':
        return <EvaluationValidationPage />;
      case 'privacy-analysis':
        return <PrivacyAnalysisPage />;
      case 'generated-datasets':
        return <GeneratedDatasetsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return (
          <SettingsPage
            connectionState={connectionState}
            health={health}
            onRefresh={fetchTelemetry}
            isRefreshing={isRefreshing}
          />
        );
      default:
        return (
          <OverviewPage
            summary={summary}
            health={health}
            connectionState={connectionState}
            onNavigate={setActiveTab}
            isLoading={isLoadingSummary}
          />
        );
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      connectionState={connectionState}
      health={health}
      latencyMs={latencyMs}
      onRefresh={fetchTelemetry}
      isRefreshing={isRefreshing}
    >
      {renderActiveView()}
    </DashboardLayout>
  );
}

export default App;
