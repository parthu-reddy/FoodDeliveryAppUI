import re

with open('src/components/CustomerDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("if (showSettings) {", "if (view === 'settings') {")
content = content.replace("setShowSettings(false)", "setView('home')")

with open('src/components/CustomerDashboard.tsx', 'w') as f:
    f.write(content)
