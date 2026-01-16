// Admin tool to decode student ranking submissions
// Usage:
//   node decode-rankings.js "M45_2026,525,002,694..."
//   node decode-rankings.js submissions.txt
//   cat submissions.txt | node decode-rankings.js

const fs = require('fs');
const path = require('path');

const configPath = './config.json';

// Load config
if (!fs.existsSync(configPath)) {
    console.error('Error: config.json not found');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Create mapping: object -> filename number -> initials
const numberToInitialsMap = {};
Object.keys(config.objects).forEach(objectName => {
    const object = config.objects[objectName];
    numberToInitialsMap[objectName] = {};
    
    object.images.forEach(filename => {
        // Extract number from filename (e.g., "bcw-525.jpg" -> "525")
        const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
        const parts = nameWithoutExt.split('-');
        if (parts.length > 1) {
            const number = parts[parts.length - 1];
            const initials = parts[0];
            numberToInitialsMap[objectName][number] = initials;
        }
    });
});

// Parse ranking string: "M45_2026,525,002,694..."
function parseRanking(rankingString) {
    const parts = rankingString.trim().split(',');
    if (parts.length < 2) {
        throw new Error('Invalid format: expected "object,number,number,..."');
    }
    
    const objectName = parts[0];
    const numbers = parts.slice(1);
    
    if (!numberToInitialsMap[objectName]) {
        throw new Error(`Unknown object: ${objectName}`);
    }
    
    const decoded = numbers.map((number, index) => {
        const initials = numberToInitialsMap[objectName][number];
        if (!initials) {
            console.warn(`Warning: Unknown number ${number} for object ${objectName}`);
            return { rank: index + 1, number, initials: 'UNKNOWN' };
        }
        return { rank: index + 1, number, initials };
    });
    
    return { object: objectName, rankings: decoded };
}

// Process submissions
const submissions = [];

// Read from command line argument or stdin/file
if (process.argv.length > 2) {
    const input = process.argv[2];
    if (fs.existsSync(input)) {
        // Read from file
        const content = fs.readFileSync(input, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        lines.forEach(line => {
            try {
                submissions.push(parseRanking(line));
            } catch (err) {
                console.error(`Error parsing line: ${line}`);
                console.error(`  ${err.message}`);
            }
        });
    } else {
        // Treat as direct input
        try {
            submissions.push(parseRanking(input));
        } catch (err) {
            console.error(`Error parsing input: ${err.message}`);
            process.exit(1);
        }
    }
} else {
    // Read from stdin
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    
    rl.on('line', (line) => {
        if (line.trim()) {
            try {
                submissions.push(parseRanking(line));
            } catch (err) {
                console.error(`Error parsing line: ${line}`);
                console.error(`  ${err.message}`);
            }
        }
    });
    
    rl.on('close', () => {
        if (submissions.length > 0) {
            processSubmissions();
        }
    });
    
    // If no stdin, process immediately
    if (process.stdin.isTTY) {
        console.log('No input provided. Usage:');
        console.log('  node decode-rankings.js "M45_2026,525,002,694..."');
        console.log('  node decode-rankings.js submissions.txt');
        console.log('  cat submissions.txt | node decode-rankings.js');
        process.exit(0);
    }
}

// Process and display results
function processSubmissions() {
    if (submissions.length === 0) {
        console.log('No valid submissions found.');
        return;
    }
    
    console.log(`\n=== Decoded Rankings (${submissions.length} submission${submissions.length > 1 ? 's' : ''}) ===\n`);
    
    // Display individual submissions
    submissions.forEach((submission, idx) => {
        console.log(`Submission ${idx + 1} - ${submission.object}:`);
        submission.rankings.forEach(r => {
            console.log(`  ${r.rank.toString().padStart(3)}: ${r.number.padStart(3)} → ${r.initials}`);
        });
        console.log('');
    });
    
    // Aggregate statistics
    const aggregated = {};
    
    submissions.forEach(submission => {
        const objectName = submission.object;
        if (!aggregated[objectName]) {
            aggregated[objectName] = {};
        }
        
        submission.rankings.forEach(r => {
            const initials = r.initials;
            if (!aggregated[objectName][initials]) {
                aggregated[objectName][initials] = {
                    initials,
                    ranks: [],
                    totalRank: 0,
                    count: 0
                };
            }
            aggregated[objectName][initials].ranks.push(r.rank);
            aggregated[objectName][initials].totalRank += r.rank;
            aggregated[objectName][initials].count++;
        });
    });
    
    // Calculate averages and display
    Object.keys(aggregated).forEach(objectName => {
        console.log(`\n=== Aggregated Statistics: ${objectName} ===\n`);
        
        const stats = Object.values(aggregated[objectName]).map(stat => ({
            initials: stat.initials,
            averageRank: stat.totalRank / stat.count,
            totalRank: stat.totalRank,
            count: stat.count,
            ranks: stat.ranks
        }));
        
        // Sort by average rank (best first)
        stats.sort((a, b) => a.averageRank - b.averageRank);
        
        console.log('Rank | Initials | Avg Rank | Total Rank | Count | Individual Ranks');
        console.log('-----|----------|----------|------------|-------|------------------');
        
        stats.forEach((stat, idx) => {
            const rankStr = (idx + 1).toString().padStart(4);
            const initialsStr = stat.initials.padEnd(8);
            const avgStr = stat.averageRank.toFixed(2).padStart(8);
            const totalStr = stat.totalRank.toString().padStart(10);
            const countStr = stat.count.toString().padStart(5);
            const ranksStr = stat.ranks.join(', ');
            
            console.log(`${rankStr} | ${initialsStr} | ${avgStr} | ${totalStr} | ${countStr} | ${ranksStr}`);
        });
        
        console.log('\n');
    });
    
    // Export decoded CSV
    console.log('=== Decoded CSV (for export) ===\n');
    submissions.forEach((submission, idx) => {
        console.log(`# Submission ${idx + 1} - ${submission.object}`);
        console.log('rank,number,initials,object');
        submission.rankings.forEach(r => {
            console.log(`${r.rank},${r.number},${r.initials},${submission.object}`);
        });
        console.log('');
    });
}

// If we have submissions from command line, process immediately
if (submissions.length > 0 && process.argv.length > 2) {
    processSubmissions();
}
