import re

with open('src/bundle.js', 'r') as f:
    text = f.read()

# Let's write the predictive risk engine code to inject into bundle.js
# We can define a helper window.__JATAYU_PREDICTIVE__ or top-level helper functions right before function zU()

predictive_code = """
// JATAYU 2.0 Predictive Risk Engine & Autonomous Virtual Drone Controller
let __predictiveState = {
  score: 74,
  level: 'HIGH',
  threshold: 65,
  autoTriggerArmed: true,
  lastTriggerTime: 0,
  cooldownSec: 180,
  isMuted: false,
  sources: [
    { name: 'Open-Meteo Global NWP', product: 'Hourly Precipitation & Forecast', status: 'fresh', time: '10 mins ago', res: '0.1° (~11 km)' },
    { name: 'Copernicus DEM (GLO-30)', product: 'Digital Surface Model Elevation & Slope', status: 'fresh', time: 'Static 30m', res: '30m GSD' },
    { name: 'Copernicus Climate (ERA5)', product: '30-Yr Extreme Precip Baseline Anomaly (+18%)', status: 'fresh', time: 'Baseline', res: '0.25° (~28 km)' },
    { name: 'Regional Highway Inspection', product: 'Pavement & Road Subgrade Vulnerability', status: 'fresh', time: '2 weeks ago', res: 'Corridor Level' }
  ],
  factors: [
    { name: 'Precipitation & 48h Forecast', impact: '68mm 24h + 85mm 48h forecast exceeds saturation threshold', contribution: 78, weight: '35%' },
    { name: 'Soil Saturation Index', impact: '82% volumetric soil moisture restricts infiltration', contribution: 82, weight: '25%' },
    { name: 'Terrain Geomorphology', impact: 'Low-lying alluvial drainage basin creates pooling', contribution: 72, weight: '20%' },
    { name: 'Asphalt & Embankment Condition', impact: 'Verified subgrade erosion and shoulder cracking on causeway', contribution: 65, weight: '20%' }
  ]
};

function playDemoEarlyWarningTone(muted) {
  if (muted || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.setValueAtTime(780, now + 0.25);
    osc.frequency.setValueAtTime(580, now + 0.50);
    osc.frequency.setValueAtTime(780, now + 0.75);
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain.gain.setValueAtTime(0.12, now + 0.85);
    gain.gain.linearRampToValueAtTime(0.0, now + 1.10);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.15);
  } catch (e) {
    console.warn('Audio alert unavailable:', e);
  }
}
"""

print('Predictive code prepared.')
