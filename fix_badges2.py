import glob
import re

pink_badge_classes = "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] uppercase tracking-wider"

# CustomerDashboard.tsx
with open("src/components/CustomerDashboard.tsx", "r") as f:
    content = f.read()

# Fix order history status in CustomerDashboard
content = re.sub(
    r"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'",
    "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)]' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)]",
    content
)

# Replace existing 8px shadow with 12px shadow
content = content.replace("shadow-[0_0_8px_rgba(244,63,94,0.3)] dark:shadow-[0_0_8px_rgba(244,63,94,0.4)]", "shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)]")

with open("src/components/CustomerDashboard.tsx", "w") as f:
    f.write(content)

# DeliveryDashboard.tsx
with open("src/components/DeliveryDashboard.tsx", "r") as f:
    content = f.read()

content = re.sub(
    r"bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-\[#f0ede6\] px-3 py-1 rounded-full text-\[10px\] font-black uppercase tracking-wider",
    "px-3 py-1 rounded-full text-[10px] font-black " + pink_badge_classes,
    content
)

content = re.sub(
    r"bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-\[#f0ede6\] px-2 py-0\.5 rounded-md text-\[9px\] font-black uppercase tracking-wider",
    "px-2 py-0.5 rounded-md text-[9px] font-black " + pink_badge_classes,
    content
)

# Also check for other badges
content = re.sub(
    r"bg-slate-200 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full text-\[10px\] font-black uppercase tracking-wider",
    "px-3 py-1 rounded-full text-[10px] font-black " + pink_badge_classes,
    content
)

with open("src/components/DeliveryDashboard.tsx", "w") as f:
    f.write(content)

# OrderHistory.tsx
with open("src/components/OrderHistory.tsx", "r") as f:
    content = f.read()

content = content.replace("rounded-full text-[10px] font-bold tracking-wider rounded-md", "rounded-md text-[10px] font-bold tracking-wider")
content = content.replace("shadow-[0_0_8px_rgba(244,63,94,0.3)] dark:shadow-[0_0_8px_rgba(244,63,94,0.4)]", "shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)]")

with open("src/components/OrderHistory.tsx", "w") as f:
    f.write(content)

# RestaurantDashboard.tsx
with open("src/components/RestaurantDashboard.tsx", "r") as f:
    content = f.read()

content = content.replace("shadow-[0_0_8px_rgba(244,63,94,0.3)] dark:shadow-[0_0_8px_rgba(244,63,94,0.4)]", "shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)]")
content = re.sub(
    r"bg-emerald-500/15 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20 uppercase",
    pink_badge_classes,
    content
)
content = re.sub(
    r"bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 uppercase",
    pink_badge_classes,
    content
)

with open("src/components/RestaurantDashboard.tsx", "w") as f:
    f.write(content)

print("Done phase 2")
