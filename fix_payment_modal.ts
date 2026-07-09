import * as fs from 'fs';
let code = fs.readFileSync('src/components/CustomerPaymentModal.tsx', 'utf-8');
code = code.replace('        )}\n    </>\n  );\n}', '        )}\n      </AnimatePresence>\n    </>\n  );\n}');
fs.writeFileSync('src/components/CustomerPaymentModal.tsx', code);
