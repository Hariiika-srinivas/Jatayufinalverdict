/**
 * JATAYU — Technical Architecture & Model Inspector Modal
 */

import React from 'react';
import { X, Cpu, Satellite, Layers, ShieldAlert, CheckCircle2, BookOpen, ExternalLink } from 'lucide-react';

interface ModelInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelInspectorModal: React.FC<ModelInspectorModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-mono select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Geospatial AI Architecture & Verification
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                NASA-IBM Prithvi EO 2.0 Flood Model & Optical Building Pipeline Specifications
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Section 1: Prithvi EO 2.0 Flood Model */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                <Satellite className="w-4 h-4" />
                Prithvi-EO-2.0-300M-TL-Sen1Floods11
              </span>
              <a
                href="https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M-TL-Sen1Floods11"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                Hugging Face Repo <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div>
                <span className="text-slate-500">Checkpoint: </span>
                <span className="text-slate-200">Prithvi-EO-V2-300M-TL-Sen1Floods11.pt (1.28 GB)</span>
              </div>
              <div>
                <span className="text-slate-500">Backbone: </span>
                <span className="text-slate-200">ViT-300M (Temporal-Location Embeddings)</span>
              </div>
              <div>
                <span className="text-slate-500">Decoder: </span>
                <span className="text-slate-200">UperNet (256 channels, 2 classes)</span>
              </div>
              <div>
                <span className="text-slate-500">Input Scale: </span>
                <span className="text-slate-200">constant_scale: 0.0001 (DN to reflectance)</span>
              </div>
            </div>

            {/* Expected Input Bands */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-slate-300 mb-1.5">
                Expected 6 Input Bands (Sentinel-2 L1C):
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[10px] text-center font-bold">
                <div className="p-1 rounded bg-blue-950/70 border border-blue-800/60 text-blue-300">B2 (Blue)</div>
                <div className="p-1 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300">B3 (Green)</div>
                <div className="p-1 rounded bg-red-950/70 border border-red-800/60 text-red-300">B4 (Red)</div>
                <div className="p-1 rounded bg-indigo-950/70 border border-indigo-800/60 text-indigo-300">B8A (Narrow NIR)</div>
                <div className="p-1 rounded bg-amber-950/70 border border-amber-800/60 text-amber-300">B11 (SWIR-1)</div>
                <div className="p-1 rounded bg-rose-950/70 border border-rose-800/60 text-rose-300">B12 (SWIR-2)</div>
              </div>
            </div>

            {/* Class Mapping */}
            <div className="pt-2 border-t border-slate-800 text-[11px]">
              <div className="font-semibold text-slate-300 mb-1">Class Mapping:</div>
              <div className="flex gap-4 text-slate-400">
                <span><strong className="text-slate-200">Class 0:</strong> Non-water / Land</span>
                <span><strong className="text-cyan-400">Class 1:</strong> Flood / Surface Water</span>
                <span><strong className="text-slate-500">Class -1:</strong> No-Data / Cloud</span>
              </div>
            </div>
          </div>

          {/* Section 2: Building Footprint Pipeline & Structural Damage Distinction */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/50 space-y-2">
            <span className="font-bold text-amber-400 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Building Footprint Detection & Damage Distinction
            </span>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Prithvi-EO-2.0 is trained on 10m–30m multispectral satellite imagery for flood delineation. 
              At 10 meters per pixel, residential buildings are sub-pixel and physically cannot be detected.
              JATAYU implements a separate optical building footprint pipeline designed for high-resolution optical imagery.
            </p>

            <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/50 text-amber-300 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Anti-Hallucination Damage Assessment Policy
              </div>
              <p className="font-sans leading-relaxed text-slate-300">
                Neither standard object detection nor flood segmentation provides structural damage ratings without fine-tuned multi-temporal pre/post disaster models (e.g., xBD / xView2 4-tier damage classifications).
                Structural damage is strictly reported as:
              </p>
              <div className="font-mono font-bold text-amber-200 bg-slate-950/80 p-1.5 rounded text-center border border-amber-800/60">
                “Not assessed — compatible damage model required”
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-semibold cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
