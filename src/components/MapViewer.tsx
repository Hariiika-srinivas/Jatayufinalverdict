/**
 * JATAYU 2.0 — Geospatial Map & Virtual Drone Viewport Component
 * Features Leaflet satellite basemap, Prithvi flood segmentation overlay,
 * building footprint vector polygons, and real-time autonomous virtual drone reconnaissance.
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  Eye, EyeOff, ZoomIn, ZoomOut, MapPin, Crosshair, 
  Navigation, Radio, AlertTriangle, Layers, Battery, Gauge
} from 'lucide-react';
import L from 'leaflet';
import { DatasetMetadata, BuildingFootprint, FloodAnalysisResult, ExposureAnalysisResult } from '../types/disaster';
import { DroneTelemetry, DroneReconnaissanceResult } from '../types/predictive';

interface MapViewerProps {
  dataset: DatasetMetadata | null;
  floodResult?: FloodAnalysisResult;
  buildings?: BuildingFootprint[];
  exposureResult?: ExposureAnalysisResult;
  rawRgbUrl?: string;
  isProcessing: boolean;

  // Virtual Drone props
  droneTelemetry?: DroneTelemetry | null;
  droneReconResult?: DroneReconnaissanceResult | null;
  activeRegionBounds?: [number, number, number, number];
  activeRegionName?: string;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  dataset,
  floodResult,
  buildings = [],
  exposureResult,
  rawRgbUrl,
  isProcessing,
  droneTelemetry,
  droneReconResult,
  activeRegionBounds,
  activeRegionName
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer toggles
  const [showBaseSatellite, setShowBaseSatellite] = useState(true);
  const [showFloodMask, setShowFloodMask] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showExposedOnly, setShowExposedOnly] = useState(false);
  const [showDroneLayer, setShowDroneLayer] = useState(true);
  const [floodOpacity, setFloodOpacity] = useState(0.75);

  // Hover inspector
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingFootprint | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Active layers on map
  const imageOverlayRef = useRef<L.ImageOverlay | null>(null);
  const floodOverlayRef = useRef<L.ImageOverlay | null>(null);
  const buildingLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const droneLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [26.7454, 93.7582],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      // Dark Tactical Satellite Basemap
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      }).addTo(map);

      // Labels overlay
      L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        opacity: 0.6
      }).addTo(map);

      map.on('mousemove', (e) => {
        setCursorCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      buildingLayerGroupRef.current = L.layerGroup().addTo(map);
      droneLayerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // Sync Map view when dataset or activeRegionBounds changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const boundsToUse = dataset?.bounds || activeRegionBounds;
    if (boundsToUse) {
      const [minLon, minLat, maxLon, maxLat] = boundsToUse;
      const bounds: L.LatLngBoundsExpression = [
        [minLat, minLon],
        [maxLat, maxLon]
      ];

      map.fitBounds(bounds, { padding: [30, 30] });

      const imgUrl = rawRgbUrl || dataset?.dataUrl;
      if (imgUrl) {
        if (imageOverlayRef.current) {
          map.removeLayer(imageOverlayRef.current);
        }
        imageOverlayRef.current = L.imageOverlay(imgUrl, bounds, {
          opacity: showBaseSatellite ? 1.0 : 0.0
        }).addTo(map);
      }
    }
  }, [dataset, activeRegionBounds, rawRgbUrl]);

  // Update Flood Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const boundsToUse = dataset?.bounds || activeRegionBounds;
    if (!boundsToUse) return;

    const [minLon, minLat, maxLon, maxLat] = boundsToUse;
    const bounds: L.LatLngBoundsExpression = [
      [minLat, minLon],
      [maxLat, maxLon]
    ];

    if (floodResult?.maskDataUrl && showFloodMask) {
      if (floodOverlayRef.current) {
        map.removeLayer(floodOverlayRef.current);
      }
      floodOverlayRef.current = L.imageOverlay(floodResult.maskDataUrl, bounds, {
        opacity: floodOpacity,
        interactive: false
      }).addTo(map);
    } else if (floodOverlayRef.current) {
      map.removeLayer(floodOverlayRef.current);
      floodOverlayRef.current = null;
    }
  }, [floodResult, showFloodMask, floodOpacity, dataset, activeRegionBounds]);

  // Update Building Vector Polygons
  useEffect(() => {
    const layerGroup = buildingLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();
    if (!showBuildings) return;

    const filtered = showExposedOnly
      ? buildings.filter((b) => b.floodStatus === 'EXPOSED_TO_FLOOD')
      : buildings;

    filtered.forEach((bld) => {
      if (!bld.geoBounds) return;

      const [minLon, minLat, maxLon, maxLat] = bld.geoBounds;
      const bounds: L.LatLngBoundsExpression = [
        [minLat, minLon],
        [maxLat, maxLon]
      ];

      const isExposed = bld.floodStatus === 'EXPOSED_TO_FLOOD';

      const rect = L.rectangle(bounds, {
        color: isExposed ? '#ef4444' : '#10b981',
        weight: isExposed ? 2 : 1.5,
        fillColor: isExposed ? '#ef4444' : '#10b981',
        fillOpacity: isExposed ? 0.6 : 0.35,
        className: isExposed ? 'pulsing-exposed-building' : ''
      });

      rect.on('mouseover', () => setHoveredBuilding(bld));
      rect.on('mouseout', () => setHoveredBuilding(null));

      layerGroup.addLayer(rect);
    });
  }, [buildings, showBuildings, showExposedOnly]);

  // Update Virtual Drone Reconnaissance Flight Path & Marker
  useEffect(() => {
    const layerGroup = droneLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();
    if (!showDroneLayer || !droneTelemetry) return;

    // 1. Draw flight path waypoints polyline
    if (droneTelemetry.waypoints && droneTelemetry.waypoints.length > 1) {
      const pathLine = L.polyline(droneTelemetry.waypoints, {
        color: '#06b6d4',
        weight: 2,
        dashArray: '5, 8',
        opacity: 0.75
      });
      layerGroup.addLayer(pathLine);

      // Draw small waypoint dots
      droneTelemetry.waypoints.forEach((wp, idx) => {
        const dot = L.circleMarker(wp, {
          radius: 3,
          color: idx <= droneTelemetry.currentWaypointIndex ? '#06b6d4' : '#64748b',
          fillColor: idx <= droneTelemetry.currentWaypointIndex ? '#22d3ee' : '#334155',
          fillOpacity: 0.9,
          weight: 1
        });
        layerGroup.addLayer(dot);
      });
    }

    // 2. Draw Active Drone Marker at current position
    const dronePos = droneTelemetry.currentPosition;
    if (dronePos) {
      const droneIconHtml = `
        <div style="position: relative; width: 34px; height: 34px; transform: rotate(${droneTelemetry.headingDeg}deg);">
          <div style="position: absolute; inset: 0; border-radius: 50%; border: 2px solid #22d3ee; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>
          <div style="position: absolute; inset: 3px; background: rgba(8, 145, 178, 0.4); border: 2px solid #06b6d4; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px #06b6d4;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          </div>
        </div>
      `;

      const droneCustomIcon = L.divIcon({
        html: droneIconHtml,
        className: 'custom-drone-leaflet-icon',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const droneMarker = L.marker(dronePos, { icon: droneCustomIcon });
      droneMarker.bindTooltip(`Virtual Drone (Alt: ${droneTelemetry.altitudeM}m)`, {
        permanent: false,
        direction: 'top'
      });
      layerGroup.addLayer(droneMarker);
    }

    // 3. Draw Reconnaissance Findings markers if available
    if (droneReconResult && droneReconResult.findings) {
      droneReconResult.findings.forEach((finding) => {
        const findingHtml = `
          <div style="width: 22px; height: 22px; border-radius: 50%; background: #dc2626; border: 2px solid #fecaca; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(220, 38, 38, 0.8);">
            <span style="color: white; font-size: 11px; font-weight: bold;">!</span>
          </div>
        `;
        const findingIcon = L.divIcon({
          html: findingHtml,
          className: 'finding-marker-icon',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const m = L.marker(finding.location, { icon: findingIcon });
        m.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; color: #0f172a; max-width: 200px;">
            <strong style="color: #b91c1c;">${finding.title}</strong>
            <p style="margin: 4px 0;">${finding.description}</p>
            <div style="font-size: 10px; color: #475569;"><strong>Asset:</strong> ${finding.affectedInfrastructure}</div>
          </div>
        `);
        layerGroup.addLayer(m);
      });
    }
  }, [droneTelemetry, droneReconResult, showDroneLayer]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    const boundsToUse = dataset?.bounds || activeRegionBounds;
    if (boundsToUse && mapInstanceRef.current) {
      const [minLon, minLat, maxLon, maxLat] = boundsToUse;
      mapInstanceRef.current.fitBounds([[minLat, minLon], [maxLat, maxLon]], { padding: [30, 30] });
    }
  };

  return (
    <div className="flex-1 relative flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Top Map Layer Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Layer Toggles Pill Group */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl pointer-events-auto font-mono text-xs">
          {/* Base Satellite Imagery */}
          <button
            onClick={() => setShowBaseSatellite(!showBaseSatellite)}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
              showBaseSatellite
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Base Satellite Imagery"
          >
            {showBaseSatellite ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Satellite Base</span>
          </button>

          {/* Prithvi Flood Mask */}
          <button
            onClick={() => setShowFloodMask(!showFloodMask)}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
              showFloodMask
                ? 'bg-cyan-950 text-cyan-200 border border-cyan-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Prithvi Flood Segmentation Mask"
          >
            <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
            <span>Flood Mask</span>
          </button>

          {/* Building Footprints */}
          <button
            onClick={() => setShowBuildings(!showBuildings)}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
              showBuildings
                ? 'bg-emerald-950 text-emerald-200 border border-emerald-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Building Footprints"
          >
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
            <span>Buildings ({buildings.length})</span>
          </button>

          {/* Virtual Drone Flight Path Toggle */}
          {droneTelemetry && (
            <button
              onClick={() => setShowDroneLayer(!showDroneLayer)}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
                showDroneLayer
                  ? 'bg-cyan-950 text-cyan-200 border border-cyan-700 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Virtual Drone Flight Path and Reconnaissance Layer"
            >
              <Navigation className="w-3 h-3 text-cyan-400" />
              <span>Virtual Drone</span>
            </button>
          )}

          {/* Exposed Buildings Filter */}
          {exposureResult && exposureResult.floodExposedBuildings > 0 && (
            <button
              onClick={() => setShowExposedOnly(!showExposedOnly)}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
                showExposedOnly
                  ? 'bg-red-950 text-red-200 border border-red-700 animate-pulse'
                  : 'text-slate-400 hover:text-red-300'
              }`}
              title="Show only flood-exposed structures"
            >
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              <span>Inundated ({exposureResult.floodExposedBuildings})</span>
            </button>
          )}

          {/* Opacity Slider */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800 text-slate-400 text-[11px]">
            <span>Opacity:</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={floodOpacity}
              onChange={(e) => setFloodOpacity(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* View Tools */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl pointer-events-auto">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded transition cursor-pointer"
            title="Recenter"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Leaflet Map Viewport */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Virtual Drone Telemetry HUD Card (Top Right Overlay) */}
      {droneTelemetry && (
        <div className="absolute top-16 right-3 z-20 p-2.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-2xl font-mono text-xs w-72 pointer-events-none">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-[11px]">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              VIRTUAL DRONE TELEMETRY
            </span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
              droneTelemetry.status === 'SIMULATING' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse' :
              droneTelemetry.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
              'bg-slate-800 text-slate-400'
            }`}>
              {droneTelemetry.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400">
            <div className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-slate-500" />
              <span>Alt: <strong className="text-slate-200">{droneTelemetry.altitudeM}m AGL</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <Battery className="w-3 h-3 text-slate-500" />
              <span>Batt: <strong className="text-slate-200">{droneTelemetry.batteryPct}%</strong></span>
            </div>
            <div>
              <span>Speed: <strong className="text-slate-200">{droneTelemetry.speedMs} m/s</strong></span>
            </div>
            <div>
              <span>Recon: <strong className="text-cyan-400">{droneTelemetry.reconnaissanceProgressPct}%</strong></span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[9px] text-slate-400 leading-tight">
            <span className="text-slate-500">Observation Timestamp: </span>
            <span className="text-slate-300">{new Date(droneTelemetry.observationTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="text-slate-500 mt-0.5 italic">
              *Software simulation over latest verified observation.
            </div>
          </div>
        </div>
      )}

      {/* Hovered Building Tooltip */}
      {hoveredBuilding && (
        <div className="absolute bottom-10 left-4 z-20 p-2.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-2xl font-mono text-xs w-64 pointer-events-none">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
            <span className="font-bold text-slate-200 text-[11px]">{hoveredBuilding.id}</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
              hoveredBuilding.floodStatus === 'EXPOSED_TO_FLOOD'
                ? 'bg-red-950 text-red-300 border border-red-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {hoveredBuilding.floodStatus === 'EXPOSED_TO_FLOOD' ? 'INUNDATED' : 'DRY'}
            </span>
          </div>

          <div className="space-y-0.5 text-[10px] text-slate-400">
            <div className="flex justify-between">
              <span>Footprint:</span>
              <span className="text-slate-200">{hoveredBuilding.estimatedAreaM2} m²</span>
            </div>
            <div className="flex justify-between">
              <span>Confidence:</span>
              <span className="text-amber-400 font-semibold">{Math.round(hoveredBuilding.confidence * 100)}%</span>
            </div>
            <div className="pt-0.5 border-t border-slate-800/80 text-[9px] text-slate-400">
              <span className="text-slate-500">Damage: </span>
              <span className="text-slate-300 font-sans">{hoveredBuilding.structuralDamage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="absolute bottom-2 left-3 right-3 z-20 flex items-center justify-between text-[11px] font-mono text-slate-400 pointer-events-none">
        <div className="flex items-center gap-2 p-1.5 rounded bg-slate-950/85 backdrop-blur-sm border border-slate-800/80">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          {cursorCoords ? (
            <span>
              {cursorCoords.lat.toFixed(5)}°N, {cursorCoords.lng.toFixed(5)}°E
            </span>
          ) : (
            <span>Active Sector Tracking</span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 p-1.5 rounded bg-slate-950/85 backdrop-blur-sm border border-slate-800/80 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-cyan-400" />
            <span className="text-slate-300">Flood</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
            <span className="text-slate-300">Dry Structure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-red-500" />
            <span className="text-slate-300">Inundated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
