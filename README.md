# Botok-JS

JavaScript/TypeScript port of [Botok](https://github.com/OpenPecha/Botok) - A Tibetan text tokenizer designed for both browser extensions and Node.js applications.

## Features

- **Accurate Tibetan tokenization** with syllable-based segmentation
- **Dual environment support**: Browser extensions and Node.js CLI
- **Part-of-speech tagging** and lemmatization
- **Custom dialect support** for different Tibetan text varieties
- **TypeScript support** with full type definitions
- **Zero dependencies** for browser usage
- **Comprehensive testing** with test coverage

## Installation

### NPM Package

```bash
npm install botok-js
```

### Browser CDN

```html
<script src="https://unpkg.com/botok-js@latest/dist/index.browser.js"></script>
```

## Usage

### Node.js

```javascript
import { WordTokenizer, Config } from 'botok-js';

// Initialize tokenizer
const config = new Config();
const tokenizer = new WordTokenizer(config);

// Tokenize Tibetan text
const text = "བཀྲ་ཤིས་བདེ་ལེགས་ཞུས་རྒྱུ་ཡིན་ སེམས་པ་སྐྱིད་པོ་འདུག།";
const tokens = await tokenizer.tokenize(text);

// Print results
tokens.forEach(token => {
  console.log(`${token.text} (${token.pos || 'unknown'})`);
});
```

### Browser Extension

```javascript
// Background script or content script
import { WordTokenizer } from 'botok-js';

const tokenizer = new WordTokenizer();

// Process selected text
async function processSelectedText() {
  const selection = window.getSelection()?.toString();
  if (selection) {
    const tokens = await tokenizer.tokenize(selection);
    return tokens;
  }
}
```

### CLI Usage

```bash
# Install globally
npm install -g botok-js

# Tokenize text directly
botok-js "བཀྲ་ཤིས་བདེ་ལེགས།"

# Process file
botok-js -f input.txt -o output.json

# Use custom dialect
botok-js -d kangyur "སངས་རྒྱས་ཀྱི་མཛད་པ།"
```

## API Reference

### WordTokenizer

Main tokenizer class for processing Tibetan text.

```typescript
class WordTokenizer {
  constructor(config?: Config);
  tokenize(text: string, options?: TokenizeOptions): Promise<Token[]>;
}
```

### Token

Represents a tokenized unit with metadata.

```typescript
interface Token {
  text: string;           // Original text
  textCleaned?: string;   // Normalized text
  textUnaffixed?: string; // Root form
  pos?: string;           // Part of speech
  lemma?: string;         // Dictionary form
  start: number;          // Start position
  length: number;         // Token length
  syllables?: string[];   // Syllable breakdown
  chunkType: string;      // Token type (TEXT, PUNCT, etc.)
}
```

### Config

Configuration for tokenization behavior.

```typescript
class Config {
  constructor(dialectName?: string, basePath?: string);
  static fromPath(dialectPackPath: string): Config;
}
```

## Advanced Usage

### Custom Dialect Packs

```javascript
import { Config, WordTokenizer } from 'botok-js';

// Load custom dialect
const config = Config.fromPath('./my-dialect-pack/');
const tokenizer = new WordTokenizer(config);

const tokens = await tokenizer.tokenize('custom text');
```

### Browser Extension Integration

```javascript
// manifest.json
{
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["botok-js.bundle.js", "content.js"]
  }]
}

// content.js
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'tokenize') {
    const tokenizer = new BotokJS.WordTokenizer();
    const tokens = await tokenizer.tokenize(request.text);
    sendResponse({ tokens });
  }
});
```

## Development

### Setup

```bash
git clone https://github.com/yourusername/botok-js.git
cd botok-js
npm install
```

### Build

```bash
npm run build          # Build all versions
npm run build:watch    # Watch mode
npm run typecheck      # Type checking
npm run lint           # Linting
```

### Testing

```bash
npm test               # Run tests
npm run test:watch     # Watch mode
```

## Differences from Python Botok

While maintaining API compatibility where possible, this JavaScript port includes:

- **Async/Promise-based API** for resource loading
- **Browser-optimized bundles** with smaller footprint
- **Modular architecture** for tree-shaking
- **TypeScript definitions** for better developer experience
- **Web Worker support** for non-blocking tokenization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see [LICENSE](LICENSE) file for details.

### Attribution

This software is a JavaScript port of [Botok](https://github.com/OpenPecha/Botok), originally developed by OpenPecha:

```
Copyright (c) OpenPecha development team

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### Development Dependencies

The development dependencies used by this project are all under permissive licenses compatible with Apache-2.0:

- **TypeScript**: Apache-2.0
- **Jest**: MIT  
- **ESLint**: MIT
- **Rollup plugins**: MIT
- Other development tools: MIT/ISC licenses

Note: Development dependencies are not included in the distributed package and only affect the build/test process.

## Acknowledgments

- Original [Botok](https://github.com/OpenPecha/Botok) by OpenPecha
- Tibetan linguistic resources from various academic sources
- Community contributors and testers

## Related Projects

- [Botok](https://github.com/OpenPecha/Botok) - Original Python version
- [Tibetan NLP Tools](https://github.com/OpenPecha) - OpenPecha's toolkit