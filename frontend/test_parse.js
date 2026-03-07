const fs = require('fs');
const babel = require('@babel/core');

try {
    const code = fs.readFileSync('src/pages/ProjectDetailPage.jsx', 'utf8');
    babel.transformSync(code, {
        presets: ['@babel/preset-react']
    });
    console.log('Parse successful!');
} catch (e) {
    console.error('PARSE ERROR:');
    console.error(e.message);
}
