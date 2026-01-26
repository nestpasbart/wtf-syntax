# WTF Script Reference Guide

A complete reference for WTF Script - a markdown-based DSL for creating HTML forms.

---

## Table of Contents

1. [Document Structure](#1-document-structure)
2. [Text Input Fields](#2-text-input-fields)
3. [Selection Fields](#3-selection-fields)
4. [Choice Groups](#4-choice-groups)
5. [Long Text & Scale](#5-long-text--scale)
6. [Multi-Step Forms](#6-multi-step-forms)
7. [Text Formatting](#7-text-formatting)
8. [Validation](#8-validation)

---

## 1. Document Structure

### Frontmatter (Optional)

Add metadata at the top of your document using YAML-style frontmatter:

```
---
title: My Form Title
description: A brief description
---
```

### Headers

Use markdown-style headers for section titles:

```
# Main Title
## Section Title
### Subsection
```

### Divider Line

Create a horizontal divider with three or more dashes:

```
---
```

### Links

Add clickable links that open in a new tab:

```
Read our Privacy Policy <"https://example.com/privacy">
```

---

## 2. Text Input Fields

### Basic Text Input

```
Label: [placeholder text]
```

**Example:**
```
Name: [Enter your full name]
```

### Required Fields

Add an asterisk (`*`) after the label to make a field required:

```
Email*: [you@example.com]
```

### Smart Type Detection

The parser automatically detects input types based on placeholder or label:

| Placeholder/Label Contains | Input Type |
|---------------------------|------------|
| `@` symbol | email |
| `***` | password |
| `date` | date |
| `phone` or `tel` | tel |
| `http` or `url` or `website` | url |

**Examples:**
```
Email*: [you@example.com]          → type="email"
Password*: [***]                   → type="password"
Birthday: [date]                   → type="date"
Phone: [Your phone number]         → type="tel"
Website: [https://...]             → type="url"
```

### Helper Text

Add helper text in quotes after the field:

```
Username*: [Choose a username] "Must be 3-20 characters"
```

---

## 3. Selection Fields

### Dropdown Select

Use curly braces for dropdown options:

```
Country: {USA, Canada, Mexico}
```

### Pre-selected Option

Mark the default option with an asterisk:

```
Department: {Sales, *Support, Engineering}
```

### Required Dropdown

```
Priority*: {Low, Medium, High}
```

### With Helper Text

```
Status: {Active, Inactive} "Choose your current status"
```

---

## 4. Choice Groups

### Checkboxes

Use `- [ ]` for unchecked and `- [x]` for pre-checked:

```
Interests:
- [ ] Technology
- [ ] Design
- [x] Marketing
- [ ] Finance
```

### Radio Buttons

Use `- ( )` for unselected and `- (x)` for pre-selected:

```
Gender*:
- ( ) Male
- ( ) Female
- (x) Prefer not to say
```

### "Other" Option with Text Input

Add a free-text option for checkboxes or radios:

**Checkbox with Other:**
```
How did you hear about us:
- [ ] Google
- [ ] Social Media
- [?] Other [Please specify]
```

**Radio with Other:**
```
Preferred Contact:
- ( ) Email
- ( ) Phone
- (?) Other [Enter your preference]
```

### Selection Limits

Set minimum and maximum selection counts for checkbox groups:

```
Skills: (min:2, max:5)
- [ ] JavaScript
- [ ] Python
- [ ] Go
- [ ] Rust
- [ ] Java
- [ ] C++
```

**Options:**
- `(min:N)` - Require at least N selections
- `(max:N)` - Allow at most N selections
- `(min:N, max:M)` - Require between N and M selections

### Custom Helper Text for Groups

```
Toppings: (max:3) "Select up to 3 toppings"
- [ ] Pepperoni
- [ ] Mushrooms
- [ ] Onions
- [ ] Peppers
```

---

## 5. Long Text & Scale

### Textarea (Multi-line Text)

Use double brackets for textarea fields:

```
Comments: [[Enter your comments here]]
```

**Required with Helper:**
```
Bio*: [[Tell us about yourself]] "Maximum 500 characters"
```

### Scale / Rating (Likert)

Create rating scales with the pipe syntax:

```
Satisfaction*: |1-5| Very Dissatisfied | Neutral | Very Satisfied
```

**Syntax:** `Label: |min-max| Start Label | Middle Label | End Label`

**Examples:**

**1-10 Scale:**
```
Rating: |1-10| Poor | Average | Excellent
```

**0-5 Scale (two labels):**
```
Likelihood: |0-5| Not Likely | Very Likely
```

**NPS Style:**
```
Recommendation*: |0-10| Not at all likely | Extremely likely "How likely are you to recommend us?"
```

---

## 6. Multi-Step Forms

### Defining Steps

Use triple equals to define form steps:

```
=== Step 1: Personal Info ===

Name*: [Your name]
Email*: [you@example.com]

=== Step 2: Preferences ===

Department: {Sales, Support, Engineering}

=== Step 3: Confirm ===

- [x] I agree to the terms
```

### Features

- **Progress Bar** - Visual indicator showing completion progress
- **Navigation** - Previous/Next buttons with chevrons (‹ ›)
- **Per-step Validation** - Required fields validated before proceeding
- **Submit on Last Step** - Final step shows Submit button

---

## 7. Text Formatting

### Inline Formatting

Format text within labels and content:

| Syntax | Result |
|--------|--------|
| `**bold**` | **bold** |
| `__italic__` | _italic_ |
| `~~strikethrough~~` | ~~strikethrough~~ |

**Example:**
```
**Important**: Please fill out all required fields.
```

### Plain Text / Paragraphs

Any line that doesn't match a specific pattern becomes a paragraph:

```
Welcome to our survey!

Please answer the following questions honestly.
```

### Submit Button

Create a custom submit button:

```
[Submit My Response]
```

---

## 8. Validation

### Built-in Validators

Add validation rules with the tilde (`~`) syntax:

```
Password*: [***] ~min:8 ~max:32
```

### Available Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `~min:N` | Minimum N characters | `~min:8` |
| `~max:N` | Maximum N characters | `~max:100` |
| `~match:fieldname` | Must match another field | `~match:password` |
| `~phone` | Valid phone number format | `~phone` |

### Custom Error Messages

Add custom error messages with pipe syntax:

```
Password*: [***] ~min:8|"Password must be at least 8 characters"
```

### Combining Validators

```
Username*: [username] ~min:3 ~max:20|"Username must be 3-20 characters"
```

### Automatic Validation

These are validated automatically based on input type:

- **Required fields** - Shows "This field is required"
- **Email fields** - Shows "Enter a valid email"
- **URL fields** - Shows "Enter a valid URL"

---

## Quick Reference Card

### Input Types

| Syntax | Output |
|--------|--------|
| `Label: [placeholder]` | Text input |
| `Label*: [placeholder]` | Required text input |
| `Label: [[placeholder]]` | Textarea |
| `Label: {A, B, C}` | Dropdown select |
| `Label: {A, *B, C}` | Dropdown with B selected |
| `Label: \|1-5\| Low \| High` | Rating scale |

### Choice Groups

| Syntax | Output |
|--------|--------|
| `- [ ] Option` | Unchecked checkbox |
| `- [x] Option` | Checked checkbox |
| `- [?] Other [placeholder]` | Checkbox with text input |
| `- ( ) Option` | Unselected radio |
| `- (x) Option` | Selected radio |
| `- (?) Other [placeholder]` | Radio with text input |

### Structure

| Syntax | Output |
|--------|--------|
| `# Title` | H1 heading |
| `## Title` | H2 heading |
| `---` | Horizontal divider |
| `=== Step Title ===` | Multi-step separator |
| `[Button Text]` | Submit button |
| `Text <"url">` | Link (opens in new tab) |

### Validation

| Syntax | Output |
|--------|--------|
| `~min:N` | Minimum length |
| `~max:N` | Maximum length |
| `~match:field` | Match another field |
| `~phone` | Phone number format |
| `~rule\|"message"` | Custom error message |

---

## Complete Example

```
---
title: Job Application
---

# Apply for a Position

=== Step 1: Personal Information ===

**Please provide your contact details.**

Full Name*: [John Doe]
Email*: [you@example.com]
Phone: [Your phone number]

=== Step 2: Experience ===

Position*: {Junior Developer, Senior Developer, Lead Developer}

Years of Experience: |0-10| None | 5 years | 10+ years

Skills: (min:1, max:5) "Select 1-5 skills"
- [ ] JavaScript
- [ ] Python
- [ ] Java
- [ ] Go
- [?] Other [Specify skill]

=== Step 3: Additional Info ===

Cover Letter*: [[Tell us why you're a great fit...]]

How did you hear about us:
- ( ) LinkedIn
- ( ) Job Board
- ( ) Referral
- (?) Other [Please specify]

- [x] I agree to the privacy policy

[Submit Application]
```

---

*WTF Script - What The Form Script*
*Version 1.0*
