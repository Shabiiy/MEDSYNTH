import React from 'react';
import { ConnectionBadge } from './ConnectionBadge';
import type { ConnectionState, HealthResponse } from '../types/api';
import type { NavigationTab } from '../types/navigation';
import { GraduationCap } from 'lucide-react';

interface TopNavbarProps {
  activeTab: NavigationTab;
  connectionState: ConnectionState;
  health: HealthResponse | null;
  latencyMs: number | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const TAB_TITLES: Record<NavigationTab, { title: string; subtitle: string }> = {
  'overview': {
    title: 'Research Overview',
    subtitle: 'High-level synthesis telemetry, system status, and active operations',
  },
  'dataset-laboratory': {
    title: 'Dataset Laboratory',
    subtitle: 'Seed data ingestion, DICOM/X-ray pre-processing, and EHR feature encoding',
  },
  'synthetic-generation': {
    title: 'Synthetic Generation Engine',
    subtitle: 'Generative Adversarial Networks (MedGAN/CycleGAN) and Latent Diffusion synthesis',
  },
  'model-training': {
    title: 'Model Training & GPU Compute',
    subtitle: 'Adversarial training pipelines, optimizer tuning, and RTX GPU acceleration',
  },
  'evaluation-validation': {
    title: 'Evaluation & Statistical Validation',
    subtitle: 'Fidelity assessment using FID, SSIM, and Kolmogorov-Smirnov (KS) tests',
  },
  'privacy-analysis': {
    title: 'Privacy & Differential Privacy Auditing',
    subtitle: 'Mathematical privacy guarantees (DP), re-identification risk, and leakage prevention',
  },
  'generated-datasets': {
    title: 'Generated Datasets Library',
    subtitle: 'Exportable synthetic cohorts for research experimentation and model augmentation',
  },
  'reports': {
    title: 'Clinical & Technical Reports',
    subtitle: 'Comprehensive audit reports, distribution drift analysis, and compliance verification',
  },
  'settings': {
    title: 'Framework Settings',
    subtitle: 'Local backend endpoint, GPU runtime preferences, and storage paths',
  },
};

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  connectionState,
  health,
  latencyMs,
  onRefresh,
  isRefreshing,
}) => {
  const current = TAB_TITLES[activeTab] || {
    title: 'MedSynth Framework',
    subtitle: 'Clinical Generative AI Research Platform',
  };

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0 shadow-xs">
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight">{current.title}</h1>
        <p className="text-xs text-slate-500 hidden sm:block">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Academic Project Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs border border-slate-200">
          <GraduationCap className="w-3.5 h-3.5 text-slate-600" />
          <span className="font-medium">VTU AIML Project</span>
        </div>

        {/* Live Backend Connection Badge */}
        <ConnectionBadge
          state={connectionState}
          health={health}
          latencyMs={latencyMs}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
      </div>
    </header>
  );
};
