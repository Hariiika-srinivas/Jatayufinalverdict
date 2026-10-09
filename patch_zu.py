with open('src/bundle.js', 'r') as f:
    text = f.read()

# 1. Update Ye props
ye_old = """  Ye = ({
    currentEvent: e,
    onSelectEvent: t,
    activeTab: n,
    onSelectTab: r,
    isMissionRunning: i,
    onRunMission: a,
    monitorMode: o,
    onToggleMonitor: s,
    newAcquisitionAlert: c,
    onOpenReport: l,"""

ye_new = """  Ye = ({
    currentEvent: e,
    onSelectEvent: t,
    activeTab: n,
    onSelectTab: r,
    isMissionRunning: i,
    onRunMission: a,
    monitorMode: o,
    onToggleMonitor: s,
    newAcquisitionAlert: c,
    onOpenReport: l,
    predictiveRisk: pRisk,
    onOpenRiskModal: onRiskClick,"""

if ye_old in text:
    text = text.replace(ye_old, ye_new, 1)
    print('Updated Ye props!')
else:
    print('Error: ye_old not found!')

# 2. Add Risk button before Task Virtual Drone in Ye
btn_old = """                (0, L.jsxs)(`button`, {
                  onClick: a,
                  disabled: i,"""

btn_new = """                (0, L.jsxs)(`button`, {
                  onClick: onRiskClick,
                  title: `Predictive Pre-Disaster Risk Monitor: Multi-Source Hazard Assessment`,
                  className: `hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold font-mono-code transition-all cursor-pointer ` + (pRisk && pRisk.score >= 70 ? `bg-[#7A0A0A]/60 border-[#FF2A1F] text-[#FF2A1F] shadow-[0_0_10px_rgba(255,42,31,0.3)]` : pRisk && pRisk.score >= 50 ? `bg-[#17171C] border-[#FFB300] text-[#FFB300]` : `bg-[#17171C] border-[#00E676] text-[#00E676]`),
                  children: [
                    (0, L.jsx)(`span`, {
                      className: `w-2 h-2 rounded-full animate-ping ` + (pRisk && pRisk.score >= 70 ? `bg-[#FF2A1F]` : `bg-[#FFB300]`),
                    }),
                    (0, L.jsxs)(`span`, {
                      children: [`Risk: `, pRisk ? pRisk.score : 74, `%`],
                    }),
                  ],
                }),
                (0, L.jsxs)(`button`, {
                  onClick: a,
                  disabled: i,"""

if btn_old in text:
    text = text.replace(btn_old, btn_new, 1)
    print('Added Predictive Risk button in Header!')
else:
    print('Error: btn_old not found!')

# 3. In zU(), add predictive state and auto-trigger
zu_state_old = """function zU() {
  let [e, t] = (0, v.useState)(A[0]),
    [n, r] = (0, v.useState)(`mission_control`),
    [i, a] = (0, v.useState)(!1),
    [o, s] = (0, v.useState)(RU),
    [c, l] = (0, v.useState)(9),
    [u, d] = (0, v.useState)(!0),
    [f, p] = (0, v.useState)(!1),
    [m, h] = (0, v.useState)(null),
    [g, _] = (0, v.useState)(!1);"""

zu_state_new = """function zU() {
  let [e, t] = (0, v.useState)(A[0]),
    [n, r] = (0, v.useState)(`mission_control`),
    [i, a] = (0, v.useState)(!1),
    [o, s] = (0, v.useState)(RU),
    [c, l] = (0, v.useState)(9),
    [u, d] = (0, v.useState)(!0),
    [f, p] = (0, v.useState)(!1),
    [m, h] = (0, v.useState)(null),
    [g, _] = (0, v.useState)(!1),
    [peRisk, setPeRisk] = (0, v.useState)({
      score: 74,
      level: `HIGH`,
      threshold: 65,
      autoTriggerArmed: true,
      lastTrigger: 0,
      cooldownSec: 180,
      isMuted: false,
    }),
    [riskModalOpen, setRiskModalOpen] = (0, v.useState)(false);

  (0, v.useEffect)(() => {
    let newScore = 74;
    let newLevel = `HIGH`;
    if (e.is_normal_no_flood) {
      newScore = 18;
      newLevel = `LOW`;
    } else if (e.id.includes(`NEPAL`) || e.id.includes(`TRISHULI`)) {
      newScore = 84;
      newLevel = `CRITICAL`;
    } else if (e.id.includes(`NURISTAN`) || e.id.includes(`ASSAM`)) {
      newScore = 76;
      newLevel = `HIGH`;
    }
    setPeRisk((prev) => ({ ...prev, score: newScore, level: newLevel }));

    let now = Date.now();
    if (
      newScore >= peRisk.threshold &&
      peRisk.autoTriggerArmed &&
      !i &&
      now - peRisk.lastTrigger > peRisk.cooldownSec * 1000
    ) {
      setPeRisk((prev) => ({ ...prev, lastTrigger: now }));
      playDemoEarlyWarningTone(peRisk.isMuted);
      setTimeout(() => { y(); }, 500);
    }
  }, [e.id, peRisk.threshold, peRisk.autoTriggerArmed]);"""

if zu_state_old in text:
    text = text.replace(zu_state_old, zu_state_new, 1)
    print('Added predictive state and auto-trigger useEffect to zU!')
else:
    print('Error: zu_state_old not found!')

# 4. Pass props to Ye in zU() and render PredictiveRiskModal
ye_call_old = """      (0, L.jsx)(Ye, {
        currentEvent: e,
        onSelectEvent: (e) => {
          t(e);
        },
        activeTab: n,
        onSelectTab: (e) => r(e),
        isMissionRunning: i,
        onRunMission: y,
        monitorMode: u,
        onToggleMonitor: () => d(!u),
        newAcquisitionAlert: f,
        onOpenReport: () => _(!0),
      }),"""

ye_call_new = """      (0, L.jsx)(Ye, {
        currentEvent: e,
        onSelectEvent: (e) => {
          t(e);
        },
        activeTab: n,
        onSelectTab: (e) => r(e),
        isMissionRunning: i,
        onRunMission: y,
        monitorMode: u,
        onToggleMonitor: () => d(!u),
        newAcquisitionAlert: f,
        onOpenReport: () => _(!0),
        predictiveRisk: peRisk,
        onOpenRiskModal: () => setRiskModalOpen(true),
      }),
      riskModalOpen &&
        (0, L.jsx)(PredictiveRiskModal, {
          currentEvent: e,
          predictiveRisk: peRisk,
          setPredictiveRisk: setPeRisk,
          onClose: () => setRiskModalOpen(false),
          onManualTriggerDrone: y,
        }),"""

if ye_call_old in text:
    text = text.replace(ye_call_old, ye_call_new, 1)
    print('Passed predictive props to Ye and rendered PredictiveRiskModal!')
else:
    print('Error: ye_call_old not found!')

with open('src/bundle.js', 'w') as f:
    f.write(text)

print('Patching complete!')
