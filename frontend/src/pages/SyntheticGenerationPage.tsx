import React from 'react';
import { Sparkles, Brain, Cpu, Sliders, ArrowRight } from 'lucide-react';

export const SyntheticGenerationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Synthetic Generation Engine</h2>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Phase 2: Deep Generative Models
                </span>
              </div>
              <p className="text-xs text-slate-500">
                GANs & Latent Diffusion architectures generating synthetic digital twins
              </p>
            </div>
          </div>
          <button
            disabled
            className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg border border-slate-200 cursor-not-allowed"
          >
            Launch Synthesis Job (Step 3)
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
          MedSynth employs specialized generative model families to circumvent the data privacy paradox. Rather than storing
          or transforming identifiable patient records, our neural networks learn high-dimensional latent representations,
          synthesizing brand-new records that mirror the statistical distribution without copying any real person.
        </p>
      </div>

      {/* Model Architectures Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">MedGAN (Tabular EHR)</h3>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
              Adversarial + Autoencoder
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Designed specifically for multi-label discrete electronic patient records. Combines standard adversarial loss
            with an autoencoder layer to capture discrete distributions (binary diagnoses, medications, procedure codes)
            without mode collapse.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1.5 text-slate-700">
            <div className="font-semibold text-slate-800">Target Modality:</div>
            <div>Structured clinical tables, patient demographics, lab histories, ICU vitals.</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">RoentGen (Latent Diffusion)</h3>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
              Score-Based Diffusion
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Reverses a progressive Gaussian noise process in latent space to synthesize high-resolution, anatomically correct
            chest radiographs. Avoids GAN-specific artifacting and enables conditioning on specific pathologies (e.g. pneumonia, effusion).
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1.5 text-slate-700">
            <div className="font-semibold text-slate-800">Target Modality:</div>
            <div>High-resolution chest X-rays, multi-pathology conditional radiology images.</div>
          </div>
        </div>
      </div>

      {/* Synthesis Configuration Blueprint */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-600" />
          Configurable Hyperparameters (Preview)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Parameters that will be exposed in future implementation steps for synthesis tuning:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="text-[11px] text-slate-500">Latent Dimension</div>
            <div className="font-bold text-slate-800 font-mono">z_dim = 128</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="text-[11px] text-slate-500">Differential Privacy ε</div>
            <div className="font-bold text-slate-800 font-mono">ε ≤ 1.5 (Strict)</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="text-[11px] text-slate-500">Batch Size</div>
            <div className="font-bold text-slate-800 font-mono">batch = 64</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="text-[11px] text-slate-500">Diffusion Timesteps</div>
            <div className="font-bold text-slate-800 font-mono">T = 1000 steps</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Engine is in verified foundation state (Step 1 complete).</span>
          <span className="flex items-center gap-1 text-teal-700 font-medium">
            Awaiting Step 2 dataset ingestion <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
