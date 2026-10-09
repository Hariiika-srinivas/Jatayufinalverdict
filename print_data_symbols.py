with open('/tmp/vercel_bundle.js', 'r') as f:
    text = f.read()

import re

for name in ['A', 'RU', 'j', 'ee', 'jd']:
    pos = list(re.finditer(r'\b' + name + r'\s*=', text))
    print(f'=== Symbol {name} ({len(pos)} matches) ===')
    for p in pos[-2:]:
        start = p.start()
        print(f'At {start}: {text[start:start+250]}...\n')
