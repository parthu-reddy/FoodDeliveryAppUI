with open("src/components/CustomerDashboard.tsx", "r") as f:
    content = f.read()

# Fix the broken template literal
content = content.replace(
    "`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${order.status === 'delivered' ? '' + pink_badge_classes + '}`",
    "`px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] tracking-wider`"
)

with open("src/components/CustomerDashboard.tsx", "w") as f:
    f.write(content)

print("Syntax fixed")
