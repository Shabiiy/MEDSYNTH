import React from 'react';
import { FolderArchive, Download } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const GeneratedDatasetsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Generated Datasets Library</h2>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Export & Augmentation
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Verified synthetic medical records and augmented clinical cohorts for AI research
              </p>
            </div>
          </div>
          <button
            disabled
            className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Cohort (Step 6)
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
          Synthetic patient cohorts produced by MedSynth can be exported in research-ready formats (CSV, Parquet, DICOM)
          to expand restricted training sets, balance rare conditions, and facilitate collaborative research without legal friction.
        </p>
      </div>

      {/* Cohorts Repository List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Synthetic Cohorts in Repository</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">0 datasets stored</span>
          </div>
        </div>

        <EmptyState
          icon={FolderArchive}
          badge="Repository Empty"
          title="No Synthetic Datasets Generated Yet"
          description="Synthesized tabular tables and X-ray archives will be stored in `backend/storage/generated/` and will appear here with sample previews and distribution metrics."
        />
      </div>
    </div>
  );
};
