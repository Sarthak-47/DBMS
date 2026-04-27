import urllib.request
import json
import sys

data = json.dumps({
    'email': 'ramesh@srmist.edu.in',
    'password': 'password123'
}).encode()

req = urllib.request.Request(
    'http://localhost:8001/auth/login',
    data=data,
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as r:
        print(f"Status: {r.getcode()}")
        print(r.read().decode())
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode())
