import glob
import re

files = glob.glob("src/components/*.tsx")

pink_shadow = "hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # floating active orders slider
    content = content.replace(
        "className=\"shrink-0 w-[85%] sm:w-[340px] snap-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[20px] shadow-2xl shadow-slate-900/10 dark:shadow-black/40 border border-rose-500/20 dark:border-rose-500/30 p-3.5 text-left cursor-pointer transition-transform active:scale-[0.98]\"",
        f"className=\"shrink-0 w-[85%] sm:w-[340px] snap-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[20px] shadow-2xl shadow-slate-900/10 dark:shadow-black/40 border border-rose-500/20 dark:border-rose-500/30 p-3.5 text-left cursor-pointer transition-all active:scale-[0.98] {pink_shadow}\""
    )

    # Restaurant card
    content = re.sub(
        r'hover:shadow-\[0_20px_45px_rgba\(239,68,68,0\.18\)\] hover:border-red-400/40',
        pink_shadow,
        content
    )
    content = re.sub(
        r'dark:hover:shadow-\[0_20px_45px_rgba\(239,68,68,0\.25\)\] dark:hover:border-red-500/40',
        '',
        content
    )

    with open(file_path, "w") as f:
        f.write(content)

print("Applied some hover shadows")
