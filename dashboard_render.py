import re

with open('src/components/CustomerDashboard.tsx', 'r') as f:
    content = f.read()

# We need to wrap the return JSX so that if showSettings is true, it renders CustomerAccountModal
# The return statement looks like:
# return (
#     <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full pb-20">
#       {/* 1. Header Area */}

# Let's replace the <CustomerAccountModal> at the bottom with conditionally wrapping the inner content.
# Wait, if we just render CustomerAccountModal INSTEAD of the dashboard content, we can do it inside the AnimatePresence.
# Actually, the header should probably not be shown if we are in Settings? "it has to be separate page similar to Restaurent settings page".
# If we look at Restaurant Dashboard, settings replaces the main content, but the header is still there, or maybe not.
# If we just do:
# if (showSettings) {
#   return (
#     <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full">
#       <CustomerAccountModal ... />
#     </div>
#   )
# }

# Let's remove the <CustomerAccountModal /> at the bottom.
content = re.sub(r'<CustomerAccountModal[^>]*/>', '', content)

# And add the conditional render at the top of the return statement.
return_statement_idx = content.find("return (\n    <div")

if return_statement_idx != -1:
    new_return = """if (showSettings) {
    return (
      <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md text-slate-800 dark:text-[#f0ede6] h-full">
        <CustomerAccountModal
          setIsAddressModalOpen={setIsAddressModalOpen}
          activeOrders={activeOrders}
          setTrackingOrder={(order) => {
             setTrackingOrder(order);
             setShowSettings(false);
          }}
          onBack={() => setShowSettings(false)}
          accountTab={accountTab}
          setAccountTab={setAccountTab}
          editName={editName}
          setEditName={setEditName}
          editPhone={editPhone}
          setEditPhone={setEditPhone}
          userName={userName}
          userPhone={userPhone}
          onLogout={onLogout}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      </div>
    );
  }

  return (
    <div"""
    content = content[:return_statement_idx] + new_return + content[return_statement_idx + len("return (\n    <div"):]

with open('src/components/CustomerDashboard.tsx', 'w') as f:
    f.write(content)
