import re

file_path = '/Users/parthureddy/Documents/Food Delivery/FoodDeliveryAppUI/src/components/CustomerDashboard.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Remove onAddApiLog from Props
content = content.replace("  onAddApiLog?: (log: any) => void;\n", "")
content = content.replace("  onAddApiLog\n", "")
content = content.replace(",\n  onAddApiLog\n", "\n")

# 2. Update view state
content = content.replace(
    "const [view, setView] = useState<'home' | 'settings' | 'new_address' | 'api'>('home');",
    "const [view, setView] = useState<'home' | 'settings' | 'new_address'>('home');"
)

# 3. Remove API Interactive Playground states and functions
# They start from "// States for API Interactive Playground" and end before "// Auto-initialize selected order for tracking/delay tabs when order is placed" or something similar.
# Let's use a regex to match from "// States for API Interactive Playground" up to "  const handleDelayApprovalApi" 's closing brace.
pattern1 = re.compile(r'  // States for API Interactive Playground.*?const handleDelayApprovalApi = \(e: React\.FormEvent\) => \{.*?^\s*\}\s*;\n', re.DOTALL | re.MULTILINE)
content = pattern1.sub('', content)

# 4. Remove `if (view === 'api') { ... }` block
# It starts with "if (view === 'api') {" and ends before "if (view === 'settings') {"
pattern2 = re.compile(r'  if \(view === \'api\'\) \{.*?^\s*\}\n\n  if \(view === \'settings\'\) \{', re.DOTALL | re.MULTILINE)
content = pattern2.sub('  if (view === \'settings\') {', content)

# 5. Remove API Gateway button
pattern3 = re.compile(r'\s*<button\n\s*className="p-2\.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-\[#f0ede6\] transition-all cursor-pointer"\n\s*title="API Gateway Forms"\n\s*onClick=\{.*?setView\(\'api\'\).*?>\n\s*<Terminal className="w-4 h-4 text-rose-500" />\n\s*</button>')
content = pattern3.sub('', content)

with open(file_path, 'w') as f:
    f.write(content)

print("Done")
