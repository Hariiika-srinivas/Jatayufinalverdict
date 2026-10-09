with open('/tmp/vercel_bundle.js', 'r') as f:
    text = f.read()

import re

# Find where A is defined (the disaster events array)
# It's passed to useState(A[0]) in zU
# Let's search for "const A = [" or "let A = [" or "A=["
# In minified bundle, it could be `A=[{id:`
match_A = re.search(r'\bA=\[(\{id:[`"\']E0_JK_LATEST_2026.+?\}\])\];', text)
if match_A:
    print('Found A definition! Length:', len(match_A.group(0)))
else:
    # let's search for E0_JK_LATEST_2026 definition
    p = text.find('E0_JK_LATEST_2026')
    b_start = text.rfind('[', 0, p)
    var_start = text.rfind(';', 0, b_start)
    print('Context around A:', text[var_start:var_start+200])

# Find RU (initial logs)
p_ru = text.find('RU=[')
if p_ru == -1:
    p_ru = text.find('RU=')
print('Context around RU:', text[p_ru:p_ru+200] if p_ru != -1 else 'Not found')
