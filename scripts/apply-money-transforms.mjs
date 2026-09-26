import fs from 'fs';
import path from 'path';

const moneyFields = [
  'amount',
  'balance',
  'netEarnings',
  'grossEarnings',
  'sgst',
  'cgst',
  'foodCost',
  'deliveryFee',
  'platformFee',
  'total',
  'totalAmount',
  'unsettledAmount',
  'refundedAmount',
  'itemTotal',
  'platformBonus',
  'deliveryContribution',
  'price',
  'quoteAmount',
  'overrideAmount',
  'spend'
];

const schemasDir = path.join(process.cwd(), 'src/api/generated/schemas');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // We need to add the import for toPaise if we transform anything
  // But toPaise handles number | string | null | undefined.
  // Actually, inline transform is easier: .transform((v) => Math.round((v || 0) * 100))
  // Or import toPaise from shared/money/format.ts
  
  moneyFields.forEach(field => {
    // Regex to find: fieldName: z.number()...
    // Also optional numbers: fieldName: z.number().optional()
    // It's safer to use regex that replaces `field: z.number()` with `field: z.number().transform(toPaise)`
    // Or just any `field: z.number()`
    
    // We can just match the exact field name followed by z.number()
    const regex = new RegExp(`(${field}:\\s*z\\.number\\(\\)(?:\\.int\\(\\))?)`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `$1.transform(v => Math.round((v || 0) * 100))`);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Transformed money fields in ${path.basename(filePath)}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(schemasDir);
