import re

with open('src/components/CustomerDashboard.tsx', 'r') as f:
    content = f.read()

# Add view state
content = content.replace("const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);", "const [view, setView] = useState<'home' | 'settings'>('home');")

# Find the profile button to open settings
content = content.replace("onClick={() => setIsAccountModalOpen(true)}", "onClick={() => setView('settings')}")

# Add conditional rendering
# We need to wrap the main dashboard content if view === 'home'
# Currently, CustomerDashboard returns a div with "w-full h-full flex flex-col".
# Let's find where to insert the conditional render.

