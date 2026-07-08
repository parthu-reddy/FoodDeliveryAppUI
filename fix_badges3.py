import re

pink_badge_classes = "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] uppercase tracking-wider"

with open("src/components/RestaurantDashboard.tsx", "r") as f:
    content = f.read()

content = re.sub(
    r"'bg-orange-500/10 text-orange-500 border-orange-500/25 flex items-center gap-1'",
    "'" + pink_badge_classes + " flex items-center gap-1'",
    content
)

content = re.sub(
    r"'bg-yellow-500/10 text-yellow-500 border-yellow-500/25'",
    "'" + pink_badge_classes + "'",
    content
)

with open("src/components/RestaurantDashboard.tsx", "w") as f:
    f.write(content)

with open("src/components/CustomerDashboard.tsx", "r") as f:
    content = f.read()

content = re.sub(
    r"'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'",
    "'" + pink_badge_classes + "' : '" + pink_badge_classes + "'",
    content
)

with open("src/components/CustomerDashboard.tsx", "w") as f:
    f.write(content)

print("Badges 3 updated")
