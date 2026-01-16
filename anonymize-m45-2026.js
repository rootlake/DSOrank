// Script to anonymize M45_2026 images by adding random 3-digit numbers
const fs = require('fs');
const path = require('path');

const folderPath = './M45_2026';
const configPath = './config.json';

// Read all files in M45_2026 folder
const files = fs.readdirSync(folderPath).filter(file => 
    file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')
);

// Generate unique random 3-digit numbers
function generateUniqueNumbers(count) {
    const numbers = new Set();
    while (numbers.size < count) {
        const num = Math.floor(Math.random() * 1000);
        numbers.add(num);
    }
    return Array.from(numbers);
}

// Rename files
const randomNumbers = generateUniqueNumbers(files.length);
const renamedFiles = [];

files.forEach((file, index) => {
    const ext = path.extname(file);
    const nameWithoutExt = path.basename(file, ext);
    const randomNum = String(randomNumbers[index]).padStart(3, '0');
    const newName = `${nameWithoutExt}-${randomNum}${ext}`;
    const oldPath = path.join(folderPath, file);
    const newPath = path.join(folderPath, newName);
    
    fs.renameSync(oldPath, newPath);
    renamedFiles.push(newName);
    console.log(`Renamed: ${file} → ${newName}`);
});

console.log(`\nSuccessfully renamed ${renamedFiles.length} files.`);
console.log('New filenames:', renamedFiles);

// Update config.json
if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Sort filenames alphabetically to match the pattern
    const sortedFiles = [...renamedFiles].sort();
    
    config.objects.M45_2026 = {
        folder: "M45_2026",
        images: sortedFiles,
        gridColumns: 4
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('\nUpdated config.json with M45_2026 entry.');
} else {
    console.log('\nWarning: config.json not found. Skipping config update.');
}
