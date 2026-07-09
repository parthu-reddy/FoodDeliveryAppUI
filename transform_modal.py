import re

with open('src/components/CustomerAccountModal.tsx', 'r') as f:
    content = f.read()

# Make it a normal page container instead of a modal
# Replace the <AnimatePresence> and fixed positioned divs
content = re.sub(r'<AnimatePresence>\s*\{isAccountModalOpen && \(\s*<>\s*<motion\.div[^>]*className="fixed inset-0 bg-black z-\[60\]"[^>]*/>', '', content)

# Change the modal content div to a standard div
content = re.sub(
    r'<motion\.div\s*initial=\{\{ y: \'100%\' \}\}\s*animate=\{\{ y: 0 \}\}\s*exit=\{\{ y: \'100%\' \}\}\s*transition=\{\{[^}]+\}\}\s*className="fixed bottom-0 [^"]+"',
    '<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto w-full p-5 flex flex-col space-y-4 bg-transparent"',
    content
)

# Remove the closing tags for AnimatePresence
content = content.replace("            </motion.div>\n          </>\n        )}\n      </AnimatePresence>", "            </motion.div>")

# Replace setIsAccountModalOpen(false) with onBack
# We need to change the props of CustomerAccountModal
content = content.replace("setIsAccountModalOpen,", "onBack,")

content = content.replace("setIsAccountModalOpen(false)", "onBack()")

# Remove the outer <>...</>
# Or just leave them, they don't hurt.
# Also change the Account Settings header to look like a page header
content = content.replace(
    """<div className="flex justify-between items-center shrink-0 mb-4">
                <div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6]">Account Settings</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Manage your profile and orders</p>
                </div>
                <button
                  onClick={() => onBack()}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>""",
    """<div className="flex items-center gap-3 shrink-0 mb-4">
                <button
                  onClick={() => onBack()}
                  className="p-2 rounded-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 text-slate-500 dark:text-slate-300 hover:text-slate-900 hover:bg-white dark:hover:text-white cursor-pointer transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <h4 className="font-bold text-xl text-slate-900 dark:text-[#f0ede6]">Account Settings</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Manage your profile and orders</p>
                </div>
              </div>"""
)

with open('src/components/CustomerAccountModal.tsx', 'w') as f:
    f.write(content)
