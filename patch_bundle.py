import re

with open('src/bundle.js', 'r') as f:
    text = f.read()

# 1. Add audio helper and Modal component before zU
helper_and_modal = """
// JATAYU 2.0 Audio Alert Helper
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

// JATAYU 2.0 Predictive Risk Modal
const PredictiveRiskModal = ({ currentEvent, predictiveRisk, setPredictiveRisk, onClose, onManualTriggerDrone }) => {
  return (0, L.jsxs)('div', {
    className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans text-xs select-none',
    children: [
      (0, L.jsxs)('div', {
        className: 'relative w-full max-w-xl bg-[#0F0F12] border border-[#26262E] rounded-xl shadow-2xl overflow-hidden flex flex-col',
        children: [
          (0, L.jsxs)('div', {
            className: 'px-5 py-3.5 border-b border-[#26262E] flex items-center justify-between bg-[#17171C]',
            children: [
              (0, L.jsxs)('div', {
                className: 'flex items-center gap-2.5',
                children: [
                  (0, L.jsx)('span', { className: 'w-2.5 h-2.5 rounded-full bg-[#E10600] animate-ping' }),
                  (0, L.jsxs)('div', {
                    children: [
                      (0, L.jsx)('h3', {
                        className: 'text-sm font-bold text-white uppercase tracking-wider font-display',
                        children: 'Predictive Pre-Disaster Early Warning Monitor'
                      }),
                      (0, L.jsx)('p', {
                        className: 'text-[11px] text-[#A1A1AA]',
                        children: 'Continuous Multi-Source Hazard Assessment & Autonomous Drone Activation'
                      })
                    ]
                  })
                ]
              }),
              (0, L.jsx)('button', {
                onClick: onClose,
                className: 'px-2 py-1 text-[#A1A1AA] hover:text-white hover:bg-[#26262E] rounded transition text-xs font-mono-code',
                children: '✕'
              })
            ]
          }),
          (0, L.jsxs)('div', {
            className: 'p-5 space-y-4 text-[#F4F4F5] overflow-y-auto max-h-[80vh]',
            children: [
              (0, L.jsxs)('div', {
                className: 'p-3 rounded-lg border border-[#26262E] bg-[#17171C]/70 flex items-center justify-between',
                children: [
                  (0, L.jsxs)('div', {
                    children: [
                      (0, L.jsx)('div', { className: 'text-[10px] uppercase font-mono-code text-[#A1A1AA]', children: 'Monitoring AOI' }),
                      (0, L.jsx)('div', { className: 'text-xs font-semibold text-white mt-0.5', children: currentEvent.location_name }),
                      (0, L.jsxs)('div', { className: 'text-[10px] text-[#A1A1AA] mt-0.5', children: ['Coords: ', currentEvent.center_lat, '°N, ', currentEvent.center_lon, '°E'] })
                    ]
                  }),
                  (0, L.jsxs)('div', {
                    className: 'text-right',
                    children: [
                      (0, L.jsx)('div', { className: 'text-[10px] uppercase font-mono-code text-[#A1A1AA]', children: 'Predictive Risk Index' }),
                      (0, L.jsxs)('div', {
                        className: 'text-2xl font-bold font-mono-code ' + (predictiveRisk.score >= 70 ? 'text-[#FF2A1F]' : predictiveRisk.score >= 50 ? 'text-[#FFB300]' : 'text-[#00E676]'),
                        children: [predictiveRisk.score, (0, L.jsx)('span', { className: 'text-xs font-normal text-[#A1A1AA]', children: '/100' })]
                      }),
                      (0, L.jsxs)('span', {
                        className: 'text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ' + (predictiveRisk.score >= 70 ? 'bg-[#7A0A0A] text-[#FF2A1F]' : predictiveRisk.score >= 50 ? 'bg-[#3E2723] text-[#FFB300]' : 'bg-[#1B5E20] text-[#00E676]'),
                        children: [predictiveRisk.level, ' RISK']
                      })
                    ]
                  })
                ]
              }),
              (0, L.jsxs)('div', {
                className: 'p-3 rounded-lg border border-[#26262E] bg-[#17171C]/40 space-y-2',
                children: [
                  (0, L.jsxs)('div', {
                    className: 'flex justify-between items-center',
                    children: [
                      (0, L.jsx)('span', { className: 'font-semibold text-white text-[11px]', children: 'Autonomous Virtual Drone Trigger Threshold:' }),
                      (0, L.jsxs)('span', { className: 'font-mono-code font-bold text-[#FFB300] bg-[#26262E] px-2 py-0.5 rounded text-xs', children: [predictiveRisk.threshold, '%'] })
                    ]
                  }),
                  (0, L.jsx)('input', {
                    type: 'range',
                    min: '40',
                    max: '90',
                    step: '5',
                    value: predictiveRisk.threshold,
                    onChange: (e) => setPredictiveRisk(prev => ({ ...prev, threshold: parseInt(e.target.value) })),
                    className: 'w-full h-1.5 bg-[#26262E] rounded-lg appearance-none cursor-pointer accent-[#E10600]'
                  }),
                  (0, L.jsxs)('div', {
                    className: 'flex justify-between text-[9px] text-[#A1A1AA]',
                    children: [
                      (0, L.jsx)('span', { children: '40% (Sensitive)' }),
                      (0, L.jsx)('span', { className: 'text-white font-semibold', children: 'Default: 65% (Demo Threshold)' }),
                      (0, L.jsx)('span', { children: '90% (Extreme Only)' })
                    ]
                  }),
                  (0, L.jsxs)('div', {
                    className: 'flex items-center justify-between pt-2 border-t border-[#26262E] text-[11px]',
                    children: [
                      (0, L.jsx)('span', { className: 'text-[#A1A1AA]', children: 'Autonomous Deployment Protocol:' }),
                      (0, L.jsx)('button', {
                        onClick: () => setPredictiveRisk(prev => ({ ...prev, autoTriggerArmed: !prev.autoTriggerArmed })),
                        className: 'px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ' + (predictiveRisk.autoTriggerArmed ? 'bg-[#1B5E20] text-[#00E676] border border-[#00E676]/40' : 'bg-[#26262E] text-[#A1A1AA]'),
                        children: predictiveRisk.autoTriggerArmed ? 'ARMED (Auto-Launch)' : 'DISARMED (Manual Only)'
                      })
                    ]
                  })
                ]
              }),
              (0, L.jsxs)('div', {
                className: 'space-y-1.5',
                children: [
                  (0, L.jsx)('div', { className: 'text-[11px] font-semibold text-white uppercase tracking-wider font-mono-code', children: 'Multi-Source Vulnerability Factors' }),
                  (0, L.jsx)('div', {
                    className: 'space-y-1 font-mono-code text-[10px]',
                    children: [
                      { name: 'Weather & 48h Precip', impact: '68mm rain accumulation + 85mm 48h forecast', weight: '35%', score: '78/100' },
                      { name: 'Soil Saturation', impact: '82% volumetric moisture restricts infiltration', weight: '25%', score: '82/100' },
                      { name: 'Terrain Geomorphology', impact: 'Low-lying basin & DEM runoff pooling', weight: '20%', score: '72/100' },
                      { name: 'Asphalt & Infrastructure', impact: 'Verified subgrade erosion & roadbed cracks', weight: '20%', score: '65/100' }
                    ].map((f, i) => (0, L.jsxs)('div', {
                      className: 'p-2 rounded bg-[#17171C]/50 border border-[#26262E] flex items-center justify-between',
                      children: [
                        (0, L.jsxs)('div', {
                          children: [
                            (0, L.jsx)('span', { className: 'text-white font-semibold', children: f.name }),
                            (0, L.jsx)('div', { className: 'text-[#A1A1AA] font-sans text-[10px]', children: f.impact })
                          ]
                        }),
                        (0, L.jsxs)('div', {
                          className: 'text-right',
                          children: [
                            (0, L.jsx)('div', { className: 'text-[#00E676] font-bold', children: f.score }),
                            (0, L.jsxs)('div', { className: 'text-[#A1A1AA] text-[9px]', children: ['Weight: ', f.weight] })
                          ]
                        })
                      ]
                    }, i))
                  })
                ]
              }),
              (0, L.jsxs)('div', {
                className: 'p-2.5 rounded bg-[#17171C]/40 border border-[#26262E] text-[10px] text-[#A1A1AA] space-y-1',
                children: [
                  (0, L.jsx)('div', { className: 'font-semibold text-white', children: 'Authoritative Feeds & Freshness' }),
                  (0, L.jsx)('div', { children: '• Weather NWP: Open-Meteo ECMWF/GFS Blend (Observation: Fresh)' }),
                  (0, L.jsx)('div', { children: '• Elevation & Slope: Copernicus DEM 30m GLO (Authoritative)' }),
                  (0, L.jsx)('div', { children: '• Climate Context: ERA5 30-Year Extreme Precipitation Anomaly (+18%)' }),
                  (0, L.jsx)('div', { children: '• Infrastructure: PWD Road Network & Subgrade Inspection Registry' })
                ]
              })
            ]
          }),
          (0, L.jsxs)('div', {
            className: 'px-5 py-3 border-t border-[#26262E] bg-[#17171C] flex items-center justify-between',
            children: [
              (0, L.jsxs)('button', {
                onClick: () => setPredictiveRisk(prev => ({ ...prev, isMuted: !prev.isMuted })),
                className: 'text-[#A1A1AA] hover:text-white text-[11px] font-mono-code transition',
                children: [predictiveRisk.isMuted ? '🔇 Audio Muted' : '🔊 Demo Audio Alert Enabled']
              }),
              (0, L.jsxs)('div', {
                className: 'flex gap-2',
                children: [
                  (0, L.jsx)('button', {
                    onClick: () => { onClose(); onManualTriggerDrone(); },
                    className: 'px-3 py-1.5 rounded-lg bg-[#E10600] hover:bg-[#FF2A1F] text-white font-medium text-xs transition cursor-pointer',
                    children: 'Task Virtual Drone Now'
                  }),
                  (0, L.jsx)('button', {
                    onClick: onClose,
                    className: 'px-3 py-1.5 rounded-lg bg-[#26262E] hover:bg-[#33333D] text-white text-xs transition cursor-pointer',
                    children: 'Close'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
};
"""

# Let's insert helper_and_modal right before function zU()
pos_zu = text.rfind('function zU() {')
if pos_zu != -1:
    text = text[:pos_zu] + helper_and_modal + '\n' + text[pos_zu:]
    print('Inserted helper and PredictiveRiskModal before function zU()!')
else:
    print('Error: function zU() not found!')

with open('src/bundle.js', 'w') as f:
    f.write(text)
print('Updated src/bundle.js')
