import * as fs from 'fs';
import * as path from 'path';
import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.{ts,tsx}");

// 1. Build the mapping
const generatedDir = path.join(process.cwd(), 'src/api/generated/schemas');
const services = fs.readdirSync(generatedDir).filter(f => fs.statSync(path.join(generatedDir, f)).isDirectory());

// map[serviceName][regex] = namespace
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
      const urlPath = match[1];
      // Convert /api/v1/customers/:id/something to ^/api/v1/customers/[^/]+/something
      let regexStr = urlPath.replace(/:[a-zA-Z0-9_]+/g, '([^/?]+)');
      regexStr = `^${regexStr}`; // Don't end with $ to allow ?queryparams
      apiMap[serviceName].push({ regex: new RegExp(regexStr), namespace, original: urlPath });
    }
  }
}

// Global fallback mapping for things that might be hardcoded badly
const globalRoutes: { regex: RegExp, service: string, namespace: string }[] = [];
for (const [service, routes] of Object.entries(apiMap)) {
    for (const r of routes) {
        globalRoutes.push({ regex: r.regex, service, namespace: r.namespace });
    }
}

let modifiedCount = 0;

for (const sourceFile of project.getSourceFiles()) {
  let fileModified = false;
  
  // Find all call expressions
  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  for (const call of calls) {
    const expression = call.getExpression();
    let apiName = '';
    let method = '';
    let isAsAny = false;
    const expressionNodeToReplace = expression;

    // Pattern 1: customerApi.get('/path')
    if (expression.isKind(SyntaxKind.PropertyAccessExpression)) {
      const text = expression.getText();
      const match = text.match(/^([a-zA-Z]+Api)\.(get|post|put|delete|patch)$/);
      if (match) {
        apiName = match[1];
        method = match[2];
      }
    } 
    // Pattern 2: (customerApi.get as any)('/path')
    else if (expression.isKind(SyntaxKind.ParenthesizedExpression)) {
      const inner = expression.getExpression();
      if (inner.isKind(SyntaxKind.AsExpression)) {
        const asExpr = inner.getExpression();
        if (asExpr.isKind(SyntaxKind.PropertyAccessExpression)) {
            const text = asExpr.getText();
            const match = text.match(/^([a-zA-Z]+Api)\.(get|post|put|delete|patch)$/);
            if (match) {
              apiName = match[1];
              method = match[2];
              isAsAny = true;
            }
        }
      }
    }

    if (apiName && method) {
      // Get the URL argument
      const args = call.getArguments();
      if (args.length === 0) continue;
      
      const firstArg = args[0];
      let urlStr = '';
      
      if (firstArg.isKind(SyntaxKind.StringLiteral) || firstArg.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
        urlStr = firstArg.getLiteralText();
      } else if (firstArg.isKind(SyntaxKind.TemplateExpression)) {
        // Just extract the raw string parts, ignore variables, and replace them with a wildcard placeholder
        const text = firstArg.getText(); // e.g. `/api/v1/customers/${id}/profile`
        urlStr = text.replace(/\\$\\{.*?\\}/g, 'PLACEHOLDER').replace(/`/g, '');
      } else if (firstArg.isKind(SyntaxKind.Identifier)) {
        // e.g. url variable
        continue;
      }

      if (!urlStr) continue;

      // Find match
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
          // Fallback: search globally if the user used the wrong API client!
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
          if (isAsAny) {
              // replace the inside of the AsExpression
              const asExpr = expression.getFirstDescendantByKind(SyntaxKind.AsExpression);
              if (asExpr) {
                  const propAccess = asExpr.getFirstDescendantByKind(SyntaxKind.PropertyAccessExpression);
                  if (propAccess) {
                      propAccess.replaceWithText(replacement);
                      fileModified = true;
                  }
              }
          } else {
              expression.replaceWithText(replacement);
              fileModified = true;
          }
      } else {
          console.log(`Could not map URL: ${urlStr} in ${sourceFile.getFilePath()}`);
      }
    }
  }
  
  if (fileModified) {
    sourceFile.saveSync();
    modifiedCount++;
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
}

console.log(`Done! Modified ${modifiedCount} files.`);
