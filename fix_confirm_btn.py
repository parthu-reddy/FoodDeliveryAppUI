import glob
import re

files = glob.glob("src/components/CustomerDashboard.tsx")

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # The button is currently:
    # className="w-full bg-slate-900 dark:bg-[#f0ede6] text-white dark:text-black py-3.5 rounded-2xl font-bold hover:opacity-90 transition-opacity mt-auto"
    # or similar.
    content = re.sub(
        r'className="w-full bg-slate-900 dark[^>]+mt-auto"\s*>\s*Confirm Location',
        'className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 py-3.5 rounded-2xl font-bold hover:opacity-90 transition-opacity mt-auto"\n                >\n                  Confirm Location',
        content
    )
    
    with open(file_path, "w") as f:
        f.write(content)

print("Confirm button fixed")
