import React from 'react';
import { Cpu, Activity, Gauge, Terminal, Play, Pause } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const ModelTrainingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Model Training & GPU Compute</h2>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Phase 3: Optimization
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Adversarial generator/discriminator training and noise-schedule convergence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Start Training
            </button>
            <button
              disabled
              className="px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" /> Stop
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
          Tracks model convergence, generator/discriminator min-max losses, gradient norms, and GPU memory utilization.
          Trained on RTX accelerated hardware utilizing adaptive optimizers (Adam) and Differential Privacy SGD (DP-SGD)
          gradient clipping.
        </p>
      </div>

      {/* Compute Diagnostics Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">GPU Device</span>
            <Gauge className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-sm font-bold text-slate-800">Local CUDA / PyTorch</div>
          <p className="text-xs text-slate-400 mt-1">PyTorch runtime ready for driver detection</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Training Jobs</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-sm font-bold text-slate-800 font-mono">0 Active / 0 Queued</div>
          <p className="text-xs text-slate-400 mt-1">No execution workloads in queue</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Optimizer Status</span>
            <Terminal className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-sm font-bold text-slate-800">Adam (lr=2e-4, β1=0.5)</div>
          <p className="text-xs text-slate-400 mt-1">DP-SGD gradient noise enabled</p>
        </div>
      </div>

      {/* Honest Empty State for Training Jobs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Active Training Pipelines</h3>
        <EmptyState
          icon={Cpu}
          badge="Compute Idle"
          title="No Active Model Training Workloads"
          description="Model training jobs will be initiated here once clinical datasets are ingested in Step 2. Real-time loss curves, learning rate decay, and generator checkpoints will display live."
        />
      </div>
    </div>
  );
};
