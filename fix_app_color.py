with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("bg-slate-950 text-white", "bg-slate-950 text-[#f0ede6]")
content = content.replace("m3Theme === 'dark' ? 'dark' : ''", "m3Theme === 'dark' ? 'dark text-[#f0ede6]' : 'text-slate-900'")

with open("src/App.tsx", "w") as f:
    f.write(content)

