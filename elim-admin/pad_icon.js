const sharp = require('sharp');
const fs = require('fs');

async function processIcon() {
    const inputPath = 'src/assets/logo_admin-512.png';
    console.log('Processing: ' + inputPath);
    
    // Create maskable 512x512
    await sharp(inputPath)
        .resize({
            width: 330, // ~65% of 512
            height: 330,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
            top: 91,
            bottom: 91,
            left: 91,
            right: 91,
            background: '#1e3a5f'
        })
        .toFile('src/assets/logo_admin-512-maskable.png');
        
    // Create maskable 192x192
    await sharp(inputPath)
        .resize({
            width: 124, // ~65% of 192
            height: 124,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
            top: 34,
            bottom: 34,
            left: 34,
            right: 34,
            background: '#1e3a5f'
        })
        .toFile('src/assets/logo_admin-192-maskable.png');

    console.log('Done.');
}

processIcon().catch(console.error);
