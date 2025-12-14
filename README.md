# WTF Script

> A markdown-like syntax for building beautiful forms

WTF Script makes form creation as simple as typing a question. No HTML, no complex form builders—just natural language transformed into functional, beautiful forms.

## Installation

```bash
npm install @whattheform/syntax
```

## Usage

```javascript
const WTFScriptEngine = require('@whattheform/syntax');
const engine = new WTFScriptEngine(rules);

const wtfScript = `
What's your name?*
text

How old are you?
number
`;

const html = engine.parse(wtfScript);
```

## Features

- 📝 **Markdown-like syntax** - Write forms like you're having a conversation
- ⚡ **Lightning fast** - Instant parsing and rendering
- ✨ **Smart transformations** - Text becomes radio buttons, checkboxes, or dropdowns
- 🎨 **Beautiful by default** - Professional styling out of the box
- ✅ **Built-in validation** - Required fields with simple asterisk syntax

## Documentation

Visit [whattheform.app](https://whattheform.app) for full documentation.

## License

MIT © What The Form
