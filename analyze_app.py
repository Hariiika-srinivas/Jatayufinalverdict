with open('/tmp/vercel_bundle.js', 'r') as f:
    text = f.read()

import re

# Find all top-level variables and functions from character 220000 onwards
sub = text[220000:]
declarations = re.findall(r'(?:const|let|var|function)\s+([A-Za-z0-9_]+)\s*=', sub)
print('Top level variables found:', len(declarations), declarations[:40])

# Find all exported or major objects
datasets = re.findall(r'\b([A-Z0-9_]{1,5})\s*=\s*\[\{', sub)
print('Arrays of objects:', datasets)
