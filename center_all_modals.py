import glob

files = ["src/components/RestaurantDashboard.tsx", "src/components/DeliveryDashboard.tsx"]

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    content = content.replace("fixed bottom-0 left-0 right-0 max-w-[412px] mx-auto", "fixed bottom-0 sm:bottom-auto sm:top-1/2 left-0 right-0 sm:-translate-y-1/2 max-w-[412px] mx-auto")
    content = content.replace("rounded-t-[32px] p-6 pb-8", "rounded-t-[32px] sm:rounded-[32px] p-6 pb-8")
    content = content.replace("flex flex-col max-h-[85vh] overflow-hidden", "flex flex-col h-auto max-h-[85vh] overflow-hidden")
    content = content.replace("h-[85vh]", "h-auto max-h-[85vh]")

    with open(file_path, "w") as f:
        f.write(content)

print("Other modals centered")
