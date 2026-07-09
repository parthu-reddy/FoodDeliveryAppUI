import re

with open('src/components/CustomerAccountModal.tsx', 'r') as f:
    content = f.read()

# Replace activeOrders.reverse() with activeOrders.slice().reverse()
content = content.replace("activeOrders.reverse()", "activeOrders.slice().reverse()")

with open('src/components/CustomerAccountModal.tsx', 'w') as f:
    f.write(content)
