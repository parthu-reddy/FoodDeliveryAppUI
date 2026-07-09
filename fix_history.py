import re

with open('src/components/CustomerAccountModal.tsx', 'r') as f:
    content = f.read()

# Replace activeOrders.filter(o => o.customerPhone === userPhone) with activeOrders
content = content.replace("activeOrders.filter(o => o.customerPhone === userPhone)", "activeOrders")

with open('src/components/CustomerAccountModal.tsx', 'w') as f:
    f.write(content)
