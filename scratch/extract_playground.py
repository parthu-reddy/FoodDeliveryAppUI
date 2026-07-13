import sys

file_path = "src/components/DeliveryDashboard.tsx"

with open(file_path, 'r') as f:
    content = f.read()

# 1. Add showApi state
state_marker = "const [showHistory, setShowHistory] = useState(false);"
new_state = "const [showHistory, setShowHistory] = useState(false);\n  const [showApi, setShowApi] = useState(false);"
content = content.replace(state_marker, new_state)

# 2. Add Terminal button
btn_marker = """          <button
            onClick={() => setShowProfile(true)}"""
new_btn = """          <button
            onClick={() => setShowApi(true)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6] transition-all cursor-pointer"
            title="API Gateway"
          >
            <Terminal className="w-4 h-4 text-rose-500" />
          </button>

          <button
            onClick={() => setShowProfile(true)}"""
content = content.replace(btn_marker, new_btn)

# 3. Extract the playground
start_marker = "      {/* COURIER API INTERACTIVE PLAYGROUND */}"
end_marker = "      <AnimatePresence>\n        {showProfile && ("

playground_start_idx = content.find(start_marker)
playground_end_idx = content.find(end_marker)

if playground_start_idx == -1 or playground_end_idx == -1:
    print("Could not find playground markers")
    sys.exit(1)

playground_code = content[playground_start_idx:playground_end_idx]

# Remove playground from its current position
content = content[:playground_start_idx] + content[playground_end_idx:]

# 4. Inject conditional return before the main return
return_marker = "  return (\n    <div className=\"flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full pb-20\">"

if return_marker not in content:
    print("Could not find return marker")
    sys.exit(1)

api_view_code = f"""  if (showApi) {{
    return (
      <>
        <header className="sticky top-0 bg-white/40 dark:bg-white/5 backdrop-blur-xl px-5 py-3 flex items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 z-30 shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.01)] gap-3">
          <div className="flex items-center gap-2 sm:gap-3.5 flex-1 min-w-0">
            <button 
              onClick={{() => setShowApi(false)}}
              className="p-1.5 -ml-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-slate-800 dark:text-[#f0ede6]" />
            </button>
            <h1 className="font-black text-slate-800 dark:text-[#f0ede6] text-lg tracking-tight">API Gateway</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full pb-20 p-5">
{playground_code}
        </div>
      </>
    );
  }}

{return_marker}"""

content = content.replace(return_marker, api_view_code)

with open(file_path, 'w') as f:
    f.write(content)

print("Successfully applied changes.")
