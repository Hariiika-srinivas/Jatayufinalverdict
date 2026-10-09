/**
 * JATAYU 2.0 — Dataset Upload & Predictive Risk Controls Component
 * Preserves the existing post-disaster workflow while integrating the compact Predictive Risk Monitor.
 */

import React, { useRef, useState } from 'react';
import { 
  Upload, FileCheck2, AlertCircle, Sparkles, Layers, 
  Satellite, Play, ChevronRight, Radio, Navigation, 
  ShieldAlert, RefreshCw, Sliders, CheckCircle2, Shield
} from 'lucide-react';
import { DatasetMetadata, PipelineMode } from '../types/disaster';
import { SAMPLE_DATASETS, SampleDatasetEntry } from '../services/sampleData';
import { 
  MONITORING_REGIONS, MonitoringRegionPreset 
} from '../services/predictiveRiskEngine';
import { HazardType, PredictiveRiskAssessment, DroneFlightStatus } from '../types/predictive';

interface DatasetUploadPanelProps {
  // Existing Post-Disaster props
  currentDataset: DatasetMetadata | null;
  onDatasetSelect: (file: File) => Promise<void>;
  onSampleSelect: (sample: SampleDatasetEntry) => Promise<void>;
  selectedMode: PipelineMode;
  onModeChange: (mode: PipelineMode) => void;
  onRunInference: () => void;
  isProcessing: boolean;
  progressStage: string;
  progressPercent: number;
  confidenceThreshold: number;
  onConfidenceChange: (val: number) => void;

  // New Predictive Risk & Virtual Drone props
  activeTab: 'post_disaster' | 'predictive_monitor';
  onTabChange: (tab: 'post_disaster' | 'predictive_monitor') => void;
  selectedRegion: MonitoringRegionPreset;
  onRegionChange: (region: MonitoringRegionPreset) => void;
  selectedHazard: HazardType;
  onHazardChange: (hazard: HazardType) => void;
  activationThreshold: number;
  onThresholdChange: (threshold: number) => void;
  isAutoTriggerArmed: boolean;
  onToggleAutoTrigger: () => void;
  onEvaluatePredictiveRisk: () => void;
  onManualTriggerDrone: () => void;
  predictiveAssessment: PredictiveRiskAssessment | null;
  droneStatus: DroneFlightStatus;
  isPredictiveEvaluating: boolean;
}

export const DatasetUploadPanel: React.FC<DatasetUploadPanelProps> = ({
  currentDataset,
  onDatasetSelect,
  onSampleSelect,
  selectedMode,
  onModeChange,
  onRunInference,
  isProcessing,
  progressStage,
  progressPercent,
  confidenceThreshold,
  onConfidenceChange,

  activeTab,
  onTabChange,
  selectedRegion,
  onRegionChange,
  selectedHazard,
  onHazardChange,
  activationThreshold,
  onThresholdChange,
  isAutoTriggerArmed,
  onToggleAutoTrigger,
  onEvaluatePredictiveRisk,
  onManualTriggerDrone,
  predictiveAssessment,
  droneStatus,
  isPredictiveEvaluating
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onDatasetSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onDatasetSelect(e.dataTransfer.files[0]);
    }
  };

  const isPrithviDisabled = currentDataset && !currentDataset.isValidForPrithvi;

  return (
    <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-3.5 p-3.5 bg-slate-950/70 border-r border-slate-800/80 overflow-y-auto">
      {/* Workflow Mode Tabs (Compact Pill Selector) */}
      <div className="flex rounded-lg bg-slate-900/90 p-1 border border-slate-800 font-mono text-xs">
        <button
          onClick={() => onTabChange('post_disaster')}
          className={`flex-1 py-1.5 px-2 rounded-md font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'post_disaster'
              ? 'bg-slate-800 text-slate-100 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Satellite className="w-3.5 h-3.5 text-cyan-400" />
          <span>Post-Disaster Recon</span>
        </button>

        <button
          onClick={() => onTabChange('predictive_monitor')}
          className={`flex-1 py-1.5 px-2 rounded-md font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'predictive_monitor'
              ? 'bg-cyan-950 border border-cyan-700/70 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 hover:text-cyan-300'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Predictive Risk</span>
        </button>
      </div>

      {/* TAB 1: PREDICTIVE RISK MONITOR */}
      {activeTab === 'predictive_monitor' && (
        <div className="flex flex-col gap-3 font-mono text-xs">
          {/* Monitoring Region Preset Selector */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center justify-between">
              <span>Monitoring Region</span>
              <span className="text-[10px] text-cyan-400 font-normal">Copernicus / DEM</span>
            </label>
            <div className="space-y-1">
              {MONITORING_REGIONS.map((region) => (
                <button
                  key={region.id}
                  onClick={() => onRegionChange(region)}
                  className={`w-full p-2 rounded-md border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                    selectedRegion.id === region.id
                      ? 'border-cyan-500/80 bg-cyan-950/40 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold text-[11px] truncate text-slate-200">
                      {region.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {region.coordinates[0].toFixed(2)}°N, {region.coordinates[1].toFixed(2)}°E • {region.drainageType.replace('_', ' ')}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Hazard Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
              Hazard Vulnerability Type
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['flood', 'landslide', 'infrastructure_collapse'] as HazardType[]).map((h) => (
                <button
                  key={h}
                  onClick={() => onHazardChange(h)}
                  className={`py-1.5 px-1 rounded border text-[10px] font-semibold uppercase text-center transition cursor-pointer truncate ${
                    selectedHazard === h
                      ? 'border-cyan-500 bg-cyan-950 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {h === 'infrastructure_collapse' ? 'Infra / Road' : h}
                </button>
              ))}
            </div>
          </div>

          {/* Autonomous Drone Activation Threshold Slider */}
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 space-y-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-[11px] font-semibold">Auto-Drone Trigger Threshold:</span>
              <span className="text-amber-400 font-bold px-1.5 py-0.5 rounded bg-slate-800 text-[11px]">
                {activationThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="90"
              step="5"
              value={activationThreshold}
              onChange={(e) => onThresholdChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>40% (High Alert)</span>
              <span className="text-slate-400 font-semibold">Default: 65% (Demo)</span>
              <span>90% (Extreme)</span>
            </div>

            {/* Auto-Trigger Armed Switch */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px]">
              <span className="text-slate-400">Autonomous Deployment:</span>
              <button
                onClick={onToggleAutoTrigger}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                  isAutoTriggerArmed
                    ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isAutoTriggerArmed ? 'Armed' : 'Disarmed'}
              </button>
            </div>
          </div>

          {/* Live Data Freshness & Status Card */}
          {predictiveAssessment && (
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 space-y-1 text-[10px]">
              <div className="flex justify-between text-slate-400">
                <span>Weather Observation:</span>
                <span className="text-slate-200">
                  {new Date(predictiveAssessment.sources[0]?.observationTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Open-Meteo)
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Elevation Model:</span>
                <span className="text-slate-200">Copernicus DEM 30m GLO</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Road Pavement Status:</span>
                <span className={predictiveAssessment.infrastructure.reportedAsphaltDegradation ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                  {predictiveAssessment.infrastructure.reportedAsphaltDegradation ? 'Degradation Flagged' : 'Nominal'}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons: Evaluate Live Risk & Manual Drone Launch */}
          <div className="space-y-2 pt-1">
            <button
              onClick={onEvaluatePredictiveRisk}
              disabled={isPredictiveEvaluating}
              className="w-full py-2.5 px-3 rounded-lg font-mono text-xs uppercase tracking-wider font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 transition flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPredictiveEvaluating ? 'animate-spin' : ''}`} />
              <span>{isPredictiveEvaluating ? 'Evaluating Multi-Source Data...' : 'Sync Live Risk Assessment'}</span>
            </button>

            <button
              onClick={onManualTriggerDrone}
              disabled={droneStatus === 'SIMULATING'}
              className="w-full py-2.5 px-3 rounded-lg font-mono text-xs uppercase tracking-wider font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            >
              <Navigation className="w-3.5 h-3.5 fill-current" />
              <span>Launch Virtual Drone (Manual)</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: POST-DISASTER RECONNAISSANCE (PRESERVED WORKFLOW) */}
      {activeTab === 'post_disaster' && (
        <div className="flex flex-col gap-3 font-mono text-xs">
          {/* Upload Dropzone */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                Dataset Upload
              </label>
              <span className="text-[10px] text-slate-400">GeoTIFF / Multispectral</span>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-950/30'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".tif,.tiff,.png,.jpg,.jpeg"
                className="hidden"
              />
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-200">
                    Drop multispectral GeoTIFF or high-res image
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Supports 6/13-band Sentinel-2 (.tif) or Optical RGB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Official Benchmark Datasets */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center justify-between">
              <span>Official Benchmarks</span>
              <span className="text-[10px] text-cyan-400 font-normal">Sen1Floods11</span>
            </label>
            <div className="grid grid-cols-1 gap-1">
              {SAMPLE_DATASETS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onSampleSelect(sample)}
                  className={`p-2 rounded-md border text-left text-xs transition flex items-center justify-between cursor-pointer ${
                    currentDataset?.fileName === sample.fileName
                      ? 'border-cyan-500/80 bg-cyan-950/40 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold text-[11px] truncate text-slate-200">
                      {sample.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                      <span>{sample.bandCount} Bands ({sample.bandCount >= 6 ? 'Sentinel-2' : 'RGB'})</span>
                      <span>•</span>
                      <span>{sample.dimensions.width}x{sample.dimensions.height}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Current Dataset Metadata & Format Validation Badge */}
          {currentDataset && (
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400 text-[10px]">Loaded Dataset</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  {currentDataset.format}
                </span>
              </div>

              <div className="text-[11px] text-slate-200 font-semibold truncate">
                {currentDataset.fileName}
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400">
                <div>
                  <span className="text-slate-500">Bands: </span>
                  <span className="text-slate-300 font-semibold">{currentDataset.bandCount} Channels</span>
                </div>
                <div>
                  <span className="text-slate-500">Dimensions: </span>
                  <span className="text-slate-300">{currentDataset.dimensions.width}×{currentDataset.dimensions.height}</span>
                </div>
              </div>

              <div className="pt-1">
                {currentDataset.isValidForPrithvi ? (
                  <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[10px] flex items-start gap-1">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Valid 6/13-band Sentinel-2 array for Prithvi EO 2.0.</span>
                  </div>
                ) : (
                  <div className="p-1.5 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[10px] flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>RGB imagery cannot run on Prithvi. Use Building pipeline.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pipeline Selection */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
              Inference Pipeline
            </label>

            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={() => onModeChange('combined_exposure')}
                className={`p-2 rounded-md border text-left transition cursor-pointer flex items-center gap-2 ${
                  selectedMode === 'combined_exposure'
                    ? 'border-blue-500 bg-blue-950/30 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                    : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-slate-200 text-[11px]">Combined Disaster Overlay</div>
                  <div className="text-[9px] text-slate-400">Prithvi Flood Mask + Building Footprints</div>
                </div>
              </button>
            </div>
          </div>

          {/* Run Inference Action Button */}
          <div className="pt-2">
            <button
              onClick={onRunInference}
              disabled={isProcessing || !currentDataset}
              className={`w-full py-3 px-4 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                isProcessing || !currentDataset
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Running Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Post-Disaster Analysis</span>
                </>
              )}
            </button>

            {isProcessing && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span className="truncate pr-2">{progressStage}</span>
                  <span className="text-cyan-400 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
