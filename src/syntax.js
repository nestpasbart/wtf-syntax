/**
 * SYNTAX.JS
 * WTF Script Parser Engine
 *
 * This file contains the main parsing logic that processes WTF Script syntax.
 * It imports helpers and rules from separate modules for better maintainability.
 */

class WTFScriptEngine {
    constructor(rules) {
        this.rules = rules;
    }

    /**
     * Extract frontmatter from markdown content
     * Returns { metadata, content }
     */
    extractFrontmatter(markdown) {
        const lines = markdown.split('\n');

        // Check if document starts with frontmatter
        if (!lines[0] || lines[0].trim() !== '---') {
            return { metadata: {}, content: markdown };
        }

        // Find closing ---
        let endIndex = -1;
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '---') {
                endIndex = i;
                break;
            }
        }

        if (endIndex === -1) {
            // No closing ---, treat as regular content
            return { metadata: {}, content: markdown };
        }

        // Parse frontmatter (simple key: value pairs)
        const metadata = {};
        for (let i = 1; i < endIndex; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();

                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                metadata[key] = value;
            }
        }

        // Return metadata and content without frontmatter
        const content = lines.slice(endIndex + 1).join('\n');
        return { metadata, content };
    }

    parse(markdown) {
        // Extract frontmatter first
        const { metadata, content } = this.extractFrontmatter(markdown);

        const lines = content.split('\n');

        // Context passes state between lines (e.g., "Are we inside a radio group?")
        let context = {
            group: null,
            hasRequired: false,
            usedNames: {}, // Track used field names to prevent duplicates
            groupOpen: false // Track if we have an open form-group div
        };

        // Form tag - validation handled by wtf-validation.js
        let output = `<form action="#" method="POST">\n`;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            // Skip empty lines
            if (!line) continue;

            // Check if we need to close a group (when line is not a radio/checkbox item)
            const isRadioOrCheckbox = /^-\s[\[\(]/.test(line);
            if (context.groupOpen && !isRadioOrCheckbox) {
                output += `</div>\n`;
                context.groupOpen = false;
            }

            // Find the first rule that matches this line
            for (const rule of this.rules) {
                const match = line.match(rule.regex);
                if (match) {
                    // Pass match AND context to the render function
                    output += rule.render(match, context) + '\n';
                    break; // Stop looking for rules for this line
                }
            }
        }

        // Close any open group at the end
        if (context.groupOpen) {
            output += `</div>\n`;
        }

        output += `</form>`;

        // Add legend if needed
        if (context.hasRequired) {
            output = `<div class="req-legend">* indicates required fields</div>` + output;
        }

        return output;
    }
}