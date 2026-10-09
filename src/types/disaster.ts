/**
 * JATAYU — Disaster Intelligence Platform
 * Types for Geospatial Datasets, Prithvi EO 2.0 Flood Models, and Building Exposure
 */

export type PipelineMode = 'prithvi_flood' | 'building_detection' | 'combined_exposure';

export type RasterBandType = 
  | 'B1' | 'B2_BLUE' | 'B3_GREEN' | 'B4_RED' | 'B5' | 'B6' | 'B7'
  | 'B8_NIR' | 'B8A_NARROW_NIR' | 'B9' | 'B10' | 'B11_SWIR1' | 'B12_SWIR2';

export interface DatasetMetadata {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  format: 'GeoTIFF' | 'PNG' | 'JPEG';
  bandCount: number;
  bands: string[];
  dimensions: {
    width: number;
    height: number;
  };
  crs?: string;
  bounds?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  centroid?: [number, number]; // [lat, lon]
  pixelSizeMeters?: number;
  acquisitionDate?: string;
  sourceSensor?: string;
  dataUrl?: string;
  isValidForPrithvi: boolean;
  isValidForBuildings: boolean;
  validationError?: string;
}

export interface BuildingFootprint {
  id: string;
  pixelBounds: [number, number, number, number]; // [x1, y1, x2, y2]
  geoBounds?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  centroid?: [number, number]; // [lat, lon]
  confidence: number;
  estimatedAreaM2: number;
  floodStatus: 'PENDING_OVERLAY' | 'EXPOSED_TO_FLOOD' | 'UNAFFECTED';
  inundationFraction?: number;
  structuralDamage: 'Not assessed — compatible damage model required';
}

export interface FloodAnalysisResult {
  modelName: string;
  checkpoint: string;
  totalPixels: number;
  floodedPixels: number;
  floodedAreaKm2: number;
  floodedAreaHectares: number;
  floodCoveragePercent: number;
  pixelResolutionMeters: number;
  maskDataUrl?: string;
  rawMask?: Uint8Array;
  geoJson?: any;
  structuralDamageAssessment: 'Not assessed — compatible damage model required';
  limitations: string[];
}

export interface ExposureAnalysisResult {
  totalBuildings: number;
  floodExposedBuildings: number;
  unaffectedBuildings: number;
  exposureRatePercent: number;
  rescuePriorityLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  rescuePriorityScore: number; // 0 to 100
  affectedStructures: BuildingFootprint[];
  priorityZones: Array<{
    id: string;
    name: string;
    center: [number, number];
    exposedBuildingsCount: number;
    recommendedAction: string;
    urgency: 'IMMEDIATE' | 'HIGH' | 'MONITOR';
  }>;
}

export interface AnalysisRunResult {
  timestamp: string;
  dataset: DatasetMetadata;
  mode: PipelineMode;
  floodAnalysis?: FloodAnalysisResult;
  buildingAnalysis?: {
    totalDetected: number;
    confidenceThreshold: number;
    buildings: BuildingFootprint[];
    structuralDamage: string;
  };
  exposureAnalysis?: ExposureAnalysisResult;
  inferenceBackend: 'PYTHON_REMOTE_API' | 'LOCAL_HYBRID_ENGINE';
  executionTimeMs: number;
}

export interface BackendHealth {
  status: 'online' | 'offline' | 'checking';
  url: string;
  service?: string;
  device?: string;
  checkpointAvailable?: boolean;
  latencyMs?: number;
  errorMessage?: string;
}
