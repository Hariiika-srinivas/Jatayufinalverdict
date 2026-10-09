/**
 * JATAYU 2.0 — Command Header Component
 * Enhanced with Predictive Risk telemetry, Virtual Drone status indicator, and Audio Alert toggle.
 */

import React from 'react';
import { 
  Shield, Satellite, Cpu, Info, Layers, Radio, 
  Volume2, VolumeX, Navigation, AlertTriangle 
} from 'lucide-react';
import { BackendHealth } from '../types/disaster';
import { PredictiveRiskAssessment, DroneFlightStatus } from '../types/predictive';

interface HeaderProps {
  backendHealth: BackendHealth;
  predictiveAssessment: PredictiveRiskAssessment | null;
  droneStatus: DroneFlightStatus;
  isAudioMuted: boolean;
  onToggleAudioMute: () => void;
  onOpenModelInspector: () => void;
  onOpenDeployGuide: () => void;
  onOpenPredictiveAudit: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  backendHealth,
  predictiveAssessment,
  droneStatus,
  isAudioMuted,
  onToggleAudioMute,
  onOpenModelInspector,
  onOpenDeployGuide,
  onOpenPredictiveAudit
}) => {
  const riskScore = predictiveAssessment?.riskScore ?? null;
  const riskLevel = predictiveAssessment?.riskLevel ?? null;

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-30 select-none">
      {/* Brand & Platform Identity */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-950 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-base lg:text-lg font-bold tracking-wider text-slate-100 font-mono">
              JATAYU 2.0
            </h1>
            <span className="text-[9px] sm:text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold">
              PREDICTIVE + RECON
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 hidden md:block tracking-wide">
            Predictive Pre-Disaster Early Warning & Autonomous Virtual Drone Platform
          </p>
        </div>
      </div>

      {/* Center: Live Predictive Risk & Virtual Drone Badges */}
      <div className="flex items-center gap-2 font-mono text-xs">
        {/* Predictive Risk Badge */}
        {riskScore !== null && (
          <button
            onClick={onOpenPredictiveAudit}
            className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition cursor-pointer ${
              riskLevel === 'CRITICAL' ? 'bg-red-950/60 border-red-800 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
              riskLevel === 'HIGH' ? 'bg-amber-950/60 border-amber-800 text-amber-300' :
              riskLevel === 'MODERATE' ? 'bg-blue-950/60 border-blue-800 text-blue-300' :
              'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            }`}
            title="Click to view Predictive Risk Factor Breakdown and Audit Trail"
          >
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="text-slate-400 hidden lg:inline">Risk:</span>
            <span className="font-bold">{riskScore}/100</span>
            <span className="text-[10px] opacity-80 uppercase hidden sm:inline">({riskLevel})</span>
          </button>
        )}

        {/* Virtual Drone Status Badge */}
        <div 
          onClick={onOpenPredictiveAudit}
          className={`px-2.5 py-1 rounded-md border text-[11px] flex items-center gap-1.5 cursor-pointer transition ${
            droneStatus === 'SIMULATING' || droneStatus === 'TRIGGERED'
              ? 'bg-cyan-950/70 border-cyan-700 text-cyan-300 animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : droneStatus === 'COMPLETED'
              ? 'bg-slate-900 border-slate-700 text-slate-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
          title="Virtual Drone Status: Click to inspect drone reconnaissance log"
        >
          <Navigation className={`w-3 h-3 ${droneStatus === 'SIMULATING' ? 'text-cyan-400 animate-spin' : 'text-slate-400'}`} />
          <span className="text-slate-500 hidden xl:inline">Virtual Drone:</span>
          <span className="font-semibold uppercase">{droneStatus}</span>
        </div>
      </div>

      {/* Telemetry, Actions & Toggles */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Audio Alert Mute Toggle */}
        <button
          onClick={onToggleAudioMute}
          className={`p-1.5 rounded-md border text-xs transition cursor-pointer ${
            isAudioMuted 
              ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300' 
              : 'bg-slate-900 border-cyan-800/60 text-cyan-400 hover:bg-slate-800 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
          }`}
          title={isAudioMuted ? 'Unmute Demo Early Warning Siren' : 'Mute Demo Early Warning Siren'}
        >
          {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Backend Connectivity Status */}
        <div 
          onClick={onOpenDeployGuide}
          className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-xs font-mono cursor-pointer hover:border-slate-700 transition"
          title={`Backend status: ${backendHealth.status}. Click for deployment and Vercel configuration guide.`}
        >
          <div className={`w-2 h-2 rounded-full ${backendHealth.status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[11px] text-slate-300 hidden md:inline">
            {backendHealth.status === 'online' ? 'Python API' : 'Hybrid Client'}
          </span>
        </div>

        {/* Deployment Guide Trigger */}
        <button
          onClick={onOpenDeployGuide}
          className="px-2 py-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/50 rounded-md transition flex items-center gap-1 cursor-pointer"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Deploy</span>
        </button>

        {/* Model Architecture Inspector Button */}
        <button
          onClick={onOpenModelInspector}
          className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition cursor-pointer"
          title="Inspect Model Architecture & Bands"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
