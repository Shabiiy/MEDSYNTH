import React from 'react';
import { BarChart3, Target } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const EvaluationValidationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Evaluation & Statistical Validation</h2>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Phase 4: Clinical Utility
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Rigorous statistical testing and clinical utility benchmarking against real patient data
              </p>
            </div>
          </div>
          <button
            disabled
            className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg border border-slate-200 cursor-not-allowed"
          >
            Run Validation Suite (Step 4)
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
          Unlike generic generative models that solely optimize for visual aesthetics, MedSynth solves the
          &ldquo;Clinical Utility Deficit&rdquo;. We validate that synthetic data achieves statistical fidelity
          and can train downstream diagnostic classifiers to the same clinical accuracy as real records.
        </p>
      </div>

      {/* Metric Framework Blueprint */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">FID Score</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">Imaging</span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Fréchet Inception Distance measures distance between real and synthetic chest X-ray feature maps in deep latent space.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500">Target FID:</span>
              <span className="font-bold text-teal-700 font-mono">&lt; 15.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Current Status:</span>
              <span className="text-slate-400 font-mono">Uncalibrated</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">SSIM Index</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">Imaging</span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Structural Similarity Index assesses anatomical consistency, luminance, and contrast against clinical ground truth.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500">Target SSIM:</span>
              <span className="font-bold text-teal-700 font-mono">&gt; 0.82</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Current Status:</span>
              <span className="text-slate-400 font-mono">Uncalibrated</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">KS-Test (p-value)</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">Tabular</span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Two-sample Kolmogorov-Smirnov test verifies that synthetic patient lab distributions match real clinical values.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500">Target p-value:</span>
              <span className="font-bold text-teal-700 font-mono">&gt; 0.05</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Current Status:</span>
              <span className="text-slate-400 font-mono">Uncalibrated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Queue Empty State */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Comparative Evaluation Matrix</h3>
        <EmptyState
          icon={Target}
          badge="Validation Ready"
          title="No Synthetic Cohorts Evaluated"
          description="Once generative synthesis runs finish in later stages, automated statistical correlation matrices, FID curves, and blinded clinical indistinguishability tests will appear here."
        />
      </div>
    </div>
  );
};
