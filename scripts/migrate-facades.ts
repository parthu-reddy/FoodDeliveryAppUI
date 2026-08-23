import * as fs from 'fs';
import * as path from 'path';
import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.{ts,tsx}");

// 1. Build the mapping
const generatedDir = path.join(process.cwd(), 'src/api/generated/schemas');
const services = fs.readdirSync(generatedDir).filter(f => fs.statSync(path.join(generatedDir, f)).isDirectory());

const apiMap: Record<string, { regex: RegExp, namespace: string, original: string }[]> = {};

for (const service of services) {
  const serviceName = `${service}Api`;
  apiMap[serviceName] = [];
  
  const serviceDir = path.join(generatedDir, service);
  const files = fs.readdirSync(serviceDir).filter(f => f.endsWith('.ts') && !f.includes('index.ts') && !f.includes('facade.ts') && !f.includes('common.ts') && !f.includes('api.ts'));
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(serviceDir, file), 'utf8');
    
    let namespace = file.replace('_controller.ts', '');
    namespace = namespace.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    if (namespace === '') namespace = 'default';

    const regex = /path: "(.*?)",/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      let urlPath = match[1];
      let regexStr = urlPath.replace(/:[a-zA-Z0-9_]+/g, '([^/?]+)');
      regexStr = `^${regexStr}`;
      apiMap[serviceName].push({ regex: new RegExp(regexStr), namespace, original: urlPath });
    }
  }
}

const globalRoutes: { regex: RegExp, service: string, namespace: string }[] = [];
for (const [service, routes] of Object.entries(apiMap)) {
    for (const r of routes) {
        globalRoutes.push({ regex: r.regex, service, namespace: r.namespace });
    }
}

let modifiedCount = 0;

for (const sourceFile of project.getSourceFiles()) {
  let fileModified = false;
  
  const propAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
  
  for (const propAccess of propAccesses) {
    const text = propAccess.getText();
    const match = text.match(/^([a-zA-Z]+Api)\.(get|post|put|delete|patch)$/);
    if (!match) continue;

    const apiName = match[1];
    const method = match[2];

    const callExpr = propAccess.getFirstAncestorByKind(SyntaxKind.CallExpression);
    if (!callExpr) continue;

    const args = callExpr.getArguments();
    if (args.length === 0) continue;

    const firstArg = args[0];
    
    // We need to drill down into the first argument to find the string, because it might be `url as any`
    let urlExpr = firstArg;
    if (urlExpr.isKind(SyntaxKind.AsExpression)) {
        urlExpr = urlExpr.getExpression();
    }

    let urlStr = '';
    
    if (urlExpr.isKind(SyntaxKind.StringLiteral) || urlExpr.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
      urlStr = urlExpr.getLiteralText();
    } else if (urlExpr.isKind(SyntaxKind.TemplateExpression)) {
      const exprText = urlExpr.getText();
      urlStr = exprText.replace(/\$\{.*?\}/g, 'PLACEHOLDER').replace(/`/g, '');
    } else if (urlExpr.isKind(SyntaxKind.Identifier)) {
        // dynamic variable
        continue;
    }

    if (!urlStr) continue;

    let bestMatch = null;
    let targetService = apiName;
    
    if (apiMap[apiName]) {
        for (const route of apiMap[apiName]) {
            if (route.regex.test(urlStr)) {
                bestMatch = route;
                break;
            }
        }
    }

    if (!bestMatch) {
        for (const route of globalRoutes) {
            if (route.regex.test(urlStr)) {
                bestMatch = route;
                targetService = route.service;
                break;
            }
        }
    }

    if (bestMatch) {
        const replacement = `${targetService}.${bestMatch.namespace}.${method}`;
        propAccess.replaceWithText(replacement);
        fileModified = true;
    } else {
        console.log(`Could not map URL: ${urlStr} in ${sourceFile.getFilePath()}`);
    }
  }
  
  if (fileModified) {
    sourceFile.saveSync();
    modifiedCount++;
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
}

console.log(`Done! Modified ${modifiedCount} files.`);
