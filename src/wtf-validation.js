// wtf-validation.js

(function() {

    // Default messages
    const defaultMessages = {
        min: (param) => `Must be at least ${param} characters`,
        max: (param) => `Must be no more than ${param} characters`,
        match: () => `Fields must match`,
        phone: () => `Enter a valid phone number`,
        required: () => `This field is required`,
        email: () => `Enter a valid email`,
        url: () => `Enter a valid URL`,
        minSelect: (param) => `Select at least ${param} option${param > 1 ? 's' : ''}`,
        maxSelect: (param) => `Select at most ${param} option${param > 1 ? 's' : ''}`
    };

    // Validator functions (return true if valid)
    const validators = {
        min: (value, param) => value.length >= parseInt(param),
        max: (value, param) => value.length <= parseInt(param),
        match: (value, param, form) => {
            const otherField = form.querySelector(`[name="${param}"]`);
            return otherField && value === otherField.value;
        },
        phone: (value) => {
            const digits = value.replace(/\D/g, '');
            return digits.length >= 10 && digits.length <= 15;
        }
    };

    // Parse "min:8|Custom message" format
    function parseRule(rule) {
        const msgMatch = rule.match(/^([^|]+)\|(.+)$/);
        if (msgMatch) {
            const [, rulePart, message] = msgMatch;
            const [name, param] = rulePart.split(':');
            return { name, param, message };
        }
        const [name, param] = rule.split(':');
        return { name, param, message: null };
    }

    // Get validators from field's data attribute
    function getValidators(field) {
        const rules = field.dataset.validate;
        if (!rules) return [];

        return rules.split(';').map(parseRule);
    }

    // Validate a single field
    function validateField(field, form) {
        const value = field.value;
        const errors = [];

        // Check HTML5 validity first (email, url, required)
        if (!field.validity.valid) {
            if (field.validity.valueMissing) {
                errors.push(defaultMessages.required());
            } else if (field.validity.typeMismatch) {
                if (field.type === 'email') errors.push(defaultMessages.email());
                if (field.type === 'url') errors.push(defaultMessages.url());
            }
        }

        // Check custom validators (only if field has value or is required)
        if (value || field.required) {
            for (const { name, param, message } of getValidators(field)) {
                if (validators[name] && !validators[name](value, param, form)) {
                    errors.push(message || defaultMessages[name](param));
                }
            }
        }

        return errors;
    }

    // Show/hide error message
    function showError(field, errors) {
        const existing = field.parentNode.querySelector('.wtf-error');
        if (existing) existing.remove();

        field.classList.toggle('wtf-invalid', errors.length > 0);

        if (errors.length > 0) {
            const errorEl = document.createElement('div');
            errorEl.className = 'wtf-error';
            errorEl.textContent = errors[0];
            field.parentNode.appendChild(errorEl);
        }
    }

    // Show/hide error on a checkbox group container
    function showGroupError(group, error) {
        const existing = group.querySelector('.wtf-error');
        if (existing) existing.remove();

        group.classList.toggle('wtf-invalid', !!error);

        if (error) {
            const errorEl = document.createElement('div');
            errorEl.className = 'wtf-error';
            errorEl.textContent = error;
            group.appendChild(errorEl);
        }
    }

    // Validate checkbox group selection limits
    function validateCheckboxGroup(group) {
        const minSelect = group.dataset.minSelect ? parseInt(group.dataset.minSelect) : null;
        const maxSelect = group.dataset.maxSelect ? parseInt(group.dataset.maxSelect) : null;

        if (minSelect === null && maxSelect === null) return null;

        const checkboxes = group.querySelectorAll('input[type="checkbox"]');
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

        if (minSelect !== null && checkedCount < minSelect) {
            return defaultMessages.minSelect(minSelect);
        }
        if (maxSelect !== null && checkedCount > maxSelect) {
            return defaultMessages.maxSelect(maxSelect);
        }
        return null;
    }

    // Initialize validation on a form
    function initValidation(form) {
        // Prevent double-initialization
        if (form.dataset.wtfValidation === 'initialized') {
            return;
        }
        form.dataset.wtfValidation = 'initialized';

        const fields = form.querySelectorAll('input, select, textarea');

        fields.forEach(field => {
            field.addEventListener('blur', () => {
                const errors = validateField(field, form);
                showError(field, errors);
            });

            field.addEventListener('focus', () => {
                field.classList.remove('wtf-invalid');
                const existing = field.parentNode.querySelector('.wtf-error');
                if (existing) existing.remove();
            });
        });

        // Add live validation for checkbox groups
        const checkboxGroups = form.querySelectorAll('.checkbox-group[data-min-select], .checkbox-group[data-max-select]');
        checkboxGroups.forEach(group => {
            const checkboxes = group.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    const error = validateCheckboxGroup(group);
                    showGroupError(group, error);
                });
            });
        });

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();

            let hasErrors = false;

            // Query fields fresh at submit time
            const currentFields = this.querySelectorAll('input, select, textarea');

            currentFields.forEach(field => {
                const errors = validateField(field, this);
                showError(field, errors);
                if (errors.length > 0) hasErrors = true;
            });

            // Validate checkbox groups with selection limits
            const groups = this.querySelectorAll('.checkbox-group[data-min-select], .checkbox-group[data-max-select]');
            groups.forEach(group => {
                const error = validateCheckboxGroup(group);
                showGroupError(group, error);
                if (error) hasErrors = true;
            });

            if (hasErrors) {
                const firstInvalid = this.querySelector('.wtf-invalid');
                if (firstInvalid) firstInvalid.focus();
            } else {
                // Dispatch custom event for successful validation
                this.dispatchEvent(new CustomEvent('wtf:validated', { bubbles: true }));
            }
        });

        form.setAttribute('novalidate', 'true');
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('form').forEach(initValidation);
    });

    window.WTFValidation = { init: initValidation, validateField };

})();
