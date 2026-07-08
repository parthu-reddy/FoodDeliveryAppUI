import glob
import re

files = glob.glob("src/components/*.tsx")

pink_shadow = "hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50"

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()
    
    # We find classNames containing "border border-rose-500" and "cursor-pointer" and add the pink shadow if not already present
    def replace_func(match):
        class_str = match.group(0)
        if "hover:shadow-[0_0_12px" not in class_str:
            # remove closing quote, add our classes, add closing quote
            return class_str[:-1] + " " + pink_shadow + " transition-all\""
        return class_str

    # Regex to find class names of clickable boxes
    content = re.sub(r'className="[^"]*border[^"]*cursor-pointer[^"]*"', replace_func, content)
    
    # For inputs and textareas
    def replace_input_func(match):
        class_str = match.group(0)
        if "focus:shadow-[0_0_12px" not in class_str:
            return class_str[:-1] + " focus:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:focus:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all\""
        return class_str

    content = re.sub(r'className="[^"]*border[^"]*focus:border-rose-500[^"]*"', replace_input_func, content)
    
    # Also find menu item cards (they might not have cursor-pointer if they just use hover:)
    # "bg-white/40 dark:bg-slate-900/40 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl"
    def replace_card_func(match):
        class_str = match.group(0)
        if "hover:shadow-[0_0_12px" not in class_str:
            return class_str[:-1] + " " + pink_shadow + " transition-all\""
        return class_str

    content = re.sub(r'className="[^"]*border-rose-500[^"]*hover:[^"]*"', replace_card_func, content)

    with open(file_path, "w") as f:
        f.write(content)

print("Applied generic hover shadows")
