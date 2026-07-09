import * as fs from 'fs';

const files = [
  'src/components/CustomerCartDrawer.tsx',
  'src/components/CustomerAccountModal.tsx',
  'src/components/CustomerAddressModal.tsx',
  'src/components/CustomerPaymentModal.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf-8');
  code = code.replace('  return (', '  return (\n    <>');
  code = code.replace('  );\n}', '    </>\n  );\n}');
  fs.writeFileSync(file, code);
}
