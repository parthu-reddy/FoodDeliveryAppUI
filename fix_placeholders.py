import glob
import re

files = glob.glob("src/components/*.tsx")

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Change remaining placeholders and slate texts
    content = re.sub(r'placeholder-slate-500', 'placeholder-slate-400', content)
    content = re.sub(r'placeholder-slate-600', 'placeholder-slate-400', content)
    content = re.sub(r'text-slate-400(?! dark:text-)', 'text-slate-400 dark:text-slate-300', content)
    content = re.sub(r'text-slate-500(?! dark:text-)', 'text-slate-500 dark:text-slate-300', content)
    
    with open(file_path, "w") as f:
        f.write(content)

print("Updated placeholders")
