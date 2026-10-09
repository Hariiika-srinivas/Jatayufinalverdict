import re

with open('/tmp/vercel_bundle.js', 'r') as f:
    text = f.read()

for p in re.finditer(r'\bHd\s*=\s*(?:\([^)]*\)\s*=>|function)', text):
    start = p.start()
    print('Found Hd definition at', start)
    print(text[start:start+300])
