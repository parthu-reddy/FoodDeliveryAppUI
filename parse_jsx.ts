import { Project, SyntaxKind, JsxElement, JsxSelfClosingElement } from 'ts-morph';

const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/components/CustomerDashboard.tsx');

const returnStatements = sourceFile.getDescendantsOfKind(SyntaxKind.ReturnStatement);
const mainReturn = returnStatements.find(r => r.getStartLineNumber() === 510);

if (mainReturn) {
  const jsxExpr = mainReturn.getExpression();
  if (jsxExpr && jsxExpr.isKind(SyntaxKind.ParenthesizedExpression)) {
    const jsx = jsxExpr.getExpression();
    if (jsx.isKind(SyntaxKind.JsxElement)) {
      const children = jsx.getJsxChildren();
      children.forEach(c => {
        if (c.isKind(SyntaxKind.JsxElement) || c.isKind(SyntaxKind.JsxSelfClosingElement)) {
          let name = '';
          if (c.isKind(SyntaxKind.JsxElement)) name = c.getOpeningElement().getTagNameNode().getText();
          if (c.isKind(SyntaxKind.JsxSelfClosingElement)) name = c.getTagNameNode().getText();
          console.log(`Child: ${name}, lines: ${c.getStartLineNumber()}-${c.getEndLineNumber()}`);
        }
      });
    }
  }
}
