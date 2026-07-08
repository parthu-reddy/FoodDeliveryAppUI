import glob
import re

files = glob.glob("src/components/*.tsx")

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Change remaining slate borders to rose/pink
    content = re.sub(r'border-slate-900', 'border-rose-500/30', content)
    content = re.sub(r'dark:border-slate-900', 'dark:border-rose-500/30', content)
    content = re.sub(r'border-slate-800', 'border-rose-500/30', content)
    content = re.sub(r'border-slate-700', 'border-rose-500/30', content)
    
    # Check for text visibility
    content = re.sub(r'dark:text-slate-400(?! dark:text-)', 'dark:text-slate-300', content)

    with open(file_path, "w") as f:
        f.write(content)

print("Updated remaining borders")
