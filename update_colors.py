import glob
import re

files = glob.glob("src/**/*.tsx", recursive=True)

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Replace dark text colors with custom hex
    content = re.sub(r'dark:text-white', 'dark:text-[#f0ede6]', content)
    content = re.sub(r'dark:text-slate-100', 'dark:text-[#f0ede6]', content)
    content = re.sub(r'dark:text-slate-200', 'dark:text-[#f0ede6]', content)
    content = re.sub(r'dark:text-slate-300', 'dark:text-[#f0ede6]', content)
    content = re.sub(r'dark:text-slate-400', 'dark:text-[#f0ede6]', content)
    
    # We should NOT replace things like border-white or bg-white, just text.

    with open(file_path, "w") as f:
        f.write(content)

print("Text colors updated")
