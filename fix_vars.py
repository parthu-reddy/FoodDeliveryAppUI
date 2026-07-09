import re

with open('src/components/CustomerDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);",
    "const [view, setView] = useState<'home' | 'settings'>('home');"
)
content = content.replace("setIsAccountModalOpen(true)", "setView('settings')")

with open('src/components/CustomerDashboard.tsx', 'w') as f:
    f.write(content)
