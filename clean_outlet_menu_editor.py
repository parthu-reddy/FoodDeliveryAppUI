import re

file_path = '/Users/parthureddy/Documents/Food Delivery/FoodDeliveryAppUI/src/components/OutletMenuEditor.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Update state type
content = content.replace(
    "const [activeSubTab, setActiveSubTab] = useState<'master' | 'overrides' | 'categories'>('master');",
    "const [activeSubTab, setActiveSubTab] = useState<'master' | 'overrides'>('master');"
)

# 2. Remove the "Categories" button from the tab bar
pattern_btn = re.compile(r'\s*<button\n\s*onClick=\{.*?setActiveSubTab\(\'categories\'\).*?\n\s*className=\{.*?\}\n\s*>\n\s*Categories\n\s*</button>', re.DOTALL | re.MULTILINE)
content = pattern_btn.sub('', content)

# 3. Remove the {activeSubTab === 'categories' && (...)} block
# The block starts at "{activeSubTab === 'categories' && (" and ends before the end of the file/component.
pattern_block = re.compile(r'\s*\{activeSubTab === \'categories\' && \(.*?\n\s*\)\}\n', re.DOTALL | re.MULTILINE)
content = pattern_block.sub('\n', content)

with open(file_path, 'w') as f:
    f.write(content)

print("Done")
