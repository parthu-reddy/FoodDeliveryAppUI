import glob
import re

files = glob.glob("src/components/*.tsx")

pink_badge_classes = "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.3)] dark:shadow-[0_0_8px_rgba(244,63,94,0.4)] uppercase"

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Customer Dashboard live feed badges
    content = content.replace(
        "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20 uppercase tracking-wider",
        pink_badge_classes + " tracking-wider"
    )

    # Customer Dashboard order history modal
    content = re.sub(
        r"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'",
        "' + pink_badge_classes + '",
        content
    )

    # Restaurant Dashboard placed lane
    content = re.sub(
        r"'bg-amber-500/15 text-amber-550 dark:text-amber-400 border-amber-500/20'",
        "'" + pink_badge_classes + "'",
        content
    )
    
    # Restaurant Dashboard accepted lane
    content = re.sub(
        r"'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'",
        "'" + pink_badge_classes + "'",
        content
    )

    # Restaurant Dashboard ready lane
    content = re.sub(
        r"'bg-emerald-500/15 text-emerald-600 border-emerald-500/20'",
        "'" + pink_badge_classes + "'",
        content
    )
    
    # Delivery Dashboard job status
    content = re.sub(
        r"bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-[#f0ede6] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
        "px-3 py-1 rounded-full text-[10px] font-black tracking-wider " + pink_badge_classes,
        content
    )
    
    # OrderHistory.tsx
    content = re.sub(
        r"className={`px-2\.5 py-1 rounded-full text-\[10px\] font-bold uppercase tracking-wider border \$\{getStatusColor\(order\.status\)\}`}",
        "className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider rounded-md " + pink_badge_classes + "`}",
        content
    )
    
    with open(file_path, "w") as f:
        f.write(content)

print("Badges updated")
