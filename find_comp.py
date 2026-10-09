import re

with open('/tmp/vercel_bundle.js', 'r') as f:
    text = f.read()

m = re.search(r'n===`mission_control`&&\(0,L\.jsx\)\(([A-Za-z0-9_]+),', text)
if m:
    comp = m.group(1)
    print('Mission control component name:', comp)
    for p in re.finditer(r'(?:const|let|var)\s+' + comp + r'\s*=', text):
        start = p.start()
        print('Found definition at', start)
        print(text[start:start+400])
