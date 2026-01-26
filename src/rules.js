/**
 * RULES.JS
 * Syntax rule definitions for the WTF Script parser
 * Order matters! The engine stops at the first rule that matches.
 */

const syntaxRules = [
    // 1. Headers (# H1, ## H2)
    {
        name: 'Header',
        regex: /^(#+)\s+(.*)/,
        render: (match) => `<h${match[1].length}>${parseInline(match[2])}</h${match[1].length}>`
    },

    // 2. Submit Button [ Text ]
    {
        name: 'Button',
        regex: /^\[(.*)\]$/,
        render: (match) => `<button type="submit" class="form-btn">${match[1]}</button>`
    },

    // 3. Other Checkbox - [?] Label [placeholder]
    {
        name: 'OtherCheckbox',
        regex: /^-\s\[\?\]\s(.*)$/,
        render: (match, context) => {
            const rest = match[1];
            // Parse label and optional placeholder: "Other [Please specify]" or just "Other"
            const placeholderMatch = rest.match(/^(.+?)\s+\[([^\]]+)\]$/);
            const label = placeholderMatch ? placeholderMatch[1] : rest;
            const placeholder = placeholderMatch ? placeholderMatch[2] : 'Please specify...';

            const name = context.group ? context.group.slug + '[]' : slugify(label);
            const textName = context.group ? context.group.slug + '_other' : slugify(label) + '_other';
            const id = (context.group ? context.group.slug : '') + '_' + slugify(label);

            return `
            <div class="check-item other-option">
                <input type="checkbox" name="${name}" id="${id}" value="other" data-other-toggle>
                <label for="${id}">${parseInline(label)}</label>
                <input type="text" name="${textName}" class="other-input" placeholder="${placeholder}" disabled>
            </div>`;
        }
    },

    // 4. Other Radio - (?) Label [placeholder]
    {
        name: 'OtherRadio',
        regex: /^-\s\(\?\)\s(.*)$/,
        render: (match, context) => {
            const rest = match[1];
            // Parse label and optional placeholder
            const placeholderMatch = rest.match(/^(.+?)\s+\[([^\]]+)\]$/);
            const label = placeholderMatch ? placeholderMatch[1] : rest;
            const placeholder = placeholderMatch ? placeholderMatch[2] : 'Please specify...';

            const name = context.group ? context.group.slug : 'radio_group';
            const textName = context.group ? context.group.slug + '_other' : 'radio_group_other';
            const req = (context.group && context.group.required) ? 'required' : '';
            const id = (context.group ? context.group.slug : 'radio') + '_' + slugify(label);

            return `
            <div class="radio-item other-option">
                <input type="radio" name="${name}" id="${id}" value="other" ${req} data-other-toggle>
                <label for="${id}">${parseInline(label)}</label>
                <input type="text" name="${textName}" class="other-input" placeholder="${placeholder}" disabled>
            </div>`;
        }
    },

    // 5. Checkboxes - [ ] Label
    {
        name: 'Checkbox',
        regex: /^-\s\[(x|\s)\]\s(.*)/,
        render: (match, context) => {
            const checked = match[1] === 'x' ? 'checked' : '';
            const label = match[2];
            // Uses the last group label seen (context.group) or a slug of the label
            const name = context.group ? context.group.slug + '[]' : slugify(label);
            const id = (context.group ? context.group.slug : '') + '_' + slugify(label);

            return `
            <div class="check-item">
                <input type="checkbox" name="${name}" id="${id}" ${checked}>
                <label for="${id}">${parseInline(label)}</label>
            </div>`;
        }
    },

    // 6. Radio Buttons - ( ) Label
    {
        name: 'Radio',
        regex: /^-\s\((x|\s)\)\s(.*)/,
        render: (match, context) => {
            const checked = match[1] === 'x' ? 'checked' : '';
            const label = match[2];
            // Radios need a group name to work (toggling). Defaults to 'radio_group' if no header found.
            const name = context.group ? context.group.slug : 'radio_group';
            const req = (context.group && context.group.required) ? 'required' : '';
            const id = (context.group ? context.group.slug : 'radio') + '_' + slugify(label);

            return `
            <div class="radio-item">
                <input type="radio" name="${name}" id="${id}" value="${label}" ${checked} ${req}>
                <label for="${id}">${parseInline(label)}</label>
            </div>`;
        }
    },

    // 7. Select Dropdowns - Label: {Opt1, Opt2} "helper"
    {
        name: 'Select',
        regex: /(.*):\s\{(.*)\}\s*(?:"([^"]+)")?$/,
        render: (match, context) => {
            let rawLabel = match[1];
            const optionsString = match[2];
            const customHelper = match[3] || '';

            // Extract helper text BEFORE inline parsing (to avoid **bold** interference)
            const { text, helperText } = extractHelperText(rawLabel);

            const { label, isReq } = parseLabel(text);
            const baseSlug = slugify(label);
            const name = getUniqueName(baseSlug, context);
            if(isReq) context.hasRequired = true;

            const optionsHTML = optionsString.split(',').map(opt => {
                let val = opt.trim();
                let selected = '';
                if(val.startsWith('*')) { val = val.substring(1); selected = 'selected'; }
                return `<option value="${val}" ${selected}>${val}</option>`;
            }).join('');

            context.group = null; // Reset group context

            const finalHelper = customHelper || helperText;
            const helperHTML = finalHelper ? `<div class="helper-text">${finalHelper}</div>` : '';

            return `
            <div class="form-group">
                <label>${parseInline(label)}${isReq ? '<span class="req-star">*</span>' : ''}</label>
                ${helperHTML}
                <select name="${name}" ${isReq ? 'required' : ''}>${optionsHTML}</select>
            </div>`;
        }
    },

    // 8. Textarea (Long Text) - Label: [[Placeholder]] "helper"
    {
        name: 'Textarea',
        regex: /(.*):\s*\[\[(.*)\]\]\s*(?:"([^"]+)")?$/,
        render: (match, context) => {
            const { label, isReq } = parseLabel(match[1].trim());
            const placeholder = match[2];
            const customHelper = match[3] || '';
            const name = getUniqueName(slugify(label), context);
            if (isReq) context.hasRequired = true;
            const reqAttr = isReq ? ' required' : '';
            const reqStar = isReq ? '<span class="req-star">*</span>' : '';

            context.group = null;

            const helperHTML = customHelper ? `<div class="helper-text">${customHelper}</div>` : '';

            return `
            <div class="form-group">
                <label for="${name}">${parseInline(label)}${reqStar}</label>
                ${helperHTML}
                <textarea id="${name}" name="${name}" placeholder="${placeholder}"${reqAttr}></textarea>
            </div>`;
        }
    },

    // 9. Scale Question (Rating/Likert) - Label: |0-10| Start | Middle | End "helper"
    {
        name: 'Scale',
        regex: /(.*):\s*\|(\d+)-(\d+)\|\s*([^"]*?)(?:\s*"([^"]+)")?$/,
        render: (match, context) => {
            const { label, isReq } = parseLabel(match[1].trim());
            const min = parseInt(match[2]);
            const max = parseInt(match[3]);
            const labelsString = (match[4] || '').trim();
            const customHelper = match[5] || '';

            // Parse labels (2 or 3 labels separated by |)
            const labels = labelsString.split('|').map(l => l.trim());
            const startLabel = labels[0] || '';
            const midLabel = labels.length === 3 ? labels[1] : '';
            const endLabel = labels[labels.length - 1] || '';

            const name = getUniqueName(slugify(label), context);
            if (isReq) context.hasRequired = true;
            const reqStar = isReq ? '<span class="req-star">*</span>' : '';

            let options = '';
            for (let i = min; i <= max; i++) {
                const reqAttr = (isReq && i === min) ? ' required' : '';
                options += `<label class="scale-option">
                    <input type="radio" name="${name}" value="${i}"${reqAttr}>
                    <span class="scale-btn">${i}</span>
                </label>`;
            }

            context.group = null;

            // Build labels row
            let labelsHtml = `<span class="scale-label start">${startLabel}</span>`;
            if (midLabel) {
                labelsHtml += `<span class="scale-label mid">${midLabel}</span>`;
            }
            labelsHtml += `<span class="scale-label end">${endLabel}</span>`;

            const helperHTML = customHelper ? `<div class="helper-text">${customHelper}</div>` : '';

            return `
            <div class="form-group scale-field">
                <label>${parseInline(label)}${reqStar}</label>
                ${helperHTML}
                <div class="scale-container">
                    <div class="scale-options">${options}</div>
                    <div class="scale-labels">${labelsHtml}</div>
                </div>
            </div>`;
        }
    },

    // 10. Text Inputs with Validation - Label: [Placeholder] ~min:8|"error" "helper"
    {
        name: 'Input',
        regex: /(.*):\s\[(.*?)\](.*)$/,
        render: (match, context) => {
            const rawLabel = match[1];
            const placeholder = match[2];
            let remainder = match[3]?.trim() || '';

            // Extract helper text from end (quoted string not preceded by |)
            let customHelper = '';
            // Case 1: Just a quoted string (no validators)
            const directHelperMatch = remainder.match(/^"([^"]+)"$/);
            // Case 2: Quoted string at end after validators
            const helperMatch = remainder.match(/\s+"([^"]+)"$/);

            if (directHelperMatch) {
                customHelper = directHelperMatch[1];
                remainder = '';
            } else if (helperMatch && !remainder.match(/\|"[^"]+"\s*$/)) {
                customHelper = helperMatch[1];
                remainder = remainder.slice(0, -helperMatch[0].length).trim();
            }

            const { label, isReq } = parseLabel(rawLabel);
            const baseSlug = slugify(label);
            const name = getUniqueName(baseSlug, context);
            if(isReq) context.hasRequired = true;

            // Smart Type Detection
            let type = 'text';
            if (placeholder.includes('***') || name.includes('password')) type = 'password';
            else if (placeholder === 'date') type = 'date';
            else if (placeholder.includes('@') || name.includes('email')) type = 'email';
            else if (baseSlug.includes('phone') || baseSlug.includes('tel')) type = 'tel';
            else if (placeholder.startsWith('http') || baseSlug.includes('website') || baseSlug.includes('url')) type = 'url';

            // Parse validation rules like ~min:8|"Must be 8 chars" ~max:20
            let dataValidate = '';
            if (remainder) {
                const validators = [];
                const validatorRegex = /~(\w+)(?::([^|~\s]+))?(?:\|"([^"]+)")?/g;
                let vMatch;
                while ((vMatch = validatorRegex.exec(remainder)) !== null) {
                    const vName = vMatch[1];
                    const vParam = vMatch[2] || '';
                    const vMsg = vMatch[3] || '';

                    let rule = vName;
                    if (vParam) rule += ':' + vParam;
                    if (vMsg) rule += '|' + vMsg;
                    validators.push(rule);
                }
                if (validators.length > 0) {
                    dataValidate = ` data-validate="${validators.join(';')}"`;
                }
            }

            context.group = null;

            const placeholderAttr = (type !== 'date' && placeholder)
                ? ` placeholder="${placeholder}"`
                : '';

            const helperHTML = customHelper ? `<div class="helper-text">${customHelper}</div>` : '';

            return `
            <div class="form-group">
                <label for="${name}">${parseInline(label)}${isReq ? '<span class="req-star">*</span>' : ''}</label>
                ${helperHTML}
                <input type="${type}" name="${name}" id="${name}"${placeholderAttr}${isReq ? ' required' : ''}${dataValidate}>
            </div>`;
        }
    },

    // 11. Group Headers with Selection Limits - Label: (min:1, max:3) "custom helper" or Label:
    {
        name: 'GroupHeader',
        regex: /(.*):\s*(?:\(([^)]+)\))?\s*(?:"([^"]+)")?$/, // Matches "Gender:" or "Interests: (min:2, max:4) "helper""
        render: (match, context) => {
            let rawLabel = match[1];
            const limitsString = match[2] || '';
            const customHelper = match[3] || '';

            // Extract helper text BEFORE inline parsing (to avoid **bold** interference)
            const { text, helperText } = extractHelperText(rawLabel);

            const { label, isReq } = parseLabel(text);
            if(isReq) context.hasRequired = true;

            // Parse selection limits (min:N, max:N)
            let minSelect = null;
            let maxSelect = null;
            if (limitsString) {
                const minMatch = limitsString.match(/min:\s*(\d+)/);
                const maxMatch = limitsString.match(/max:\s*(\d+)/);
                if (minMatch) minSelect = parseInt(minMatch[1]);
                if (maxMatch) maxSelect = parseInt(maxMatch[1]);
            }

            // Generate unique name for this group (handles duplicate question labels)
            const baseSlug = slugify(label);
            const uniqueSlug = getUniqueName(baseSlug, context);

            // Set Context for next items (Radios/Checkboxes)
            context.group = { slug: uniqueSlug, required: isReq, minSelect, maxSelect };
            context.groupOpen = true; // Mark that we have an open group div

            // Build selection limit helper text
            let limitHelper = '';
            if (customHelper) {
                // Custom helper overrides auto-generated
                limitHelper = customHelper;
            } else if (minSelect !== null && maxSelect !== null) {
                limitHelper = `Select ${minSelect}-${maxSelect} options`;
            } else if (minSelect !== null) {
                limitHelper = `Select at least ${minSelect}`;
            } else if (maxSelect !== null) {
                limitHelper = `Select up to ${maxSelect}`;
            }

            // Combine existing helper text with limit helper
            let fullHelper = helperText || '';
            if (limitHelper) {
                fullHelper = fullHelper ? `${fullHelper} (${limitHelper})` : limitHelper;
            }
            const helperHTML = fullHelper ? `<div class="helper-text">${fullHelper}</div>` : '';

            // Build data attributes for selection limits
            let dataAttrs = '';
            if (minSelect !== null) dataAttrs += ` data-min-select="${minSelect}"`;
            if (maxSelect !== null) dataAttrs += ` data-max-select="${maxSelect}"`;

            // Open the form-group div but don't close it (will be closed when group ends)
            return `<div class="form-group checkbox-group"${dataAttrs}><label>${parseInline(label)}${isReq ? '<span class="req-star">*</span>' : ''}</label>${helperHTML}`;
        }
    },

    // 12. Standard Lists - Item
    {
        name: 'List',
        regex: /^-\s(.*)/,
        render: (match) => `<li>${parseInline(match[1])}</li>`
    },

    // 13. Divider line
    {
        name: 'Divide',
        regex: /^-{3,}$/,
        render: (match) => `<p class="dividerline"></p>`
    },

    // 14. Link Line (Custom Syntax)
    {
        name: 'Link',
        // Matches: Text + space + <"url">
        regex: /^(.*)\s<"(.*)">$/,
        render: (match) => {
            const text = match[1];
            const url = match[2];
            // We add target="_blank" so clicking doesn't close your form
            return `<p><a href="${url}" target="_blank" class="form-link">${parseInline(text)}</a></p>`;
        }
    },

    // 999. Plain Text (Fallback - keep this last)
    {
        name: 'Text',
        regex: /(.*)/,
        render: (match) => `<p>${parseInline(match[0])}</p>`
    }
];