const fs = require('fs');
const { globSync } = require('glob');

const fixKeysInFile = (file) => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    const patterns = [
        {
            regex: /key=\{product\.id\}/g,
            replacement: 'key={product.id || `product-${index}`}'
        },
        {
            regex: /key=\{offer\.id\}/g,
            replacement: 'key={offer.id || `offer-${index}`}'
        },
        {
            regex: /key=\{order\.id\}/g,
            replacement: 'key={order.id || `order-${index}`}'
        },
        {
            regex: /key=\{tournament\.id\}/g,
            replacement: 'key={tournament.id || `tournament-${index}`}'
        },
        {
            regex: /key=\{tab\}/g,
            replacement: 'key={tab || `tab-${idx}`}'
        }
    ];

    patterns.forEach(p => {
        if (p.regex.test(content)) {
            content = content.replace(p.regex, p.replacement);
            changed = true;
        }
    });

    if (changed) {
        content = content.replace(/\.map\(\(product\)\s*=>/g, '.map((product, index) =>');
        content = content.replace(/\.map\(\(offer\)\s*=>/g, '.map((offer, index) =>');
        content = content.replace(/\.map\(\(order\)\s*=>/g, '.map((order, index) =>');
        content = content.replace(/\.map\(\(tournament\)\s*=>/g, '.map((tournament, index) =>');
        content = content.replace(/\.map\(\(tab\)\s*=>/g, '.map((tab, idx) =>');
        fs.writeFileSync(file, content, 'utf8');
        console.log("Fixed:", file);
    }
};

const files = globSync('src/**/*.tsx');
files.forEach(fixKeysInFile);
