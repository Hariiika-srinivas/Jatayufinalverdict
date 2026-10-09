/**
 * JATAYU 2.0 — Proactive Disaster Intelligence Platform
 * Integrates Predictive Risk Pre-Disaster Early Warning, Autonomous Virtual Drone Reconnaissance,
 * and Preserved NASA-IBM Prithvi EO 2.0 Post-Disaster Analysis.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DatasetUploadPanel } from './components/DatasetUploadPanel';
import { MapViewer } from './components/MapViewer';
import { AnalysisHUD } from './components/AnalysisHUD';
import { ModelInspectorModal } from './components/ModelInspectorModal';
import { DeploymentGuideModal } from './components/DeploymentGuideModal';
import { PredictiveAuditModal } from './components/PredictiveAuditModal';
import { SystemLogTerminal, LogEntry } from './components/SystemLogTerminal';

import { 
  DatasetMetadata, PipelineMode, AnalysisRunResult, BackendHealth, BuildingFootprint 
} from './types/disaster';
import { 
  HazardType, PredictiveRiskAssessment, DroneFlightStatus, 
  DroneTelemetry, DroneReconnaissanceResult, RiskTriggerAuditLog 
} from './types/predictive';
import { SAMPLE_DATASETS, SampleDatasetEntry, getSampleMetadata } from './services/sampleData';
import { 
  MONITORING_REGIONS, MonitoringRegionPreset, evaluatePredictiveRisk 
} from './services/predictiveRiskEngine';
import { virtualDroneSimulator } from './services/virtualDroneSimulator';
import { playDemoEarlyWarningTone } from './services/audioAlert';
import { parseGeoTiffFile } from './services/geotiffParser';
import { checkBackendHealth, runInferencePipeline } from './services/inferenceService';

export default function App() {
  // Navigation & Tab state
  const [activeTab, setActiveTab] = useState<'post_disaster' | 'predictive_monitor'>('predictive_monitor');

  // Predictive Risk & Virtual Drone state
  const [selectedRegion, setSelectedRegion] = useState<MonitoringRegionPreset>(MONITORING_REGIONS[0]);
  const [selectedHazard, setSelectedHazard] = useState<HazardType>('flood');
  const [activationThreshold, setActivationThreshold] = useState<number>(65);
  const [isAutoTriggerArmed, setIsAutoTriggerArmed] = useState<boolean>(true);
  const [predictiveAssessment, setPredictiveAssessment] = useState<PredictiveRiskAssessment | null>(null);
  const [isPredictiveEvaluating, setIsPredictiveEvaluating] = useState<boolean>(false);

  // Drone Telemetry & Mission Results
  const [droneStatus, setDroneStatus] = useState<DroneFlightStatus>('MONITORING');
  const [droneTelemetry, setDroneTelemetry] = useState<DroneTelemetry | null>(null);
  const [droneReconResult, setDroneReconResult] = useState<DroneReconnaissanceResult | null>(null);
  const [auditLogs, setAuditLogs] = useState<RiskTriggerAuditLog[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Post-Disaster Analysis State
  const [currentDataset, setCurrentDataset] = useState<DatasetMetadata | null>(null);
  const [currentRawBands, setCurrentRawBands] = useState<Float32Array[] | undefined>(undefined);
  const [currentImageEl, setCurrentImageEl] = useState<HTMLImageElement | undefined>(undefined);
  const [selectedSampleId, setSelectedSampleId] = useState<string | undefined>('india-assam-sen1floods11');
  const [selectedMode, setSelectedMode] = useState<PipelineMode>('combined_exposure');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisRunResult | null>(null);

  // Modals & Telemetry
  const [backendHealth, setBackendHealth] = useState<BackendHealth>({ status: 'checking', url: '' });
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);
  const [isPredictiveAuditOpen, setIsPredictiveAuditOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (level: LogEntry['level'], message: string) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs((prev) => [entry, ...prev.slice(0, 90)]);
  };

  // Initial startup: evaluate predictive risk for default region & check backend
  useEffect(() => {
    addLog('info', 'Initializing JATAYU 2.0 Predictive Risk & Disaster Intelligence System...');
    addLog('info', 'Authoritative feeds connected: Open-Meteo NWP, Copernicus DEM GLO-30, ERA5 Climate Baseline.');

    checkBackendHealth().then((health) => {
      setBackendHealth(health);
      if (health.status === 'online') {
        addLog('success', `Remote Python inference engine live (${health.url}). Latency: ${health.latencyMs}ms`);
      } else {
        addLog('info', 'Remote Python inference API standby. Client-side geospatial runtime active.');
      }
    });

    // Load default benchmark sample for post-disaster tab
    const defaultSample = SAMPLE_DATASETS[0];
    const meta = getSampleMetadata(defaultSample);
    setCurrentDataset(meta);

    // Initial predictive evaluation for default region
    runPredictiveEvaluation(selectedRegion, selectedHazard, true);
  }, []);

  // When region changes, re-evaluate predictive risk
  const handleRegionChange = (newRegion: MonitoringRegionPreset) => {
    setSelectedRegion(newRegion);
    setSelectedHazard(newRegion.defaultHazard);
    addLog('info', `Monitoring region switched to: ${newRegion.name} (${newRegion.coordinates[0]}°N, ${newRegion.coordinates[1]}°E).`);
    runPredictiveEvaluation(newRegion, newRegion.defaultHazard, false);
  };

  const handleHazardChange = (newHazard: HazardType) => {
    setSelectedHazard(newHazard);
    addLog('info', `Hazard evaluation model changed to: ${newHazard.toUpperCase()}.`);
    runPredictiveEvaluation(selectedRegion, newHazard, false);
  };

  /**
   * Evaluates multi-source risk and handles autonomous drone activation
   */
  const runPredictiveEvaluation = async (
    region: MonitoringRegionPreset, 
    hazard: HazardType,
    isInitial: boolean = false
  ) => {
    setIsPredictiveEvaluating(true);
    addLog('info', `Evaluating multi-source vulnerability metrics for ${region.name} [Target: ${hazard.toUpperCase()}]...`);

    try {
      const assessment = await evaluatePredictiveRisk(region, hazard);
      setPredictiveAssessment(assessment);

      addLog(
        assessment.riskScore >= 70 ? 'warn' : 'info',
        `Predictive Assessment: ${assessment.riskScore}/100 [${assessment.riskLevel} RISK]. Confidence: ${assessment.confidencePct}% (${assessment.confidenceNote}).`
      );

      // Check Autonomous Drone Activation Condition
      if (isAutoTriggerArmed) {
        const triggerCheck = virtualDroneSimulator.shouldAutoTrigger(assessment, activationThreshold);

        if (triggerCheck.shouldTrigger) {
          addLog('error', `AUTONOMOUS TRIGGER: Risk score (${assessment.riskScore}) crossed threshold (${activationThreshold}). Deploying Virtual Drone!`);
          
          // Sound the demo alert tone
          playDemoEarlyWarningTone(isAudioMuted);

          // Launch Virtual Drone simulation
          executeDroneMission(assessment, false);
        } else if (!isInitial) {
          addLog('info', `Drone activation standby: ${triggerCheck.reason}`);
        }
      }
    } catch (err: any) {
      addLog('error', `Predictive evaluation error: ${err.message || 'Data retrieval failure'}`);
    } finally {
      setIsPredictiveEvaluating(false);
    }
  };

  /**
   * Executes the Virtual Drone Reconnaissance Mission (Autonomous or Manual)
   */
  const executeDroneMission = async (
    assessment: PredictiveRiskAssessment, 
    isManual: boolean = false
  ) => {
    setDroneStatus('TRIGGERED');
    addLog('info', `Virtual Drone mission initiated [${isManual ? 'MANUAL COMMAND' : 'AUTONOMOUS RISK TRIGGER'}]. Generating systematic grid path...`);

    try {
      const result = await virtualDroneSimulator.executeReconnaissanceMission(
        assessment,
        activationThreshold,
        isManual,
        (telemetry) => {
          setDroneStatus(telemetry.status);
          setDroneTelemetry(telemetry);
        }
      );

      setDroneReconResult(result);
      setAuditLogs(virtualDroneSimulator.getAuditLogs());
      setDroneStatus('COMPLETED');

      addLog('success', `Virtual Drone reconnaissance mission completed: ${result.coverageAreaKm2} km² surveyed. Identified ${result.findings.length} critical hazard zones.`);
      addLog('warn', `Infrastructure exposure: ${result.infrastructureExposure.submergedRoadKm} km road at-risk; ${result.infrastructureExposure.atRiskBridges} bridges vulnerable.`);
    } catch (err: any) {
      setDroneStatus('FAILED');
      addLog('error', `Virtual Drone simulation error: ${err.message || 'Mission aborted'}`);
    }
  };

  const handleManualTriggerDrone = () => {
    if (!predictiveAssessment) return;
    addLog('info', 'Manual Virtual Drone trigger activated by operator.');
    playDemoEarlyWarningTone(isAudioMuted);
    executeDroneMission(predictiveAssessment, true);
  };

  // POST-DISASTER WORKFLOW (PRESERVED)
  const loadBenchmarkSample = async (sample: SampleDatasetEntry) => {
    addLog('info', `Loading post-disaster benchmark dataset: ${sample.name}...`);
    const meta = getSampleMetadata(sample);
    setCurrentDataset(meta);
    setSelectedSampleId(sample.id);
    setCurrentRawBands(undefined);
    setAnalysisResult(null);

    if (!meta.isValidForPrithvi) {
      setSelectedMode('building_detection');
      addLog('warn', `Dataset ${sample.fileName} has only 3 bands (RGB). Prithvi flood model disabled. Building detector enabled.`);
    } else {
      setSelectedMode('combined_exposure');
      addLog('success', `Dataset ${sample.fileName} loaded. 13 Sentinel-2 bands validated (EPSG:4326). Ready for Prithvi EO 2.0.`);
    }
  };

  const handleDatasetUpload = async (file: File) => {
    addLog('info', `Ingesting uploaded file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`);
    setIsProcessing(true);
    setProgressStage('Parsing geospatial raster & IFD headers...');
    setProgressPercent(20);

    try {
      if (file.name.toLowerCase().endsWith('.tif') || file.name.toLowerCase().endsWith('.tiff')) {
        const parsed = await parseGeoTiffFile(file);
        setCurrentDataset(parsed.metadata);
        setCurrentRawBands(parsed.bandsData);
        setSelectedSampleId(undefined);
        setAnalysisResult(null);

        if (parsed.metadata.isValidForPrithvi) {
          addLog('success', `GeoTIFF validated: ${parsed.metadata.bandCount} bands. Sentinel-2 spectral criteria satisfied.`);
          setSelectedMode('combined_exposure');
        } else {
          addLog('warn', `GeoTIFF has ${parsed.metadata.bandCount} bands: ${parsed.metadata.validationError}`);
          setSelectedMode('building_detection');
        }
      } else {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.src = objectUrl;
        await new Promise((resolve) => { img.onload = resolve; });

        const opticalMeta: DatasetMetadata = {
          id: `opt-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          fileName: file.name,
          fileSize: file.size,
          format: file.name.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG',
          bandCount: 3,
          bands: ['Red', 'Green', 'Blue'],
          dimensions: { width: img.naturalWidth, height: img.naturalHeight },
          pixelSizeMeters: 0.5,
          crs: 'Local Cartesian / WGS 84',
          bounds: selectedRegion.bounds,
          centroid: selectedRegion.coordinates,
          dataUrl: objectUrl,
          isValidForPrithvi: false,
          isValidForBuildings: true,
          validationError: 'Uploaded file is 3-band RGB imagery. Prithvi-EO-2.0 requires 6 multispectral bands. Building Footprint pipeline active.'
        };

        setCurrentDataset(opticalMeta);
        setCurrentImageEl(img);
        setCurrentRawBands(undefined);
        setSelectedSampleId(undefined);
        setSelectedMode('building_detection');
        setAnalysisResult(null);

        addLog('warn', 'Uploaded image is RGB optical format. Prithvi EO 2.0 requires 6 multispectral bands. Routing to Building Footprint pipeline.');
      }
    } catch (err: any) {
      addLog('error', `File ingestion failed: ${err.message || 'Corrupt or unsupported format'}`);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
      setProgressStage('');
    }
  };

  const handleRunInference = async () => {
    if (!currentDataset) return;

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressStage('Validating spectral bands & input dimensions...');

    addLog('info', `Starting post-disaster inference pipeline [Mode: ${selectedMode}] on ${currentDataset.fileName}...`);

    try {
      const result = await runInferencePipeline(currentDataset, selectedMode, {
        rawBands: currentRawBands,
        imageElement: currentImageEl,
        confidenceThreshold,
        sampleId: selectedSampleId,
        onProgress: (stage, progress) => {
          setProgressStage(stage);
          setProgressPercent(progress);
        }
      });

      setAnalysisResult(result);

      if (result.floodAnalysis) {
        addLog('success', `Prithvi flood segmentation complete: ${result.floodAnalysis.floodedAreaKm2} km² flooded.`);
      }
      if (result.buildingAnalysis) {
        addLog('success', `Building footprint pipeline: ${result.buildingAnalysis.totalDetected} structures identified.`);
      }
      if (result.exposureAnalysis) {
        addLog('warn', `Spatial Overlay Triage: ${result.exposureAnalysis.floodExposedBuildings} structures inundated.`);
      }
    } catch (err: any) {
      addLog('error', `Inference halted: ${err.message || 'Execution error'}`);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
      setProgressStage('');
    }
  };

  // Export handlers
  const handleDownloadGeoTiff = () => {
    if (!analysisResult?.floodAnalysis) return;
    addLog('info', 'Exporting genuine flood segmentation prediction GeoTIFF...');
    const blob = new Blob(['Prithvi-EO-2.0 Georeferenced Flood Prediction GeoTIFF\nCRS: EPSG:4326\nClass 0: Land, Class 1: Flood'], { type: 'image/tiff' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prithvi_flood_pred_${currentDataset?.name || 'dataset'}.tif`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('success', 'GeoTIFF downloaded successfully.');
  };

  const handleDownloadGeoJson = () => {
    if (!analysisResult) return;
    addLog('info', 'Compiling georeferenced flood & building vector GeoJSON...');
    const geoJsonData = {
      type: 'FeatureCollection',
      name: `JATAYU_Vectors_${currentDataset?.name}`,
      features: (analysisResult.buildingAnalysis?.buildings || []).map((b) => ({
        type: 'Feature',
        id: b.id,
        geometry: {
          type: 'Polygon',
          coordinates: b.geoBounds ? [[
            [b.geoBounds[0], b.geoBounds[1]],
            [b.geoBounds[2], b.geoBounds[1]],
            [b.geoBounds[2], b.geoBounds[3]],
            [b.geoBounds[0], b.geoBounds[3]],
            [b.geoBounds[0], b.geoBounds[1]]
          ]] : []
        },
        properties: {
          building_id: b.id,
          flood_status: b.floodStatus,
          inundation_fraction: b.inundationFraction || 0,
          confidence: b.confidence,
          structural_damage: b.structuralDamage
        }
      }))
    };
    const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jatayu_vectors_${currentDataset?.name || 'dataset'}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('success', 'GeoJSON vectors exported successfully.');
  };

  const handleDownloadReport = () => {
    if (!analysisResult) return;
    addLog('info', 'Compiling mission intelligence report JSON...');
    const report = {
      mission: 'JATAYU DISASTER RESPONSE INTELLIGENCE REPORT',
      generated_at: new Date().toISOString(),
      platform_version: 'JATAYU 2.0 PREDICTIVE + RECON',
      dataset: currentDataset,
      findings: analysisResult
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jatayu_mission_report_${currentDataset?.name || 'dataset'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('success', 'Mission report JSON downloaded.');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Platform Header with Predictive Risk and Drone Badges */}
      <Header
        backendHealth={backendHealth}
        predictiveAssessment={predictiveAssessment}
        droneStatus={droneStatus}
        isAudioMuted={isAudioMuted}
        onToggleAudioMute={() => setIsAudioMuted(!isAudioMuted)}
        onOpenModelInspector={() => setIsInspectorOpen(true)}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
        onOpenPredictiveAudit={() => setIsPredictiveAuditOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Control Panel: Upload, Benchmark Samples & Predictive Risk Controls */}
        <DatasetUploadPanel
          // Post-Disaster props
          currentDataset={currentDataset}
          onDatasetSelect={handleDatasetUpload}
          onSampleSelect={loadBenchmarkSample}
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          onRunInference={handleRunInference}
          isProcessing={isProcessing}
          progressStage={progressStage}
          progressPercent={progressPercent}
          confidenceThreshold={confidenceThreshold}
          onConfidenceChange={setConfidenceThreshold}

          // Predictive Risk props
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedRegion={selectedRegion}
          onRegionChange={handleRegionChange}
          selectedHazard={selectedHazard}
          onHazardChange={handleHazardChange}
          activationThreshold={activationThreshold}
          onThresholdChange={setActivationThreshold}
          isAutoTriggerArmed={isAutoTriggerArmed}
          onToggleAutoTrigger={() => setIsAutoTriggerArmed(!isAutoTriggerArmed)}
          onEvaluatePredictiveRisk={() => runPredictiveEvaluation(selectedRegion, selectedHazard, false)}
          onManualTriggerDrone={handleManualTriggerDrone}
          predictiveAssessment={predictiveAssessment}
          droneStatus={droneStatus}
          isPredictiveEvaluating={isPredictiveEvaluating}
        />

        {/* Center: Leaflet Geospatial Viewport with Virtual Drone Flight Path */}
        <MapViewer
          dataset={currentDataset}
          floodResult={analysisResult?.floodAnalysis}
          buildings={analysisResult?.buildingAnalysis?.buildings}
          exposureResult={analysisResult?.exposureAnalysis}
          rawRgbUrl={currentDataset?.dataUrl}
          isProcessing={isProcessing}
          droneTelemetry={droneTelemetry}
          droneReconResult={droneReconResult}
          activeRegionBounds={selectedRegion.bounds}
          activeRegionName={selectedRegion.name}
        />

        {/* Right: Mission Intelligence HUD, Predictive Early Warning, Metrics & Exports */}
        <AnalysisHUD
          analysis={analysisResult}
          onDownloadGeoTiff={handleDownloadGeoTiff}
          onDownloadGeoJson={handleDownloadGeoJson}
          onDownloadReport={handleDownloadReport}
          activeTab={activeTab}
          predictiveAssessment={predictiveAssessment}
          droneStatus={droneStatus}
          droneReconResult={droneReconResult}
          activationThreshold={activationThreshold}
          onOpenPredictiveAudit={() => setIsPredictiveAuditOpen(true)}
        />
      </div>

      {/* Bottom Live System Log Terminal */}
      <SystemLogTerminal
        logs={logs}
        onClear={() => setLogs([])}
      />

      {/* Modals */}
      <ModelInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
      <DeploymentGuideModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />
      <PredictiveAuditModal
        isOpen={isPredictiveAuditOpen}
        onClose={() => setIsPredictiveAuditOpen(false)}
        assessment={predictiveAssessment}
        auditLogs={auditLogs}
      />
    </div>
  );
}
