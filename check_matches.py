import re

with open('src/bundle.js', 'r') as f:
    text = f.read()

# 1. Let's inspect Ye definition
ye_match = re.search(r'Ye\s*=\s*\(\{\s*currentEvent:e,\s*onSelectEvent:t,\s*activeTab:n,\s*onSelectTab:r,\s*isMissionRunning:i,\s*onRunMission:a,\s*monitorMode:o,\s*onToggleMonitor:s,\s*newAcquisitionAlert:c,\s*onOpenReport:l', text)
if not ye_match:
    print('Ye match not found, looking for alternative...')
else:
    print('Found Ye header props!')

# 2. Let's inspect zU definition
zu_match = re.search(r'function zU\(\)\s*\{', text)
if not zu_match:
    print('zU match not found!')
else:
    print('Found zU definition!')
