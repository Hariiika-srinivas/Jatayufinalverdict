/**
 * JATAYU — Official Benchmark Datasets
 * Includes NASA-IBM Prithvi EO 2.0 Sen1Floods11 examples and optical aerial chips.
 */

import { DatasetMetadata } from '../types/disaster';

export interface SampleDatasetEntry {
  id: string;
  name: string;
  region: string;
  country: string;
  event: string;
  fileName: string;
  bandCount: number;
  bands: string[];
  dimensions: { width: number; height: number };
  pixelSizeMeters: number;
  crs: string;
  centroid: [number, number];
  bounds: [number, number, number, number];
  acquisitionDate: string;
  description: string;
  isPrithviMultispectral: boolean;
  isOpticalRgb: boolean;
  samplePath: string;
}

export const SAMPLE_DATASETS: SampleDatasetEntry[] = [
  {
    id: 'india-assam-sen1floods11',
    name: 'India — Brahmaputra Basin (Official Prithvi Example)',
    region: 'Assam Province',
    country: 'India',
    event: 'Monsoon Flash Inundation',
    fileName: 'India_900498_S2Hand.tif',
    bandCount: 13,
    bands: [
      'B1 (Coastal)', 'B2 (Blue)', 'B3 (Green)', 'B4 (Red)', 'B5 (VRE1)',
      'B6 (VRE2)', 'B7 (VRE3)', 'B8 (NIR)', 'B8A (Narrow NIR)', 'B9 (Water Vapor)',
      'B10 (Cirrus)', 'B11 (SWIR-1)', 'B12 (SWIR-2)'
    ],
    dimensions: { width: 512, height: 512 },
    pixelSizeMeters: 10,
    crs: 'WGS 84 (EPSG:4326)',
    centroid: [26.7454, 93.7582],
    bounds: [93.7352, 26.7224, 93.7812, 26.7684],
    acquisitionDate: '2019-07-16',
    description: 'Official test image from NASA-IMPACT Sen1Floods11 benchmark. Contains massive riverine inundation across agrarian settlements.',
    isPrithviMultispectral: true,
    isOpticalRgb: true,
    samplePath: '/examples/India_900498_S2Hand.tif'
  },
  {
    id: 'spain-ebro-sen1floods11',
    name: 'Spain — Ebro River Overflow',
    region: 'Zaragoza',
    country: 'Spain',
    event: 'Severe Riverine Overflow',
    fileName: 'Spain_7370579_S2Hand.tif',
    bandCount: 13,
    bands: [
      'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7',
      'B8', 'B8A', 'B9', 'B10', 'B11', 'B12'
    ],
    dimensions: { width: 512, height: 512 },
    pixelSizeMeters: 10,
    crs: 'WGS 84 (EPSG:4326)',
    centroid: [41.6521, -0.8842],
    bounds: [-0.912, 41.631, -0.856, 41.673],
    acquisitionDate: '2018-04-18',
    description: 'Official Sen1Floods11 Spanish test chip covering floodplain inundation and semi-urban agricultural infrastructure.',
    isPrithviMultispectral: true,
    isOpticalRgb: true,
    samplePath: '/examples/Spain_7370579_S2Hand.tif'
  },
  {
    id: 'usa-midwest-sen1floods11',
    name: 'USA — Midwest River Basin Flood',
    region: 'Missouri / Mississippi Basin',
    country: 'United States',
    event: 'Spring Snowmelt Inundation',
    fileName: 'USA_430764_S2Hand.tif',
    bandCount: 13,
    bands: [
      'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7',
      'B8', 'B8A', 'B9', 'B10', 'B11', 'B12'
    ],
    dimensions: { width: 512, height: 512 },
    pixelSizeMeters: 10,
    crs: 'WGS 84 (EPSG:4326)',
    centroid: [38.6270, -90.1994],
    bounds: [-90.23, 38.60, -90.16, 38.65],
    acquisitionDate: '2019-05-24',
    description: 'Official US Midwest flood event capturing extensive overland flow encroaching on commercial and rural developments.',
    isPrithviMultispectral: true,
    isOpticalRgb: true,
    samplePath: '/examples/USA_430764_S2Hand.tif'
  },
  {
    id: 'optical-highres-urban-chip',
    name: 'High-Res Optical Disaster Chip (RGB)',
    region: 'Coastal Urban Zone',
    country: 'Benchmark Area',
    event: 'Structural Exposure Validation',
    fileName: 'Urban_HighRes_Optical.png',
    bandCount: 3,
    bands: ['Red', 'Green', 'Blue'],
    dimensions: { width: 512, height: 512 },
    pixelSizeMeters: 0.5,
    crs: 'WGS 84 (EPSG:4326)',
    centroid: [26.7454, 93.7582],
    bounds: [93.7352, 26.7224, 93.7812, 26.7684],
    acquisitionDate: '2023-09-12',
    description: 'Sub-meter optical imagery chip for testing the separate Building Footprint Pipeline. Demonstrates why 3-band RGB cannot run on Prithvi, but enables high-confidence building extraction.',
    isPrithviMultispectral: false,
    isOpticalRgb: true,
    samplePath: 'synthetic-optical'
  }
];

export function getSampleMetadata(sample: SampleDatasetEntry): DatasetMetadata {
  return {
    id: sample.id,
    name: sample.name,
    fileName: sample.fileName,
    fileSize: 2151620,
    format: sample.bandCount > 3 ? 'GeoTIFF' : 'PNG',
    bandCount: sample.bandCount,
    bands: sample.bands,
    dimensions: sample.dimensions,
    crs: sample.crs,
    bounds: sample.bounds,
    centroid: sample.centroid,
    pixelSizeMeters: sample.pixelSizeMeters,
    acquisitionDate: sample.acquisitionDate,
    sourceSensor: sample.isPrithviMultispectral ? 'Sentinel-2 MSI' : 'High-Res Aerial Sensor',
    isValidForPrithvi: sample.isPrithviMultispectral,
    isValidForBuildings: sample.isOpticalRgb,
    validationError: !sample.isPrithviMultispectral
      ? '3-band RGB imagery cannot run on Prithvi-EO-2.0 (requires 6 multispectral bands). Use Building Footprint Pipeline.'
      : undefined
  };
}
