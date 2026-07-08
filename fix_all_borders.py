import glob
import re

files = glob.glob("src/components/*.tsx")

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Change all light mode borders to rose/pink
    content = re.sub(r'border-slate-200/(\d+)', r'border-rose-500/20', content)
    content = re.sub(r'border-slate-200', 'border-rose-500/20', content)
    content = re.sub(r'border-slate-300', 'border-rose-500/20', content)
    content = re.sub(r'border-slate-100', 'border-rose-500/20', content)
    content = re.sub(r'border-white/60', 'border-rose-500/20', content)
    content = re.sub(r'border-white/50', 'border-rose-500/20', content)
    content = re.sub(r'border-white/40', 'border-rose-500/20', content)

    # Let's ensure text isn't completely white:
    content = re.sub(r'dark:text-slate-400(?! dark:text-)', 'dark:text-slate-300', content)

    with open(file_path, "w") as f:
        f.write(content)

print("Updated light borders")
