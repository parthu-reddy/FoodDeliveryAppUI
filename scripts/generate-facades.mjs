import fs from 'fs';
import path from 'path';

const schemasDir = path.join(process.cwd(), 'src/api/generated/schemas');

if (!fs.existsSync(schemasDir)) {
  console.error("Schemas directory not found.");
  process.exit(1);
}

const services = fs.readdirSync(schemasDir).filter(f => fs.statSync(path.join(schemasDir, f)).isDirectory());

for (const service of services) {
  const serviceDir = path.join(schemasDir, service);
  const indexFile = path.join(serviceDir, 'index.ts');
  
  if (!fs.existsSync(indexFile)) continue;

  const content = fs.readFileSync(indexFile, 'utf8');
  const lines = content.split('\n').filter(l => l.startsWith('export {'));
  
  let imports = `import type { ZodiosOptions } from "@zodios/core";\n`;
  let objectFields = '';
  
  for (const line of lines) {
    // line: export { Customer_profile_controllerApi } from "./customer_profile_controller";
    const match = line.match(/export \{ (.*?) \} from "\.\/(.*?)"/);
    if (match) {
      const originalApiName = match[1];
      const filename = match[2];
      
      let cleanName = filename.replace('_controller', '');
      
      // camelCase
      cleanName = cleanName.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (cleanName === '') cleanName = 'default';

      imports += `import { createApiClient as create_${cleanName} } from './${filename}';\n`;
      objectFields += `  ${cleanName}: create_${cleanName}(baseUrl, options),\n`;
    }
  }

  const facadeContent = `${imports}
export function create${service.charAt(0).toUpperCase() + service.slice(1)}Facade(baseUrl: string, options?: ZodiosOptions) {
  return {
${objectFields}  };
}
`;

  fs.writeFileSync(path.join(serviceDir, 'facade.ts'), facadeContent);
  console.log(`Generated facade for ${service}`);
}
