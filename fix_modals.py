import re

with open("src/components/CustomerDashboard.tsx", "r") as f:
    content = f.read()

# Fix Account and Address Modals
content = content.replace("flex flex-col max-h-[85vh] overflow-hidden", "flex flex-col h-auto max-h-[85vh] overflow-hidden")
# Make sure we don't have hardcoded h-[85vh] anywhere else for the modals
content = content.replace("h-[85vh]", "h-auto max-h-[85vh]")

with open("src/components/CustomerDashboard.tsx", "w") as f:
    f.write(content)

print("Modals fixed")
