import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.{ts,tsx}");

let modified = 0;

for (const sourceFile of project.getSourceFiles()) {
  let fileModified = false;
  
  const text = sourceFile.getFullText();
  
  if (text.includes('customerApi.get(url') || 
      text.includes('customerApi.post(endpoint') || 
      text.includes('customerApi.get(relativeUrl') || 
      text.includes('customerApi.post(') || 
      text.includes('restaurantApi.order.post')) {
      
      let newText = text;
      newText = newText.replace(/customerApi\.get\(/g, 'adminApi.get(');
      newText = newText.replace(/customerApi\.post\(/g, 'adminApi.post(');
      newText = newText.replace(/restaurantApi\.order\.post\(/g, 'adminApi.post(');
      
      if (text !== newText) {
          sourceFile.replaceWithText(newText);
          fileModified = true;
          
          // Add adminApi import if not exists
          const imports = sourceFile.getImportDeclarations();
          let hasAdmin = false;
          let zodiosImport = null;
          for (const imp of imports) {
              if (imp.getModuleSpecifierValue().includes('zodiosClients')) {
                  zodiosImport = imp;
                  if (imp.getNamedImports().some(ni => ni.getName() === 'adminApi')) {
                      hasAdmin = true;
                  }
              }
          }
          if (!hasAdmin && zodiosImport) {
              zodiosImport.addNamedImport('adminApi');
          }
      }
  }

  if (fileModified) {
      sourceFile.saveSync();
      modified++;
      console.log(`Updated ${sourceFile.getFilePath()}`);
  }
}

console.log(`Done! Modified ${modified} files.`);
