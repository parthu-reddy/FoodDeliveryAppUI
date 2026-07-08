with open("src/components/CustomerDashboard.tsx", "r") as f:
    content = f.read()

# Make modals bottom sheets on mobile, but centered on tablet/desktop (sm: breakpoint)
content = content.replace("fixed bottom-0 left-0 right-0 max-w-[412px] mx-auto", "fixed bottom-0 sm:bottom-auto sm:top-1/2 left-0 right-0 sm:-translate-y-1/2 max-w-[412px] mx-auto")
content = content.replace("rounded-t-[32px] p-6 pb-8", "rounded-t-[32px] sm:rounded-[32px] p-6 pb-8")

with open("src/components/CustomerDashboard.tsx", "w") as f:
    f.write(content)

print("Modals centered for tablet/desktop")
