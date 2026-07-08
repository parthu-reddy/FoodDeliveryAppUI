import glob
import re

files = glob.glob("src/**/*.tsx", recursive=True)

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Find inputs and textareas that might not have text color defined explicitly for dark mode
    # Just to be safe, any <input or <textarea or <select should have dark:text-[#f0ede6] unless it already has it.
    
    # Simple replace to ensure dark:text-[#f0ede6]
    content = re.sub(r'(<input[^>]*className=")([^"]*)(")', lambda m: m.group(1) + (m.group(2) if 'dark:text-' in m.group(2) else m.group(2) + ' text-slate-900 dark:text-[#f0ede6]') + m.group(3), content)
    content = re.sub(r'(<textarea[^>]*className=")([^"]*)(")', lambda m: m.group(1) + (m.group(2) if 'dark:text-' in m.group(2) else m.group(2) + ' text-slate-900 dark:text-[#f0ede6]') + m.group(3), content)
    
    with open(file_path, "w") as f:
        f.write(content)

print("Inputs fixed")
