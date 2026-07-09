import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/components/CustomerDashboard.tsx');
const mainReturn = sourceFile.getDescendantsOfKind(SyntaxKind.ReturnStatement).find(r => r.getStartLineNumber() === 510);
const jsxExpr = mainReturn?.getExpression();
const jsx = (jsxExpr as any).getExpression();

const children = jsx.getJsxChildren();
children.forEach(c => {
  if (c.isKind(SyntaxKind.JsxElement)) {
    const startLine = c.getStartLineNumber();
    if (startLine > 1400) {
      const condition = c.getPreviousSibling()?.getText() || "unknown";
      console.log(`Line ${startLine} previous sibling: ${condition.slice(-50)}`);
    }
  }
});
