const fs = require('fs');
const path = require('path');

// Create public/stockfish directory if it doesn't exist
const publicStockfishDir = path.join(__dirname, '..', 'public', 'stockfish');
if (!fs.existsSync(publicStockfishDir)) {
    fs.mkdirSync(publicStockfishDir, { recursive: true });
}

// Copy Stockfish files from node_modules to public
const stockfishSrc = path.join(__dirname, '..', 'node_modules', 'stockfish', 'src');
const files = [
    'stockfish-17.1-lite-single-03e3232.js',
    'stockfish-17.1-lite-single-03e3232.wasm'
];

files.forEach(file => {
    const src = path.join(stockfishSrc, file);
    const dest = path.join(publicStockfishDir, file);

    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✓ Copied ${file} to public/stockfish/`);
    } else {
        console.warn(`⚠ Warning: ${file} not found in node_modules/stockfish/src/`);
    }
});

console.log('✓ Stockfish files ready for use');
