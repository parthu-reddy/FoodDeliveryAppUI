const fs = require('fs');
const file = 'src/features/admin-ops/components/AdminUserManagement.tsx';
let data = fs.readFileSync(file, 'utf8');
data = data.replace(
  "const data = res.content ?? [];",
  "const data = res.data?.content ?? [];"
);
fs.writeFileSync(file, data);
