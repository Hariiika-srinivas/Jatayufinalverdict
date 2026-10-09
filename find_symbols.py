import re

with open('/tmp/vercel_bundle.js', 'r') as f:
    text = f.read()

# Let's locate the definitions of:
# Ye, Hd, NU, PU, FU, IU, LU, RU, A
# In javascript bundles, functions are defined as `const Ye=` or `function Ye` or `let Ye=` or `var Ye=`
comp_names = ['Ye', 'Hd', 'NU', 'PU', 'FU', 'IU', 'LU', 'RU', 'A', 'Id', 'Ld', 'Nd', 'Pd']

for name in comp_names:
    matches = list(re.finditer(r'(?:const|let|var)\s+' + name + r'\s*=', text))
    if not matches:
        matches = list(re.finditer(r'function\s+' + name + r'\s*\(', text))
    if not matches:
        matches = list(re.finditer(r'\b' + name + r'\s*=\s*(?:function|\([^)]*\)\s*=>)', text))
    
    print(f'Symbol {name}: {len(matches)} matches')
    for m in matches[:2]:
        start = m.start()
        print(f'  at {start}: {text[start:start+120]}...')
