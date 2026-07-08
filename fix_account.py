import re

with open("src/components/CustomerDashboard.tsx", "r") as f:
    content = f.read()

content = content.replace('onChange={(e) => setEditName(e.target.value)}', 'readOnly')
content = content.replace('onChange={(e) => setEditPhone(e.target.value)}', 'readOnly')
content = content.replace('focus:outline-none focus:border-rose-500', 'cursor-not-allowed opacity-75')

with open("src/components/CustomerDashboard.tsx", "w") as f:
    f.write(content)

print("Done")
