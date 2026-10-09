import re

with open('/tmp/vercel_bundle.js', 'r') as f:
    text = f.read()

# Find strings with location_name or title
locs = re.findall(r'location_name:[`"\']([^`"\']+)[`"\']', text)
print('Locations found:', locs)

# Find disaster events
events = re.findall(r'id:[`"\']([^`"\']+)[`"\'],name:[`"\']([^`"\']+)[`"\']', text)
print('Events:', events[:10])

# Find headers and navigation tabs
nav = re.findall(r'["\'](DASHBOARD|MAP[^"\']*|SIMULATION[^"\']*|TASKING[^"\']*|REPORT[^"\']*)["\']', text)
print('Navigation:', set(nav))

# Let's search for "Virtual Drone" in text
drone_snippets = [m.start() for m in re.finditer(r'Virtual Drone', text)]
print(f'Found {len(drone_snippets)} references to Virtual Drone.')
for pos in drone_snippets[:5]:
    snippet = text[max(0, pos-100):min(len(text), pos+150)]
    print('--- SNIPPET ---')
    print(snippet)
