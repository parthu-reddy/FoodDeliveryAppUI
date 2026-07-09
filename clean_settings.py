import re

with open('src/components/CustomerAccountModal.tsx', 'r') as f:
    content = f.read()

# Remove AnimatePresence and isAccountModalOpen wrap
content = re.sub(r'\{/\* ------------------- ACCOUNT MODAL ------------------- \*/\}\s*<AnimatePresence>\s*\{isAccountModalOpen && \(\s*<>\s*<motion\.div\s*initial=\{\{ opacity: 0 \}\}\s*animate=\{\{ opacity: 0\.5 \}\}\s*exit=\{\{ opacity: 0 \}\}\s*onClick=\{[^}]+\}\s*className="fixed inset-0 bg-black z-\[60\]"\s*/>', '{/* ------------------- ACCOUNT SETTINGS PAGE ------------------- */}', content)

# Remove trailing AnimatePresence closing tags
content = content.replace("</motion.div>\n    </>\n  );\n}", "</motion.div>\n  );\n}")

with open('src/components/CustomerAccountModal.tsx', 'w') as f:
    f.write(content)
