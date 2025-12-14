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

    parse(markdown) {
        const lines = markdown.split('\n');

        // Context passes state between lines (e.g., "Are we inside a radio group?")
        let context = {
            group: null,
            hasRequired: false,
            usedNames: {}, // Track used field names to prevent duplicates
            groupOpen: false // Track if we have an open form-group div
        };

        // We enable browser validation
        let output = `<form action="#" method="POST" onsubmit="event.preventDefault(); alert('Form Validated!');">\n`;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            // Skip empty lines or frontmatter
            if (!line || (i < 5 && line.startsWith('---'))) continue;

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