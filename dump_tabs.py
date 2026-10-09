with open('/tmp/vercel_bundle.js', 'r') as f:
    text = f.read()

import re

# Look for button texts or tab texts
# e.g., children:`Dashboard` or similar
tab_buttons = re.findall(r'children:\[?[`"\']([A-Z\s&/]{3,30})[`"\']', text)
print('Possible tab/button labels:', set(tab_buttons[:50]))

# Search for the string "See the Disaster"
tagline_pos = text.find('See the Disaster')
if tagline_pos != -1:
    print('Tagline snippet:')
    print(text[tagline_pos-200:tagline_pos+800])
