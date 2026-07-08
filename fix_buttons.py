import glob
import re

files = glob.glob("src/**/*.tsx", recursive=True)

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Replace all dark:bg-white text-white dark:text-slate-900 buttons with the theme color
    content = content.replace("dark:bg-white text-white dark:text-slate-900", "dark:bg-[#f0ede6] text-white dark:text-slate-950")
    # Also replace any other dark:bg-white with dark:bg-[#f0ede6] for buttons, ensuring they use dark text
    
    with open(file_path, "w") as f:
        f.write(content)

print("Buttons fixed")
