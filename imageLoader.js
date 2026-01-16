// Image loader module for auto-detecting and numbering images

/**
 * Extract initials from filename
 * Examples: "edh.jpg" -> "edh", "edh-188.jpg" -> "edh"
 */
function extractInitials(filename) {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    // Extract initials (first part before dash, or whole name if no dash)
    const initials = nameWithoutExt.split('-')[0];
    return initials;
}

/**
 * Extract filename number from filename
 * Examples: "bcw-525.jpg" -> "525", "edh-188.jpg" -> "188", "edh.jpg" -> null
 */
function extractFilenameNumber(filename) {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    // Extract number after dash
    const parts = nameWithoutExt.split('-');
    if (parts.length > 1) {
        return parts[parts.length - 1]; // Return last part after dash
    }
    return null; // No number found
}

/**
 * Process image files: sort alphabetically and assign consistent numbers
 * @param {string[]} imageFiles - Array of image filenames
 * @returns {Array} Array of image objects with metadata
 */
function processImageFiles(imageFiles) {
    // Sort filenames alphabetically for consistent ordering
    const sortedFiles = [...imageFiles].sort();
    
    // Create numbered image objects
    const numberedImages = sortedFiles.map((filename, index) => {
        const initials = extractInitials(filename);
        const number = index + 1;
        const displayNumber = String(number).padStart(3, '0'); // "001", "042", "188"
        const filenameNumber = extractFilenameNumber(filename); // "525", "002", etc.
        
        return {
            filename,
            initials,
            number,
            displayNumber,
            filenameNumber: filenameNumber || displayNumber // Fallback to displayNumber if no number found
        };
    });
    
    return numberedImages;
}

// Embedded configuration (works with both file:// and HTTP/HTTPS)
const CONFIG = {
  "objects": {
    "M31": {
      "folder": "M31",
      "images": [
        "dba-821.jpg",
        "dlf-360.jpg",
        "dlm-747.jpg",
        "dlm-748.jpg",
        "dma-165.jpg",
        "dma-166.jpg",
        "dta-447.jpg",
        "edh-697.jpg",
        "ege-384.jpg",
        "ege-385.jpg",
        "ekn-181.jpg",
        "eps-457.jpg"
      ],
      "gridColumns": 6
    },
    "M42": {
      "folder": "M42",
      "images": [
        "dba-173.jpg",
        "dfa-347.jpg",
        "dfa-885.jpg",
        "dlf-945.jpg",
        "dlm-304.jpg",
        "dlm-305.jpg",
        "dma-428.jpg",
        "dma-429.jpg",
        "dmc-833.jpg",
        "dta-277.jpg",
        "ecr-273.jpg",
        "edh-585.jpg",
        "ege-480.jpg",
        "egw-328.jpg",
        "ekn-224.jpg",
        "ela-990.jpg",
        "emi-205.jpg",
        "eps-174.jpg",
        "mrl-935.jpg"
      ],
      "gridColumns": 6
    },
    "M45": {
      "folder": "M45",
      "images": [
        "dba-257.jpg",
        "dde-336.jpg",
        "dfa-254.jpg",
        "dfa-512.png",
        "dim-554.jpg",
        "dlf-423.jpg",
        "dlm-941.jpg",
        "dma-720.jpg",
        "dmc-107.jpg",
        "dta-628.png",
        "dzh-295.jpg",
        "ecr-705.jpg",
        "edh-188.jpg",
        "ege-583.jpg",
        "egw-965.jpg",
        "ekn-962.jpg",
        "ela-326.jpg",
        "emi-459.jpg",
        "eps-603.jpg",
        "lak-242.jpg"
      ],
      "gridColumns": 5
    },
    "M45_2026": {
      "folder": "M45_2026",
      "images": [
        "bcw-525.jpg",
        "bdj-002.jpg",
        "bec-694.jpg",
        "fam-973.jpg",
        "fbb-682.jpg",
        "fbh-459.jpg",
        "fcc-462.jpg",
        "fcg-927.jpg",
        "fcs-498.jpg",
        "fkh-821.jpg",
        "flw-564.jpg",
        "frd-650.jpg"
      ],
      "gridColumns": 4
    }
  }
};

/**
 * Load configuration and process images for a given object
 * @param {string} objectName - Object name (e.g., "M31", "M42", "M45", "M45_2026")
 * @returns {Promise<Object>} Configuration object with processed images
 */
async function loadObjectConfig(objectName) {
    try {
        if (!CONFIG.objects || !CONFIG.objects[objectName]) {
            throw new Error(`Object ${objectName} not found in config`);
        }
        
        const objectConfig = CONFIG.objects[objectName];
        const processedImages = processImageFiles(objectConfig.images);
        
        return {
            objectName,
            folder: objectConfig.folder,
            images: processedImages,
            gridColumns: objectConfig.gridColumns
        };
    } catch (error) {
        console.error('Error loading config:', error);
        throw error;
    }
}

// Export functions to window for global access
window.imageLoader = {
    extractInitials,
    extractFilenameNumber,
    processImageFiles,
    loadObjectConfig
};

