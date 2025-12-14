/**
 * HELPERS.JS
 * Utility functions for text processing and manipulation
 */

// Converts "First Name" -> "first_name"
function slugify(text) {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w\-]+/g, '');
}

// Splits "Label Name*" into { label: "Label Name", isReq: true }
function parseLabel(text) {
    let label = text.trim();
    let isReq = false;
    if (label.endsWith('*')) {
        label = label.slice(0, -1);
        isReq = true;
    }
    return { label, isReq };
}

// Handles **bold**, __italic__, ~~strike~~
// Note: Helper text in parentheses should be extracted BEFORE calling this function
function parseInline(text) {
    if (!text) return "";
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<em>$1</em>')
        .replace(/~~(.*?)~~/g, '<del>$1</del>');
}

// Extracts helper text - currently disabled
function extractHelperText(text) {
    return { text: text.trim(), helperText: '' };
}

// Generate unique field name, appending counter if duplicate
function getUniqueName(baseName, context) {
    if (!context.usedNames[baseName]) {
        context.usedNames[baseName] = 1;
        return baseName;
    }

    // Name exists, increment counter and append
    const counter = ++context.usedNames[baseName];
    const uniqueName = `${baseName}_${counter}`;
    return uniqueName;
}