import glob
import re

files = glob.glob("src/**/*.tsx", recursive=True)

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Make all dark text colors that are light variants into #f0ede6
    # But for the Confirm Location buttons, ensure they have a dark text and light bg
    
    # We replace any dark:text-slate-950 or dark:text-slate-900 on buttons with dark:text-[#0f172a]
    content = content.replace("dark:text-slate-950", "dark:text-black")
    content = content.replace("dark:text-slate-900", "dark:text-black")

    # In CustomerDashboard, selected address block
    # It might have dark:text-slate-300 or something, we already changed to #f0ede6
    
    # Also, there might be other places where text color needs to be #f0ede6
    # E.g. headings or paragraphs that didn't have dark:text-white previously.
    
    with open(file_path, "w") as f:
        f.write(content)

print("Enforced colors")
