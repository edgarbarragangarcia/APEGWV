
import fs from 'fs';

const content = fs.readFileSync('/Users/edgar/Documents/3.PERSONAL/APLICACIONES/APEGWEB/src/pages/Shop.tsx', 'utf8');

const lines = content.split('\n');
let stack = [];

lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Match opening tags
    const openMatches = line.matchAll(/<(div|motion\.div|motion\.button|AnimatePresence)(?![a-zA-Z])/g);
    for (const match of openMatches) {
        // Check if it's self-closing on the same line
        if (!line.slice(match.index).match(/>.*<\/\1>/) && !line.includes('/>', match.index)) {
            stack.push({ tag: match[1], line: lineNum });
        }
    }

    // Match closing tags
    const closeMatches = line.matchAll(/<\/ (div|motion\.div|motion\.button|AnimatePresence)>/g); // Note: I saw "</div >" earlier
    const closeMatchesNoSpace = line.matchAll(/<\/(div|motion\.div|motion\.button|AnimatePresence)>/g);

    for (const match of [...closeMatches, ...closeMatchesNoSpace]) {
        if (stack.length === 0) {
            console.log(`Extra closing tag </${match[1]}> on line ${lineNum}`);
        } else {
            const last = stack.pop();
            if (last.tag !== match[1]) {
                console.log(`Mismatch: opened <${last.tag}> on line ${last.line}, closed </${match[1]}> on line ${lineNum}`);
            }
        }
    }
});

if (stack.length > 0) {
    console.log('Unclosed tags:');
    stack.forEach(s => console.log(`  <${s.tag}> on line ${s.line}`));
}
