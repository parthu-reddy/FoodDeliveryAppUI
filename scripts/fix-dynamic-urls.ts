import { Node, Project, SyntaxKind } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

// A small utility to check if an expression is an `as any` cast of a string/template
function getUnderlyingExpression(expr: Node): Node {
  if (Node.isAsExpression(expr)) {
    return getUnderlyingExpression(expr.getExpression());
  }
  if (Node.isParenthesizedExpression(expr)) {
    return getUnderlyingExpression(expr.getExpression());
  }
  return expr;
}

const sourceFiles = project.getSourceFiles('src/**/*.{ts,tsx}');
let modifiedCount = 0;

for (const sourceFile of sourceFiles) {
  let fileModified = false;

  let hasChanges = true;
  while (hasChanges) {
      hasChanges = false;
      const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

      for (const callExpr of callExpressions) {
        // try to catch forgotten node errors gracefully
        let callee;
        try {
            callee = getUnderlyingExpression(callExpr.getExpression());
        } catch (_e) { continue; }
        
        // We only care about things like `api.module.method`
        if (!Node.isPropertyAccessExpression(callee)) continue;
        
        const args = callExpr.getArguments();
        if (args.length === 0) continue;

        const firstArg = getUnderlyingExpression(args[0]);

        if (!Node.isTemplateExpression(firstArg) && !Node.isNoSubstitutionTemplateLiteral(firstArg)) {
          continue;
        }

        // Check if callee is likely an API call (e.g. customerApi.post)
        const calleeText = callee.getText();
        if (!/(Api\.|api)/.test(calleeText) || (!calleeText.includes('.get') && !calleeText.includes('.post') && !calleeText.includes('.put') && !calleeText.includes('.delete') && !calleeText.includes('.patch'))) {
           continue;
        }

        if (Node.isTemplateExpression(firstArg)) {
          let pathTemplate = firstArg.getHead().getLiteralText();
          const spans = firstArg.getTemplateSpans();
          const params: Record<string, string> = {};
          const queries: Record<string, string> = {};

          let isQueryPart = pathTemplate.includes('?');

          for (let i = 0; i < spans.length; i++) {
            const span = spans[i];
            const expr = span.getExpression().getText();
            const literalText = span.getLiteral().getLiteralText();
            
            let cleanExpr = expr;
            const encodeMatch = expr.match(/encodeURIComponent\((.*)\)/);
            if (encodeMatch) {
                cleanExpr = encodeMatch[1];
            }

            let paramName = cleanExpr.replace(/[^a-zA-Z0-9]/g, '');
            if (!paramName) paramName = `param${i}`;

            if (isQueryPart || pathTemplate.includes('?')) {
               queries[paramName] = cleanExpr;
            } else {
               params[paramName] = cleanExpr;
               pathTemplate += `:${paramName}`;
            }
            
            pathTemplate += literalText;
            if (literalText.includes('?')) isQueryPart = true;
          }

          let cleanPath = pathTemplate;
          if (pathTemplate.includes('?')) {
             const parts = pathTemplate.split('?');
             cleanPath = parts[0];
          }

          // Build the config object
          let configObjStr = '';
          const hasParams = Object.keys(params).length > 0;
          const hasQueries = Object.keys(queries).length > 0;
          
          const configParts = [];
          if (hasParams) {
             configParts.push(`params: { ${Object.entries(params).map(([k, v]) => `${k === v ? k : `${k}: ${v}`}`).join(', ')} }`);
          }
          if (hasQueries) {
             configParts.push(`queries: { ${Object.entries(queries).map(([k, v]) => `${k === v ? k : `${k}: ${v}`}`).join(', ')} }`);
          }
          
          if (configParts.length > 0) {
              configObjStr = `{ ${configParts.join(', ')} }`;
          }

          const method = callee.getName();
          const newCallArgs = [];
          newCallArgs.push(`'${cleanPath}'`);

          if (method === 'post' || method === 'put' || method === 'patch') {
             if (args.length > 1) {
                newCallArgs.push(args[1].getText());
             } else {
                newCallArgs.push('undefined');
             }
             
             // config is arg 2
             if (configObjStr) {
                 newCallArgs.push(`${configObjStr}`);
             }
          } else {
             // get, delete
             if (configObjStr) {
                 newCallArgs.push(`${configObjStr}`);
             }
          }
          
          const newCallStr = `${callee.getText()}(${newCallArgs.join(', ')})`;
          callExpr.replaceWithText(newCallStr);
          fileModified = true;
          hasChanges = true;
          break; // break the loop and re-fetch descendants
        }
      }
  }

  if (fileModified) {
    console.log(`Modified: ${sourceFile.getFilePath()}`);
    sourceFile.saveSync();
    modifiedCount++;
  }
}

console.log(`Finished. Modified ${modifiedCount} files.`);
