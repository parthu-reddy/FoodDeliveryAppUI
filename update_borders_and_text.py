import glob
import re

files = glob.glob("src/components/*.tsx")

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Change all standard dark borders to rose/pink
    content = re.sub(r'dark:border-slate-850', 'dark:border-rose-500/30', content)
    content = re.sub(r'dark:border-slate-800/(\d+)', 'dark:border-rose-500/30', content)
    content = re.sub(r'dark:border-slate-800', 'dark:border-rose-500/30', content)
    content = re.sub(r'dark:border-slate-700/(\d+)', 'dark:border-rose-500/30', content)
    content = re.sub(r'dark:border-slate-700', 'dark:border-rose-500/30', content)
    content = re.sub(r'dark:border-white/10', 'dark:border-rose-500/30', content)
    content = re.sub(r'dark:border-white/5', 'dark:border-rose-500/30', content)
    content = re.sub(r'border-white/10', 'border-rose-500/30', content)
    content = re.sub(r'border-slate-850', 'border-rose-500/30', content)
    
    # In some places border-slate-200 is used without dark: counterpart but in dark mode it is still applied
    content = re.sub(r'border-slate-200/(\d+) dark:border-rose-500/30', r'border-rose-500/20 dark:border-rose-500/30', content)
    content = re.sub(r'border-slate-200 dark:border-rose-500/30', r'border-rose-500/20 dark:border-rose-500/30', content)
    
    content = re.sub(r'border-slate-300 dark:border-rose-500/30', r'border-rose-500/30 dark:border-rose-500/30', content)

    # Increase visibility of small texts in dark mode
    # For text-slate-500, text-slate-400 without dark: override
    # First, let's fix existing dark overrides
    content = re.sub(r'dark:text-slate-600', 'dark:text-slate-300', content)
    content = re.sub(r'dark:text-slate-500', 'dark:text-slate-300', content)
    
    # Now for text-slate-500 or 400 that don't have a dark:text-
    # We will just replace them, but be careful not to match ones that already have dark:text- immediately after
    # Actually, simpler: replace text-slate-500 with text-slate-500 dark:text-slate-300 if dark:text- is not present
    # And text-slate-400 with text-slate-400 dark:text-slate-300 if dark:text- is not present
    content = re.sub(r'text-slate-500(?! dark:text-)', 'text-slate-500 dark:text-slate-300', content)
    content = re.sub(r'text-slate-400(?! dark:text-)', 'text-slate-400 dark:text-slate-300', content)
    content = re.sub(r'text-slate-600(?! dark:text-)', 'text-slate-600 dark:text-slate-300', content)

    # Replace already existing text-slate-500 dark:text-slate-300 with itself to not double it, 
    # but the negative lookahead prevents that anyway.
    
    # Update 'text-[10px] text-slate-500' -> 'text-[10px] text-slate-500 dark:text-slate-300' 
    # handled by the regex above!
    
    with open(file_path, "w") as f:
        f.write(content)

print("Updated borders and text colors")
