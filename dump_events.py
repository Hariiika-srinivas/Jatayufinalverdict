import re
import json

with open('/tmp/vercel_bundle.js', 'r') as f:
    text = f.read()

# Let's find where E0_JK_LATEST_2026 is defined
pos = text.find('E0_JK_LATEST_2026')
if pos != -1:
    # Find the array or object starting before pos
    start = text.rfind('[', 0, pos)
    end = text.find('];', pos)
    if end == -1:
        end = text.find(']', pos)
    print(f"Events array found from {start} to {end}:")
    with open('/tmp/events_raw.js', 'w') as out:
        out.write(text[start:end+1])
    print("Wrote /tmp/events_raw.js, size:", end - start)
