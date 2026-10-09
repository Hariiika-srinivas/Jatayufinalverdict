with open('/tmp/vercel_bundle.js', 'r') as f:
    text = f.read()

# Let's search for function App or export default
import re

# Look for main render or App component
# In vite react bundle, App is usually near the end
app_pos = text.rfind('function ')
print('Length of bundle:', len(text))

# Let's find all component definitions
comps = re.findall(r'const\s+([A-Za-z0-9_]+)\s*=\s*\(\s*\{[^}]*\}\s*\)\s*=>', text)
print('Components count:', len(comps), comps[:20])

# Let's search for navigation tabs in the main app
tabs_match = re.findall(r'`(DASHBOARD|MAP|SIMULATION|SANDBOX|TASKING|REPORT[^`]*)`', text)
print('Tabs matches:', set(tabs_match))
