# DSO Class Compare

A web-based tool for comparing and ranking astronomy images processed by different students. This tool allows students to visually compare multiple processed versions of the same deep sky object (DSO) and create ranked lists through an intuitive drag-and-drop interface.

## Overview

This application displays astronomy images from multiple processors/students side-by-side, allowing for:
- **Visual Comparison**: View all processed images in a grid layout
- **Drag-and-Drop Ranking**: Organize images by dragging them into your preferred order
- **Fullscreen Comparison**: Click any image to enter a detailed comparison mode with side-by-side viewing
- **Anonymous Student Ranking**: Students can rank images without seeing processor initials
- **Ranking Export**: Export rankings in various formats for analysis

## Supported Objects

Currently supports four deep sky objects:
- **M31** - Andromeda Galaxy (12 images)
- **M42** - Orion Nebula (19 images)
- **M45** - Pleiades Star Cluster (20 images)
- **M45_2026** - Pleiades Star Cluster 2026 (12 images)

## Pages

### Admin Page (`index.html`)
Full-featured page for instructors with:
- Ability to toggle processor initials display
- JSON and PNG export of rankings
- Full access to all features

### Student Page (`studentranking.html`)
Anonymous ranking page for students:
- No processor initials visible (prevents bias)
- Simple plain-text export format
- Copy rankings button for easy submission

## Features

### Grid View
- Images are displayed in a randomized grid layout on load (to prevent bias)
- Each image shows its **filename number** (e.g., "525", "002", "694") - consistent across all viewers
- Current ranking position is displayed as `#1`, `#2`, etc.
- Drag any image card to reorder and update rankings automatically

### Fullscreen Comparison Mode
Click any image to enter fullscreen comparison mode, which displays:
- Current image vs. next image in your ranking
- Interactive slider to adjust the comparison split
- Image numbers and rankings for both images
- Keyboard shortcuts for navigation and mode switching

### Keyboard Shortcuts (Fullscreen Mode)

| Key | Action |
|-----|--------|
| `Space` or `Escape` | Exit fullscreen |
| `←` `→` | Navigate to previous/next image |
| `x` | Toggle blink mode (alternate between two images) |
| `z` | Toggle slider mode (side-by-side comparison) |
| `s` | Swap the two images being compared (updates ranking) |
| `n` | Toggle showing processor initials (admin mode only) |

### Saving Rankings

#### Admin Mode (`index.html`)
Click the **"Save Rankings"** button to:
1. Download a screenshot of the current grid with rankings
2. Download a JSON file with ranking data
3. Copy the ranked list (processor initials) to clipboard

#### Student Mode (`studentranking.html`)
Click the **"Copy Rankings"** button to:
1. Copy a plain-text ranking string to clipboard
2. Format: `M45_2026,525,002,694,973...` (object name, then filename numbers in ranked order)
3. Students can paste this directly into chat/email to submit rankings

## File Structure

```
DSOrank/
├── index.html              # Admin page (shows initials)
├── studentranking.html     # Student page (anonymous)
├── styles.css              # All styling
├── imageLoader.js          # Image loading and config management
├── shared.js               # Shared functionality (drag-drop, fullscreen, ranking)
├── config.json             # Image configuration (auto-generated)
├── generate-config.js      # Script to auto-generate config from folders
├── decode-rankings.js      # Admin tool to decode student submissions
├── anonymize-m45-2026.js  # Script to anonymize filenames
├── M31/                    # M31 processed images
├── M42/                    # M42 processed images
├── M45/                    # M45 processed images
└── M45_2026/              # M45_2026 processed images (anonymized)
```

## Image Naming Convention

Images follow the pattern: `XXX-###.ext`
- First 3 characters: Processor initials (e.g., `edh`, `dba`, `bcw`)
- Last 3 characters: Unique identifier number (e.g., `188`, `257`, `525`)
- Example: `bcw-525.jpg` = processor "bcw", image #525

The **filename number** (e.g., "525") is displayed on images and used in student exports, ensuring consistency across all viewers.

## Usage

### For Students
1. Open `studentranking.html` in a web browser (or via GitHub Pages)
2. Select a deep sky object from the dropdown
3. Images load in a randomized grid showing only numbers (no initials)
4. Drag images to reorder or use fullscreen mode with `s` key to swap pairs
5. Click "Copy Rankings" when finished
6. Paste the copied text and send to instructor

### For Instructors
1. Open `index.html` in a web browser
2. Select a deep sky object from the dropdown
3. Images load showing processor initials
4. Use fullscreen mode to compare images in detail
5. Click "Save Rankings" to export JSON/PNG files

### Decoding Student Submissions
Use the admin tool to decode and aggregate student rankings:

```bash
# Single submission
node decode-rankings.js "M45_2026,525,002,694,973..."

# Multiple submissions from file
node decode-rankings.js submissions.txt

# From stdin
cat submissions.txt | node decode-rankings.js
```

The tool outputs:
- Decoded rankings (numbers → initials)
- Aggregated statistics (average rank per processor)
- Vote distribution analysis

## Configuration Management

### Auto-Generate Config
When adding new images or folders, run:

```bash
node generate-config.js
```

This script:
- Scans all folders starting with "M"
- Finds all image files (.jpg, .jpeg, .png)
- Generates/updates `config.json`
- Updates embedded config in `imageLoader.js`
- Preserves existing grid column settings

## Technical Details

- **Pure JavaScript**: No frameworks or build tools required
- **HTML5 Drag & Drop API**: For reordering images
- **html2canvas**: For generating ranking screenshots (admin mode)
- **Responsive Grid Layout**: CSS Grid adapts to different screen sizes
- **Image Preloading**: Shows loading overlay until all images are ready
- **Embedded Config**: Works with both `file://` protocol (local) and HTTP/HTTPS (GitHub Pages)

## Deployment

### GitHub Pages Setup

1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Select source branch (usually `main`)
4. Select `/ (root)` as the folder
5. Your site will be available at `https://rootlake.github.io/DSOrank/`

**Student Access**: Students can access `https://rootlake.github.io/DSOrank/studentranking.html`

### Local Development

Simply open `index.html` or `studentranking.html` in a web browser. No build process or server required.

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Drag & Drop API
- CSS Grid
- ES6 JavaScript features
- Clipboard API

Tested in Chrome, Firefox, Safari, and Edge.

## License

MIT License - See LICENSE file for details.
