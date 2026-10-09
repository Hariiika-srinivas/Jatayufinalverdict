/**
 * JATAYU — Backend Deployment & Vercel Configuration Guide Modal
 */

import React, { useState } from 'react';
import { X, Server, Copy, Check, Terminal, ExternalLink, Cloud, Cpu } from 'lucide-react';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const cloudRunCmd = `cd backend
# 1. Build Docker image with Google Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/jatayu-backend .

# 2. Deploy to Cloud Run with 4GB RAM & 2 vCPUs
gcloud run deploy jatayu-backend \\
  --image gcr.io/YOUR_PROJECT_ID/jatayu-backend \\
  --platform managed \\
  --region us-central1 \\
  --memory 4Gi \\
  --cpu 2 \\
  --timeout 300 \\
  --allow-unauthenticated`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-mono select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Backend Deployment & Vercel Connection
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Connecting Vercel Frontend to Persistent Python Inference Server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Explanation */}
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/50 space-y-1.5 font-sans leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-200 font-mono text-xs flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-cyan-400" />
              Why Vercel Requires an External Inference Service
            </span>
            <p>
              Vercel Serverless Functions have a 50MB file size limit and cannot run heavy compiled C/C++ geospatial dependencies (<code className="text-slate-300 font-mono">GDAL</code>, <code className="text-slate-300 font-mono">rasterio</code>) or large foundation models (<code className="text-slate-300 font-mono">Prithvi-EO-V2</code> is 1.28 GB).
            </p>
            <p>
              The frontend is optimized to run on Vercel while routing heavy raster processing to the containerized Python backend in <code className="text-cyan-400 font-mono">/backend</code>.
            </p>
          </div>

          {/* Step 1: Cloud Run */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Step 1: Deploy Python Backend (Google Cloud Run / Docker)
              </span>
              <button
                onClick={() => copyCode(cloudRunCmd, 1)}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
              >
                {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedIndex === 1 ? 'Copied' : 'Copy Commands'}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
              {cloudRunCmd}
            </pre>
          </div>

          {/* Step 2: Vercel Env Var */}
          <div className="space-y-2">
            <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              Step 2: Set Vercel Environment Variable
            </span>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <p className="font-sans text-slate-400 text-[11px]">
                In your Vercel Project Dashboard for <strong className="text-slate-200 font-mono">jatayuu-jet</strong>:
              </p>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between font-mono">
                <div>
                  <span className="text-slate-500">Key: </span>
                  <span className="text-cyan-300 font-bold">VITE_INFERENCE_API_URL</span>
                </div>
                <div>
                  <span className="text-slate-500">Value: </span>
                  <span className="text-slate-300">https://jatayu-backend-xyz.run.app</span>
                </div>
              </div>
              <p className="font-sans text-slate-500 text-[10px]">
                Once saved and redeployed, the frontend will automatically connect to your live Python Prithvi inference engine.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-semibold cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
