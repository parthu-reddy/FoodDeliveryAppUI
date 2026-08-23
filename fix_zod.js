import fs from 'fs';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('src/components');
let changed = 0;
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('validation.error.errors[')) {
        const newContent = content.replace(/validation\.error\.errors\[/g, 'validation.error.issues[');
        fs.writeFileSync(file, newContent);
        console.log(`Updated ${file}`);
        changed++;
    }
});
console.log(`Changed ${changed} files.`);
