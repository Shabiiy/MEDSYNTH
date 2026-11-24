import React from 'react';
import { Settings as SettingsIcon, Server, HardDrive, Terminal, Shield, RefreshCw } from 'lucide-react';
import type { ConnectionState, HealthResponse } from '../types/api';

interface SettingsPageProps {
  connectionState: ConnectionState;
  health: HealthResponse | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  connectionState,
  health,
  onRefresh,
  isRefreshing,
}) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Framework Settings</h2>
            <p className="text-xs text-slate-500">
              API connectivity configuration, local storage directories, and compute runtime parameters
            </p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Backend API Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">FastAPI Backend Endpoint</h3>
            </div>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              title="Test connection"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Active Backend URL</label>
              <input
                type="text"
                readOnly
                value={apiUrl}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800 text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Configured via `VITE_API_URL` environment variable.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-700 block">Connection State</span>
                <span className="text-[11px] text-slate-500">
                  {health ? `Version: ${health.version} (${health.environment})` : 'Offline'}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
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
          </div>
        </div>

        {/* Storage Paths */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <HardDrive className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Local Storage Directories</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium block mb-1">Datasets Storage</span>
              <div className="p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
                backend/storage/datasets/
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-1">Generated Output Archive</span>
              <div className="p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
                backend/storage/generated/
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-1">Trained Checkpoints</span>
              <div className="p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
                backend/storage/models/
              </div>
            </div>
          </div>
        </div>

        {/* Hardware & Runtime */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Terminal className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Execution Runtime</h3>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Python Virtual Environment</span>
              <span className="font-mono text-slate-800">backend/.venv (Python 3.14)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">FastAPI Architecture</span>
              <span className="font-medium text-slate-800">Asynchronous RESTful ASGI</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Frontend Engine</span>
              <span className="font-medium text-slate-800">React 19 + TypeScript + Vite 8</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">CORS Support</span>
              <span className="text-emerald-700 font-medium">Enabled (localhost:5173)</span>
            </div>
          </div>
        </div>

        {/* Project Governance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Academic & Project Specification</h3>
          </div>

          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p>
              <strong>Title:</strong> MedSynth: A Privacy-Preserving Generative Framework for Synthetic Medical Data Augmentation
            </p>
            <p>
              <strong>Specification Reference:</strong> Visvesvaraya Technological University (VTU) Phase-I Synopsis (Projectmain(1).pdf)
            </p>
            <p>
              <strong>Supervision:</strong> Dept. of Artificial Intelligence & Machine Learning, Yenepoya Institute of Technology
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
