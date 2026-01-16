// Script to automatically generate config.json from folder contents
const fs = require('fs');
const path = require('path');

const configPath = './config.json';
const imageLoaderPath = './imageLoader.js';

// Calculate grid columns based on image count
function calculateGridColumns(imageCount) {
    if (imageCount <= 6) return 3;
    if (imageCount <= 12) return 4;
    if (imageCount <= 20) return 5;
    return 6;
}

// Load existing config to preserve grid column settings
let existingConfig = { objects: {} };
if (fs.existsSync(configPath)) {
    try {
        existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
        console.log('Note: Could not read existing config, will create new one');
    }
}

// Find all folders starting with 'M'
const folders = fs.readdirSync('.', { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('M'))
    .map(dirent => dirent.name)
    .sort();

const config = { objects: {} };

folders.forEach(folderName => {
    const folderPath = path.join('.', folderName);
    const files = fs.readdirSync(folderPath)
        .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png'].includes(ext);
        })
        .sort();

    if (files.length > 0) {
        // Preserve existing grid columns if they exist, otherwise calculate
        const existingFolder = existingConfig.objects?.[folderName];
        const gridColumns = existingFolder?.gridColumns || calculateGridColumns(files.length);
        
        config.objects[folderName] = {
            folder: folderName,
            images: files,
            gridColumns: gridColumns
        };
        
        const preserved = existingFolder?.gridColumns ? ' (preserved)' : '';
        console.log(`Found ${files.length} images in ${folderName} (grid: ${gridColumns} columns${preserved})`);
    }
});

// Write config.json
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log(`\n✓ Updated ${configPath}`);

// Update embedded config in imageLoader.js
if (fs.existsSync(imageLoaderPath)) {
    let imageLoaderContent = fs.readFileSync(imageLoaderPath, 'utf8');
    
    // Find the CONFIG object and replace it
    const configString = JSON.stringify(config, null, 2);
    const configRegex = /\/\/ Embedded configuration[^]*?const CONFIG = \{[\s\S]*?\};/;
    
    const newConfigBlock = `// Embedded configuration (works with both file:// and HTTP/HTTPS)
const CONFIG = ${configString};`;
    
    if (configRegex.test(imageLoaderContent)) {
        imageLoaderContent = imageLoaderContent.replace(configRegex, newConfigBlock);
        fs.writeFileSync(imageLoaderPath, imageLoaderContent);
        console.log(`✓ Updated embedded config in ${imageLoaderPath}`);
    } else {
        console.log(`⚠ Could not find CONFIG block in ${imageLoaderPath} - manual update may be needed`);
    }
}

console.log(`\n✓ Config generation complete! Found ${Object.keys(config.objects).length} folders.`);
