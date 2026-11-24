import React from 'react';
import {
  Database,
  Sparkles,
  Cpu,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Server,
  Layers,
  FilePlus2,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { EmptyState } from '../components/EmptyState';
import type { DashboardSummaryResponse, HealthResponse, ConnectionState } from '../types/api';
import type { NavigationTab } from '../types/navigation';

interface OverviewPageProps {
  summary: DashboardSummaryResponse | null;
  health: HealthResponse | null;
  connectionState: ConnectionState;
  onNavigate: (tab: NavigationTab) => void;
  isLoading: boolean;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  summary,
  health,
  connectionState,
  onNavigate,
  isLoading,
}) => {
  return (
    <div className="space-y-6">
      {/* Project Introduction Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-6 sm:p-7 border border-slate-800 shadow-sm">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy-Preserving Healthcare AI Framework</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            MedSynth: Synthetic Medical Data Augmentation Engine
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            A research platform tackling clinical data scarcity and strict privacy walls (HIPAA/GDPR)
            by synthesizing mathematically sound, statistically identical &ldquo;digital twins&rdquo;
            of Electronic Health Records (EHR) and diagnostic chest X-rays using Differential Privacy (DP),
            MedGAN, and Latent Diffusion models.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('dataset-laboratory')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              Upload Seed Dataset
            </button>
            <button
              onClick={() => onNavigate('synthetic-generation')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Start Generation Job
            </button>
          </div>
        </div>

        {/* Subtle decorative geometric background element */}
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
          <Layers className="w-64 h-64 text-teal-300" />
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Seed Datasets"
          value={isLoading ? '...' : (summary?.total_datasets ?? 0)}
          subtitle="Tabular records & chest X-ray cohorts"
          icon={Database}
          emptyNotice="0 datasets ingested into local storage"
        />
        <MetricCard
          title="Synthetic Samples"
          value={isLoading ? '...' : (summary?.total_synthetic_samples ?? 0)}
          subtitle="Generated privacy-safe digital records"
          icon={Sparkles}
          emptyNotice="0 synthetic patients generated"
        />
        <MetricCard
          title="Models Trained"
          value={isLoading ? '...' : (summary?.total_models_trained ?? 0)}
          subtitle="Adversarial generators & diffusion checkpoints"
          icon={Cpu}
          emptyNotice="0 trained models in registry"
        />
        <MetricCard
          title="Active Jobs"
          value={isLoading ? '...' : (summary?.active_training_jobs ?? 0)}
          subtitle="Real-time GPU generation tasks"
          icon={Clock}
          emptyNotice="0 background pipelines running"
        />
      </div>

      {/* Two Column Grid: Pipeline Architecture & System Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Recent Jobs and Roadmap */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Jobs Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Generation & Training Jobs</h3>
                <p className="text-xs text-slate-500">
                  Execution queue for MedGAN tabular synthesis and RoentGen imaging tasks
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                0 Active
              </span>
            </div>

            {summary?.recent_jobs && summary.recent_jobs.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {/* Dynamically rendered jobs if any exist */}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                badge="Execution Queue Ready"
                title="No Synthesis Jobs Recorded Yet"
                description="When you initiate tabular or image synthesis workflows in later steps, real-time adversarial progress, loss curves, and validation metrics will be tracked here."
                actionLabel="Open Synthetic Generation"
                onAction={() => onNavigate('synthetic-generation')}
              />
            )}
          </div>

          {/* Research Pipeline Blueprint (from Phase-I Synopsis) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Framework Methodology Blueprint</h3>
              <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 font-medium">
                Phase-I Specification
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              MedSynth executes a structured 4-phase architecture to resolve the healthcare data privacy paradox:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 inline-flex items-center justify-center text-[10px] font-bold">1</span>
                  Data Ingestion & Preprocessing
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  NIH Chest X-ray and Kaggle EHR ingestion, discrete feature autoencoding, missing-value imputation, and normalization.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 inline-flex items-center justify-center text-[10px] font-bold">2</span>
                  Dual Generative Synthesis
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  MedGAN for discrete clinical variables; Latent Diffusion (RoentGen architecture) for high-resolution diagnostic imaging.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 inline-flex items-center justify-center text-[10px] font-bold">3</span>
                  Differential Privacy Guarantees
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  DP-SGD with bounded mathematical noise injection (ε, δ guarantees) ensuring generative weights never memorize unique patients.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 inline-flex items-center justify-center text-[10px] font-bold">4</span>
                  Clinical Indistinguishability
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Validation through Fréchet Inception Distance (FID), Structural Similarity (SSIM), and Kolmogorov-Smirnov (KS) fidelity tests.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Engine Diagnostics & Quick Actions */}
        <div className="space-y-6">
          {/* Live Engine Diagnostic Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-teal-600" />
                Backend Telemetry
              </h3>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  connectionState === 'connected'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : connectionState === 'connecting'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {connectionState}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Service Status</span>
                <span className="font-medium text-slate-800 flex items-center gap-1">
                  {connectionState === 'connected' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {health?.status ?? 'Offline'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Service Name</span>
                <span className="font-medium text-slate-800">{health?.app_name ?? 'MedSynth API'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Backend Version</span>
                <span className="font-mono text-slate-700">{health?.version ? `v${health.version}` : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Environment</span>
                <span className="font-medium text-slate-800 uppercase text-[11px]">{health?.environment ?? 'development'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Disk Storage Allocated</span>
                <span className="font-mono text-slate-700">
                  {summary ? `${(summary.storage_used_bytes / 1024).toFixed(1)} KB` : '0 KB'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Last Telemetry Sync</span>
                <span className="text-[11px] text-slate-600 font-mono">
                  {summary?.last_updated ? new Date(summary.last_updated).toLocaleTimeString() : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Navigation Panel */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Quick Launch</h3>
            <p className="text-xs text-slate-500 mb-3">Jump into specific research workflows:</p>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('dataset-laboratory')}
                className="w-full text-left p-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200/80 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-teal-600" />
                  <div>
                    <div className="text-xs font-medium text-slate-800">Dataset Laboratory</div>
                    <div className="text-[10px] text-slate-500">Inspect & preprocess medical records</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </button>

              <button
                onClick={() => onNavigate('synthetic-generation')}
                className="w-full text-left p-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200/80 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <div>
                    <div className="text-xs font-medium text-slate-800">Synthetic Generation</div>
                    <div className="text-[10px] text-slate-500">Configure GANs & Diffusion models</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </button>

              <button
                onClick={() => onNavigate('privacy-analysis')}
                className="w-full text-left p-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200/80 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <div>
                    <div className="text-xs font-medium text-slate-800">Privacy Analysis</div>
                    <div className="text-[10px] text-slate-500">Audit DP ε/δ budgets & leakage</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </button>
            </div>
          </div>

          {/* Academic Attribution Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-500 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs">
              <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
              Academic Research Context
            </div>
            <p className="text-[11px] leading-relaxed">
              Developed under Visvesvaraya Technological University (VTU) guidelines for B.E. Artificial Intelligence & Machine Learning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
