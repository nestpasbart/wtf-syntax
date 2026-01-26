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

    // 3. Checkboxes - [ ] Label
    {
        name: 'Checkbox',
        regex: /^-\s\[(x|\s)\]\s(.*)/,
        render: (match, context) => {
            const checked = match[1] === 'x' ? 'checked' : '';
            const label = match[2];
            // Uses the last group label seen (context.group) or a slug of the label
            const name = context.group ? context.group.slug + '[]' : slugify(label);

            return `
            <div class="check-item">
                <input type="checkbox" name="${name}" ${checked}>
                <label>${parseInline(label)}</label>
            </div>`;
        }
    },

    // 4. Radio Buttons - ( ) Label
    {
        name: 'Radio',
        regex: /^-\s\((x|\s)\)\s(.*)/,
        render: (match, context) => {
            const checked = match[1] === 'x' ? 'checked' : '';
            const label = match[2];
            // Radios need a group name to work (toggling). Defaults to 'radio_group' if no header found.
            const name = context.group ? context.group.slug : 'radio_group';
            const req = (context.group && context.group.required) ? 'required' : '';

            return `
            <div class="radio-item">
                <input type="radio" name="${name}" value="${label}" ${checked} ${req}>
                <label>${parseInline(label)}</label>
            </div>`;
        }
    },

    // 5. Select Dropdowns - Label: {Opt1, Opt2}
    {
        name: 'Select',
        regex: /(.*):\s\{(.*)\}/,
        render: (match, context) => {
            let rawLabel = match[1];
            const optionsString = match[2];

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

            const helperHTML = helperText ? `<div class="helper-text">${helperText}</div>` : '';

            return `
            <div class="form-group">
                <label>${parseInline(label)}${isReq ? '<span class="req-star">*</span>' : ''}</label>
                ${helperHTML}
                <select name="${name}" ${isReq ? 'required' : ''}>${optionsHTML}</select>
            </div>`;
        }
    },

    // 6. Text Inputs with Validation - Label: [Placeholder] ~min:8|"Custom msg"
    {
        name: 'Input',
        regex: /(.*):\s\[(.*?)\](.*)$/,
        render: (match, context) => {
            const rawLabel = match[1];
            const placeholder = match[2];
            const validatorString = match[3]?.trim() || '';

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
            if (validatorString) {
                const validators = [];
                const validatorRegex = /~(\w+)(?::([^|~\s]+))?(?:\|"([^"]+)")?/g;
                let vMatch;
                while ((vMatch = validatorRegex.exec(validatorString)) !== null) {
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

            return `
            <div class="form-group">
                <label for="${name}">${parseInline(label)}${isReq ? '<span class="req-star">*</span>' : ''}</label>
                <input type="${type}" name="${name}" id="${name}"${placeholderAttr}${isReq ? ' required' : ''}${dataValidate}>
            </div>`;
        }
    },

    // 7. Group Headers - Label: (Used for grouping radios)
    {
        name: 'GroupHeader',
        regex: /(.*):$/, // Matches "Gender:" or "Pick One:"
        render: (match, context) => {
            let rawLabel = match[1];

            // Extract helper text BEFORE inline parsing (to avoid **bold** interference)
            const { text, helperText } = extractHelperText(rawLabel);

            const { label, isReq } = parseLabel(text);
            if(isReq) context.hasRequired = true;

            // Generate unique name for this group (handles duplicate question labels)
            const baseSlug = slugify(label);
            const uniqueSlug = getUniqueName(baseSlug, context);

            // Set Context for next items (Radios/Checkboxes)
            context.group = { slug: uniqueSlug, required: isReq };
            context.groupOpen = true; // Mark that we have an open group div

            const helperHTML = helperText ? `<div class="helper-text">${helperText}</div>` : '';

            // Open the form-group div but don't close it (will be closed when group ends)
            return `<div class="form-group"><label>${parseInline(label)}${isReq ? '<span class="req-star">*</span>' : ''}</label>${helperHTML}`;
        }
    },

    // 8. Standard Lists - Item
    {
        name: 'List',
        regex: /^-\s(.*)/,
        render: (match) => `<li>${parseInline(match[1])}</li>`
    },

    // 9. Divider line
    {
        name: 'Divide',
        regex: /^-{3,}$/,
        render: (match) => `<p class="dividerline"></p>`
    },

    // 10. Link Line (Custom Syntax)
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