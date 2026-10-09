/**
 * JATAYU 2.0 — Predictive Risk & Virtual Drone Audit Modal
 * Provides scientific transparency: source metadata, observation timestamps, units,
 * contributing factor breakdown, and autonomous drone activation audit log.
 */

import React from 'react';
import { 
  X, Database, ShieldAlert, Radio, Clock, CheckCircle2, 
  AlertTriangle, Navigation, ExternalLink, FileText, Activity
} from 'lucide-react';
import { PredictiveRiskAssessment, RiskTriggerAuditLog } from '../types/predictive';

interface PredictiveAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: PredictiveRiskAssessment | null;
  auditLogs: RiskTriggerAuditLog[];
}

export const PredictiveAuditModal: React.FC<PredictiveAuditModalProps> = ({
  isOpen,
  onClose,
  assessment,
  auditLogs
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Predictive Risk Engine & Drone Audit Stream
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Traceable Data Sources, Observation Timestamps & Autonomous Trigger Log
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Section 1: Assessment Summary & Methodology */}
          {assessment && (
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/50 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="font-bold text-slate-200 text-[12px] flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Active Region: {assessment.regionName}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  assessment.riskLevel === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                  assessment.riskLevel === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  assessment.riskLevel === 'MODERATE' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {assessment.riskLevel} RISK ({assessment.riskScore}/100)
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-sans leading-relaxed">
                <strong className="text-slate-200 font-mono">Methodology: </strong>
                {assessment.scoringMethodology}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 pt-1">
                <span>
                  <strong className="text-slate-300">Hazard Target: </strong>
                  {assessment.hazardType.toUpperCase()}
                </span>
                <span>
                  <strong className="text-slate-300">Confidence: </strong>
                  {assessment.confidencePct}% ({assessment.confidenceNote})
                </span>
                <span>
                  <strong className="text-slate-300">Coordinates: </strong>
                  {assessment.coordinates[0].toFixed(4)}°N, {assessment.coordinates[1].toFixed(4)}°E
                </span>
              </div>
            </div>
          )}

          {/* Section 2: Authoritative Data Sources & Precise Timestamps */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Authoritative Data Sources & Freshness Registry (Requirement 3)
            </div>

            <div className="space-y-2">
              {assessment?.sources.map((src, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 space-y-1.5 font-mono text-[11px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{src.sourceName}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-semibold ${
                      src.status === 'fresh' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      src.status === 'stale' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {src.status}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-sans">{src.product}</div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <div>
                      <span className="text-slate-500">Obs Time: </span>
                      <span className="text-slate-300">{new Date(src.observationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Retrieved: </span>
                      <span className="text-slate-300">{new Date(src.retrievalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Resolution: </span>
                      <span className="text-slate-300">{src.spatialResolution}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Units: </span>
                      <span className="text-slate-300">{src.units}</span>
                    </div>
                  </div>

                  {src.notes && (
                    <div className="text-[10px] text-slate-500 italic pt-0.5">
                      Note: {src.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Factor Breakdown Table */}
          {assessment && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Contributing Vulnerability Factors
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/40 overflow-hidden">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Factor</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Observed Metric</th>
                      <th className="p-2.5 text-right">Contribution</th>
                      <th className="p-2.5 text-right">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {assessment.contributingFactors.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-900/50">
                        <td className="p-2.5 font-semibold text-slate-200">{f.name}</td>
                        <td className="p-2.5 text-slate-400">{f.category}</td>
                        <td className="p-2.5 text-slate-300 font-sans">{f.impactDescription}</td>
                        <td className="p-2.5 text-right text-cyan-400 font-bold">{f.normalizedContribution}/100</td>
                        <td className="p-2.5 text-right text-slate-400">{(f.weight * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 4: Virtual Drone Trigger Audit Log */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                Virtual Drone Activation Audit Log (Requirement 5)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">{auditLogs.length} missions logged</span>
            </div>

            {auditLogs.length === 0 ? (
              <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/40 text-center text-slate-500 font-sans">
                No autonomous or manual drone activations logged yet. When risk score crosses the configured threshold, activations are recorded here with full audit trails.
              </div>
            ) : (
              <div className="space-y-1.5">
                {auditLogs.map((log) => (
                  <div 
                    key={log.id}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 text-[11px] font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300">{log.id}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>
                        <strong className="text-slate-300">Trigger: </strong>
                        <span className={log.triggerType === 'AUTONOMOUS' ? 'text-amber-400' : 'text-cyan-400'}>
                          {log.triggerType} (Score: {log.riskScore} vs Threshold: {log.threshold})
                        </span>
                      </span>
                      <span>
                        <strong className="text-slate-300">Hazard: </strong>
                        {log.hazardType.toUpperCase()}
                      </span>
                      <span>
                        <strong className="text-slate-300">Findings: </strong>
                        {log.reconnaissanceFindingsCount} zones
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Scientific Transparency & Limitations */}
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/30 text-[10px] font-sans text-slate-400 space-y-1">
            <div className="font-bold text-slate-300 font-mono flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Limitations & Transparency Disclaimer
            </div>
            <ul className="list-disc list-inside space-y-0.5 leading-relaxed text-slate-400">
              <li>The Predictive Risk Score is an empirical composite susceptibility index, not a certified mathematical probability of disaster.</li>
              <li>Virtual Drone Simulation is a software reconnaissance simulation, not a physical drone. Observations reflect the latest available verified satellite/aerial imagery.</li>
              <li>Road degradation is evaluated based on verified infrastructure inspection records.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-semibold cursor-pointer"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
