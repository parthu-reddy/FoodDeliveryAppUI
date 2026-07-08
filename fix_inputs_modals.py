with open("src/components/CustomerDashboard.tsx", "r") as f:
    content = f.read()

# Make the inputs completely solid and not transparent
content = content.replace("cursor-not-allowed opacity-75", "cursor-not-allowed bg-slate-100 dark:bg-slate-800")

with open("src/components/CustomerDashboard.tsx", "w") as f:
    f.write(content)
