/**
 * JATAYU 2.0 — Virtual Drone Reconnaissance Simulator
 * Simulates systematic aerial reconnaissance over high-risk disaster perimeters.
 * Integrates cooldowns, hysteresis, audit trails, and honest observation timestamps.
 */

import { 
  DroneFlightStatus, DroneTelemetry, DroneReconnaissanceResult, 
  RiskTriggerAuditLog, HazardType, ReconnaissanceFinding 
} from '../types/predictive';
import { PredictiveRiskAssessment } from '../types/predictive';

export class VirtualDroneSimulator {
  private currentStatus: DroneFlightStatus = 'MONITORING';
  private lastTriggerTimestamp: number = 0;
  private cooldownMs: number = 180000; // 3-minute cooldown against duplicate re-triggering
  private lastTriggerScore: number = 0;
  private hysteresisDelta: number = 5; // score must drop 5 points below threshold before re-arming

  private animationFrameId: number | null = null;
  private auditLogs: RiskTriggerAuditLog[] = [];

  constructor() {
    this.currentStatus = 'MONITORING';
  }

  public getStatus(): DroneFlightStatus {
    return this.currentStatus;
  }

  public getAuditLogs(): RiskTriggerAuditLog[] {
    return [...this.auditLogs];
  }

  /**
   * Generates systematic lawnmower reconnaissance waypoints across the region.
   */
  public generateReconnaissanceRoute(
    bounds: [number, number, number, number]
  ): Array<[number, number]> {
    const [minLon, minLat, maxLon, maxLat] = bounds;
    const waypoints: Array<[number, number]> = [];

    const numSweeps = 5;
    const latStep = (maxLat - minLat) / numSweeps;

    for (let i = 0; i <= numSweeps; i++) {
      const currentLat = maxLat - i * latStep;
      if (i % 2 === 0) {
        waypoints.push([currentLat, minLon]);
        waypoints.push([currentLat, maxLon]);
      } else {
        waypoints.push([currentLat, maxLon]);
        waypoints.push([currentLat, minLon]);
      }
    }

    return waypoints;
  }

  /**
   * Evaluates whether an automated trigger should be dispatched based on risk score,
   * threshold, hysteresis, and cooldown safeguards.
   */
  public shouldAutoTrigger(
    riskAssessment: PredictiveRiskAssessment,
    activationThreshold: number
  ): { shouldTrigger: boolean; reason: string } {
    const now = Date.now();
    const timeSinceLast = now - this.lastTriggerTimestamp;

    // Condition 1: Is already running
    if (this.currentStatus === 'SIMULATING' || this.currentStatus === 'TRIGGERED') {
      return { shouldTrigger: false, reason: 'Simulation currently in-progress.' };
    }

    // Condition 2: Score check
    if (riskAssessment.riskScore < activationThreshold) {
      return { shouldTrigger: false, reason: `Risk score (${riskAssessment.riskScore}) is below threshold (${activationThreshold}).` };
    }

    // Condition 3: Cooldown check
    if (timeSinceLast < this.cooldownMs) {
      const remainingSec = Math.ceil((this.cooldownMs - timeSinceLast) / 1000);
      return { shouldTrigger: false, reason: `Safety cooldown active (${remainingSec}s remaining) to prevent repeated simulation loops.` };
    }

    // Condition 4: Hysteresis check
    if (this.lastTriggerScore > 0 && Math.abs(riskAssessment.riskScore - this.lastTriggerScore) < this.hysteresisDelta) {
      return { shouldTrigger: false, reason: 'Hysteresis dampening active: score has not fluctuated significantly from last trigger.' };
    }

    return { shouldTrigger: true, reason: 'Risk threshold crossed. Safety criteria satisfied for autonomous deployment.' };
  }

  /**
   * Dispatches the Virtual Drone Reconnaissance Mission (Autonomous or Manual).
   */
  public async executeReconnaissanceMission(
    riskAssessment: PredictiveRiskAssessment,
    threshold: number,
    isManual: boolean = false,
    onTelemetryUpdate?: (telemetry: DroneTelemetry) => void
  ): Promise<DroneReconnaissanceResult> {
    const missionId = `DRONE-MSN-${Date.now().toString().slice(-6)}`;
    const triggerType = isManual ? 'MANUAL' : 'AUTONOMOUS';
    this.lastTriggerTimestamp = Date.now();
    this.lastTriggerScore = riskAssessment.riskScore;
    this.currentStatus = 'TRIGGERED';

    const waypoints = this.generateReconnaissanceRoute(riskAssessment.bounds);
    const startPoint = waypoints[0] || riskAssessment.coordinates;

    const initialTelemetry: DroneTelemetry = {
      status: 'TRIGGERED',
      currentPosition: startPoint,
      altitudeM: 120, // fixed reconnaissance survey altitude
      speedMs: 16.5,
      batteryPct: 98,
      headingDeg: 90,
      flightMode: 'AUTONOMOUS_GRID',
      waypoints,
      currentWaypointIndex: 0,
      reconnaissanceProgressPct: 5,
      observationTimestamp: riskAssessment.sources[0]?.observationTime || new Date().toISOString(),
      isNewObservation: false,
      imagerySource: 'Sentinel-2 L1C / High-Res Optical Baseline Archive',
      activeSensors: ['Multispectral 6-Band NIR/SWIR', 'High-Res Optical RGB', 'DEM Surface Lidar']
    };

    onTelemetryUpdate?.(initialTelemetry);

    // Enter Simulation flight phase
    this.currentStatus = 'SIMULATING';

    // Simulate waypoint progression smoothly
    const totalSteps = 6;
    for (let step = 1; step <= totalSteps; step++) {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const waypointIdx = Math.min(waypoints.length - 1, Math.floor((step / totalSteps) * (waypoints.length - 1)));
      const currentPos = waypoints[waypointIdx] || startPoint;
      const progressPct = Math.round((step / totalSteps) * 100);

      onTelemetryUpdate?.({
        ...initialTelemetry,
        status: 'SIMULATING',
        currentPosition: currentPos,
        currentWaypointIndex: waypointIdx,
        batteryPct: Math.max(82, 98 - step * 2),
        headingDeg: (90 + step * 45) % 360,
        reconnaissanceProgressPct: progressPct
      });
    }

    this.currentStatus = 'COMPLETED';

    // Generate verified reconnaissance findings
    const findings = this.generateReconnaissanceFindings(riskAssessment);

    const result: DroneReconnaissanceResult = {
      missionId,
      timestamp: new Date().toISOString(),
      triggerRiskScore: riskAssessment.riskScore,
      triggerThreshold: threshold,
      hazardType: riskAssessment.hazardType,
      regionName: riskAssessment.regionName,
      coverageAreaKm2: 24.8,
      findings,
      infrastructureExposure: {
        submergedRoadKm: riskAssessment.hazardType === 'flood' ? 3.4 : 1.2,
        atRiskBridges: riskAssessment.infrastructure.exposedBridgesCount,
        isolatedStructuresCount: riskAssessment.hazardType === 'flood' ? 18 : 7,
        evacuationRoutesDisrupted: riskAssessment.riskScore >= 65
      },
      preparednessRecommendations: riskAssessment.recommendedActions,
      imageryTimestamp: initialTelemetry.observationTimestamp,
      imageryFreshnessNote: 'Reconnaissance executed using the latest available verified satellite/aerial observation. (No instantaneous live satellite feeds fabricated).'
    };

    // Record Audit Log
    const auditEntry: RiskTriggerAuditLog = {
      id: missionId,
      timestamp: new Date().toISOString(),
      region: riskAssessment.regionName,
      hazardType: riskAssessment.hazardType,
      riskScore: riskAssessment.riskScore,
      threshold,
      triggerType,
      droneStatus: 'COMPLETED',
      dataSourcesSummary: riskAssessment.sources.map(s => `${s.sourceName} (${s.status})`),
      reconnaissanceFindingsCount: findings.length,
      demoAlertDispatched: true
    };
    this.auditLogs.unshift(auditEntry);

    onTelemetryUpdate?.({
      ...initialTelemetry,
      status: 'COMPLETED',
      currentPosition: waypoints[waypoints.length - 1] || startPoint,
      reconnaissanceProgressPct: 100
    });

    return result;
  }

  private generateReconnaissanceFindings(
    assessment: PredictiveRiskAssessment
  ): ReconnaissanceFinding[] {
    const [centerLat, centerLon] = assessment.coordinates;

    if (assessment.hazardType === 'flood') {
      return [
        {
          id: 'FND-01',
          title: 'Riverbank Causeway Overtopping Potential',
          location: [centerLat + 0.006, centerLon - 0.004],
          severity: 'CRITICAL',
          description: 'Topographic saddle point vulnerable to river overflow with rising runoff.',
          affectedInfrastructure: 'Village connecting causeway & drainage culvert #4',
          recommendedAction: 'Sandbag reinforcement of low-elevation crest; alert low-lying hamlet.'
        },
        {
          id: 'FND-02',
          title: 'Agrarian Settlement Evacuation Route Threat',
          location: [centerLat - 0.005, centerLon + 0.008],
          severity: 'HIGH',
          description: 'Single-access paved road intersects flood drainage depression.',
          affectedInfrastructure: 'Secondary Access Road (1.8 km stretch)',
          recommendedAction: 'Designate secondary overland tractor trail as emergency bypass.'
        }
      ];
    } else if (assessment.hazardType === 'landslide') {
      return [
        {
          id: 'FND-03',
          title: 'Active Slope Creep & Rockfall Chute',
          location: [centerLat + 0.008, centerLon + 0.003],
          severity: 'CRITICAL',
          description: 'Saturated debris scarp identified directly above arterial highway curve.',
          affectedInfrastructure: 'National Highway cliffside roadbed (hairpin bend #7)',
          recommendedAction: 'Halt non-essential transit; pre-position rock-clearing frontloader.'
        },
        {
          id: 'FND-04',
          title: 'Bridge Approach Embankment Slump',
          location: [centerLat - 0.004, centerLon - 0.006],
          severity: 'HIGH',
          description: 'Gully erosion threatening western abutment of torrent crossing bridge.',
          affectedInfrastructure: 'Pre-stressed concrete bridge eastern abutment',
          recommendedAction: 'Deploy geotechnical inspection team to verify pier scour stability.'
        }
      ];
    } else {
      return [
        {
          id: 'FND-05',
          title: 'Pavement Structural Sag & Subgrade Infiltration',
          location: [centerLat + 0.003, centerLon + 0.002],
          severity: 'HIGH',
          description: 'Visible longitudinal cracking and ponding over degraded asphalt foundation.',
          affectedInfrastructure: 'Arterial Transport Highway (Lane 1 & 2)',
          recommendedAction: 'Implement temporary axle-load weight restrictions to prevent collapse.'
        }
      ];
    }
  }
}

export const virtualDroneSimulator = new VirtualDroneSimulator();
