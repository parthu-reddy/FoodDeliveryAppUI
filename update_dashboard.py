import re

with open('src/components/CustomerDashboard.tsx', 'r') as f:
    content = f.read()

# Add view state
content = content.replace(
    "const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);",
    "const [view, setView] = useState<'home' | 'settings'>('home');"
)

# Open settings instead of modal
content = content.replace(
    "onClick={() => setIsAccountModalOpen(true)}",
    "onClick={() => setView('settings')}"
)

# Inject CustomerSettings import
if "import CustomerAccountModal" not in content and "import CustomerSettings" not in content:
    content = content.replace(
        "import CustomerAccountModal from './CustomerAccountModal';",
        "import CustomerSettings from './CustomerSettings';"
    ) # just in case
    
    # Actually wait, CustomerAccountModal is currently imported in App.tsx or inside CustomerDashboard?
    # Wait, let me check where CustomerAccountModal is used. It's used in App.tsx or CustomerDashboard.tsx?

