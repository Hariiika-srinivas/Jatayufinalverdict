/**
 * JATAYU 2.0 — Disaster Analysis & Predictive Risk HUD Component
 * Displays verified flood statistics, predictive early warning indicators,
 * virtual drone reconnaissance findings, and export links for genuine GeoTIFFs and mission reports.
 */

import React from 'react';
import { 
  Building2, Waves, AlertTriangle, ShieldCheck, Download, 
  FileJson, Compass, Clock, Radio, Navigation, 
  Info, Bell, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';
import { AnalysisRunResult } from '../types/disaster';
import { 
  PredictiveRiskAssessment, DroneFlightStatus, DroneReconnaissanceResult 
} from '../types/predictive';

interface AnalysisHUDProps {
  // Post-Disaster props
  analysis: AnalysisRunResult | null;
  onDownloadGeoTiff: () => void;
  onDownloadGeoJson: () => void;
  onDownloadReport: () => void;

  // Predictive Risk & Drone props
  activeTab: 'post_disaster' | 'predictive_monitor';
  predictiveAssessment: PredictiveRiskAssessment | null;
  droneStatus: DroneFlightStatus;
  droneReconResult: DroneReconnaissanceResult | null;
  activationThreshold: number;
  onOpenPredictiveAudit: () => void;
}

export const AnalysisHUD: React.FC<AnalysisHUDProps> = ({
  analysis,
  onDownloadGeoTiff,
  onDownloadGeoJson,
  onDownloadReport,
  activeTab,
  predictiveAssessment,
  droneStatus,
  droneReconResult,
  activationThreshold,
  onOpenPredictiveAudit
}) => {
  // Check if we should render Predictive Risk view
  if (activeTab === 'predictive_monitor' || (!analysis && predictiveAssessment)) {
    const assessment = predictiveAssessment;
    if (!assessment) {
      return (
        <div className="w-full lg:w-96 flex-shrink-0 flex flex-col items-center justify-center p-6 bg-slate-950/70 border-l border-slate-800/80 text-center font-mono">
          <Radio className="w-8 h-8 text-cyan-400 animate-pulse mb-2" />
          <h3 className="text-sm font-bold text-slate-300 uppercase">Synchronizing Telemetry</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs font-sans">
            Click "Sync Live Risk Assessment" to evaluate real-time atmospheric, terrain and infrastructure data.
          </p>
        </div>
      );
    }

    const isThresholdCrossed = assessment.riskScore >= activationThreshold;

    const riskColor = 
      assessment.riskLevel === 'CRITICAL' ? 'text-red-400 bg-red-950/40 border-red-800/80' :
      assessment.riskLevel === 'HIGH' ? 'text-amber-400 bg-amber-950/40 border-amber-800/80' :
      assessment.riskLevel === 'MODERATE' ? 'text-blue-400 bg-blue-950/40 border-blue-800/80' :
      'text-emerald-400 bg-emerald-950/40 border-emerald-800/80';

    return (
      <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-3.5 p-3.5 bg-slate-950/70 border-l border-slate-800/80 overflow-y-auto font-mono text-xs">
        {/* Early Warning Trigger Banner */}
        {isThresholdCrossed && (
          <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-700/80 text-red-200 flex items-start gap-2 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse">
            <Bell className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[11px] uppercase tracking-wide">
                Demo Early Warning Alert Dispatched
              </div>
              <div className="text-[10px] text-red-300/90 font-sans mt-0.5 leading-tight">
                Risk ({assessment.riskScore}%) &ge; Demo Threshold ({activationThreshold}%). Virtual Drone autonomously deployed.
              </div>
            </div>
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/80 pb-2">
          <span className="uppercase tracking-wider font-semibold text-slate-300">
            Predictive Risk Monitor
          </span>
          <span className="text-cyan-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Obs: {new Date(assessment.sources[0]?.observationTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* 4-Card Metric Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Risk Score */}
          <div className={`p-2.5 rounded-lg border space-y-0.5 ${riskColor}`}>
            <div className="text-[10px] uppercase font-semibold flex items-center gap-1">
              <Radio className="w-3 h-3" />
              <span>Risk Index</span>
            </div>
            <div className="text-xl font-bold">
              {assessment.riskScore}<span className="text-xs font-normal">/100</span>
            </div>
            <div className="text-[9px] uppercase font-bold tracking-wider">
              {assessment.riskLevel} SEVERITY
            </div>
          </div>

          {/* Virtual Drone Status */}
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 space-y-0.5">
            <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-cyan-400" />
              <span>Virtual Drone</span>
            </div>
            <div className={`text-base font-bold uppercase truncate ${
              droneStatus === 'SIMULATING' ? 'text-cyan-300 animate-pulse' :
              droneStatus === 'COMPLETED' ? 'text-emerald-400' :
              'text-slate-200'
            }`}>
              {droneStatus}
            </div>
            <div className="text-[9px] text-slate-500 font-sans">
              {droneStatus === 'SIMULATING' ? 'Survey in progress' : 'Autonomous route ready'}
            </div>
          </div>

          {/* Rainfall Indicator */}
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 space-y-0.5">
            <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
              <Waves className="w-3 h-3 text-cyan-400" />
              <span>Precipitation</span>
            </div>
            <div className="text-base font-bold text-cyan-300">
              {assessment.environmental.rainfall24hMm} <span className="text-xs font-normal">mm</span>
            </div>
            <div className="text-[9px] text-slate-500 font-sans">
              +{assessment.environmental.forecastRainfall48hMm}mm 48h forecast
            </div>
          </div>

          {/* Terrain / Soil Saturation */}
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 space-y-0.5">
            <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Soil & Topo</span>
            </div>
            <div className="text-base font-bold text-slate-200">
              {assessment.environmental.soilSaturationPct}% <span className="text-xs font-normal">sat</span>
            </div>
            <div className="text-[9px] text-slate-500 font-sans">
              {assessment.terrain.elevationM}m • {assessment.terrain.slopeDegrees}° slope
            </div>
          </div>
        </div>

        {/* Primary Contributing Factors (Requirement 6) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold uppercase tracking-wider">
            <span>Key Vulnerability Factors</span>
            <span className="text-[10px] text-slate-400">Normalized</span>
          </div>

          <div className="space-y-1">
            {assessment.contributingFactors.slice(0, 3).map((factor, idx) => (
              <div 
                key={idx}
                className="p-2 rounded border border-slate-800 bg-slate-900/40 text-[11px] space-y-0.5"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200 truncate pr-2">{factor.name}</span>
                  <span className="text-cyan-400 font-bold">{factor.normalizedContribution}/100</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans leading-tight">
                  {factor.impactDescription}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Virtual Drone Reconnaissance Findings (if completed) */}
        {droneReconResult && (
          <div className="space-y-1.5 p-2.5 rounded-lg border border-cyan-900/60 bg-cyan-950/20">
            <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
              <span className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Drone Reconnaissance Findings
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-900/70 text-cyan-200">
                {droneReconResult.findings.length} Zones
              </span>
            </div>

            <div className="space-y-1 text-[10px] text-slate-300 font-sans">
              {droneReconResult.findings.map((f) => (
                <div key={f.id} className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="font-semibold text-slate-200">{f.title}</div>
                  <div className="text-slate-400 text-[9px] mt-0.5">{f.description}</div>
                  <div className="text-cyan-400 text-[9px] mt-0.5 font-mono">Action: {f.recommendedAction}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Recommended Action (Requirement 6) */}
        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 space-y-1">
          <div className="text-slate-300 font-semibold text-[11px] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Next Recommended Action
          </div>
          <p className="text-[10px] font-sans text-slate-300 leading-relaxed">
            {assessment.recommendedActions[0] || 'Maintain sensor watch.'}
          </p>
        </div>

        {/* Detailed Factor Breakdown & Audit Log Button */}
        <div className="mt-auto pt-2 border-t border-slate-800">
          <button
            onClick={onOpenPredictiveAudit}
            className="w-full p-2.5 rounded-lg border border-cyan-800/60 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 transition flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-xs">View Data Sources & Audit Log</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition" />
          </button>
        </div>
      </div>
    );
  }

  // POST-DISASTER HUD (PRESERVED WORKFLOW)
  if (!analysis) {
    return (
      <div className="w-full lg:w-96 flex-shrink-0 flex flex-col items-center justify-center p-6 bg-slate-950/70 border-l border-slate-800/80 text-center font-mono">
        <Waves className="w-10 h-10 text-slate-600 mb-2" />
        <h3 className="text-sm font-bold text-slate-300 uppercase">Awaiting Analysis</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs font-sans">
          Select an official benchmark dataset or upload a GeoTIFF to execute Prithvi flood segmentation.
        </p>
      </div>
    );
  }

  const { floodAnalysis, buildingAnalysis, exposureAnalysis, dataset, executionTimeMs } = analysis;

  const totalBuildings = buildingAnalysis?.totalDetected || 0;
  const exposedBuildings = exposureAnalysis?.floodExposedBuildings || 0;
  const floodedKm2 = floodAnalysis?.floodedAreaKm2 || 0;
  const floodedHectares = floodAnalysis?.floodedAreaHectares || 0;
  const priorityLevel = exposureAnalysis?.rescuePriorityLevel || 'STANDBY';

  const priorityColor = 
    priorityLevel === 'CRITICAL' ? 'text-red-400 bg-red-950/40 border-red-800/80' :
    priorityLevel === 'HIGH' ? 'text-amber-400 bg-amber-950/40 border-amber-800/80' :
    priorityLevel === 'MODERATE' ? 'text-blue-400 bg-blue-950/40 border-blue-800/80' :
    'text-emerald-400 bg-emerald-950/40 border-emerald-800/80';

  return (
    <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-3.5 p-3.5 bg-slate-950/70 border-l border-slate-800/80 overflow-y-auto font-mono text-xs">
      {/* Top Banner with Execution Time */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/80 pb-2">
        <span className="uppercase tracking-wider font-semibold text-slate-300">
          Post-Disaster Recon HUD
        </span>
        <span className="text-cyan-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {executionTimeMs}ms execution
        </span>
      </div>

      {/* Primary Metric Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Total Buildings */}
        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Structures</span>
          </div>
          <div className="text-xl font-bold text-slate-100">
            {totalBuildings}
          </div>
          <div className="text-[10px] text-slate-500 font-sans">Optical footprint</div>
        </div>

        {/* Flood Exposed Buildings */}
        <div className="p-2.5 rounded-lg border border-red-900/40 bg-red-950/20 space-y-0.5">
          <div className="flex items-center gap-1.5 text-red-300 text-[10px] uppercase">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Inundated</span>
          </div>
          <div className="text-xl font-bold text-red-400">
            {exposedBuildings}
          </div>
          <div className="text-[10px] text-red-300/80 font-sans">
            {totalBuildings > 0 ? `${Math.round((exposedBuildings / totalBuildings) * 100)}% exposure` : '0%'}
          </div>
        </div>

        {/* Flooded Area */}
        <div className="p-2.5 rounded-lg border border-cyan-900/40 bg-cyan-950/20 space-y-0.5">
          <div className="flex items-center gap-1.5 text-cyan-300 text-[10px] uppercase">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>Flooded Area</span>
          </div>
          <div className="text-xl font-bold text-cyan-300">
            {floodedKm2} <span className="text-xs font-normal text-cyan-400">km²</span>
          </div>
          <div className="text-[10px] text-cyan-400/80 font-sans">
            {floodedHectares} hectares
          </div>
        </div>

        {/* Rescue Priority */}
        <div className={`p-2.5 rounded-lg border space-y-0.5 ${priorityColor}`}>
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Priority</span>
          </div>
          <div className="text-lg font-bold">
            {priorityLevel}
          </div>
          <div className="text-[10px] opacity-80 font-sans">Spatial criteria</div>
        </div>
      </div>

      {/* Model Telemetry */}
      <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/30 space-y-1 text-[10px]">
        <div className="text-slate-300 font-semibold text-[11px] flex items-center justify-between border-b border-slate-800 pb-1">
          <span>Model Telemetry</span>
          <span className="text-cyan-400 font-normal">IBM-NASA Prithvi</span>
        </div>
        <div className="space-y-0.5 text-slate-400">
          <div className="flex justify-between">
            <span>Checkpoint:</span>
            <span className="text-slate-200 truncate">Prithvi-EO-V2-300M</span>
          </div>
          <div className="flex justify-between">
            <span>Bands Used:</span>
            <span className="text-slate-200">[B2, B3, B4, B8A, B11, B12]</span>
          </div>
          <div className="flex justify-between">
            <span>Damage Rating:</span>
            <span className="text-amber-400 font-sans">Not assessed (requires damage model)</span>
          </div>
        </div>
      </div>

      {/* Export Hub */}
      <div className="mt-auto space-y-1.5 pt-2 border-t border-slate-800">
        <div className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
          Export Mission Data
        </div>

        <div className="grid grid-cols-1 gap-1 text-xs">
          <button
            onClick={onDownloadGeoTiff}
            className="p-2 rounded border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 transition flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Prithvi Flood GeoTIFF</span>
            </div>
            <span className="text-[10px] text-slate-500">.TIF</span>
          </button>

          <button
            onClick={onDownloadGeoJson}
            className="p-2 rounded border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-emerald-300 transition flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Georeferenced Polygons</span>
            </div>
            <span className="text-[10px] text-slate-500">.GEOJSON</span>
          </button>

          <button
            onClick={onDownloadReport}
            className="p-2 rounded border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-blue-300 transition flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileJson className="w-3.5 h-3.5 text-blue-400" />
              <span>Disaster Analysis Report</span>
            </div>
            <span className="text-[10px] text-slate-500">.JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
