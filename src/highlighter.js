/**
 * HIGHLIGHTER.JS
 * Syntax highlighting for WTF Script editor
 * Only highlights syntax markers, not the content
 */

function highlightSyntax(text) {
    // Escape HTML first
    text = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Split into lines for processing
    const lines = text.split('\n');
    const highlighted = lines.map(line => {
        let result = line;

        // Skip empty lines
        if (!result.trim()) return result;

        // 1. Frontmatter (---)
        if (result.trim() === '---') {
            return `<span class="token frontmatter">${result}</span>`;
        }

        // 2. Headers (# ## ###) - only highlight the # symbols
        if (/^#+\s/.test(result)) {
            return result.replace(/^(#+)/, '<span class="token header">$1</span>');
        }

        // 3. Submit Button [ Text ] - only highlight brackets
        if (/^\[.*\]$/.test(result.trim())) {
            return result.replace(/(\[)(.*?)(\])/, '<span class="token bracket">$1</span>$2<span class="token bracket">$3</span>');
        }

        // 4. Checkboxes - [ ] or - [x] - only highlight - [ ] or - [x]
        if (/^-\s\[(x|\s)\]/.test(result)) {
            return result.replace(/(-\s\[)(x|\s)(\])/, '<span class="token checkbox">$1$2$3</span>');
        }

        // 5. Radio Buttons - ( ) or - (x) - only highlight - ( ) or - (x)
        if (/^-\s\((x|\s)\)/.test(result)) {
            return result.replace(/(-\s\()(x|\s)(\))/, '<span class="token radio">$1$2$3</span>');
        }

        // 6. Select Dropdowns - Label: {Opt1, Opt2} - highlight * : and { }
        if (/:\s*\{.*\}/.test(result)) {
            result = result.replace(/(\*)?(:)(\s*)(\{)(.*?)(\})/, (match, req, colon, space, open, options, close) => {
                let highlighted = '';
                if (req) highlighted += `<span class="token required">*</span>`;
                highlighted += `<span class="token operator">${colon}</span>${space}`;
                highlighted += `<span class="token select-bracket">${open}</span>${options}<span class="token select-bracket">${close}</span>`;
                return highlighted;
            });
            return result;
        }

        // 7. Text Inputs - Label: [Placeholder] - highlight * : [ ]
        if (/:\s*\[.*\]/.test(result)) {
            result = result.replace(/(\*)?(:)(\s*)(\[)(.*?)(\])/, (match, req, colon, space, open, placeholder, close) => {
                let highlighted = '';
                if (req) highlighted += `<span class="token required">*</span>`;
                highlighted += `<span class="token operator">${colon}</span>${space}`;
                highlighted += `<span class="token bracket">${open}</span>${placeholder}<span class="token bracket">${close}</span>`;
                return highlighted;
            });
            return result;
        }

        // 8. Group Headers - Label: (with colon at end) - highlight * and :
        if (/:\s*$/.test(result)) {
            result = result.replace(/(\*)?(:)(\s*)$/, (match, req, colon, space) => {
                let highlighted = '';
                if (req) highlighted += `<span class="token required">*</span>`;
                highlighted += `<span class="token operator">${colon}</span>${space}`;
                return highlighted;
            });
            return result;
        }

        // 9. Divider line (---)
        if (/^-{3,}$/.test(result)) {
            return `<span class="token divider">${result}</span>`;
        }

        // 10. Links - Text <"url"> - only highlight <" and ">
        if (/<".*">/.test(result)) {
            return result.replace(/(<")(.*?)(">)/, '<span class="token link">$1</span>$2<span class="token link">$3</span>');
        }

        // 11. Inline formatting - only highlight ** __ ~~
        result = result.replace(/(\*\*)(.*?)(\*\*)/g, '<span class="token bold">$1</span>$2<span class="token bold">$3</span>');
        result = result.replace(/(__)(.*?)(__)/g, '<span class="token italic">$1</span>$2<span class="token italic">$3</span>');
        result = result.replace(/(~~)(.*?)(~~)/g, '<span class="token strike">$1</span>$2<span class="token strike">$3</span>');

        return result;
    });

    return highlighted.join('\n');
}

// Sync scroll between textarea and highlighting
function syncScroll(textarea, highlightElement) {
    highlightElement.scrollTop = textarea.scrollTop;
    highlightElement.scrollLeft = textarea.scrollLeft;
}