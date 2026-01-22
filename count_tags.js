
import fs from 'fs';

const content = fs.readFileSync('/Users/edgar/Documents/3.PERSONAL/APLICACIONES/APEGWEB/src/pages/Shop.tsx', 'utf8');

function countTags(tagName) {
    const opening = (content.match(new RegExp(`<${tagName}(?![a-zA-Z])`, 'g')) || []).length;
    const closing = (content.match(new RegExp(`</${tagName}>`, 'g')) || []).length;
    const selfClosing = (content.match(new RegExp(`<${tagName}[^>]*/>`, 'g')) || []).length;
    return { opening, closing, selfClosing };
}

console.log('div:', countTags('div'));
console.log('motion.div:', countTags('motion.div'));
console.log('motion.button:', countTags('motion.button'));
console.log('AnimatePresence:', countTags('AnimatePresence'));
