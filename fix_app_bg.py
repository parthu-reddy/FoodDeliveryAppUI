with open("src/App.tsx", "r") as f:
    content = f.read()

# Revert solid background from App.tsx
content = content.replace("m3Theme === 'dark' ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'", "m3Theme === 'dark' ? 'dark' : ''")

with open("src/App.tsx", "w") as f:
    f.write(content)

with open("src/components/CinematicFoodBackground.tsx", "r") as f:
    bg_content = f.read()

# Make the overlay stronger so text is readable
bg_content = bg_content.replace(
    "'bg-gradient-to-tr from-slate-950/70 via-slate-900/50 to-slate-900/60'",
    "'bg-gradient-to-tr from-slate-950/95 via-slate-950/85 to-slate-950/90'"
)
bg_content = bg_content.replace(
    "'bg-gradient-to-tr from-slate-50/75 via-slate-50/50 to-slate-50/60'",
    "'bg-gradient-to-tr from-slate-50/95 via-slate-50/85 to-slate-50/90'"
)

with open("src/components/CinematicFoodBackground.tsx", "w") as f:
    f.write(bg_content)

print("App and background fixed")
