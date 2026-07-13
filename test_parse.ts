import * as ts from 'typescript';
import * as fs from 'fs';

const code = fs.readFileSync('src/components/CustomerDashboard.tsx', 'utf8');
const sf = ts.createSourceFile('CustomerDashboard.tsx', code, ts.ScriptTarget.Latest, true);

let depth = 0;
function walk(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.JsxElement) {
        const jsx = node as ts.JsxElement;
        const open = jsx.openingElement.tagName.getText();
        const close = jsx.closingElement.tagName.getText();
        if (open !== close) {
             console.log('Mismatched JSX:', open, close, 'at line', sf.getLineAndCharacterOfPosition(jsx.getStart()).line + 1);
        }
    }
    if (node.kind === ts.SyntaxKind.Block) {
        // block
    }
    ts.forEachChild(node, walk);
}
walk(sf);

// Now let's try to parse smaller chunks!
