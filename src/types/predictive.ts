/**
 * JATAYU 2.0 — Predictive Risk & Virtual Drone Domain Types
 * Traceable, authoritative data models for multi-source risk assessment and autonomous drone reconnaissance.
 */

export type HazardType = 'flood' | 'landslide' | 'infrastructure_collapse';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type DataFreshnessStatus = 'fresh' | 'stale' | 'unavailable';

export interface DataSourceRecord {
  sourceName: string;
  product: string;
  observationTime: string;
  retrievalTime: string;
  spatialResolution: string;
  coverage: string;
  units: string;
  status: DataFreshnessStatus;
  sourceUrl?: string;
  missingData: boolean;
  notes?: string;
}

export interface EnvironmentalFactors {
  rainfall24hMm: number;
  rainfall72hMm: number;
  rainfallIntensityMmH: number;
  forecastRainfall48hMm: number;
  forecastUncertaintyPct: number;
  temperatureC: number;
  soilSaturationPct: number;
  weatherAlert: string | null;
}

export interface TerrainFactors {
  elevationM: number;
  slopeDegrees: number;
  drainageBasinType: 'low_lying_floodplain' | 'steep_gorge' | 'plateau' | 'alluvial_fan';
  landslideSusceptibilityScore: number; // 0-100
}

export interface ClimateContext {
  historicalExtremePrecipPercentile: number;
  anomalyModifier: number; // e.g., +15% heavy rain frequency over baseline
  climateBaselineNotes: string;
}

export interface InfrastructureFactors {
  criticalRoadLengthKm: number;
  reportedAsphaltDegradation: boolean;
  degradationSource: string | null;
  exposedBridgesCount: number;
  evacuationRouteVulnerability: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface ContributingFactor {
  name: string;
  category: 'Weather' | 'Terrain' | 'Climate' | 'Infrastructure';
  impactDescription: string;
  normalizedContribution: number; // 0 to 100
  weight: number;
}

export interface PredictiveRiskAssessment {
  id: string;
  timestamp: string;
  regionId: string;
  regionName: string;
  coordinates: [number, number]; // [lat, lon]
  bounds: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  hazardType: HazardType;
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  confidencePct: number; // 0 to 100
  confidenceNote: string;
  environmental: EnvironmentalFactors;
  terrain: TerrainFactors;
  climate: ClimateContext;
  infrastructure: InfrastructureFactors;
  contributingFactors: ContributingFactor[];
  sources: DataSourceRecord[];
  recommendedActions: string[];
  isAutoTriggerCandidate: boolean;
  scoringMethodology: string;
  limitations: string[];
}

export type DroneFlightStatus = 
  | 'MONITORING' 
  | 'TRIGGERED' 
  | 'SIMULATING' 
  | 'COMPLETED' 
  | 'FAILED';

export interface DroneTelemetry {
  status: DroneFlightStatus;
  currentPosition: [number, number]; // [lat, lon]
  altitudeM: number;
  speedMs: number;
  batteryPct: number;
  headingDeg: number;
  flightMode: 'AUTONOMOUS_GRID' | 'PERIMETER_RECON' | 'STANDBY';
  waypoints: Array<[number, number]>;
  currentWaypointIndex: number;
  reconnaissanceProgressPct: number;
  observationTimestamp: string;
  isNewObservation: boolean;
  imagerySource: string;
  activeSensors: string[];
}

export interface ReconnaissanceFinding {
  id: string;
  title: string;
  location: [number, number];
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  description: string;
  affectedInfrastructure: string;
  recommendedAction: string;
}

export interface DroneReconnaissanceResult {
  missionId: string;
  timestamp: string;
  triggerRiskScore: number;
  triggerThreshold: number;
  hazardType: HazardType;
  regionName: string;
  coverageAreaKm2: number;
  findings: ReconnaissanceFinding[];
  infrastructureExposure: {
    submergedRoadKm: number;
    atRiskBridges: number;
    isolatedStructuresCount: number;
    evacuationRoutesDisrupted: boolean;
  };
  preparednessRecommendations: string[];
  imageryTimestamp: string;
  imageryFreshnessNote: string;
}

export interface RiskTriggerAuditLog {
  id: string;
  timestamp: string;
  region: string;
  hazardType: HazardType;
  riskScore: number;
  threshold: number;
  triggerType: 'AUTONOMOUS' | 'MANUAL';
  droneStatus: DroneFlightStatus;
  dataSourcesSummary: string[];
  reconnaissanceFindingsCount: number;
  demoAlertDispatched: boolean;
}
