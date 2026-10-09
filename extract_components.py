with open('/tmp/vercel_bundle.js', 'r') as f:
    text = f.read()

import re

# Find all component functions (e.g. const Foo = ({...}) => ...)
# Let's search for React components
# Often formatted like: const Name = ({...}) => { ... } or function Name
matches = [m.start() for m in re.finditer(r'=\(({[a-zA-Z0-9_,:\s]*})\)=>\{', text)]
print('Component pattern matches:', len(matches))

# Let's inspect the main App component at the end of the file
app_start = text.rfind('function ')
print('Main App start around:', app_start)
print(text[app_start:app_start+2000])
