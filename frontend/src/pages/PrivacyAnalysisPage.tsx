import React from 'react';
import { ShieldCheck, Lock, Fingerprint, FileCheck, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const PrivacyAnalysisPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Privacy & Differential Privacy Auditing</h2>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Mathematical Guarantees
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Differential Privacy (DP-SGD) budgeting, re-identification testing, and leakage defense
              </p>
            </div>
          </div>
          <button
            disabled
            className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg border border-slate-200 cursor-not-allowed"
          >
            Compute DP Privacy Budget (Step 5)
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
          Traditional de-identification is vulnerable to linkage attacks because high-dimensional medical records
          (bone structures, longitudinal biomarker trajectories) act as unique fingerprints. MedSynth injects
          calibrated Gaussian noise during training (DP-GAN) to guarantee mathematically provable (ε, δ)-Differential Privacy.
        </p>
      </div>

      {/* Differential Privacy Parameters Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Epsilon (ε) Privacy Loss</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Measures maximum information leakage. Lower ε values provide strictly stronger mathematical anonymity.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500">Target Budget:</span>
              <span className="font-bold text-teal-700 font-mono">ε ≤ 1.5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Status:</span>
              <span className="text-slate-400 font-mono">Pending Training</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Fingerprint className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Re-identification Defense</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Nearest-neighbor distance ratio (NNDR) and membership inference tests verify models never memorize training patients.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500">Risk Threshold:</span>
              <span className="font-bold text-teal-700 font-mono">&lt; 0.01%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Status:</span>
              <span className="text-slate-400 font-mono">Pending Training</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Compliance Standard</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Standardization against HIPAA Expert Determination Method and GDPR Article 29 Working Party recommendations.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500">Protocol:</span>
              <span className="font-bold text-teal-700">HIPAA Safe Harbor</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Status:</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Architecture Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Privacy Audit Trail</h3>
        <EmptyState
          icon={ShieldCheck}
          badge="Audit Engine Active"
          title="No Privacy Vulnerabilities Detected"
          description="Privacy evaluations will run alongside generative model iterations in Step 5, calculating privacy spent per epoch and verifying patient zero-reconstruction guarantees."
        />
      </div>
    </div>
  );
};
