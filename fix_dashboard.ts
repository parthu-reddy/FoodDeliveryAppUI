import * as fs from 'fs';
let code = fs.readFileSync('src/components/CustomerDashboard.tsx', 'utf-8');
code = code.replace('      </AnimatePresence>\n    </div>\n  );\n}', '    </div>\n  );\n}');
fs.writeFileSync('src/components/CustomerDashboard.tsx', code);
