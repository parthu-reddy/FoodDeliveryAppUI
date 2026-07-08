with open("src/App.tsx", "r") as f:
    content = f.read()
content = content.replace("m3Theme === 'dark' ? 'dark' : ''", "m3Theme === 'dark' ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'")
with open("src/App.tsx", "w") as f:
    f.write(content)
