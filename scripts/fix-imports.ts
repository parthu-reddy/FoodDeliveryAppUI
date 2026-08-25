import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.{ts,tsx}");

for (const sourceFile of project.getSourceFiles()) {
  let fileModified = false;
  
  const text = sourceFile.getText();
  const _needsLedger = text.includes('ledgerApi.') && !text.includes('ledgerApi');
  
  // Actually, a simpler way is to check if it's used but not imported
  const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
  
  const needed: Set<string> = new Set();
  
  for (const id of identifiers) {
      const name = id.getText();
      if (['ledgerApi', 'mapsApi', 'campaignApi', 'chatApi'].includes(name)) {
          needed.add(name);
      }
  }
  
  if (needed.size > 0) {
      // check if they are already imported
      const imports = sourceFile.getImportDeclarations();
      let hasZodiosClients = false;
      for (const imp of imports) {
          if (imp.getModuleSpecifierValue().includes('zodiosClients')) {
              hasZodiosClients = true;
              for (const n of needed) {
                  const hasImport = imp.getNamedImports().some(ni => ni.getName() === n);
                  if (!hasImport) {
                      imp.addNamedImport(n);
                      fileModified = true;
                  }
              }
          }
      }
      if (!hasZodiosClients) {
           // We'll skip adding a whole new import, assuming they import customerApi from zodiosClients
           // Wait, if it has 'mapsApi', it might have 'customerApi' imported. Let's find that import.
           for (const imp of imports) {
                if (imp.getModuleSpecifierValue().endsWith('zodiosClients')) {
                    for (const n of needed) {
                        imp.addNamedImport(n);
                        fileModified = true;
                    }
                }
           }
      }
  }

  if (fileModified) {
      sourceFile.saveSync();
      console.log(`Updated imports in ${sourceFile.getFilePath()}`);
  }
}
