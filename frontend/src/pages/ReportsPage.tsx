import React from 'react';
import { FileText, FileDown } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Clinical & Technical Reports</h2>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Audit & Compliance
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated statistical verification certificates, privacy audits, and academic exports
              </p>
            </div>
          </div>
          <button
            disabled
            className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5" /> Generate Audit Report (Step 6)
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
          MedSynth auto-compiles clinical validation certificates and differential privacy logs into standardized PDF/Markdown
          reports for institutional review boards (IRB), clinical collaborators, and academic publication submissions.
        </p>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Compiled Research Reports</h3>
        <EmptyState
          icon={FileText}
          badge="Audit Suite Ready"
          title="No Reports Generated Yet"
          description="Reports will compile automatically once evaluation metrics (FID, SSIM, KS) and Differential Privacy budgets (ε, δ) are calculated for active datasets."
        />
      </div>
    </div>
  );
};
