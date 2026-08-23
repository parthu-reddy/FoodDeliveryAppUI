import fs from 'fs';
import path from 'path';

const schemasDir = path.join(process.cwd(), 'src/api/generated/schemas');
const services = fs.readdirSync(schemasDir).filter(f => fs.statSync(path.join(schemasDir, f)).isDirectory());

for (const service of services) {
  const indexFile = path.join(schemasDir, service, 'index.ts');
  if (fs.existsSync(indexFile)) {
    const content = fs.readFileSync(indexFile, 'utf8');
    const facadeName = `create${service.charAt(0).toUpperCase() + service.slice(1)}Facade`;
    const exportLine = `export { ${facadeName} as createApiClient } from './facade';\n`;
    if (!content.includes(exportLine)) {
      fs.writeFileSync(indexFile, content + '\n' + exportLine);
      console.log(`Added createApiClient export to ${service}/index.ts`);
    }
  }
}
