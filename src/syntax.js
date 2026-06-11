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
     * Inject a data-wtf-line attribute (the source line in the original markdown)
     * into the first HTML tag of a rendered chunk. Used by editors to map a caret
     * position back to the element it produced. Safe no-op if no tag is found.
     */
    tagLine(html, line) {
        if (line == null) return html;
        return html.replace(/^(\s*<[a-zA-Z][\w-]*)(\s|>|\/)/, `$1 data-wtf-line="${line}"$2`);
    }

    /**
     * Extract frontmatter from markdown content
     * Returns { metadata, content, offset } where offset is the number of source
     * lines consumed by the frontmatter (so line numbers can be mapped back).
     */
    extractFrontmatter(markdown) {
        const lines = markdown.split('\n');

        // Check if document starts with frontmatter
        if (!lines[0] || lines[0].trim() !== '---') {
            return { metadata: {}, content: markdown, offset: 0 };
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
            return { metadata: {}, content: markdown, offset: 0 };
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
        return { metadata, content, offset: endIndex + 1 };
    }

    parse(markdown) {
        // Extract frontmatter first
        const { metadata, content, offset = 0 } = this.extractFrontmatter(markdown);

        const lines = content.split('\n');

        // Context passes state between lines (e.g., "Are we inside a radio group?")
        let context = {
            group: null,
            hasRequired: false,
            usedNames: {}, // Track used field names to prevent duplicates
            groupOpen: false, // Track if we have an open form-group div
            steps: [], // Track step titles for multi-step forms
            currentStep: 0, // Current step index
            isMultiStep: false // Whether this is a multi-step form
        };

        // First pass: detect if this is a multi-step form
        const stepRegex = /^===\s*(.+?)\s*===$/;
        for (const line of lines) {
            if (stepRegex.test(line.trim())) {
                context.isMultiStep = true;
                break;
            }
        }

        // Form tag - validation handled by wtf-validation.js
        let output = context.isMultiStep
            ? `<form action="#" method="POST" class="wtf-multistep" data-step="0">\n`
            : `<form action="#" method="POST">\n`;

        // Add progress indicator for multi-step forms (will be populated by JS)
        if (context.isMultiStep) {
            output += `<div class="wtf-progress"></div>\n`;
        }

        let stepContent = '';
        let stepOpen = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            // Skip empty lines
            if (!line) continue;

            // Source line in the ORIGINAL markdown (incl. frontmatter) for editor mapping
            const srcLine = i + offset;

            // Check for step header
            const stepMatch = line.match(stepRegex);
            if (stepMatch && context.isMultiStep) {
                // Close previous step if open
                if (stepOpen) {
                    // Close any open group
                    if (context.groupOpen) {
                        stepContent += `</div>\n`;
                        context.groupOpen = false;
                    }
                    // Add navigation buttons
                    stepContent += this.renderStepNav(context.currentStep, context.steps.length);
                    output += stepContent + `</div>\n`;
                }

                // Start new step
                const stepTitle = stepMatch[1].trim();
                context.steps.push(stepTitle);
                context.currentStep = context.steps.length - 1;
                const activeClass = context.currentStep === 0 ? ' active' : '';
                output += `<div class="wtf-step${activeClass}" data-step-index="${context.currentStep}" data-wtf-line="${srcLine}">\n`;
                // Only render a heading when the marker actually has a title (skip "===  ===")
                if (stepTitle) {
                    output += `<h3 class="wtf-step-title">${stepTitle}</h3>\n`;
                }
                stepContent = '';
                stepOpen = true;
                continue;
            }

            // If this is a multi-step form but content appears before the first
            // "=== Title ===" marker, auto-open an implicit (untitled) first step.
            // Without this, that leading content renders outside the step system
            // and stays permanently visible instead of being paged.
            if (context.isMultiStep && !stepOpen) {
                context.steps.push('');
                context.currentStep = context.steps.length - 1;
                const implicitActive = context.currentStep === 0 ? ' active' : '';
                output += `<div class="wtf-step${implicitActive}" data-step-index="${context.currentStep}" data-wtf-line="${srcLine}">\n`;
                stepContent = '';
                stepOpen = true;
            }

            // Check if we need to close a group (when line is not a radio/checkbox item)
            const isRadioOrCheckbox = /^-\s[\[\(]/.test(line);
            if (context.groupOpen && !isRadioOrCheckbox) {
                if (context.isMultiStep && stepOpen) {
                    stepContent += `</div>\n`;
                } else {
                    output += `</div>\n`;
                }
                context.groupOpen = false;
            }

            // Find the first rule that matches this line
            for (const rule of this.rules) {
                const match = line.match(rule.regex);
                if (match) {
                    // Pass match AND context to the render function
                    const rendered = this.tagLine(rule.render(match, context), srcLine) + '\n';
                    if (context.isMultiStep && stepOpen) {
                        stepContent += rendered;
                    } else {
                        output += rendered;
                    }
                    break; // Stop looking for rules for this line
                }
            }
        }

        // Close any open group at the end
        if (context.groupOpen) {
            if (context.isMultiStep && stepOpen) {
                stepContent += `</div>\n`;
            } else {
                output += `</div>\n`;
            }
        }

        // Close last step if multi-step
        if (context.isMultiStep && stepOpen) {
            stepContent += this.renderStepNav(context.currentStep, context.steps.length, true);
            output += stepContent + `</div>\n`;
        }

        // Update progress indicator with step count
        if (context.isMultiStep) {
            output = output.replace(
                '<div class="wtf-progress"></div>',
                `<div class="wtf-progress" data-total-steps="${context.steps.length}"></div>`
            );
        }

        output += `</form>`;

        // Add legend if needed
        if (context.hasRequired) {
            output = `<div class="req-legend">* indicates required fields</div>` + output;
        }

        return output;
    }

    /**
     * Render navigation buttons for a step
     */
    renderStepNav(stepIndex, totalSteps, isLast = false) {
        let nav = '<div class="wtf-step-nav">';

        if (stepIndex > 0) {
            nav += '<button type="button" class="wtf-btn wtf-prev">\u2039 Previous</button>';
        }

        if (isLast) {
            nav += '<button type="submit" class="wtf-btn wtf-submit">Submit</button>';
        } else {
            nav += '<button type="button" class="wtf-btn wtf-next">Next \u203a</button>';
        }

        nav += '</div>';
        return nav;
    }
}