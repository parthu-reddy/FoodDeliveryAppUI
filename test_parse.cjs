"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var fs = require("fs");
var code = fs.readFileSync('src/components/CustomerDashboard.tsx', 'utf8');
var sf = ts.createSourceFile('CustomerDashboard.tsx', code, ts.ScriptTarget.Latest, true);
var depth = 0;
function walk(node) {
    if (node.kind === ts.SyntaxKind.JsxElement) {
        var jsx = node;
        var open_1 = jsx.openingElement.tagName.getText();
        var close_1 = jsx.closingElement.tagName.getText();
        if (open_1 !== close_1) {
            console.log('Mismatched JSX:', open_1, close_1, 'at line', sf.getLineAndCharacterOfPosition(jsx.getStart()).line + 1);
        }
    }
    if (node.kind === ts.SyntaxKind.Block) {
        // block
    }
    ts.forEachChild(node, walk);
}
walk(sf);
// Now let's try to parse smaller chunks!
