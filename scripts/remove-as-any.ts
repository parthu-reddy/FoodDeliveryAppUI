import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.{ts,tsx}");

let modified = 0;

for (const sourceFile of project.getSourceFiles()) {
  let fileModified = false;
  
  const asExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.AsExpression);
  
  for (const asExpr of asExpressions) {
    if (asExpr.getTypeNode()?.getText() === 'any') {
      const inner = asExpr.getExpression();
      const text = inner.getText();
      
      if (text.includes('Api.') && (text.endsWith('.get') || text.endsWith('.post') || text.endsWith('.put') || text.endsWith('.delete') || text.endsWith('.patch'))) {
        const parent = asExpr.getParent();
        if (parent && parent.isKind(SyntaxKind.ParenthesizedExpression)) {
           const callExpr = parent.getParent();
           if (callExpr && callExpr.isKind(SyntaxKind.CallExpression)) {
               const args = callExpr.getArguments();
               if (args.length > 0) {
                   let newArgs = [];
                   if (text.endsWith('.get') || text.endsWith('.delete')) {
                       newArgs.push(`${args[0].getText()} as any`);
                       if (args.length > 1) {
                           newArgs.push(`${args[1].getText()} as any`);
                       } else {
                           newArgs.push(`{} as any`);
                       }
                   } else {
                       newArgs.push(`${args[0].getText()} as any`);
                       if (args.length > 1) {
                           newArgs.push(`${args[1].getText()} as any`);
                       } else {
                           newArgs.push(`{} as any`);
                       }
                       if (args.length > 2) {
                           newArgs.push(`${args[2].getText()} as any`);
                       } else {
                           newArgs.push(`{} as any`);
                       }
                   }
                   
                   callExpr.replaceWithText(`(${text}(${newArgs.join(', ')}) as any)`);
                   fileModified = true;
               } else {
                   parent.replaceWithText(text);
                   fileModified = true;
               }
           }
        }
      }
    }
  }
  
  if (fileModified) {
      sourceFile.saveSync();
      modified++;
  }
}
console.log(`Modified ${modified} files.`);
